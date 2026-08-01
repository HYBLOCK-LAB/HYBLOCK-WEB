import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';
import { applicationStatusLabels } from '@/lib/recruitment-admin';

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApiAccess(); if (auth.response) return auth.response;
  try {
    const body = await request.json() as { applicationIds?: string[]; status?: string; note?: string };
    if (!body.status || !(body.status in applicationStatusLabels) || !body.applicationIds?.length || body.applicationIds.length > 200) return NextResponse.json({ error: '변경할 지원자와 상태를 확인해 주세요.' }, { status: 400 });
    const { data, error } = await getSupabase().rpc('bulk_update_application_status', { p_application_ids: body.applicationIds, p_to_status: body.status, p_changed_by_member_id: auth.member!.id, p_note: body.note?.trim() || null });
    if (error) throw error;
    return NextResponse.json({ success: true, updated: Number(data ?? 0) });
  } catch (error) { console.error('PATCH recruitment status:', error); return NextResponse.json({ error: '지원 상태 변경에 실패했습니다.' }, { status: 500 }); }
}
