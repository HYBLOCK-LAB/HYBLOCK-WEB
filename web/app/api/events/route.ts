import { NextResponse } from 'next/server';
import {
  getEvents,
  getAttendanceData,
  addEvent,
  getActiveEvent,
  setActiveEvent,
  getEventCategories,
  getEventContents,
  getEventStatuses,
  deactivateActiveEvent,
  updateEventStatus,
  getEventParticipants,
  updateParticipantAttendanceStatus,
} from '@/lib/supabase-attendance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventName = searchParams.get('eventName')?.trim();
    const includeParticipants = searchParams.get('includeParticipants') === 'true';

    if (includeParticipants && eventName) {
      const participants = await getEventParticipants(eventName);
      return NextResponse.json({ participants });
    }

    const events = await getEvents();
    const attendanceData = await getAttendanceData();
    const activeEvent = await getActiveEvent();
    const categories = await getEventCategories();
    const contents = await getEventContents();
    const statuses = await getEventStatuses();
    return NextResponse.json({ events, attendanceData, activeEvent, categories, contents, statuses });
  } catch (error) {
    console.error('Events GET error:', error);
    return NextResponse.json({ error: '출석 데이터를 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { eventName, setActive, deactivate, category } = await request.json();
    
    if (deactivate) {
      await deactivateActiveEvent();
      return NextResponse.json({ success: true });
    }

    if (setActive) {
      const checkInCode = await setActiveEvent(eventName);
      return NextResponse.json({ success: true, checkInCode });
    }

    if (!eventName) {
      return NextResponse.json({ error: '이벤트 이름을 입력해주세요.' }, { status: 400 });
    }
    await addEvent(eventName, category || '세션');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Events POST error:', error);
    return NextResponse.json({ error: '이벤트를 업데이트하지 못했습니다.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { eventName, status, memberId, attendanceStatus } = await request.json();

    if (eventName && typeof memberId === 'number' && attendanceStatus) {
      if (!['present', 'late', 'absent', 'nonParticipation'].includes(attendanceStatus)) {
        return NextResponse.json({ error: '유효하지 않은 참여 상태입니다.' }, { status: 400 });
      }

      await updateParticipantAttendanceStatus({ eventName, memberId, status: attendanceStatus });
      return NextResponse.json({ success: true });
    }

    if (!eventName || !status) {
      return NextResponse.json({ error: '세션 이름과 상태가 필요합니다.' }, { status: 400 });
    }

    if (!['scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 세션 상태입니다.' }, { status: 400 });
    }

    await updateEventStatus(eventName, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Events PATCH error:', error);
    return NextResponse.json({ error: '세션 상태를 변경하지 못했습니다.' }, { status: 500 });
  }
}
