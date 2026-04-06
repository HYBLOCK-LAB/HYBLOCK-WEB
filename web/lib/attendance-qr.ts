export const ATTENDANCE_QR_PREFIX = 'hyblock-attendance:';
export const ATTENDANCE_QR_TTL_SECONDS = 45;

export function buildAttendanceQrPayload(token: string) {
  return `${ATTENDANCE_QR_PREFIX}${token}`;
}

export function parseAttendanceQrPayload(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith(ATTENDANCE_QR_PREFIX)) {
    return trimmed.slice(ATTENDANCE_QR_PREFIX.length);
  }

  return trimmed;
}
