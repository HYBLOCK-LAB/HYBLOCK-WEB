import { getSupabase } from '@/lib/supabase';
import type { CertificateType } from '@/lib/eas';

export type CertificateCandidate = {
  wallet_address: string;
  name: string;
  major: string;
  affiliation: string;
  cohort: number;
  criteria_details: Record<string, unknown> | null;
};

export type IssuedAttestationSummary = {
  wallet_address: string;
  name: string;
  major: string;
  affiliation: string;
  cohort: number;
  eas_uid: string;
  created_at: string | null;
  attestation_type: CertificateType;
  criteria_details: Record<string, unknown> | null;
};

export type AttendanceRecord = {
  attendance_id: string;
  session_id: string;
  session_name: string | null;
  status: 'present' | 'late';
  attended_at: string | null;
};

export type ExternalActivityRecord = {
  activity_id: string;
  session_id: string;
  session_name: string | null;
  evidence_url: string;
};

export type AssignmentRecord = {
  assignment_id: string;
  assignment_title: string;
  affiliation: string;
  evidence_url: string | null;
};

export type MemberCertificateDetail = {
  attendance: AttendanceRecord[];
  external_activity: ExternalActivityRecord[];
  assignment: AssignmentRecord[];
};

// Map CertificateType to semester_criteria_tracking.criteria_type values
const CRITERIA_TYPE_MAP: Record<CertificateType, string> = {
  attendance: 'attendance',
  external_activity: 'external_activity',
  assignment: 'assignment',
  participation_period: 'participation_period',
};

type MemberRow = {
  id: number;
  wallet_address: string | null;
  name: string;
  major: string;
  affiliation: string;
  cohort: number;
  has_assignment?: boolean | null;
  is_active?: boolean | null;
};

async function getMembersByIds(memberIds: number[]) {
  if (memberIds.length === 0) return [];

  const supabase = getSupabase();
  const { data: members, error } = await supabase
    .from('member')
    .select('id, wallet_address, name, major, affiliation, cohort, has_assignment, is_active')
    .in('id', memberIds)
    .not('wallet_address', 'is', null)
    .order('cohort', { ascending: true })
    .order('name', { ascending: true })
    .returns<MemberRow[]>();

  if (error) throw error;
  return members ?? [];
}

async function getFallbackCandidates(type: CertificateType, attestedSet: Set<number>): Promise<CertificateCandidate[]> {
  const supabase = getSupabase();

  if (type === 'attendance') {
    const { data, error } = await supabase
      .from('attendance_record')
      .select('member_id, status')
      .in('status', ['present', 'late'])
      .returns<Array<{ member_id: number; status: 'present' | 'late' }>>();

    if (error) throw error;

    const stats = new Map<number, { present_count: number; late_count: number; total_records: number }>();
    for (const row of data ?? []) {
      if (attestedSet.has(row.member_id)) continue;
      const current = stats.get(row.member_id) ?? { present_count: 0, late_count: 0, total_records: 0 };
      if (row.status === 'present') current.present_count += 1;
      if (row.status === 'late') current.late_count += 1;
      current.total_records += 1;
      stats.set(row.member_id, current);
    }

    const members = await getMembersByIds([...stats.keys()]);
    return members
      .filter((member): member is MemberRow & { wallet_address: string } => Boolean(member.wallet_address))
      .map((member) => ({
        wallet_address: member.wallet_address,
        name: member.name,
        major: member.major,
        affiliation: member.affiliation,
        cohort: member.cohort,
        criteria_details: stats.get(member.id) ?? null,
      }));
  }

  if (type === 'external_activity') {
    const { data, error } = await supabase
      .from('external_activity')
      .select('member_id')
      .returns<Array<{ member_id: number }>>();

    if (error) throw error;

    const counts = new Map<number, number>();
    for (const row of data ?? []) {
      if (attestedSet.has(row.member_id)) continue;
      counts.set(row.member_id, (counts.get(row.member_id) ?? 0) + 1);
    }

    const members = await getMembersByIds([...counts.keys()]);
    return members
      .filter((member): member is MemberRow & { wallet_address: string } => Boolean(member.wallet_address))
      .map((member) => ({
        wallet_address: member.wallet_address,
        name: member.name,
        major: member.major,
        affiliation: member.affiliation,
        cohort: member.cohort,
        criteria_details: { activity_count: counts.get(member.id) ?? 0, source: 'raw_external_activity' },
      }));
  }

  if (type === 'assignment') {
    const { data, error } = await supabase
      .from('member')
      .select('id, wallet_address, name, major, affiliation, cohort, has_assignment, is_active')
      .eq('has_assignment', true)
      .not('wallet_address', 'is', null)
      .order('cohort', { ascending: true })
      .order('name', { ascending: true })
      .returns<MemberRow[]>();

    if (error) throw error;

    return (data ?? [])
      .filter((member) => !attestedSet.has(member.id))
      .filter((member): member is MemberRow & { wallet_address: string } => Boolean(member.wallet_address))
      .map((member) => ({
        wallet_address: member.wallet_address,
        name: member.name,
        major: member.major,
        affiliation: member.affiliation,
        cohort: member.cohort,
        criteria_details: {
          submission_count: 1,
          source: 'member_has_assignment',
        },
      }));
  }

  const { data: members, error } = await supabase
    .from('member')
    .select('id, wallet_address, name, major, affiliation, cohort, has_assignment, is_active')
    .eq('is_active', true)
    .not('wallet_address', 'is', null)
    .order('cohort', { ascending: true })
    .order('name', { ascending: true })
    .returns<MemberRow[]>();

  if (error) throw error;

  return (members ?? [])
    .filter((member): member is MemberRow & { wallet_address: string } => Boolean(member.wallet_address) && !attestedSet.has(member.id))
    .map((member) => ({
      wallet_address: member.wallet_address,
      name: member.name,
      major: member.major,
      affiliation: member.affiliation,
      cohort: member.cohort,
      criteria_details: {
        current_status: 'manual_review_required',
        source: 'active_member_fallback',
      },
    }));
}

