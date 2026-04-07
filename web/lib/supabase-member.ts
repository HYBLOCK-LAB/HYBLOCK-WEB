import { getSupabase } from '@/lib/supabase';

export type MemberProfile = {
  id: number;
  wallet_address: string | null;
  name: string;
  major: string;
  affiliation: 'development' | 'business';
  cohort: number;
  role: string;
  is_active: boolean;
  is_admin: boolean;
};

type MemberRow = Omit<MemberProfile, 'is_admin'> & {
  is_admin?: boolean | null;
};

const MEMBER_SELECT_COLUMNS = 'id, wallet_address, name, major, affiliation, cohort, role, is_active, is_admin';

function toMemberProfile(member: MemberRow): MemberProfile {
  return {
    ...member,
    is_admin: member.is_admin ?? false,
  };
}

function normalizeWalletAddress(walletAddress: string | null | undefined): string {
  if (!walletAddress) return '';
  return walletAddress.trim().toLowerCase();
}

export async function getMemberByWallet(walletAddress: string): Promise<MemberProfile | null> {
  const supabase = getSupabase();
  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);
  const { data, error } = await supabase
    .from('member')
    .select(MEMBER_SELECT_COLUMNS)
    .ilike('wallet_address', normalizedWalletAddress)
    .order('is_active', { ascending: false })
    .order('id', { ascending: true })
    .returns<MemberRow[]>();

  if (error) throw error;

  if (!data || data.length === 0) {
    return null;
  }

  const exactMatch =
    data.find((member) => member.wallet_address && normalizeWalletAddress(member.wallet_address) === normalizedWalletAddress) ?? null;

  const matchedMember = exactMatch ?? data[0] ?? null;
  return matchedMember ? toMemberProfile(matchedMember) : null;
}

export async function getMemberByName(name: string): Promise<MemberProfile | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('member')
    .select(MEMBER_SELECT_COLUMNS)
    .eq('name', name)
    .eq('is_active', true)
    .limit(2)
    .returns<MemberRow[]>();

  if (error) throw error;
  if (!data || data.length === 0) return null;
  if (data.length > 1) {
    throw new Error(`Multiple active members found with name: ${name}`);
  }

  return toMemberProfile(data[0]);
}

export async function createMember(params: {
  wallet_address: string;
  name: string;
  major: string;
  affiliation: 'development' | 'business';
  cohort: number;
}) {
  const normalizedWalletAddress = normalizeWalletAddress(params.wallet_address);
  const existing = await getMemberByWallet(normalizedWalletAddress);
  if (existing) {
    return existing;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('member')
    .insert({
      wallet_address: normalizedWalletAddress,
      name: params.name,
      major: params.major,
      affiliation: params.affiliation,
      cohort: params.cohort,
      role: 'member',
      period_start: new Date().toISOString(),
      is_active: true,
    })
    .select(MEMBER_SELECT_COLUMNS)
    .single<MemberRow>();

  if (error) throw error;
  return toMemberProfile(data);
}
