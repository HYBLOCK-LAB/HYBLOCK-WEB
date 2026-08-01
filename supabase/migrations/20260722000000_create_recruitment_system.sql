CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE recruitment_campaign (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(160) NOT NULL,
  cohort INTEGER NOT NULL CHECK (cohort > 0),
  status VARCHAR(24) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'closed', 'selection_complete', 'archived')),
  application_open_at TIMESTAMPTZ NOT NULL,
  application_close_at TIMESTAMPTZ NOT NULL,
  created_by_member_id INTEGER NOT NULL REFERENCES member(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (application_close_at > application_open_at)
);

CREATE UNIQUE INDEX uq_recruitment_single_open_campaign
  ON recruitment_campaign ((status)) WHERE status = 'open';

CREATE TABLE recruitment_track (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES recruitment_campaign(id) ON DELETE CASCADE,
  code VARCHAR(30) NOT NULL CHECK (code IN ('development', 'business')),
  label VARCHAR(60) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (campaign_id, code),
  UNIQUE (id, campaign_id)
);

CREATE TABLE application_question (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES recruitment_campaign(id) ON DELETE CASCADE,
  question_type VARCHAR(24) NOT NULL
    CHECK (question_type IN ('yes_no', 'single_choice', 'multiple_choice', 'long_text')),
  prompt TEXT NOT NULL CHECK (length(trim(prompt)) > 0),
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  max_score NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (max_score >= 0),
  scoring_mode VARCHAR(12) NOT NULL CHECK (scoring_mode IN ('auto', 'manual')),
  min_length INTEGER CHECK (min_length IS NULL OR min_length >= 0),
  max_length INTEGER CHECK (max_length IS NULL OR max_length > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, campaign_id),
  CHECK (question_type <> 'long_text' OR scoring_mode = 'manual'),
  CHECK (min_length IS NULL OR max_length IS NULL OR min_length <= max_length),
  CHECK (question_type = 'long_text' OR (min_length IS NULL AND max_length IS NULL))
);

CREATE TABLE application_question_option (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES application_question(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (length(trim(label)) > 0),
  value VARCHAR(120) NOT NULL,
  auto_score NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (auto_score >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (question_id, value),
  UNIQUE (id, question_id)
);

CREATE TABLE interview_question (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES recruitment_campaign(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL CHECK (length(trim(prompt)) > 0),
  evaluation_guide TEXT,
  max_score NUMERIC(8,2) NOT NULL CHECK (max_score >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, campaign_id)
);

CREATE TABLE recruitment_evaluator (
  campaign_id UUID NOT NULL REFERENCES recruitment_campaign(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES member(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, member_id)
);

CREATE TABLE application (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES recruitment_campaign(id),
  name VARCHAR(100) NOT NULL,
  birth_year INTEGER NOT NULL CHECK (birth_year BETWEEN 1900 AND 2200),
  university VARCHAR(160) NOT NULL,
  major VARCHAR(160) NOT NULL,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  phone_normalized VARCHAR(30) NOT NULL,
  track_id UUID NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'document_review', 'document_passed', 'document_rejected', 'interview', 'final_passed', 'final_rejected')),
  idempotency_key UUID NOT NULL UNIQUE,
  privacy_consent_at TIMESTAMPTZ NOT NULL,
  privacy_consent_version VARCHAR(40) NOT NULL,
  privacy_consent_snapshot TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  document_score_finalized_at TIMESTAMPTZ,
  interview_score_finalized_at TIMESTAMPTZ,
  FOREIGN KEY (track_id, campaign_id) REFERENCES recruitment_track(id, campaign_id)
);

CREATE TABLE application_answer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES application(id) ON DELETE RESTRICT,
  question_id UUID NOT NULL REFERENCES application_question(id) ON DELETE RESTRICT,
  answer_text TEXT,
  auto_score NUMERIC(8,2) CHECK (auto_score IS NULL OR auto_score >= 0),
  question_snapshot JSONB NOT NULL,
  UNIQUE (application_id, question_id)
);

CREATE TABLE application_answer_option (
  application_answer_id UUID NOT NULL REFERENCES application_answer(id) ON DELETE RESTRICT,
  option_id UUID NOT NULL REFERENCES application_question_option(id) ON DELETE RESTRICT,
  PRIMARY KEY (application_answer_id, option_id)
);

CREATE TABLE application_question_evaluation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES application(id) ON DELETE RESTRICT,
  question_id UUID NOT NULL REFERENCES application_question(id) ON DELETE RESTRICT,
  evaluator_member_id INTEGER NOT NULL REFERENCES member(id),
  score NUMERIC(8,2) NOT NULL CHECK (score >= 0),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (application_id, question_id, evaluator_member_id)
);

