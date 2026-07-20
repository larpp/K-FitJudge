import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { requireUser } from '../_shared/authUser.ts';

const TOSS_SECRET_KEY = Deno.env.get('TOSS_SECRET_KEY') ?? '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await requireUser(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
  if (!TOSS_SECRET_KEY) return jsonResponse({ error: 'TOSS_SECRET_KEY is not configured on the server.' }, 500);

  const { paymentKey, orderId, amount } = await req.json();
  if (!paymentKey || !orderId || typeof amount !== 'number') {
    return jsonResponse({ error: 'paymentKey, orderId, amount are required.' }, 400);
  }

  // 우리 쪽 주문 기록과 대조해서, 결제 승인 요청받은 금액이 실제 주문 생성 시 금액과 같은지 확인한다.
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, amount, status')
    .eq('provider', 'toss')
    .eq('provider_order_id', orderId)
    .maybeSingle();

  if (orderError || !order) return jsonResponse({ error: 'Order not found.' }, 404);
  if (order.user_id !== user.id) return jsonResponse({ error: 'Order does not belong to this user.' }, 403);
  if (order.status === 'paid') return jsonResponse({ ok: true, alreadyConfirmed: true });
  if (Number(order.amount) !== amount) return jsonResponse({ error: 'Amount mismatch.' }, 400);

  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${TOSS_SECRET_KEY}:`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const tossData = await tossRes.json();

  if (!tossRes.ok) {
    await supabaseAdmin.from('orders').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', order.id);
    return jsonResponse({ error: tossData.message ?? 'Toss payment confirmation failed.' }, 400);
  }

  await supabaseAdmin
    .from('orders')
    .update({ status: 'paid', updated_at: new Date().toISOString() })
    .eq('id', order.id);
  await supabaseAdmin.from('profiles').update({ plan: 'pro' }).eq('id', user.id);

  return jsonResponse({ ok: true });
});
