'use client';

import { useState } from 'react';
import { AppKitProvider } from '@reown/appkit/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { appKitConfig, wagmiConfig } from '@/lib/auth/wagmi-config';
import WalletSessionSync from '@/providers/WalletSessionSync';

type AppProvidersProps = {
  children: React.ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <AppKitProvider {...appKitConfig}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <WalletSessionSync />
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </AppKitProvider>
  );
}
