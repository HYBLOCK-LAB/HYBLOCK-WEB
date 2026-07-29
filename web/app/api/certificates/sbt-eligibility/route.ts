import { NextResponse } from 'next/server';
import { getSbtEligibility } from '@/lib/supabase-certificate';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('wallet');

  if (!walletAddress || !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
    return NextResponse.json({ error: '유효하지 않은 지갑 주소입니다.' }, { status: 400 });
  }

  try {
    const eligibility = await getSbtEligibility(walletAddress);
    return NextResponse.json(eligibility);
  } catch (error) {
    console.error('GET /api/certificates/sbt-eligibility error:', error);
    return NextResponse.json({ error: 'SBT 자격 정보를 불러오지 못했습니다.' }, { status: 500 });
  }
}
