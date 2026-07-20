# HYBLOCK 아키텍처

## 1. 시스템 개요

HYBLOCK는 하나의 Next.js 애플리케이션이 공개 사이트, 회원 영역, 관리자 운영 도구와 서버 API를 함께 제공하고, Supabase·Upstash Redis·EVM 컨트랙트를 연결하는 구조다.

```text
Browser
  ├─ 공개 페이지 / 정적 콘텐츠
  ├─ Google OAuth (Supabase Auth)
  ├─ Reown AppKit + Wagmi 지갑 연결
  ├─ 회원 출석·마이페이지
  └─ 관리자 운영 화면
          │
          ▼
Next.js 16 App Router
  ├─ Server / Client Components
  ├─ Route Handlers (/api/*)
  ├─ HMAC 지갑 nonce·session cookie
  ├─ 관리자 권한 검사
  └─ 서버 SBT 민팅
       │             │              │
       ▼             ▼              ▼
Supabase         Upstash Redis     EVM JSON-RPC
Postgres/Auth    45초 QR token     EAS + HYBLOCK contracts
```

## 2. 저장소 경계

### `web`

- 화면 렌더링과 라우팅
- Google OAuth와 지갑 서명 로그인
- 회원 가입과 지갑-회원 매핑
- 공지·활동·출석 관리자 CRUD
- EAS 증명 발급 UI와 발급 이력 저장
- SBT 자격 재검증과 서버 민팅

### `database`

- Supabase Postgres용 순차 SQL 마이그레이션
- 회원, 세션, 출석, 활동, 증명, SBT, 공지 스키마
- 별도 ORM이나 애플리케이션 내 migration runner는 없다.

### `eas`

- `ActivityTracker`, `HyblockIssuer`, `HyblockResolver`, `HyblockSBT`
- Foundry 배포 스크립트와 Resolver 중심 테스트
- 웹 런타임과 직접 연결된 컨트랙트는 현재 `HyblockIssuer`, `HyblockSBT`다.

## 3. Web 라우트 영역

| 영역 | 주요 라우트 | 데이터 소스 |
| --- | --- | --- |
| 공개 | `/`, `/about`, `/bylaws`, `/activities`, 정책 페이지 | 대부분 `site-content.ts`, `text-content.ts`, `public/Album` |
| 공지 | `/notices`, `/notices/[id]` | Supabase `notice`; 상세는 Markdown/GFM |
| 인증 | `/login`, `/auth/callback`, `/wallet-link`, `/signup` | Supabase Auth, Reown/Wagmi, `member` |
| 회원 | `/attendance`, `/mypage` | Supabase 출석/회원 데이터, Redis QR, SBT API |
| 관리자 | `/admin/*` | 지갑 세션 + `member.is_admin`, Supabase, EAS |

홈 화면의 공지 요약과 활동 갤러리는 정적 콘텐츠다. `/notices` 목록과 상세만 `notice` 테이블을 읽는다. `/activities`도 현재 DB 세션 목록이 아니라 정적 앨범을 보여준다.

## 4. 인증과 인가 경계

HYBLOCK에는 서로 목적이 다른 세 가지 상태가 있다.

| 상태 | 저장 위치 | 서버 인가에 사용 | 주요 용도 |
| --- | --- | --- | --- |
| Google 세션 | Supabase Auth browser storage | Bearer token을 검증하는 QR 발급에서 사용 | Google 로그인, 지갑 연동 사용자 출석 |
| 지갑 서버 세션 | HMAC 서명 `httpOnly` cookie | 사용 | 관리자 페이지/API, SBT 민팅, QR 발급 |
| 지갑 연결 UI 상태 | Wagmi + Zustand | 사용하지 않음 | 주소/체인 표시, 서명·트랜잭션 UI |

### Google 경로

1. Supabase Google OAuth 세션을 만든다.
2. `user_metadata.wallet_address`가 없으면 `/wallet-link`에서 지갑 메시지에 서명한다.
3. 서명 결과와 지갑 주소를 Supabase user metadata에 저장한다.
4. 해당 주소의 `member`가 없으면 `/signup`에서 member 레코드를 만든다.
5. 출석 QR API는 Google access token을 검증하고 metadata의 주소로 member를 찾는다.

Google 지갑 연동 서명은 현재 브라우저에서 생성한 뒤 Supabase metadata를 갱신하는 용도다. 별도 서버 endpoint가 이 서명을 검증하지는 않는다.

### 지갑 로그인 경로

1. 서버가 주소별 nonce 메시지와 5분 cookie를 발급한다.
2. 사용자가 메시지를 서명한다.
3. 서버가 viem으로 서명 주소, nonce, 만료를 검증한다.
4. 활성 `member.wallet_address`와 일치하면 7일 `httpOnly` session cookie를 발급한다.
5. 관리자 접근 시 매 요청마다 member를 다시 읽고 `is_active`, `is_admin`을 확인한다.

## 5. 데이터 아키텍처

```text
member
  ├─ attendance_record ── attendance_session
  ├─ external_activity ── attendance_session
  ├─ semester_criteria_tracking
  ├─ attestation
  └─ sbt_issuance

notice (독립 공개 콘텐츠)
```

현재 런타임 기준 핵심 원칙은 다음과 같다.

