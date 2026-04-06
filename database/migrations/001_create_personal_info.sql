-- 멤버 도메인 테이블 생성
-- 학회원의 기본 정보 및 활동 기간 관리

CREATE TABLE IF NOT EXISTS member (
  -- 기본 정보
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- 내부 증가 식별자
  wallet_address VARCHAR(42) UNIQUE,  -- 지갑 주소 (선택)
  name VARCHAR(100) NOT NULL,  -- 학회원 이름
  major VARCHAR(100) NOT NULL,  -- 전공
  affiliation VARCHAR(30) NOT NULL,  -- 소속 (development, business)
  cohort INTEGER NOT NULL,  -- 기수
  role VARCHAR(30) NOT NULL,  -- 역할 (member, developmentLead, businessLead, president, vicePresident)
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,  -- 활동 시작 날짜
  period_end TIMESTAMP WITH TIME ZONE,  -- 활동 종료 날짜
  is_active BOOLEAN NOT NULL DEFAULT true,  -- 활동 중 여부 (true: 활동, false: 탈퇴)

  -- Check 제약 조건: affiliation 유효성
  CONSTRAINT chk_member_affiliation
    CHECK (affiliation IN ('development', 'business')),

  -- Check 제약 조건: role 유효성
  CONSTRAINT chk_member_role
    CHECK (role IN ('member', 'developmentLead', 'businessLead', 'president', 'vicePresident'))
);

-- 인덱스 생성 (성능 최적화)
-- role별 조회 최적화 (운영진 권한 검증, 역할별 필터링)
CREATE INDEX IF NOT EXISTS idx_member_role
  ON member(role);

-- cohort별 조회 최적화 (기수별 회원 조회, 기수별 데이터 분석)
CREATE INDEX IF NOT EXISTS idx_member_cohort
  ON member(cohort);

-- is_active별 조회 최적화 (활동 중인 회원 필터링, 학기 전환 배치 작업)
CREATE INDEX IF NOT EXISTS idx_member_is_active
  ON member(is_active);

CREATE INDEX IF NOT EXISTS idx_member_wallet_address
  ON member(wallet_address);

-- 코멘트 추가
COMMENT ON TABLE member IS '학회원의 기본 정보 및 활동 기간 관리';
COMMENT ON COLUMN member.id IS '내부 고유 식별자';
COMMENT ON COLUMN member.wallet_address IS '지갑 주소 (0x + 40자 Ethereum 주소) - 선택 입력';
COMMENT ON COLUMN member.name IS '학회원 이름';
COMMENT ON COLUMN member.major IS '전공';
COMMENT ON COLUMN member.affiliation IS '소속: development (개발팀), business (비즈니스팀)';
COMMENT ON COLUMN member.cohort IS '학회 기수';
COMMENT ON COLUMN member.role IS '역할: member (일반), developmentLead (개발 팀장), businessLead (비즈니스 팀장), president (회장), vicePresident (부회장)';
COMMENT ON COLUMN member.period_start IS '학회 활동 시작 날짜';
COMMENT ON COLUMN member.period_end IS '학회 활동 종료 날짜';
COMMENT ON COLUMN member.is_active IS '활동 중 여부: true (활동 중), false (탈퇴함)';
