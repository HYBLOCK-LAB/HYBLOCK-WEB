-- SBT(Soul Bound Token) 발급 기록 테이블 생성
-- 민팅된 SBT의 토큰 정보 저장, 학회원별 SBT 발급 여부 추적, 트랜잭션 감시

-- sbt_issuance 테이블 생성
CREATE TABLE IF NOT EXISTS sbt_issuance (
  -- 기본 정보
  issuance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- 고유 ID
  member_id INTEGER NOT NULL UNIQUE,  -- 멤버 ID - 학회원당 1개만 발급

  -- SBT 토큰 정보
  token_id BIGINT NOT NULL UNIQUE,  -- ERC721 tokenId (고유 식별자)
  contract_address VARCHAR(42) NOT NULL,  -- SBT 스마트 컨트랙트 주소 (0x + 40자)

  -- 트랜잭션 정보
  transaction_hash CHAR(66) NOT NULL UNIQUE,  -- 민팅 트랜잭션 해시 (0x + 64자)

  -- 타임스탬프
  minted_at TIMESTAMP WITH TIME ZONE NOT NULL,  -- 실제 SBT 민팅 시간
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),  -- 기록 생성 시간

  -- Foreign Key 제약 조건: member_id → member
  CONSTRAINT fk_sbt_issuance_member
    FOREIGN KEY (member_id)
    REFERENCES member(id)
    ON DELETE CASCADE
);

-- 인덱스 생성 (성능 최적화)
-- 특정 사용자의 SBT 조회 최적화
CREATE INDEX IF NOT EXISTS idx_sbt_issuance_member
  ON sbt_issuance(member_id);

-- tokenId로 SBT 검증 및 조회 최적화 (고유성 검증)
CREATE INDEX IF NOT EXISTS idx_sbt_issuance_token_id
  ON sbt_issuance(token_id);

-- 컨트랙트 주소별 SBT 그룹화 조회 최적화 (복수 컨트랙트 대비)
CREATE INDEX IF NOT EXISTS idx_sbt_issuance_contract
  ON sbt_issuance(contract_address);

-- 트랜잭션 해시로 SBT 검증 및 조회 최적화
CREATE INDEX IF NOT EXISTS idx_sbt_issuance_tx_hash
  ON sbt_issuance(transaction_hash);

-- 코멘트 추가
COMMENT ON TABLE sbt_issuance IS 'SBT 발급 기록 및 토큰 정보 관리 - 4개 UID를 모두 획득한 학회원의 SBT 민팅 정보 저장';
COMMENT ON COLUMN sbt_issuance.issuance_id IS 'SBT 발급 기록 고유 ID (UUID)';
COMMENT ON COLUMN sbt_issuance.member_id IS '수료증 수령자 멤버 ID - member 테이블 참조';
COMMENT ON COLUMN sbt_issuance.token_id IS 'ERC721 tokenId (고유 식별자) - 스마트 컨트랙트에서 민팅 시 부여되는 고유 번호';
COMMENT ON COLUMN sbt_issuance.contract_address IS 'SBT 스마트 컨트랙트 주소 (0x + 40자 Ethereum 주소)';
COMMENT ON COLUMN sbt_issuance.transaction_hash IS '민팅 트랜잭션 해시 (0x + 64자 hex string) - 블록체인 트랜잭션 추적 및 감시용';
COMMENT ON COLUMN sbt_issuance.minted_at IS '실제 SBT 민팅 시간 (UTC) - 블록체인 트랜잭션 확정 시간';
COMMENT ON COLUMN sbt_issuance.created_at IS '발급 기록 생성 시간 (UTC) - 데이터베이스 기록 저장 시간';
