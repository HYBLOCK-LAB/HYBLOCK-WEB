# 운영 및 배포 가이드

## 1. 사전 준비

- Node.js와 npm
- Supabase 프로젝트(Postgres + Auth)
- Google OAuth provider 설정
- Reown project ID
- Upstash Redis REST database
- Sepolia RPC endpoint와 운영 지갑
- 컨트랙트 작업 시 Foundry와 git submodule

현재 저장소에는 CI workflow, Web 테스트 스크립트, 자동 DB migration runner가 없다. 배포 환경에서 별도로 구성해야 한다.

## 2. Web 로컬 실행

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

프로덕션 확인:

```bash
npm run build
npm run start
```

`npm run lint`는 현재 `next lint`를 호출한다. Next.js 16에서 해당 명령을 별도 ESLint 구성으로 교체하기 전까지 신뢰할 수 있는 검증 명령으로 보지 않는다.

## 3. Supabase 설정

### 마이그레이션 적용 순서

SQL editor나 별도 migration 도구에서 다음 순서로 적용한다.

1. `001_create_personal_info.sql`
2. `002_create_session.sql`
3. `003_create_attendance.sql`
4. `004_create_external_activity.sql`
5. `005_create_assignment.sql`
6. `006_create_semester_criteria_tracking.sql`
7. `007_create_attestation.sql`
8. `008_create_sbt_issuance.sql`
9. `008_add_check_in_code_to_attendance_session.sql`
10. `009_create_notice.sql`
11. `010_add_is_admin_to_member.sql`
12. `011_add_target_affiliation_to_attendance_session.sql`
13. `012_add_has_assignment_to_member.sql`

`002`에 이미 `check_in_code`가 포함되어 있어 두 번째 `008`은 신규 설치에서는 사실상 idempotent 보정 migration이다. 두 migration이 같은 번호를 공유하므로 파일명 정렬만 믿지 말고 위 순서를 사용한다.

`assignment` 테이블은 스키마에는 생성되지만 현재 웹은 접근하지 않는다. 산출물 운영값은 `member.has_assignment`다.

### Google OAuth

1. Supabase Auth에서 Google provider를 활성화한다.
2. Google Cloud에 Supabase callback URL을 등록한다.
3. 애플리케이션 배포 origin에서 `/auth/callback`으로 돌아올 수 있도록 Supabase redirect allow list를 설정한다.
4. 로그인 후 `user_metadata.wallet_address`를 기록할 수 있는지 확인한다.

### 관리자 준비

1. 관리자로 사용할 회원의 `wallet_address`를 정확히 저장한다.
2. `is_active=true`, `is_admin=true`로 설정한다.
3. 해당 지갑으로 `/login`에서 nonce 서명을 완료한다.
4. EAS 발급 지갑이라면 같은 주소가 `HyblockIssuer.admin`인지도 확인한다.

## 4. Web 환경변수

### 필수 공통

| 변수 | 용도 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 브라우저·서버 Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 브라우저 Auth key |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 DB 읽기/쓰기 |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | AppKit 지갑 연결 |
| `WALLET_SESSION_SECRET` | nonce/session cookie HMAC |

`WALLET_SESSION_SECRET`은 충분히 긴 랜덤값을 사용하고 브라우저에 노출하지 않는다.

소스는 이전 환경을 위해 `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`, `AUTH_SESSION_SECRET` fallback도 인식한다. 신규 배포는 표의 기본 변수명을 사용한다.

### 출석

| 변수 | 기본값/용도 |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Redis bearer token |
| `DEFAULT_SESSION_COHORT` | 새 세션의 기본 기수, 기본 `1` |
| `ACTIVE_SESSION_DURATION_MINUTES` | 활성 출석 창, 기본 `20`분 |

QR TTL 45초와 지각 기준 10분은 현재 코드 상수이며 환경변수로 조정하지 않는다.

### EAS·SBT

| 변수 | 용도 |
| --- | --- |
| `NEXT_PUBLIC_EAS_SCHEMA` | 등록된 EAS schema UID |
| `NEXT_PUBLIC_HYBLOCK_ISSUER_ADDRESS` | 클라이언트 증명 발급 컨트랙트 |
| `HYBLOCK_SBT_ADDRESS` | 서버 SBT 민팅 컨트랙트 |
| `NEXT_PUBLIC_HYBLOCK_SBT_ADDRESS` | 브라우저 공개 fallback/표시용 주소 |
| `RPC_URL` | 서버 JSON-RPC endpoint |
| `HYBLOCK_SBT_MINTER_PRIVATE_KEY` | `HyblockSBT` owner private key |
| `HYBLOCK_CHAIN_ID` | 기본 `11155111` |
| `HYBLOCK_SBT_METADATA_BASE_URI` | token URI base, 끝 slash 없이 설정 |

private key는 로그, 클라이언트 변수, 저장소에 넣지 않는다. 운영에서는 최소 권한 전용 지갑과 secret manager를 사용한다.

## 5. 컨트랙트 빌드·배포

```bash
git submodule update --init --recursive
cd eas
cp .env.example .env
forge build
forge test
forge script script/Deploy.s.sol --rpc-url "$RPC_URL"
forge script script/Deploy.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$PRIVATE_KEY"
```

`Deploy.s.sol`은 다음 순서로 배포한다.

1. `ActivityTracker`
2. `HyblockIssuer`
3. `HyblockResolver`
4. `HyblockSBT`

배포 뒤:

