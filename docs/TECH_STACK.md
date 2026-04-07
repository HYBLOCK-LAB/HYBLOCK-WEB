# HYBLOCK Tech Stack

## 1. Frontend / Server

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Lucide React

## 2. Auth / Wallet

- Supabase Auth
  - Google OAuth
- Wagmi
- Reown AppKit / WalletConnect
- viem

## 3. Database / Infra

- Supabase
  - Postgres
  - Auth
- Upstash Redis
  - QR 토큰 단기 저장

## 4. Smart Contract

- Solidity `0.8.24`
- Foundry
- OpenZeppelin Contracts
- EAS

## 5. Chain / RPC

- Ethereum Sepolia
- Infura RPC

## 6. 주요 패키지 역할

### `web`

- UI 렌더링
- 로그인/세션 처리
- 관리자 도구
- SBT 민팅 API

### `eas`

- `ActivityTracker.sol`
- `HyblockIssuer.sol`
- `HyblockResolver.sol`
- `HyblockSBT.sol`
- 배포 및 테스트 스크립트

### `database`

- Supabase 스키마 문서
- 구현 가이드

## 7. 환경변수 범주

클라이언트 공개값:
- `NEXT_PUBLIC_*`
- Supabase URL / publishable key
- EAS schema UID
- issuer / sbt address

서버 비공개값:
- `SUPABASE_SERVICE_ROLE_KEY`
- `WALLET_SESSION_SECRET`
- `RPC_URL`
- `HYBLOCK_SBT_MINTER_PRIVATE_KEY`
- Redis token

컨트랙트 배포용:
- `eas/.env`
- `PRIVATE_KEY`
- `RPC_URL`
- `EAS_ADDRESS`
