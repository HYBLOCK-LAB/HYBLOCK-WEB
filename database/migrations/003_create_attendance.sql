-- 출석 테이블 생성
-- Attendance 시스템 - attendance 테이블

-- attendance 테이블 생성
CREATE TABLE IF NOT EXISTS attendance (
  -- 기본 정보
  attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  wallet_address VARCHAR(42) NOT NULL,
  name VARCHAR(100) NOT NULL,
  student_id VARCHAR(30) NOT NULL,

  -- 출석 정보
  attended_at TIMESTAMP WITH TIME ZONE,  -- NULL 허용 (absent 레코드는 출석 시간이 없음)
  status VARCHAR(20) DEFAULT NULL,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Foreign Key 제약 조건
  CONSTRAINT fk_attendance_session
    FOREIGN KEY (session_id)
    REFERENCES session(session_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_attendance_wallet
    FOREIGN KEY (wallet_address)
    REFERENCES personal_info(wallet_address)
    ON DELETE CASCADE,

  -- Unique 제약 조건: 한 세션에서 같은 지갑 주소로 중복 출석 불가
  CONSTRAINT uq_attendance_session_wallet
    UNIQUE (session_id, wallet_address),

  -- Check 제약 조건
  CONSTRAINT chk_attendance_status
    CHECK (status IN ('present', 'late', 'absent'))
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_attendance_wallet
  ON attendance(wallet_address);

CREATE INDEX IF NOT EXISTS idx_attendance_session
  ON attendance(session_id);

CREATE INDEX IF NOT EXISTS idx_attendance_status
  ON attendance(status);

CREATE INDEX IF NOT EXISTS idx_attendance_session_wallet
  ON attendance(session_id, wallet_address);

CREATE INDEX IF NOT EXISTS idx_attendance_session_status
  ON attendance(session_id, status);

CREATE INDEX IF NOT EXISTS idx_attendance_attended_at
  ON attendance(attended_at);

-- 코멘트 추가
COMMENT ON TABLE attendance IS '학생 출석 기록 및 출석 상태 관리';
COMMENT ON COLUMN attendance.attendance_id IS '출석 기록 고유 ID';
COMMENT ON COLUMN attendance.session_id IS '세션 고유 ID (session 테이블 참조)';
COMMENT ON COLUMN attendance.wallet_address IS '학생 지갑 주소 (0x + 40자)';
COMMENT ON COLUMN attendance.name IS '학생 이름';
COMMENT ON COLUMN attendance.student_id IS '학번 또는 학생 ID';
COMMENT ON COLUMN attendance.attended_at IS '실제 출석 시간 (absent 레코드는 NULL)';
COMMENT ON COLUMN attendance.status IS '출석 상태: present (정상), late (지각), absent (결석)';
COMMENT ON COLUMN attendance.created_at IS '출석 기록 생성 시간';
