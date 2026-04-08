import { getSupabase } from '@/lib/supabase';

export type ActivitySessionType = 'basic' | 'advanced' | 'misc' | 'external' | 'hackathon';
export type ActivityTargetAffiliation = 'development' | 'business' | null;

export type ActivityItem = {
  id: string;
  name: string;
  description: string | null;
  sessionType: ActivitySessionType;
  targetAffiliation: ActivityTargetAffiliation;
  date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  cohort: number;
};

export const ACTIVITY_TYPE_OPTIONS: Array<{ value: ActivitySessionType; label: string }> = [
  { value: 'basic', label: '기본 세션' },
  { value: 'advanced', label: '심화 세션' },
  { value: 'misc', label: '기타 활동' },
  { value: 'external', label: '외부 활동' },
  { value: 'hackathon', label: '해커톤' },
];

export function getActivityTypeLabel(type: ActivitySessionType) {
  return ACTIVITY_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function getActivityTargetAffiliationLabel(targetAffiliation: ActivityTargetAffiliation) {
  if (targetAffiliation === 'development') return 'Development';
  if (targetAffiliation === 'business') return 'Business';
  return '전체';
}

export async function getActivities() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('attendance_session')
    .select('session_id, title, content, session_type, target_affiliation, session_start_time, status, cohort')
    .order('session_start_time', { ascending: false })
    .returns<
      Array<{
        session_id: string;
        title: string;
        content: string | null;
        session_type: ActivitySessionType;
        target_affiliation?: ActivityTargetAffiliation;
        session_start_time: string;
        status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
        cohort: number;
      }>
    >();

  if (error) throw error;

  return (data ?? []).map<ActivityItem>((item) => ({
    id: item.session_id,
    name: item.title,
    description: item.content,
    sessionType: item.session_type,
    targetAffiliation: item.target_affiliation ?? null,
    date: item.session_start_time,
    status: item.status,
    cohort: item.cohort,
  }));
}

export async function createActivity(params: {
  name: string;
  description?: string;
  sessionType: ActivitySessionType;
  targetAffiliation?: ActivityTargetAffiliation;
  date: string;
  cohort: number;
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('attendance_session')
    .insert({
      title: params.name,
      content: params.description?.trim() || null,
      session_type: params.sessionType,
      target_affiliation: params.sessionType === 'advanced' ? params.targetAffiliation ?? null : null,
      session_start_time: params.date,
      cohort: params.cohort,
      status: 'scheduled',
      updated_at: new Date().toISOString(),
    })
    .select('session_id, title, content, session_type, target_affiliation, session_start_time, status, cohort')
    .single<{
      session_id: string;
      title: string;
      content: string | null;
      session_type: ActivitySessionType;
      target_affiliation?: ActivityTargetAffiliation;
      session_start_time: string;
      status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
      cohort: number;
    }>();

  if (error) throw error;

  return {
    id: data.session_id,
    name: data.title,
    description: data.content,
    sessionType: data.session_type,
    targetAffiliation: data.target_affiliation ?? null,
    date: data.session_start_time,
    status: data.status,
    cohort: data.cohort,
  } satisfies ActivityItem;
}

export async function updateActivity(params: {
  id: string;
  name: string;
  description?: string;
  sessionType: ActivitySessionType;
  targetAffiliation?: ActivityTargetAffiliation;
  date: string;
  cohort?: number;
}) {
  const supabase = getSupabase();
  const updatePayload: {
    title: string;
    content: string | null;
    session_type: ActivitySessionType;
    target_affiliation: ActivityTargetAffiliation;
    session_start_time: string;
    updated_at: string;
    cohort?: number;
  } = {
    title: params.name,
    content: params.description?.trim() || null,
    session_type: params.sessionType,
    target_affiliation: params.sessionType === 'advanced' ? params.targetAffiliation ?? null : null,
    session_start_time: params.date,
    updated_at: new Date().toISOString(),
  };

  if (typeof params.cohort === 'number') {
    updatePayload.cohort = params.cohort;
  }

  const { data, error } = await supabase
    .from('attendance_session')
    .update(updatePayload)
    .eq('session_id', params.id)
    .select('session_id, title, content, session_type, target_affiliation, session_start_time, status, cohort')
    .single<{
      session_id: string;
      title: string;
      content: string | null;
      session_type: ActivitySessionType;
      target_affiliation?: ActivityTargetAffiliation;
      session_start_time: string;
      status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
      cohort: number;
    }>();

  if (error) throw error;

  return {
    id: data.session_id,
    name: data.title,
    description: data.content,
    sessionType: data.session_type,
    targetAffiliation: data.target_affiliation ?? null,
    date: data.session_start_time,
    status: data.status,
    cohort: data.cohort,
  } satisfies ActivityItem;
}

export async function deleteActivity(activityId: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from('attendance_session').delete().eq('session_id', activityId);

  if (error) throw error;
}
