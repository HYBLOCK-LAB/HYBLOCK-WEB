# HYBLOCK Flows

## 1. 출석 체크

1. 사용자가 로그인 또는 지갑 세션을 확보한다.
2. 출석 페이지에서 개인 QR을 발급한다.
3. 서버는 Redis에 짧은 TTL 토큰을 저장한다.
4. 운영자가 관리자 출석 화면에서 QR을 스캔한다.
5. 서버가 토큰을 검증하고 `attendance_record`에 기록한다.

관련 저장소:
- `attendance_record`
- `attendance_session`
- Redis QR token

## 2. 관리자 증명 발급

1. 관리자가 `/admin/certificates`에 진입한다.
2. 서버가 증명 타입별 후보를 조회한다.
3. 조회 우선순위:
   - `semester_criteria_tracking`
   - raw 활동 데이터 fallback
4. 관리자가 대상을 선택한다.
5. 프론트가 `HyblockIssuer.issue(...)`를 호출한다.
6. 트랜잭션 확정 후 `Attested` 이벤트에서 UID를 파싱한다.
7. 서버가 `attestation` 테이블에 UID와 메타 정보를 저장한다.

증명 타입:
- `attendance`
- `external_activity`
- `assignment`
- `participation_period`

## 3. 학회원 SBT 발급

1. 학회원이 `/mypage`에 진입한다.
2. 서버가 `attestation` 테이블 기준으로 4종 증명 충족 여부를 계산한다.
3. 서버가 `sbt_issuance`로 기존 발급 여부를 확인한다.
4. 자격이 있으면 학회원이 발급 버튼을 누른다.
5. 프론트는 서버 API `/api/certificates/mint-sbt`를 호출한다.
6. 서버는 wallet session을 다시 검증한다.
7. 서버는 owner private key로 `HyblockSBT.safeMint(...)`를 호출한다.
8. receipt의 `Transfer` 이벤트에서 `tokenId`를 파싱한다.
9. 서버가 `sbt_issuance`에 결과를 기록한다.

## 4. 로그인 플로우

### Google OAuth

1. `/login`
2. Google provider redirect
3. `/auth/callback`
4. code exchange
5. 목적 페이지 redirect

### 지갑 로그인

1. nonce 발급
2. 지갑 서명
3. 서버 검증
4. `httpOnly` wallet session cookie 발급

## 5. 현재 운영상 주의점

- 관리자 증명 발급은 관리자 세션이 필요하다.
- SBT 민팅은 사용자 지갑 직접 호출이 아니라 서버 대행 민팅이다.
- 민팅 API는 `web/.env.local`의 RPC 및 private key를 읽는다.
