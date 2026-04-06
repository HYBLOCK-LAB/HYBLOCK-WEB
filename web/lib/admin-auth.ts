import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { getWalletSessionMember } from '@/lib/wallet-session';
import type { MemberProfile } from '@/lib/supabase-member';

const ADMIN_FALLBACK_PATH = '/forbidden';

export function isAdminMember(member: MemberProfile | null) {
  return Boolean(member?.is_admin);
}

export async function requireAdminPageAccess(pathname: string) {
  const member = await getWalletSessionMember();

  if (!member) {
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  if (!isAdminMember(member)) {
    redirect(ADMIN_FALLBACK_PATH);
  }

  return member;
}

export async function requireAdminApiAccess() {
  const member = await getWalletSessionMember();

  if (!member) {
    return {
      member: null,
      response: NextResponse.json({ error: '관리자 세션 로그인이 필요합니다.' }, { status: 401 }),
    };
  }

  if (!isAdminMember(member)) {
    return {
      member: null,
      response: NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 }),
    };
  }

  return { member, response: null };
}
