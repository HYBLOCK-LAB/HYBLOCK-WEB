import { getSupabase } from '@/lib/supabase';

type SessionRow = {
  session_id: string;
  cohort: number;
  session_type: 'basic' | 'advanced' | 'misc' | 'external' | 'hackathon';
  title: string;
  content: string | null;
  session_start_time: string;
  session_end_time: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
};

type MemberRow = {
  id: number;
  name: string;
  cohort?: number;
  is_active?: boolean;
};

type AttendanceRow = {
  member_id: number;
  status: 'present' | 'late' | 'absent' | null;
  session_id: string;
};

const DEFAULT_COHORT = Number(process.env.DEFAULT_SESSION_COHORT ?? '1');

const categoryToSessionType = (category: string): SessionRow['session_type'] => {
  if (category === '심화 세션') return 'advanced';
  if (category === '기타 활동') return 'misc';
  if (category === '외부 활동') return 'external';
  if (category === '해커톤') return 'hackathon';
  return 'basic';
};

const sessionTypeToCategory = (sessionType: SessionRow['session_type']): string => {
  if (sessionType === 'advanced') return '심화 세션';
  if (sessionType === 'misc') return '기타 활동';
  if (sessionType === 'external') return '외부 활동';
  if (sessionType === 'hackathon') return '해커톤';
  return '기본 세션';
};

const attendanceLabelMap: Record<NonNullable<AttendanceRow['status']>, string> = {
  present: 'Attendence',
  late: 'Late',
  absent: 'Absence',
};

function requireTitle(session: Pick<SessionRow, 'title' | 'session_id'>): string {
  if (!session.title || session.title.trim() === '') {
    throw new Error(`Session ${session.session_id} is missing title.`);
  }
  return session.title;
}

async function getSessionByEventName(eventName: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('attendance_session')
    .select('session_id, cohort, session_type, title, content, session_start_time, session_end_time, status, created_at, updated_at')
    .eq('title', eventName)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<SessionRow>();

  if (error) throw error;
  return data;
}

async function getSessions() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('attendance_session')
    .select('session_id, cohort, session_type, title, content, session_start_time, session_end_time, status, created_at, updated_at')
    .order('created_at', { ascending: true })
    .returns<SessionRow[]>();

  if (error) throw error;
  return data ?? [];
}

function calculateAttendanceStatus(sessionStartTime: string, attendedAt: Date) {
  const lateBoundary = new Date(new Date(sessionStartTime).getTime() + 10 * 60 * 1000);
  return attendedAt <= lateBoundary ? 'present' : 'late';
}

export async function getActiveEvent() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('attendance_session')
      .select('session_id, title, updated_at')
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle<{ session_id: string; title: string; updated_at: string | null }>();

    if (error) throw error;
    if (!data?.title) return null;

    return {
      name: data.title,
      activatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('getActiveEvent error:', error);
    return null;
  }
}

export async function setActiveEvent(eventName: string) {
  const supabase = getSupabase();
  const session = await getSessionByEventName(eventName);
  if (!session) {
    throw new Error(`Event not found: ${eventName}`);
  }

  const now = new Date().toISOString();

  const { error: deactivateError } = await supabase
    .from('attendance_session')
    .update({ status: 'scheduled', updated_at: now })
    .eq('status', 'in_progress')
    .neq('session_id', session.session_id);

  if (deactivateError) throw deactivateError;

  const { error } = await supabase
    .from('attendance_session')
    .update({
      status: 'in_progress',
      session_start_time: now,
      updated_at: now,
    })
    .eq('session_id', session.session_id);

  if (error) throw error;
}

