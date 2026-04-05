import { NextResponse } from 'next/server';
import { getEvents, getAttendanceData, addEvent, getActiveEvent, setActiveEvent, getEventCategories, deactivateActiveEvent } from '@/lib/google-sheets';

export async function GET() {
  try {
    const events = await getEvents();
    const attendanceData = await getAttendanceData();
    const activeEvent = await getActiveEvent();
    const categories = await getEventCategories();
    return NextResponse.json({ events, attendanceData, activeEvent, categories });
  } catch (error) {
    console.error('Events GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
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
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
    }
    await addEvent(eventName, category || '세션');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Events POST error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}
