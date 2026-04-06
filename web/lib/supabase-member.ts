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

export async function getMemberByWallet(walletAddress: string): Promise<MemberProfile | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('member')
    .select('id, wallet_address, name, major, affiliation, cohort, role, is_active')
    .eq('wallet_address', walletAddress)
    .maybeSingle<MemberProfile>();

  if (error) throw error;
  return data;
}

export async function createMember(params: {
  wallet_address: string;
  name: string;
  major: string;
  affiliation: 'development' | 'business';
  cohort: number;
}) {
  const existing = await getMemberByWallet(params.wallet_address);
  if (existing) {
    return existing;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('member')
    .insert({
      wallet_address: params.wallet_address,
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
