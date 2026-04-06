import { NextRequest, NextResponse } from 'next/server';
import { createWalletNonce } from '@/lib/wallet-session';

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');

  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: '유효하지 않은 지갑 주소입니다.' }, { status: 400 });
  }

  try {
    const result = await createWalletNonce(address);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/auth/wallet/nonce error:', error);
    return NextResponse.json({ error: '로그인 nonce 발급에 실패했습니다.' }, { status: 500 });
  }
}