export async function getCertificateCandidates(type: CertificateType): Promise<CertificateCandidate[]> {
  const supabase = getSupabase();
  const criteriaType = CRITERIA_TYPE_MAP[type];

  const [{ data: tracking, error: trackingError }, { data: attested, error: attestedError }] = await Promise.all([
    supabase
      .from('semester_criteria_tracking')
      .select('member_id, cohort, details')
      .eq('criteria_type', criteriaType)
      .eq('is_met', true)
      .returns<Array<{ member_id: number; cohort: number; details: Record<string, unknown> | null }>>(),
    supabase
      .from('attestation')
      .select('member_id')
      .eq('attestation_type', criteriaType)
      .returns<Array<{ member_id: number }>>(),
  ]);

  if (trackingError) throw trackingError;
  if (attestedError) throw attestedError;

  const attestedSet = new Set((attested ?? []).map((r) => r.member_id));
  const pendingMembers = (tracking ?? []).filter((r) => !attestedSet.has(r.member_id));
  const detailsMap = new Map(pendingMembers.map((r) => [r.member_id, r.details]));

  const trackedMembers = await getMembersByIds(pendingMembers.map((r) => r.member_id));
  const trackedCandidates = trackedMembers
    .filter((member): member is MemberRow & { wallet_address: string } => Boolean(member.wallet_address))
    .map((member) => ({
      wallet_address: member.wallet_address,
      name: member.name,
      major: member.major,
      affiliation: member.affiliation,
      cohort: member.cohort,
      criteria_details: detailsMap.get(member.id) ?? null,
    }));

  const fallbackCandidates = await getFallbackCandidates(type, attestedSet);
  const merged = new Map<string, CertificateCandidate>();

  for (const candidate of fallbackCandidates) {
    merged.set(candidate.wallet_address.toLowerCase(), candidate);
  }

  for (const candidate of trackedCandidates) {
    merged.set(candidate.wallet_address.toLowerCase(), candidate);
  }

  return [...merged.values()].sort((a, b) => {
    if (a.cohort !== b.cohort) return a.cohort - b.cohort;
    return a.name.localeCompare(b.name, 'ko');
  });
}

export async function getIssuedAttestations(type: CertificateType): Promise<IssuedAttestationSummary[]> {
  const supabase = getSupabase();
  const criteriaType = CRITERIA_TYPE_MAP[type];

  const { data: rows, error } = await supabase
    .from('attestation')
    .select('member_id, eas_uid, created_at, attestation_type, revealed_data')
    .eq('attestation_type', criteriaType)
    .order('created_at', { ascending: false })
    .returns<
      Array<{
        member_id: number;
        eas_uid: string;
        created_at: string | null;
        attestation_type: CertificateType;
        revealed_data: Record<string, unknown> | null;
      }>
    >();

  if (error) throw error;

  const memberIds = [...new Set((rows ?? []).map((row) => row.member_id))];
  const members = await getMembersByIds(memberIds);
  const memberMap = new Map(members.map((member) => [member.id, member]));

  return (rows ?? [])
    .map((row) => {
      const member = memberMap.get(row.member_id);
      if (!member?.wallet_address) return null;

      return {
        wallet_address: member.wallet_address,
        name: member.name,
        major: member.major,
        affiliation: member.affiliation,
        cohort: member.cohort,
        eas_uid: row.eas_uid,
        created_at: row.created_at,
        attestation_type: row.attestation_type,
        criteria_details: row.revealed_data,
      } satisfies IssuedAttestationSummary;
    })
    .filter((row): row is IssuedAttestationSummary => Boolean(row));
}