CREATE TABLE application_interview_evaluation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES application(id) ON DELETE RESTRICT,
  interview_question_id UUID NOT NULL REFERENCES interview_question(id) ON DELETE RESTRICT,
  evaluator_member_id INTEGER NOT NULL REFERENCES member(id),
  score NUMERIC(8,2) NOT NULL CHECK (score >= 0),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (application_id, interview_question_id, evaluator_member_id)
);

CREATE TABLE application_evaluation_completion (
  application_id UUID NOT NULL REFERENCES application(id) ON DELETE RESTRICT,
  evaluator_member_id INTEGER NOT NULL REFERENCES member(id),
  document_completed_at TIMESTAMPTZ,
  interview_completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (application_id, evaluator_member_id)
);

CREATE TABLE application_status_history (
  id BIGSERIAL PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES application(id) ON DELETE RESTRICT,
  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,
  changed_by_member_id INTEGER NOT NULL REFERENCES member(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_application_campaign_status ON application(campaign_id, status);
CREATE INDEX idx_application_campaign_submitted ON application(campaign_id, submitted_at DESC);
CREATE INDEX idx_application_name ON application(name);
CREATE INDEX idx_application_track ON application(track_id);
CREATE INDEX idx_question_campaign_order ON application_question(campaign_id, sort_order);
CREATE INDEX idx_interview_question_campaign_order ON interview_question(campaign_id, sort_order);

CREATE OR REPLACE FUNCTION recruitment_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_campaign_updated_at BEFORE UPDATE ON recruitment_campaign
FOR EACH ROW EXECUTE FUNCTION recruitment_touch_updated_at();
CREATE TRIGGER trg_application_question_updated_at BEFORE UPDATE ON application_question
FOR EACH ROW EXECUTE FUNCTION recruitment_touch_updated_at();
CREATE TRIGGER trg_interview_question_updated_at BEFORE UPDATE ON interview_question
FOR EACH ROW EXECUTE FUNCTION recruitment_touch_updated_at();
CREATE TRIGGER trg_question_evaluation_updated_at BEFORE UPDATE ON application_question_evaluation
FOR EACH ROW EXECUTE FUNCTION recruitment_touch_updated_at();
CREATE TRIGGER trg_interview_evaluation_updated_at BEFORE UPDATE ON application_interview_evaluation
FOR EACH ROW EXECUTE FUNCTION recruitment_touch_updated_at();

CREATE OR REPLACE FUNCTION recruitment_require_draft_campaign()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE campaign_status VARCHAR(24);
BEGIN
  SELECT status INTO campaign_status FROM recruitment_campaign
  WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);
  IF campaign_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Recruitment form can only be changed while campaign is draft';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_track_draft_lock BEFORE INSERT OR UPDATE OR DELETE ON recruitment_track
FOR EACH ROW EXECUTE FUNCTION recruitment_require_draft_campaign();
CREATE TRIGGER trg_question_draft_lock BEFORE INSERT OR UPDATE OR DELETE ON application_question
FOR EACH ROW EXECUTE FUNCTION recruitment_require_draft_campaign();
CREATE TRIGGER trg_interview_question_draft_lock BEFORE INSERT OR UPDATE OR DELETE ON interview_question
FOR EACH ROW EXECUTE FUNCTION recruitment_require_draft_campaign();

CREATE OR REPLACE FUNCTION recruitment_require_option_draft_campaign()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE campaign_status VARCHAR(24);
BEGIN
  SELECT campaign.status INTO campaign_status
  FROM application_question question
  JOIN recruitment_campaign campaign ON campaign.id = question.campaign_id
  WHERE question.id = COALESCE(NEW.question_id, OLD.question_id);
  IF campaign_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Recruitment form can only be changed while campaign is draft';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_question_option_draft_lock
BEFORE INSERT OR UPDATE OR DELETE ON application_question_option
FOR EACH ROW EXECUTE FUNCTION recruitment_require_option_draft_campaign();

CREATE OR REPLACE FUNCTION recruitment_validate_application_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE campaign_row recruitment_campaign%ROWTYPE;
BEGIN
  SELECT * INTO campaign_row FROM recruitment_campaign WHERE id = NEW.campaign_id;
  IF campaign_row.status <> 'open'
     OR now() < campaign_row.application_open_at
     OR now() > campaign_row.application_close_at THEN
    RAISE EXCEPTION 'Applications are not currently being accepted';
  END IF;
  IF NEW.submitted_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'Submitted application timestamps must match';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_application_insert BEFORE INSERT ON application
FOR EACH ROW EXECUTE FUNCTION recruitment_validate_application_insert();

CREATE OR REPLACE FUNCTION recruitment_lock_application_identity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.campaign_id IS DISTINCT FROM OLD.campaign_id
     OR NEW.name IS DISTINCT FROM OLD.name
     OR NEW.birth_year IS DISTINCT FROM OLD.birth_year
     OR NEW.university IS DISTINCT FROM OLD.university
     OR NEW.major IS DISTINCT FROM OLD.major
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.phone IS DISTINCT FROM OLD.phone
     OR NEW.phone_normalized IS DISTINCT FROM OLD.phone_normalized
     OR NEW.track_id IS DISTINCT FROM OLD.track_id
     OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
     OR NEW.privacy_consent_at IS DISTINCT FROM OLD.privacy_consent_at
     OR NEW.privacy_consent_version IS DISTINCT FROM OLD.privacy_consent_version
     OR NEW.privacy_consent_snapshot IS DISTINCT FROM OLD.privacy_consent_snapshot
     OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Submitted application cannot be edited';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lock_application_identity BEFORE UPDATE ON application
FOR EACH ROW EXECUTE FUNCTION recruitment_lock_application_identity();

CREATE OR REPLACE FUNCTION recruitment_lock_submitted_child()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'Submitted application answers cannot be edited';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lock_application_answer
BEFORE UPDATE OR DELETE ON application_answer
FOR EACH ROW EXECUTE FUNCTION recruitment_lock_submitted_child();
CREATE TRIGGER trg_lock_application_answer_option
BEFORE UPDATE OR DELETE ON application_answer_option
FOR EACH ROW EXECUTE FUNCTION recruitment_lock_submitted_child();

CREATE OR REPLACE FUNCTION recruitment_validate_answer()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE application_campaign UUID;
DECLARE question_campaign UUID;
BEGIN
  SELECT campaign_id INTO application_campaign FROM application WHERE id = NEW.application_id;
  SELECT campaign_id INTO question_campaign FROM application_question WHERE id = NEW.question_id;
  IF application_campaign IS DISTINCT FROM question_campaign THEN
    RAISE EXCEPTION 'Application and question must belong to the same campaign';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_application_answer BEFORE INSERT ON application_answer
FOR EACH ROW EXECUTE FUNCTION recruitment_validate_answer();

CREATE OR REPLACE FUNCTION recruitment_validate_answer_option()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE answer_question UUID;
DECLARE option_question UUID;
BEGIN
  SELECT question_id INTO answer_question FROM application_answer WHERE id = NEW.application_answer_id;
  SELECT question_id INTO option_question FROM application_question_option WHERE id = NEW.option_id;
  IF answer_question IS DISTINCT FROM option_question THEN
    RAISE EXCEPTION 'Selected option does not belong to the answered question';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_application_answer_option BEFORE INSERT ON application_answer_option
FOR EACH ROW EXECUTE FUNCTION recruitment_validate_answer_option();

CREATE OR REPLACE FUNCTION recruitment_lock_finalized_evaluation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE finalized_at TIMESTAMPTZ;
BEGIN
  IF TG_TABLE_NAME = 'application_question_evaluation' THEN
    SELECT document_score_finalized_at INTO finalized_at FROM application
    WHERE id = COALESCE(NEW.application_id, OLD.application_id);
  ELSE
    SELECT interview_score_finalized_at INTO finalized_at FROM application
    WHERE id = COALESCE(NEW.application_id, OLD.application_id);
  END IF;
  IF finalized_at IS NOT NULL THEN
    RAISE EXCEPTION 'Finalized evaluation cannot be changed';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_lock_final_document_evaluation
BEFORE INSERT OR UPDATE OR DELETE ON application_question_evaluation
FOR EACH ROW EXECUTE FUNCTION recruitment_lock_finalized_evaluation();
CREATE TRIGGER trg_lock_final_interview_evaluation
BEFORE INSERT OR UPDATE OR DELETE ON application_interview_evaluation
FOR EACH ROW EXECUTE FUNCTION recruitment_lock_finalized_evaluation();

CREATE OR REPLACE FUNCTION recruitment_validate_evaluation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE application_campaign UUID;
DECLARE item_campaign UUID;
DECLARE item_max_score NUMERIC(8,2);
BEGIN
  SELECT campaign_id INTO application_campaign FROM application WHERE id = NEW.application_id;
  IF NOT EXISTS (
    SELECT 1 FROM recruitment_evaluator
    WHERE campaign_id = application_campaign AND member_id = NEW.evaluator_member_id
  ) THEN
    RAISE EXCEPTION 'Member is not an evaluator for this campaign';
  END IF;

  IF TG_TABLE_NAME = 'application_question_evaluation' THEN
    SELECT campaign_id, max_score INTO item_campaign, item_max_score
    FROM application_question WHERE id = NEW.question_id;
  ELSE
    SELECT campaign_id, max_score INTO item_campaign, item_max_score
    FROM interview_question WHERE id = NEW.interview_question_id;
  END IF;

  IF application_campaign IS DISTINCT FROM item_campaign THEN
    RAISE EXCEPTION 'Evaluation item and application must belong to the same campaign';
  END IF;
  IF NEW.score > item_max_score THEN
    RAISE EXCEPTION 'Evaluation score exceeds the maximum score';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_document_evaluation
BEFORE INSERT OR UPDATE ON application_question_evaluation
FOR EACH ROW EXECUTE FUNCTION recruitment_validate_evaluation();
CREATE TRIGGER trg_validate_interview_evaluation
BEFORE INSERT OR UPDATE ON application_interview_evaluation
FOR EACH ROW EXECUTE FUNCTION recruitment_validate_evaluation();

ALTER TABLE recruitment_campaign ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_track ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_question ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_question_option ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_question ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_evaluator ENABLE ROW LEVEL SECURITY;
ALTER TABLE application ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_answer ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_answer_option ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_question_evaluation ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_interview_evaluation ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_evaluation_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION submit_recruitment_application(
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
  p_answers JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_application_id UUID;
DECLARE question_row application_question%ROWTYPE;
DECLARE answer JSONB;
DECLARE answer_id UUID;
DECLARE selected_option UUID;
DECLARE computed_auto_score NUMERIC(8,2);
DECLARE selected_count INTEGER;
BEGIN
  IF jsonb_typeof(p_answers) <> 'array' THEN
    RAISE EXCEPTION 'Answers must be an array';
  END IF;

  INSERT INTO application (
    campaign_id, name, birth_year, university, major, email, phone,
    phone_normalized, track_id, idempotency_key, privacy_consent_at,
    privacy_consent_version, privacy_consent_snapshot
  ) VALUES (
    p_campaign_id, trim(p_name), p_birth_year, trim(p_university), trim(p_major),
    lower(trim(p_email)), trim(p_phone), p_phone_normalized, p_track_id,
    p_idempotency_key, now(), p_privacy_consent_version, p_privacy_consent_snapshot
  ) RETURNING id INTO new_application_id;

  FOR question_row IN
    SELECT * FROM application_question WHERE campaign_id = p_campaign_id ORDER BY sort_order, id
  LOOP
    SELECT value INTO answer
    FROM jsonb_array_elements(p_answers) value
    WHERE value->>'questionId' = question_row.id::TEXT
    LIMIT 1;

    IF answer IS NULL THEN
      IF question_row.is_required THEN
        RAISE EXCEPTION 'Required question is unanswered: %', question_row.id;
      END IF;
      CONTINUE;
    END IF;

    IF question_row.question_type = 'long_text' THEN
      IF question_row.is_required AND length(trim(COALESCE(answer->>'text', ''))) = 0 THEN
        RAISE EXCEPTION 'Required question is unanswered: %', question_row.id;
      END IF;
      IF question_row.min_length IS NOT NULL AND length(COALESCE(answer->>'text', '')) < question_row.min_length THEN
        RAISE EXCEPTION 'Answer is shorter than the minimum length';
      END IF;
      IF question_row.max_length IS NOT NULL AND length(COALESCE(answer->>'text', '')) > question_row.max_length THEN
        RAISE EXCEPTION 'Answer exceeds the maximum length';
      END IF;
      computed_auto_score := NULL;
    ELSE
      IF jsonb_typeof(answer->'optionIds') <> 'array' THEN
        RAISE EXCEPTION 'Objective answer options must be an array';
      END IF;
      selected_count := jsonb_array_length(answer->'optionIds');
      IF question_row.is_required AND selected_count = 0 THEN
        RAISE EXCEPTION 'Required question is unanswered: %', question_row.id;
      END IF;
      IF question_row.question_type IN ('yes_no', 'single_choice') AND selected_count > 1 THEN
        RAISE EXCEPTION 'Only one option may be selected';
      END IF;
      SELECT LEAST(question_row.max_score, COALESCE(sum(option.auto_score), 0))
      INTO computed_auto_score
      FROM application_question_option option
      WHERE option.question_id = question_row.id
        AND option.id IN (SELECT jsonb_array_elements_text(answer->'optionIds')::UUID);
      IF (
        SELECT count(*) FROM application_question_option option
        WHERE option.question_id = question_row.id
          AND option.id IN (SELECT jsonb_array_elements_text(answer->'optionIds')::UUID)
      ) <> selected_count THEN
        RAISE EXCEPTION 'Invalid option selected';
      END IF;
      IF question_row.scoring_mode = 'manual' THEN
        computed_auto_score := NULL;
      END IF;
    END IF;

    INSERT INTO application_answer (
      application_id, question_id, answer_text, auto_score, question_snapshot
    ) VALUES (
      new_application_id, question_row.id, NULLIF(answer->>'text', ''), computed_auto_score,
      jsonb_build_object(
        'prompt', question_row.prompt,
        'description', question_row.description,
        'questionType', question_row.question_type,
        'maxScore', question_row.max_score,
        'scoringMode', question_row.scoring_mode
      )
    ) RETURNING id INTO answer_id;

    IF question_row.question_type <> 'long_text' THEN
      FOR selected_option IN SELECT jsonb_array_elements_text(answer->'optionIds')::UUID
      LOOP
        INSERT INTO application_answer_option (application_answer_id, option_id)
        VALUES (answer_id, selected_option);
      END LOOP;
    END IF;
    answer := NULL;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_answers) supplied
    WHERE NOT EXISTS (
      SELECT 1 FROM application_question question
      WHERE question.id::TEXT = supplied->>'questionId' AND question.campaign_id = p_campaign_id
    )
  ) THEN
    RAISE EXCEPTION 'Unknown question supplied';
  END IF;

  RETURN new_application_id;
