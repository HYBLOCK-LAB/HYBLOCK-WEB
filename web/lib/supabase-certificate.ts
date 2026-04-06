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
};

export async function getCertificateCandidates(type: CertificateType): Promise<CertificateCandidate[]> {
  const supabase = getSupabase();
  const criteriaType = CRITERIA_TYPE_MAP[type];

  const [{ data: tracking, error: trackingError }, { data: attested, error: attestedError }] = await Promise.all([
    supabase
      .from('semester_criteria_tracking')
      .select('wallet_address, cohort, details')
      .eq('criteria_type', criteriaType)
      .eq('is_met', true)
      .returns<Array<{ wallet_address: string; cohort: number; details: Record<string, unknown> | null }>>(),
    supabase
      .from('attestation')
      .select('wallet_address')
      .eq('attestation_type', criteriaType)
      .returns<Array<{ wallet_address: string }>>(),
  ]);

  if (trackingError) throw trackingError;
  if (attestedError) throw attestedError;

  const attestedSet = new Set((attested ?? []).map((r) => r.wallet_address));
  const pendingWallets = (tracking ?? []).filter((r) => !attestedSet.has(r.wallet_address));

  if (pendingWallets.length === 0) return [];

  const walletList = pendingWallets.map((r) => r.wallet_address);

  const { data: members, error: membersError } = await supabase
    .from('personal_info')
    .select('wallet_address, name, major, affiliation, cohort')
    .in('wallet_address', walletList)
    .order('cohort', { ascending: true })
    .order('name', { ascending: true })
    .returns<Array<{ wallet_address: string; name: string; major: string; affiliation: string; cohort: number }>>();

  if (membersError) throw membersError;

  const detailsMap = new Map(pendingWallets.map((r) => [r.wallet_address, r.details]));

  return (members ?? []).map((m) => ({
    ...m,
    criteria_details: detailsMap.get(m.wallet_address) ?? null,
  }));
}

export async function getMemberCertificateDetail(walletAddress: string): Promise<MemberCertificateDetail> {
  const supabase = getSupabase();

  const [attendanceResult, externalResult, assignmentResult, sessionResult] = await Promise.all([
    supabase
      .from('attendance')
      .select('attendance_id, session_id, status, attended_at')
      .eq('wallet_address', walletAddress)
      .in('status', ['present', 'late'])
      .order('attended_at', { ascending: false })
      .returns<Array<{ attendance_id: string; session_id: string; status: string; attended_at: string | null }>>(),
    supabase
      .from('external_activity')
      .select('activity_id, session_id, evidence_url')
      .eq('wallet_address', walletAddress)
      .returns<Array<{ activity_id: string; session_id: string; evidence_url: string }>>(),
    supabase
      .from('assignment')
      .select('assignment_id, assignment_title, affiliation, evidence_url')
      .eq('wallet_address', walletAddress)
      .order('assignment_title', { ascending: true })
      .returns<Array<{ assignment_id: string; assignment_title: string; affiliation: string; evidence_url: string | null }>>(),
    supabase
      .from('session')
      .select('session_id, content')
      .returns<Array<{ session_id: string; content: string | null }>>(),
  ]);

  const sessionMap = new Map((sessionResult.data ?? []).map((s) => [s.session_id, s.content]));

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

  const assignment: AssignmentRecord[] = assignmentResult.data ?? [];

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

  const { error } = await supabase.from('attestation').insert({
    wallet_address: params.wallet_address,
    attestation_type: params.attestation_type,
    eas_uid: params.eas_uid,
    personal_data_hash: params.personal_data_hash,
    revealed_data: params.revealed_data,
    is_graduated: params.is_graduated,
  });

  if (error) throw error;
}
