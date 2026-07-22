import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApiAccess(); if (auth.response) return auth.response;
  const { id } = await params; const supabase = getSupabase();
  try {
    const [{ data: campaign, error: campaignError }, { data: questions, error: questionError }, { data: interviews, error: interviewError }, { data: evaluators, error: evaluatorError }] = await Promise.all([
      supabase.from('recruitment_campaign').select('id,title,cohort,status,application_open_at,application_close_at,recruitment_track(id,code,label,sort_order)').eq('id', id).single(),
      supabase.from('application_question').select('id,question_type,prompt,description,is_required,sort_order,max_score,scoring_mode,min_length,max_length,application_question_option(id,label,value,auto_score,sort_order)').eq('campaign_id', id).order('sort_order'),
      supabase.from('interview_question').select('id,prompt,evaluation_guide,max_score,sort_order,is_active').eq('campaign_id', id).order('sort_order'),
      supabase.from('recruitment_evaluator').select('member_id').eq('campaign_id', id),
    ]);
    if (campaignError) throw campaignError; if (questionError) throw questionError; if (interviewError) throw interviewError; if (evaluatorError) throw evaluatorError;
    return NextResponse.json({ campaign, questions, interviews, evaluatorIds: (evaluators ?? []).map((row) => row.member_id) });
  } catch (error) { console.error(error); return NextResponse.json({ error: '모집 설정을 불러오지 못했습니다.' }, { status: 500 }); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApiAccess(); if (auth.response) return auth.response;
  const { id } = await params; const supabase = getSupabase();
  try {
    const body = await request.json() as any;
    const { data: campaign, error: campaignError } = await supabase.from('recruitment_campaign').select('status').eq('id', id).single();
    if (campaignError) throw campaignError; if (campaign.status !== 'draft') return NextResponse.json({ error: '초안 상태에서만 문항을 추가할 수 있습니다.' }, { status: 409 });
    if (body.kind === 'interview') {
      if (!body.prompt?.trim() || !Number.isFinite(body.maxScore) || body.maxScore < 0) return NextResponse.json({ error: '면접 문항과 배점을 확인해 주세요.' }, { status: 400 });
      const { error } = await supabase.from('interview_question').insert({ campaign_id: id, prompt: body.prompt.trim(), evaluation_guide: body.guide?.trim() || null, max_score: body.maxScore, sort_order: body.sortOrder ?? 0 }); if (error) throw error;
    } else {
      const types = ['yes_no','single_choice','multiple_choice','long_text'];
      if (!body.prompt?.trim() || !types.includes(body.type) || !Number.isFinite(body.maxScore) || body.maxScore < 0) return NextResponse.json({ error: '지원서 문항과 배점을 확인해 주세요.' }, { status: 400 });
      const scoringMode = body.type === 'long_text' ? 'manual' : body.scoringMode;
      if (!['auto','manual'].includes(scoringMode)) return NextResponse.json({ error: '채점 방식을 확인해 주세요.' }, { status: 400 });
      const options = body.type === 'long_text' ? [] : (body.options ?? []).filter((option: any) => option.label?.trim());
      if (body.type !== 'long_text' && options.length < 2) return NextResponse.json({ error: '객관식 선택지를 두 개 이상 입력해 주세요.' }, { status: 400 });
      const { data: question, error } = await supabase.from('application_question').insert({ campaign_id: id, question_type: body.type, prompt: body.prompt.trim(), description: body.description?.trim() || null, is_required: body.required !== false, sort_order: body.sortOrder ?? 0, max_score: body.maxScore, scoring_mode: scoringMode, min_length: body.type === 'long_text' && body.minLength !== '' ? Number(body.minLength) : null, max_length: body.type === 'long_text' && body.maxLength !== '' ? Number(body.maxLength) : null }).select('id').single(); if (error) throw error;
      if (options.length) { const { error: optionError } = await supabase.from('application_question_option').insert(options.map((option: any, index: number) => ({ question_id: question.id, label: option.label.trim(), value: `option_${index + 1}`, auto_score: scoringMode === 'auto' ? Number(option.score ?? 0) : 0, sort_order: index }))); if (optionError) { await supabase.from('application_question').delete().eq('id', question.id); throw optionError; } }
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) { console.error(error); return NextResponse.json({ error: '문항 생성에 실패했습니다.' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApiAccess(); if (auth.response) return auth.response;
  await params;
  const kind = request.nextUrl.searchParams.get('kind'); const itemId = request.nextUrl.searchParams.get('itemId');
  if (!itemId || !['application','interview'].includes(kind ?? '')) return NextResponse.json({ error: '삭제할 문항을 확인해 주세요.' }, { status: 400 });
  const table = kind === 'application' ? 'application_question' : 'interview_question';
  const { error } = await getSupabase().from(table).delete().eq('id', itemId); if (error) return NextResponse.json({ error: '초안 상태의 문항만 삭제할 수 있습니다.' }, { status: 409 });
  return NextResponse.json({ success: true });
}
