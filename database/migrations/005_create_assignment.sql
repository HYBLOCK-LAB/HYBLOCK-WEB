-- 학기별 수료 조건 달성 기록 테이블 생성
-- 학회원의 학기별 최소 산출물 기여 현황 추적 및 검증
-- 개발팀: 스터디 또는 프로젝트 1개
-- 비즈니스팀: 리서치 2개 이상
-- 한 번에 하나씩 증빙 자료 제출 가능 (제출 수 = DB 행 수)

CREATE TABLE IF NOT EXISTS assignment (
  -- 기본 정보
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id INTEGER NOT NULL,
  session_id UUID NOT NULL,

  -- 소속 정보 (제출 당시 팀. 학기마다 변경 가능)
  affiliation VARCHAR(50) NOT NULL,

  -- 과제명 (스터디, 프로젝트, 리서치 등 산출물의 구체적인 제목)
  assignment_title VARCHAR(255) NOT NULL,

  -- 증빙 자료 URL (필수, 한 번에 하나씩 가능)
  evidence_url TEXT NOT NULL,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Foreign Key 제약 조건: member_id → member
  CONSTRAINT fk_assignment_member
    FOREIGN KEY (member_id)
    REFERENCES member(id)
    ON DELETE CASCADE,

  -- Foreign Key 제약 조건: session_id → session
  CONSTRAINT fk_assignment_session
    FOREIGN KEY (session_id)
    REFERENCES attendance_session(session_id)
    ON DELETE CASCADE,

  -- Unique 제약 조건: 같은 사용자가 같은 세션에서 같은 증빙 자료 중복 등록 방지
  CONSTRAINT uq_assignment_evidence
    UNIQUE (member_id, session_id, evidence_url)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_assignment_member
  ON assignment(member_id);

CREATE INDEX IF NOT EXISTS idx_assignment_session
  ON assignment(session_id);

CREATE INDEX IF NOT EXISTS idx_assignment_affiliation
  ON assignment(affiliation);

CREATE INDEX IF NOT EXISTS idx_assignment_title
  ON assignment(assignment_title);

CREATE INDEX IF NOT EXISTS idx_assignment_member_session
  ON assignment(member_id, session_id);

-- 코멘트 추가
COMMENT ON TABLE assignment IS '학기별 수료 조건 달성 기록 테이블 (학회원의 스터디/프로젝트/리서치 참여 현황 추적)';
COMMENT ON COLUMN assignment.assignment_id IS '과제 기록 고유 ID (UUID)';
COMMENT ON COLUMN assignment.member_id IS '참여자 멤버 ID - member 테이블 참조';
COMMENT ON COLUMN assignment.session_id IS '학기 세션 ID - attendance_session 테이블 참조';
COMMENT ON COLUMN assignment.affiliation IS '참여자 소속 (개발팀, 비즈니스팀 등)';
COMMENT ON COLUMN assignment.assignment_title IS '과제명 (스터디, 프로젝트, 리서치 등 산출물의 구체적인 제목)';
COMMENT ON COLUMN assignment.evidence_url IS '증빙 자료 URL (노션 링크 또는 깃허브 링크 등, 예: https://www.notion.so/..., https://github.com/...)';
COMMENT ON COLUMN assignment.created_at IS '레코드 생성 시간 (UTC)';
COMMENT ON COLUMN assignment.updated_at IS '레코드 최종 수정 시간 (UTC)';
