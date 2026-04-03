-- 학기별 수료 조건 추적 테이블 생성
-- 각 학기별 4가지 수료 조건(출석/외부활동/산출물/참여기간) 달성 여부 추적
-- 2학기 연속 조건 만족 여부 판단의 기준 데이터 제공

-- semester_criteria_tracking 테이블 생성
CREATE TABLE IF NOT EXISTS semester_criteria_tracking (
  -- 기본 정보
  tracking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- 고유 ID
  wallet_address VARCHAR(42) NOT NULL,  -- 지갑 주소 (0x + 40자) - personal_info 참조
  cohort INTEGER NOT NULL,  -- 기수 (session.cohort와 대응)

  -- 수료 조건 타입
  criteria_type VARCHAR(30) NOT NULL,  -- attendance, external_activity, assignment, participation_period

  -- 달성 여부 및 세부 정보
  is_met BOOLEAN NOT NULL DEFAULT false,  -- 해당 학기에 조건 달성 여부
  details JSONB,  -- 세부 정보 (출석 횟수, 지각 횟수, 산출물 개수 등)

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),  -- 생성 시간
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),  -- 수정 시간

  -- Foreign Key 제약 조건: wallet_address → personal_info
  CONSTRAINT fk_semester_criteria_wallet
    FOREIGN KEY (wallet_address)
    REFERENCES personal_info(wallet_address)
    ON DELETE CASCADE,

  -- Unique 제약 조건: 한 학기에 같은 조건 타입은 1개만
  CONSTRAINT uq_semester_criteria_wallet_cohort_type
    UNIQUE (wallet_address, cohort, criteria_type),

  -- Check 제약 조건: criteria_type 유효성
  CONSTRAINT chk_semester_criteria_type
    CHECK (criteria_type IN ('attendance', 'external_activity', 'assignment', 'participation_period'))
);

-- 인덱스 생성 (성능 최적화)
-- 특정 사용자의 학기별 수료 조건 조회 최적화
CREATE INDEX IF NOT EXISTS idx_semester_criteria_wallet
  ON semester_criteria_tracking(wallet_address);

-- 특정 기수의 조건 달성 현황 조회 최적화
CREATE INDEX IF NOT EXISTS idx_semester_criteria_cohort
  ON semester_criteria_tracking(cohort);

-- 특정 조건 타입별 통계 조회 최적화
CREATE INDEX IF NOT EXISTS idx_semester_criteria_type
  ON semester_criteria_tracking(criteria_type);

-- 조건 달성 여부로 필터링 최적화
CREATE INDEX IF NOT EXISTS idx_semester_criteria_is_met
  ON semester_criteria_tracking(is_met);

-- 복합 인덱스: 사용자별 조건 타입 조회 최적화
CREATE INDEX IF NOT EXISTS idx_semester_criteria_wallet_type
  ON semester_criteria_tracking(wallet_address, criteria_type);

-- 복합 인덱스: 사용자별 기수 조회 최적화 (2학기 연속 조건 확인)
CREATE INDEX IF NOT EXISTS idx_semester_criteria_wallet_cohort
  ON semester_criteria_tracking(wallet_address, cohort);

-- 코멘트 추가
COMMENT ON TABLE semester_criteria_tracking IS '학기별 수료 조건 추적 테이블 - 각 학회원의 학기별 4가지 수료 조건(출석/외부활동/산출물/참여기간) 달성 여부 기록';
COMMENT ON COLUMN semester_criteria_tracking.tracking_id IS '추적 기록 고유 ID (UUID)';
COMMENT ON COLUMN semester_criteria_tracking.wallet_address IS '학회원 지갑 주소 (0x + 40자 Ethereum 주소) - personal_info 테이블 참조';
COMMENT ON COLUMN semester_criteria_tracking.cohort IS '기수/학기 (session.cohort와 대응) - 1, 2, 3...';
COMMENT ON COLUMN semester_criteria_tracking.criteria_type IS '수료 조건 타입: attendance (출석), external_activity (외부활동), assignment (산출물), participation_period (참여기간)';
COMMENT ON COLUMN semester_criteria_tracking.is_met IS '해당 학기에 조건 달성 여부: true (달성), false (미달성)';
COMMENT ON COLUMN semester_criteria_tracking.details IS '세부 정보 (JSON 형식) - 출석 횟수, 지각 횟수, 산출물 개수 등 조건 타입별 상세 데이터';
COMMENT ON COLUMN semester_criteria_tracking.created_at IS '데이터 생성 시간 (UTC)';
COMMENT ON COLUMN semester_criteria_tracking.updated_at IS '데이터 수정 시간 (UTC)';
