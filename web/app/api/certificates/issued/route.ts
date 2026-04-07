import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/admin-auth';
import { getIssuedAttestations } from '@/lib/supabase-certificate';
import type { CertificateType } from '@/lib/eas';

const VALID_TYPES: CertificateType[] = ['attendance', 'external_activity', 'assignment', 'participation_period'];

export async function GET(request: NextRequest) {
  const auth = await requireAdminApiAccess();
  if (auth.response) return auth.response;

  const type = request.nextUrl.searchParams.get('type') as CertificateType | null;

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: '유효하지 않은 증명서 타입입니다.' }, { status: 400 });
  }

  try {
    const issued = await getIssuedAttestations(type);
    return NextResponse.json(issued);
  } catch (error) {
    console.error('GET /api/certificates/issued error:', error);
    return NextResponse.json({ error: '발급 이력을 불러오지 못했습니다.' }, { status: 500 });
  }
}
