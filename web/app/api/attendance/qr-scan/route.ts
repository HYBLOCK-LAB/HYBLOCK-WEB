import { NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/admin-auth';
import { parseAttendanceQrPayload } from '@/lib/attendance-qr';
import { checkInByMemberId, getActiveEventByName } from '@/lib/supabase-attendance';
import { executeRedisCommand } from '@/lib/upstash-redis';

type StoredQrPayload = {
  memberId: number;
  memberName: string;
  eventName: string;
  issuedAt: string;
  expiresAt: string;
};

export async function POST(request: Request) {
  const auth = await requireAdminApiAccess();
  if (auth.response) return auth.response;

  try {
    const { token: rawToken } = (await request.json()) as { token?: string };
    const token = typeof rawToken === 'string' ? parseAttendanceQrPayload(rawToken) : null;

    if (!token) {
      return NextResponse.json({ error: 'QR 토큰이 필요합니다.' }, { status: 400 });
    }

    const stored = await executeRedisCommand<string>(['GET', `attendance:qr:${token}`]);
    if (!stored) {
      return NextResponse.json({ error: '만료되었거나 존재하지 않는 QR입니다.' }, { status: 400 });
    }

    const payload = JSON.parse(stored) as StoredQrPayload;
    const activeEvent = await getActiveEventByName(payload.eventName);

    if (!activeEvent?.name) {
      await executeRedisCommand(['DEL', `attendance:qr:${token}`]);
      return NextResponse.json({ error: '현재 활성 세션과 일치하지 않는 QR입니다.' }, { status: 400 });
    }

    const result = await checkInByMemberId(payload.memberId, payload.eventName);
    await executeRedisCommand(['DEL', `attendance:qr:${token}`]);

    if (!result.success) {
      if (result.reason === 'inactive') {
        return NextResponse.json({ error: '현재 활성화된 세션이 아닙니다.' }, { status: 400 });
      }

      return NextResponse.json({ error: '출석 처리에 실패했습니다.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      alreadyCheckedIn: result.alreadyCheckedIn,
      memberName: result.memberName,
      eventName: payload.eventName,
      status: result.status,
    });
  } catch (error) {
    console.error('POST /api/attendance/qr-scan error:', error);
    return NextResponse.json({ error: 'QR 검증에 실패했습니다.' }, { status: 500 });
  }
}
