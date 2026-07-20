import { createClient } from 'npm:@supabase/supabase-js@2';

// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY는 Supabase Edge Functions 런타임이
// 자동으로 주입하는 값이라 별도로 secrets set 할 필요가 없다.
// service_role 키는 RLS를 우회하므로 이 파일은 서버(엣지 함수) 안에서만 사용한다.
export const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);
