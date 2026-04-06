import { getSupabase } from '@/lib/supabase';

type SessionRow = {
  session_id: string;
  cohort: number;
  session_type: 'basic' | 'advanced' | 'misc' | 'external' | 'hackathon';
  title: string;
  content: string | null;
  check_in_code: string | null;
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
  attendance_id?: string;
  member_id: number;
  status: 'present' | 'late' | 'absent' | null;
  session_id: string;
  attended_at?: string | null;
};

export type AttendanceSessionSummary = {
  id: string;
  name: string;
  content: string | null;
  category: string;
  status: SessionRow['status'];
};

export type ActiveAttendanceEvent = {
  sessionId: string;
  name: string;
  activatedAt: string | null;
  checkInCode?: string | null;
};

export type AdminParticipantAttendanceStatus = 'present' | 'late' | 'absent' | 'nonParticipation';

export type AdminEventParticipant = {
  memberId: number;
  name: string;
  status: AdminParticipantAttendanceStatus;
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

function isMissingCheckInCodeColumnError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    (error.code === '42703' || error.code === 'PGRST204') &&
    typeof error.message === 'string' &&
    (error.message.includes('attendance_session.check_in_code') ||
      error.message.includes("'check_in_code' column of 'attendance_session'"))
  );
}

async function selectSessions(includeCheckInCode: boolean) {
  const supabase = getSupabase();
  const selectColumns = includeCheckInCode
    ? 'session_id, cohort, session_type, title, content, check_in_code, session_start_time, session_end_time, status, created_at, updated_at'
    : 'session_id, cohort, session_type, title, content, session_start_time, session_end_time, status, created_at, updated_at';

  const query = supabase.from('attendance_session').select(selectColumns);

  const { data, error } = await query
    .order('created_at', { ascending: true })
    .returns<Array<Omit<SessionRow, 'check_in_code'> & { check_in_code?: string | null }>>();

  if (error) throw error;

  return (data ?? []).map((session) => ({
    ...session,
    check_in_code: session.check_in_code ?? null,
  })) as SessionRow[];
}

async function selectSessionByEventName(eventName: string, includeCheckInCode: boolean) {
  const supabase = getSupabase();
  const selectColumns = includeCheckInCode
    ? 'session_id, cohort, session_type, title, content, check_in_code, session_start_time, session_end_time, status, created_at, updated_at'
    : 'session_id, cohort, session_type, title, content, session_start_time, session_end_time, status, created_at, updated_at';

  const { data, error } = await supabase
    .from('attendance_session')
    .select(selectColumns)
    .eq('title', eventName)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<Omit<SessionRow, 'check_in_code'> & { check_in_code?: string | null }>();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    check_in_code: data.check_in_code ?? null,
  } as SessionRow;
}

async function updateSessionWithOptionalCheckInCode(sessionId: string, payload: Partial<SessionRow>) {
  const supabase = getSupabase();
  const { error } = await supabase.from('attendance_session').update(payload).eq('session_id', sessionId);

  if (!error) return;
  if (!isMissingCheckInCodeColumnError(error)) throw error;

  const { check_in_code: _ignored, ...fallbackPayload } = payload;
  const { error: fallbackError } = await supabase.from('attendance_session').update(fallbackPayload).eq('session_id', sessionId);
  if (fallbackError) throw fallbackError;
}

async function bulkUpdateSessionsWithOptionalCheckInCode(matchStatus: SessionRow['status'], excludeSessionId: string, payload: Partial<SessionRow>) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('attendance_session')
    .update(payload)
    .eq('status', matchStatus)
    .neq('session_id', excludeSessionId);

  if (!error) return;
  if (!isMissingCheckInCodeColumnError(error)) throw error;

  const { check_in_code: _ignored, ...fallbackPayload } = payload;
  const { error: fallbackError } = await supabase
    .from('attendance_session')
    .update(fallbackPayload)
    .eq('status', matchStatus)
    .neq('session_id', excludeSessionId);

  if (fallbackError) throw fallbackError;
}

function requireTitle(session: Pick<SessionRow, 'title' | 'session_id'>): string {
  if (!session.title || session.title.trim() === '') {
    throw new Error(`Session ${session.session_id} is missing title.`);
  }
  return session.title;
}

