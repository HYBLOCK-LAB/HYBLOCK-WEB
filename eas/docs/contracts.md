# HYBLOCK 스마트 컨트랙트

## 1. 구성과 현재 Web 연결

| 컨트랙트 | 역할 | 현재 Web 연결 |
| --- | --- | --- |
| `ActivityTracker` | 주소별 출석 수와 프로젝트 완료 상태 | 없음 |
| `HyblockIssuer` | EAS `attest` 호출을 감싼 관리자 발행기 | 관리자 증명 UI가 사용 |
| `HyblockResolver` | issuer와 졸업 조건 검증 | Web이 `isGraduated=false`만 보내므로 졸업 분기 미사용 |
| `HyblockSBT` | 양도 불가능 ERC-721 수료증 | 서버 SBT 민팅 API가 사용 |

```text
현재 EAS 경로
Admin browser wallet
  → HyblockIssuer.issue(..., isGraduated=false)
  → EAS.attest(...)
  → Attested UID
  → Supabase attestation

현재 SBT 경로
Next.js server owner wallet
  → HyblockSBT.safeMint(member, metadataUri)
  → Transfer tokenId
  → Supabase sbt_issuance

준비되어 있으나 미연결인 경로
Supabase/Batch -- syncData 없음 --> ActivityTracker
EAS schema resolver -----------> HyblockResolver
```

## 2. 도구와 의존성

- Solidity `0.8.24`
- Foundry
- OpenZeppelin Contracts v5
- EAS interface는 `HyblockIssuer.sol`에 필요한 최소 구조로 선언
- `forge-std`

`openzeppelin-contracts`는 git submodule이다.

```bash
git submodule update --init --recursive
cd eas
forge build
forge test
```

## 3. `ActivityTracker`

Web/DB 밖에서 운영자가 집계값을 batch로 동기화할 수 있도록 만든 저장소다.

상태:

- `admin`: 배포자
- `minSessionCount`: 졸업 최소 출석 수
- `attendanceCount[address]`
- `projectCompleted[address]`

함수:

- `setMinSessionCount(uint256)`: `onlyAdmin`
- `syncData(address[] users, uint256[] counts, bool[] projects)`: `onlyAdmin`, 배열 길이 일치 필요

현재 저장소에는 Supabase 값을 집계해 `syncData`를 호출하는 Web API, script, cron, queue가 없다. 배포만으로 데이터가 채워지지 않는다.

## 4. `HyblockIssuer`

상태:

- `eas`: EAS contract
- `admin`: 배포자
- `schemaUID`: 배포 후 설정할 schema UID

함수:

### `setSchemaUID(bytes32 uid)`

- `admin`만 호출 가능
- schema를 등록한 뒤 반환 UID를 저장

### `issue(...)`

```solidity
issue(
  address walletAddress,
  bytes32 personalDataHash,
  string attestationType,
  string revealedData,
  bool isGraduated
) returns (bytes32)
```

- `admin`만 호출 가능
- EAS request의 recipient는 `walletAddress`
- 만료 없음, revocable=true, refUID=0, value=0
- data encoding 순서: `(address, bytes32, string, string, bool)`

Web 관리자 권한은 Supabase `member.is_admin`이고 컨트랙트 권한은 `HyblockIssuer.admin`이다. 관리자는 두 조건을 모두 만족하는 지갑으로 로그인·연결해야 한다.

## 5. `HyblockResolver`

EAS resolver로 등록했을 때 다음을 검증한다.

1. `attestation.attester == issuer`
2. data를 `(address, bytes32, string, string, bool)`로 decode
3. `isGraduated=false`이면 통과
4. `isGraduated=true`이면 다음 두 조건을 모두 요구
   - `tracker.attendanceCount(wallet) >= tracker.minSessionCount()`
   - `tracker.projectCompleted(wallet) == true`

`revoke`는 항상 true, `isPayable`은 false다.

