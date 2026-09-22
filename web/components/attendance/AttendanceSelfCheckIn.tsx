'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Clock3, LoaderCircle, RefreshCw } from 'lucide-react';
import { getBrowserSupabase, isBrowserSupabaseConfigured } from '@/lib/auth/supabase-browser';

type AttendanceSelfCheckInProps = {
  encodedEvent: string;
};

type CheckInResponse = {
  success?: boolean;
  alreadyCheckedIn?: boolean;
  status?: 'present' | 'late' | null;
  eventName?: string;
  memberName?: string;
  error?: string;
  code?: 'session_inactive' | 'affiliation_mismatch' | string;
};

type ViewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; alreadyCheckedIn: boolean; status: 'present' | 'late' | null; eventName?: string; memberName?: string }
  | { kind: 'error'; message: string; code?: string };

export default function AttendanceSelfCheckIn({ encodedEvent }: AttendanceSelfCheckInProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewState>({ kind: encodedEvent ? 'loading' : 'idle' });
  const [code, setCode] = useState('');
  const submittingRef = useRef(false);

  const submit = useCallback(async (submittedCode?: string) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setView({ kind: 'loading' });

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (isBrowserSupabaseConfigured()) {
        const supabase = getBrowserSupabase();
        const accessToken = supabase ? (await supabase.auth.getSession()).data.session?.access_token : null;
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch('/api/attendance/self-check-in', {
        method: 'POST',
        headers,
        body: JSON.stringify(encodedEvent ? { event: encodedEvent } : { code: submittedCode }),
      });

      if (response.status === 401) {
        const returnPath = encodedEvent ? `/attendance/check-in?e=${encodeURIComponent(encodedEvent)}` : '/attendance/check-in';
        router.replace(`/login?redirect=${encodeURIComponent(returnPath)}`);
        return;
      }

      const payload = (await response.json().catch(() => ({}))) as CheckInResponse;

      if (!response.ok || !payload.success) {
        setView({
          kind: 'error',
          message: payload.error ?? '출석 처리에 실패했습니다.',
          code: payload.code,
        });
        return;
      }

      setView({
        kind: 'success',
        alreadyCheckedIn: Boolean(payload.alreadyCheckedIn),
        status: payload.status ?? null,
        eventName: payload.eventName,
        memberName: payload.memberName,
      });
    } catch {
      setView({ kind: 'error', message: '서버와 통신 중 오류가 발생했습니다.' });
    } finally {
      submittingRef.current = false;
    }
  }, [encodedEvent, router]);

  useEffect(() => {
    if (encodedEvent) void submit();
  }, [encodedEvent, submit]);

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 rounded-[2rem] border border-monolith-outline-variant/20 bg-monolith-surface-lowest p-8 text-center shadow-monolith">
        <span className="font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primary-container">
          Session Check-In
        </span>

        {!encodedEvent && view.kind !== 'success' ? (
          <form
            className="w-full space-y-4 text-left"
            onSubmit={(event) => { event.preventDefault(); void submit(code); }}
          >
            <h1 className="text-center text-2xl font-black text-monolith-on-surface">코드로 출석하기</h1>
            <label htmlFor="check-in-code" className="block text-sm font-semibold text-monolith-on-surface">
              출석 코드
            </label>
            <p id="check-in-code-help" className="text-sm text-monolith-on-surface-muted">
              운영진이 안내한 영문·숫자 6자리 코드를 입력하세요.
            </p>
            <input
              id="check-in-code"
              aria-describedby="check-in-code-help"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, ''))}
              autoCapitalize="characters"
              autoComplete="off"
              autoFocus
              spellCheck={false}
              minLength={6}
              maxLength={6}
              pattern="[A-HJ-NP-Z2-9]{6}"
              required
              disabled={view.kind === 'loading'}
              placeholder="ABC234"
              className="w-full rounded-xl border border-monolith-outline-variant/40 bg-monolith-surface-low px-4 py-3 text-center font-mono text-2xl uppercase tracking-[0.25em] text-monolith-on-surface focus:outline-2 focus:outline-monolith-primary-container"
            />
            <button
              type="submit"
              disabled={view.kind === 'loading' || !/^[A-HJ-NP-Z2-9]{6}$/.test(code)}
              className="interactive-soft w-full rounded-xl bg-monolith-primary-container px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {view.kind === 'loading' ? '출석 처리 중…' : '출석하기'}
            </button>
          </form>
        ) : null}

        {encodedEvent && view.kind === 'loading' ? (
          <div className="flex flex-col items-center gap-3 py-8 text-monolith-on-surface-muted">
            <LoaderCircle className="h-8 w-8 animate-spin" />
            <p className="text-sm">출석을 처리하고 있습니다…</p>
          </div>
        ) : null}

        {view.kind === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div
              className={[
                'flex h-16 w-16 items-center justify-center rounded-full',
                view.status === 'late' ? 'bg-[#fff1cc] text-[#8a5a00]' : 'bg-[#e7f6ec] text-[#1f7a3d]',
              ].join(' ')}
            >
              {view.status === 'late' ? <Clock3 className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-monolith-on-surface">
                {view.alreadyCheckedIn ? '이미 출석 처리되었습니다' : '출석되었습니다'}
              </h1>
              <p className="mt-2 text-sm text-monolith-on-surface-muted">
                {view.status === 'late' ? '지각으로 처리되었습니다.' : '정상 출석 처리되었습니다.'}
              </p>
            </div>
            <dl className="w-full space-y-1 rounded-2xl bg-monolith-surface-low px-4 py-3 text-sm">
              {view.memberName ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-monolith-on-surface-muted">회원</dt>
                  <dd className="font-semibold text-monolith-on-surface">{view.memberName}</dd>
                </div>
              ) : null}
              {view.eventName ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-monolith-on-surface-muted">세션</dt>
                  <dd className="font-semibold text-monolith-on-surface">{view.eventName}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}

        {view.kind === 'error' ? (
          <div role="alert" className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-monolith-error-container text-monolith-error">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-monolith-on-surface">출석하지 못했습니다</h1>
              <p className="mt-2 text-sm text-monolith-on-surface-muted">{view.message}</p>
            </div>
            {encodedEvent ? (
              <button
                type="button"
                onClick={() => void submit()}
                className="interactive-soft inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1b66b3,#0e4a84)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(14,74,132,0.18)] transition hover:brightness-105"
              >
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </button>
            ) : null}
          </div>
        ) : null}

        <Link
          href="/attendance"
          className="text-sm font-semibold text-monolith-primary-container underline-offset-4 hover:underline"
        >
          ← 출석 페이지로
        </Link>
      </div>
    </main>
  );
}
