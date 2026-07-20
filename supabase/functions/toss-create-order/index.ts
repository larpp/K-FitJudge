import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { requireUser } from '../_shared/authUser.ts';

const PRO_PRICE_KRW = 9900;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await requireUser(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  // 가격은 클라이언트 입력을 신뢰하지 않고 서버에서 고정한다.
  const orderId = crypto.randomUUID();
  const { error } = await supabaseAdmin.from('orders').insert({
    user_id: user.id,
    provider: 'toss',
    provider_order_id: orderId,
    plan: 'pro',
    amount: PRO_PRICE_KRW,
    currency: 'KRW',
    status: 'pending',
  });

  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({ orderId, amount: PRO_PRICE_KRW, orderName: 'K-FitJudge Pro (1개월)' });
});
