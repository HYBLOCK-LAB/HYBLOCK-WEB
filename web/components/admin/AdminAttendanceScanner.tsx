'use client';

import { useEffect, useRef, useState } from 'react';
import decodeQR from '@paulmillr/qr/decode.js';
import { AlertCircle, Camera, CheckCircle2, LoaderCircle, ScanQrCode, Upload, X } from 'lucide-react';

type ScanResult = {
  success: boolean;
  alreadyCheckedIn?: boolean;
  memberName?: string;
  eventName?: string;
  status?: 'present' | 'late';
  error?: string;
};

export default function AdminAttendanceScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const processingRef = useRef(false);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [initializingCamera, setInitializingCamera] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const stopCamera = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraEnabled(false);
  };

  const decodeImageSource = async (source: CanvasImageSource) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const width =
      source instanceof HTMLVideoElement
        ? source.videoWidth
        : source instanceof HTMLImageElement
          ? source.naturalWidth
          : source instanceof HTMLCanvasElement
            ? source.width
            : 0;
    const height =
      source instanceof HTMLVideoElement
        ? source.videoHeight
        : source instanceof HTMLImageElement
          ? source.naturalHeight
          : source instanceof HTMLCanvasElement
            ? source.height
            : 0;

    if (!width || !height) return null;

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;

    context.drawImage(source, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    return decodeQR({
      width,
      height,
      data: imageData.data,
    });
  };

  const submitToken = async (rawValue: string) => {
    const token = rawValue.trim();
    if (!token || processingRef.current) return;

    processingRef.current = true;
    setSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/api/attendance/qr-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const payload = (await response.json().catch(() => ({}))) as ScanResult;
      if (!response.ok) {
        throw new Error(payload.error ?? 'QR 검증에 실패했습니다.');
      }

      setResult(payload);
      setScannerOpen(false);
      stopCamera();
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'QR 검증에 실패했습니다.',
      });
    } finally {
      setSubmitting(false);
      processingRef.current = false;
    }
  };

  const startCamera = async () => {
    setInitializingCamera(true);
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      intervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || processingRef.current) {
          return;
        }

        try {
          const qrValue = await decodeImageSource(videoRef.current);
          if (qrValue) {
            await submitToken(qrValue);
          }
        } catch {
          // ignore intermittent detector errors while camera is warming up
        }
      }, 800);

      setCameraEnabled(true);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '카메라를 시작하지 못했습니다.',
      });
      stopCamera();
    } finally {
      setInitializingCamera(false);
    }
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;

    setSubmitting(true);
    setResult(null);

    try {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'));
        image.src = objectUrl;
      });

      const decoded = await decodeImageSource(image);
      URL.revokeObjectURL(objectUrl);

      if (!decoded) {
        throw new Error('업로드한 이미지에서 QR을 찾지 못했습니다.');
      }

      await submitToken(decoded);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '이미지에서 QR을 읽지 못했습니다.',
      });
    } finally {
      setSubmitting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (!scannerOpen) {
      stopCamera();
      return;
    }

    void startCamera();
  }, [scannerOpen]);

  return (
    <div className="rounded-2xl bg-monolith-surfaceLow p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">QR 스캐너</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-monolith-onSurface">운영자 스캔 인증</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setScannerOpen(true);
          }}
          disabled={initializingCamera}
          className="interactive-soft inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1b66b3,#0e4a84)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(14,74,132,0.22)] transition-all hover:brightness-105 disabled:opacity-60"
        >
          {initializingCamera ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          QR 찍기
        </button>
      </div>

      <p className="mt-3 text-sm leading-7 text-monolith-onSurfaceMuted">
        활성 세션에 대해서만 개인 QR을 검증합니다. 카메라로 바로 스캔하거나, 촬영한 QR 이미지를 업로드해 테스트할 수 있습니다.
      </p>

      {result ? (
        <div
          className={[
            'mt-5 rounded-xl px-4 py-3 text-sm font-semibold',
            result.success ? 'bg-monolith-primaryFixed text-monolith-primary' : 'bg-monolith-errorContainer text-monolith-error',
          ].join(' ')}
        >
          <div className="flex items-start gap-2">
            {result.success ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <div>
              {result.success ? (
                <p>
                  {result.memberName} / {result.eventName}
                  {result.alreadyCheckedIn ? ' / 이미 출석 처리됨' : result.status ? ` / ${result.status === 'present' ? '출석' : '지각'}` : ''}
                </p>
              ) : (
                <p>{result.error}</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {scannerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00172d]/55 px-4 py-8 backdrop-blur-[4px]">
          <div className="w-full max-w-3xl rounded-[2rem] border border-monolith-outlineVariant/20 bg-white p-6 shadow-[0_24px_80px_rgba(0,24,46,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">QR 스캐너</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-monolith-onSurface">카메라 스캔</h2>
              </div>
              <button
                type="button"
                onClick={() => setScannerOpen(false)}
                className="interactive-soft inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-monolith-outlineVariant/25 bg-monolith-surfaceLow text-monolith-onSurfaceMuted transition hover:border-monolith-outlineVariant/40 hover:text-monolith-onSurface"
                aria-label="닫기"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-7 text-monolith-onSurfaceMuted">
              개인 QR을 카메라 중앙에 맞추면 자동으로 검증합니다. 카메라가 불안정하면 아래에서 이미지 업로드로도 확인할 수 있습니다.
            </p>

            <div className="mt-5 overflow-hidden rounded-2xl border border-monolith-outlineVariant/20 bg-[#0a2037]">
              <video ref={videoRef} muted playsInline className="aspect-[4/3] w-full object-cover" />
              {!cameraEnabled ? (
                <div className="flex items-center justify-center gap-3 px-6 py-10 text-sm font-semibold text-white/80">
                  {initializingCamera ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ScanQrCode className="h-5 w-5" />}
                  카메라 연결 중입니다.
                </div>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLow p-4 text-left">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-monolith-primaryContainer">대체 테스트</p>
              <p className="mt-2 text-sm leading-7 text-monolith-onSurfaceMuted">
                휴대폰으로 개인 QR을 띄운 뒤 스크린샷을 업로드해도 같은 검증 플로우로 출석을 테스트할 수 있습니다.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void handleImageUpload(event.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="interactive-soft mt-3 inline-flex items-center gap-2 rounded-xl border border-monolith-outlineVariant/25 bg-monolith-surfaceLowest px-4 py-2.5 text-sm font-semibold text-monolith-onSurface transition hover:bg-monolith-surface"
              >
                <Upload className="h-4 w-4" />
                QR 이미지 업로드
              </button>
            </div>

            {submitting ? (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-monolith-surfaceLow px-4 py-3 text-sm font-semibold text-monolith-onSurfaceMuted">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                QR 검증 중...
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