export async function getMemberCertificateDetail(walletAddress: string): Promise<MemberCertificateDetail> {
  const supabase = getSupabase();

  const { data: member, error: memberError } = await supabase
    .from('member')
    .select('id, affiliation, has_assignment')
    .eq('wallet_address', walletAddress)
    .maybeSingle<{ id: number; affiliation: string; has_assignment: boolean | null }>();

  if (memberError) throw memberError;
  if (!member) {
    return { attendance: [], external_activity: [], assignment: [] };
  }

  const [attendanceResult, externalResult, sessionResult] = await Promise.all([
    supabase
      .from('attendance_record')
      .select('attendance_id, session_id, status, attended_at')
      .eq('member_id', member.id)
      .in('status', ['present', 'late'])
      .order('attended_at', { ascending: false })
      .returns<Array<{ attendance_id: string; session_id: string; status: string; attended_at: string | null }>>(),
    supabase
      .from('external_activity')
      .select('activity_id, session_id, evidence_url')
      .eq('member_id', member.id)
      .returns<Array<{ activity_id: string; session_id: string; evidence_url: string }>>(),
    supabase
      .from('attendance_session')
      .select('session_id, title')
      .returns<Array<{ session_id: string; title: string }>>(),
  ]);

  const sessionMap = new Map((sessionResult.data ?? []).map((s) => [s.session_id, s.title]));

  const attendance: AttendanceRecord[] = (attendanceResult.data ?? []).map((r) => ({
    attendance_id: r.attendance_id,
    session_id: r.session_id,
    session_name: sessionMap.get(r.session_id) ?? null,
    status: r.status as 'present' | 'late',
    attended_at: r.attended_at,
  }));

  const external_activity: ExternalActivityRecord[] = (externalResult.data ?? []).map((r) => ({
    activity_id: r.activity_id,
    session_id: r.session_id,
    session_name: sessionMap.get(r.session_id) ?? null,
    evidence_url: r.evidence_url,
  }));

  const assignment: AssignmentRecord[] = member.has_assignment
    ? [{
        assignment_id: `member-${member.id}-assignment`,
        assignment_title: '산출물 제출 확인',
        affiliation: member.affiliation,
        evidence_url: null,
      }]
    : [];

  return { attendance, external_activity, assignment };
}

export async function saveAttestation(params: {
  wallet_address: string;
  attestation_type: string;
  eas_uid: string;
  personal_data_hash: string;
  revealed_data: Record<string, unknown>;
  is_graduated: boolean;
}) {
  const supabase = getSupabase();

  const { data: member, error: memberError } = await supabase
    .from('member')
    .select('id')
    .eq('wallet_address', params.wallet_address)
    .maybeSingle<{ id: number }>();

  if (memberError) throw memberError;
  if (!member) {
    throw new Error('해당 지갑 주소에 연결된 member 레코드를 찾지 못했습니다.');
  }

  const { error } = await supabase.from('attestation').insert({
    member_id: member.id,
    attestation_type: params.attestation_type,
    eas_uid: params.eas_uid,
    personal_data_hash: params.personal_data_hash,
    revealed_data: params.revealed_data,
    is_graduated: params.is_graduated,
  });

  if (error) throw error;
}

