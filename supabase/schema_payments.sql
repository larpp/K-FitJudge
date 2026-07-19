-- K-FitJudge · PART 2 ④ 결제 — orders 테이블 + profiles.plan
-- Supabase 대시보드 → SQL Editor → New query 에서 그대로 실행하세요.
-- (schema.sql을 먼저 실행해서 profiles 테이블이 있어야 합니다.)

alter table public.profiles
  add column if not exists plan text not null default 'free' check (plan in ('free', 'pro'));

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('toss', 'paypal')),
  provider_order_id text not null,
  plan text not null default 'pro',
  amount numeric not null,
  currency text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_order_id)
);

alter table public.orders enable row level security;

-- 본인 주문만 조회 가능. 생성/수정은 클라이언트가 직접 하지 않고
-- Edge Function(서버, service_role)이 대신 처리한다 — 그래야 사용자가
-- 임의로 자기 주문을 "결제완료"로 조작할 수 없다.
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create index if not exists orders_user_id_idx on public.orders (user_id);
