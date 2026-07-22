import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';
import { getCampaigns } from '@/lib/recruitment-admin';

export async function GET() {
  const auth = await requireAdminApiAccess(); if (auth.response) return auth.response;
  try { return NextResponse.json({ campaigns: await getCampaigns() }); }
  catch (error) { console.error(error); return NextResponse.json({ error: '모집 목록을 불러오지 못했습니다.' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApiAccess(); if (auth.response) return auth.response;
  try {
    const body = await request.json() as { title?: string; cohort?: number; openAt?: string; closeAt?: string };
    const openAt = new Date(body.openAt ?? ''); const closeAt = new Date(body.closeAt ?? '');
    if (!body.title?.trim() || !Number.isInteger(body.cohort) || Number(body.cohort) <= 0 || Number.isNaN(openAt.valueOf()) || Number.isNaN(closeAt.valueOf()) || closeAt <= openAt) return NextResponse.json({ error: '모집명, 기수와 접수 기간을 확인해 주세요.' }, { status: 400 });
    const { data, error } = await getSupabase().rpc('create_recruitment_campaign', { p_title: body.title.trim(), p_cohort: body.cohort, p_application_open_at: openAt.toISOString(), p_application_close_at: closeAt.toISOString(), p_created_by_member_id: auth.member!.id });
    if (error) throw error;
    return NextResponse.json({ success: true, campaignId: data }, { status: 201 });
  } catch (error) { console.error(error); return NextResponse.json({ error: '모집 생성에 실패했습니다.' }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApiAccess(); if (auth.response) return auth.response;
  try {
    const body = await request.json() as { campaignId?: string; status?: string };
    const statuses = ['draft', 'open', 'closed', 'selection_complete', 'archived'];
    if (!body.campaignId || !body.status || !statuses.includes(body.status)) return NextResponse.json({ error: '변경할 모집과 상태를 확인해 주세요.' }, { status: 400 });
    const { data: campaign, error: readError } = await getSupabase().from('recruitment_campaign').select('status,application_open_at,application_close_at').eq('id', body.campaignId).single();
    if (readError) throw readError;
    if (campaign.status !== 'draft' && body.status === 'draft') return NextResponse.json({ error: '시작한 모집은 초안으로 되돌릴 수 없습니다.' }, { status: 409 });
    if (body.status === 'open') {
      const [{ count, error: questionError }, { count: evaluatorCount, error: evaluatorError }] = await Promise.all([
        getSupabase().from('application_question').select('id', { count: 'exact', head: true }).eq('campaign_id', body.campaignId),
        getSupabase().from('recruitment_evaluator').select('member_id', { count: 'exact', head: true }).eq('campaign_id', body.campaignId),
      ]);
      if (questionError) throw questionError;
      if (evaluatorError) throw evaluatorError;
      if (!count) return NextResponse.json({ error: '지원서 문항을 하나 이상 만들어야 모집을 시작할 수 있습니다.' }, { status: 409 });
      if (!evaluatorCount) return NextResponse.json({ error: '평가 관리자를 한 명 이상 지정해야 모집을 시작할 수 있습니다.' }, { status: 409 });
    }
    const { error } = await getSupabase().from('recruitment_campaign').update({ status: body.status }).eq('id', body.campaignId); if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) { console.error(error); const conflict = error?.code === '23505'; return NextResponse.json({ error: conflict ? '이미 접수 중인 모집이 있습니다.' : '모집 상태 변경에 실패했습니다.' }, { status: conflict ? 409 : 500 }); }
}
