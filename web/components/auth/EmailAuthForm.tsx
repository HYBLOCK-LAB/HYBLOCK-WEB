'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { getBrowserSupabase, isBrowserSupabaseConfigured } from '@/lib/auth/supabase-browser';

export default function EmailAuthForm() {
  const router = useRouter();
  const supabaseConfigured = isBrowserSupabaseConfigured();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [linkWalletAfterSignup, setLinkWalletAfterSignup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError('Supabase 인증 설정이 없습니다.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session && linkWalletAfterSignup) {
      router.push('/wallet-link?intent=signup');
      return;
    }

    setMessage('회원가입이 완료되었습니다.');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4 text-center">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-monolith-onSurface">이름</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 outline-none transition focus:border-monolith-primaryContainer"
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-monolith-onSurface">이메일</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 outline-none transition focus:border-monolith-primaryContainer"
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-monolith-onSurface">비밀번호</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 outline-none transition focus:border-monolith-primaryContainer"
          required
        />
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLow px-4 py-4">
        <input
          type="checkbox"
          checked={linkWalletAfterSignup}
          onChange={(event) => setLinkWalletAfterSignup(event.target.checked)}
          className="mt-1 h-4 w-4 accent-monolith-primary"
        />
        <span className="text-sm text-monolith-onSurfaceMuted">회원가입 후 지갑 연동하기</span>
      </label>

      {error ? <p className="text-sm text-monolith-error">{error}</p> : null}
      {message ? <p className="text-sm text-monolith-primaryContainer">{message}</p> : null}

      <button
        type="submit"
        disabled={!supabaseConfigured || loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-monolith-primary px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-monolith-primaryContainer disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        회원가입
      </button>
    </form>
  );
}
