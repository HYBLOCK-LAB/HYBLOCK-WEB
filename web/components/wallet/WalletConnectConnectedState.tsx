import { LoaderCircle, Link2, RefreshCcw, ShieldCheck, Unplug } from 'lucide-react';
import type { WalletConnectMode } from '@/components/wallet/wallet-connect.types';

type WalletConnectConnectedStateProps = {
  mode: WalletConnectMode;
  address?: string;
  chainName?: string;
  isBusy: boolean;
  primaryActionLabel: string;
  primaryActionDisabled: boolean;
  onPrimaryAction: () => void | Promise<void>;
  onConnect: () => void | Promise<void>;
  onDisconnect: () => void;
};

export default function WalletConnectConnectedState({
  mode,
  address,
  chainName,
  isBusy,
  primaryActionLabel,
  primaryActionDisabled,
  onPrimaryAction,
  onConnect,
  onDisconnect,
}: WalletConnectConnectedStateProps) {
  const actionClass = mode === 'centered' ? 'justify-center' : 'justify-start';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-monolith-primaryContainer/12 bg-[linear-gradient(180deg,rgba(208,225,254,0.45),rgba(255,255,255,0.95))] p-5">
        <div className={['flex flex-wrap items-start justify-between gap-4', mode === 'centered' ? 'text-center' : 'text-left'].join(' ')}>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-monolith-primary/65">Connected Wallet</p>
            <p className="mt-3 break-all text-base font-semibold text-monolith-onSurface">{address}</p>
            <div className={['mt-3 flex flex-wrap gap-2', mode === 'centered' ? 'justify-center' : ''].join(' ')}>
              <span className="rounded-full bg-monolith-surfaceLowest px-3 py-1 text-xs font-semibold text-monolith-primaryContainer">
                {chainName ?? '알 수 없는 네트워크'}
              </span>
              <span className="rounded-full bg-monolith-secondaryContainer px-3 py-1 text-xs font-semibold text-monolith-primaryContainer">
                {shortenAddress(address)}
              </span>
            </div>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-monolith-primary text-white">
            <Link2 className="h-5 w-5" />
          </span>
        </div>
      </div>

      <div className={['flex flex-wrap gap-3', actionClass].join(' ')}>
        <button
          type="button"
          onClick={onPrimaryAction}
          disabled={primaryActionDisabled || isBusy}
          className="interactive-soft flex items-center justify-center gap-2 rounded-2xl bg-monolith-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-monolith-primaryContainer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {primaryActionLabel}
        </button>
        <button
          type="button"
          onClick={onConnect}
          className="interactive-soft flex items-center justify-center gap-2 rounded-2xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-5 py-3 text-sm font-semibold text-monolith-onSurface transition-colors hover:bg-monolith-surface"
        >
          <RefreshCcw className="h-4 w-4" />
          지갑 다시 선택
        </button>
        <button
          type="button"
          onClick={onDisconnect}
          className="interactive-soft flex items-center justify-center gap-2 rounded-2xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLowest px-5 py-3 text-sm font-semibold text-monolith-onSurfaceMuted transition-colors hover:bg-monolith-surface"
        >
          <Unplug className="h-4 w-4" />
          연결 해제
        </button>
      </div>
    </div>
  );
}

function shortenAddress(address?: string) {
  if (!address) return '주소 없음';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
