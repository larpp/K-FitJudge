# K-FitJudge

사진 한 장으로 100점 만점 패션 평가와 세부 피드백을 받고, 피드백을 반영한 개선 스타일 이미지를 Before/After 슬라이더로 비교하는 웹 서비스입니다. 한국어/영어를 모두 지원해 K-culture에 관심 있는 국내외 사용자를 함께 타겟팅합니다.

## 개발 진행 상황

- [x] Stage 1 — 스캐폴딩, 디자인 시스템, 헤더/푸터, 랜딩 페이지
- [x] Stage 2 — 업로드 → TPO → 스타일 의도 → 평가 플로우
- [x] Stage 3 — 점수/피드백 결과 + Before/After 슬라이더
- [x] Stage 4 — 마이페이지/로그인 더미 + 반응형 점검

프론트엔드(PART 1)와 백엔드 연동(PART 2)이 모두 완료되었습니다. 🎉

### PART 2 진행 상황

- [x] ① 회원가입·로그인 — Supabase Auth 연동, 실제 가입/로그인 테스트 완료
- [x] ② 마이페이지 — `profiles` 테이블 + RLS 연동 (본인 프로필만 조회/수정), 실제 저장 테스트 완료
- [x] ③ 구글 로그인 — Google OAuth 클라이언트 설정, 실제 로그인 테스트 완료
- [x] ④ 결제 — Toss Payments(원화) + PayPal(USD), Supabase Edge Functions로 서버 승인. **실제 테스트 결제로 Pro 플랜 전환까지 확인 완료**

### PART 3 이후 진행 상황

- [x] PART 3 — `evaluations` 테이블에 평가 결과 저장, 마이페이지 히스토리 실데이터화, 무료 플랜 월 3회 한도를 서버(Edge Function)에서 강제
- [x] 히스토리 상세 보기 — 마이페이지에서 과거 평가 클릭 시 당시 결과 화면(점수·피드백·사진)을 그대로 다시 볼 수 있음. 플랜이 바뀌어도 과거 기록은 항상 열람 가능
- [x] PART 3.5 — AI 실연동. 비전 피드백은 Hugging Face의 **Qwen3-VL**(Apache-2.0, 무료: 8B / Pro: 235B-A22B), Pro 전용 이미지 개선은 **Qwen-Image-Edit-2509**(Apache-2.0)를 fal.ai 서버리스로 호출. 코드는 완성됐고 실제 동작을 위해서는 아래 "AI 연동 설정"에서 `HF_TOKEN`/`FAL_KEY` 시크릿을 등록해야 함
- [ ] PART 4 — 정기결제 전환 + 구독 취소 기능
- [ ] PART 5 — 보안 점검, 이용약관/개인정보처리방침, 성능 최적화
- [ ] PART 6 — 최종 배포 (맨 마지막)

## 기술 스택

React + TypeScript + Vite, React Router. 디자인 토큰은 CSS 변수로 관리합니다(`src/styles/tokens.css`). 인증·DB·결제 서버 로직은 Supabase(`@supabase/supabase-js` + Edge Functions)를 사용합니다.

## 실행

```bash
npm install
cp .env.example .env.local   # Supabase/Toss/PayPal 클라이언트 키를 채워주세요
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
```

`.env.local`이 없으면 화면은 정상적으로 뜨지만 로그인/회원가입 시 "Supabase가 설정되지 않았어요"라는 안내가 표시됩니다.

## Supabase DB 스키마

Supabase 대시보드 → SQL Editor에서 순서대로 실행하세요.

1. `supabase/schema.sql` — `profiles` 테이블, RLS 정책, 회원가입 시 프로필 자동 생성 트리거
2. `supabase/schema_payments.sql` — `orders` 테이블, `profiles.plan` 컬럼 (결제 완료 시 'pro'로 전환)
3. `supabase/schema_evaluations.sql` — `evaluations` 테이블(RLS: 본인 조회만, 쓰기는 서버 전용)
4. `supabase/schema_evaluation_photos.sql` — `evaluations.photo_path` 컬럼 + 평가 사진용 비공개 Storage 버킷(`evaluation-photos`) 및 RLS(본인 사진만 업로드/조회)
5. `supabase/schema_image_edit.sql` — `evaluations.edited_photo_path` 컬럼 (Pro AI 이미지 개선 결과 저장용)

