# 지갑 로그인 세션 및 개인 QR 출석 구조

## 개요

현재 HYBLOCK 웹은 지갑 서명을 이용해 사용자를 검증하고, 서버가 `httpOnly` 쿠키 세션을 발급하는 방식으로 동작한다.  
이 세션을 기반으로 개인 출석 QR을 발급하고, 운영자가 관리자 화면에서 이를 스캔해 출석을 인증한다.

이 구조의 목적은 다음과 같다.

- 지갑 주소를 `member.wallet_address`와 안전하게 매핑한다.
- 브라우저 `localStorage`만으로 로그인 상태를 판단하지 않는다.
- 서버가 신뢰할 수 있는 세션을 직접 발급한다.
- 개인 QR을 짧은 TTL의 1회용 토큰으로 운영한다.

---

## 사용된 인프라 및 플랫폼

현재 구조에서 실제로 사용되는 인프라/플랫폼은 아래와 같다.

### 1. Vercel

역할:

- Next.js 애플리케이션 배포
- App Router 기반 서버 라우트 실행
- API Route 실행 환경 제공

이 프로젝트의 로그인 검증, QR 발급, QR 스캔 검증 API는 모두 Vercel에 배포된 Next.js 서버에서 실행된다.

### 2. Supabase

역할:

- 회원 정보 저장
- 세션/출석 관련 데이터 저장
- 이메일/소셜 로그인 세션 제공

이 구조에서 특히 중요한 테이블은 다음과 같다.

- `member`
- `attendance_session`
- `attendance_record`

지갑 로그인 자체는 Supabase Auth가 아니라 별도 세션으로 처리하지만, 최종 회원 식별은 `member.wallet_address` 를 기준으로 한다.

### 3. Upstash Redis

역할:

- 개인 QR 토큰의 단기 저장소
- TTL 기반 만료 처리
- 1회용 토큰 삭제 처리

개인 QR 토큰은 DB가 아니라 Redis에 저장되며, 짧은 수명의 인증 토큰 저장소로 사용한다.

### 4. Next.js

역할:

- 프론트엔드 UI 제공
- 서버 API 구현
- 출석 페이지, 관리자 스캐너 페이지 구성

사용 위치:

- `app/` 라우팅
- `app/api/` 서버 엔드포인트
- React 기반 클라이언트 컴포넌트

### 5. Wagmi / Reown AppKit / WalletConnect

역할:

- 사용자 지갑 연결
- 서명 요청
- MetaMask, Coinbase Wallet, WalletConnect 연동

실제 로그인 세션은 이 도구들이 직접 발급하지 않고,  
이 도구들을 통해 받은 서명을 서버가 검증한 뒤 자체 세션을 발급한다.

### 6. 브라우저 Web API

역할:

- 카메라 접근: `getUserMedia`
- QR 감지: `BarcodeDetector`
- 쿠키 기반 세션 전송

운영자 스캔 기능은 브라우저 카메라와 QR 감지 API에 의존한다.  
일부 브라우저에서는 `BarcodeDetector` 지원이 약할 수 있으므로 수동 입력 fallback도 제공한다.

---

## 전체 흐름

### 1. 지갑 로그인

1. 사용자가 지갑을 연결한다.
2. 클라이언트가 `/api/auth/wallet/nonce?address=...` 를 호출한다.
3. 서버는 nonce를 만들고, 서명 검증용 정보를 `httpOnly` 쿠키에 저장한다.
4. 서버는 사용자가 서명해야 할 메시지를 응답한다.
5. 사용자가 해당 메시지에 서명한다.
6. 클라이언트가 `/api/auth/wallet/verify` 로 `address`, `message`, `signature`를 보낸다.
7. 서버는 서명 복구로 실제 서명자가 해당 주소인지 검증한다.
8. 서버는 `member.wallet_address` 를 조회한다.
9. 등록된 활성 회원이면 `httpOnly` 지갑 세션 쿠키를 발급한다.

### 2. 개인 QR 발급

