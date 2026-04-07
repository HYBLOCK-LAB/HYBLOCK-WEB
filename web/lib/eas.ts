import { encodeAbiParameters, keccak256, type Address, type Hex } from 'viem';

export type CertificateType = 'attendance' | 'external_activity' | 'assignment' | 'participation_period';

// EAS contract addresses per chain
export const EAS_CONTRACT_ADDRESS: Record<number, Address> = {
  1: '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587',       // Ethereum Mainnet
  11155111: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e', // Sepolia Testnet
};

export const ZERO_BYTES32 = ('0x' + '0'.repeat(64)) as Hex;

// Single schema UID — configure via .env after registering on https://easscan.org
export const EAS_SCHEMA_UID = (process.env.NEXT_PUBLIC_EAS_SCHEMA ?? ZERO_BYTES32) as Hex;
export const HYBLOCK_ISSUER_ADDRESS = (process.env.NEXT_PUBLIC_HYBLOCK_ISSUER_ADDRESS ?? '') as Address;
export const HYBLOCK_SBT_ADDRESS = (process.env.NEXT_PUBLIC_HYBLOCK_SBT_ADDRESS ?? '') as Address;

export const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  attendance: '출석',
  external_activity: '외부 세션',
  assignment: '해커톤·아이디어톤',
  participation_period: '참여 기간',
};

export function isEasSchemaConfigured(): boolean {
  return EAS_SCHEMA_UID !== ZERO_BYTES32;
}

export function isHyblockIssuerConfigured(): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(HYBLOCK_ISSUER_ADDRESS);
}

export function isHyblockSbtConfigured(): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(HYBLOCK_SBT_ADDRESS);
}

export function getEasContractAddress(chainId: number): Address | null {
  return EAS_CONTRACT_ADDRESS[chainId] ?? null;
}

// Minimal EAS ABI — attest function + Attested event
export const EAS_ABI = [
  {
    name: 'attest',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'request',
        type: 'tuple',
        components: [
          { name: 'schema', type: 'bytes32' },
          {
            name: 'data',
            type: 'tuple',
            components: [
              { name: 'recipient', type: 'address' },
              { name: 'expirationTime', type: 'uint64' },
              { name: 'revocable', type: 'bool' },
              { name: 'refUID', type: 'bytes32' },
              { name: 'data', type: 'bytes' },
              { name: 'value', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    name: 'Attested',
    type: 'event',
    inputs: [
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'attester', type: 'address', indexed: true },
      { name: 'uid', type: 'bytes32', indexed: false },
      { name: 'schemaUID', type: 'bytes32', indexed: true },
    ],
  },
] as const;

export const HYBLOCK_ISSUER_ABI = [
  {
    name: 'issue',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'walletAddress', type: 'address' },
      { name: 'personalDataHash', type: 'bytes32' },
      { name: 'attestationType', type: 'string' },
      { name: 'revealedData', type: 'string' },
      { name: 'isGraduated', type: 'bool' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
] as const;

export const HYBLOCK_SBT_ABI = [
  {
    name: 'safeMint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'uri', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'locked',
    type: 'function',
    stateMutability: 'pure',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
] as const;

// Compute a personal data hash from wallet address + cohort
export function computePersonalDataHash(walletAddress: Address, cohort: number): Hex {
  return keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }],
      [walletAddress, BigInt(cohort)],
    ),
  );
}

export function encodeAttestationData(params: {
  walletAddress: Address;
  personalDataHash: Hex;
  attestationType: CertificateType;
  revealedData: string;
  isGraduated: boolean;
}): Hex {
  return encodeAbiParameters(
    [
      { type: 'address', name: 'walletAddress' },
      { type: 'bytes32', name: 'personalDataHash' },
      { type: 'string', name: 'attestationType' },
      { type: 'string', name: 'revealedData' },
      { type: 'bool', name: 'isGraduated' },
    ],
    [
      params.walletAddress,
      params.personalDataHash,
      params.attestationType,
      params.revealedData,
      params.isGraduated,
    ],
  );
}
