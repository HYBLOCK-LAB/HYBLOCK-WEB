import { NextResponse } from 'next/server';
import { clearWalletSession, getWalletSession } from '@/lib/wallet-session';

export const dynamic = 'force-dynamic';

// Reconcile a connected wallet with the authenticated identity. Never switch identity
// without a new signature. A missing wallet on initial load can retain its session.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { address?: unknown; disconnected?: unknown } | null;
    if (!body || typeof body !== 'object') return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
    if (body.address !== null && (typeof body.address !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(body.address))) {
      return NextResponse.json({ error: '유효하지 않은 지갑 주소입니다.' }, { status: 400 });
    }
    if (body.disconnected === true) {
      await clearWalletSession();
      return NextResponse.json({ session: null }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const current = await getWalletSession();
    if (current && typeof body.address === 'string' &&
      current.member.wallet_address?.toLowerCase() !== body.address.toLowerCase()) {
      await clearWalletSession();
      return NextResponse.json({ session: null }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({
      session: current ? {
        address: current.member.wallet_address,
        memberId: current.member.id,
        expiresAt: current.expiresAt,
      } : null,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('POST /api/auth/wallet/session error:', error);
    return NextResponse.json({ error: '로그인 상태를 확인하지 못했습니다.' }, { status: 500 });
  }
}
