import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApiAccess(); if (auth.response) return auth.response;
  const { id } = await params;
  try {
    const body = await request.json() as { memberIds?: number[] };
    const memberIds = [...new Set((body.memberIds ?? []).filter(Number.isInteger))];
    if (!memberIds.length) return NextResponse.json({ error: '평가 관리자를 한 명 이상 지정해 주세요.' }, { status: 400 });
    const supabase = getSupabase();
    const { data: campaign, error: campaignError } = await supabase.from('recruitment_campaign').select('status').eq('id', id).single(); if (campaignError) throw campaignError;
    if (campaign.status !== 'draft') return NextResponse.json({ error: '평가 관리자는 모집 시작 전에만 변경할 수 있습니다.' }, { status: 409 });
    const { data: admins, error: adminError } = await supabase.from('member').select('id').in('id', memberIds).eq('is_admin', true).eq('is_active', true); if (adminError) throw adminError;
    if ((admins ?? []).length !== memberIds.length) return NextResponse.json({ error: '관리자 권한이 없는 멤버가 포함되어 있습니다.' }, { status: 400 });
    const { error: deleteError } = await supabase.from('recruitment_evaluator').delete().eq('campaign_id', id); if (deleteError) throw deleteError;
    const { error: insertError } = await supabase.from('recruitment_evaluator').insert(memberIds.map((memberId) => ({ campaign_id: id, member_id: memberId }))); if (insertError) throw insertError;
    return NextResponse.json({ success: true });
  } catch (error) { console.error(error); return NextResponse.json({ error: '평가 관리자 지정에 실패했습니다.' }, { status: 500 }); }
}
