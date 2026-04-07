# HYBLOCK Architecture

## 1. 문서 목적

이 문서는 HYBLOCK 웹사이트 레포 안에 포함된 출석 관리, EAS 증명 발급, SBT 발급 구조를 현재 구현 기준으로 설명한다.

HYBLOCK는 단순 홍보용 사이트가 아니라 다음 기능을 함께 제공한다.
- 학회 홈페이지
- 회원 로그인 및 지갑 연결
- QR 기반 출석 관리
- 관리자 증명 발급
- 학회원 SBT 수료증 발급

## 2. 시스템 구성

```text
Browser
  ├─ Public Pages
  ├─ Member Pages
  ├─ Admin Pages
  ├─ Google OAuth
  └─ Wallet Connect / Wallet Session

Next.js App Router
  ├─ Page UI
  ├─ API Routes
  ├─ Wallet Session Cookie
  ├─ Supabase integration
  ├─ Upstash Redis integration
  └─ EVM RPC integration

Supabase
  ├─ member
  ├─ attendance_session
  ├─ attendance_record
  ├─ external_activity
  ├─ assignment
  ├─ semester_criteria_tracking
  ├─ attestation
  └─ sbt_issuance

Redis
  └─ short-lived attendance QR token

Ethereum Sepolia
  ├─ EAS Contract
  ├─ HyblockIssuer
  ├─ HyblockResolver
  ├─ ActivityTracker
  └─ HyblockSBT
```

## 3. 주요 서브시스템

### 3-1. 웹 애플리케이션

역할:
- 사용자/관리자 화면 렌더링
- Google OAuth 및 지갑 로그인 처리
- 출석 QR 발급 및 관리자 스캔 UI 제공
- 관리자 증명 발급 UI 제공
- 학회원 SBT 발급 UI 제공

핵심 디렉토리:
- `web/app`
- `web/components`
- `web/app/api`

### 3-2. 데이터베이스

역할:
- 회원 정보와 활동 원본 데이터 저장
- attestation UID와 SBT 발급 이력 저장

핵심 테이블:
- `member`
- `attendance_session`
- `attendance_record`
- `external_activity`
- `assignment`
- `semester_criteria_tracking`
- `attestation`
- `sbt_issuance`

### 3-3. 블록체인 레이어

역할:
- EAS 기반 증명 발급
- SBT 민팅 및 소유권 보관

핵심 컨트랙트:
- `HyblockIssuer.sol`
- `HyblockResolver.sol`
- `ActivityTracker.sol`
- `HyblockSBT.sol`

## 4. 인증 구조

### 4-1. Google OAuth

- Supabase Auth 기반
- Google 계정으로 로그인
- 브라우저에 Supabase 세션 저장
- 일부 기능은 이 세션을 기준으로 로그인 상태를 확인

### 4-2. 지갑 로그인

- nonce 발급
- 지갑 서명
- 서버 검증
- `httpOnly` wallet session cookie 발급

현재 중요한 점:
- 관리자 권한 판정은 wallet session 기반
- SBT 민팅 API도 wallet session 기반
- 즉 Google 로그인만으로는 관리자 증명 발급이나 SBT 민팅이 완전히 닫히지 않는다

## 5. 출석 아키텍처

```text
[Member]
   │
   │ login (Google or wallet session)
   ▼
[Attendance Page]
   │
   │ request personal QR
   ▼
[Next.js API: /api/attendance/qr-token]
   │
   ├─ verify login session
   ├─ resolve member
   └─ create short-lived token in Redis
   ▼
[Redis QR Token]
   │
   │ scan
   ▼
[Admin Attendance Page]
   │
   ▼
[Next.js API: /api/attendance/qr-scan]
   │
   ├─ validate token
   ├─ resolve active session
   └─ insert attendance_record
   ▼
[Supabase: attendance_record]
```

