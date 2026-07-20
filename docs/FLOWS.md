# HYBLOCK 사용자·운영 플로우

## 1. 공개 콘텐츠

### 홈페이지

1. `/`가 `HomeContent`를 렌더링한다.
2. 소개 가치, 공지 요약, 활동 사진은 `web/lib/site-content.ts`와 `public/Album`에서 가져온다.
3. DB 공지를 읽는 `/notices`, 정적 앨범을 보여주는 `/activities`로 이동한다.

### 공지

1. `/notices`가 `notice` 테이블을 날짜 역순으로 조회한다.
2. 카테고리, 검색어, 페이지 번호를 서버 query에 반영한다.
3. `/notices/[id]`가 본문을 Markdown/GFM으로 렌더링하고 이미지 URL 배열을 표시한다.
4. 관리자는 `/admin/notices`에서 같은 테이블의 공지를 생성·수정·삭제한다.

홈의 공지 요약은 `notice` 테이블과 연결되지 않은 별도 정적 데이터다.

## 2. Google 로그인·회원 등록

```text
/login
  → Supabase Google OAuth
  → /auth/callback
  → linked wallet 존재?
       ├─ 아니오: /wallet-link
       │            → 지갑 연결·메시지 서명
       │            → Supabase user_metadata 갱신
       └─ 예
  → member 존재?
       ├─ 아니오: /signup → member 생성
       └─ 예: 원래 목적지
```

세부 순서:

1. `/login`의 Google 버튼이 `signInWithOAuth({ provider: 'google' })`를 호출한다.
2. `/auth/callback`이 authorization code를 Supabase session으로 교환한다.
3. `user_metadata.wallet_address`가 없으면 `/wallet-link`로 보낸다.
4. 사용자가 Reown 지갑을 연결하고 지갑 연동 메시지에 서명한다.
5. 브라우저가 `wallet_address`, chain ID, 연결 시각, 서명 preview를 Supabase user metadata에 저장한다.
6. `/api/members/by-wallet`로 member 존재 여부를 확인한다.
7. member가 없으면 이름, 전공, 소속, 기수를 받아 `/api/members`로 생성한다.

이 경로는 Supabase 세션을 만들지만 지갑 서버 session cookie를 만들지는 않는다. Google 사용자는 access token으로 개인 출석 QR을 받을 수 있고, 관리자/SBT 민팅에는 별도의 지갑 로그인이 필요하다.

## 3. 지갑 로그인·회원 등록

```text
Reown/Wagmi 연결
  → GET /api/auth/wallet/nonce
  → 지갑 메시지 서명
  → POST /api/auth/wallet/verify
  → viem recoverMessageAddress
  → 활성 member 조회
       ├─ 없음: /signup
       └─ 있음: 7일 httpOnly session cookie
```

1. nonce endpoint가 주소, UUID nonce, 발급/만료 시각을 포함한 메시지를 만든다.
2. HMAC 서명 nonce cookie의 TTL은 5분이다.
3. 서버는 복구된 서명 주소, 메시지 원문, nonce 주소와 만료를 모두 확인한다.
4. 활성 member가 있으면 지갑 주소와 member ID가 든 HMAC session cookie를 7일 동안 설정한다.
5. 없는 주소는 `/signup`에서 member를 만든 뒤 다시 로그인해야 한다.
6. `/api/auth/wallet/logout`은 nonce와 session cookie를 지운다.

현재 헤더의 disconnect 버튼은 6번 endpoint와 연결되지 않고 Wagmi 연결만 해제한다.

## 4. 활동·세션 운영

1. 지갑 로그인된 관리자가 `/admin/activities`에 접근한다.
2. `basic`, `advanced`, `misc`, `external`, `hackathon` 중 타입을 골라 세션을 만든다.
3. `advanced`는 development/business 대상 파트를 반드시 지정한다.
4. 생성·수정·삭제 결과는 `attendance_session`에 반영된다.
5. `/admin/attendance`가 같은 세션 데이터를 출석 운영 대상으로 읽는다.

세션 활성화:

1. 관리자가 세션을 시작한다.
2. 서버가 6자리 `check_in_code`를 생성한다.
3. 상태를 `in_progress`, 시작 시각을 현재 시각, 종료 시각을 기본 20분 뒤로 설정한다.
4. 기본/공용 세션은 단독으로만 활성화할 수 있다.
5. 심화 세션은 파트별 한 개씩 동시에 활성화할 수 있지만 공용 세션과 병행할 수 없다.

## 5. 출석

### 접근과 대상 세션

1. 회원이 `/attendance`에 진입한다.
2. 서버 지갑 세션이 있으면 즉시 허용한다.
3. 없으면 브라우저의 Google session과 linked wallet metadata를 확인한다.
4. Google session만 있고 linked wallet이 없으면 `/wallet-link`로 이동한다.
5. `advanced` 세션은 member 소속과 `target_affiliation`이 같은 경우에만 개인 QR 대상이다.

### 개인 QR

1. 사용자가 활성 세션을 선택한다.
2. `/api/attendance/qr-token`이 지갑 session cookie를 먼저 확인한다.
3. 없으면 Bearer로 전달된 Supabase access token을 검증하고 metadata의 지갑으로 member를 찾는다.
4. 활성 member, 세션 활성 상태, 파트 노출 조건, 기존 출석 여부를 확인한다.
5. 이미 `present`/`late`면 완료 상태만 반환한다.
6. 아니면 Redis에 `attendance:qr:{token}`을 45초 TTL로 저장하고 QR 문자열을 반환한다.
7. 클라이언트는 만료 시 자동으로 새 token을 요청한다.

