-- 공지사항 테이블 생성
-- 공지 메타데이터, 본문, 첨부 이미지(S3 URL 배열) 저장

CREATE TABLE IF NOT EXISTS notice (
  -- 기본 정보
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  content TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_notice_category
  ON notice(category);

CREATE INDEX IF NOT EXISTS idx_notice_date
  ON notice(date DESC);

CREATE INDEX IF NOT EXISTS idx_notice_category_date
  ON notice(category, date DESC);

-- 코멘트 추가
COMMENT ON TABLE notice IS '공지사항 메타데이터 및 본문, 첨부 이미지 URL 목록 저장 테이블';
COMMENT ON COLUMN notice.id IS '공지사항 고유 ID (순차 증가)';
COMMENT ON COLUMN notice.category IS '공지 카테고리';
COMMENT ON COLUMN notice.title IS '공지 제목';
COMMENT ON COLUMN notice.author IS '작성자명';
COMMENT ON COLUMN notice.date IS '공지 게시일';
COMMENT ON COLUMN notice.content IS '공지 본문';
COMMENT ON COLUMN notice.images IS '첨부 이미지 S3 URL 목록';
COMMENT ON COLUMN notice.created_at IS '레코드 생성 시간 (UTC)';
COMMENT ON COLUMN notice.updated_at IS '레코드 최종 수정 시간 (UTC)';
