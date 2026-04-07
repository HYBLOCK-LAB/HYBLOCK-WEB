# HYBLOCK Web

`web` 패키지는 HYBLOCK의 사용자 웹과 관리자 웹을 담당한다.

## 1. 역할

- 공개 페이지 렌더링
- Google OAuth 및 지갑 로그인
- QR 출석 발급/검증 UI
- 관리자 증명 관리 UI
- 학회원 SBT 발급 UI
- App Router API Routes 제공

## 2. 주요 기능

### 사용자 영역

- 로그인
- 지갑 연결
- 출석 체크
- 개인 QR 발급
- 마이페이지
- SBT 발급

### 관리자 영역

- 멤버 관리
- 출석 관리
- 증명 관리

## 3. 기술 구성

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Wagmi
- Reown AppKit
- viem
- Supabase
- Upstash Redis

## 4. 인증 구조

### Google OAuth

- Supabase Auth 기반
- `/auth/callback`에서 세션 교환 처리

### 지갑 로그인

- nonce 발급
- 지갑 서명
- 서버 검증
- `httpOnly` wallet session cookie 발급

## 5. 주요 화면

| 경로 | 역할 |
| --- | --- |
| `/login` | 로그인 |
| `/wallet-link` | 지갑 연결 및 세션 확인 |
| `/attendance` | 출석 체크 |
| `/mypage` | 회원 정보 및 SBT 발급 |
| `/admin/certificates` | 관리자 증명 발급 |

## 6. 주요 API Routes

| 경로 | 역할 |
| --- | --- |
| `/api/auth/wallet/nonce` | 지갑 로그인 nonce 발급 |
| `/api/auth/wallet/verify` | 지갑 서명 검증 |
| `/api/auth/wallet/logout` | wallet session 정리 |
| `/api/attendance/qr-token` | 개인 QR 토큰 발급 |
| `/api/attendance/qr-scan` | 관리자 QR 스캔 검증 |
| `/api/certificates/members` | 증명 발급 후보 조회 |
| `/api/certificates/issued` | 기발급 증명 조회 |
| `/api/certificates/save-attestation` | attestation 저장 |
| `/api/certificates/sbt-eligibility` | SBT 자격 조회 |
| `/api/certificates/mint-sbt` | SBT 민팅 |

## 7. UI 가이드

현재 UI는 밝은 배경과 블루 포인트 중심의 디자인 시스템을 사용한다.

관련 기준 파일:
- [globals.css](/home/jaeman/Codes/HYBLOCK-WEB/web/app/globals.css)
- [tailwind.config.ts](/home/jaeman/Codes/HYBLOCK-WEB/web/tailwind.config.ts)
- [SiteChrome.tsx](/home/jaeman/Codes/HYBLOCK-WEB/web/components/SiteChrome.tsx)

## 8. 실행

```bash
cd web
npm install
npm run dev
```

## 9. 참고 문서

- [루트 README](/home/jaeman/Codes/HYBLOCK-WEB/README.md)
- [아키텍처](/home/jaeman/Codes/HYBLOCK-WEB/docs/ARCHITECTURE.md)
- [플로우](/home/jaeman/Codes/HYBLOCK-WEB/docs/FLOWS.md)
- [운영 가이드](/home/jaeman/Codes/HYBLOCK-WEB/docs/OPERATIONS.md)
- [지갑 세션 및 QR 구조](/home/jaeman/Codes/HYBLOCK-WEB/web/docs/wallet-session-and-qr-attendance.md)