EXCEPTION WHEN unique_violation THEN
  SELECT id INTO new_application_id FROM application WHERE idempotency_key = p_idempotency_key;
  IF new_application_id IS NOT NULL THEN RETURN new_application_id; END IF;
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION submit_recruitment_application(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_recruitment_application(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID, TEXT, TEXT, JSONB) TO service_role;

CREATE OR REPLACE FUNCTION create_recruitment_campaign(
  p_title TEXT,
  p_cohort INTEGER,
  p_application_open_at TIMESTAMPTZ,
  p_application_close_at TIMESTAMPTZ,
  p_created_by_member_id INTEGER
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_campaign_id UUID;
BEGIN
  INSERT INTO recruitment_campaign (
    title, cohort, application_open_at, application_close_at, created_by_member_id
  ) VALUES (
    trim(p_title), p_cohort, p_application_open_at, p_application_close_at, p_created_by_member_id
  ) RETURNING id INTO new_campaign_id;

  INSERT INTO recruitment_track (campaign_id, code, label, sort_order) VALUES
    (new_campaign_id, 'development', '개발팀', 0),
    (new_campaign_id, 'business', '비즈니스팀', 1);
  RETURN new_campaign_id;
END;
$$;

REVOKE ALL ON FUNCTION create_recruitment_campaign(TEXT, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_recruitment_campaign(TEXT, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION recruitment_lock_completed_evaluator()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE completion_at TIMESTAMPTZ;
BEGIN
  IF TG_TABLE_NAME = 'application_question_evaluation' THEN
    SELECT document_completed_at INTO completion_at
    FROM application_evaluation_completion
    WHERE application_id = COALESCE(NEW.application_id, OLD.application_id)
      AND evaluator_member_id = COALESCE(NEW.evaluator_member_id, OLD.evaluator_member_id);
  ELSE
    SELECT interview_completed_at INTO completion_at
    FROM application_evaluation_completion
    WHERE application_id = COALESCE(NEW.application_id, OLD.application_id)
      AND evaluator_member_id = COALESCE(NEW.evaluator_member_id, OLD.evaluator_member_id);
  END IF;
  IF completion_at IS NOT NULL THEN
    RAISE EXCEPTION 'Completed evaluation cannot be changed';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_lock_completed_document_evaluator
BEFORE INSERT OR UPDATE OR DELETE ON application_question_evaluation
FOR EACH ROW EXECUTE FUNCTION recruitment_lock_completed_evaluator();
CREATE TRIGGER trg_lock_completed_interview_evaluator
BEFORE INSERT OR UPDATE OR DELETE ON application_interview_evaluation
FOR EACH ROW EXECUTE FUNCTION recruitment_lock_completed_evaluator();

CREATE OR REPLACE FUNCTION save_recruitment_evaluation(
  p_application_id UUID,
  p_evaluator_member_id INTEGER,
  p_kind TEXT,
  p_items JSONB,
  p_finalize BOOLEAN DEFAULT false
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE campaign UUID;
DECLARE item JSONB;
DECLARE required_count INTEGER;
DECLARE completed_count INTEGER;
BEGIN
  IF p_kind NOT IN ('document', 'interview') OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'Invalid evaluation payload';
  END IF;
  SELECT campaign_id INTO campaign FROM application WHERE id = p_application_id;
  IF campaign IS NULL OR NOT EXISTS (
    SELECT 1 FROM recruitment_evaluator WHERE campaign_id = campaign AND member_id = p_evaluator_member_id
  ) THEN RAISE EXCEPTION 'Member is not an evaluator for this campaign'; END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_items) value LOOP
    IF p_kind = 'document' THEN
      INSERT INTO application_question_evaluation (application_id, question_id, evaluator_member_id, score, comment)
      VALUES (p_application_id, (item->>'itemId')::UUID, p_evaluator_member_id, (item->>'score')::NUMERIC, NULLIF(trim(item->>'comment'), ''))
      ON CONFLICT (application_id, question_id, evaluator_member_id)
      DO UPDATE SET score = EXCLUDED.score, comment = EXCLUDED.comment;
    ELSE
      INSERT INTO application_interview_evaluation (application_id, interview_question_id, evaluator_member_id, score, comment)
      VALUES (p_application_id, (item->>'itemId')::UUID, p_evaluator_member_id, (item->>'score')::NUMERIC, NULLIF(trim(item->>'comment'), ''))
      ON CONFLICT (application_id, interview_question_id, evaluator_member_id)
      DO UPDATE SET score = EXCLUDED.score, comment = EXCLUDED.comment;
    END IF;
  END LOOP;

  IF p_finalize THEN
    IF p_kind = 'document' THEN
      SELECT count(*) INTO required_count FROM application_question
      WHERE campaign_id = campaign AND scoring_mode = 'manual';
      SELECT count(*) INTO completed_count FROM application_question_evaluation evaluation
      JOIN application_question question ON question.id = evaluation.question_id
      WHERE evaluation.application_id = p_application_id
        AND evaluation.evaluator_member_id = p_evaluator_member_id
        AND question.campaign_id = campaign AND question.scoring_mode = 'manual';
      IF completed_count <> required_count THEN RAISE EXCEPTION 'All document questions must be scored'; END IF;
      INSERT INTO application_evaluation_completion (application_id, evaluator_member_id, document_completed_at)
      VALUES (p_application_id, p_evaluator_member_id, now())
      ON CONFLICT (application_id, evaluator_member_id) DO UPDATE
      SET document_completed_at = COALESCE(application_evaluation_completion.document_completed_at, now());
      IF NOT EXISTS (
        SELECT 1 FROM recruitment_evaluator evaluator
        WHERE evaluator.campaign_id = campaign AND NOT EXISTS (
          SELECT 1 FROM application_evaluation_completion completion
          WHERE completion.application_id = p_application_id
            AND completion.evaluator_member_id = evaluator.member_id
            AND completion.document_completed_at IS NOT NULL
        )
      ) THEN UPDATE application SET document_score_finalized_at = COALESCE(document_score_finalized_at, now()) WHERE id = p_application_id; END IF;
    ELSE
      SELECT count(*) INTO required_count FROM interview_question WHERE campaign_id = campaign AND is_active = true;
      SELECT count(*) INTO completed_count FROM application_interview_evaluation evaluation
      JOIN interview_question question ON question.id = evaluation.interview_question_id
      WHERE evaluation.application_id = p_application_id
        AND evaluation.evaluator_member_id = p_evaluator_member_id
        AND question.campaign_id = campaign AND question.is_active = true;
      IF completed_count <> required_count THEN RAISE EXCEPTION 'All interview questions must be scored'; END IF;
      INSERT INTO application_evaluation_completion (application_id, evaluator_member_id, interview_completed_at)
      VALUES (p_application_id, p_evaluator_member_id, now())
      ON CONFLICT (application_id, evaluator_member_id) DO UPDATE
      SET interview_completed_at = COALESCE(application_evaluation_completion.interview_completed_at, now());
      IF NOT EXISTS (
        SELECT 1 FROM recruitment_evaluator evaluator
        WHERE evaluator.campaign_id = campaign AND NOT EXISTS (
          SELECT 1 FROM application_evaluation_completion completion
          WHERE completion.application_id = p_application_id
            AND completion.evaluator_member_id = evaluator.member_id
            AND completion.interview_completed_at IS NOT NULL
        )
      ) THEN UPDATE application SET interview_score_finalized_at = COALESCE(interview_score_finalized_at, now()) WHERE id = p_application_id; END IF;
    END IF;
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION save_recruitment_evaluation(UUID, INTEGER, TEXT, JSONB, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION save_recruitment_evaluation(UUID, INTEGER, TEXT, JSONB, BOOLEAN) TO service_role;

CREATE OR REPLACE FUNCTION bulk_update_application_status(
  p_application_ids UUID[],
  p_to_status TEXT,
  p_changed_by_member_id INTEGER,
  p_note TEXT DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE updated_count INTEGER;
BEGIN
  IF p_to_status NOT IN (
    'submitted', 'document_review', 'document_passed', 'document_rejected',
    'interview', 'final_passed', 'final_rejected'
  ) THEN RAISE EXCEPTION 'Invalid application status'; END IF;
  IF cardinality(p_application_ids) < 1 OR cardinality(p_application_ids) > 200 THEN
    RAISE EXCEPTION 'Between 1 and 200 applications must be selected';
  END IF;
  IF (SELECT count(DISTINCT value) FROM unnest(p_application_ids) value) <> cardinality(p_application_ids)
     OR (SELECT count(*) FROM application WHERE id = ANY(p_application_ids)) <> cardinality(p_application_ids) THEN
    RAISE EXCEPTION 'Applications must exist and may only be selected once';
  END IF;

  WITH targets AS (
    SELECT id, status FROM application
    WHERE id = ANY(p_application_ids) AND status IS DISTINCT FROM p_to_status
    FOR UPDATE
  ), history AS (
    INSERT INTO application_status_history (
      application_id, from_status, to_status, changed_by_member_id, note
    ) SELECT id, status, p_to_status, p_changed_by_member_id, NULLIF(trim(p_note), '')
      FROM targets
    RETURNING application_id
  )
  UPDATE application SET status = p_to_status
  WHERE id IN (SELECT application_id FROM history);
  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RETURN updated_count;
END;
$$;

REVOKE ALL ON FUNCTION bulk_update_application_status(UUID[], TEXT, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION bulk_update_application_status(UUID[], TEXT, INTEGER, TEXT) TO service_role;
