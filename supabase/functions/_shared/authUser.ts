import { supabaseAdmin } from './supabaseAdmin.ts';

/** Authorization: Bearer <jwt> 헤더에서 로그인한 사용자를 검증해서 꺼낸다. */
export async function requireUser(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
