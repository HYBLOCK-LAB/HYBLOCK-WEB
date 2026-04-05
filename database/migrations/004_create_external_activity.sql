-- 외부 활동 참여 기록 테이블 생성
-- 학회원의 외부 활동 증빙 자료 URL 저장 및 참여 관리

CREATE TABLE IF NOT EXISTS external_activity (
  -- 기본 정보
  activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id INTEGER NOT NULL,
  session_id UUID NOT NULL,

  -- 증빙 자료 URL (필수)
  evidence_url TEXT NOT NULL,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Foreign Key 제약 조건: member_id → member
  CONSTRAINT fk_external_activity_member
    FOREIGN KEY (member_id)
    REFERENCES member(id)
    ON DELETE CASCADE,

  -- Foreign Key 제약 조건: session_id → session
  CONSTRAINT fk_external_activity_session
    FOREIGN KEY (session_id)
    REFERENCES attendance_session(session_id)
    ON DELETE CASCADE,

  -- Unique 제약 조건: 한 세션에 같은 사용자 중복 기록 방지
  CONSTRAINT uq_external_activity_session_wallet
    UNIQUE (session_id, member_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_external_activity_member
  ON external_activity(member_id);

CREATE INDEX IF NOT EXISTS idx_external_activity_session
  ON external_activity(session_id);

CREATE INDEX IF NOT EXISTS idx_external_activity_member_session
  ON external_activity(member_id, session_id);

-- 코멘트 추가
COMMENT ON TABLE external_activity IS '학회원의 외부 활동 증빙 자료 URL 저장 및 참여 관리 테이블';
COMMENT ON COLUMN external_activity.activity_id IS '참여 기록 고유 ID (UUID)';
COMMENT ON COLUMN external_activity.member_id IS '참여자 멤버 ID - member 테이블 참조';
COMMENT ON COLUMN external_activity.session_id IS '외부 활동 세션 ID - attendance_session 테이블 참조';
COMMENT ON COLUMN external_activity.evidence_url IS '증빙 자료 URL (노션 링크, 깃허브 링크 등, 예: https://file.notion.so/..., https://github.com/...)';
COMMENT ON COLUMN external_activity.created_at IS '레코드 생성 시간 (UTC)';
COMMENT ON COLUMN external_activity.updated_at IS '레코드 최종 수정 시간 (UTC)';