async function getSessionByEventName(eventName: string) {
  try {
    return await selectSessionByEventName(eventName, true);
  } catch (error) {
    if (!isMissingCheckInCodeColumnError(error)) throw error;
    return selectSessionByEventName(eventName, false);
  }
}

async function getSessions() {
  try {
    return await selectSessions(true);
  } catch (error) {
    if (!isMissingCheckInCodeColumnError(error)) throw error;
    return selectSessions(false);
  }
}

function calculateAttendanceStatus(sessionStartTime: string, attendedAt: Date) {
  const lateBoundary = new Date(new Date(sessionStartTime).getTime() + 10 * 60 * 1000);
  return attendedAt <= lateBoundary ? 'present' : 'late';
}

function generateCheckInCode(length = 6) {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
}

export async function getActiveEvent() {
  const activeEvents = await getActiveEvents();
  return activeEvents[0] ?? null;
}

export async function getActiveEvents(): Promise<ActiveAttendanceEvent[]> {
  try {
    const supabase = getSupabase();
    let data:
      | Array<{ session_id: string; title: string; updated_at: string | null; check_in_code: string | null }>
      | Array<{ session_id: string; title: string; updated_at: string | null; check_in_code?: string | null }>;

    try {
      const result = await supabase
        .from('attendance_session')
        .select('session_id, title, updated_at, check_in_code')
        .eq('status', 'in_progress')
        .order('updated_at', { ascending: false })
        .returns<Array<{ session_id: string; title: string; updated_at: string | null; check_in_code: string | null }>>();

      if (result.error) throw result.error;
      data = result.data ?? [];
    } catch (error) {
      if (!isMissingCheckInCodeColumnError(error)) throw error;

      const fallbackResult = await supabase
        .from('attendance_session')
        .select('session_id, title, updated_at')
        .eq('status', 'in_progress')
        .order('updated_at', { ascending: false })
        .returns<Array<{ session_id: string; title: string; updated_at: string | null }>>();

      if (fallbackResult.error) throw fallbackResult.error;
      data = (fallbackResult.data ?? []).map((session) => ({ ...session, check_in_code: null }));
    }

    return (data ?? [])
      .filter((session) => Boolean(session.title?.trim()))
      .map((session) => ({
        sessionId: session.session_id,
        name: session.title.trim(),
        activatedAt: session.updated_at,
        checkInCode: session.check_in_code ?? null,
      }));
  } catch (error) {
    console.error('getActiveEvents error:', error);
    return [];
  }
}

export async function setActiveEvent(eventName: string) {
  const session = await getSessionByEventName(eventName);
  if (!session) {
    throw new Error(`Event not found: ${eventName}`);
  }

  const now = new Date().toISOString();
  const checkInCode = generateCheckInCode();

  await updateSessionWithOptionalCheckInCode(session.session_id, {
    status: 'in_progress',
    session_start_time: now,
    updated_at: now,
    check_in_code: checkInCode,
  });

  return checkInCode;
}

export async function deactivateActiveEvent() {
  await deactivateEvent();
}

