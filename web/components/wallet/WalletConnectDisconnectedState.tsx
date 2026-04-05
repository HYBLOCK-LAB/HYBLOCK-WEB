import { ShieldCheck, Wallet } from 'lucide-react';
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
      <div className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLow p-4">
        <div className={['flex items-start gap-3', mode === 'centered' ? 'justify-center' : ''].join(' ')}>
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-monolith-primaryFixed text-monolith-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-monolith-onSurface">브랜드 UI로 먼저 안내하고, 실제 연결은 WalletConnect 모달을 사용합니다.</p>
            <p className="mt-1 text-sm leading-6 text-monolith-onSurfaceMuted">
              연결 후에는 주소 확인, 네트워크 확인, 서명 또는 계정 연동까지 같은 화면에서 바로 이어집니다.
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onConnect}
        disabled={disabled}
        className="interactive-soft flex w-full items-center justify-center gap-3 rounded-2xl bg-monolith-primary px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,51,97,0.18)] transition-colors hover:bg-monolith-primaryContainer disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Wallet className="h-4 w-4" />
        {connectLabel}
      </button>
    </div>
  );
}