export async function deactivateActiveEvent() {
  const supabase = getSupabase();
  const { data: activeSession, error: activeSessionError } = await supabase
    .from('attendance_session')
    .select('session_id, cohort, title')
    .eq('status', 'in_progress')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ session_id: string; cohort: number; title: string }>();

  if (activeSessionError) throw activeSessionError;
  if (!activeSession) return;

  const now = new Date().toISOString();

  const { error: sessionUpdateError } = await supabase
    .from('attendance_session')
    .update({
      status: 'completed',
      session_end_time: now,
      updated_at: now,
    })
    .eq('session_id', activeSession.session_id);

  if (sessionUpdateError) throw sessionUpdateError;

  const { data: members, error: membersError } = await supabase
    .from('member')
    .select('id, name')
    .eq('cohort', activeSession.cohort)
    .eq('is_active', true)
    .returns<MemberRow[]>();

  if (membersError) throw membersError;

  const { data: existingAttendance, error: existingAttendanceError } = await supabase
    .from('attendance_record')
    .select('member_id')
    .eq('session_id', activeSession.session_id)
    .returns<Array<{ member_id: number }>>();

  if (existingAttendanceError) throw existingAttendanceError;

  const existingMemberIds = new Set((existingAttendance ?? []).map((entry) => entry.member_id));
  const absentRows = (members ?? [])
    .filter((member) => !existingMemberIds.has(member.id))
    .map((member) => ({
      session_id: activeSession.session_id,
      member_id: member.id,
      attended_at: null,
      status: 'absent',
    }));

  if (absentRows.length > 0) {
    const { error: insertError } = await supabase.from('attendance_record').insert(absentRows);
    if (insertError) throw insertError;
  }
}

export async function getEvents() {
  try {
    const sessions = await getSessions();
    return sessions
      .map((session) => session.title?.trim())
      .filter((title): title is string => Boolean(title));
  } catch (error: any) {
    console.error('getEvents error:', error.message);
    throw new Error(`Failed to fetch events: ${error.message}`);
  }
}

export async function getEventCategories() {
  try {
    const sessions = await getSessions();
    return sessions.reduce<Record<string, string>>((acc, session) => {
      if (session.title) {
        acc[session.title] = sessionTypeToCategory(session.session_type);
      }
      return acc;
    }, {});
  } catch (error) {
    console.error('getEventCategories error:', error);
    return {};
  }
}

export async function addEvent(eventName: string, category: string) {
  try {
    const supabase = getSupabase();
    const existing = await getSessionByEventName(eventName);
    if (existing) {
      throw new Error(`Event already exists: ${eventName}`);
    }

    const now = new Date().toISOString();
    const { error } = await supabase.from('attendance_session').insert({
      cohort: DEFAULT_COHORT,
      session_type: categoryToSessionType(category),
      title: eventName,
      content: null,
      session_start_time: now,
      status: 'scheduled',
      updated_at: now,
    });

    if (error) throw error;
  } catch (error: any) {
    console.error('addEvent error:', error.message);
    throw new Error(`Failed to add event: ${error.message}`);
  }
}

export async function checkIn(name: string, event: string) {
  try {
    const supabase = getSupabase();
    const session = await getSessionByEventName(event);
    if (!session) {
      throw new Error(`Invalid event: ${event}`);
    }

    const { data: members, error: memberError } = await supabase
      .from('member')
      .select('id, name')
      .eq('name', name)
      .eq('is_active', true)
      .returns<MemberRow[]>();

    if (memberError) throw memberError;
    if (!members || members.length === 0) {
      return { success: false };
    }
    if (members.length > 1) {
      throw new Error(`Multiple active members found with name: ${name}`);
    }

    const member = members[0];

    const { data: existingAttendance, error: attendanceLookupError } = await supabase
      .from('attendance_record')
      .select('attendance_id')
      .eq('session_id', session.session_id)
      .eq('member_id', member.id)
      .maybeSingle<{ attendance_id: string }>();

    if (attendanceLookupError) throw attendanceLookupError;
    if (existingAttendance) {
      return { success: true, alreadyCheckedIn: true };
    }

    const attendedAt = new Date();
    const status = calculateAttendanceStatus(session.session_start_time, attendedAt);

    const { error: insertError } = await supabase.from('attendance_record').insert({
      session_id: session.session_id,
      member_id: member.id,
      attended_at: attendedAt.toISOString(),
      status,
    });

    if (insertError) throw insertError;
    return { success: true, alreadyCheckedIn: false };
  } catch (error: any) {
    console.error('checkIn error:', error.message);
    throw error;
  }
}

