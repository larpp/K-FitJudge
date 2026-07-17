# 📦 Bboggl 준비물 가이드

선택한 기능 중 서버·API·배포가 필요한 항목이에요. 베이스: K-FitJudge

### 회원가입·로그인
- 필요: 인증 제공자(Supabase Auth / Firebase Auth / Auth0 중 택1), 키
1) 프로젝트 생성 후 이메일·소셜(Google/Kakao) 공급자 활성화
2) 클라이언트 SDK로 로그인/회원가입 UI 연결
3) 세션·JWT로 보호 라우트 가드
⚠️ 비밀번호 직접 저장 금지(제공자에 위임), 키는 .env

### 마이페이지
- 필요: 로그인(인증) + DB(profile)
1) 인증된 user id로 프로필 조회 API
2) 수정 폼 → PATCH → DB 업데이트
⚠️ 서버에서 본인 데이터만 접근하도록 권한 검사

### 구글 로그인 (Google OAuth)
- 필요: Google Cloud 프로젝트 + OAuth 클라이언트 ID, 인증 제공자(Supabase Auth / Firebase Auth 권장)
1) Google Cloud Console → ‘API 및 서비스 → 사용자 인증 정보’에서 OAuth 클라이언트 ID 생성(웹 애플리케이션)
2) 승인된 리디렉션 URI 등록(예: https://<프로젝트>.supabase.co/auth/v1/callback)
3) Supabase 대시보드 → Authentication → Providers → Google 활성화 후 클라이언트 ID/시크릿 입력
4) 프론트에서 supabase.auth.signInWithOAuth({ provider:'google' }) 호출
5) 콜백에서 세션 수신 → 로그인 상태 저장 + 보호 라우트 가드
6) OAuth 동의화면(앱 이름·로고·범위) 설정 — 운영 배포 시 구글 검증 필요(테스트는 100명까지 검증 없이 가능)
⚠️ 클라이언트 시크릿은 서버/제공자에만 두고 프론트 노출 금지, 리디렉션 URI는 정확히 일치해야 동작

### 결제
- 필요: PG 계정(Toss Payments/Stripe), 클라이언트·시크릿 키, 서버, HTTPS
1) 테스트 모드 키 발급(무료)
2) 프론트 결제위젯으로 결제 요청
3) 서버에서 결제 승인 API 호출(시크릿 키는 서버만)
4) webhook으로 결제완료 재검증 → 주문 확정
⚠️ 카드정보 직접 저장 금지(PCI), 시크릿 키 프론트 노출 금지