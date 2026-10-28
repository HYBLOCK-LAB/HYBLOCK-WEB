export const DEFAULT_LATE_AFTER_MINUTES = 10;
export const MAX_LATE_AFTER_MINUTES = 180;

export function isValidLateAfterMinutes(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_LATE_AFTER_MINUTES;
}

export function calculateAttendanceStatus(sessionStartTime: string, attendedAt: Date, lateAfterMinutes = DEFAULT_LATE_AFTER_MINUTES) {
  const boundary = new Date(sessionStartTime).getTime() + lateAfterMinutes * 60_000;
  return attendedAt.getTime() <= boundary ? 'present' as const : 'late' as const;
}
