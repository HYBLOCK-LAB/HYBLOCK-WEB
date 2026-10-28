import { NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/admin-auth';
import { isValidLateAfterMinutes, DEFAULT_LATE_AFTER_MINUTES } from '@/lib/attendance-policy';
import {
  getEvents,
  getAttendanceData,
  addEvent,
  getActiveEvent,
  getActiveEvents,
  setActiveEvent,
  getEventCategories,
  getEventContents,
  getEventStatuses,
  deactivateEvent,
  updateEventStatus,
  getEventParticipants,
  updateParticipantsAttendanceStatus,
  getEventLateAfterMinutes,
} from '@/lib/supabase-attendance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await requireAdminApiAccess();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const eventName = searchParams.get('eventName')?.trim();
    const includeParticipants = searchParams.get('includeParticipants') === 'true';

    if (includeParticipants && eventName) {
      const participants = await getEventParticipants(eventName);
      return NextResponse.json({ participants });
    }

    const events = await getEvents().catch((error) => {
      console.error('Events GET getEvents error:', error);
      return [];
    });
    const attendanceData = await getAttendanceData().catch((error) => {
      console.error('Events GET getAttendanceData error:', error);
      return [];
    });
    const activeEvents = await getActiveEvents().catch((error) => {
      console.error('Events GET getActiveEvents error:', error);
      return [];
    });
    const activeEvent = activeEvents[0] ?? null;
    const categories = await getEventCategories().catch((error) => {
      console.error('Events GET getEventCategories error:', error);
      return {};
    });
    const contents = await getEventContents().catch((error) => {
      console.error('Events GET getEventContents error:', error);
      return {};
    });
    const statuses = await getEventStatuses().catch((error) => {
      console.error('Events GET getEventStatuses error:', error);
      return {};
    });
    const lateAfterMinutes = await getEventLateAfterMinutes();
    return NextResponse.json({ events, attendanceData, activeEvent, activeEvents, categories, contents, statuses, lateAfterMinutes });
  } catch (error) {
    console.error('Events GET error:', error);
    return NextResponse.json({ error: '출석 데이터를 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApiAccess();
  if (auth.response) return auth.response;

  try {
    const { eventName, setActive, deactivate, category, targetAffiliation, lateAfterMinutes = DEFAULT_LATE_AFTER_MINUTES } = await request.json();
    
    if (deactivate) {
      await deactivateEvent(typeof eventName === 'string' ? eventName : undefined);
      return NextResponse.json({ success: true });
    }

    if (setActive) {
      if (typeof eventName !== 'string' || !eventName.trim() || !isValidLateAfterMinutes(lateAfterMinutes)) {
        return NextResponse.json({ error: '세션 이름과 0~180 사이의 지각 기준(분)을 입력해주세요.' }, { status: 400 });
      }
      const checkInCode = await setActiveEvent(eventName, lateAfterMinutes);
      return NextResponse.json({ success: true, checkInCode });
    }

    if (!eventName) {
      return NextResponse.json({ error: '이벤트 이름을 입력해주세요.' }, { status: 400 });
    }
    await addEvent(
      eventName,
      category || '세션',
      targetAffiliation === 'development' || targetAffiliation === 'business' ? targetAffiliation : null,
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Events POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '이벤트를 업데이트하지 못했습니다.' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApiAccess();
  if (auth.response) return auth.response;

  try {
    const { eventName, status, memberId, memberIds, attendanceStatus, lateAfterMinutes = DEFAULT_LATE_AFTER_MINUTES } = await request.json();

    if (memberId !== undefined || memberIds !== undefined || attendanceStatus !== undefined) {
      const ids = memberIds !== undefined ? memberIds : [memberId];
      if (typeof eventName !== 'string' || !eventName.trim() || !Array.isArray(ids) || !ids.length ||
        ids.length > 500 || ids.some((id: unknown) => typeof id !== 'number' || !Number.isInteger(id) || id <= 0) ||
        !['present', 'late', 'absent', 'nonParticipation'].includes(attendanceStatus)) {
        return NextResponse.json({ error: '세션, 변경할 회원(1~500명), 유효한 출석 상태가 필요합니다.' }, { status: 400 });
      }
      await updateParticipantsAttendanceStatus({ eventName, memberIds: ids, status: attendanceStatus });
      return NextResponse.json({ success: true });
    }

    if (!eventName || !status) {
      return NextResponse.json({ error: '세션 이름과 상태가 필요합니다.' }, { status: 400 });
    }

    if (!['scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 세션 상태입니다.' }, { status: 400 });
    }

    if (status === 'in_progress' && !isValidLateAfterMinutes(lateAfterMinutes)) {
      return NextResponse.json({ error: '지각 기준은 0~180 사이의 정수(분)로 입력해주세요.' }, { status: 400 });
    }
    await updateEventStatus(eventName, status, status === 'in_progress' ? lateAfterMinutes : undefined);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Events PATCH error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : '세션 상태를 변경하지 못했습니다.' }, { status: 500 });
  }
}