설계 의도:
- QR은 DB가 아니라 Redis에 짧은 TTL로 저장
- 스캔 성공 시 즉시 소모
- 출석 기록 자체는 DB에 저장

## 6. 증명 발급 아키텍처

아래 구조가 현재 관리자 증명 발급과 SBT 발급의 실제 흐름이다.

```text
[QR / Activity Input]
      │
      ▼
[Attendance / Activity Web Pages]
      │
      ▼
[Supabase]
  ├─ attendance_record
  ├─ external_activity
  ├─ assignment
  ├─ semester_criteria_tracking
  └─ attestation
      │
      │ candidate lookup
      ▼
[Admin Certificate Page]
      │
      │ HyblockIssuer.issue(...)
      ▼
[Ethereum Sepolia]
  ├─ HyblockIssuer
  ├─ HyblockResolver
  └─ EAS Contract
      │
      │ Attested event => EAS UID
      ▼
[Next.js API: save-attestation]
      │
      ▼
[Supabase: attestation]
      │
      │ eligibility check
      ▼
[Member MyPage]
      │
      │ request mint
      ▼
[Next.js API: mint-sbt]
      │
      ├─ re-check attestation types
      ├─ check sbt_issuance
      └─ owner wallet calls HyblockSBT.safeMint(...)
      ▼
[HyblockSBT]
      │
      │ Transfer event => tokenId
      ▼
[Supabase: sbt_issuance]
```

## 7. 현재 구현에서의 책임 분리

### 오프체인

- 회원 정보
- 출석 및 활동 원본 데이터
- attestation UID 저장
- SBT 발급 이력 저장

### 온체인

- EAS attestation
- SBT ownership

현재 구현은 민감정보 원문을 온체인에 직접 저장하지 않고, `personal_data_hash`와 `revealed_data`를 분리하는 방향을 사용한다.

## 8. 관리자 증명 후보 산정 방식

증명 후보 조회 우선순위:
1. `semester_criteria_tracking`
2. raw 활동 데이터 fallback

이유:
- 집계 테이블이 항상 최신 상태로 보장되지 않기 때문
- 운영상 화면이 비어 보이는 문제를 피하기 위해 raw 데이터 fallback을 사용

즉 현재 아키텍처는 "집계 우선, 원본 데이터 보조" 구조다.

## 9. SBT 발급 방식

현재 SBT 발급은 사용자 지갑 직접 민팅이 아니다.

구조:
- 학회원이 `/mypage`에서 발급 요청
- 서버가 wallet session 기준으로 본인 여부 확인
- 서버가 attestation 4종과 기존 발급 여부 재검증
- 서버가 owner private key로 `HyblockSBT.safeMint(...)` 호출
- 결과를 `sbt_issuance`에 저장

이 방식의 이유:
- `HyblockSBT.safeMint`가 `onlyOwner`
- 지금 프로젝트 범위에서 가장 짧게 동작하는 경로

## 10. 현재 제약

- Google 로그인만으로 `member`와 자동 연결되는 구조는 아직 없다
- 관리자 인증은 wallet session 중심이다
- SBT 민팅도 wallet session 중심이다
- `ActivityTracker` 자동 동기화 파이프라인은 현재 핵심 범위가 아니다
- multi-sig, IPFS 정식화는 현재 범위 밖이다

## 11. 관련 문서

- [루트 README](/home/jaeman/Codes/HYBLOCK-WEB/README.md)
- [주요 플로우](/home/jaeman/Codes/HYBLOCK-WEB/docs/FLOWS.md)
- [운영 가이드](/home/jaeman/Codes/HYBLOCK-WEB/docs/OPERATIONS.md)
- [지갑 세션 및 QR 구조](/home/jaeman/Codes/HYBLOCK-WEB/web/docs/wallet-session-and-qr-attendance.md)
- [DB 스키마](/home/jaeman/Codes/HYBLOCK-WEB/database/docs/Schema.md)