export async function getSbtEligibility(walletAddress: string) {
  const supabase = getSupabase();

  const { data: member, error: memberError } = await supabase
    .from('member')
    .select('id, has_assignment')
    .ilike('wallet_address', walletAddress)
    .maybeSingle<{ id: number; has_assignment: boolean | null }>();

  if (memberError) throw memberError;
  if (!member) {
    return {
      memberId: null,
      eligible: false,
      alreadyMinted: false,
      missingTypes: ['attendance', 'external_activity', 'assignment', 'participation_period'],
      criteriaMetTypes: [],
      attestedTypes: [],
      criteriaCount: 0,
      attestedCount: 0,
      currentCount: 0,
      totalRequired: 4,
    };
  }

  const requiredTypes = ['attendance', 'external_activity', 'assignment', 'participation_period'] as const;

  const [
    { data: attestations, error: attestError },
    { data: trackedCriteria, error: trackedError },
    { data: coreSessionRows, error: coreSessionError },
    { data: eventSessionRows, error: eventSessionError },
    { data: externalActivities, error: externalError },
  ] = await Promise.all([
    supabase
      .from('attestation')
      .select('attestation_type')
      .eq('member_id', member.id)
      .returns<Array<{ attestation_type: string }>>(),
    supabase
      .from('semester_criteria_tracking')
      .select('criteria_type')
      .eq('member_id', member.id)
      .eq('is_met', true)
      .in('criteria_type', [...requiredTypes])
      .returns<Array<{ criteria_type: string }>>(),
    supabase
      .from('attendance_session')
      .select('session_id')
      .in('session_type', ['basic', 'advanced'])
      .returns<Array<{ session_id: string }>>(),
    supabase
      .from('attendance_session')
      .select('session_id')
      .in('session_type', ['external', 'hackathon'])
      .returns<Array<{ session_id: string }>>(),
    supabase
      .from('external_activity')
      .select('activity_id')
      .eq('member_id', member.id)
      .returns<Array<{ activity_id: string }>>(),
  ]);

  if (attestError) throw attestError;
  if (trackedError) throw trackedError;
  if (coreSessionError) throw coreSessionError;
  if (eventSessionError) throw eventSessionError;
  if (externalError) throw externalError;

  const coreSessionIds = (coreSessionRows ?? []).map((row) => row.session_id);
  const eventSessionIds = (eventSessionRows ?? []).map((row) => row.session_id);

  const [{ data: attendanceRows, error: attendanceError }, { data: eventAttendanceRows, error: eventAttendanceError }] =
    await Promise.all([
      coreSessionIds.length > 0
        ? supabase
            .from('attendance_record')
            .select('attendance_id')
            .eq('member_id', member.id)
            .in('status', ['present', 'late'])
            .in('session_id', coreSessionIds)
            .returns<Array<{ attendance_id: string }>>()
        : Promise.resolve({ data: [], error: null }),
      eventSessionIds.length > 0
        ? supabase
            .from('attendance_record')
            .select('attendance_id')
            .eq('member_id', member.id)
            .in('status', ['present', 'late'])
            .in('session_id', eventSessionIds)
            .returns<Array<{ attendance_id: string }>>()
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (attendanceError) throw attendanceError;
  if (eventAttendanceError) throw eventAttendanceError;

  const attestedTypes = Array.from(new Set((attestations ?? []).map((a) => a.attestation_type))).filter((type) =>
    requiredTypes.includes(type as (typeof requiredTypes)[number]),
  );

  const criteriaMetSet = new Set<string>(attestedTypes);
  const trackedTypes = new Set((trackedCriteria ?? []).map((row) => row.criteria_type));

  if ((attendanceRows ?? []).length >= 6) {
    criteriaMetSet.add('attendance');
  }

  if ((externalActivities ?? []).length > 0 || (eventAttendanceRows ?? []).length > 0) {
    criteriaMetSet.add('external_activity');
  }

  if (member.has_assignment) {
    criteriaMetSet.add('assignment');
  }

  for (const type of trackedTypes) {
    if (requiredTypes.includes(type as (typeof requiredTypes)[number])) {
      criteriaMetSet.add(type);
    }
  }

  const criteriaMetTypes = requiredTypes.filter((type) => criteriaMetSet.has(type));
  const missingTypes = requiredTypes.filter((type) => !attestedTypes.includes(type));

  const { data: existingSbt, error: sbtError } = await supabase
    .from('sbt_issuance')
    .select('issuance_id')
    .eq('member_id', member.id)
    .maybeSingle<{ issuance_id: string }>();

  if (sbtError) throw sbtError;

  return {
    memberId: member.id,
    eligible: missingTypes.length === 0,
    alreadyMinted: Boolean(existingSbt),
    missingTypes,
    criteriaMetTypes,
    attestedTypes,
    criteriaCount: criteriaMetTypes.length,
    attestedCount: attestedTypes.length,
    currentCount: attestedTypes.length,
    totalRequired: requiredTypes.length,
  };
}

export async function saveSbtIssuance(params: {
  memberId: number;
  tokenId: bigint;
  contractAddress: string;
  transactionHash: string;
  mintedAt: string;
}) {
  const supabase = getSupabase();

  const { error } = await supabase.from('sbt_issuance').insert({
    member_id: params.memberId,
    token_id: Number(params.tokenId),
    contract_address: params.contractAddress,
    transaction_hash: params.transactionHash,
    minted_at: params.mintedAt,
  });

  if (error) throw error;
}
