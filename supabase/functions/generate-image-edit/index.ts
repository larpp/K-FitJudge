import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { requireUser } from '../_shared/authUser.ts';
import { editImageWithFal } from '../_shared/fal.ts';

interface ImprovementRow {
  key?: string;
  textEn?: string;
  editEn?: string | null;
}

// 헤어스타일/퍼스널컬러 피드백까지 이미지 편집 지시에 넣으면 모델이 머리·얼굴 쪽을
// 건드려도 되는 걸로 오해하기 쉽다. 옷/신발/액세서리처럼 실제로 "입고 있는 것"에
// 해당하는 카테고리의 피드백만 이미지 생성 프롬프트에 반영한다.
const GARMENT_CATEGORY_KEYS = new Set(['color', 'topBottom', 'fit', 'shoes', 'accessory', 'tpoFit']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await requireUser(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => null);
  const evaluationId = body?.evaluationId;
  if (typeof evaluationId !== 'string' || !evaluationId) {
    return jsonResponse({ error: 'INVALID_PAYLOAD' }, 400);
  }

  const { data: profile } = await supabaseAdmin.from('profiles').select('plan').eq('id', user.id).maybeSingle();
  if (profile?.plan !== 'pro') return jsonResponse({ error: 'PRO_REQUIRED' }, 403);

  const { data: evaluation, error: fetchError } = await supabaseAdmin
    .from('evaluations')
    .select('id, photo_path, improvements')
    .eq('id', evaluationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError) return jsonResponse({ error: fetchError.message }, 500);
  if (!evaluation || !evaluation.photo_path) return jsonResponse({ error: 'NO_PHOTO' }, 400);

  const { data: signed, error: signError } = await supabaseAdmin.storage
    .from('evaluation-photos')
    .createSignedUrl(evaluation.photo_path, 300);
  if (signError || !signed) return jsonResponse({ error: 'PHOTO_UNAVAILABLE' }, 500);

  const improvements: ImprovementRow[] = Array.isArray(evaluation.improvements) ? evaluation.improvements : [];
  const instructions = improvements
    .filter((f) => !f.key || GARMENT_CATEGORY_KEYS.has(f.key))
    // editEn은 평가 모델이 만든 "방향이 명시된 명령문"이라 이미지 편집에 그대로 쓸 수 있다.
    // editEn이 없는 예전 평가 기록은 사용자용 진단문(textEn)으로 대체한다.
    .map((f) => f.editEn || f.textEn)
    .filter((text): text is string => Boolean(text))
    .slice(0, 3);

  const preserveClause =
    "Photorealistic garment-only retouch of this exact photograph. Treat it as swapping the clothing layer on the same photo: the person's face, facial features, skin tone, hairstyle, head, body proportions, and pose, the camera angle and framing, the lighting direction, and the entire background must remain pixel-identical to the input. Preserve the original photo's grain, depth of field, and exposure so the result reads as the same shot, not a regenerated image.";

  const directionClause =
    'Each instruction states the target explicitly — apply it in exactly the stated direction, and do not substitute your own interpretation. Any garment not named in the instructions stays exactly as it is.';

  const prompt =
    instructions.length > 0
      ? `${preserveClause} ${directionClause} Instructions: ${instructions
          .map((t, i) => `${i + 1}) ${t}`)
          .join(' ')} Make no other change of any kind.`
      : `${preserveClause} Subtly refine the outfit's color harmony and fit only, changing nothing else.`;

  const negativePrompt =
    'different face, changed facial features, different person, changed hairstyle, changed head, changed skin tone, changed background, changed scene, changed pose, changed body shape, changed camera angle, changed lighting, extra limbs, deformed hands, blurry, distorted, oversaturated, cartoon, illustration, watermark, text';

  let falImageUrl: string;
  try {
    falImageUrl = await editImageWithFal({ prompt, imageUrl: signed.signedUrl, negativePrompt });
  } catch (err) {
    const code = err instanceof Error ? err.message : 'AI_PROVIDER_ERROR';
    return jsonResponse({ error: code }, 502);
  }

  const imageRes = await fetch(falImageUrl);
  if (!imageRes.ok) return jsonResponse({ error: 'AI_PROVIDER_ERROR' }, 502);
  const imageBytes = new Uint8Array(await imageRes.arrayBuffer());
  const contentType = imageRes.headers.get('content-type') ?? 'image/jpeg';
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const editedPath = `${user.id}/edited-${evaluationId}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('evaluation-photos')
    .upload(editedPath, imageBytes, { contentType, upsert: true });
  if (uploadError) return jsonResponse({ error: uploadError.message }, 500);

  const { error: updateError } = await supabaseAdmin
    .from('evaluations')
    .update({ edited_photo_path: editedPath })
    .eq('id', evaluationId);
  if (updateError) return jsonResponse({ error: updateError.message }, 500);

  const { data: editedSigned, error: editedSignError } = await supabaseAdmin.storage
    .from('evaluation-photos')
    .createSignedUrl(editedPath, 3600);
  if (editedSignError || !editedSigned) return jsonResponse({ error: 'PHOTO_UNAVAILABLE' }, 500);

  return jsonResponse({ ok: true, editedPhotoUrl: editedSigned.signedUrl });
});
