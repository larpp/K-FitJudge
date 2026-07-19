# K-FitJudge

사진 한 장으로 100점 만점 패션 평가와 세부 피드백을 받고, 피드백을 반영한 개선 스타일 이미지를 Before/After 슬라이더로 비교하는 웹 서비스입니다. 한국어/영어를 모두 지원해 K-culture에 관심 있는 국내외 사용자를 함께 타겟팅합니다.

## 개발 진행 상황

- [x] Stage 1 — 스캐폴딩, 디자인 시스템, 헤더/푸터, 랜딩 페이지
- [x] Stage 2 — 업로드 → TPO → 스타일 의도 → 평가 플로우
- [x] Stage 3 — 점수/피드백 결과 + Before/After 슬라이더
- [x] Stage 4 — 마이페이지/로그인 더미 + 반응형 점검

프론트엔드가 완성되었습니다. PART 2 백엔드 연동을 순서대로 진행 중입니다.

### PART 2 진행 상황

- [x] ① 회원가입·로그인 — Supabase Auth 연동 (이메일 가입/로그인, Google은 제공자 설정 후 사용 가능)
- [ ] ② 마이페이지 — DB 연동
- [ ] ③ 구글 로그인 — Google OAuth 클라이언트 설정
- [ ] ④ 결제

## 기술 스택

React + TypeScript + Vite, React Router. 디자인 토큰은 CSS 변수로 관리합니다(`src/styles/tokens.css`). 인증은 Supabase Auth(`@supabase/supabase-js`)를 사용합니다.

## 실행

```bash
npm install
cp .env.example .env.local   # Supabase 프로젝트 URL과 anon key를 채워주세요
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
```

`.env.local`이 없으면 화면은 정상적으로 뜨지만 로그인/회원가입 시 "Supabase가 설정되지 않았어요"라는 안내가 표시됩니다.
