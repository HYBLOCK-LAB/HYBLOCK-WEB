import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/admin-auth';
import { getMemberCertificateDetail } from '@/lib/supabase-certificate';

export async function GET(request: NextRequest) {
  const auth = await requireAdminApiAccess();
  if (auth.response) return auth.response;

  const wallet = request.nextUrl.searchParams.get('wallet');

  if (!wallet || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
    return NextResponse.json({ error: '유효하지 않은 지갑 주소입니다.' }, { status: 400 });
  }

  try {
    const detail = await getMemberCertificateDetail(wallet);
    return NextResponse.json(detail);
  } catch (error) {
    console.error('GET /api/certificates/member-detail error:', error);
    return NextResponse.json({ error: '멤버 상세 정보를 불러오지 못했습니다.' }, { status: 500 });
  }
}
