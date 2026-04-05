'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWalletSessionStore } from '@/lib/auth/wallet-session-store';

export default function WalletSessionSync() {
  const { address, chain, isConnected } = useAccount();
  const resetWalletSession = useWalletSessionStore((state) => state.resetWalletSession);
  const setWalletSession = useWalletSessionStore((state) => state.setWalletSession);

  useEffect(() => {
    if (!isConnected || !address) {
      resetWalletSession();
      return;
    }

    setWalletSession({
      address,
      chainName: chain?.name ?? null,
      isConnected: true,
    });
  }, [address, chain?.name, isConnected, resetWalletSession, setWalletSession]);

  return null;
}
