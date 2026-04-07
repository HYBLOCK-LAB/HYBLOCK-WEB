import { Wallet } from 'lucide-react';
import type { WalletConnectMode } from '@/components/wallet/wallet-connect.types';

type WalletConnectDisconnectedStateProps = {
  mode: WalletConnectMode;
  connectLabel: string;
  disabled: boolean;
  onConnect: () => void | Promise<void>;
};

export default function WalletConnectDisconnectedState({
  mode,
  connectLabel,
  disabled,
  onConnect,
}: WalletConnectDisconnectedStateProps) {
  const layoutClass = mode === 'centered' ? 'text-center' : 'text-left';

  return (
    <div className={['space-y-5', layoutClass].join(' ')}>
      <div className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLow p-4 text-sm text-monolith-onSurfaceMuted">
        연결할 지갑을 선택하세요.
      </div>

      <button
        type="button"
        onClick={onConnect}
        disabled={disabled}
        className="interactive-soft flex w-full items-center justify-center gap-3 rounded-2xl border border-[#0e4a84] bg-[linear-gradient(135deg,#003361,#0e4a84)] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,51,97,0.22)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/14 ring-1 ring-white/18">
          <Wallet className="h-4 w-4" />
        </span>
        {connectLabel}
      </button>
    </div>
  );
}