export async function deactivateEvent(eventName?: string) {
  const supabase = getSupabase();
  let activeSessions: Array<{ session_id: string; cohort: number; title: string }> = [];

  if (eventName) {
    const session = await getSessionByEventName(eventName);
    if (!session || session.status !== 'in_progress') {
      return;
    }

    activeSessions = [{ session_id: session.session_id, cohort: session.cohort, title: session.title }];
  } else {
    const { data, error } = await supabase
      .from('attendance_session')
      .select('session_id, cohort, title')
      .eq('status', 'in_progress')
      .returns<Array<{ session_id: string; cohort: number; title: string }>>();

    if (error) throw error;
    activeSessions = data ?? [];
  }

  const now = new Date().toISOString();

  for (const activeSession of activeSessions) {
    await updateSessionWithOptionalCheckInCode(activeSession.session_id, {
      status: 'completed',
      session_end_time: now,
      updated_at: now,
      check_in_code: null,
    });

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
}

export async function getActiveEventByName(eventName: string): Promise<ActiveAttendanceEvent | null> {
  const session = await getSessionByEventName(eventName);
  if (!session || session.status !== 'in_progress' || !session.title?.trim()) {
    return null;
  }

  return {
    sessionId: session.session_id,
    name: session.title.trim(),
    activatedAt: session.updated_at ?? null,
    checkInCode: session.check_in_code ?? null,
  };
}

export async function updateEventStatus(eventName: string, nextStatus: SessionRow['status']) {
  if (nextStatus === 'in_progress') {
    await setActiveEvent(eventName);
    return;
  }

  const supabase = getSupabase();
  const session = await getSessionByEventName(eventName);
  if (!session) {
    throw new Error(`Event not found: ${eventName}`);
  }

  const now = new Date().toISOString();
  const updatePayload: Partial<SessionRow> = {
    status: nextStatus,
    updated_at: now,
    check_in_code: null,
  };

  if (nextStatus === 'completed') {
    updatePayload.session_end_time = now;
  }

  if (nextStatus === 'scheduled') {
    updatePayload.session_end_time = null;
  }

  await updateSessionWithOptionalCheckInCode(session.session_id, updatePayload);

  if (session.status === 'in_progress' && nextStatus === 'completed') {
    const { data: members, error: membersError } = await supabase
      .from('member')
      .select('id, name')
      .eq('cohort', session.cohort)
      .eq('is_active', true)
      .returns<MemberRow[]>();

    if (membersError) throw membersError;

    const { data: existingAttendance, error: existingAttendanceError } = await supabase
      .from('attendance_record')
      .select('member_id')
      .eq('session_id', session.session_id)
      .returns<Array<{ member_id: number }>>();

    if (existingAttendanceError) throw existingAttendanceError;

    const existingMemberIds = new Set((existingAttendance ?? []).map((entry) => entry.member_id));
    const absentRows = (members ?? [])
      .filter((member) => !existingMemberIds.has(member.id))
      .map((member) => ({
        session_id: session.session_id,
        member_id: member.id,
        attended_at: null,
        status: 'absent',
      }));

    if (absentRows.length > 0) {
      const { error: insertError } = await supabase.from('attendance_record').insert(absentRows);
      if (insertError) throw insertError;
    }
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

export async function getAttendanceSessions() {
  try {
    const sessions = await getSessions();
    return sessions
      .filter((session): session is SessionRow & { title: string } => Boolean(session.title?.trim()))
      .map<AttendanceSessionSummary>((session) => ({
        id: session.session_id,
        name: session.title.trim(),
        content: session.content,
        category: sessionTypeToCategory(session.session_type),
        status: session.status,
      }));
  } catch (error) {
    console.error('getAttendanceSessions error:', error);
    return [];
  }
}

export async function getEventContents() {
  try {
    const sessions = await getSessions();
    return sessions.reduce<Record<string, string | null>>((acc, session) => {
      if (session.title) {
        acc[session.title] = session.content;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error('getEventContents error:', error);
    return {};
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

export async function getEventStatuses() {
  try {
    const sessions = await getSessions();
    return sessions.reduce<Record<string, SessionRow['status']>>((acc, session) => {
      if (session.title) {
        acc[session.title] = session.status;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error('getEventStatuses error:', error);
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
    if (session.status !== 'in_progress') {
      return { success: false, reason: 'inactive' as const };
    }

    const { data: members, error: memberError } = await supabase
      .from('member')
      .select('id, name')
      .eq('name', name)
      .eq('is_active', true)
      .returns<MemberRow[]>();

    if (memberError) throw memberError;
    if (!members || members.length === 0) {
      return { success: false, reason: 'member_not_found' as const };
    }
    if (members.length > 1) {
      throw new Error(`Multiple active members found with name: ${name}`);
    }

    const member = members[0];
    return checkInByMemberId(member.id, event, member.name);
  } catch (error: any) {
    console.error('checkIn error:', error.message);
    throw error;
  }
}

export async function checkInByMemberId(memberId: number, event: string, memberName?: string) {
  try {
    const supabase = getSupabase();
    const session = await getSessionByEventName(event);
    if (!session) {
      throw new Error(`Invalid event: ${event}`);
    }
    if (session.status !== 'in_progress') {
      return { success: false, reason: 'inactive' as const };
    }

    const { data: member, error: memberError } = await supabase
      .from('member')
      .select('id, name, is_active')
      .eq('id', memberId)
      .maybeSingle<{ id: number; name: string; is_active: boolean }>();

    if (memberError) throw memberError;
    if (!member || !member.is_active) {
      return { success: false, reason: 'member_not_found' as const };
    }

    const { data: existingAttendance, error: attendanceLookupError } = await supabase
      .from('attendance_record')
      .select('attendance_id, status')
      .eq('session_id', session.session_id)
      .eq('member_id', member.id)
      .maybeSingle<{ attendance_id: string; status: 'present' | 'late' | 'absent' | null }>();

    if (attendanceLookupError) throw attendanceLookupError;
    if (existingAttendance) {
      return {
        success: true,
        alreadyCheckedIn: true,
        memberName: memberName ?? member.name,
        status: existingAttendance.status ?? undefined,
      };
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
    return { success: true, alreadyCheckedIn: false, memberName: memberName ?? member.name, status };
  } catch (error: any) {
    console.error('checkInByMemberId error:', error.message);
    throw error;
  }
}

export async function verifyActiveEventCode(eventName: string, code: string) {
  const session = await getSessionByEventName(eventName);
  if (!session) {
    return { valid: false, reason: 'event_not_found' as const };
  }

  if (session.status !== 'in_progress') {
    return { valid: false, reason: 'inactive' as const };
  }

  if (!session.check_in_code || session.check_in_code !== code.trim().toUpperCase()) {
    return { valid: false, reason: 'code_mismatch' as const };
  }

  return { valid: true };
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

export async function getEventParticipants(eventName: string) {
  const supabase = getSupabase();
  const session = await getSessionByEventName(eventName);

  if (!session) {
    throw new Error(`Event not found: ${eventName}`);
  }

  const { data: members, error: membersError } = await supabase
    .from('member')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .returns<Array<{ id: number; name: string }>>();

  if (membersError) throw membersError;

  const { data: attendanceRows, error: attendanceError } = await supabase
    .from('attendance_record')
    .select('member_id, status')
    .eq('session_id', session.session_id)
    .returns<Array<{ member_id: number; status: 'present' | 'late' | 'absent' | null }>>();

  if (attendanceError) throw attendanceError;

  const statusByMemberId = new Map((attendanceRows ?? []).map((row) => [row.member_id, row.status]));

  return (members ?? []).map<AdminEventParticipant>((member) => ({
    memberId: member.id,
    name: member.name,
    status: (statusByMemberId.get(member.id) ?? 'nonParticipation') as AdminParticipantAttendanceStatus,
  }));
}

export async function updateParticipantAttendanceStatus(params: {
  eventName: string;
  memberId: number;
  status: AdminParticipantAttendanceStatus;
}) {
  const supabase = getSupabase();
  const session = await getSessionByEventName(params.eventName);

  if (!session) {
    throw new Error(`Event not found: ${params.eventName}`);
  }

  const { data: member, error: memberError } = await supabase
    .from('member')
    .select('id')
    .eq('id', params.memberId)
    .eq('is_active', true)
    .maybeSingle<{ id: number }>();

  if (memberError) throw memberError;
  if (!member) {
    throw new Error(`Member not found for event: ${params.memberId}`);
  }

  if (params.status === 'nonParticipation') {
    const { error } = await supabase
      .from('attendance_record')
      .delete()
      .eq('session_id', session.session_id)
      .eq('member_id', params.memberId);

    if (error) throw error;
    return;
  }

  const { data: existingAttendance, error: existingAttendanceError } = await supabase
    .from('attendance_record')
    .select('attendance_id, attended_at')
    .eq('session_id', session.session_id)
    .eq('member_id', params.memberId)
    .maybeSingle<{ attendance_id: string; attended_at: string | null }>();

  if (existingAttendanceError) throw existingAttendanceError;

  const attendedAt =
    params.status === 'absent'
      ? null
      : existingAttendance?.attended_at ?? new Date().toISOString();

  const payload = {
    session_id: session.session_id,
    member_id: params.memberId,
    attended_at: attendedAt,
    status: params.status,
  };

  const { error } = await supabase.from('attendance_record').upsert(payload, {
    onConflict: 'session_id,member_id',
  });

  if (error) throw error;
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
