# HYBLOCK Architecture

## 1. 목적

HYBLOCK의 목표는 학회원의 활동 데이터를 관리하고, 이를 자격 증명과 수료증 발급으로 연결하는 것이다.

현재 구현 범위는 아래 두 단계에 집중한다.
- 관리자 페이지에서 EAS 기반 증명 발급
- 학회원 페이지에서 SBT 수료증 발급

## 2. 상위 구조

```text
Browser
  ├─ User UI / Admin UI
  └─ Wallet Connect / Google OAuth

Next.js App Router
  ├─ Page UI
  ├─ API Routes
  ├─ Wallet Session Cookie
  └─ Supabase / Redis / EVM RPC 연동

Supabase
  ├─ member
  ├─ attendance_record
  ├─ external_activity
  ├─ assignment
  ├─ semester_criteria_tracking
  ├─ attestation
  └─ sbt_issuance

Ethereum Sepolia
  ├─ EAS
  ├─ HyblockIssuer
  ├─ HyblockResolver
  ├─ ActivityTracker
  └─ HyblockSBT
```

## 3. 구성 요소

### Web

- 사용자 화면: 출석, 마이페이지, 로그인, 지갑 연결
- 관리자 화면: 멤버 관리, 출석 관리, 증명 관리
- 서버 API: 지갑 세션, QR 출석, 증명 저장, SBT 민팅

### Database

- 운영 데이터와 발급 이력의 기준 저장소
- 증명 발급 여부는 `attestation`
- SBT 발급 여부는 `sbt_issuance`

### Blockchain

- EAS: 자격 증명 발급
- HyblockIssuer: 관리자용 attestation 발급 컨트랙트
- HyblockResolver: 증명 검증용 resolver
- HyblockSBT: SBT 수료증 발급 컨트랙트

## 4. 데이터 경계

오프체인:
- 회원 정보
- 출석/외부활동/산출물 원본 데이터
- attestation UID 기록
- SBT 발급 이력

온체인:
- EAS attestation
- SBT ownership

현재 구현은 개인정보 원문을 온체인에 직접 올리지 않고, 해시와 선택 공개 데이터 중심으로 다룬다.

## 5. 인증 구조

### 사용자 인증

- Google OAuth
- 지갑 서명 기반 세션

### 관리자 인증

- 기본적으로 `member.is_admin = true` 인 wallet session 사용자만 접근 가능
- 관리자 API도 같은 서버 세션으로 보호

## 6. 현재 설계 판단

- 증명 발급과 SBT 발급은 분리한다.
- SBT 민팅은 현재 서버가 owner 권한으로 대행한다.
- 관리자 증명 후보는 `semester_criteria_tracking` 우선, raw 활동 데이터 fallback을 사용한다.
- IPFS는 현재 필수 구성 요소가 아니다.
