import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const auth = await requireAdminApiAccess(); if (auth.response) return auth.response;
  try {
    const body = await request.json() as { applicationId?: string; kind?: string; items?: Array<{ itemId: string; score: number; comment?: string }>; finalize?: boolean };
    if (!body.applicationId || !['document','interview'].includes(body.kind ?? '') || !Array.isArray(body.items) || body.items.some((item) => !item.itemId || !Number.isFinite(item.score) || item.score < 0 || (item.comment?.length ?? 0) > 4000)) return NextResponse.json({ error: '평가 입력값을 확인해 주세요.' }, { status: 400 });
    const { error } = await getSupabase().rpc('save_recruitment_evaluation', { p_application_id: body.applicationId, p_evaluator_member_id: auth.member!.id, p_kind: body.kind, p_items: body.items, p_finalize: Boolean(body.finalize) });
    if (error) throw error;
    return NextResponse.json({ success: true, finalized: Boolean(body.finalize) });
  } catch (error: any) { console.error(error); const message = String(error?.message ?? ''); return NextResponse.json({ error: message.includes('not an evaluator') ? '이 모집의 평가 관리자로 지정되지 않았습니다.' : message.includes('cannot be changed') ? '이미 확정된 평가는 수정할 수 없습니다.' : message.includes('must be scored') ? '모든 문항의 점수를 입력해야 확정할 수 있습니다.' : '평가 저장에 실패했습니다.' }, { status: 400 }); }
}