현재 `CertificateManager`는 네 EAS 타입 모두 `isGraduated=false`로 발급한다. 따라서 Web에서 발급하는 attestation은 ActivityTracker의 숫자를 검사하지 않는다.

## 6. `HyblockSBT`

OpenZeppelin `ERC721URIStorage`, `Ownable`을 기반으로 한 ERC-5192 형태의 수료증이다.

- name: `Hyblock Certificate`
- symbol: `HBC`
- owner: 배포자
- token ID: 0부터 순차 증가
- `safeMint(recipient, uri)`: `onlyOwner`
- 민팅 후 `Locked(tokenId)` event
- `locked(tokenId)`: 항상 true
- mint/burn 외 일반 transfer는 `_update`에서 revert
- IERC5192 interface ID를 `supportsInterface`에 포함

서버의 `HYBLOCK_SBT_MINTER_PRIVATE_KEY` 주소가 `owner()`와 같아야 한다. 다른 운영 지갑을 사용하려면 OpenZeppelin Ownable의 ownership 이전을 먼저 수행한다.

metadata URI는 Web 서버가 `${baseUri}/{memberId}.json`으로 만든다. 컨트랙트나 이 저장소는 metadata 파일의 존재를 검증하거나 업로드하지 않는다.

## 7. 배포

`.env`:

```env
PRIVATE_KEY=0x...
RPC_URL=https://...
EAS_ADDRESS=0xC2679fBD37d54388Ce493F1DB75320D236e1815e
MIN_SESSION_COUNT=8
```

dry run과 broadcast:

```bash
forge script script/Deploy.s.sol --rpc-url "$RPC_URL"
forge script script/Deploy.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$PRIVATE_KEY"
```

스크립트 배포 순서:

1. `ActivityTracker(MIN_SESSION_COUNT)`
2. `HyblockIssuer(EAS_ADDRESS)`
3. `HyblockResolver(tracker, issuer)`
4. `HyblockSBT()`

후속 설정:

1. EAS Schema Registry에 raw schema를 등록한다.
2. Resolver를 실제로 쓸 경우 schema 등록 시 `HyblockResolver` 주소를 지정한다.
3. 반환 schema UID를 `HyblockIssuer.setSchemaUID`로 저장한다.
4. Web env의 schema UID와 issuer/SBT 주소를 갱신한다.
5. SBT server minter 주소와 owner를 확인한다.

raw schema:

```text
address walletAddress,bytes32 personalDataHash,string attestationType,string revealedData,bool isGraduated
```

## 8. 네트워크 주소

| 네트워크 | EAS |
| --- | --- |
| Ethereum Mainnet | `0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587` |
| Sepolia | `0xC2679fBD37d54388Ce493F1DB75320D236e1815e` |
| Base | `0x4200000000000000000000000000000000000021` |

현재 Web의 기본 SBT chain ID와 explorer 링크는 Sepolia 기준이다.

## 9. 테스트 범위

현재 `test/HyblockResolver.t.sol`은 다음을 확인한다.

- 일반 attestation issuer 확인
- 최소 출석 수 변경
- 졸업 조건 성공/출석 부족 실패
- 잘못된 attester 거부

현재 테스트에 없는 범위:

- `HyblockIssuer` admin/schema/EAS 호출
- `HyblockSBT` owner mint, transfer 차단, interface
- 배포 스크립트
- 실제 EAS 연동
- Web receipt 파싱과 DB 저장

## 10. 운영상 주의

- deploy와 schema 등록은 별도 트랜잭션이다.
- `setSchemaUID` 전에는 올바른 증명 발급을 기대하면 안 된다.
- ActivityTracker 데이터는 자동으로 DB와 일치하지 않는다.
- UI가 `isGraduated=true`를 사용하기 전에 tracker sync와 schema resolver 연결을 먼저 운영화해야 한다.
- on-chain 성공 후 Web의 Supabase 저장이 실패할 수 있으므로 tx/UID reconciliation 절차가 필요하다.
