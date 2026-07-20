-- K-FitJudge · Pro 이미지 개선(Qwen-Image-Edit) 결과 저장용 컬럼
-- Supabase 대시보드 → SQL Editor → New query 에서 그대로 실행하세요.
-- (schema_evaluation_photos.sql을 먼저 실행해서 evaluation-photos 버킷이 있어야 합니다.)

alter table public.evaluations
  add column if not exists edited_photo_path text;
