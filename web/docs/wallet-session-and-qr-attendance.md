# 지갑 세션과 QR 출석

## 1. 상태 모델

화면에서 “지갑이 연결됨”으로 보이는 것과 서버가 로그인된 사용자를 신뢰하는 것은 다르다.

| 상태 | 구현 | 신뢰 범위 |
| --- | --- | --- |
| 지갑 연결 | Reown AppKit + Wagmi | 주소/체인 표시, 서명·트랜잭션 요청 |
| 지갑 UI store | Zustand | 클라이언트 렌더링 보조 |
| 지갑 로그인 | HMAC `httpOnly` cookie | 서버 member 식별, 관리자/SBT/QR 인가 |
| Google 로그인 | Supabase Auth access token | linked wallet member의 QR 발급 |

`WalletSessionSync`라는 이름의 provider는 실제 server cookie가 아니라 Wagmi 연결 상태를 Zustand에 복사한다. 서버 인가 코드는 이 store를 신뢰하지 않는다.

## 2. 지갑 로그인

### nonce

`GET /api/auth/wallet/nonce?address=0x...`

1. UUID nonce와 발급 시각을 만든다.
2. 다음 형식의 메시지를 반환한다.

```text
HYBLOCK wallet login
Address: 0x...
Nonce: ...
Issued At: ...
```

3. 주소, nonce, 발급/만료를 HMAC 서명한 `hyblock_wallet_nonce` cookie를 설정한다.
4. TTL은 5분, `httpOnly`, `sameSite=lax`, production에서 `secure`다.

### verify

`POST /api/auth/wallet/verify`

1. viem이 메시지 서명에서 주소를 복구한다.
2. 요청 주소, cookie 주소, 메시지 원문, nonce, 만료를 비교한다.
3. `member.wallet_address`로 활성 member를 조회한다.
4. member가 없으면 404를 반환하고 회원 가입으로 보낸다.
5. 성공하면 주소, member ID, 만료를 HMAC 서명한 `hyblock_wallet_session` cookie를 설정한다.
6. session TTL은 7일이다.

보조 localStorage `hyblock_wallet_login`은 signature preview와 UI 기록일 뿐 인증 수단이 아니다.

### server session 재검증

`getWalletSessionMember()`는 매 요청에서 다음을 확인한다.

- HMAC signature
- 만료 시각
- 주소로 조회한 member 존재와 활성 상태
- cookie의 member ID와 DB member ID 일치

관리자 검사는 여기에 `member.is_admin=true`를 추가한다.

### 로그아웃

`POST /api/auth/wallet/logout`은 nonce와 session cookie를 삭제한다. 다만 현재 `SiteChrome`의 disconnect 버튼은 Wagmi `disconnect()`만 호출하므로 이 endpoint와 UI를 연결해야 완전한 로그아웃이 된다.

## 3. Google session과 linked wallet

1. Google OAuth callback이 Supabase session을 만든다.
2. `/wallet-link`가 지갑 연동용 메시지를 브라우저에서 서명한다.
3. `supabase.auth.updateUser`가 주소, chain ID, 연결 시각, 서명 preview를 user metadata에 저장한다.
4. 이 연동 서명은 별도 서버 API에서 복구·검증하지 않는다.
5. QR 발급 시 서버는 Bearer access token을 `supabase.auth.getUser`로 검증한 뒤 metadata 지갑으로 member를 찾는다.

Google session은 관리자/SBT 민팅에 사용하지 않는다.

## 4. 세션 활성화

관리자 `/api/events`가 `attendance_session`을 활성화한다.

- `status`: `in_progress`
- `check_in_code`: 혼동 문자를 뺀 6자리 영문/숫자
- `session_start_time`: 최초 활성화 시 현재 시각
- `session_end_time`: 기본 20분 뒤
- `updated_at`: 활성화 시각

`ACTIVE_SESSION_DURATION_MINUTES`로 20분 기본값을 바꿀 수 있다. 출석 상태는 시작 후 10분을 기준으로 `present`/`late`를 나눈다.

동시 활성화 규칙:

- `basic`, `misc`, `external`, `hackathon`: 다른 활성 세션이 없어야 함
- `advanced`: 대상 파트 필수, 파트별 한 개씩 동시 활성 가능
- 공용 세션과 advanced 세션은 동시 활성 불가

