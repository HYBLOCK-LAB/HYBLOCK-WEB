import type { ReactNode } from 'react';
import type { WalletConnectMode } from '@/components/wallet/wallet-connect.types';

type WalletConnectFeedbackProps = {
  mode: WalletConnectMode;
  error?: string | null;
  message?: string | null;
  helperText?: ReactNode;
};

export default function WalletConnectFeedback({ mode, error, message, helperText }: WalletConnectFeedbackProps) {
  const layoutClass = mode === 'centered' ? 'text-center' : 'text-left';

  return (
    <>
      {error ? <p className={['text-sm text-monolith-error', layoutClass].join(' ')}>{error}</p> : null}
      {message ? <p className={['text-sm text-monolith-primaryContainer', layoutClass].join(' ')}>{message}</p> : null}
      {helperText ? <div className={['text-sm text-monolith-onSurfaceMuted', layoutClass].join(' ')}>{helperText}</div> : null}
    </>
  );
}
