import { NextRequest, NextResponse } from 'next/server';
import { createActivity, getActivities, type ActivitySessionType } from '@/lib/supabase-activities';

export async function GET() {
  try {
    const activities = await getActivities();
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('GET /api/activities error:', error);
    return NextResponse.json({ error: '활동 데이터를 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: {
    name: string;
    description?: string;
    sessionType: ActivitySessionType;
    date: string;
    cohort?: number;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  if (!body.name?.trim() || !body.sessionType || !body.date) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
  }

  if (!['basic', 'advanced', 'misc', 'external', 'hackathon'].includes(body.sessionType)) {
    return NextResponse.json({ error: '유효하지 않은 세션 타입입니다.' }, { status: 400 });
  }

  try {
    const activity = await createActivity({
      name: body.name.trim(),
      description: body.description,
      sessionType: body.sessionType,
      date: body.date,
      cohort: body.cohort ?? Number(process.env.DEFAULT_SESSION_COHORT ?? '1'),
    });

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error('POST /api/activities error:', error);
    return NextResponse.json({ error: '활동 생성에 실패했습니다.' }, { status: 500 });
  }
}
