-- EAS Attestation 기록 테이블 생성
-- 영지식증명(ZK) 기반 자격 증명 및 EAS 통합

-- attestation 테이블 생성
CREATE TABLE IF NOT EXISTS attestation (
  -- 기본 정보
  attestation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- 고유 ID
  wallet_address VARCHAR(42) NOT NULL,  -- 지갑 주소 (0x + 40자) - personal_info 참조
  personal_data_hash CHAR(66) NOT NULL,  -- 개인정보 해시 (0x + 64자)
  revealed_data JSONB,  -- 공개된 데이터 (JSON 형식, NULL 허용)
  is_graduated BOOLEAN NOT NULL,  -- 수료 여부
  eas_uid CHAR(66) NOT NULL UNIQUE,  -- EAS Attestation UID (0x + 64자) - 전역 고유
  attestation_type VARCHAR(50) NOT NULL,  -- Attestation 타입 (attendance, external_activity, assignment, participation_period)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),  -- 생성 시간

  -- Foreign Key 제약 조건: wallet_address → personal_info
  CONSTRAINT fk_attestation_wallet
    FOREIGN KEY (wallet_address)
    REFERENCES personal_info(wallet_address)
    ON DELETE CASCADE,

  -- Check 제약 조건: attestation_type 유효성
  CONSTRAINT chk_attestation_type
    CHECK (attestation_type IN ('attendance', 'external_activity', 'assignment', 'participation_period')),

  -- Unique 제약 조건: 사용자당 각 타입별 1개만 허용
  CONSTRAINT uq_attestation_wallet_type
    UNIQUE (wallet_address, attestation_type)
);

-- 인덱스 생성 (성능 최적화)
-- 특정 사용자의 attestation 조회 최적화 (issuance_request_attestations 조인)
CREATE INDEX IF NOT EXISTS idx_attestation_wallet
  ON attestation(wallet_address);

-- eas_uid로 attestation 검증 및 조회 최적화 (고유성 검증, FK 조인)
CREATE INDEX IF NOT EXISTS idx_attestation_eas_uid
  ON attestation(eas_uid);

-- 특정 타입의 attestation 필터링 최적화
CREATE INDEX IF NOT EXISTS idx_attestation_type
  ON attestation(attestation_type);

-- 복합 인덱스: 사용자별 타입 조회 최적화 (UNIQUE 제약 검증, 복합 쿼리)
CREATE INDEX IF NOT EXISTS idx_attestation_wallet_type
  ON attestation(wallet_address, attestation_type);

-- 코멘트 추가
COMMENT ON TABLE attestation IS 'EAS(Ethereum Attestation Service) 기반 자격 증명 기록 및 영지식증명 데이터 관리';
COMMENT ON COLUMN attestation.attestation_id IS 'Attestation 고유 ID (UUID)';
COMMENT ON COLUMN attestation.wallet_address IS '지갑 주소 (0x + 40자 Ethereum 주소) - personal_info 테이블 참조';
COMMENT ON COLUMN attestation.personal_data_hash IS '개인정보 해시 (0x + 64자 hex string)';
COMMENT ON COLUMN attestation.revealed_data IS '공개된 개인정보 (JSON 형식) - NULL 허용';
COMMENT ON COLUMN attestation.is_graduated IS '수료 여부: true (수료), false (미수료)';
COMMENT ON COLUMN attestation.eas_uid IS 'EAS Attestation UID (0x + 64자 hex string) - 전역적으로 고유';
COMMENT ON COLUMN attestation.attestation_type IS 'Attestation 타입: attendance (출석), external_activity (외부활동), assignment (산출물), participation_period (참여기간)';
COMMENT ON COLUMN attestation.created_at IS 'Attestation 생성 시간 (UTC)';
