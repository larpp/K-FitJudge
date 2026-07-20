import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { requireUser } from '../_shared/authUser.ts';
import { getPaypalAccessToken, paypalConfigured, PAYPAL_API_BASE } from '../_shared/paypal.ts';

const PRO_PRICE_USD = '7.90';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await requireUser(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
  if (!paypalConfigured()) return jsonResponse({ error: 'PayPal is not configured on the server.' }, 500);

  const accessToken = await getPaypalAccessToken();

  const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: 'K-FitJudge Pro (1 month)',
          amount: { currency_code: 'USD', value: PRO_PRICE_USD },
        },
      ],
    }),
  });

  const order = await orderRes.json();
  if (!orderRes.ok) return jsonResponse({ error: order.message ?? 'Failed to create PayPal order.' }, 400);

  const { error } = await supabaseAdmin.from('orders').insert({
    user_id: user.id,
    provider: 'paypal',
    provider_order_id: order.id,
    plan: 'pro',
    amount: Number(PRO_PRICE_USD),
    currency: 'USD',
    status: 'pending',
  });
  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({ id: order.id });
});
