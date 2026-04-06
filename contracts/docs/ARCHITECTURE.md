# Hyblock Smart Contract Architecture

## Full System Flow

```
                          ┌──────────────────────────────────┐
                          │         Off-chain (Web/DB)        │
                          │                                  │
                          │  QR Attendance → Supabase DB     │
                          │  Activity Tracking               │
                          │  Graduation Check                │
                          └──────────┬───────────────────────┘
                                     │
                          ┌──────────▼───────────────────────┐
                          │  Step 1: Create EAS Attestation   │
                          │                                  │
                          │  Admin calls EAS.attest() with:  │
                          │  ┌────────────────────────────┐  │
                          │  │ walletAddress              │  │
                          │  │ personalDataHash           │  │
                          │  │ revealedData               │  │
                          │  │ isGraduated = true         │  │
                          │  └────────────────────────────┘  │
                          │                                  │
                          │  ┌─────────────────────┐         │
                          │  │  HyblockResolver    │◄────────┤
                          │  │  onAttest() checks:  │         │
                          │  │  "Is attester in     │         │
                          │  │   trustedAttesters?" │         │
                          │  │  YES → allow         │         │
                          │  │  NO  → revert        │         │
                          │  └─────────────────────┘         │
                          │                                  │
                          │  Returns: attestationUID (bytes32)│
                          └──────────┬───────────────────────┘
                                     │
                                     │ x4 (attendance, external_activity,
                                     │     assignment, participation_period)
                                     │
                          ┌──────────▼───────────────────────┐
                          │  Step 2: Collect Admin Signatures  │
                          │         (Off-chain, EIP-712)      │
                          │                                  │
                          │  Each admin signs typed data:     │
                          │  ┌────────────────────────────┐  │
                          │  │ MintCertificate {          │  │
                          │  │   recipient: 0xAlice       │  │
                          │  │   tokenURI: "ipfs://..."   │  │
                          │  │   attestationUIDs: [...]   │  │
                          │  │   nonce: 42                │  │
                          │  │   deadline: 1735776000     │  │
                          │  │ }                          │  │
                          │  └────────────────────────────┘  │
                          │                                  │
                          │  domain: {                       │
                          │    name: "HyblockVerifier"       │
                          │    version: "1"                  │
                          │    chainId: 11155111 (Sepolia)   │
                          │    verifyingContract: 0xVerifier │
                          │  }                               │
                          │                                  │
                          │  Admin1 signs → sig1             │
                          │  Admin2 signs → sig2             │
                          │  (2 of 3 required)               │
                          └──────────┬───────────────────────┘
                                     │
                          ┌──────────▼───────────────────────┐
                          │  Step 3: Submit to MultiSigVerifier│
                          │                                  │
                          │  mintWithApproval(                │
                          │    recipient,                     │
                          │    tokenURI,                      │
                          │    attestationUIDs,               │
                          │    nonce,                         │
                          │    deadline,                      │
                          │    [sig1, sig2]  ← sorted by addr│
                          │  )                                │
                          │                                  │
                          │  Verification:                    │
                          │  ┌────────────────────────────┐  │
                          │  │ 1. deadline not expired?   │  │
                          │  │ 2. nonce not used?         │  │
                          │  │ 3. sig count >= threshold? │  │
                          │  │ 4. For each signature:     │  │
                          │  │    - recover signer addr   │  │
                          │  │    - addr > prev? (sorted) │  │
                          │  │    - is signer admin?      │  │
                          │  │ 5. Mark nonce as used      │  │
                          │  └────────────────────────────┘  │
                          │                                  │
                          │  All passed → call SBT.mint()    │
                          └──────────┬───────────────────────┘
                                     │
                          ┌──────────▼───────────────────────┐
                          │  Step 4: Mint SBT (HyblockSBT)    │
                          │                                  │
                          │  _safeMint(alice, tokenId=0)     │
                          │  _setTokenURI("ipfs://cert.json")│
                          │  _tokenAttestationUIDs[0] = UIDs │
                          │                                  │
                          │  emit Locked(0)                   │
                          │  emit CertificateMinted(0, alice) │
                          │                                  │
                          │  Token is now SOULBOUND:          │
                          │  ┌────────────────────────────┐  │
                          │  │ transferFrom  → REVERT     │  │
                          │  │ safeTransfer  → REVERT     │  │
                          │  │ approve       → REVERT     │  │
                          │  │ locked(0)     → true       │  │
                          │  └────────────────────────────┘  │
                          └──────────────────────────────────┘
```

