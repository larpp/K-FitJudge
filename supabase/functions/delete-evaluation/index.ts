import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { requireUser } from '../_shared/authUser.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await requireUser(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => null);
  const evaluationId = body?.evaluationId;
  if (typeof evaluationId !== 'string' || !evaluationId) {
    return jsonResponse({ error: 'INVALID_PAYLOAD' }, 400);
  }

  // 실제로 행을 지우지 않고 deleted_at만 채운다. 무료 플랜의 "이번 달 평가 횟수" 집계(evaluate-photo)는
  // 삭제 여부와 무관하게 항상 전체 행을 기준으로 세므로, 이렇게 지워도 한도를 우회할 수 없다.
  const { data, error } = await supabaseAdmin
    .from('evaluations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', evaluationId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) return jsonResponse({ error: error.message }, 500);
  if (!data) return jsonResponse({ error: 'NOT_FOUND' }, 404);

  return jsonResponse({ ok: true });
});
