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
}

function buildSystemPrompt(tpoKo: string, tpoEn: string, intent: string): string {
  const rubric = CATEGORY_DEFS.map((c) => `- ${c.key} (max ${c.max}): ${c.labelKo} / ${c.labelEn}`).join('\n');
  const intentNote =
    intent === 'experimental'
      ? '이 사용자는 "실험적(아방가르드)" 의도를 선언했다. 과감한 오버사이즈나 믹스매치를 감점 요인이 아니라 창의성으로 존중해서 관대하게 채점하라.'
      : '이 사용자는 "클래식" 의도를 선언했다. 기본기(색상 조화, 핏, TPO 적합도)를 기준으로 꼼꼼하게 채점하라.';

  return `You are a professional fashion stylist judging an outfit photo for the K-FitJudge app.
The occasion (TPO) is "${tpoKo}" (${tpoEn}).
${intentNote}

Score the outfit in the photo against exactly these 8 categories. Each category's score must be an integer between 0 and its max:
${rubric}

For each category, also write one short, concrete, natural-sounding note (1 sentence) explaining the score — both in Korean (noteKo) and English (noteEn). If the score is high, the note should read as a compliment; if low, it should read as a specific, actionable suggestion.

Respond with ONLY a single JSON object, no markdown fences, no extra text, in exactly this shape:
{"categories":{"color":{"score":0,"noteKo":"...","noteEn":"..."},"topBottom":{"score":0,"noteKo":"...","noteEn":"..."},"fit":{"score":0,"noteKo":"...","noteEn":"..."},"shoes":{"score":0,"noteKo":"...","noteEn":"..."},"accessory":{"score":0,"noteKo":"...","noteEn":"..."},"tpoFit":{"score":0,"noteKo":"...","noteEn":"..."},"personalColor":{"score":0,"noteKo":"...","noteEn":"..."},"hair":{"score":0,"noteKo":"...","noteEn":"..."}}}`;
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
      | { score?: unknown; noteKo?: unknown; noteEn?: unknown }
      | undefined;
    const rawScore = Number(entry?.score);
    const score = Number.isFinite(rawScore) ? Math.min(def.max, Math.max(1, Math.round(rawScore))) : Math.round(def.max * 0.75);
    result[def.key] = {
      score,
      noteKo: typeof entry?.noteKo === 'string' ? entry.noteKo.slice(0, 200) : '',
      noteEn: typeof entry?.noteEn === 'string' ? entry.noteEn.slice(0, 200) : '',
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
