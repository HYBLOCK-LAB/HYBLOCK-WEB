ALTER TABLE recruitment_campaign
ADD COLUMN submission_message TEXT NOT NULL
DEFAULT '제출한 지원서는 수정하거나 다시 제출할 수 없습니다. 결과는 기재한 이메일 또는 전화번호로 안내합니다.'
CHECK (length(submission_message) BETWEEN 1 AND 2000);

CREATE OR REPLACE FUNCTION create_recruitment_campaign(
  p_title TEXT,
  p_cohort INTEGER,
  p_application_open_at TIMESTAMPTZ,
  p_application_close_at TIMESTAMPTZ,
  p_created_by_member_id INTEGER,
  p_submission_message TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_campaign_id UUID;
BEGIN
  INSERT INTO recruitment_campaign (
    title, cohort, application_open_at, application_close_at,
    created_by_member_id, submission_message
  ) VALUES (
    trim(p_title), p_cohort, p_application_open_at, p_application_close_at,
    p_created_by_member_id, trim(p_submission_message)
  ) RETURNING id INTO new_campaign_id;

  INSERT INTO recruitment_track (campaign_id, code, label, sort_order) VALUES
    (new_campaign_id, 'development', '개발팀', 0),
    (new_campaign_id, 'business', '비즈니스팀', 1);
  RETURN new_campaign_id;
END;
$$;

REVOKE ALL ON FUNCTION create_recruitment_campaign(TEXT, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_recruitment_campaign(TEXT, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, TEXT) TO service_role;
