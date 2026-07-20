import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { requireUser } from '../_shared/authUser.ts';

const FREE_MONTHLY_LIMIT = 3;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await requireUser(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const body = await req.json();
  const { tpo, intent, overall, categories, strengths, improvements, photoPath } = body ?? {};
  if (
    typeof tpo !== 'string' ||
    (intent !== 'classic' && intent !== 'experimental') ||
    typeof overall !== 'number' ||
    !Array.isArray(categories) ||
    !Array.isArray(strengths) ||
    !Array.isArray(improvements)
  ) {
    return jsonResponse({ error: 'Invalid evaluation payload.' }, 400);
  }

  // 업로드된 사진 경로가 본인 폴더("{uid}/...") 소속일 때만 인정한다.
  const safePhotoPath =
    typeof photoPath === 'string' && photoPath.startsWith(`${user.id}/`) ? photoPath : null;

  const { data: profile } = await supabaseAdmin.from('profiles').select('plan').eq('id', user.id).maybeSingle();
  const plan = profile?.plan === 'pro' ? 'pro' : 'free';

  // 무료 플랜은 이번 달 평가 횟수를 서버에서 직접 세서 제한한다.
  // (클라이언트가 직접 evaluations에 쓸 수 없으므로 이 카운트를 우회할 방법이 없다.)
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

  return jsonResponse({ ok: true, id: data.id });
});
