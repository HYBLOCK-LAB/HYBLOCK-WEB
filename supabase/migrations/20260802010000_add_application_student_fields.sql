ALTER TABLE application
  ADD COLUMN student_id VARCHAR(10),
  ADD COLUMN academic_status VARCHAR(20),
  ADD CONSTRAINT application_student_id_format
    CHECK (student_id IS NULL OR student_id ~ '^[0-9]{10}$'),
  ADD CONSTRAINT application_academic_status_value
    CHECK (academic_status IS NULL OR academic_status IN ('enrolled', 'leave', 'expected_graduation', 'completed', 'graduated'));

CREATE OR REPLACE FUNCTION submit_recruitment_application_v2(
  p_campaign_id UUID,
  p_name TEXT,
  p_birth_year INTEGER,
  p_university TEXT,
  p_major TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_phone_normalized TEXT,
  p_track_id UUID,
  p_idempotency_key UUID,
  p_privacy_consent_version TEXT,
  p_privacy_consent_snapshot TEXT,
  p_answers JSONB,
  p_student_id TEXT,
  p_academic_status TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE application_id UUID;
BEGIN
  IF p_student_id !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Student ID must be 10 digits';
  END IF;
  IF p_academic_status NOT IN ('enrolled', 'leave', 'expected_graduation', 'completed', 'graduated') THEN
    RAISE EXCEPTION 'Invalid academic status';
  END IF;

  application_id := submit_recruitment_application(
    p_campaign_id, p_name, p_birth_year, p_university, p_major,
    p_email, p_phone, p_phone_normalized, p_track_id, p_idempotency_key,
    p_privacy_consent_version, p_privacy_consent_snapshot, p_answers
  );

  UPDATE application
  SET student_id = p_student_id, academic_status = p_academic_status
  WHERE id = application_id;

  RETURN application_id;
END;
$$;

REVOKE ALL ON FUNCTION submit_recruitment_application_v2(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID, TEXT, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_recruitment_application_v2(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID, TEXT, TEXT, JSONB, TEXT, TEXT) TO service_role;
