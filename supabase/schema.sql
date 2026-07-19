-- K-FitJudge · PART 2 ② 마이페이지 — profiles 테이블
-- Supabase 대시보드 → SQL Editor → New query 에서 그대로 실행하세요.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  bio text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 본인 프로필만 조회 가능
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- 본인 프로필만 수정 가능
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 본인 프로필만 생성 가능 (최초 저장 시 upsert에 필요)
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 회원가입 시 profiles 행을 자동 생성하는 트리거
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
