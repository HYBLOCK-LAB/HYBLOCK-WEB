import { getSupabase } from '@/lib/supabase';

export const PRIVACY_CONSENT_VERSION = '2026-07-22';
export const PRIVACY_CONSENT_TEXT =
  'HYBLOCK 지원 접수와 선발을 위해 이름, 출생연도, 소속 대학, 전공, 이메일, 전화번호 및 지원서 응답을 수집·이용하는 것에 동의합니다.';

export type RecruitmentOption = {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
};

export type RecruitmentQuestion = {
  id: string;
  type: 'yes_no' | 'single_choice' | 'multiple_choice' | 'long_text';
  prompt: string;
  description: string | null;
  required: boolean;
  minLength: number | null;
  maxLength: number | null;
  options: RecruitmentOption[];
};

export type OpenRecruitment = {
  id: string;
  title: string;
  cohort: number;
  closesAt: string;
  tracks: Array<{ id: string; code: 'development' | 'business'; label: string }>;
  questions: RecruitmentQuestion[];
  privacyConsent: { version: string; text: string };
};

type AnswerInput = { questionId: string; text?: string; optionIds?: string[] };
export type ApplicationInput = {
  campaignId: string;
  name: string;
  birthYear: number;
  university: string;
  major: string;
  email: string;
  phone: string;
  trackId: string;
  idempotencyKey: string;
  privacyConsent: boolean;
  website?: string;
  answers: AnswerInput[];
};

function assertText(value: unknown, label: string, max: number) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new Error(`${label} 입력값을 확인해 주세요.`);
  }
  return value.trim();
}

export async function getOpenRecruitment(): Promise<OpenRecruitment | null> {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const { data: campaign, error } = await supabase
    .from('recruitment_campaign')
    .select('id,title,cohort,application_close_at')
    .eq('status', 'open')
    .lte('application_open_at', now)
    .gte('application_close_at', now)
    .maybeSingle();
  if (error) throw error;
  if (!campaign) return null;

  const [{ data: tracks, error: trackError }, { data: questions, error: questionError }] = await Promise.all([
    supabase.from('recruitment_track').select('id,code,label').eq('campaign_id', campaign.id).eq('is_active', true).order('sort_order'),
    supabase
      .from('application_question')
      .select('id,question_type,prompt,description,is_required,min_length,max_length,sort_order,application_question_option(id,label,value,sort_order)')
      .eq('campaign_id', campaign.id)
      .order('sort_order'),
  ]);
  if (trackError) throw trackError;
  if (questionError) throw questionError;

  return {
    id: campaign.id,
    title: campaign.title,
    cohort: campaign.cohort,
    closesAt: campaign.application_close_at,
    tracks: (tracks ?? []).map((track) => ({ id: track.id, code: track.code, label: track.label })),
    questions: (questions ?? []).map((question) => ({
      id: question.id,
      type: question.question_type,
      prompt: question.prompt,
      description: question.description,
      required: question.is_required,
      minLength: question.min_length,
      maxLength: question.max_length,
      options: [...(question.application_question_option ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((option) => ({ id: option.id, label: option.label, value: option.value, sortOrder: option.sort_order })),
    })),
    privacyConsent: { version: PRIVACY_CONSENT_VERSION, text: PRIVACY_CONSENT_TEXT },
  };
}

export async function submitApplication(input: ApplicationInput) {
  if (input.website) return { id: input.idempotencyKey };
  if (!input.privacyConsent) throw new Error('개인정보 수집·이용 동의가 필요합니다.');
  const recruitment = await getOpenRecruitment();
  if (!recruitment || recruitment.id !== input.campaignId) throw new Error('현재 지원서를 접수하고 있지 않습니다.');

  const name = assertText(input.name, '이름', 100);
  const university = assertText(input.university, '대학교', 160);
  const major = assertText(input.major, '전공', 160);
  const email = assertText(input.email, '이메일', 320).toLowerCase();
  const phone = assertText(input.phone, '전화번호', 40);
  const phoneNormalized = phone.replace(/\D/g, '');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('이메일 형식을 확인해 주세요.');
  if (phoneNormalized.length < 9 || phoneNormalized.length > 15) throw new Error('전화번호 형식을 확인해 주세요.');
  if (!Number.isInteger(input.birthYear) || input.birthYear < 1900 || input.birthYear > new Date().getFullYear()) throw new Error('출생연도를 확인해 주세요.');
  if (!recruitment.tracks.some((track) => track.id === input.trackId)) throw new Error('지원 분야를 확인해 주세요.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.idempotencyKey)) throw new Error('잘못된 제출 요청입니다.');

  const answers = Array.isArray(input.answers) ? input.answers : [];
  const { data, error } = await getSupabase().rpc('submit_recruitment_application', {
    p_campaign_id: input.campaignId,
    p_name: name,
    p_birth_year: input.birthYear,
    p_university: university,
    p_major: major,
    p_email: email,
    p_phone: phone,
    p_phone_normalized: phoneNormalized,
    p_track_id: input.trackId,
    p_idempotency_key: input.idempotencyKey,
    p_privacy_consent_version: PRIVACY_CONSENT_VERSION,
    p_privacy_consent_snapshot: PRIVACY_CONSENT_TEXT,
    p_answers: answers,
  });
  if (error) throw new Error(error.message);
  return { id: data as string };
}
