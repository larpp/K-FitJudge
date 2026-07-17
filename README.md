# K-FitJudge

사진 한 장으로 100점 만점 패션 평가와 세부 피드백을 받고, 피드백을 반영한 개선 스타일 이미지를 Before/After 슬라이더로 비교하는 웹 서비스입니다. 한국어/영어를 모두 지원해 K-culture에 관심 있는 국내외 사용자를 함께 타겟팅합니다.

## 개발 진행 상황

- [x] Stage 1 — 스캐폴딩, 디자인 시스템, 헤더/푸터, 랜딩 페이지
- [x] Stage 2 — 업로드 → TPO → 스타일 의도 → 평가 플로우
- [ ] Stage 3 — 점수/피드백 결과 + Before/After 슬라이더
- [ ] Stage 4 — 마이페이지/로그인 더미 + 반응형 점검

백엔드(회원가입·로그인, 마이페이지, 구글 로그인, 결제) 연동은 프론트엔드 완성 후 별도로 진행합니다.

## 기술 스택

React + TypeScript + Vite, React Router. 디자인 토큰은 CSS 변수로 관리합니다(`src/styles/tokens.css`).

## 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
```
