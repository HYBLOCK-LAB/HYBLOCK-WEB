import { NextResponse } from 'next/server';
import { getSbtEligibility } from '@/lib/supabase-certificate';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('wallet');

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
  }

  try {
    const eligibility = await getSbtEligibility(walletAddress);
    return NextResponse.json(eligibility);
  } catch (error: any) {
    console.error('SBT Eligibility Check Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
