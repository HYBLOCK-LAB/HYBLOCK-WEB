import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { recoverMessageAddress } from 'viem';
import { getMemberByWallet, type MemberProfile } from '@/lib/supabase-member';

const WALLET_NONCE_COOKIE = 'hyblock_wallet_nonce';
const WALLET_SESSION_COOKIE = 'hyblock_wallet_session';
const WALLET_NONCE_TTL_SECONDS = 5 * 60;
const WALLET_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

type SignedPayload<T> = {
  payload: T;
  signature: string;
};

type WalletNoncePayload = {
  address: string;
  nonce: string;
  issuedAt: string;
  expiresAt: number;
};

type WalletSessionPayload = {
  address: string;
  memberId: number;
  expiresAt: number;
};

function getWalletSessionSecret() {
  const secret =
    process.env.WALLET_SESSION_SECRET ??
    process.env.AUTH_SESSION_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error('Wallet session secret is not configured.');
  }

  return secret;
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(serializedPayload: string) {
  return createHmac('sha256', getWalletSessionSecret()).update(serializedPayload).digest('base64url');
}

function encodeSignedPayload<T>(payload: T) {
  const serializedPayload = JSON.stringify(payload);
  const encodedPayload = toBase64Url(serializedPayload);
  const signature = signPayload(serializedPayload);
  return `${encodedPayload}.${signature}`;
}

function decodeSignedPayload<T>(value: string): T | null {
  const [encodedPayload, signature] = value.split('.');
  if (!encodedPayload || !signature) return null;

  const serializedPayload = fromBase64Url(encodedPayload);
  const expectedSignature = signPayload(serializedPayload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  return JSON.parse(serializedPayload) as T;
}

function buildWalletLoginMessage(address: string, nonce: string, issuedAt: string) {
  return [
    'HYBLOCK wallet login',
    `Address: ${address.toLowerCase()}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n');
}

export async function createWalletNonce(address: string) {
  const nonce = crypto.randomUUID();
  const issuedAt = new Date().toISOString();
  const payload: WalletNoncePayload = {
    address: address.toLowerCase(),
    nonce,
    issuedAt,
    expiresAt: Date.now() + WALLET_NONCE_TTL_SECONDS * 1000,
  };

  const cookieStore = await cookies();
  cookieStore.set(WALLET_NONCE_COOKIE, encodeSignedPayload(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: WALLET_NONCE_TTL_SECONDS,
  });

  return {
    nonce,
    message: buildWalletLoginMessage(address, nonce, issuedAt),
    expiresIn: WALLET_NONCE_TTL_SECONDS,
  };
}

export async function verifyWalletLogin(params: { address: string; message: string; signature: string }) {
  const normalizedAddress = params.address.toLowerCase();
  const recoveredAddress = (await recoverMessageAddress({
    message: params.message,
    signature: params.signature as `0x${string}`,
  })).toLowerCase();

  if (recoveredAddress !== normalizedAddress) {
    throw new Error('지갑 서명 검증에 실패했습니다.');
  }

  const cookieStore = await cookies();
  const nonceCookie = cookieStore.get(WALLET_NONCE_COOKIE)?.value;
  if (!nonceCookie) {
    throw new Error('로그인 요청이 만료되었습니다. 다시 시도하세요.');
  }

  const noncePayload = decodeSignedPayload<WalletNoncePayload>(nonceCookie);
  if (!noncePayload || noncePayload.address !== normalizedAddress || noncePayload.expiresAt < Date.now()) {
    throw new Error('로그인 요청이 유효하지 않습니다. 다시 시도하세요.');
  }

  const expectedMessage = buildWalletLoginMessage(params.address, noncePayload.nonce, noncePayload.issuedAt);
  if (params.message !== expectedMessage) {
    throw new Error('서명 메시지가 일치하지 않습니다.');
  }

  const member = await getMemberByWallet(params.address);
  if (!member || !member.is_active) {
    return { member: null };
  }

  const sessionPayload: WalletSessionPayload = {
    address: normalizedAddress,
    memberId: member.id,
    expiresAt: Date.now() + WALLET_SESSION_TTL_SECONDS * 1000,
  };

  cookieStore.set(WALLET_SESSION_COOKIE, encodeSignedPayload(sessionPayload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: WALLET_SESSION_TTL_SECONDS,
  });
  cookieStore.delete(WALLET_NONCE_COOKIE);

  return { member };
}

export async function getWalletSessionMember(): Promise<MemberProfile | null> {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(WALLET_SESSION_COOKIE)?.value;
  if (!rawSession) return null;

  const payload = decodeSignedPayload<WalletSessionPayload>(rawSession);
  if (!payload || payload.expiresAt < Date.now()) {
    cookieStore.delete(WALLET_SESSION_COOKIE);
    return null;
  }

  const member = await getMemberByWallet(payload.address);
  if (!member || !member.is_active || member.id !== payload.memberId) {
    cookieStore.delete(WALLET_SESSION_COOKIE);
    return null;
  }

  return member;
}

export async function clearWalletSession() {
  const cookieStore = await cookies();
  cookieStore.delete(WALLET_NONCE_COOKIE);
  cookieStore.delete(WALLET_SESSION_COOKIE);
}
