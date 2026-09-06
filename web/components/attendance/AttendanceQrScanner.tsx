'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AlertCircle, Camera, LoaderCircle, ScanLine, Upload, X } from 'lucide-react';

type ScannerState = 'idle' | 'starting' | 'scanning' | 'redirecting' | 'error';

function extractEncodedEvent(value: string): string | null {
  try {
    const url = new URL(value, window.location.origin);
    if (!url.pathname.replace(/\/$/, '').endsWith('/attendance/check-in')) return null;
    const encoded = url.searchParams.get('e');
    return encoded && encoded.trim() ? encoded : null;
  } catch {
    return null;
  }
}

export default function AttendanceQrScanner() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ScannerState>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cancelLoopRef = useRef<(() => void) | null>(null);
  const cameraRef = useRef<{ stop: () => void } | null>(null);
  const handledRef = useRef(false);

  const teardown = useCallback(() => {
    cancelLoopRef.current?.();
    cancelLoopRef.current = null;
    cameraRef.current?.stop();
    cameraRef.current = null;
  }, []);

  const handleDecoded = useCallback(
    (value: string) => {
      if (handledRef.current) return;
      const encoded = extractEncodedEvent(value);
      if (!encoded) {
        setState('error');
        setMessage('HYBLOCK 출석용 QR이 아닙니다. 현장에 표시된 출석 QR을 스캔해 주세요.');
        return;
      }
      handledRef.current = true;
      setState('redirecting');
      setMessage(null);
      teardown();
      router.push(`/attendance/check-in?e=${encodeURIComponent(encoded)}`);
    },
    [router, teardown],
  );

  const startCamera = useCallback(async () => {
    setState('starting');
    setMessage(null);
    handledRef.current = false;

    try {
      const { QRCanvas, frameLoop, rearCamera } = await import('qr/dom.js');
      const video = videoRef.current;
      if (!video) return;

      const canvas = new QRCanvas(overlayRef.current ? { overlay: overlayRef.current } : undefined, {
        cropToSquare: true,
      });
      const camera = await rearCamera(video);
      cameraRef.current = camera;
      setState('scanning');

      cancelLoopRef.current = frameLoop(() => {
        void (async () => {
          if (handledRef.current) return;
          try {
            const decoded = await camera.readFrame(canvas);
            if (typeof decoded === 'string' && decoded) handleDecoded(decoded);
          } catch {
            /* frame miss — keep going */
          }
        })();
      });
    } catch (error) {
      teardown();
      setState('error');
      const name = error instanceof DOMException ? error.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setMessage('카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라를 허용하거나, 아래에서 QR 사진을 올려 주세요.');
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setMessage('사용할 수 있는 카메라를 찾지 못했습니다. QR 사진을 대신 올려 주세요.');
      } else {
        setMessage('카메라를 열 수 없습니다. QR 사진을 대신 올려 주세요.');
      }
    }
  }, [handleDecoded, teardown]);

  const handleFile = useCallback(
    async (file: File) => {
      setState('starting');
      setMessage(null);
      handledRef.current = false;
      try {
        const [{ default: decodeQR }, bitmap] = await Promise.all([
          import('qr/decode.js'),
          createImageBitmap(file),
        ]);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('canvas');
        ctx.drawImage(bitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
        const decoded = decodeQR(imageData, { effort: Infinity, timeLimit: Infinity });
        if (typeof decoded === 'string' && decoded) {
          handleDecoded(decoded);
        } else {
          throw new Error('no-qr');
        }
      } catch {
        setState('error');
        setMessage('이미지에서 QR을 읽지 못했습니다. 더 또렷한 사진으로 다시 시도해 주세요.');
      }
    },
    [handleDecoded],
  );

  const close = useCallback(() => {
    teardown();
    setOpen(false);
    setState('idle');
    setMessage(null);
    handledRef.current = false;
  }, [teardown]);

  useEffect(() => {
    if (open) void startCamera();
    return () => teardown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => teardown(), [teardown]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="interactive-soft inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1b66b3,#0e4a84)] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(14,74,132,0.18)] transition hover:brightness-105"
      >
        <ScanLine className="h-4 w-4" />
        QR 스캔하고 출석
      </button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-[70] flex flex-col bg-[#00121f]">
              <div className="flex items-center justify-between px-5 py-4 text-white">
                <p className="text-sm font-bold uppercase tracking-[0.2em]">출석 QR 스캔</p>
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 transition hover:bg-white/20"
                  aria-label="닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />

                {state !== 'scanning' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#00121f]/80 px-8 text-center text-white">
                    {state === 'starting' ? (
                      <>
                        <LoaderCircle className="h-8 w-8 animate-spin" />
                        <p className="text-sm">카메라를 준비하고 있습니다…</p>
                      </>
                    ) : null}
                    {state === 'redirecting' ? (
                      <>
                        <LoaderCircle className="h-8 w-8 animate-spin" />
                        <p className="text-sm">출석 페이지로 이동합니다…</p>
                      </>
                    ) : null}
                    {state === 'error' ? (
                      <>
                        <AlertCircle className="h-8 w-8 text-monolith-error" />
                        <p className="max-w-xs text-sm leading-6">{message}</p>
                        <button
                          type="button"
                          onClick={() => void startCamera()}
                          className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/25"
                        >
                          <Camera className="h-4 w-4" />
                          카메라 다시 시도
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-10">
                    <p className="rounded-full bg-black/50 px-4 py-2 text-xs font-semibold text-white">
                      QR을 화면 중앙에 맞춰 주세요
                    </p>
                  </div>
                )}
              </div>

              <div className="px-5 py-5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Upload className="h-4 w-4" />
                  QR 사진 올리기
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) void handleFile(file);
                  }}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
