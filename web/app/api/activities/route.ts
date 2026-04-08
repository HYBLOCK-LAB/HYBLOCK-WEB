import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/admin-auth';
import {
  createActivity,
  deleteActivity,
  getActivities,
  updateActivity,
  type ActivitySessionType,
  type ActivityTargetAffiliation,
} from '@/lib/supabase-activities';

export async function GET() {
  const auth = await requireAdminApiAccess();
  if (auth.response) return auth.response;

  try {
    const activities = await getActivities();
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('GET /api/activities error:', error);
    return NextResponse.json({ error: '활동 데이터를 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApiAccess();
  if (auth.response) return auth.response;

  let body: {
    name: string;
    description?: string;
    sessionType: ActivitySessionType;
    targetAffiliation?: ActivityTargetAffiliation;
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

  if (body.sessionType === 'advanced' && !['development', 'business'].includes(body.targetAffiliation ?? '')) {
    return NextResponse.json({ error: '심화 세션은 대상 파트를 선택해야 합니다.' }, { status: 400 });
  }

  try {
    const activity = await createActivity({
      name: body.name.trim(),
      description: body.description,
      sessionType: body.sessionType,
      targetAffiliation: body.sessionType === 'advanced' ? body.targetAffiliation ?? null : null,
      date: body.date,
      cohort: body.cohort ?? Number(process.env.DEFAULT_SESSION_COHORT ?? '1'),
    });

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error('POST /api/activities error:', error);
    return NextResponse.json({ error: '활동 생성에 실패했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApiAccess();
  if (auth.response) return auth.response;

  const activityId = new URL(request.url).searchParams.get('id')?.trim();

  if (!activityId) {
    return NextResponse.json({ error: '삭제할 활동 ID가 없습니다.' }, { status: 400 });
  }

  try {
    await deleteActivity(activityId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/activities error:', error);
    return NextResponse.json({ error: '활동 삭제에 실패했습니다.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApiAccess();
  if (auth.response) return auth.response;

  let body: {
    id: string;
    name: string;
    description?: string;
    sessionType: ActivitySessionType;
    targetAffiliation?: ActivityTargetAffiliation;
    date: string;
    cohort?: number;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  if (!body.id?.trim() || !body.name?.trim() || !body.sessionType || !body.date) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
  }

  if (!['basic', 'advanced', 'misc', 'external', 'hackathon'].includes(body.sessionType)) {
    return NextResponse.json({ error: '유효하지 않은 세션 타입입니다.' }, { status: 400 });
  }

  if (body.sessionType === 'advanced' && !['development', 'business'].includes(body.targetAffiliation ?? '')) {
    return NextResponse.json({ error: '심화 세션은 대상 파트를 선택해야 합니다.' }, { status: 400 });
  }

  try {
    const activity = await updateActivity({
      id: body.id.trim(),
      name: body.name.trim(),
      description: body.description,
      sessionType: body.sessionType,
      targetAffiliation: body.sessionType === 'advanced' ? body.targetAffiliation ?? null : null,
      date: body.date,
      cohort: body.cohort,
    });

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error('PATCH /api/activities error:', error);
    return NextResponse.json({ error: '활동 수정에 실패했습니다.' }, { status: 500 });
  }
}
