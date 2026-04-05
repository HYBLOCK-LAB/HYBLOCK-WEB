-- 출석 테이블 생성
-- Attendance 시스템 - attendance 테이블

CREATE TABLE IF NOT EXISTS attendance_record (
  -- 기본 정보
  attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  member_id INTEGER NOT NULL,

  -- 출석 정보
  attended_at TIMESTAMP WITH TIME ZONE,  -- NULL 허용 (absent 레코드는 출석 시간이 없음)
  status VARCHAR(20) DEFAULT NULL,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Foreign Key 제약 조건
  CONSTRAINT fk_attendance_session
    FOREIGN KEY (session_id)
    REFERENCES attendance_session(session_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_attendance_member
    FOREIGN KEY (member_id)
    REFERENCES member(id)
    ON DELETE CASCADE,

  -- Unique 제약 조건: 한 세션에서 같은 멤버 중복 출석 불가
  CONSTRAINT uq_attendance_session_member
    UNIQUE (session_id, member_id),

  -- Check 제약 조건
  CONSTRAINT chk_attendance_status
    CHECK (status IN ('present', 'late', 'absent'))
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_attendance_member
  ON attendance_record(member_id);

CREATE INDEX IF NOT EXISTS idx_attendance_session
  ON attendance_record(session_id);

CREATE INDEX IF NOT EXISTS idx_attendance_status
  ON attendance_record(status);

CREATE INDEX IF NOT EXISTS idx_attendance_session_member
  ON attendance_record(session_id, member_id);

CREATE INDEX IF NOT EXISTS idx_attendance_session_status
  ON attendance_record(session_id, status);

CREATE INDEX IF NOT EXISTS idx_attendance_attended_at
  ON attendance_record(attended_at);

-- 코멘트 추가
COMMENT ON TABLE attendance_record IS '학생 출석 기록 및 출석 상태 관리';
COMMENT ON COLUMN attendance_record.attendance_id IS '출석 기록 고유 ID';
COMMENT ON COLUMN attendance_record.session_id IS '세션 고유 ID (attendance_session 테이블 참조)';
COMMENT ON COLUMN attendance_record.member_id IS '멤버 고유 ID (member 테이블 참조)';
COMMENT ON COLUMN attendance_record.attended_at IS '실제 출석 시간 (absent 레코드는 NULL)';
COMMENT ON COLUMN attendance_record.status IS '출석 상태: present (정상), late (지각), absent (결석)';
COMMENT ON COLUMN attendance_record.created_at IS '출석 기록 생성 시간';