export async function getAttendanceData() {
  try {
    const supabase = getSupabase();
    const sessions = await getSessions();
    const sessionNameById = new Map<string, string>();
    const orderedEventNames: string[] = [];

    for (const session of sessions) {
      const eventName = requireTitle(session);
      sessionNameById.set(session.session_id, eventName);
      orderedEventNames.push(eventName);
    }

    const { data: members, error: membersError } = await supabase
      .from('member')
      .select('id, name')
      .order('name', { ascending: true })
      .returns<MemberRow[]>();

    if (membersError) throw membersError;

    const { data: attendanceRows, error: attendanceError } = await supabase
      .from('attendance_record')
      .select('member_id, status, session_id')
      .returns<AttendanceRow[]>();

    if (attendanceError) throw attendanceError;

    const rowsByMemberId = new Map<number, Record<string, string>>();

    for (const member of members ?? []) {
      const row: Record<string, string> = { Name: member.name };
      for (const eventName of orderedEventNames) {
        row[eventName] = '';
      }
      rowsByMemberId.set(member.id, row);
    }

    for (const attendance of attendanceRows ?? []) {
      const eventName = sessionNameById.get(attendance.session_id);
      if (!eventName) continue;

      const row = rowsByMemberId.get(attendance.member_id);
      if (!row) continue;
      row[eventName] = attendance.status ? attendanceLabelMap[attendance.status] ?? '' : '';
    }

    return Array.from(rowsByMemberId.values());
  } catch (error) {
    console.error('getAttendanceData error:', error);
    return [];
  }
}

export async function getAdminMembers() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('member')
      .select('id, name, cohort, is_active')
      .order('cohort', { ascending: true })
      .order('name', { ascending: true })
      .returns<Array<{ id: number; name: string; cohort: number | null; is_active: boolean | null }>>();

    if (error) throw error;

    return (data ?? []).map((member) => ({
      id: member.id,
      name: member.name,
      cohort: member.cohort ?? DEFAULT_COHORT,
      isActive: Boolean(member.is_active),
    }));
  } catch (error) {
    console.error('getAdminMembers error:', error);
    return [];
  }
}

export async function getAdminExternalActivities() {
  try {
    const supabase = getSupabase();
    const sessions = await getSessions();
    const sessionNameById = new Map(sessions.map((session) => [session.session_id, session.title?.trim() ?? null]));

    const { data, error } = await supabase
      .from('external_activity')
      .select('activity_id, member_id, session_id, evidence_url, created_at')
      .order('created_at', { ascending: false })
      .returns<
        Array<{
          activity_id: string;
          member_id: number;
          session_id: string;
          evidence_url: string;
          created_at: string;
        }>
      >();

    if (error) throw error;

    const memberIds = Array.from(new Set((data ?? []).map((activity) => activity.member_id)));
    const { data: members, error: memberError } = await supabase
      .from('member')
      .select('id, wallet_address')
      .in('id', memberIds)
      .returns<Array<{ id: number; wallet_address: string | null }>>();

    if (memberError) throw memberError;

    const walletByMemberId = new Map((members ?? []).map((member) => [member.id, member.wallet_address]));

    return (data ?? []).map((activity) => ({
      activityId: activity.activity_id,
      walletAddress: walletByMemberId.get(activity.member_id) ?? null,
      sessionName: sessionNameById.get(activity.session_id) ?? null,
      evidenceUrl: activity.evidence_url,
      createdAt: activity.created_at,
    }));
  } catch (error) {
    console.error('getAdminExternalActivities error:', error);
    return [];
  }
}
