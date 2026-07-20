-- K-FitJudge · 평가 히스토리 사진 저장 (마이페이지에서 과거 평가 다시 보기용)
-- Supabase 대시보드 → SQL Editor → New query 에서 그대로 실행하세요.
-- (schema_evaluations.sql을 먼저 실행해서 evaluations 테이블이 있어야 합니다.)

alter table public.evaluations
  add column if not exists photo_path text;

-- 평가 사진을 저장할 비공개 버킷. 공개(public) 버킷이 아니므로 URL만으로는
-- 접근할 수 없고, 아래 정책을 통과해야만(=본인 사진만) signed URL을 만들 수 있다.
insert into storage.buckets (id, name, public)
values ('evaluation-photos', 'evaluation-photos', false)
on conflict (id) do nothing;

-- 파일 경로를 "{user_id}/{파일명}" 형식으로 쓰기로 약속하고,
-- 그 경로의 첫 폴더가 본인 uid일 때만 업로드/조회를 허용한다.
create policy "Users can upload their own evaluation photos"
  on storage.objects for insert
  with check (bucket_id = 'evaluation-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view their own evaluation photos"
  on storage.objects for select
  using (bucket_id = 'evaluation-photos' and (storage.foldername(name))[1] = auth.uid()::text);