### 관리자 QR 스캔

1. 관리자가 `/admin/attendance`에서 카메라를 열거나 QR 이미지 파일을 업로드한다.
2. `@paulmillr/qr`가 브라우저 canvas의 이미지를 해석한다.
3. `/api/attendance/qr-scan`이 관리자 지갑 session과 Redis token을 검증한다.
4. token의 세션이 아직 활성인지 다시 확인한다.
5. `attendance_record`를 생성하고 성공한 token을 Redis에서 삭제한다.

### 이름 + 코드 수동 출석

1. 회원이 활성 세션, 이름, 6자리 코드를 제출한다.
2. `/api/check-in`이 세션 상태·만료·코드를 확인한다.
3. 같은 이름의 활성 member가 정확히 하나일 때 출석을 기록한다.
4. 이 endpoint 자체는 로그인 세션을 요구하지 않으며 코드가 인증 수단이다.

현재 수동 출석 UI의 초기 상태 fetch는 관리자 보호된 `/api/events`를 호출하므로 일반 회원 화면에서 실패할 수 있다. API의 코드 검증 로직과 별개로 UI 연결 보완이 필요한 상태다.

### 출석 상태와 종료

- 세션 시작 후 10분 이내: `present`
- 10분 초과 후 활성 창 안: `late`
- 세션 종료 시 기록이 없는 대상 회원: `absent`
- 관리자: `present`, `late`, `absent`, `nonParticipation`으로 수동 변경 가능
- `nonParticipation`은 해당 출석 레코드를 삭제한다.

## 6. 관리자 회원 관리

1. `/admin/members`가 member 목록을 서버에서 읽는다.
2. 현재 화면은 이름, 기수, 소속, 활성 여부, 산출물 여부를 보여준다.
3. 관리자가 산출물 상태를 변경하면 `PATCH /api/members`가 `member.has_assignment`를 갱신한다.
4. 이 값은 assignment 증명 후보와 SBT 조건 현황 표시에 사용된다.

현재 관리자 회원 화면은 `is_active`나 기본 프로필을 수정하지 않는다.

## 7. EAS 증명 발급

### 후보 조회

1. 관리자가 `/admin/certificates`에서 네 증명 타입 중 하나를 고른다.
2. 서버가 `semester_criteria_tracking`의 `is_met=true`를 우선 후보로 읽는다.
3. 원본 fallback 후보를 합친다.
   - attendance: `present`/`late` 기록이 있는 회원
   - external_activity: 외부 활동 레코드가 있는 회원
   - assignment: `member.has_assignment=true`
   - participation_period: 활성 회원, `manual_review_required`
4. 같은 타입의 `attestation`이 이미 있는 회원은 제외한다.

### on-chain 발급과 저장

1. 관리자가 후보와 공개 데이터를 확인한다.
2. UI가 지갑 네트워크, schema UID, issuer 주소를 확인한다.
3. 연결된 지갑이 `HyblockIssuer.issue(...)`를 호출한다.
4. 현재 `isGraduated` 인자는 항상 `false`다.
5. receipt의 EAS `Attested` event에서 UID를 파싱한다.
6. 관리자 보호 API `/api/certificates/save-attestation`이 UID와 해시, 공개 데이터를 `attestation`에 저장한다.

웹 관리자 세션과 on-chain issuer admin은 별개다. `member.is_admin=true`여도 연결 지갑이 `HyblockIssuer.admin`이 아니면 트랜잭션이 실패한다.

## 8. SBT 수료증

### 조회와 자격

1. 사용자가 `/mypage`에서 현재 연결된 지갑의 member와 자격을 조회한다.
2. 화면은 원본/집계 기준으로 충족한 조건과 실제 attestation 타입을 함께 표시한다.
3. 최종 `eligible`은 `attestation` 네 타입이 모두 존재할 때만 true다.
4. `sbt_issuance`가 이미 있으면 재발급을 막는다.

### 서버 민팅

1. 사용자가 `POST /api/certificates/mint-sbt`를 호출한다.
2. 서버가 지갑 session cookie에서 member와 지갑 주소를 다시 확정한다.
3. 네 attestation과 기존 발급 이력을 다시 확인한다.
4. 서버 minter key가 `HyblockSBT.safeMint(member.wallet_address, metadataUri)`를 호출한다.
5. receipt의 `Transfer` event에서 token ID를 얻는다.
6. `sbt_issuance`에 member ID, token ID, 컨트랙트, transaction hash, 민팅 시각을 저장한다.

metadata URI는 `${HYBLOCK_SBT_METADATA_BASE_URI}/{memberId}.json` 형식이다. 실제 JSON 생성·업로드는 이 저장소에서 수행하지 않는다.

## 9. 관리자 인증 공통 흐름

1. 보호 layout과 모든 관리자 Route Handler가 지갑 session cookie를 읽는다.
2. 세션 만료, member 비활성, 주소/ID 불일치이면 로그인으로 보낸다.
3. `member.is_admin=false`면 `/forbidden` 또는 403을 반환한다.
4. 관리자 CRUD, QR 스캔, 증명 후보/저장 API가 같은 검사를 공유한다.

레거시 `/dashboard`의 localStorage 비밀번호는 서버 인가 수단이 아니다. `/api/events`가 별도의 관리자 지갑 세션을 요구하므로 운영 진입점으로 사용하지 않는다.
