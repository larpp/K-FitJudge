const PAYPAL_API_BASE = Deno.env.get('PAYPAL_API_BASE') ?? 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') ?? '';
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET') ?? '';

export function paypalConfigured() {
  return Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
}

export async function getPaypalAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('Failed to get PayPal access token.');
  const data = await res.json();
  return data.access_token as string;
}

export { PAYPAL_API_BASE };
