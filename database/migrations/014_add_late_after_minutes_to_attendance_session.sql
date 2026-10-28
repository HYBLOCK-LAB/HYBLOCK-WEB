-- Existing sessions retain their original 10-minute grace period.
ALTER TABLE attendance_session
ADD COLUMN IF NOT EXISTS late_after_minutes INTEGER NOT NULL DEFAULT 10;

ALTER TABLE attendance_session
DROP CONSTRAINT IF EXISTS chk_session_late_after_minutes;

ALTER TABLE attendance_session
ADD CONSTRAINT chk_session_late_after_minutes
CHECK (late_after_minutes BETWEEN 0 AND 180);

COMMENT ON COLUMN attendance_session.late_after_minutes IS
'세션 시작 후 정상 출석으로 인정하는 시간(분). 경계 시각까지 출석, 초과 시 지각. 기본 10분';
