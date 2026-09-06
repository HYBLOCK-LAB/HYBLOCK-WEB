'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Clock3, Expand, Link2, Users, X } from 'lucide-react';
import { encodeEvent } from '@/lib/utils';

type AdminSessionAttendanceQrProps = {
  eventName: string;
  isActive: boolean;
};

type ParticipantStatus = 'present' | 'late' | 'absent' | 'nonParticipation';

type ParticipantsResponse = {
  participants?: Array<{ memberId: number; name: string; status: ParticipantStatus }>;
};

const COUNT_POLL_INTERVAL_MS = 5000;

export default function AdminSessionAttendanceQr({ eventName, isActive }: AdminSessionAttendanceQrProps) {
  const [origin, setOrigin] = useState('');
  const [participants, setParticipants] = useState<ParticipantsResponse['participants'] | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const checkInUrl = useMemo(() => {
    if (!origin) return '';
    return `${origin}/attendance/check-in?e=${encodeURIComponent(encodeEvent(eventName))}`;
  }, [origin, eventName]);

  const checkedIn = useMemo(
    () =>
      (participants ?? [])
        .filter((participant) => participant.status === 'present' || participant.status === 'late')
        .sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [participants],
  );

  const pollParticipants = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/events?includeParticipants=true&eventName=${encodeURIComponent(eventName)}`,
        { cache: 'no-store' },
      );
      if (!response.ok) return;
      const payload = (await response.json()) as ParticipantsResponse;
      setParticipants(payload.participants ?? []);
    } catch {
      /* keep last known list */
    }
  }, [eventName]);

  useEffect(() => {
    if (!isActive) return;
    void pollParticipants();
    const timer = window.setInterval(() => void pollParticipants(), COUNT_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isActive, pollParticipants]);

  useEffect(() => {
    if (!fullscreen) return;

    const requestWakeLock = async () => {
      try {
        const nav = navigator as Navigator & {
          wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
        };
        wakeLockRef.current = (await nav.wakeLock?.request('screen')) ?? null;
      } catch {
        /* best effort */
      }
    };

    void document.documentElement.requestFullscreen?.().catch(() => {});
    void requestWakeLock();

    return () => {
      void wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
      if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
    };
  }, [fullscreen]);

  if (!isActive) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-monolith-outline-variant/35 bg-monolith-surface-low px-5 py-8 text-sm leading-6 text-monolith-on-surface-muted">
        세션을 활성화하면 참가자용 출석 QR이 표시됩니다.
      </div>
    );
  }

  const countLabel = participants === null ? '집계 중…' : `출석 완료 ${checkedIn.length}명`;

  return (
    <div className="mt-6">
      <div className="rounded-2xl bg-white p-5 shadow-[0_14px_30px_rgba(0,51,97,0.08)]">
        {checkInUrl ? <QRCodeSVG value={checkInUrl} size={240} includeMargin /> : <div className="h-[240px]" />}
      </div>

      <p className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-monolith-primary-container">
        <Users className="h-4 w-4" />
        {countLabel}
      </p>

      <div className="mt-2 flex items-center justify-center gap-2 break-all text-xs text-monolith-on-surface-muted">
        <Link2 className="h-3.5 w-3.5 shrink-0" />
        <span>{checkInUrl}</span>
      </div>

      <div className="mt-4 rounded-2xl border border-monolith-outline-variant/20 bg-monolith-surface-low text-left">
        <div className="flex items-center justify-between border-b border-monolith-outline-variant/20 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-monolith-on-surface-muted">
          <span>출석한 사람</span>
          <span>{checkedIn.length}명</span>
        </div>
        <div className="max-h-56 overflow-y-auto px-4 py-3">
          {participants === null ? (
            <p className="text-sm text-monolith-on-surface-muted">불러오는 중…</p>
          ) : checkedIn.length === 0 ? (
            <p className="text-sm text-monolith-on-surface-muted">아직 출석한 사람이 없습니다.</p>
          ) : (
            <ul className="space-y-1.5">
              {checkedIn.map((participant) => (
                <li key={participant.memberId} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-monolith-on-surface">{participant.name}</span>
                  {participant.status === 'late' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1cc] px-2 py-0.5 text-[11px] font-bold text-[#8a5a00]">
                      <Clock3 className="h-3 w-3" />
                      지각
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#e7f6ec] px-2 py-0.5 text-[11px] font-bold text-[#1f7a3d]">출석</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFullscreen(true)}
        className="interactive-soft mt-4 inline-flex items-center gap-2 rounded-xl border border-monolith-outline-variant/25 bg-monolith-surface-low px-4 py-2.5 text-sm font-semibold text-monolith-on-surface transition hover:bg-monolith-surface"
      >
        <Expand className="h-4 w-4" />
        발표 모드
      </button>

      {fullscreen
        ? createPortal(
            <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-white px-6 py-10">
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="interactive-soft absolute right-6 top-6 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-monolith-outline-variant/25 bg-monolith-surface-low text-monolith-on-surface-muted transition hover:text-monolith-on-surface"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-monolith-primary-container">
                  Session Check-In
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-monolith-on-surface md:text-4xl">
                  {eventName}
                </h2>
              </div>

              <div className="flex w-full max-w-5xl flex-col items-center gap-8 md:flex-row md:items-start md:justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgba(0,24,46,0.18)]">
                    {checkInUrl ? (
                      <QRCodeSVG
                        value={checkInUrl}
                        size={Math.min(420, Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.55))}
                        includeMargin
                      />
                    ) : null}
                  </div>
                  <p className="flex items-center gap-3 text-2xl font-black text-monolith-primary-container">
                    <Users className="h-7 w-7" />
                    {countLabel}
                  </p>
                  <p className="text-sm text-monolith-on-surface-muted">휴대폰 카메라로 QR을 스캔해 직접 출석하세요.</p>
                </div>

                <div className="w-full max-w-xs rounded-2xl border border-monolith-outline-variant/20 bg-monolith-surface-lowest">
                  <div className="border-b border-monolith-outline-variant/20 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-monolith-on-surface-muted">
                    출석한 사람 {checkedIn.length}명
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
                    {checkedIn.length === 0 ? (
                      <p className="text-sm text-monolith-on-surface-muted">아직 없음</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {checkedIn.map((participant) => (
                          <li key={participant.memberId} className="flex items-center justify-between gap-3 text-base">
                            <span className="font-semibold text-monolith-on-surface">{participant.name}</span>
                            {participant.status === 'late' ? (
                              <span className="text-xs font-bold text-[#8a5a00]">지각</span>
                            ) : (
                              <span className="text-xs font-bold text-[#1f7a3d]">출석</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
