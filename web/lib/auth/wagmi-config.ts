import { createAppKit } from '@reown/appkit/react';
import { mainnet, sepolia } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { coinbaseWallet, metaMask, walletConnect } from '@wagmi/connectors';
import type { AppKitNetwork } from '@reown/appkit/networks';
import type { CreateAppKit } from '@reown/appkit/react';

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? 'missing-project-id';

const metadata = {
  name: 'HYBLOCK',
  description: 'HYBLOCK Official',
  url: 'https://hyblock.kr',
  icons: ['https://hyblock.kr/logo.png'],
};

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, sepolia];

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [...networks],
  connectors: [
    walletConnect({
      projectId,
      showQrModal: true,
      metadata,
    }),
    metaMask({
      dappMetadata: {
        name: metadata.name,
        url: metadata.url,
        iconUrl: metadata.icons[0],
      },
    }),
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons[0],
    }),
  ],
  ssr: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
export const isReownProjectIdConfigured = projectId !== 'missing-project-id';
export const appKitConfig: CreateAppKit = {
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,
  themeMode: 'light',
  themeVariables: {
    '--apkt-accent': '#0e4a84',
    '--apkt-color-mix': '#003361',
    '--apkt-color-mix-strength': 8,
    '--apkt-font-family': 'var(--font-manrope), sans-serif',
    '--apkt-font-size-master': '10px',
    '--apkt-border-radius-master': '4px',
    '--apkt-z-index': 80,
  },
  features: {
    analytics: false,
  },
};

let appKitInitialized = false;

export function ensureAppKit() {
  if (appKitInitialized) return;

  createAppKit(appKitConfig);

  appKitInitialized = true;
}

export function buildWalletLinkMessage(address: string) {
  return [
    'HYBLOCK wallet link confirmation',
    `Address: ${address}`,
    `Timestamp: ${new Date().toISOString()}`,
  ].join('\n');
}
