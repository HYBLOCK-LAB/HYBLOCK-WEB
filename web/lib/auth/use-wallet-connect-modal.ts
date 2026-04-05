'use client';

import { useAppKit } from '@reown/appkit/react';
import { isReownProjectIdConfigured } from '@/lib/auth/wagmi-config';

export function useWalletConnectModal() {
  const { open } = useAppKit();

  async function openWalletConnectModal() {
    if (!isReownProjectIdConfigured) {
      return 'WalletConnect project id가 필요합니다.';
    }

    await open({ view: 'Connect' });
    return null;
  }

  async function openWalletAccountModal() {
    if (!isReownProjectIdConfigured) {
      return 'WalletConnect project id가 필요합니다.';
    }

    await open({ view: 'Account' });
    return null;
  }

  return {
    openWalletAccountModal,
    openWalletConnectModal,
  };
}
