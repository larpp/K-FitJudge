-- K-FitJudge · 히스토리 개별 삭제(소프트 삭제)
-- Supabase 대시보드 → SQL Editor → New query 에서 그대로 실행하세요.

-- 실제로 행을 지우지 않고 deleted_at만 채운다. 무료 플랜의 "이번 달 평가 횟수" 집계는
-- 삭제 여부와 무관하게 항상 전체 행을 기준으로 세기 때문에, 삭제해도 한도를 우회할 수 없다.
alter table public.evaluations
  add column if not exists deleted_at timestamptz;