## Contract Interaction Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Owner (Deployer)                            │
│                                                                     │
│  Deploys all contracts                                              │
│  Sets verifier address on SBT                                       │
│  Manages admin list & threshold on MultiSigVerifier                 │
│  Manages trusted attesters on HyblockResolver                       │
└──────┬──────────────────┬──────────────────┬────────────────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐  ┌───────────────┐  ┌───────────────────┐
│ HyblockSBT   │  │ MultiSig      │  │ HyblockResolver   │
│              │  │ Verifier      │  │                   │
│ ERC-721      │  │               │  │ SchemaResolver    │
│ ERC-5192     │  │ EIP-712       │  │                   │
│ URIStorage   │  │ ECDSA         │  │ trustedAttesters  │
│ Ownable      │  │ Ownable       │  │ mapping           │
├──────────────┤  ├───────────────┤  ├───────────────────┤
│              │  │               │  │                   │
│ mint()  ◄────┼──┤ mintWith      │  │ onAttest() ◄──────┤── EAS.attest()
│ batchMint()◄─┼──┤  Approval()   │  │ onRevoke() ◄──────┤── EAS.revoke()
│              │  │ batchMintWith │  │                   │
│ verifier ────┼──► Approval()    │  │                   │
│ only         │  │               │  │                   │
├──────────────┤  ├───────────────┤  ├───────────────────┤
│ locked()     │  │ getMintDigest │  │ addAttester()     │
│ tokenURI()   │  │ domainSep()   │  │ removeAttester()  │
│ getAttest..()│  │ getAdmins()   │  │ transferOwner..() │
│ totalSupply()│  │ isAdmin()     │  │                   │
└──────────────┘  └───────────────┘  └───────────────────┘
```

## Security Model

```
Attack                     Defense
─────────────────────────  ─────────────────────────────────────────
Replay same signatures     nonce consumed on use → NonceAlreadyUsed
  on another mint

Replay on different        EIP-712 domain separator includes
  chain/contract             chainId + verifyingContract address

One admin signs twice      Signatures sorted by address ascending
                             → DuplicateOrUnsorted if addr <= prev

Non-admin submits          ECDSA.recover() extracts signer address
  forged signature           → NotAdmin if not in isAdmin mapping

Delayed submission         deadline parameter → DeadlineExpired
  of old signatures          if block.timestamp > deadline

Transfer SBT to           _update() override reverts on any
  another wallet             transfer where from != address(0)

Signature malleability     OpenZeppelin ECDSA.recover() normalizes
  (s-value manipulation)     s to lower half of secp256k1 order

Unauthorized attestation   HyblockResolver.onAttest() checks
  creation via EAS           trustedAttesters mapping → false if not
```

## Deployment Sequence

```
                    Step 1              Step 2              Step 3
                 ┌──────────┐      ┌──────────────┐    ┌─────────────┐
  deploy ───────►│ HyblockSBT│     │ MultiSig     │    │ Hyblock     │
                 │ (owner)  │      │ Verifier     │    │ Resolver    │
                 └─────┬────┘      │ (admins,     │    │ (EAS addr,  │
                       │           │  threshold,  │    │  owner)     │
                       │           │  sbt addr,   │    └──────┬──────┘
                       │           │  owner)      │           │
                       │           └──────┬───────┘           │
                       │                  │                   │
                    Step 4             Step 5              Step 6
                 ┌─────▼────┐      ┌──────▼───────┐    ┌──────▼──────┐
                 │ setVerifier│     │ (automatic   │    │ addAttester │
                 │ (verifier │     │  from        │    │ (admin1)    │
                 │  address) │     │  constructor)│    │ addAttester │
                 └───────────┘     └──────────────┘    │ (admin2)    │
                                                       │ addAttester │
                                                       │ (admin3)    │
                                                       └─────────────┘

                    Step 7 (via EAS SDK, not contract)
                 ┌──────────────────────────────────┐
                 │ SchemaRegistry.register(          │
                 │   schema: "address walletAddress, │
                 │     bytes32 personalDataHash,     │
                 │     string revealedData,          │
                 │     bool isGraduated",            │
                 │   resolver: Resolver address,     │
                 │   revocable: true                 │
                 │ )                                 │
                 │ → returns schemaUID               │
                 └──────────────────────────────────┘
```

## Gas Costs (from tests)

```
Operation                          Gas Used    ~USD (Sepolia: free)
──────────────────────────────     ────────    ────────────────────
Single mint (via MultiSig)         ~402,000    Mainnet: ~$3-12
Batch mint 2 tokens                ~502,000    Mainnet: ~$4-15
Transfer attempt (reverts)         ~305,000    (wasted gas)
Admin management (add/remove)      ~108-144k   Mainnet: ~$1-4
Signature verification overhead    ~117-125k   per verification
```
