ALTER TABLE attendance_session
ADD COLUMN IF NOT EXISTS target_affiliation VARCHAR(20);

ALTER TABLE attendance_session
DROP CONSTRAINT IF EXISTS chk_session_target_affiliation;

ALTER TABLE attendance_session
ADD CONSTRAINT chk_session_target_affiliation
CHECK (target_affiliation IS NULL OR target_affiliation IN ('development', 'business'));

COMMENT ON COLUMN attendance_session.target_affiliation IS '심화 세션 대상 파트. 기본/기타 활동은 NULL';

CREATE INDEX IF NOT EXISTS idx_attendance_session_target_affiliation
  ON attendance_session(target_affiliation);