- 회원의 기준 식별자는 `member.id`, 외부 지갑 식별자는 `member.wallet_address`다.
- 세션/활동 관리자 화면과 출석 화면은 모두 `attendance_session`을 공유한다.
- 출석 원본은 `attendance_record`, 외부 활동 원본은 `external_activity`다.
- 산출물 충족 여부는 `member.has_assignment`다. `assignment` 테이블은 웹에서 읽지 않는다.
- 집계 결과는 `semester_criteria_tracking`, on-chain 발급 결과는 `attestation`, SBT 결과는 `sbt_issuance`에 저장한다.
- 공지는 `notice`에 저장하지만 홈 공지 요약은 정적 배열이다.

서버 Supabase client는 service role/secret key를 우선 사용한다. 없으면 공개 key까지 fallback하는 코드가 있으나, 관리자 쓰기 기능을 정상 운영하려면 서버 전용 key를 설정해야 한다.

## 6. 출석 서브시스템

```text
관리자 활동 관리
  └─ attendance_session 생성
          │
관리자 출석 관리
  ├─ status=in_progress
  ├─ 6자리 check_in_code
  └─ 기본 20분 session_end_time
          │
          ├───────────────┐
          ▼               ▼
개인 QR 발급          이름 + 코드 입력
  ├─ Google/지갑 인증     │
  ├─ 파트 노출 검사       │
  └─ Redis 45초 token     │
          │               │
관리자 QR 스캔            │
          └───────┬───────┘
                  ▼
          attendance_record
          present / late / absent
```

- 세션 시작 후 10분 이내 체크인은 `present`, 이후에는 `late`다.
- 세션 종료 시 대상 활성 회원 중 기록이 없는 회원을 `absent`로 추가한다.
- 기본/공용 세션은 다른 활성 세션과 동시에 열 수 없다.
- `advanced` 세션은 대상 파트를 지정해야 하며 development/business 한 개씩 동시에 열 수 있다.
- QR token에는 member ID, 이름, 세션 이름과 만료 시각을 저장하고 성공 후 삭제한다.

## 7. 증명과 SBT 아키텍처

```text
Supabase 원본/집계
  ├─ attendance_record
  ├─ external_activity
  ├─ member.has_assignment
  └─ semester_criteria_tracking
          │ 후보 조회
          ▼
관리자 /admin/certificates
  └─ 연결 지갑이 HyblockIssuer.issue(...) 호출
          │
          ▼
EAS Attested event ── UID ──> Supabase attestation
                                      │ 4종 UID 확인
                                      ▼
회원 /mypage ──> POST mint-sbt ──> 서버 minter wallet
                                      │
                                      ▼
                              HyblockSBT.safeMint(...)
                                      │
                                      ▼
                              Supabase sbt_issuance
```

관리자 웹은 다음 네 타입을 발급한다.

- `attendance`
- `external_activity`
- `assignment`
- `participation_period`

현재 UI는 네 타입 모두 `isGraduated=false`로 `HyblockIssuer.issue`를 호출한다. 따라서 `HyblockResolver`의 `ActivityTracker` 기반 수료 조건 분기는 웹 발급 플로우에서 실행되지 않는다.

SBT 민팅 가능 여부는 원본 활동이 아니라 `attestation` 네 타입이 모두 저장됐는지로 결정한다. 화면에는 원본/집계 기준 충족 상태도 표시하지만, `eligible`의 최종 기준은 네 attestation과 미발급 상태다.

## 8. 컨트랙트 연결 상태

- `HyblockIssuer`: 관리자 연결 지갑이 직접 호출한다. 웹의 `member.is_admin`과 컨트랙트의 `admin`은 별도 조건이므로 둘 다 충족해야 한다.
- `HyblockSBT`: `onlyOwner`다. 서버 minter private key가 컨트랙트 owner여야 한다.
- `ActivityTracker`: 배포 스크립트에는 포함되지만 Supabase 데이터를 `syncData`하는 웹/배치 작업이 없다.
- `HyblockResolver`: 스키마 등록 시 연결할 수 있으나 현재 웹 발급은 `isGraduated=false`만 보낸다.

## 9. 현재 제약과 기술 부채

- `/api/members`의 회원 생성은 지갑 서명 세션이나 Google access token을 요구하지 않는다.
- `/api/certificates/sbt-eligibility`와 `/api/members/by-wallet`은 주소만 알면 조회할 수 있는 공개 API다.
- 헤더의 지갑 disconnect는 Wagmi 연결만 끊고 `/api/auth/wallet/logout`을 호출하지 않아 서버 session cookie가 남을 수 있다.
- 공개 수동 출석 컴포넌트가 관리자 보호된 `/api/events`를 조회하므로 비관리자 브라우저에서 상태 조회가 실패할 수 있다.
- `/dashboard`에는 클라이언트 하드코딩 비밀번호가 남아 있지만 `/api/events`는 지갑 관리자 세션을 요구한다. 현재 관리자 진입점은 `/admin`이다.
- 내비게이션의 `/apply` 링크에 대응하는 페이지가 없다.
- 홈 공지/활동과 DB 공지/세션 데이터가 자동으로 동기화되지 않는다.
- 온체인 트랜잭션 성공 후 Supabase 저장이 실패하면 자동 재처리 작업이 없다.
- SBT metadata URI 문자열은 만들지만 이 저장소에 metadata JSON 업로드 파이프라인은 없다.

## 10. 관련 문서

- [기술 스택](TECH_STACK.md)
- [사용자·운영 플로우](FLOWS.md)
- [운영 가이드](OPERATIONS.md)
- [DB 스키마](../database/docs/Schema.md)
- [컨트랙트](../eas/docs/contracts.md)
