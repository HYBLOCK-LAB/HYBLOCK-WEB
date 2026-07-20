# 현재 기술 스택

이 문서는 `web/package.json`, 실제 import, 설정 파일, Route Handler, SQL 마이그레이션, Solidity 소스를 대조한 결과다. 패키지가 설치되어 있다는 이유만으로 사용 중이라고 분류하지 않는다.

## 1. Web 런타임

| 영역 | 현재 사용 기술 | 실제 역할 |
| --- | --- | --- |
| 프레임워크 | Next.js `16.2`, App Router | Server/Client Component, 페이지 라우팅, Route Handlers |
| UI | React `19.2`, React DOM | 사용자·관리자 인터페이스 |
| 언어 | TypeScript `6.0` | 웹 소스와 설정 타입 검사 |
| 스타일 | Tailwind CSS `4.2`, `@tailwindcss/postcss`, PostCSS, Autoprefixer | 유틸리티 CSS와 `globals.css`의 `@theme` 토큰 |
| 아이콘 | Lucide React, Font Awesome CDN | React 아이콘과 푸터 소셜 아이콘 |
| Markdown | `react-markdown`, `remark-gfm` | 공지 상세 본문 렌더링 |
| QR 생성 | `qrcode.react` | 개인 출석 QR과 관리자 공유 QR 렌더링 |
| QR 해석 | `@paulmillr/qr` | 카메라 프레임·업로드 이미지 QR 디코딩 |

Tailwind v4의 실제 스타일 진입점과 토큰 기준은 `web/app/globals.css`의 `@import "tailwindcss"`와 `@theme`이다. `web/tailwind.config.ts`에는 이전 색상 값이 남아 있고 `@config`로 연결되어 있지 않으므로 현재 문서의 기준으로 사용하지 않는다.

일부 컴포넌트는 아직 `primaryContainer`, `font-display`, `shadow-ambient`처럼 이전 config에서 정의한 utility 이름을 사용한다. Tailwind v4 CSS 진입점에서 이 config를 명시적으로 로드하지 않으므로 해당 utility 생성은 정적 설정상 보장되지 않는다. 토큰 이름을 `@theme` 기준으로 이관하거나 config를 명시적으로 연결한 뒤 시각 회귀 검증이 필요하다.

## 2. 인증·지갑·클라이언트 상태

| 기술 | 사용 위치 | 역할 |
| --- | --- | --- |
| Supabase Auth | 브라우저 클라이언트, `/auth/callback` | Google OAuth와 브라우저 세션 |
| Reown AppKit | 전역 provider, 지갑 UI | 지갑 연결/계정 모달 |
| Wagmi | provider와 지갑 컴포넌트 | 연결 상태, 메시지 서명, 컨트랙트 쓰기 |
| viem | 서버·클라이언트 | 서명 주소 복구, ABI 인코딩, 로그 파싱, RPC, SBT 민팅 |
| TanStack Query | 전역 provider | Wagmi/AppKit의 비동기 상태 기반 |
| Zustand | `language-store`, `wallet-session-store` | 언어와 지갑 연결 UI 상태 |
| HMAC 서명 쿠키 | `web/lib/wallet-session.ts` | nonce 5분, 지갑 서버 세션 7일 |

서버 인가에는 Wagmi/Zustand 연결 상태를 사용하지 않는다. 관리자 API·페이지와 SBT 민팅은 `httpOnly` 지갑 세션 쿠키를 다시 검증한다.

## 3. 데이터·인프라

| 기술 | 현재 역할 |
| --- | --- |
| Supabase Postgres | 회원, 세션, 출석, 외부 활동, 조건 집계, EAS UID, SBT 발급 이력, 공지 저장 |
| Supabase Auth | Google OAuth 사용자와 `user_metadata.wallet_address` 저장 |
| Upstash Redis REST API | 45초 개인 출석 QR 토큰 저장과 1회 소비 |
| Next.js Route Handlers | 인증 검증, 관리자 CRUD, QR 처리, 증명 이력 저장, 서버 SBT 민팅 |

Upstash SDK는 설치하지 않았다. `web/lib/upstash-redis.ts`가 REST endpoint에 `fetch`로 Redis 명령을 보낸다.

현재 런타임이 접근하는 Supabase 테이블은 다음과 같다.

