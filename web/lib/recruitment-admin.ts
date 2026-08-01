import { getSupabase } from '@/lib/supabase';

export type ApplicantListItem = {
  id: string; name: string; birthYear: number; university: string; major: string;
  email: string; phone: string; track: string; trackCode: string; status: string;
  submittedAt: string; documentScore: number | null; interviewScore: number | null;
  pendingDocumentEvaluators: string[]; pendingInterviewEvaluators: string[];
};

export async function getCampaigns() {
  const { data, error } = await getSupabase().from('recruitment_campaign').select('id,title,cohort,status,application_open_at,application_close_at').order('cohort', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getActiveAdminMembers() {
  const { data, error } = await getSupabase().from('member').select('id,name,cohort,affiliation').eq('is_admin', true).eq('is_active', true).order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getApplicants(campaignId: string): Promise<ApplicantListItem[]> {
  const [{ data, error }, { data: evaluators, error: evaluatorError }] = await Promise.all([
    getSupabase().from('application').select(`
      id,name,birth_year,university,major,email,phone,status,submitted_at,
      recruitment_track(label,code),
      application_answer(auto_score),
      application_question_evaluation(score),
      application_interview_evaluation(score),
      application_evaluation_completion(evaluator_member_id,document_completed_at,interview_completed_at)
    `).eq('campaign_id', campaignId),
    getSupabase().from('recruitment_evaluator').select('member_id,member(name)').eq('campaign_id', campaignId),
  ]);
  if (error) throw error;
  if (evaluatorError) throw evaluatorError;
  const evaluatorList = (evaluators ?? []).map((evaluator: any) => ({ id: evaluator.member_id, name: evaluator.member?.name ?? '관리자' }));
  return (data ?? []).map((row: any) => {
    const auto = row.application_answer.reduce((sum: number, item: any) => sum + (item.auto_score == null ? 0 : Number(item.auto_score)), 0);
    const manual = row.application_question_evaluation.reduce((sum: number, item: any) => sum + Number(item.score), 0);
    const interview = row.application_interview_evaluation.reduce((sum: number, item: any) => sum + Number(item.score), 0);
    const completionByEvaluator = new Map(row.application_evaluation_completion.map((item: any) => [item.evaluator_member_id, item]));
    return {
      id: row.id, name: row.name, birthYear: row.birth_year, university: row.university,
      major: row.major, email: row.email, phone: row.phone, status: row.status,
      submittedAt: row.submitted_at, track: row.recruitment_track?.label ?? '-',
      trackCode: row.recruitment_track?.code ?? '',
      documentScore: row.application_answer.length || row.application_question_evaluation.length ? auto + manual : null,
      interviewScore: row.application_interview_evaluation.length ? interview : null,
      pendingDocumentEvaluators: evaluatorList.filter((evaluator) => !(completionByEvaluator.get(evaluator.id) as any)?.document_completed_at).map((evaluator) => evaluator.name),
      pendingInterviewEvaluators: evaluatorList.filter((evaluator) => !(completionByEvaluator.get(evaluator.id) as any)?.interview_completed_at).map((evaluator) => evaluator.name),
    };
  });
}

export const applicationStatusLabels: Record<string, string> = {
  submitted: '접수', document_review: '서류 평가 중', document_passed: '서류 합격',
  document_rejected: '서류 불합격', interview: '면접', final_passed: '최종 합격', final_rejected: '최종 불합격',
};

export async function getApplicantDetail(applicationId: string) {
  const { data, error } = await getSupabase().from('application').select(`
    id,campaign_id,name,birth_year,university,major,email,phone,status,submitted_at,document_score_finalized_at,interview_score_finalized_at,
    recruitment_track(label,code),
    application_answer(id,answer_text,auto_score,question_snapshot,
      application_question(id,prompt,question_type,max_score,scoring_mode,sort_order),
      application_answer_option(application_question_option(label))),
    application_question_evaluation(id,question_id,evaluator_member_id,score,comment,member(name)),
    application_interview_evaluation(id,interview_question_id,evaluator_member_id,score,comment,member(name)),
    application_evaluation_completion(evaluator_member_id,document_completed_at,interview_completed_at)
  `).eq('id', applicationId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: interviewQuestions, error: interviewError } = await getSupabase().from('interview_question').select('id,prompt,evaluation_guide,max_score,sort_order').eq('campaign_id', data.campaign_id).eq('is_active', true).order('sort_order');
  if (interviewError) throw interviewError;
  const { data: evaluators, error: evaluatorError } = await getSupabase().from('recruitment_evaluator').select('member_id,member(name)').eq('campaign_id', data.campaign_id);
  if (evaluatorError) throw evaluatorError;
  return { ...data, interviewQuestions: interviewQuestions ?? [], evaluators: evaluators ?? [] } as any;
}