## Supabase Edge Functions (서버 로직)

`supabase/functions/`에 있는 함수들을 배포해야 결제·평가·AI 연동이 동작합니다.

```bash
npx supabase login
npx supabase link --project-ref <프로젝트 ref>
npx supabase functions deploy toss-create-order
npx supabase functions deploy toss-confirm
npx supabase functions deploy paypal-create-order
npx supabase functions deploy paypal-capture-order
npx supabase functions deploy evaluate-photo
npx supabase functions deploy generate-image-edit

# 시크릿 키는 여기(서버)에만 설정 — 절대 .env(프론트)에 넣지 않는다
npx supabase secrets set TOSS_SECRET_KEY=your_toss_secret_key
npx supabase secrets set PAYPAL_CLIENT_ID=your_paypal_client_id
npx supabase secrets set PAYPAL_CLIENT_SECRET=your_paypal_client_secret
npx supabase secrets set PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
npx supabase secrets set HF_TOKEN=your_hugging_face_access_token
npx supabase secrets set FAL_KEY=your_fal_ai_api_key
```

`evaluate-photo`는 로그인한 사용자의 이번 달 평가 횟수를 서버에서 직접 세어, 무료 플랜은 3회를 넘으면 AI를 호출하지 않고 바로 `LIMIT_REACHED` 에러를 반환합니다(클라이언트에서 우회 불가). 예전 `record-evaluation` 함수를 대체하니, 이미 배포되어 있다면 `npx supabase functions delete record-evaluation`으로 지워도 됩니다.

`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`는 Edge Functions 런타임이 자동으로 주입하므로 별도 설정이 필요 없습니다.

## AI 연동 설정 (PART 3.5)

옷차림 사진을 실제로 채점/편집하려면 Hugging Face와 fal.ai 계정에서 발급한 API 키가 필요합니다. 두 서비스 모두 회원가입 시 소액의 무료 크레딧을 주지만, 이후에는 사용한 만큼 과금되는 종량제입니다(모델 자체는 오픈소스라 무료지만, 그 모델을 GPU로 돌려주는 호스팅 비용은 유료라는 뜻이에요).

- **비전 피드백** — [Qwen3-VL](https://huggingface.co/Qwen/Qwen3-VL-235B-A22B-Instruct) (Apache-2.0). 무료 플랜은 경량 모델(`Qwen3-VL-8B-Instruct`), Pro 플랜은 Gemini 2.5 Pro급 최상위 모델(`Qwen3-VL-235B-A22B-Instruct`)을 사용합니다. 한국어 전용 모델(NCSOFT VARCO-VISION)도 검토했지만 라이선스가 비상업용(CC BY-NC 4.0)이라 유료 서비스에는 쓸 수 없어서 제외했습니다 — Qwen3-VL은 한국어를 포함한 다국어를 잘 지원하면서 상업적 이용 제한이 없습니다.
  1. https://huggingface.co/settings/tokens 에서 "Read" 권한 토큰 발급
  2. `npx supabase secrets set HF_TOKEN=hf_...`
- **Pro 이미지 개선** — [Qwen-Image-Edit-2509](https://huggingface.co/Qwen/Qwen-Image-Edit-2509) (Apache-2.0). 피드백에서 언급된 부분만 반영해 사진을 바꾸는 오픈소스 모델 중 벤치마크 1위권이라 선택했습니다(비교 대상이었던 FLUX.1 Kontext는 비상업용 라이선스라 제외). fal.ai가 이 모델을 서버리스로 호스팅하고 있어 그 API를 통해 호출합니다. 마이페이지 결과 화면에서 Pro 사용자가 버튼을 눌러야만 생성되고(자동 생성 아님), 한 번 생성하면 저장돼서 히스토리에서도 다시 볼 수 있습니다.
  1. https://fal.ai/dashboard/keys 에서 API 키 발급
  2. `npx supabase secrets set FAL_KEY=...`

시크릿 설정 후 `npx supabase functions deploy evaluate-photo`와 `npx supabase functions deploy generate-image-edit`를 다시 실행해야 반영됩니다. 두 시크릿 중 하나라도 없으면 관련 기능만 에러로 실패하고 나머지 서비스(로그인/결제/기존 평가 조회)는 정상 동작합니다.
