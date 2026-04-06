-- 세션 테이블 생성
-- Attendance 시스템 - session 테이블

CREATE TABLE IF NOT EXISTS attendance_session (
  -- 기본 정보
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort INTEGER NOT NULL,
  session_type VARCHAR(25) NOT NULL DEFAULT 'basic',
  title VARCHAR(255) NOT NULL,
  content TEXT,

  -- 세션 시간 정보
  session_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  session_end_time TIMESTAMP WITH TIME ZONE,

  -- 상태 및 타임스탬프
  status VARCHAR(25) NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Check 제약 조건
  CONSTRAINT chk_session_status
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),

  CONSTRAINT chk_session_type
    CHECK (session_type IN ('basic', 'advanced', 'misc', 'external', 'hackathon')),

  CONSTRAINT chk_session_end_after_start
    CHECK (session_end_time IS NULL OR session_end_time > session_start_time)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_attendance_session_cohort
  ON attendance_session(cohort);

CREATE INDEX IF NOT EXISTS idx_attendance_session_start_time
  ON attendance_session(session_start_time);

CREATE INDEX IF NOT EXISTS idx_attendance_session_status
  ON attendance_session(status);

CREATE INDEX IF NOT EXISTS idx_attendance_session_cohort_start_time
  ON attendance_session(cohort, session_start_time);

-- 코멘트 추가
COMMENT ON TABLE attendance_session IS '출석 도메인 세션 정보 저장';
COMMENT ON COLUMN attendance_session.session_id IS '세션 고유 ID';
COMMENT ON COLUMN attendance_session.cohort IS '세션 기수';
COMMENT ON COLUMN attendance_session.session_type IS '세션 타입: basic (기본 세션), advanced (심화 세션), misc (기타 활동), external (외부 활동), hackathon (해커톤)';
COMMENT ON COLUMN attendance_session.title IS '세션 이름';
COMMENT ON COLUMN attendance_session.content IS '세션 설명';
COMMENT ON COLUMN attendance_session.session_start_time IS '세션 시작 시간 (출석 상태 판정 기준)';
COMMENT ON COLUMN attendance_session.session_end_time IS '세션 종료 시간';
COMMENT ON COLUMN attendance_session.status IS '세션 상태: scheduled, in_progress, completed';
COMMENT ON COLUMN attendance_session.created_at IS '세션 생성 시간';
COMMENT ON COLUMN attendance_session.updated_at IS '세션 최근 수정 시간';
