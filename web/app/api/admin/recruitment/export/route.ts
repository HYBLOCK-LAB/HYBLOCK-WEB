import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';
import { applicationStatusLabels } from '@/lib/recruitment-admin';

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value);
  const excelSafeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${excelSafeText.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminApiAccess(); if (auth.response) return auth.response;
  const campaignId = request.nextUrl.searchParams.get('campaign');
  if (!campaignId) return NextResponse.json({ error: '모집 기수를 선택해 주세요.' }, { status: 400 });
  try {
    const supabase = getSupabase();
    const [{ data: campaign, error: campaignError }, { data: questions, error: questionError }, { data: applications, error: applicationError }] = await Promise.all([
      supabase.from('recruitment_campaign').select('title,cohort').eq('id', campaignId).single(),
      supabase.from('application_question').select('id,prompt,sort_order').eq('campaign_id', campaignId).order('sort_order'),
      supabase.from('application').select(`id,name,birth_year,university,major,email,phone,status,submitted_at,recruitment_track(label),application_answer(question_id,answer_text,auto_score,application_answer_option(application_question_option(label))),application_question_evaluation(score),application_interview_evaluation(score)`).eq('campaign_id', campaignId).order('submitted_at'),
    ]);
    if (campaignError) throw campaignError; if (questionError) throw questionError; if (applicationError) throw applicationError;
    const fixedHeaders = ['이름','출생연도','대학교','전공','이메일','전화번호','지원 분야','지원 상태','제출 시각','지원서 점수','면접 점수'];
    const headers = [...fixedHeaders, ...(questions ?? []).map((question, index) => `Q${index + 1}. ${question.prompt}`)];
    const rows = (applications ?? []).map((application: any) => {
      const answerByQuestion = new Map(application.application_answer.map((answer: any) => [answer.question_id, answer]));
      const autoScore = application.application_answer.reduce((sum: number, answer: any) => sum + Number(answer.auto_score ?? 0), 0);
      const manualScore = application.application_question_evaluation.reduce((sum: number, evaluation: any) => sum + Number(evaluation.score), 0);
      const interviewScore = application.application_interview_evaluation.reduce((sum: number, evaluation: any) => sum + Number(evaluation.score), 0);
      const fixed = [application.name,application.birth_year,application.university,application.major,application.email,application.phone,application.recruitment_track?.label ?? '',applicationStatusLabels[application.status] ?? application.status,application.submitted_at,autoScore + manualScore,interviewScore];
      const answers = (questions ?? []).map((question) => { const answer: any = answerByQuestion.get(question.id); if (!answer) return ''; return answer.answer_text || answer.application_answer_option?.map((item: any) => item.application_question_option?.label).filter(Boolean).join(', ') || ''; });
      return [...fixed, ...answers];
    });
    const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const safeTitle = String(campaign.title).replace(/[^0-9A-Za-z가-힣_-]+/g, '_');
    return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`${campaign.cohort}기_${safeTitle}_지원자.csv`)}` } });
  } catch (error) {
    console.error('GET recruitment export:', error);
    return NextResponse.json({ error: '지원자 파일 생성에 실패했습니다.' }, { status: 500 });
  }
}
