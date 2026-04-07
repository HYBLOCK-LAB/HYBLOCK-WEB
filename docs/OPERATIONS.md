# HYBLOCK Operations

## 0. 문서 범위

이 문서는 현재 구현 기준의 운영 점검 순서와 배포 전 확인 항목을 정리한다.

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
3. 타입별 후보 목록 노출 확인
4. 발급 후 `기발급 증명` 목록 확인
5. `attestation` 테이블에 `eas_uid` 저장 확인

### SBT 발급 점검

1. 일반 회원 wallet session 로그인
2. `/mypage` 접근
3. 4종 증명 충족 여부 확인
4. 발급 버튼 실행
5. `sbt_issuance` 기록 확인
6. 온체인 tx hash 확인

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

## 6. 운영 중 자주 확인할 것

### 관리자 증명 후보가 안 뜨는 경우

1. `member.is_admin` 확인
2. wallet session 로그인 상태 확인
3. `semester_criteria_tracking` 데이터 확인
4. raw 활동 데이터 존재 여부 확인
5. 이미 같은 타입 attestation이 있는지 확인

### SBT 발급이 안 되는 경우

1. wallet session 로그인 상태 확인
2. `member.wallet_address`와 현재 연결 지갑 일치 여부 확인
3. `attestation` 4종 존재 여부 확인
4. `sbt_issuance` 중복 여부 확인
5. `HYBLOCK_SBT_ADDRESS`, `RPC_URL`, `HYBLOCK_SBT_MINTER_PRIVATE_KEY` 확인

## 7. 참고 문서

- [루트 README](/home/jaeman/Codes/HYBLOCK-WEB/README.md)
- [아키텍처](/home/jaeman/Codes/HYBLOCK-WEB/docs/ARCHITECTURE.md)
- [플로우](/home/jaeman/Codes/HYBLOCK-WEB/docs/FLOWS.md)
- [지갑 세션 및 QR 구조](/home/jaeman/Codes/HYBLOCK-WEB/web/docs/wallet-session-and-qr-attendance.md)
