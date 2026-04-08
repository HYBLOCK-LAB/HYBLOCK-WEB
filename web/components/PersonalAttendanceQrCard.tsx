'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { AlertCircle, CheckCircle2, LoaderCircle, QrCode } from 'lucide-react';
import { getBrowserSupabase, isBrowserSupabaseConfigured } from '@/lib/auth/supabase-browser';
import { useWalletSessionStore } from '@/lib/auth/wallet-session-store';

type QrTokenResponse = {
  token: string;
  qrValue: string;
  expiresAt: string;
  eventName: string;
  memberName: string;
  alreadyCheckedIn?: boolean;
  attendanceStatus?: 'present' | 'late' | 'absent' | null;
};

function formatTimeLeft(expiresAt: string | null) {
  if (!expiresAt) return null;

  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return '00:00';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export default function PersonalAttendanceQrCard({
  selectedEventName,
  activeEventName,
  activeEventNames,
  requireWalletSession = false,
}: {
  selectedEventName?: string | null;
  activeEventName?: string | null;
  activeEventNames?: string[];
  requireWalletSession?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [fetchingToken, setFetchingToken] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<QrTokenResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'late' | 'absent' | null>(null);

  const canUseSupabase = isBrowserSupabaseConfigured();
  const walletSessionConnected = useWalletSessionStore((state) => state.isConnected);
  const resolvedActiveEventNames = useMemo(
    () => activeEventNames ?? (activeEventName ? [activeEventName] : []),
    [activeEventName, activeEventNames],
  );
  const targetEventName = selectedEventName ?? resolvedActiveEventNames[0] ?? null;
  const requiresSessionMatch = Boolean(selectedEventName);
  const isSelectedEventActive = requiresSessionMatch
    ? Boolean(selectedEventName && resolvedActiveEventNames.includes(selectedEventName))
    : resolvedActiveEventNames.length > 0;

  const refreshToken = async () => {
    if (!isSelectedEventActive) {
      setPayload(null);
      setTimeLeft(null);
      setAlreadyCheckedIn(false);
      setAttendanceStatus(null);
      setError('참여가능한 세션이 현재 활성 상태일 때만 개인 QR이 발급됩니다.');
      setLoading(false);
      return;
    }

    const supabase = getBrowserSupabase();
    setFetchingToken(true);
    setError(null);
    const hasWalletSession = useWalletSessionStore.getState().isConnected;

    if (requireWalletSession && !hasWalletSession) {
      setPayload(null);
      setTimeLeft(null);
      setAlreadyCheckedIn(false);
      setAttendanceStatus(null);
      setError('마이페이지에서 개인 QR을 사용하려면 먼저 지갑 로그인을 완료하세요.');
      setLoading(false);
      setFetchingToken(false);
      return;
    }

    try {
      let accessToken: string | null = null;

      if (supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        accessToken = session?.access_token ?? null;
      }

      setIsLoggedIn(Boolean(hasWalletSession || accessToken));

      const response = await fetch('/api/attendance/qr-token', {
        method: 'POST',
        headers: {
          ...(accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(targetEventName ? { eventName: targetEventName } : {}),
      });

      const result = (await response.json().catch(() => ({}))) as Partial<QrTokenResponse> & { error?: string };
      if (response.ok && result.alreadyCheckedIn && result.eventName && result.memberName) {
        setPayload(null);
        setTimeLeft(null);
        setAlreadyCheckedIn(true);
        setAttendanceStatus(result.attendanceStatus ?? 'present');
        setError(null);
        return;
      }

      if (!response.ok || !result.token || !result.qrValue || !result.expiresAt || !result.eventName || !result.memberName) {
        throw new Error(result.error ?? '개인 QR을 발급하지 못했습니다.');
      }

      setPayload({
        token: result.token,
        qrValue: result.qrValue,
        expiresAt: result.expiresAt,
        eventName: result.eventName,
        memberName: result.memberName,
      });
      setAlreadyCheckedIn(false);
      setAttendanceStatus(null);
      setError(null);
    } catch (fetchError) {
      setPayload(null);
      setAlreadyCheckedIn(false);
      setAttendanceStatus(null);
      setIsLoggedIn(hasWalletSession);
      setError(fetchError instanceof Error ? fetchError.message : '개인 QR을 발급하지 못했습니다.');
    } finally {
      setFetchingToken(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const supabase = getBrowserSupabase();
    setPayload(null);
    setTimeLeft(null);
    setAlreadyCheckedIn(false);
    setAttendanceStatus(null);
    setLoading(true);
    setError(null);
    setIsLoggedIn(false);
    void refreshToken();

    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const loggedIn = Boolean(session?.access_token);
      const hasWalletSession = useWalletSessionStore.getState().isConnected;
      setIsLoggedIn(loggedIn);

        if (!loggedIn) {
          if (hasWalletSession) {
            void refreshToken();
            return;
        }

        setPayload(null);
        setTimeLeft(null);
        setAlreadyCheckedIn(false);
        setAttendanceStatus(null);
        setError(requireWalletSession ? '지갑 로그인이 필요합니다.' : '로그인한 사용자만 개인 QR을 발급할 수 있습니다.');
        return;
      }

      void refreshToken();
    });

    return () => subscription.unsubscribe();
  }, [requireWalletSession, selectedEventName, activeEventName, resolvedActiveEventNames]);

  useEffect(() => {
    if (!walletSessionConnected || !isSelectedEventActive) {
      return;
    }

    void refreshToken();
  }, [walletSessionConnected, isSelectedEventActive]);

  useEffect(() => {
    if (!payload?.expiresAt) {
      setTimeLeft(null);
      return;
    }

    setTimeLeft(formatTimeLeft(payload.expiresAt));

    const timer = window.setInterval(() => {
      const nextValue = formatTimeLeft(payload.expiresAt);
      setTimeLeft(nextValue);

      if (nextValue === '00:00') {
        void refreshToken();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [payload?.expiresAt]);

  const helperText = useMemo(() => {
    if (alreadyCheckedIn) {
      return attendanceStatus === 'late'
        ? '이미 지각으로 출석 처리되었습니다.'
        : '이미 출석 처리되었습니다.';
    }

    if (requireWalletSession) {
      return walletSessionConnected
        ? '개인용 QR을 발급합니다. QR은 45초 후 자동 갱신됩니다.'
        : '마이페이지 출석 QR은 지갑 로그인 후 사용할 수 있습니다.';
    }

    if (walletSessionConnected) {
      return '개인용 QR을 발급합니다. QR은 45초 후 자동 갱신됩니다.';
    }

    if (!canUseSupabase) {
      return '지갑 로그인 또는 Supabase 로그인이 필요합니다.';
    }

    if (!isLoggedIn) {
      return '개인 QR은 로그인한 사용자만 발급할 수 있습니다.';
    }

    return '개인용 QR을 발급합니다. QR은 45초 후 자동 갱신됩니다.';
  }, [alreadyCheckedIn, attendanceStatus, canUseSupabase, isLoggedIn, requireWalletSession, walletSessionConnected]);

  return (
    <div className="rounded-2xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLowest p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">
            Personal QR
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-monolith-onSurface">내 출석 QR</h2>
          {targetEventName ? <p className="mt-2 text-sm text-monolith-onSurfaceMuted">{targetEventName}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => void refreshToken()}
          disabled={fetchingToken || alreadyCheckedIn || !isSelectedEventActive || (!isLoggedIn && !canUseSupabase && !walletSessionConnected)}
          className="interactive-soft inline-flex items-center gap-2 rounded-xl border border-monolith-outlineVariant/25 bg-monolith-surfaceLow px-4 py-2 text-sm font-semibold text-monolith-onSurface transition hover:bg-monolith-surface"
        >
          {fetchingToken ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
          새로고침
        </button>
      </div>

      {!alreadyCheckedIn && helperText ? (
        <p className="mt-4 text-sm leading-7 text-monolith-onSurfaceMuted">{helperText}</p>
      ) : null}

      {error ? (
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-monolith-errorContainer px-4 py-3 text-sm font-semibold text-monolith-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 flex items-center justify-center rounded-2xl bg-monolith-surfaceLow py-16 text-sm text-monolith-onSurfaceMuted">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          개인 QR 준비 중
        </div>
      ) : alreadyCheckedIn ? (
        <div className="mt-6 rounded-2xl bg-[#e7f6ec] p-6 text-center text-[#1f7a3d] shadow-[0_14px_30px_rgba(31,122,61,0.08)]">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </div>
          <p className="mt-4 text-xl font-black">출석되었습니다</p>
          <p className="mt-2 text-sm font-semibold opacity-90">
            {attendanceStatus === 'late' ? '지각으로 처리되었습니다.' : '운영진 스캔 또는 수동 코드로 이미 출석이 완료되었습니다.'}
          </p>
        </div>
      ) : payload ? (
        <div className="mt-6 rounded-2xl bg-white p-5 text-center shadow-[0_14px_30px_rgba(0,51,97,0.08)]">
          <div className="flex justify-center">
            <QRCodeSVG value={payload.qrValue} size={220} includeMargin />
          </div>
          <p className="mt-5 text-lg font-bold text-monolith-onSurface">{payload.memberName}</p>
          <p className="mt-1 text-sm text-monolith-onSurfaceMuted">{payload.eventName}</p>
          <p className="mt-3 font-mono text-sm text-monolith-primaryContainer">{timeLeft ?? '00:00'}</p>
        </div>
      ) : !error ? (
        <div className="mt-6 rounded-2xl border border-dashed border-monolith-outlineVariant/35 bg-monolith-surfaceLow p-6 text-sm leading-7 text-monolith-onSurfaceMuted">
          {requireWalletSession || walletSessionConnected || isLoggedIn ? (
            '현재 조건에서 발급 가능한 활성 출석 QR이 없습니다. 출석이 시작되었는지와 연결된 회원 상태를 확인하세요.'
          ) : (
            <>
              로그인 상태를 확인한 뒤 QR을 발급합니다.
              <div className="mt-4">
                <Link href="/login" className="font-semibold text-monolith-primaryContainer transition hover:text-monolith-primary">
                  로그인하러 가기
                </Link>
              </div>
            </>
          )}
        </div>
      ) : null
      }
    </div>
  );
}
