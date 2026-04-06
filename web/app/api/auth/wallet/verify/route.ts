import { NextRequest, NextResponse } from 'next/server';
import { verifyWalletLogin } from '@/lib/wallet-session';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      address?: string;
      message?: string;
      signature?: string;
    };

    if (!body.address || !body.message || !body.signature) {
      return NextResponse.json({ error: '주소, 메시지, 서명이 필요합니다.' }, { status: 400 });
    }

    const result = await verifyWalletLogin({
      address: body.address,
      message: body.message,
      signature: body.signature,
    });

    if (!result.member) {
      return NextResponse.json({ exists: false, error: '회원 정보가 없어 회원가입이 필요합니다.' }, { status: 404 });
    }

    return NextResponse.json({
      exists: true,
      member: {
        id: result.member.id,
        name: result.member.name,
        wallet_address: result.member.wallet_address,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/wallet/verify error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '지갑 로그인 검증에 실패했습니다.' },
      { status: 400 },
    );
  }
}
