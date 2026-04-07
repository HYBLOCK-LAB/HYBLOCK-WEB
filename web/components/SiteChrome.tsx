'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, LogOut, UserRound, Wallet, Languages } from 'lucide-react';
import { useDisconnect } from 'wagmi';
import { useWalletConnectModal } from '@/lib/auth/use-wallet-connect-modal';
import { useWalletSessionStore } from '@/lib/auth/wallet-session-store';
import { useLanguageStore } from '@/lib/auth/language-store';
import { adminNavItems, brandMenuItems, navItems } from '@/lib/site-content';

type SiteChromeProps = {
  activePath: string;
  children: React.ReactNode;
};

function isActive(activePath: string, href: string) {
  if (href === '/') return activePath === '/';
  return activePath.startsWith(href);
}

export default function SiteChrome({ activePath, children }: SiteChromeProps) {
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const { openWalletAccountModal, openWalletConnectModal } = useWalletConnectModal();
  const { disconnect } = useDisconnect();
  const address = useWalletSessionStore((state) => state.address);
  const isConnected = useWalletSessionStore((state) => state.isConnected);
  const { language, toggleLanguage } = useLanguageStore();
  const isAdmin = activePath.startsWith('/admin');
  const headerNavItems = isAdmin ? adminNavItems : navItems;

  const handleHeaderWalletClick = async () => {
    if (isConnected && address) {
      await openWalletAccountModal();
      return;
    }
    await openWalletConnectModal();
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-8">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-3">
              <Image 
                src="/logo_name.png" 
                alt="HYBLOCK" 
                width={200} 
                height={64} 
                className="h-12 w-auto object-contain"
                priority 
              />
            </Link>
            
            <nav className="hidden items-center gap-10 md:flex">
              {/* Brand Dropdown */}
              <div 
                className="relative group py-6"
                onMouseEnter={() => setBrandMenuOpen(true)}
                onMouseLeave={() => setBrandMenuOpen(false)}
              >
                <button className="flex items-center gap-1.5 text-[16px] font-extrabold text-slate-700 group-hover:text-[#0e4a84] transition-colors">
                  하이블록 <ChevronDown className={`h-4 w-4 transition-transform ${brandMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {brandMenuOpen && (
                  <div className="absolute left-0 top-[80%] w-56 rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_30px_100px_rgba(0,0,0,0.15)] animate-in fade-in slide-in-from-top-2 duration-200">
                    {brandMenuItems.map((item) => (
                      <Link key={item.href} href={item.href} className="block rounded-xl px-5 py-3.5 text-[15px] font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0e4a84] transition-all">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {headerNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[16px] font-extrabold transition-colors ${
                    isActive(activePath, item.href) ? 'text-[#0e4a84]' : 'text-slate-700 hover:text-[#0e4a84]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {isConnected && address ? (
                <Link
                  href="/attendance"
                  className={`text-[16px] font-extrabold transition-colors ${
                    activePath === '/attendance' ? 'text-[#0e4a84]' : 'text-slate-700 hover:text-[#0e4a84]'
                  }`}
                >
                  출석 체크
                </Link>
              ) : (
                <Link 
                  href="/apply" 
                  className={`text-[16px] font-extrabold transition-colors ${
                    activePath === '/apply' ? 'text-[#0e4a84]' : 'text-slate-700 hover:text-[#0e4a84]'
                  }`}
                >
                  지원하기
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-5">
            {/* Language Toggle */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-[13px] font-bold text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Languages className="h-3.5 w-3.5" />
              {language === 'ko' ? 'KOR' : 'ENG'}
            </button>

            {isConnected && address ? (
              <>
                <button onClick={handleHeaderWalletClick} className="flex items-center gap-2.5 rounded-full bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-200 transition-colors">
                  <Wallet className="h-4 w-4 text-[#0e4a84]" /> {(address || '').slice(0, 6)}...{(address || '').slice(-4)}
                </button>
                <Link href="/mypage" className="rounded-full p-2.5 text-slate-600 hover:bg-slate-100 transition-colors">
                  <UserRound className="h-5.5 w-5.5" />
                </Link>
                <button onClick={() => disconnect()} className="rounded-full p-2.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-colors">
                  <LogOut className="h-5.5 w-5.5" />
                </button>
              </>
            ) : (
              <Link href="/login" className="rounded-full bg-[#0e4a84] px-8 py-3 text-[15px] font-bold text-white shadow-xl shadow-blue-900/20 hover:scale-105 transition-transform active:scale-95">
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      {children}
      <footer className="border-t border-slate-100 bg-slate-50/50 py-10">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <span className="font-display text-xl font-black tracking-tighter text-slate-900">HYBLOCK</span>
              <p className="text-sm font-medium text-slate-400">
                © 2026 HYBLOCK Academic Club. All rights reserved.
              </p>
              <p className="text-sm font-bold text-[#0e4a84]">
                hyblock2022@gmail.com
              </p>
              <div className="flex gap-6 text-sm font-bold text-slate-500">
                <Link href="/privacy-policy" className="hover:text-[#0e4a84] transition-colors">
                  {language === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}
                </Link>
                <Link href="/terms-of-service" className="hover:text-[#0e4a84] transition-colors">
                  {language === 'ko' ? '이용약관' : 'Terms of Service'}
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-slate-400">
              <a href="https://medium.com/hy-block" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors" title="Medium">
                <i className="fa-brands fa-medium text-2xl" />
              </a>
              <a href="https://www.instagram.com/hyblock_kr/" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors" title="Instagram">
                <i className="fa-brands fa-instagram text-2xl" />
              </a>
              <a href="https://www.linkedin.com/company/hyblock/" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors" title="LinkedIn">
                <i className="fa-brands fa-linkedin text-2xl" />
              </a>
              <a href="https://x.com/hyblock_kr" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors" title="X (Twitter)">
                <i className="fa-brands fa-x-twitter text-2xl" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
