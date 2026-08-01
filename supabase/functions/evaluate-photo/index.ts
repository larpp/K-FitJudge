import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { requireUser } from '../_shared/authUser.ts';
import { callHfVisionChat } from '../_shared/hf.ts';
import { CATEGORY_DEFS, TPO_LABELS } from '../_shared/scoring.ts';

const FREE_MONTHLY_LIMIT = 3;
// 무료는 소형, Pro는 최상위 모델을 쓴다. 둘 다 Apache-2.0 오픈소스(Qwen3-VL)라
// 상업적 이용에 제약이 없다.
const FREE_MODEL = 'Qwen/Qwen3-VL-8B-Instruct';
const PRO_MODEL = 'Qwen/Qwen3-VL-235B-A22B-Instruct';

const VALID_TPO = new Set(Object.keys(TPO_LABELS));

interface AiCategory {
  score: number;
  noteKo: string;
  noteEn: string;
  editEn: string | null;
}

// 이미지 편집 지시를 만들 수 있는(= 실제로 "입고 있는 것"에 해당하는) 카테고리.
// 헤어/퍼스널컬러는 옷이 아니라 사람 자체라서 편집 지시를 만들지 않는다.
const GARMENT_CATEGORY_KEYS = new Set(['color', 'topBottom', 'fit', 'shoes', 'accessory', 'tpoFit']);

function buildSystemPrompt(tpoKo: string, tpoEn: string, intent: string): string {
  const rubric = CATEGORY_DEFS.map(
    (c) =>
      `- ${c.key} (0-${c.max}): ${c.labelEn} (${c.labelKo})${
        GARMENT_CATEGORY_KEYS.has(c.key) ? '' : ' — grooming, not clothing: always set editEn to null'
      }`,
  ).join('\n');

  const intentNote =
    intent === 'experimental'
      ? 'The wearer has declared an EXPERIMENTAL (avant-garde) intent. Deliberate oversizing, clashing prints, and unconventional proportions are creative choices, not mistakes — judge whether the risk pays off, and only mark down what genuinely reads as accidental or unresolved.'
      : 'The wearer has declared a CLASSIC intent. Judge against the fundamentals — color harmony, proportion, fit, and appropriateness for the occasion — and hold a high standard.';

  return `You are a senior fashion stylist and image consultant with 15 years of editorial and personal-styling experience. You are judging one outfit photo for the K-FitJudge app.

The occasion (TPO) is "${tpoEn}" (${tpoKo}).
${intentNote}

STEP 1 — OBSERVE. Before scoring, identify what the person is actually wearing. Name each garment with its concrete color, material, and silhouette (e.g. "cream oversized cotton oxford shirt", "washed indigo straight-leg denim", "white leather low-top sneakers"). If a slot is empty or not visible in the photo, write "none". Never invent a garment you cannot see.

STEP 2 — SCORE these 8 categories. Each score is an integer from 0 to its max:
${rubric}

Scoring calibration — use the full range, do not cluster everything near the top:
- 90-100% of max: genuinely excellent; a stylist would photograph this as-is.
- 75-89%: solid and well-executed, with one refinement available.
- 55-74%: works but has a clear, nameable weakness.
- 30-54%: actively undermines the look.
- Below 30%: wrong for the occasion or visually broken.
Judge each category independently. A great outfit can still have weak shoes; do not let one strong category inflate the others.

STEP 3 — WRITE FEEDBACK. For every category, write one note in Korean (noteKo) and the same note in English (noteEn). Each note must contain all three of these, in this order, as one flowing sentence or two short ones:
  (a) the specific thing you observed, named concretely — not "the colors are off" but "the bright white sneakers";
  (b) why it works or does not work FOR THIS OCCASION and this outfit's overall tone;
  (c) if the score is below 90% of max, exactly what to change instead — name the replacement color, material, length, or styling move.
Write like a stylist talking to a client: warm, direct, specific. Never vague ("looks good", "could be better"), never a bare diagnosis without a remedy, never a generic rule with no reference to this photo. The Korean note must read as natural Korean, not a translation.

STEP 4 — WRITE EDIT INSTRUCTIONS. For each of the six clothing categories, also produce "editEn": a single imperative instruction for a photo-editing AI that will apply your advice to the actual photograph.
Rules for editEn — these matter more than anything else in this task:
- State the DIRECTION of the change explicitly and unambiguously. The editor cannot infer intent from a complaint. "The sneakers are too bright" is FORBIDDEN — it may make them brighter. Write "Replace the bright white sneakers with dark brown leather derby shoes" instead.
- Always name the CURRENT item and the TARGET item: "Replace X with Y", "Change the X from A to B", "Remove the X".
- Be concrete about the target: exact color ("charcoal grey", "camel"), material ("wool", "suede"), and silhouette where relevant. Never "a better color" or "something more suitable".
- Describe only clothing, footwear, and accessories. Never mention the face, hair, skin, body, pose, or background — those must not change.
- If this category needs no change (score is 90% or more of max), set editEn to null.
- editEn must be consistent with noteEn: the same change, phrased as a command.

Respond with ONLY a single JSON object, no markdown fences, no commentary before or after, in exactly this shape:
{"observed":{"top":"...","bottom":"...","outerwear":"...","shoes":"...","accessories":"..."},"categories":{"color":{"score":0,"noteKo":"...","noteEn":"...","editEn":"..."},"topBottom":{"score":0,"noteKo":"...","noteEn":"...","editEn":"..."},"fit":{"score":0,"noteKo":"...","noteEn":"...","editEn":"..."},"shoes":{"score":0,"noteKo":"...","noteEn":"...","editEn":"..."},"accessory":{"score":0,"noteKo":"...","noteEn":"...","editEn":"..."},"tpoFit":{"score":0,"noteKo":"...","noteEn":"...","editEn":"..."},"personalColor":{"score":0,"noteKo":"...","noteEn":"...","editEn":null},"hair":{"score":0,"noteKo":"...","noteEn":"...","editEn":null}}}`;
}

