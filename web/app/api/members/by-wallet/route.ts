import { NextRequest, NextResponse } from 'next/server';
import { getMemberByWallet } from '@/lib/supabase-member';

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');

  if (!wallet || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
    return NextResponse.json({ error: '유효하지 않은 지갑 주소입니다.' }, { status: 400 });
  }

  try {
    const member = await getMemberByWallet(wallet.toLowerCase());
    return NextResponse.json({ exists: Boolean(member), member });
  } catch (error) {
    console.error('GET /api/members/by-wallet error:', error);
    return NextResponse.json({ error: '멤버 조회에 실패했습니다.' }, { status: 500 });
  }
}
