ALTER TABLE attendance_session
ADD COLUMN IF NOT EXISTS check_in_code VARCHAR(32);

COMMENT ON COLUMN attendance_session.check_in_code IS '세션 활성화 시 생성되는 출석 확인 코드';
