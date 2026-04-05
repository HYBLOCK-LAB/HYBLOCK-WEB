'use client';

import WalletConnectConnectedState from '@/components/wallet/WalletConnectConnectedState';
import WalletConnectDisconnectedState from '@/components/wallet/WalletConnectDisconnectedState';
import WalletConnectFeedback from '@/components/wallet/WalletConnectFeedback';
import WalletConnectHero from '@/components/wallet/WalletConnectHero';
import type { WalletConnectPanelProps } from '@/components/wallet/wallet-connect.types';

export default function WalletConnectPanel({
  address,
  chainName,
  isConnected,
  isBusy = false,
  connectLabel = 'Connect Wallet',
  primaryActionLabel,
  onConnect,
  onPrimaryAction,
  onDisconnect,
  error,
  message,
  disabled = false,
  helperText,
  primaryActionDisabled = false,
  mode = 'stacked',
}: WalletConnectPanelProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[1.75rem] border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest shadow-[0_20px_50px_rgba(0,51,97,0.08)]">
        <WalletConnectHero mode={mode} />

        <div className="space-y-5 px-6 py-6">
          {!isConnected ? (
            <WalletConnectDisconnectedState
              mode={mode}
              connectLabel={connectLabel}
              disabled={disabled}
              onConnect={onConnect}
            />
          ) : (
            <WalletConnectConnectedState
              mode={mode}
              address={address}
              chainName={chainName}
              isBusy={isBusy}
              primaryActionLabel={primaryActionLabel}
              primaryActionDisabled={primaryActionDisabled}
              onPrimaryAction={onPrimaryAction}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
            />
          )}
        </div>
      </div>

      <WalletConnectFeedback mode={mode} error={error} message={message} helperText={helperText} />
    </div>
  );
}
