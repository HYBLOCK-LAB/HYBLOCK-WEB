import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/admin-auth';
import { createMember, updateMemberAssignmentStatus } from '@/lib/supabase-member';

type CreateMemberBody = {
  wallet_address: string;
  name: string;
  major: string;
  affiliation: 'development' | 'business';
  cohort: number;
};

export async function POST(request: NextRequest) {
  let body: CreateMemberBody;

  try {
    body = (await request.json()) as CreateMemberBody;
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  const { wallet_address, name, major, affiliation, cohort } = body;

  if (!wallet_address || !name || !major || !affiliation || !cohort) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
  }

  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet_address)) {
    return NextResponse.json({ error: '유효하지 않은 지갑 주소입니다.' }, { status: 400 });
  }

  if (!['development', 'business'].includes(affiliation)) {
    return NextResponse.json({ error: '유효하지 않은 소속입니다.' }, { status: 400 });
  }

  if (!Number.isInteger(cohort) || cohort < 1) {
    return NextResponse.json({ error: '기수는 1 이상의 정수여야 합니다.' }, { status: 400 });
  }

  try {
    const member = await createMember({
      wallet_address,
      name: name.trim(),
      major: major.trim(),
      affiliation,
      cohort,
    });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error('POST /api/members error:', error);
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    const isDuplicate = message.includes('duplicate') || message.includes('unique');

    return NextResponse.json(
      { error: isDuplicate ? '이미 등록된 지갑입니다.' : '회원가입에 실패했습니다.' },
      { status: isDuplicate ? 409 : 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { response } = await requireAdminApiAccess();
  if (response) return response;

  let body: { memberId?: number; hasAssignment?: boolean };

  try {
    body = (await request.json()) as { memberId?: number; hasAssignment?: boolean };
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  if (typeof body.memberId !== 'number' || typeof body.hasAssignment !== 'boolean') {
    return NextResponse.json({ error: 'memberId와 hasAssignment 값이 필요합니다.' }, { status: 400 });
  }

  try {
    const member = await updateMemberAssignmentStatus(body.memberId, body.hasAssignment);
    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error('PATCH /api/members error:', error);
    return NextResponse.json({ error: '산출물 상태 업데이트에 실패했습니다.' }, { status: 500 });
  }
}
