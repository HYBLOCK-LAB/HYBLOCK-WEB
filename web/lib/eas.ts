import { encodeAbiParameters, keccak256, type Address, type Hex } from 'viem';

export type CertificateType = 'attendance' | 'external_activity' | 'assignment';

// EAS contract addresses per chain
export const EAS_CONTRACT_ADDRESS: Record<number, Address> = {
  1: '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587',       // Ethereum Mainnet
  11155111: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e', // Sepolia Testnet
};

export const ZERO_BYTES32 = ('0x' + '0'.repeat(64)) as Hex;

// Schema UIDs — configure via .env after registering on https://easscan.org
export const EAS_SCHEMA_UIDS: Record<CertificateType, Hex> = {
  attendance: (process.env.NEXT_PUBLIC_EAS_SCHEMA_ATTENDANCE ?? ZERO_BYTES32) as Hex,
  external_activity: (process.env.NEXT_PUBLIC_EAS_SCHEMA_EXTERNAL_ACTIVITY ?? ZERO_BYTES32) as Hex,
  assignment: (process.env.NEXT_PUBLIC_EAS_SCHEMA_ASSIGNMENT ?? ZERO_BYTES32) as Hex,
};

export const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  attendance: '출석',
  external_activity: '외부 세션',
  assignment: '해커톤·아이디어톤',
};

export function isEasSchemaConfigured(type: CertificateType): boolean {
  return EAS_SCHEMA_UIDS[type] !== ZERO_BYTES32;
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

// Compute a personal data hash from wallet address + cohort
export function computePersonalDataHash(walletAddress: Address, cohort: number): Hex {
  return keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }],
      [walletAddress, BigInt(cohort)],
    ),
  );
}

export function encodeAttendanceData(params: {
  recipient: Address;
  cohort: number;
  presentCount: number;
  lateCount: number;
  personalDataHash: Hex;
}): Hex {
  return encodeAbiParameters(
    [
      { type: 'address', name: 'recipient' },
      { type: 'uint256', name: 'cohort' },
      { type: 'uint256', name: 'presentCount' },
      { type: 'uint256', name: 'lateCount' },
      { type: 'bytes32', name: 'personalDataHash' },
    ],
    [
      params.recipient,
      BigInt(params.cohort),
      BigInt(params.presentCount),
      BigInt(params.lateCount),
      params.personalDataHash,
    ],
  );
}

export function encodeExternalActivityData(params: {
  recipient: Address;
  cohort: number;
  activityCount: number;
  personalDataHash: Hex;
}): Hex {
  return encodeAbiParameters(
    [
      { type: 'address', name: 'recipient' },
      { type: 'uint256', name: 'cohort' },
      { type: 'uint256', name: 'activityCount' },
      { type: 'bytes32', name: 'personalDataHash' },
    ],
    [params.recipient, BigInt(params.cohort), BigInt(params.activityCount), params.personalDataHash],
  );
}

export function encodeAssignmentData(params: {
  recipient: Address;
  cohort: number;
  submissionCount: number;
  assignmentType: string;
  personalDataHash: Hex;
}): Hex {
  return encodeAbiParameters(
    [
      { type: 'address', name: 'recipient' },
      { type: 'uint256', name: 'cohort' },
      { type: 'uint256', name: 'submissionCount' },
      { type: 'string', name: 'assignmentType' },
      { type: 'bytes32', name: 'personalDataHash' },
    ],
    [
      params.recipient,
      BigInt(params.cohort),
      BigInt(params.submissionCount),
      params.assignmentType,
      params.personalDataHash,
    ],
  );
}