1. 사용자가 출석 페이지에서 `내 출석 QR`을 연다.
2. 클라이언트가 `/api/attendance/qr-token` 을 호출한다.
3. 서버는 다음 중 하나로 로그인 상태를 검증한다.
   - Supabase 로그인 세션
   - 지갑 `httpOnly` 세션 쿠키
4. 로그인된 사용자를 `member` 레코드와 매핑한다.
5. 활성 세션이 있으면 Redis에 짧은 TTL의 출석 토큰을 저장한다.
6. 서버는 QR 문자열과 만료 시각을 응답한다.

### 3. 운영자 스캔 인증

1. 운영자가 관리자 출석 화면에서 카메라를 켠다.
2. QR에서 토큰을 읽는다.
3. `/api/attendance/qr-scan` 으로 토큰을 보낸다.
4. 서버는 Redis에서 토큰을 조회한다.
5. 활성 세션과 일치하는지 확인한다.
6. 기존 출석 테이블에 출석을 기록한다.
7. 성공하면 토큰을 즉시 삭제한다.

---

## 왜 자체 세션을 쓰는가

기존 지갑 로그인은 서명 후 브라우저 `localStorage`에 정보만 저장하고 있었다.  
이 방식은 서버가 신뢰할 수 있는 로그인 상태가 아니므로, 출석 QR 같은 서버 보호 기능의 인증 수단으로 쓰기 어렵다.

자체 세션 방식의 장점은 다음과 같다.

- 서버가 서명 검증 결과를 직접 신뢰할 수 있다.
- 세션을 `httpOnly` 쿠키로 저장하므로 클라이언트 JS에서 직접 다룰 필요가 없다.
- 이후 API는 쿠키만 보고 로그인 여부를 판별할 수 있다.
- Supabase Auth와 별개로 지갑 기반 인증을 단순하게 붙일 수 있다.

---

## 구성 요소

### 1. nonce 발급

파일:

- `web/app/api/auth/wallet/nonce/route.ts`
- `web/lib/wallet-session.ts`

역할:

- 지갑 주소를 받아 nonce 생성
- nonce 정보를 서명된 쿠키로 저장
- 사용자가 서명할 메시지 반환

nonce 쿠키는 짧게 유지된다.

- 쿠키명: `hyblock_wallet_nonce`
- TTL: 5분

### 2. 서명 검증 및 세션 발급

파일:

- `web/app/api/auth/wallet/verify/route.ts`
- `web/lib/wallet-session.ts`

역할:

- 전달받은 메시지/서명으로 주소 복구
- nonce 쿠키와 메시지 일치 여부 확인
- `member.wallet_address` 로 회원 조회
- 활성 회원이면 세션 쿠키 발급

세션 쿠키 정보:

- 쿠키명: `hyblock_wallet_session`
- 저장 값: 서명된 payload
- 포함 정보: `address`, `memberId`, `expiresAt`
- TTL: 7일

---

## 개인 QR 토큰 구조

파일:

- `web/app/api/attendance/qr-token/route.ts`
- `web/app/api/attendance/qr-scan/route.ts`
- `web/lib/attendance-qr.ts`
- `web/lib/upstash-redis.ts`

### 발급 조건

다음 중 하나가 필요하다.

- Supabase 로그인 세션
- 지갑 세션 쿠키

둘 다 없으면 QR은 발급되지 않는다.

### Redis 저장 값

토큰 키 예시:

- `attendance:qr:{token}`

저장 데이터 예시:

```json
{
  "memberId": 12,
  "memberName": "홍길동",
  "eventName": "Basic3",
  "issuedAt": "2026-04-06T10:00:00.000Z",
  "expiresAt": "2026-04-06T10:00:45.000Z"
}
```

### 정책

- TTL: 45초
- 1회용
- 활성 세션에 대해서만 발급
- 스캔 성공 시 즉시 삭제

---

## 출석 처리 로직

실제 출석 기록은 기존 `attendance_record` 테이블을 그대로 사용한다.

관련 파일:

- `web/lib/supabase-attendance.ts`

추가된 핵심 함수:

- `checkInByMemberId(memberId, event)`

동작:

