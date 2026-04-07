'use client';

import WalletConnectConnectedState from '@/components/wallet/WalletConnectConnectedState';
import WalletConnectDisconnectedState from '@/components/wallet/WalletConnectDisconnectedState';
import WalletConnectFeedback from '@/components/wallet/WalletConnectFeedback';
import WalletConnectHero from '@/components/wallet/WalletConnectHero';
import type { WalletConnectPanelProps } from '@/components/wallet/wallet-connect.types';

export default function WalletConnectPanel({
  address,
  chainName,
  walletLabel,
  isConnected,
  isBusy = false,
  isLinking = false,
  connectLabel = 'Connect Wallet',
  primaryActionLabel,
  onConnect,
  onPrimaryAction,
  onLink,
  onDisconnect,
  error,
  message,
  disabled = false,
  helperText,
  primaryActionDisabled = false,
  mode = 'stacked',
  title,
}: WalletConnectPanelProps) {
  // Use onLink as primary action if provided (for WalletLinkPanel usage)
  const finalPrimaryAction = onLink || onPrimaryAction;
  const finalPrimaryLabel = primaryActionLabel || (onLink ? 'Link Wallet' : 'Action');
  const finalIsBusy = isBusy || isLinking;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[1.75rem] border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest shadow-[0_20px_50px_rgba(0,51,97,0.08)]">
        <WalletConnectHero mode={mode} />

        <div className="space-y-5 px-6 py-6">
          {title && <h3 className="text-sm font-bold text-monolith-onSurfaceMuted px-1">{title}</h3>}
          
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
              walletLabel={walletLabel}
              isBusy={finalIsBusy}
              primaryActionLabel={finalPrimaryLabel}
              primaryActionDisabled={primaryActionDisabled}
              onPrimaryAction={finalPrimaryAction ? finalPrimaryAction : () => {}}
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