1. `address walletAddress,bytes32 personalDataHash,string attestationType,string revealedData,bool isGraduated` 스키마를 EAS Schema Registry에 등록한다.
2. Resolver를 사용할 계획이면 schema 등록 시 배포된 `HyblockResolver` 주소를 연결한다.
3. 반환된 schema UID를 `HyblockIssuer.setSchemaUID`로 설정한다.
4. Web의 schema/issuer/SBT 주소를 갱신한다.
5. 서버 minter 주소가 `HyblockSBT.owner()`와 같은지 확인한다. 다르면 ownership을 명시적으로 이전해야 한다.

현재 Web UI는 `isGraduated=false`만 발급하므로 ActivityTracker 동기화가 EAS 개별 증명 발급의 선행 조건은 아니다.

## 6. 기능별 운영 점검

### 로그인·회원 가입

1. Google 로그인 후 callback이 동작하는지 확인한다.
2. linked wallet이 없을 때 `/wallet-link`로 이동하는지 확인한다.
3. member가 없을 때 `/signup`으로 이동하는지 확인한다.
4. 등록 member의 지갑 로그인 nonce와 session cookie가 정상 발급되는지 확인한다.
5. 로그아웃은 `/api/auth/wallet/logout`까지 호출되는지 별도로 확인한다. 현재 헤더 disconnect에는 연결되어 있지 않다.

### 공지·활동

1. 로컬 개발 중 Supabase 환경 변수가 없으면 `/notices`가 로컬 예시 공지와 안내 문구를 표시한다.
2. 실제 DB를 점검할 때는 `.env.local`에 Supabase 환경 변수를 설정하고 `HYBLOCK_USE_LOCAL_NOTICE_FIXTURES=0`으로 둔다.
3. DB 연결 실패는 빈 목록이 아니라 오류 안내로 표시되는지 확인한다.
4. 관리자 공지 CRUD 후 `/notices`에서 결과를 확인한다.
5. 홈 공지 요약은 자동 반영되지 않는다는 점을 확인한다.
6. 활동 생성 시 타입, 기수, 날짜와 심화 세션 대상 파트를 확인한다.
7. `/activities` 앨범은 DB 활동과 자동 연동되지 않는다.

### 출석

1. 관리자 지갑 session으로 `/admin/attendance`에 들어간다.
2. 세션을 활성화하고 6자리 코드와 20분 만료 시각을 확인한다.
3. 회원의 소속에 맞는 세션만 개인 QR로 노출되는지 확인한다.
4. 45초 QR을 카메라와 이미지 업로드 양쪽에서 스캔한다.
5. 같은 QR 재사용이 차단되는지 확인한다.
6. 10분 전후의 `present`/`late` 판정과 종료 후 `absent` 생성을 확인한다.
7. 수동 코드 출석 UI는 일반 회원에서 `/api/events` 401 문제가 있는지 확인한다.

### EAS 증명

1. Web 관리자 지갑 session을 만든다.
2. 발급 지갑이 `HyblockIssuer.admin`인지 확인한다.
3. 네 타입 후보 조회에서 tracking과 fallback 결과를 확인한다.
4. 트랜잭션 완료 뒤 EAS UID가 `attestation`에 저장되는지 확인한다.
5. on-chain 성공/DB 저장 실패가 발생하면 UID를 운영자가 수동 복구할 절차를 준비한다.

### SBT

1. member에 네 타입 `attestation`이 모두 있는지 확인한다.
2. 지갑 server session과 member 지갑이 일치하는지 확인한다.
3. `HYBLOCK_SBT_ADDRESS`, RPC, chain ID, minter key, owner를 확인한다.
4. 민팅 후 `Transfer` event의 token ID와 `sbt_issuance`를 대조한다.
5. metadata URI에 실제 JSON이 배포되어 있는지 별도로 확인한다.

## 7. 장애 확인 순서

### 개인 QR 발급 실패

1. member 활성 상태와 지갑 주소
2. Google access token 또는 지갑 session cookie
3. 세션 `in_progress`와 `session_end_time`
4. 심화 세션 target affiliation
5. Upstash URL/token과 REST 응답

### 관리자 401/403

1. Wagmi 연결 표시가 아니라 `hyblock_wallet_session` cookie 존재 여부
2. member wallet 주소, 활성 여부
3. `member.is_admin`
4. `WALLET_SESSION_SECRET` 배포 환경 일치 여부

### 증명 후보 없음

1. 같은 타입이 이미 발급됐는지
2. `semester_criteria_tracking.is_met`
3. 타입별 fallback 원본
4. member wallet 주소 존재 여부

### SBT 민팅 실패

1. 네 attestation 존재 여부
2. 기존 `sbt_issuance`
3. server session member와 대상 지갑
4. RPC/chain/contract address
5. minter key와 on-chain owner
6. receipt event와 DB insert 오류

## 8. 현재 검증 상태

이번 문서 정리 환경에는 `web/node_modules`와 Foundry 실행 파일이 없어 `npm run build`와 `forge test`를 완료하지 못했다. 소스 import, package manifest/lockfile, SQL, 컨트랙트와 라우트 간 정적 대조를 기준으로 작성했다.

의존성을 설치한 환경에서 최소한 다음을 실행한다.

```bash
cd web
npm install
npm run build

cd ../eas
forge build
forge test
```

## 9. 관련 문서

- [아키텍처](ARCHITECTURE.md)
- [기술 스택](TECH_STACK.md)
- [플로우](FLOWS.md)
- [DB 스키마](../database/docs/Schema.md)
- [컨트랙트](../eas/docs/contracts.md)
