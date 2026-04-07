import { randomBytes, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ATTENDANCE_QR_TTL_SECONDS, buildAttendanceQrPayload } from '@/lib/attendance-qr';
import { getAuthenticatedUserFromAccessToken } from '@/lib/supabase-auth';
import { getActiveEvent, getActiveEventByName } from '@/lib/supabase-attendance';
import { getMemberByWallet } from '@/lib/supabase-member';
import { executeRedisCommand } from '@/lib/upstash-redis';
import { getWalletSessionMember } from '@/lib/wallet-session';

function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice('Bearer '.length).trim();
}

export async function POST(request: Request) {
  try {
    const accessToken = getBearerToken(request);
    const requestBody = (await request.json().catch(() => ({}))) as { eventName?: string };
    const requestedEventName = typeof requestBody.eventName === 'string' ? requestBody.eventName.trim() : '';

    const activeEvent = requestedEventName
      ? await getActiveEventByName(requestedEventName)
      : await getActiveEvent();
    if (!activeEvent?.name) {
      return NextResponse.json({ error: '현재 활성화된 세션이 없습니다.' }, { status: 400 });
    }

    let member = await getWalletSessionMember();

    if (!member && accessToken) {
      const authUser = await getAuthenticatedUserFromAccessToken(accessToken);
      if (authUser) {
        const walletAddress =
          typeof authUser.user_metadata.wallet_address === 'string' ? authUser.user_metadata.wallet_address : null;

        member = walletAddress ? await getMemberByWallet(walletAddress) : null;
      }
    }

    if (!member || !member.is_active) {
      return NextResponse.json(
        { error: '로그인 세션이 없거나 연결된 활성 멤버를 찾지 못했습니다.' },
        { status: 401 },
      );
    }

    const token = `${randomUUID()}${randomBytes(8).toString('hex')}`;
    const expiresAt = new Date(Date.now() + ATTENDANCE_QR_TTL_SECONDS * 1000).toISOString();

    await executeRedisCommand([
      'SET',
      `attendance:qr:${token}`,
      JSON.stringify({
        memberId: member.id,
        memberName: member.name,
        eventName: activeEvent.name,
        issuedAt: new Date().toISOString(),
        expiresAt,
      }),
      'EX',
      ATTENDANCE_QR_TTL_SECONDS,
    ]);

    return NextResponse.json({
      token,
      qrValue: buildAttendanceQrPayload(token),
      expiresAt,
      eventName: activeEvent.name,
      memberName: member.name,
    });
  } catch (error) {
    console.error('POST /api/attendance/qr-token error:', error);
    const message =
      error instanceof Error && error.message.includes('Upstash Redis environment variables are not configured')
        ? '개인 QR 기능을 사용하려면 `UPSTASH_REDIS_REST_URL`과 `UPSTASH_REDIS_REST_TOKEN`을 설정해야 합니다.'
        : '개인 QR 발급에 실패했습니다.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
