'use client';

// Serialize cookie mutations so an account change cannot race a login verification.
let pending: Promise<unknown> = Promise.resolve();
export function withWalletSessionLock<T>(operation: () => Promise<T>): Promise<T> {
  const result = pending.then(operation);
  pending = result.catch(() => undefined);
  return result;
}

export function notifyWalletSessionChanged() {
  window.dispatchEvent(new Event('hyblock:session-changed'));
  // Other tabs must also revalidate their authenticated identity.
  try {
    window.localStorage.setItem('hyblock_session_changed', crypto.randomUUID());
  } catch {
    // Storage may be disabled; this tab still revalidates via the event above.
  }
}

export async function logoutWalletSession() {
  await withWalletSessionLock(async () => {
    const response = await fetch('/api/auth/wallet/logout', { method: 'POST' });
    if (!response.ok) throw new Error('로그아웃 처리에 실패했습니다. 다시 시도하세요.');
  });
  try {
    window.localStorage.removeItem('hyblock_wallet_login');
  } catch {
    // Legacy UI storage is not needed to clear the authenticated session.
  }
  notifyWalletSessionChanged();
}