## 5. 개인 QR 발급

`POST /api/attendance/qr-token`

### 인증 순서

1. 지갑 server session cookie
2. 없으면 Supabase Bearer access token
3. Google user metadata의 wallet address
4. 활성 member 조회

### 발급 조건

- 활성 member
- 요청한 세션이 `in_progress`이고 만료 전
- advanced인 경우 member 소속과 target affiliation 일치
- 아직 `present` 또는 `late` 기록이 없음

### Redis payload

키:

```text
attendance:qr:{random token}
```

값:

```json
{
  "memberId": 1,
  "memberName": "홍길동",
  "eventName": "기본 세션 1주차",
  "issuedAt": "...",
  "expiresAt": "..."
}
```

- TTL: 45초
- QR 문자열 prefix: `hyblock-attendance:`
- 클라이언트는 만료 시 자동 재발급
- Redis는 SDK 없이 REST `fetch`로 호출

## 6. 관리자 QR 스캔

`AdminAttendanceScanner`는 브라우저 카메라 프레임 또는 사용자가 올린 이미지 파일을 canvas로 옮기고 `@paulmillr/qr`로 해석한다. `BarcodeDetector` API를 사용하지 않는다.

`POST /api/attendance/qr-scan`:

1. 관리자 wallet session 확인
2. QR prefix 제거와 token 파싱
3. Redis `GET`
4. payload의 세션이 아직 활성인지 확인
5. member ID로 출석 처리
6. 성공 후 Redis `DEL`

세션 불일치 token은 삭제한다. 만료 token은 Redis TTL로 사라진다. 동일 세션/member의 DB unique constraint가 중복 출석 레코드를 막는다.

## 7. 수동 코드 출석

`POST /api/check-in`은 이름, 세션 이름, 출석 코드를 받는다.

1. 세션 활성/만료 확인
2. `check_in_code` 대조
3. 같은 이름의 활성 member를 조회
4. 출석 기록 생성

이 endpoint는 로그인 없이 code를 지식 기반 인증 수단으로 사용한다. 이름이 같은 활성 member가 둘 이상이면 오류가 난다.

현재 `CheckInForm`은 상태 확인을 위해 관리자 보호된 `/api/events`를 호출한다. 일반 회원의 수동 출석 UI를 정상화하려면 공개 가능한 최소 세션 상태 endpoint를 분리하거나 서버에서 받은 활성 상태만 사용하도록 수정해야 한다.

## 8. 기록과 종료

체크인 시:

- 시작 후 10분 이내: `present`
- 이후 session end 전: `late`
- 같은 member/session 기록 존재: 기존 결과 반환

관리자가 세션을 완료하거나 20분 만료를 감지하면:

- 세션 상태를 `completed`로 변경
- check-in code 제거
- 대상 활성 member 중 기록 없는 사람을 `absent`로 insert

관리자는 이후 participant API에서 `present`, `late`, `absent`, `nonParticipation`을 직접 조정할 수 있다.

## 9. 보안·운영 체크

- `WALLET_SESSION_SECRET`은 길고 임의적인 서버 secret을 사용한다.
- `SUPABASE_SERVICE_ROLE_KEY`, Redis token, minter private key는 클라이언트에 노출하지 않는다.
- UI 지갑 연결 표시만 보고 관리자 session이 끝났다고 판단하지 않는다.
- QR scan API는 반드시 관리자 cookie 검사를 유지한다.
- 회원 생성 API와 linked-wallet 서명의 서버 검증은 현재 보강이 필요하다.
- 수동 코드는 활성 창 동안 공유되는 값이므로 화면·로그 노출을 제한한다.

## 10. 관련 파일

- `lib/wallet-session.ts`
- `lib/supabase-auth.ts`
- `lib/attendance-qr.ts`
- `lib/upstash-redis.ts`
- `lib/supabase-attendance.ts`
- `app/api/auth/wallet/*`
- `app/api/attendance/*`
- `app/api/check-in/route.ts`
- `components/PersonalAttendanceQrCard.tsx`
- `components/admin/AdminAttendanceScanner.tsx`
