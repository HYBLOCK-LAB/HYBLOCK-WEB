import type { ReactNode } from 'react';

export type WalletConnectMode = 'centered' | 'stacked';

export type WalletConnectPanelProps = {
  address?: string;
  chainName?: string;
  walletLabel?: string;
  isConnected: boolean;
  isBusy?: boolean;
  isLinking?: boolean; // 추가
  connectLabel?: string;
  primaryActionLabel?: string; // 옵셔널로 변경
  onConnect: () => void | Promise<void>;
  onPrimaryAction?: () => void | Promise<void>; // 옵셔널로 변경
  onLink?: () => void | Promise<void>; // 추가
  onDisconnect: () => void;
  error?: string | null;
  message?: string | null;
  disabled?: boolean;
  helperText?: ReactNode;
  primaryActionDisabled?: boolean;
  mode?: WalletConnectMode;
  title?: string; // 추가
};
