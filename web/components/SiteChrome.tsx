'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, LogOut, Wallet } from 'lucide-react';
import { Bell, CheckCircle2, Compass, Home } from 'lucide-react';
import { useDisconnect } from 'wagmi';
import { useWalletConnectModal } from '@/lib/auth/use-wallet-connect-modal';
import { useWalletSessionStore } from '@/lib/auth/wallet-session-store';
import { adminNavItems, brandMenuItems, navItems } from '@/lib/site-content';
import { textContent } from '@/lib/text-content';

type SiteChromeProps = {
  activePath: string;
  children: React.ReactNode;
};

function isActive(activePath: string, href: string) {
  if (href === '/') return activePath === '/';
  return activePath.startsWith(href);
}

function isBrandMenuActive(activePath: string) {
  return activePath.startsWith('/about') || activePath.startsWith('/bylaws');
}

export default function SiteChrome({ activePath, children }: SiteChromeProps) {
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [headerHoverActive, setHeaderHoverActive] = useState(false);
  const { openWalletAccountModal, openWalletConnectModal } = useWalletConnectModal();
  const { disconnect } = useDisconnect();
  const address = useWalletSessionStore((state) => state.address);
  const chainName = useWalletSessionStore((state) => state.chainName);
  const isConnected = useWalletSessionStore((state) => state.isConnected);
  const isAdmin = activePath.startsWith('/admin');
  const headerNavItems = isAdmin ? adminNavItems : navItems;
  const visibleHeaderNavItems = isAdmin
    ? [...headerNavItems, { href: '/admin/certificates', label: '증명 관리' }]
    : headerNavItems;

  const handleHeaderWalletClick = async () => {
    if (isConnected && address) {
      await openWalletAccountModal();
      return;
    }

    await openWalletConnectModal();
  };

  return (
    <div className="min-h-screen bg-transparent text-monolith-onSurface">
      <div
        aria-hidden="true"
        className={[
          'pointer-events-none fixed inset-x-0 bottom-0 top-0 z-40 hidden transition-opacity duration-75 ease-out md:block',
          headerHoverActive ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        <div className="h-[7.5rem]" />
        <div className="h-[calc(100%-7.5rem)] bg-monolith-surfaceLowest/25 backdrop-blur-md" />
      </div>

      <header className="sticky top-0 z-50 border-b border-monolith-outlineVariant/30 bg-monolith-surfaceLowest/95 backdrop-blur-xl">
        <div
          className={[
            'header-expand-shell mx-auto max-w-7xl px-6 lg:px-8',
            'transition-all duration-300 ease-out',
            'py-4',
          ].join(' ')}
          onMouseLeave={() => {
            setBrandMenuOpen(false);
            setHeaderHoverActive(false);
          }}
        >
          <div className="flex h-24 items-center justify-between">
            <div className="flex items-center gap-12">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo_name.png"
                  alt="HYBLOCK"
                  width={186}
                  height={72}
                  className="h-14 w-auto object-contain"
                  priority
                />
              </Link>
              <nav className="hidden items-center gap-8 md:flex">
                {!isAdmin ? (
                  <div
                    className="relative"
                    onMouseEnter={() => {
                      setBrandMenuOpen(true);
                      setHeaderHoverActive(true);
                    }}
                    onFocus={() => {
                      setBrandMenuOpen(true);
                      setHeaderHoverActive(true);
                    }}
                  >
                    <Link
                      href="/about"
                      className={[
                        'flex h-13 items-center gap-1 rounded-md px-3 font-display text-[17px] font-medium tracking-tight transition-colors',
                        isBrandMenuActive(activePath)
                          ? 'bg-monolith-surfaceLow/90 text-monolith-primaryContainer'
                          : 'text-monolith-onSurfaceMuted hover:bg-monolith-surfaceLow/80 hover:text-monolith-primaryContainer',
                      ].join(' ')}
                    >
                      하이블록
                      <ChevronDown className={['h-4 w-4 transition-transform', brandMenuOpen ? 'rotate-180' : ''].join(' ')} />
                    </Link>
                  </div>
                ) : null}
                {visibleHeaderNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() => setHeaderHoverActive(true)}
                    onFocus={() => setHeaderHoverActive(true)}
                    className={[
                      'flex h-13 items-center rounded-md px-3 font-display text-[16px] font-medium tracking-tight transition-colors',
                      isActive(activePath, item.href)
                        ? 'bg-monolith-surfaceLow/90 text-monolith-primaryContainer'
                        : 'text-monolith-onSurfaceMuted hover:bg-monolith-surfaceLow/80 hover:text-monolith-primaryContainer',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            {isConnected && address ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleHeaderWalletClick}
                  className="interactive-soft flex items-center gap-3 rounded-md border border-monolith-primaryContainer/20 bg-monolith-surfaceLow px-2 py-1 text-sm font-semibold text-monolith-onSurface transition-colors hover:bg-monolith-surface"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-monolith-primaryFixed text-monolith-primary">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <span className="flex flex-col items-start leading-tight text-sm">
                    <span>{shortenAddress(address)}</span>
                    <span className="text-[10px] font-medium text-monolith-onSurfaceMuted">{chainName ?? 'Wallet'}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => disconnect()}
                  className="interactive-soft flex h-11 w-11 items-center justify-center rounded-md border border-monolith-outlineVariant/30 bg-monolith-surfaceLowest text-monolith-onSurfaceMuted transition-colors hover:bg-monolith-surface hover:text-monolith-onSurface"
                  aria-label="로그아웃"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="interactive-soft rounded-md border border-monolith-primaryContainer/40 bg-monolith-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-monolith-primaryContainer"
              >
                로그인
              </Link>
            )}
          </div>

          <div
            className={[
              'hidden overflow-hidden transition-all duration-300 ease-out md:block',
              !isAdmin && brandMenuOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0',
            ].join(' ')}
            onMouseEnter={() => {
              setBrandMenuOpen(true);
              setHeaderHoverActive(true);
            }}
            onFocus={() => {
              setBrandMenuOpen(true);
              setHeaderHoverActive(true);
            }}
          >
            <div className="pb-6 pl-[12.25rem] pt-5">
              <div className="flex max-w-xl items-center gap-8">
                {brandMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      'rounded-md px-3 py-2 font-display text-xl font-semibold tracking-tight transition-colors',
                      isActive(activePath, item.href)
                        ? 'bg-monolith-surfaceLow/90 text-monolith-primaryContainer'
                        : 'text-monolith-onSurface hover:bg-monolith-surfaceLow/80 hover:text-monolith-primaryContainer',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-monolith-outlineVariant/40 bg-monolith-surfaceLowest/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <div className="mt-2 flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="HYBLOCK logo"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
              <p className="text-sm text-monolith-onSurfaceMuted">{textContent.footer.copyright}</p>
            </div>
          </div>
          <div className="flex gap-6 text-sm text-monolith-onSurfaceMuted">
            <a
              href="https://www.instagram.com/hyblock_kr/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-monolith-primaryContainer"
            >
              <i className="fa-brands fa-instagram text-base" aria-hidden="true" />
            </a>
            <a
              href="https://www.linkedin.com/company/hyblock/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-monolith-primaryContainer"
            >
              <i className="fa-brands fa-linkedin text-base" aria-hidden="true" />
            </a>
            <a
              href="https://x.com/hyblock_kr"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-monolith-primaryContainer"
            >
              <i className="fa-brands fa-x-twitter text-base" aria-hidden="true" />
            </a>
          </div>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-monolith-outlineVariant/40 bg-monolith-surfaceLowest/95 px-3 py-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {isAdmin ? (
            <>
              <Link href="/admin" className={mobileNavClass(activePath === '/admin')}>
                <Home className="h-5 w-5" />
                <span>관리</span>
              </Link>
              <Link href="/admin/members" className={mobileNavClass(activePath.startsWith('/admin/members'))}>
                <span className="text-sm font-bold">멤</span>
                <span>멤버</span>
              </Link>
              <Link href="/admin/activities" className={mobileNavClass(activePath.startsWith('/admin/activities'))}>
                <Compass className="h-5 w-5" />
                <span>활동</span>
              </Link>
              <Link href="/admin/attendance" className={mobileNavClass(activePath.startsWith('/admin/attendance'))}>
                <CheckCircle2 className="h-5 w-5" />
                <span>출석</span>
              </Link>
              <Link href="/admin/certificates" className={mobileNavClass(activePath.startsWith('/admin/certificates'))}>
                <span className="text-sm font-bold">증</span>
                <span>증명</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/" className={mobileNavClass(activePath === '/')}>
                <Home className="h-5 w-5" />
                <span>홈</span>
              </Link>
              <Link href="/about" className={mobileNavClass(activePath.startsWith('/about'))}>
                <span className="text-sm font-bold">소</span>
                <span>소개</span>
              </Link>
              <Link href="/bylaws" className={mobileNavClass(activePath.startsWith('/bylaws'))}>
                <span className="text-sm font-bold">규</span>
                <span>회칙</span>
              </Link>
              <Link href="/notices" className={mobileNavClass(activePath.startsWith('/notices'))}>
                <Bell className="h-5 w-5" />
                <span>공지</span>
              </Link>
              <Link href="/activities" className={mobileNavClass(activePath.startsWith('/activities'))}>
                <Compass className="h-5 w-5" />
                <span>활동</span>
              </Link>
              <Link href="/attendance" className={mobileNavClass(activePath.startsWith('/attendance'))}>
                <CheckCircle2 className="h-5 w-5" />
                <span>출석</span>
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

function mobileNavClass(active: boolean) {
  return [
    'flex flex-col items-center gap-1 text-[10px] font-bold',
    active ? 'text-monolith-primaryContainer' : 'text-monolith-onSurfaceMuted',
  ].join(' ');
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
