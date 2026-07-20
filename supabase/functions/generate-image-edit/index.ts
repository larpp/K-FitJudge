import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { requireUser } from '../_shared/authUser.ts';
import { editImageWithFal } from '../_shared/fal.ts';

interface ImprovementRow {
  textEn?: string;
}

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
    .map((f) => f.textEn)
    .filter((text): text is string => Boolean(text))
    .slice(0, 3);

  const prompt =
    instructions.length > 0
      ? `Photorealistic edit of this outfit photo. Only apply these specific style changes: ${instructions
          .map((t, i) => `${i + 1}) ${t}`)
          .join(' ')} Keep the person's identity, face, pose, body, and background completely unchanged. Do not alter anything not mentioned above.`
      : 'Subtly refine this outfit for better color harmony and fit, while keeping the person\'s identity, face, pose, body, and background completely unchanged.';

  let falImageUrl: string;
  try {
    falImageUrl = await editImageWithFal({ prompt, imageUrl: signed.signedUrl });
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
