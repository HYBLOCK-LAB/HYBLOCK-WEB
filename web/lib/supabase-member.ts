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
};

function normalizeWalletAddress(walletAddress: string) {
  return walletAddress.trim().toLowerCase();
}

export async function getMemberByWallet(walletAddress: string): Promise<MemberProfile | null> {
  const supabase = getSupabase();
  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);
  const { data, error } = await supabase
    .from('member')
    .select('id, wallet_address, name, major, affiliation, cohort, role, is_active')
    .ilike('wallet_address', normalizedWalletAddress)
    .order('is_active', { ascending: false })
    .order('id', { ascending: true })
    .returns<MemberProfile[]>();

  if (error) throw error;

  if (!data || data.length === 0) {
    return null;
  }

  const exactMatch =
    data.find((member) => member.wallet_address && normalizeWalletAddress(member.wallet_address) === normalizedWalletAddress) ?? null;

  return exactMatch ?? data[0] ?? null;
}

export async function getMemberByName(name: string): Promise<MemberProfile | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('member')
    .select('id, wallet_address, name, major, affiliation, cohort, role, is_active')
    .eq('name', name)
    .eq('is_active', true)
    .limit(2)
    .returns<MemberProfile[]>();

  if (error) throw error;
  if (!data || data.length === 0) return null;
  if (data.length > 1) {
    throw new Error(`Multiple active members found with name: ${name}`);
  }

  return data[0];
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
    .select('id, wallet_address, name, major, affiliation, cohort, role, is_active')
    .single<MemberProfile>();

  if (error) throw error;
  return data;
}
