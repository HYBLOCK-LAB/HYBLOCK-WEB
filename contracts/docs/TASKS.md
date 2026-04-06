# Hyblock Smart Contract - Design & Tasks

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Off-chain (DB + Web)                       │
│                                                                     │
│  1. QR Attendance → Supabase DB                                     │
│  2. Activity tracking (external, assignment, participation)         │
│  3. semester_criteria_tracking → graduation check                   │
│                                                                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ (admin triggers)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EAS (Ethereum Attestation Service)               │
│                                                                     │
│  SchemaRegistry: register attestation schema                        │
│  EAS.attest(): create on-chain attestation per criteria type        │
│  HyblockResolver: verify attester is authorized admin               │
│                                                                     │
│  Schema: "address walletAddress, bytes32 personalDataHash,          │
│           string revealedData, bool isGraduated"                    │
│                                                                     │
│  4 attestation types per member:                                    │
│    - attendance, external_activity, assignment, participation_period │
│                                                                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ (attestation UIDs)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Multi-sig Verification                            │
│                                                                     │
│  MultiSigVerifier: K-of-N admin signature verification              │
│  - EIP-712 typed data signing (off-chain by admins)                 │
│  - On-chain verification: nonce, deadline, signer uniqueness        │
│  - Threshold check (e.g., 2-of-3 admins)                           │
│                                                                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ (verified → mint)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    HyblockSBT (ERC-721 + ERC-5192)                  │
│                                                                     │
│  - Soulbound: permanently locked, non-transferable                  │
│  - tokenURI → IPFS metadata (certificate info)                      │
│  - attestationUID mapping per token                                 │
│  - Batch minting support                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Contract Specifications

### 1. IERC5192.sol — SBT Interface

ERC-5192 standard interface (Final status).

```solidity
interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}
// EIP-165 interfaceId: 0xb45a3c0e
```

### 2. HyblockSBT.sol — SBT Certificate Token

**Inherits:** ERC721, ERC721URIStorage, IERC5192, Ownable

**State:**
- `uint256 private _nextTokenId` — auto-increment counter
- `mapping(uint256 => bytes32[]) public tokenAttestationUIDs` — EAS UIDs per token
- `address public verifier` — MultiSigVerifier contract address

**Functions:**
| Function | Access | Description |
|----------|--------|-------------|
| `mint(address to, string tokenURI, bytes32[] attestationUIDs)` | verifier only | Mint single SBT |
| `batchMint(address[] to, string[] tokenURIs, bytes32[][] attestationUIDs)` | verifier only | Batch mint |
| `setVerifier(address)` | owner | Update verifier address |
| `locked(uint256 tokenId)` | view | Always returns true |
| `tokenURI(uint256 tokenId)` | view | Returns IPFS metadata URI |
| `supportsInterface(bytes4)` | view | ERC-721 + ERC-5192 |

**Transfer blocking:** Override `_update()` to revert on any transfer after mint.

### 3. MultiSigVerifier.sol — Threshold Signature Verification

**Inherits:** EIP712

**State:**
- `mapping(address => bool) public isAdmin`
- `address[] public admins`
- `uint256 public threshold` — minimum required signatures (K)
- `mapping(uint256 => bool) public usedNonces` — replay protection

**EIP-712 Type:**
```solidity
bytes32 constant MINT_TYPEHASH = keccak256(
    "MintCertificate(address recipient,string tokenURI,bytes32[] attestationUIDs,uint256 nonce,uint256 deadline)"
);
```

**Functions:**
| Function | Access | Description |
|----------|--------|-------------|
| `mintWithApproval(...)` | external | Verify K-of-N signatures then call SBT.mint() |
| `batchMintWithApproval(...)` | external | Batch version |
| `addAdmin(address)` | owner | Add admin |
| `removeAdmin(address)` | owner | Remove admin |
| `setThreshold(uint256)` | owner | Update threshold |

**Security:**
- Signatures sorted by signer address (ascending) to prevent duplicates
- `ECDSA.recover()` from OpenZeppelin for malleability protection
- `nonce` consumed on use → replay prevention
- `deadline` → time-limited signatures
- `domain separator` includes chainId + verifyingContract

### 4. HyblockResolver.sol — EAS Attestation Resolver

**Inherits:** SchemaResolver (from EAS)

**State:**
- `mapping(address => bool) public trustedAttesters`
- `address public owner`

**Functions:**
| Function | Access | Description |
|----------|--------|-------------|
| `onAttest(Attestation, uint256)` | EAS only | Verify attester is trusted |
| `onRevoke(Attestation, uint256)` | EAS only | Allow revocation |
| `addAttester(address)` | owner | Register trusted attester |
| `removeAttester(address)` | owner | Remove trusted attester |

---

## EAS Schema

**Schema string:**
```
address walletAddress, bytes32 personalDataHash, string revealedData, bool isGraduated
```

**Attestation types (4 per member):**
1. `attendance` — attendance criteria met
2. `external_activity` — external activity criteria met
3. `assignment` — assignment/output criteria met
4. `participation_period` — 2+ semesters criteria met

---

## SBT Metadata JSON (IPFS)

```json
{
  "name": "HyBlock 3기 수료증",
  "description": "HyBlock 블록체인 학회 3기 과정을 성공적으로 이수하였음을 증명합니다.",
  "image": "ipfs://<certificate-image-CID>",
  "external_url": "https://hyblock.club/verify/<tokenId>",
  "attributes": [
    { "trait_type": "Certificate Type", "value": "Completion" },
    { "trait_type": "Cohort", "value": "3" },
    { "trait_type": "Semester", "value": "2025 Fall" },
    { "trait_type": "Issued By", "value": "HyBlock Club" },
    { "trait_type": "Issue Date", "display_type": "date", "value": 1735689600 },
    { "trait_type": "Recipient", "value": "0xRecipientAddress" }
  ]
}
```

---

## Deployment (Sepolia Testnet)

### Contract Addresses (EAS - Sepolia)
- EAS: `0xC2679fBD37d54388Ce493F1DB75320D236e1815e`
- SchemaRegistry: `0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0`

### Deploy Order
1. `HyblockResolver` (needs EAS address)
2. Register EAS schema (via SDK, with resolver address)
3. `HyblockSBT` (owner = deployer)
4. `MultiSigVerifier` (admin addresses, threshold, SBT address)
5. `HyblockSBT.setVerifier(MultiSigVerifier address)`

### Environment Variables (.env)
```
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=...
ADMIN_1=0x...
ADMIN_2=0x...
ADMIN_3=0x...
```

---

## References

- [EIP-5192: Minimal Soulbound NFTs](https://eips.ethereum.org/EIPS/eip-5192)
- [EAS Documentation](https://docs.attest.org/)
- [EAS Contracts (GitHub)](https://github.com/ethereum-attestation-service/eas-contracts)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/5.x/)
- [Foundry Book](https://book.getfoundry.sh/)
- [EIP-712: Typed Structured Data Hashing](https://eips.ethereum.org/EIPS/eip-712)
