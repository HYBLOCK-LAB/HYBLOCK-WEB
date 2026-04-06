import { NextResponse } from 'next/server';
import { checkIn, verifyActiveEventCode } from '@/lib/supabase-attendance';

export async function POST(request: Request) {
  try {
    const { name, event, code } = await request.json();

    if (!name || !event || !code) {
      return NextResponse.json({ error: '이름, 세션, 출석 코드를 모두 입력해주세요.' }, { status: 400 });
    }

    const verification = await verifyActiveEventCode(event, code);
    if (!verification.valid) {
      if (verification.reason === 'inactive') {
        return NextResponse.json({ error: '현재 활성화된 세션이 아니므로 출석할 수 없습니다.' }, { status: 400 });
      }

      if (verification.reason === 'code_mismatch') {
        return NextResponse.json({ error: '출석 코드가 일치하지 않습니다.' }, { status: 400 });
      }

      return NextResponse.json({ error: '유효한 세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    const result = await checkIn(name, event);

    if (result.success) {
      return NextResponse.json({ success: true, alreadyCheckedIn: result.alreadyCheckedIn });
    }

    if (result.reason === 'inactive') {
      return NextResponse.json({ error: '현재 활성화된 세션이 아니므로 출석할 수 없습니다.' }, { status: 400 });
    }

    return NextResponse.json({ error: '활성 멤버 목록에서 이름을 찾을 수 없습니다.' }, { status: 404 });
  } catch (error: any) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: '출석 처리에 실패했습니다.' }, { status: 500 });
  }
}
