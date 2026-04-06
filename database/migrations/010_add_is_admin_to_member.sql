ALTER TABLE member
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN member.is_admin IS '관리자 여부: true (관리자), false (일반 회원)';
