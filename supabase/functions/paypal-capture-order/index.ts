import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { requireUser } from '../_shared/authUser.ts';
import { getPaypalAccessToken, paypalConfigured, PAYPAL_API_BASE } from '../_shared/paypal.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await requireUser(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
  if (!paypalConfigured()) return jsonResponse({ error: 'PayPal is not configured on the server.' }, 500);

  const { orderId } = await req.json();
  if (!orderId) return jsonResponse({ error: 'orderId is required.' }, 400);

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, status')
    .eq('provider', 'paypal')
    .eq('provider_order_id', orderId)
    .maybeSingle();

  if (orderError || !order) return jsonResponse({ error: 'Order not found.' }, 404);
  if (order.user_id !== user.id) return jsonResponse({ error: 'Order does not belong to this user.' }, 403);
  if (order.status === 'paid') return jsonResponse({ ok: true, alreadyConfirmed: true });

  const accessToken = await getPaypalAccessToken();
  const captureRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  const capture = await captureRes.json();

  if (!captureRes.ok || capture.status !== 'COMPLETED') {
    await supabaseAdmin.from('orders').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', order.id);
    return jsonResponse({ error: capture.message ?? 'PayPal capture failed.' }, 400);
  }

  await supabaseAdmin
    .from('orders')
    .update({ status: 'paid', updated_at: new Date().toISOString() })
    .eq('id', order.id);
  await supabaseAdmin.from('profiles').update({ plan: 'pro' }).eq('id', user.id);

  return jsonResponse({ ok: true });
});
