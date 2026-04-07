# HYBLOCK Flows

## 1. 문서 목적

이 문서는 HYBLOCK의 실제 사용자 플로우와 운영 플로우를 단계별로 정리한다.

핵심 대상:
- 출석 체크
- 관리자 증명 발급
- 학회원 SBT 발급
- 로그인 및 세션

## 2. 출석 체크 플로우

### 2-1. 회원 진입

1. 회원이 `/attendance`에 진입한다.
2. 페이지는 로그인 상태를 확인한다.
3. 허용 조건:
   - wallet session 존재
   - 또는 Google OAuth 세션 존재
4. 둘 다 없으면 `/login?redirect=/attendance`로 이동한다.

### 2-2. 개인 QR 발급

1. 회원이 출석 페이지에서 세션을 선택한다.
2. `PersonalAttendanceQrCard`가 `/api/attendance/qr-token`을 호출한다.
3. 서버는 로그인 상태를 확인한다.
4. 서버는 로그인 사용자를 `member` 레코드와 매핑한다.
5. 활성 세션인지 확인한다.
6. Redis에 짧은 TTL의 QR 토큰을 저장한다.
7. 클라이언트는 QR을 렌더링한다.

사용 저장소:
- `member`
- `attendance_session`
- Redis

### 2-3. 운영진 스캔

1. 운영진이 관리자 출석 화면에서 QR을 스캔한다.
2. `/api/attendance/qr-scan`이 호출된다.
3. 서버는 Redis 토큰을 검증한다.
4. 활성 세션과 일치하는지 확인한다.
5. `attendance_record`에 출석을 기록한다.
6. 토큰을 즉시 삭제한다.

결과:
- 출석 원본 데이터는 `attendance_record`에 남는다.

## 3. 관리자 증명 발급 플로우

### 3-1. 후보 조회

1. 관리자가 `/admin/certificates`에 진입한다.
2. 서버는 증명 타입별 후보를 조회한다.
3. 조회 순서:
   - `semester_criteria_tracking`
   - raw 활동 데이터 fallback
4. 이미 같은 타입 attestation이 있는 회원은 제외한다.

증명 타입:
- `attendance`
- `external_activity`
- `assignment`
- `participation_period`

### 3-2. 증명 발급

1. 관리자가 발급 대상을 선택한다.
2. 프론트가 `HyblockIssuer.issue(...)`를 호출한다.
3. 트랜잭션이 Sepolia에서 처리된다.
4. `Attested` 이벤트에서 EAS UID를 읽는다.
5. `/api/certificates/save-attestation`이 `attestation` 테이블에 저장한다.

저장 데이터:
- `member_id`
- `attestation_type`
- `eas_uid`
- `personal_data_hash`
- `revealed_data`

### 3-3. 관리자 확인

1. 발급 완료 후 해당 항목은 `기발급 증명` 목록으로 이동한다.
2. 운영자는 관리자 화면에서 발급 시각과 UID를 다시 확인할 수 있다.

## 4. 학회원 SBT 발급 플로우

### 4-1. 자격 확인

1. 학회원이 `/mypage`에 진입한다.
2. 프론트는 현재 연결된 지갑 주소 기준으로:
   - 회원 정보
   - SBT 자격
   를 조회한다.
3. 서버는 `attestation` 기준으로 4종 증명이 모두 있는지 확인한다.
4. 서버는 `sbt_issuance`로 기존 발급 여부를 확인한다.

필수 증명:
- `attendance`
- `external_activity`
- `assignment`
- `participation_period`

### 4-2. 민팅 요청

1. 자격이 충족되면 학회원이 발급 버튼을 누른다.
2. 프론트는 `/api/certificates/mint-sbt`를 호출한다.
3. 서버는 wallet session을 다시 확인한다.
4. 서버는 세션 지갑 주소와 member 연결 상태를 다시 확인한다.
5. 서버는 attestation 4종과 기존 발급 여부를 다시 확인한다.

### 4-3. 온체인 민팅

1. 서버는 owner private key를 사용해 `HyblockSBT.safeMint(...)`를 호출한다.
2. receipt에서 `Transfer` 이벤트를 읽는다.
3. `tokenId`를 얻는다.
4. `sbt_issuance`에 저장한다.

저장 데이터:
- `member_id`
- `token_id`
- `contract_address`
- `transaction_hash`
- `minted_at`

## 5. 로그인 플로우

### 5-1. Google OAuth

1. 사용자가 `/login`에서 Google 로그인을 누른다.
2. Supabase Auth가 Google provider로 이동시킨다.
3. Google 로그인 후 `/auth/callback`으로 돌아온다.
4. 콜백 페이지가 `code -> session` 교환을 수행한다.
5. 목적 페이지로 이동한다.

주의:
- 현재 Google 로그인은 Supabase Auth 세션을 만든다.
- 하지만 `member` 테이블과 자동 매핑되는 로직은 아직 완전히 닫히지 않았다.

### 5-2. 지갑 로그인

1. 클라이언트가 nonce 요청
2. 서버가 nonce cookie 발급
3. 사용자가 지갑 서명
4. 서버가 서명 검증
5. `member.wallet_address` 기반으로 회원 조회
6. wallet session cookie 발급

## 6. 플로우별 핵심 저장 위치

### 출석

- Redis: QR token
- Supabase: `attendance_record`

### 증명

- On-chain: EAS attestation
- Supabase: `attestation`

### SBT

- On-chain: `HyblockSBT`
- Supabase: `sbt_issuance`

## 7. 현재 운영상 중요한 점

- 관리자 증명 발급은 wallet session 기반 관리자 계정이 필요하다.
- SBT 발급도 wallet session 기반으로 다시 검증한다.
- Google 로그인만으로 관리자 기능이나 SBT 발급이 완전히 닫히는 구조는 아니다.
- 증명 발급과 SBT 발급은 분리된 단계다.

## 8. 관련 문서

- [아키텍처](/home/jaeman/Codes/HYBLOCK-WEB/docs/ARCHITECTURE.md)
- [운영 가이드](/home/jaeman/Codes/HYBLOCK-WEB/docs/OPERATIONS.md)
- [지갑 세션 및 QR 구조](/home/jaeman/Codes/HYBLOCK-WEB/web/docs/wallet-session-and-qr-attendance.md)
