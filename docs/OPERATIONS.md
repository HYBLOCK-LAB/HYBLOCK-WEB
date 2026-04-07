# HYBLOCK Operations

## 1. 로컬 실행

### Web

```bash
cd web
npm install
npm run dev
```

### Contracts

```bash
cd eas
forge build
forge test
```

## 2. 필수 확인 항목

### Web env

- Supabase
- Wallet session secret
- Reown project id
- `NEXT_PUBLIC_EAS_SCHEMA`
- `NEXT_PUBLIC_HYBLOCK_ISSUER_ADDRESS`
- `NEXT_PUBLIC_HYBLOCK_SBT_ADDRESS`
- `HYBLOCK_SBT_ADDRESS`
- `RPC_URL`
- `HYBLOCK_SBT_MINTER_PRIVATE_KEY`
- `HYBLOCK_CHAIN_ID`

### Contracts env

- `PRIVATE_KEY`
- `RPC_URL`
- `EAS_ADDRESS`

## 3. 운영 점검 순서

### 증명 발급 점검

1. 관리자 wallet session 로그인
2. `/admin/certificates` 접근
3. 후보 목록 노출 확인
4. 발급 후 `기발급 증명` 목록 확인
5. `attestation` 테이블 기록 확인

### SBT 발급 점검

1. 일반 회원 wallet session 로그인
2. `/mypage` 접근
3. 4종 증명 충족 여부 확인
4. 발급 버튼 실행
5. `sbt_issuance` 기록 확인

## 4. 현재 완료 범위

- 출석 QR 기반 운영
- 관리자 증명 발급
- 학회원 SBT 발급
- Google OAuth
- 지갑 서명 세션

## 5. 현재 비범위

- multi-sig 운영 전환
- IPFS 메타데이터 정식화
- 별도 배치 기반 집계 자동화

이 항목들은 현재 프로젝트 필수 범위에 포함하지 않는다.
