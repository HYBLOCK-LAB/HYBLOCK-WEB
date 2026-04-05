import { NextResponse } from 'next/server';
import { getEvents, getAttendanceData, addEvent, getActiveEvent, setActiveEvent, getEventCategories, deactivateActiveEvent } from '@/lib/supabase-attendance';

export async function GET() {
  try {
    const events = await getEvents();
    const attendanceData = await getAttendanceData();
    const activeEvent = await getActiveEvent();
    const categories = await getEventCategories();
    return NextResponse.json({ events, attendanceData, activeEvent, categories });
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
      await setActiveEvent(eventName);
      return NextResponse.json({ success: true });
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