- `member`
- `attendance_session`
- `attendance_record`
- `external_activity`
- `semester_criteria_tracking`
- `attestation`
- `sbt_issuance`
- `notice`

## 4. 블록체인

| 기술 | 현재 역할 |
| --- | --- |
| Solidity `0.8.24` | 컨트랙트 구현 |
| Foundry | 빌드, 테스트, 배포 스크립트 |
| OpenZeppelin Contracts v5 | ERC-721 URI storage, Ownable |
| Ethereum Attestation Service | 활동 조건별 on-chain attestation |
| ERC-5192 형태의 SBT | 양도 불가능 수료증 |
| JSON-RPC | 증명 트랜잭션 확인과 서버 SBT 민팅 |

기본 운영 대상은 Sepolia(`11155111`)다. Web3 지갑 UI는 Mainnet과 Sepolia를 등록하지만, SBT 결과 링크와 기본 체인 설정은 Sepolia를 전제로 한다. `RPC_URL`은 특정 공급자에 종속되지 않으며 `.env.example`의 Infura URL은 예시다.

## 5. 실제 연결 상태

| 요소 | 상태 | 근거 |
| --- | --- | --- |
| `HyblockIssuer` | 사용 중 | 관리자 UI가 `issue(...)`를 직접 호출 |
| EAS | 사용 중 | receipt의 `Attested` 이벤트에서 UID를 추출 |
| `HyblockSBT` | 사용 중 | 서버가 `safeMint(...)` 호출 |
| `ActivityTracker` | 웹 미연결 | 컨트랙트·배포 코드는 있으나 web import/API/동기화 작업 없음 |
| `HyblockResolver` | 웹 미연결 | 컨트랙트는 있으나 UI는 항상 `isGraduated=false`로 증명 발급 |
| `assignment` 테이블 | 런타임 미사용 | 웹 쿼리는 `member.has_assignment`만 사용 |
| 이메일/비밀번호 가입 UI | 라우트 미연결 | `EmailAuthForm.tsx`는 존재하지만 `/login`, `/signup`에서 렌더링하지 않음 |

## 6. 설치되어 있지만 직접 사용하지 않는 패키지

다음 패키지는 `web/package.json`의 직접 의존성이지만 애플리케이션 소스에서 import하지 않는다.

- `@base-org/account`
- `@coinbase/wallet-sdk`
- `@metamask/connect-evm`
- `@walletconnect/ethereum-provider`

지갑 연결은 Reown AppKit, Wagmi와 `@wagmi/connectors`를 통해 구성된다. 위 패키지는 향후 기능을 위한 명시적 의존성인지 확인한 뒤 제거 여부를 결정해야 한다.

반대로 현재 소스는 `@wagmi/connectors`와 `@paulmillr/qr`를 직접 import하지만 두 패키지는 `package.json`에 직접 선언되지 않고 lockfile의 간접 의존성에 기대고 있다. 재현 가능한 설치를 위해 직접 의존성으로 승격할지 정리할 필요가 있다.

## 7. 환경변수 분류

### 브라우저 공개값

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_REOWN_PROJECT_ID`
- `NEXT_PUBLIC_EAS_SCHEMA`
- `NEXT_PUBLIC_HYBLOCK_ISSUER_ADDRESS`
- `NEXT_PUBLIC_HYBLOCK_SBT_ADDRESS`

### 서버 비공개값

- `SUPABASE_SERVICE_ROLE_KEY`
- `WALLET_SESSION_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RPC_URL`
- `HYBLOCK_SBT_ADDRESS`
- `HYBLOCK_SBT_MINTER_PRIVATE_KEY`
- `HYBLOCK_CHAIN_ID`
- `HYBLOCK_SBT_METADATA_BASE_URI`
- `DEFAULT_SESSION_COHORT`
- `ACTIVE_SESSION_DURATION_MINUTES`

호환 fallback으로 `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`, `AUTH_SESSION_SECRET`, `PRIVATE_KEY`도 코드가 인식한다. 신규 환경은 위의 기본 변수명을 사용하고, `PRIVATE_KEY`는 Web보다 컨트랙트 배포 환경에만 두는 것을 권장한다.

### 컨트랙트 배포값

- `PRIVATE_KEY`
- `RPC_URL`
- `EAS_ADDRESS`
- `MIN_SESSION_COUNT`
