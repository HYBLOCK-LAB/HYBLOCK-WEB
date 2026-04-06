import { NextRequest, NextResponse } from 'next/server';
import { getCertificateCandidates } from '@/lib/supabase-certificate';
import type { CertificateType } from '@/lib/eas';

const VALID_TYPES: CertificateType[] = ['attendance', 'external_activity', 'assignment'];

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') as CertificateType | null;

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: '유효하지 않은 증명서 타입입니다.' }, { status: 400 });
  }

  try {
    const candidates = await getCertificateCandidates(type);
    return NextResponse.json(candidates);
  } catch (error) {
    console.error('GET /api/certificates/members error:', error);
    return NextResponse.json({ error: '멤버 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}
