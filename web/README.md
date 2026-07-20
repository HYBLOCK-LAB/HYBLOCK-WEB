# HYBLOCK Web

Next.js App Router 하나에서 공개 사이트, 회원 기능, 관리자 운영 도구와 서버 Route Handler를 제공한다.

## 1. 실행

```bash
cp .env.example .env.local
npm install
npm run dev
```

| 명령 | 역할 |
| --- | --- |
| `npm run dev` | webpack 기반 Next.js 개발 서버 |
| `npm run build` | webpack 기반 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | 현재 `next lint`; Next.js 16용 교체 필요 |

환경변수와 외부 서비스 준비는 [운영 가이드](../docs/OPERATIONS.md)를 참고한다.

## 2. 디렉토리

| 경로 | 역할 |
| --- | --- |
| `app` | App Router 페이지, layout, Route Handlers, global CSS |
| `components` | 공개·인증·지갑·출석·관리자 UI |
| `lib` | Supabase 쿼리, 지갑 session, EAS ABI, Redis REST, 콘텐츠 |
| `providers` | AppKit, Wagmi, TanStack Query, wallet UI 동기화 |
| `public` | 로고와 정적 활동 앨범 |
| `docs` | 지갑 session과 QR 출석 상세 |

## 3. 페이지 라우트

### 공개

| 경로 | 역할 | 데이터 |
| --- | --- | --- |
| `/` | 홈 | 정적 `site-content`, `text-content` |
| `/about` | 학회 소개 | 정적 |
| `/bylaws` | 회칙 | 정적 |
| `/activities` | 활동 사진 | `public/Album` 정적 목록 |
| `/notices` | 공지 목록, 필터, 검색, 페이지네이션 | Supabase `notice` |
| `/notices/[id]` | Markdown 공지 상세 | Supabase `notice` |
| `/privacy-policy` | 개인정보처리방침 | 정적 |
| `/terms-of-service` | 이용약관 | 정적 |

내비게이션에 `/apply` 링크가 있지만 대응 페이지는 아직 없다.

### 인증·회원

| 경로 | 역할 |
| --- | --- |
| `/login` | Google OAuth 또는 지갑 서명 로그인 |
| `/auth/callback` | Supabase code/session 교환, wallet/member 분기 |
| `/wallet-link` | Google 계정 metadata에 지갑 주소 연동 |
| `/signup` | 지갑 주소 기준 member 생성 |
| `/attendance` | 세션 목록, 개인 QR, 수동 코드 출석 |
| `/mypage` | 지갑/member 정보, 개인 QR, SBT 자격·민팅 |
| `/forbidden` | 관리자 권한 없음 |

`/dashboard`는 과거 클라이언트 비밀번호 UI가 남은 레거시 페이지다. 서버 `/api/events`는 별도 관리자 지갑 session을 요구하므로 실제 운영은 `/admin`을 사용한다.

### 관리자

모든 `/admin` 페이지는 서버 layout 또는 page에서 지갑 session과 `member.is_admin`을 확인한다.

| 경로 | 역할 |
| --- | --- |
| `/admin` | 관리자 허브 |
| `/admin/members` | 회원/산출물 상태 확인·수정 |
| `/admin/activities` | 세션/활동 CRUD |
| `/admin/attendance` | 세션 활성화, QR 스캔, 참여 상태 관리 |
| `/admin/notices` | 공지 CRUD |
| `/admin/certificates` | EAS 후보·기발급 목록·발급 |

## 4. Route Handlers

