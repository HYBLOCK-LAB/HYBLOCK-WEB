ALTER TABLE member
ADD COLUMN IF NOT EXISTS has_assignment BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN member.has_assignment IS '산출물 제출 여부: true면 해당 학기 산출물 요건을 충족한 것으로 본다';
