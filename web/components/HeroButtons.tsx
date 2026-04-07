'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useWalletSessionStore } from '@/lib/auth/wallet-session-store';
import { useLanguageStore } from '@/lib/auth/language-store';
import { textContent } from '@/lib/text-content';

export default function HeroButtons() {
  const { address } = useAccount();
  const isConnected = useWalletSessionStore((state) => state.isConnected);
  const { language } = useLanguageStore();
  const d = textContent[language].home;
  const loggedIn = isConnected && address;

  return (
    <div className="mt-12 flex flex-wrap gap-5">
      <Link 
        href="/about" 
        className="interactive-soft rounded-full bg-white px-10 py-4 text-lg font-bold text-[#0e4a84] shadow-xl"
      >
        {d.heroCtaIntro}
      </Link>
      
      {loggedIn ? (
        <Link 
          href="/attendance" 
          className="interactive-soft rounded-full border-2 border-white/20 px-10 py-4 text-lg font-bold text-white hover:bg-white/10"
        >
          {d.heroCtaAttendance}
        </Link>
      ) : (
        <Link 
          href="/apply" 
          className="interactive-soft rounded-full border-2 border-white/20 px-10 py-4 text-lg font-bold text-white hover:bg-white/10"
        >
          {d.heroCtaApply}
        </Link>
      )}
    </div>
  );
}
