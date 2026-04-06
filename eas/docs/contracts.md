# Hyblock Smart Contracts

EAS(Ethereum Attestation Service) 기반 졸업 증명 시스템 컨트랙트 문서.

---

## 아키텍처 개요

```
DB (Supabase)
    │
    │ syncData()
    ▼
ActivityTracker          ← 출석/프로젝트 데이터 온체인 저장
    │
    │ attendanceCount(), projectCompleted()
    ▼
HyblockResolver          ← attestation 유효성 검증 (수료 조건 확인)
    ▲
    │ resolver 등록
HyblockIssuer            ← EAS에 attestation 발행 (admin 전용)
    │
    │ attest()
    ▼
EAS Contract (외부)      ← Ethereum Attestation Service
```

배포 순서: `ActivityTracker` → `HyblockIssuer` → `HyblockResolver`

---

## 컨트랙트 상세

### ActivityTracker

학회원별 활동 데이터를 온체인에 저장한다. 백엔드 어드민이 DB 데이터를 배치로 동기화한다.

**상태 변수**

| 변수 | 타입 | 설명 |
|------|------|------|
| `admin` | `address` | 배포자. `syncData` 호출 권한 |
| `attendanceCount` | `mapping(address => uint256)` | 주소별 출석 횟수 |
| `projectCompleted` | `mapping(address => bool)` | 주소별 프로젝트 완료 여부 |

**함수**

#### `syncData(address[] users, uint256[] counts, bool[] projects)`
- 권한: `onlyAdmin`
- DB에서 집계한 출석/프로젝트 데이터를 배치로 온체인에 기록한다.
- `users`, `counts`, `projects` 배열 길이가 다르면 revert.

---

### HyblockIssuer

EAS 컨트랙트를 통해 attestation을 발행한다. 어드민만 호출 가능.

**상태 변수**

| 변수 | 타입 | 설명 |
|------|------|------|
| `eas` | `IEAS` | EAS 컨트랙트 주소 |
| `admin` | `address` | 배포자 |
| `schemaUID` | `bytes32` | 등록된 EAS 스키마 UID |

**함수**

#### `setSchemaUID(bytes32 _uid)`
- 권한: `admin`
- EAS에 등록한 스키마 UID를 세팅한다. 배포 후 1회 호출.

#### `issue(address walletAddress, bytes32 personalDataHash, string revealedData, bool isGraduated) → bytes32`
- 권한: `admin`
- attestation을 발행하고 EAS가 반환하는 `uid`를 리턴한다.
- `isGraduated = true`이면 HyblockResolver가 수료 조건을 검증한다.

**스키마 인코딩 순서**
```
abi.encode(address, bytes32, string, bool)
           wallet   hash    revealed  isGrad
```

---

### HyblockResolver

EAS가 attestation 발행 전에 호출하는 검증 컨트랙트.

**상태 변수**

| 변수 | 타입 | 설명 |
|------|------|------|
| `tracker` | `IActivityTracker` | ActivityTracker 주소 |
| `issuer` | `address` | HyblockIssuer 주소 |

**함수**

#### `attest(Attestation attestation, uint256) → bool`
검증 로직:
1. `attestation.attester == issuer` 확인 → 아니면 `false`
2. `isGraduated == false`이면 `true` (일반 활동 기록은 무조건 통과)
3. `isGraduated == true`이면:
   - `attendanceCount >= 8` AND `projectCompleted == true` → `true`
   - 조건 미달 → `false` (EAS가 revert 처리)

#### `revoke(Attestation, uint256) → bool`
항상 `true` 반환 (revoke 제한 없음).

#### `isPayable() → bool`
항상 `false` 반환 (ETH 수신 불가).

---

## 빌드 & 테스트

```bash
cd eas

# 컴파일
forge build

# 테스트
forge test -v

# 가스 리포트
forge test --gas-report
```

---

## 배포

```bash
# .env 설정
export PRIVATE_KEY=0x...
export RPC_URL=https://sepolia.infura.io/v3/...
export EAS_ADDRESS=0xC2679fBD37d54388Ce493F1DB75320D236e1815e  # Sepolia 기본값

# 배포 (dry-run)
forge script script/Deploy.s.sol --rpc-url $RPC_URL

# 실제 배포
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY
```

배포 후 순서:
1. EAS에 스키마 등록 → `schemaUID` 획득
2. `HyblockIssuer.setSchemaUID(schemaUID)` 호출
3. EAS에 `HyblockResolver` 주소를 resolver로 등록

---

## EAS 주소 (참고)

| 네트워크 | EAS 주소 |
|---------|---------|
| Ethereum Mainnet | `0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587` |
| Sepolia Testnet | `0xC2679fBD37d54388Ce493F1DB75320D236e1815e` |
| Base | `0x4200000000000000000000000000000000000021` |
