import { NextResponse } from 'next/server';
import { getAuthenticatedUserFromAccessToken } from '@/lib/supabase-auth';
import {
  checkInByMemberId,
  getActiveEventByName,
  isEventVisibleToAffiliation,
} from '@/lib/supabase-attendance';
import { getMemberByWallet } from '@/lib/supabase-member';
import { decodeEvent } from '@/lib/utils';
import { getWalletSessionMember } from '@/lib/wallet-session';

export const dynamic = 'force-dynamic';

function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice('Bearer '.length).trim();
}

export async function POST(request: Request) {
  try {
    const accessToken = getBearerToken(request);
    const body = (await request.json().catch(() => ({}))) as { event?: string };

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

    const eventName = typeof body.event === 'string' ? decodeEvent(body.event) : null;
    if (!eventName) {
      return NextResponse.json({ error: '세션 정보가 올바르지 않습니다.' }, { status: 400 });
    }

    const activeEvent = await getActiveEventByName(eventName);
    if (!activeEvent?.name) {
      return NextResponse.json(
        { error: '세션이 종료되었거나 활성 상태가 아닙니다.', code: 'session_inactive' },
        { status: 400 },
      );
    }

    if (!isEventVisibleToAffiliation(activeEvent, member.affiliation)) {
      return NextResponse.json(
        { error: '이 세션의 대상 파트가 아닙니다.', code: 'affiliation_mismatch' },
        { status: 403 },
      );
    }

    const result = await checkInByMemberId(member.id, activeEvent.name, member.name);

    if (!result.success) {
      if (result.reason === 'inactive') {
        return NextResponse.json(
          { error: '세션이 종료되었습니다.', code: 'session_inactive' },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: '출석 처리에 실패했습니다.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      alreadyCheckedIn: result.alreadyCheckedIn ?? false,
      status: result.status ?? null,
      eventName: activeEvent.name,
      memberName: result.memberName ?? member.name,
    });
  } catch (error) {
    console.error('POST /api/attendance/self-check-in error:', error);
    return NextResponse.json({ error: '출석 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
