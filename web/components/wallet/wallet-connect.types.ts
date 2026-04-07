import type { ReactNode } from 'react';

export type WalletConnectMode = 'centered' | 'stacked';

export type WalletConnectPanelProps = {
  address?: string;
  chainName?: string;
  walletLabel?: string;
  isConnected: boolean;
  isBusy?: boolean;
  connectLabel?: string;
  primaryActionLabel: string;
  onConnect: () => void | Promise<void>;
  onPrimaryAction: () => void | Promise<void>;
  onDisconnect: () => void;
  error?: string | null;
  message?: string | null;
  disabled?: boolean;
  helperText?: ReactNode;
  primaryActionDisabled?: boolean;
  mode?: WalletConnectMode;
};