function parseAiCategories(raw: string): Record<string, AiCategory> {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) throw new Error('AI_PARSE_ERROR');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new Error('AI_PARSE_ERROR');
  }

  const categories = (parsed as { categories?: unknown })?.categories;
  if (!categories || typeof categories !== 'object') throw new Error('AI_PARSE_ERROR');

  const result: Record<string, AiCategory> = {};
  for (const def of CATEGORY_DEFS) {
    const entry = (categories as Record<string, unknown>)[def.key] as
      | { score?: unknown; noteKo?: unknown; noteEn?: unknown; editEn?: unknown }
      | undefined;
    const rawScore = Number(entry?.score);
    const score = Number.isFinite(rawScore) ? Math.min(def.max, Math.max(1, Math.round(rawScore))) : Math.round(def.max * 0.75);
    // 옷 카테고리에 대해서만 편집 지시를 인정한다. 헤어/퍼스널컬러에 지시가 딸려와도
    // 이미지 모델이 얼굴·머리를 건드리게 되므로 버린다.
    const rawEdit = entry?.editEn;
    const editEn =
      GARMENT_CATEGORY_KEYS.has(def.key) && typeof rawEdit === 'string' && rawEdit.trim()
        ? rawEdit.trim().slice(0, 300)
        : null;
    result[def.key] = {
      score,
      noteKo: typeof entry?.noteKo === 'string' ? entry.noteKo.slice(0, 300) : '',
      noteEn: typeof entry?.noteEn === 'string' ? entry.noteEn.slice(0, 300) : '',
      editEn,
    };
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await requireUser(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => null);
  const { tpo, intent, imageDataUrl, photoPath, sample, mockResult } = body ?? {};

  if (
    typeof tpo !== 'string' ||
    !VALID_TPO.has(tpo) ||
    (intent !== 'classic' && intent !== 'experimental')
  ) {
    return jsonResponse({ error: 'INVALID_PAYLOAD' }, 400);
  }

  // "샘플 사진"은 실제 옷차림 사진이 아니라 데모용 일러스트라 AI 채점 대상이 될 수 없다.
  // 이 경우 클라이언트가 미리 계산한 데모 점수를 그대로 저장만 한다(AI 호출 없음).
  if (sample === true) {
    if (
      !mockResult ||
      typeof mockResult.overall !== 'number' ||
      !Array.isArray(mockResult.categories) ||
      !Array.isArray(mockResult.strengths) ||
      !Array.isArray(mockResult.improvements)
    ) {
      return jsonResponse({ error: 'INVALID_PAYLOAD' }, 400);
    }
  } else if (
    typeof imageDataUrl !== 'string' ||
    !imageDataUrl.startsWith('data:image/') ||
    imageDataUrl.length > 8_000_000
  ) {
    return jsonResponse({ error: 'INVALID_PAYLOAD' }, 400);
  }

  // 업로드된 사진 경로가 본인 폴더("{uid}/...") 소속일 때만 인정한다.
  const safePhotoPath =
    typeof photoPath === 'string' && photoPath.startsWith(`${user.id}/`) ? photoPath : null;

  const { data: profile } = await supabaseAdmin.from('profiles').select('plan').eq('id', user.id).maybeSingle();
  const plan = profile?.plan === 'pro' ? 'pro' : 'free';

  // 무료 플랜은 이번 달 평가 횟수를 서버에서 직접 세서 제한한다. AI 호출 전에 먼저 검사해서
  // 한도를 넘긴 요청이 불필요하게 모델 비용을 쓰지 않게 한다.
  if (plan === 'free') {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { count, error: countError } = await supabaseAdmin
      .from('evaluations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    if (countError) return jsonResponse({ error: countError.message }, 500);
    if ((count ?? 0) >= FREE_MONTHLY_LIMIT) {
      return jsonResponse({ error: 'LIMIT_REACHED' }, 403);
    }
  }

  let overall: number;
  let categories: unknown[];
  let strengths: unknown[];
  let improvements: unknown[];

  if (sample === true) {
    overall = mockResult.overall;
    categories = mockResult.categories;
    strengths = mockResult.strengths;
    improvements = mockResult.improvements;
  } else {
    const tpoLabel = TPO_LABELS[tpo];
    const model = plan === 'pro' ? PRO_MODEL : FREE_MODEL;

    let aiCategories: Record<string, AiCategory>;
    try {
      const raw = await callHfVisionChat({
        model,
        systemPrompt: buildSystemPrompt(tpoLabel.ko, tpoLabel.en, intent),
        userText: 'Judge this outfit photo and respond with the JSON object described above.',
        imageDataUrl,
      });
      aiCategories = parseAiCategories(raw);
    } catch (err) {
      const code = err instanceof Error ? err.message : 'AI_PROVIDER_ERROR';
      return jsonResponse({ error: code }, 502);
    }

    const scoredCategories = CATEGORY_DEFS.map((def) => ({
      key: def.key,
      icon: def.icon,
      labelKo: def.labelKo,
      labelEn: def.labelEn,
      isBonus: def.isBonus,
      max: def.max,
      score: aiCategories[def.key].score,
    }));

    const ranked = [...scoredCategories]
      .map((c) => ({ c, note: aiCategories[c.key] }))
      .sort((a, b) => a.c.score / a.c.max - b.c.score / b.c.max);

    overall = scoredCategories.reduce((sum, c) => sum + c.score, 0);
    categories = scoredCategories;
    improvements = ranked
      .filter((r) => r.c.score / r.c.max < 0.92)
      .slice(0, 3)
      .map((r) => ({
        key: r.c.key,
        textKo: r.note.noteKo,
        textEn: r.note.noteEn,
        // 사용자에게 보여줄 문장(textEn)과 이미지 편집 모델에 넘길 명령문(editEn)은 역할이 다르다.
        // "신발이 너무 밝다" 같은 진단문을 그대로 편집 지시로 쓰면 방향을 반대로 해석할 수 있어서,
        // 모델에게 방향이 명시된 명령문을 따로 만들게 하고 그걸 저장한다.
        editEn: r.note.editEn,
        pointsGain: Math.min(6, Math.max(2, r.c.max - r.c.score)),
      }));
    strengths = [...ranked]
      .reverse()
      .slice(0, 2)
      .map((r) => ({ key: r.c.key, textKo: r.note.noteKo, textEn: r.note.noteEn }));
  }

  const { data, error } = await supabaseAdmin
    .from('evaluations')
    .insert({
      user_id: user.id,
      tpo,
      intent,
      overall_score: overall,
      categories,
      strengths,
      improvements,
      photo_path: safePhotoPath,
    })
    .select('id')
    .single();

  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({ ok: true, id: data.id, overall, categories, strengths, improvements });
});
