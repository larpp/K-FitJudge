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

## Supabase Edge Functions (결제 서버 로직)

`supabase/functions/`에 있는 함수들을 배포해야 결제가 동작합니다.

```bash
npm install -g supabase
supabase login
supabase link --project-ref <프로젝트 ref>
supabase functions deploy toss-create-order
supabase functions deploy toss-confirm
supabase functions deploy paypal-create-order
supabase functions deploy paypal-capture-order

# 시크릿 키는 여기(서버)에만 설정 — 절대 .env(프론트)에 넣지 않는다
supabase secrets set TOSS_SECRET_KEY=your_toss_secret_key
supabase secrets set PAYPAL_CLIENT_ID=your_paypal_client_id
supabase secrets set PAYPAL_CLIENT_SECRET=your_paypal_client_secret
supabase secrets set PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
```

`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`는 Edge Functions 런타임이 자동으로 주입하므로 별도 설정이 필요 없습니다.