1. 세션 존재 여부 확인
2. 세션이 `in_progress` 상태인지 확인
3. 회원이 활성 회원인지 확인
4. 기존 출석 기록 중복 여부 확인
5. 아직 기록이 없으면 `attendance_record` insert
6. 세션 시작 후 10분 이내면 `present`, 이후면 `late`

---

## 클라이언트 동작

### 지갑 로그인 화면

파일:

- `web/components/auth/WalletLoginSection.tsx`

동작:

1. nonce 요청
2. 메시지 서명
3. 서버 검증 API 호출
4. 세션 쿠키 발급 완료 후 이동

### 개인 QR 카드

파일:

- `web/components/PersonalAttendanceQrCard.tsx`

동작:

- 로그인 세션이 있으면 QR 발급
- 로그아웃 상태면 QR 비움
- 만료되면 자동 재발급

### 운영자 스캐너

파일:

- `web/components/admin/AdminAttendanceScanner.tsx`

동작:

- 브라우저 카메라 접근
- `BarcodeDetector` 사용 가능 시 자동 감지
- 미지원 브라우저에서는 수동 입력 가능

---

## 환경변수

필수 항목:

```env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
WALLET_SESSION_SECRET=...
```

설명:

- `UPSTASH_REDIS_REST_URL`: Upstash Redis REST endpoint
- `UPSTASH_REDIS_REST_TOKEN`: Upstash 인증 토큰
- `WALLET_SESSION_SECRET`: nonce/세션 쿠키 서명용 비밀값

`WALLET_SESSION_SECRET` 는 충분히 긴 랜덤 문자열이어야 한다.

---

## 보안 포인트

### 1. localStorage를 인증 수단으로 쓰지 않음

지갑 로그인 정보는 보조 UI 상태로만 남길 수 있지만,  
서버 인증은 반드시 `httpOnly` 쿠키 세션으로만 판단한다.

### 2. nonce 재사용 방지

nonce는 짧은 TTL의 쿠키로 관리되며, 로그인 성공 후 삭제된다.

### 3. 서명자 검증

서버는 전달받은 서명에서 주소를 복구해 실제 지갑 소유자를 확인한다.

### 4. 개인 QR 재사용 방지

- TTL이 짧다.
- Redis에서 1회용으로 관리한다.
- 스캔 성공 후 즉시 삭제한다.

### 5. 활성 세션 검증

QR 토큰 자체가 존재하더라도 현재 활성 세션과 다르면 출석 처리하지 않는다.

---

## 현재 제약

### 1. 회원가입 전 지갑은 세션 발급 불가

`member.wallet_address` 에 등록된 활성 회원만 지갑 세션을 받을 수 있다.

### 2. 운영자 스캐너는 브라우저 지원 차이가 있음

`BarcodeDetector` 지원이 약한 브라우저에서는 자동 감지 대신 수동 입력을 사용해야 한다.

### 3. 지갑 로그아웃 API는 아직 없음

현재는 세션 발급 흐름은 있지만, 지갑 세션 쿠키를 명시적으로 삭제하는 전용 로그아웃 UI는 없다.  
필요하면 `/api/auth/wallet/logout` 를 추가하면 된다.

---

## 권장 후속 작업

1. 지갑 세션 로그아웃 API 추가
2. 관리자 권한 검증을 서버 세션 기준으로 정리
3. QR 스캔 성공/실패 로그를 별도 테이블에 저장
4. Redis 토큰 payload에 `sessionId`까지 직접 저장
5. 모바일 스캐너 호환성을 위해 라이브러리 기반 QR fallback 추가

---

## 참고 파일

- `web/lib/wallet-session.ts`
- `web/app/api/auth/wallet/nonce/route.ts`
- `web/app/api/auth/wallet/verify/route.ts`
- `web/app/api/attendance/qr-token/route.ts`
- `web/app/api/attendance/qr-scan/route.ts`
- `web/components/auth/WalletLoginSection.tsx`
- `web/components/PersonalAttendanceQrCard.tsx`
- `web/components/admin/AdminAttendanceScanner.tsx`
- `web/lib/supabase-attendance.ts`
