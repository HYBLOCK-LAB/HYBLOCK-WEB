import { Wallet } from 'lucide-react';
import type { WalletConnectMode } from '@/components/wallet/wallet-connect.types';

const walletHints = ['MetaMask', 'Coinbase Wallet', 'WalletConnect QR'];

type WalletConnectHeroProps = {
  mode: WalletConnectMode;
};

export default function WalletConnectHero({ mode }: WalletConnectHeroProps) {
  const layoutClass = mode === 'centered' ? 'text-center' : 'text-left';
  const actionClass = mode === 'centered' ? 'justify-center' : 'justify-start';

  return (
    <div className="relative overflow-hidden border-b border-monolith-outlineVariant/15 bg-[linear-gradient(135deg,rgba(0,51,97,0.98),rgba(14,74,132,0.9))] px-6 py-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,227,255,0.3),transparent_32%),linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:auto,32px_32px,32px_32px]" />
      <div className={['relative', layoutClass].join(' ')}>
        <div className={['flex items-center gap-3', actionClass].join(' ')}>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.24em] text-monolith-primaryFixed">Wallet</p>
            <h3 className="mt-1 text-2xl font-black tracking-[-0.05em] text-white">지갑 연결</h3>
          </div>
        </div>
        <div className={['mt-5 flex flex-wrap gap-2', actionClass].join(' ')}>
          {walletHints.map((hint) => (
            <span
              key={hint}
              className="rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-white/84"
            >
              {hint}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
