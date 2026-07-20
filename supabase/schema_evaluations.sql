-- K-FitJudge · PART 3 — evaluations 테이블
-- Supabase 대시보드 → SQL Editor → New query 에서 그대로 실행하세요.
-- (schema.sql, schema_payments.sql을 먼저 실행해서 profiles 테이블이 있어야 합니다.)

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tpo text not null,
  intent text not null check (intent in ('classic', 'experimental')),
  overall_score int not null,
  categories jsonb not null,
  strengths jsonb not null,
  improvements jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.evaluations enable row level security;

-- 본인 평가 기록만 조회 가능. 생성은 클라이언트가 직접 하지 않고
-- Edge Function(서버, service_role)이 대신 처리한다 — 그래야 무료 플랜
-- 월 3회 제한을 사용자가 임의로 우회할 수 없다.
create policy "Users can view their own evaluations"
  on public.evaluations for select
  using (auth.uid() = user_id);

create index if not exists evaluations_user_created_idx on public.evaluations (user_id, created_at desc);
