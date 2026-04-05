'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

type AdminAuthGuardProps = {
  children: React.ReactNode;
};

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected, isConnecting, status } = useAccount();

  useEffect(() => {
    if (isConnecting || status === 'reconnecting') {
      return;
    }

    if (!isConnected) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isConnected, isConnecting, pathname, router, status]);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-monolith-primaryContainer">Admin Access</p>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-monolith-primary">로그인이 필요합니다.</h1>
        <p className="mt-4 text-sm leading-7 text-monolith-onSurfaceMuted">관리자 페이지는 로그인 후 접근할 수 있습니다. 로그인 페이지로 이동합니다.</p>
      </div>
    );
  }

  return <>{children}</>;
}
