import { NextResponse } from 'next/server';
import { clearWalletSession } from '@/lib/wallet-session';

export async function POST() {
  try {
    await clearWalletSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/auth/wallet/logout error:', error);
    return NextResponse.json({ error: '로그아웃 처리에 실패했습니다.' }, { status: 500 });
  }
}