| method / path | 인증 | 역할 |
| --- | --- | --- |
| `GET /api/auth/wallet/nonce` | 없음 | 5분 nonce cookie와 서명 메시지 발급 |
| `POST /api/auth/wallet/verify` | nonce cookie | 서명/member 검증, 7일 session cookie 발급 |
| `POST /api/auth/wallet/logout` | 없음 | wallet nonce/session cookie 제거 |
| `GET /api/members/by-wallet` | 없음 | 지갑 주소로 member 조회 |
| `POST /api/members` | 없음 | member 생성 |
| `PATCH /api/members` | 관리자 | `has_assignment` 수정 |
| `POST /api/attendance/qr-token` | 지갑 session 또는 Google Bearer | 45초 개인 QR 발급 |
| `POST /api/attendance/qr-scan` | 관리자 | Redis QR 소비와 출석 기록 |
| `POST /api/check-in` | 출석 코드 | 이름+코드 수동 출석 |
| `GET/POST/PATCH /api/events` | 관리자 | 출석 운영 조회·활성화·상태 변경 |
| `GET/POST/PATCH/DELETE /api/activities` | 관리자 | `attendance_session` CRUD |
| `GET/POST/PATCH/DELETE /api/notices` | 관리자 | `notice` CRUD |
| `GET /api/certificates/members` | 관리자 | 타입별 발급 후보 |
| `GET /api/certificates/member-detail` | 관리자 | 후보 원본 활동 상세 |
| `GET /api/certificates/issued` | 관리자 | 기발급 EAS 목록 |
| `POST /api/certificates/save-attestation` | 관리자 | EAS UID 저장 |
| `GET /api/certificates/sbt-eligibility` | 없음 | 주소별 조건/attestation/SBT 상태 |
| `POST /api/certificates/mint-sbt` | 지갑 session | 서버 owner 지갑 SBT 민팅 |

## 5. 인증 상태

### Supabase Google session

- 브라우저 Supabase client가 유지한다.
- callback에서 linked wallet과 member 존재 여부를 분기한다.
- 개인 QR API에는 access token을 Bearer로 전달한다.
- 관리자 인가와 SBT 민팅 인가에는 사용하지 않는다.

### 지갑 server session

- nonce와 session은 HMAC 서명 `httpOnly` cookie다.
- 서명 검증은 viem `recoverMessageAddress`를 사용한다.
- 관리자와 SBT 민팅의 기준이다.

### Wagmi/Zustand 상태

- 연결된 주소·체인을 보여주는 클라이언트 상태다.
- server session cookie의 존재를 보장하지 않는다.
- 헤더 disconnect는 현재 server logout endpoint를 호출하지 않는다.

## 6. 데이터 접근

- 서버 공통 client: `lib/supabase.ts`
- Google token 검증 client: `lib/supabase-auth.ts`
- 브라우저 Auth client: `lib/auth/supabase-browser.ts`
- 도메인 query: `lib/supabase-*.ts`
- QR Redis REST: `lib/upstash-redis.ts`

`assignment` 테이블은 현재 web query에서 사용하지 않는다. `member.has_assignment`가 운영 기준이다.

## 7. Web3

- AppKit/Wagmi 등록 네트워크: Mainnet, Sepolia
- EAS 발급: 브라우저 지갑 → `HyblockIssuer.issue`
- receipt 처리: viem이 EAS `Attested` event에서 UID 추출
- SBT: 서버 private key → `HyblockSBT.safeMint`
- 기본 SBT chain: Sepolia

`ActivityTracker`와 `HyblockResolver`를 호출하는 web 코드는 없다. 현재 EAS UI는 `isGraduated=false`를 보낸다.

## 8. 스타일과 콘텐츠

- Tailwind CSS v4의 실제 theme: `app/globals.css`
- `tailwind.config.ts`: 이전 토큰이 남은 미연결 설정
- 언어 상태: Zustand `language-store`
- 번역 사전: `lib/text-content.ts`
- 홈/활동 정적 콘텐츠: `lib/site-content.ts`
- 공지 상세: React Markdown + GFM

## 9. 현재 정리 대상

- 직접 import하지만 직접 선언되지 않은 `@wagmi/connectors`, `@paulmillr/qr`
- package manifest에 있으나 소스에서 직접 쓰지 않는 개별 wallet SDK 네 종
- 라우트에서 사용하지 않는 `EmailAuthForm`
- `/dashboard`, `/apply`와 수동 출석의 `/api/events` 인증 불일치
- Wagmi disconnect와 server wallet logout 통합

## 10. 관련 문서

- [루트 README](../README.md)
- [아키텍처](../docs/ARCHITECTURE.md)
- [기술 스택](../docs/TECH_STACK.md)
- [플로우](../docs/FLOWS.md)
- [지갑 session·QR 출석](docs/wallet-session-and-qr-attendance.md)
