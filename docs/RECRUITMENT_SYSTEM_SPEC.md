# HYBLOCK 지원·평가 시스템 명세

## 1. 문서 목적

이 문서는 HYBLOCK 신입 회원 모집에서 다음 업무를 하나의 웹 흐름으로 제공하기 위한 구현 명세다.

- 관리자의 모집 기수 및 지원서·면접 평가 문항 구성
- 로그인한 지원자의 지원서 작성 및 1회 제출
- 여러 관리자의 지원서 문항별 채점과 면접 평가
- 전체 지원자 목록, 점수 집계, 지원 상태 관리

구현 에이전트는 이 문서를 기능 요구사항의 기준으로 사용하고, UI를 만들거나 수정할 때 저장소 루트의 [`DESIGN.md`](../DESIGN.md)를 함께 준수한다. 현재 프로젝트의 Next.js App Router, Supabase, 관리자 인증 구조를 유지하며 별도 ORM이나 새로운 인증 체계를 도입하지 않는다.

## 2. 확정된 정책

### 2.1 사용자와 권한

- 지원자는 기존 웹사이트의 Supabase Auth Google 로그인을 완료한 뒤 지원서를 작성한다.
- 지원자에게는 지갑 연결이나 `member` 등록을 요구하지 않는다. 로그인 callback과 route guard는 `/apply` 접근 시 회원 가입·지갑 연동 흐름으로 강제 이동시키지 않아야 한다.
- 지원자는 아직 HYBLOCK `member`가 아닐 수 있으므로 지원자 식별자는 `auth.users.id` UUID를 기준으로 한다.
- 지원자 개인정보와 지원 내용은 본인 및 관리자만 조회할 수 있다.
- 관리자 기능은 기존 지갑 서버 세션과 `member.is_admin = true` 검사를 그대로 사용한다.
- 관리자 목록·상세·평가 API는 반드시 서버에서 `requireAdminPageAccess` 또는 `requireAdminApiAccess`와 동등한 검사를 수행한다. 클라이언트 가드만으로 보호하지 않는다.
- “전체 지원자 목록”은 관리자 전용 화면이다. 공개 사용자에게 지원자 명단이나 점수를 노출하지 않는다.

### 2.2 지원서 제출

- 지원자는 모집 기수별로 지원서를 최대 한 번 제출할 수 있다.
- 서버 임시 저장은 제공하지 않는다.
- 제출 전에는 현재 브라우저 화면에서 답변을 자유롭게 수정할 수 있다.
- 제출 후에는 지원자와 관리자 모두 지원서 원문을 수정할 수 없다.
- 오제출을 이유로 관리자가 제출을 취소하거나 재제출 기회를 부여하는 기능도 제공하지 않는다.
- 제출 시점의 질문 문구, 선택지, 배점 정책을 보존해야 한다.
- 제출은 모집 상태가 `open`이고 현재 시각이 접수 기간 안에 있을 때만 가능하다.
- 중복 클릭이나 재시도로 두 건이 생성되지 않도록 DB unique constraint와 idempotent 처리 둘 다 적용한다.
- 동일인의 다른 이메일 계정 사용이나 전화번호 중복은 1차 범위에서 탐지·차단하지 않는다.

### 2.3 모집 기수

각 모집 기수는 독립적으로 관리한다.

| 상태 | 의미 | 지원자 제출 | 문항 수정 |
| --- | --- | --- | --- |
| `draft` | 관리자 구성 중 | 불가 | 가능 |
| `open` | 지원 접수 중 | 가능 | 불가 |
| `closed` | 접수 마감 | 불가 | 불가 |
| `results_published` | 결과 공개 | 불가 | 불가 |
| `archived` | 운영 종료 및 보관 | 불가 | 불가 |

- `draft`에서 `open`으로 전환하기 전에 필수 개인정보 항목, 지원서 문항, 면접 문항, 접수 시작·종료 시각을 검증한다.
- 한 번 `open`이 된 모집의 질문과 배점은 잠근다.
- 문항을 변경해야 하면 기존 모집을 복제하여 새 모집 기수를 만든다.
- 접수 종료 시각이 지나면 서버는 상태 값과 무관하게 제출을 거절한다. 관리 화면에는 마감 상태로 표시한다.
- 동시에 `open` 상태인 모집은 전체 시스템에서 하나만 허용한다. 상태 전환 API의 transaction과 DB 제약 또는 advisory lock으로 경쟁 상태까지 차단한다.

### 2.4 지원 상태

지원서의 상태는 다음 값을 사용한다.

```text
submitted
  ├─ document_review
  ├─ document_passed
  ├─ document_rejected
  ├─ interview
  ├─ final_passed
  └─ final_rejected
```

- 최초 제출 상태는 `submitted`다.
- 상태 변경은 관리자만 가능하다.
- 상태 변경 이력을 별도 테이블에 기록한다.
- 지원자는 본인의 현재 상태만 볼 수 있다.
- `results_published` 이전에는 `final_passed`와 `final_rejected`를 지원자 화면에 노출하지 않는다. 그 전에는 “심사 중”으로 표시한다.

## 3. 문항과 채점 규칙

### 3.1 지원서 문항 유형

지원서 질문은 다음 세 유형을 지원한다.

| 유형 | 값 | 답변 형식 |
| --- | --- | --- |
| Yes/No | `yes_no` | `yes` 또는 `no` 단일 선택 |
| 객관식 | `single_choice` | 관리자가 만든 선택지 중 하나 |
| 복수 선택 | `multiple_choice` | 관리자가 만든 선택지 중 하나 이상 |
| 주관식 | `long_text` | 여러 줄 텍스트 |

공통 설정:

- 질문 문구
- 안내 문구(선택)
- 필수 여부
- 노출 순서
- 최대 배점
- 채점 방식 `auto` 또는 `manual`
- 최소·최대 글자 수(주관식에서 선택 설정)

유형별 제약:

- `long_text`는 `manual` 채점만 허용한다.
- `yes_no`, `single_choice`, `multiple_choice`는 관리자가 `auto` 또는 `manual`을 선택할 수 있다.
- `auto` 문항은 각 선택지에 `0..최대 배점` 범위의 점수를 지정한다.
- auto 복수 선택 문항의 점수는 선택한 선택지 점수의 합으로 계산하되 문항의 최대 배점을 초과할 수 없다. 오답 선택에 대한 음수 점수나 감점은 적용하지 않는다.
- 복수 선택 문항에는 최소·최대 선택 개수 설정을 두지 않는다. 필수 문항은 하나 이상, 선택 문항은 0개 이상 선택할 수 있다.
- `manual` 문항은 각 관리자가 `0..최대 배점` 범위에서 직접 채점하고 코멘트를 남길 수 있다.
- 자동 채점 결과는 제출 당시 문항 스냅샷의 선택지 점수를 기준으로 계산한다.
- 주관식 글자 수는 trim 이후 Unicode 문자 수를 기준으로 서버에서 다시 검증한다.

### 3.2 면접 평가 문항

면접 문항은 지원자에게 노출하거나 답변받는 문항이 아니라 관리자 평가 양식이다.

- 문항 문구
- 평가 기준/가이드(선택)
- 최대 배점
- 노출 순서
- 활성 여부

각 관리자는 지원자별·면접 문항별로 점수와 선택 코멘트를 입력할 수 있다. 점수는 필수이고 코멘트는 선택이다. 평가 완료 전에는 본인이 작성한 평가를 수정할 수 있으며, 다른 관리자의 평가는 본인 평가 전에도 읽을 수 있다. 수정 시각과 작성자를 표시한다.

- 모집에 지정된 모든 평가자는 해당 모집의 모든 지원자를 평가한다. 지원자별 담당 평가자 배정은 제공하지 않는다.
- 면접 평가 입력 가능 여부를 지원 상태로 제한하지 않는다. 운영진이 실제 면접 대상자를 상태와 필터를 이용해 관리한다.
- 모집이 `open`인 접수 기간에도 제출된 지원자의 지원서·면접 평가를 시작할 수 있다.

### 3.3 점수 집계

지원서 점수는 다음처럼 계산한다.

```text
지원서 자동 점수 = 모든 auto 지원서 문항 점수의 합
지원서 수동 점수 = 모든 관리자가 입력한 manual 문항 점수의 합
지원서 총점 = 지원서 자동 점수 + 지원서 수동 점수
```

면접 점수는 다음처럼 계산한다.

```text
면접 총점 = 모든 관리자가 입력한 모든 면접 문항 점수의 합
```

- 관리자 수로 나누어 평균을 내지 않는다.
- 미평가 항목은 점수 계산에서 `0`으로 간주하지 않고 “미평가”로 별도 표시한다.
- 화면에는 평가 중인 부분 합계와 함께 `완료 평가 수 / 예상 평가 수`를 표시한다.
- 예상 평가 수는 활성 관리자 수가 아니라 실제 해당 모집의 평가자로 지정된 관리자 수를 기준으로 한다.
- 지정된 모든 평가자가 모든 필수 지원서 수동 문항 평가를 완료해야 지원서 총점을 “확정”한다.
- 지정된 모든 평가자가 모든 활성 면접 문항 평가를 완료해야 면접 총점을 “확정”한다.
- 미완료 상태의 합계는 `잠정 점수`로 명확히 표시하며 합격 판정용 확정 점수로 취급하지 않는다.
- 동점 처리나 합격 자동 판정은 하지 않는다. 합격 상태는 관리자가 결정한다.
- 관리자별 평가 합산 방식은 확정 정책이다. 향후 평균 방식이 필요하면 데이터는 유지하고 집계 로직만 교체할 수 있게 원점수를 보존한다.

## 4. 개인정보 입력 항목

지원 시 다음 정보를 받는다.

- 이름
- 출생연도
- 대학교
- 학과/전공
- 이메일
- 전화번호
- 지원 파트

세부 규칙:

- 나이와 생년월일은 저장하지 않고 4자리 출생연도만 저장·표시한다.
- 이메일은 로그인 계정 이메일을 기본값으로 채우되 제출 시 지원서 스냅샷에 저장한다.
- 전화번호는 표시용 원본과 검색/중복 확인용 정규화 값을 구분한다.
- 지원 파트 선택지는 모집 기수 설정에서 관리한다. 초기 기본값은 `development`, `business`다.
- 지원 파트는 1차 범위에서 개발팀(`development`)과 비즈니스팀(`business`)만 허용한다.
- 지원자는 제출 전에 개인정보 수집·이용 동의문을 확인하고 필수 체크박스에 동의해야 한다.
- 제출 데이터에는 동의 시각, 동의문 버전, 동의문 스냅샷을 보존한다.
- 개인정보는 관리자 목록에서 필요한 최소 정보만 표시하고 상세 페이지에서 전체 정보를 제공한다.
- 로그와 오류 메시지에 지원서 본문, 전화번호, 출생연도를 출력하지 않는다.

## 5. 권장 데이터 모델

새 SQL은 `database/migrations`에 순차 migration으로 추가한다. 아래 이름은 권장안이며 기존 스키마와 충돌하지 않는 범위에서 그대로 사용한다.

### 5.1 `recruitment_campaign`

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | UUID PK | 모집 ID |
| `title` | VARCHAR | 예: HYBLOCK 8기 모집 |
| `cohort` | INTEGER | 기수 |
| `status` | VARCHAR | 모집 상태 enum/check |
| `application_open_at` | TIMESTAMPTZ | 접수 시작 |
| `application_close_at` | TIMESTAMPTZ | 접수 종료 |
| `result_publish_at` | TIMESTAMPTZ nullable | 결과 공개 예정 시각 |
| `created_by_member_id` | INTEGER FK | 생성 관리자 |
| `created_at` | TIMESTAMPTZ | 생성 시각 |
| `updated_at` | TIMESTAMPTZ | 수정 시각 |

### 5.2 `recruitment_track`

- `id`, `campaign_id`, `code`, `label`, `sort_order`, `is_active`
- `(campaign_id, code)` unique

### 5.3 `application_question`

- `id`, `campaign_id`
- `question_type`: `yes_no | single_choice | multiple_choice | long_text`
- `prompt`, `description`
- `is_required`, `sort_order`
- `max_score`
- `scoring_mode`: `auto | manual`
- `min_length`, `max_length`: 주관식 글자 수 제한, nullable
- `created_at`, `updated_at`

### 5.4 `application_question_option`

- `id`, `question_id`, `label`, `value`, `auto_score`, `sort_order`
- `(question_id, value)` unique
- `auto_score`는 auto 문항에서만 사용한다.

### 5.5 `interview_question`

- `id`, `campaign_id`, `prompt`, `evaluation_guide`
- `max_score`, `sort_order`, `is_active`
- `created_at`, `updated_at`

### 5.6 `recruitment_evaluator`

- `campaign_id`, `member_id`, `created_at`
- 복합 PK `(campaign_id, member_id)`
- `member.is_admin = true`인 사용자만 지정할 수 있게 API에서 검증한다.

### 5.7 `application`

- `id` UUID PK
- `campaign_id` FK
- `applicant_user_id` UUID: Supabase `auth.users.id`
- `name`, `birth_year`, `university`, `major`
- `email`, `phone`, `phone_normalized`
- `track_id` FK
- `status`
- `submitted_at`
- `privacy_consent_at`, `privacy_consent_version`, `privacy_consent_snapshot`
- `created_at`
- unique `(campaign_id, applicant_user_id)`

`application`은 제출 완료 데이터만 저장한다. 서버 임시 저장 레코드는 만들지 않는다.

### 5.8 `application_answer`

- `id`, `application_id`, `question_id`
- `answer_text` nullable
- `auto_score` nullable
- `question_snapshot` JSONB
- unique `(application_id, question_id)`

`question_snapshot`에는 최소한 질문 문구, 유형, 필수 여부, 최대 배점, 채점 방식, 선택지 문구·값·점수를 저장한다.

### 5.9 `application_answer_option`

- `application_answer_id`, `option_id`
- 복합 PK `(application_answer_id, option_id)`
- 단일 선택과 Yes/No는 답변당 1개, 복수 선택은 1개 이상 연결할 수 있다.
- 선택지가 해당 답변 질문에 속하는지는 제출 transaction에서 검증한다.

### 5.10 `application_question_evaluation`

- `id`, `application_id`, `question_id`, `evaluator_member_id`
- `score`, `comment`
- `created_at`, `updated_at`
- unique `(application_id, question_id, evaluator_member_id)`
- manual 지원서 문항에만 생성할 수 있다.

### 5.11 `application_interview_evaluation`

- `id`, `application_id`, `interview_question_id`, `evaluator_member_id`
- `score`, `comment`
- `created_at`, `updated_at`
- unique `(application_id, interview_question_id, evaluator_member_id)`

### 5.12 `application_evaluation_completion`

- `application_id`, `evaluator_member_id`
- `document_completed_at` nullable
- `interview_completed_at` nullable
- `updated_at`
- 복합 PK `(application_id, evaluator_member_id)`
- 완료 처리 시 서버가 해당 평가자의 필수 평가 점수 누락 여부를 다시 검증한다.
- 평가 완료 전에는 저장된 점수와 코멘트를 수정할 수 있다.
- 전체 점수가 확정된 뒤에는 어떤 관리자도 해당 지원서/면접 평가를 수정할 수 없다. UI뿐 아니라 API와 DB/RPC에서도 거절한다.

### 5.13 `application_status_history`

- `id`, `application_id`
- `from_status`, `to_status`
- `changed_by_member_id`
- `note` nullable
- `created_at`

### 5.12 무결성 원칙

- 배점은 음수일 수 없고 입력 점수는 문항 최대 배점을 초과할 수 없다.
- 관리자 평가 점수는 필수이고 평가 코멘트는 선택이다.
- 다른 모집 기수의 질문·선택지·트랙을 지원서에 연결할 수 없다.
- auto 문항에는 관리자 수동 평가를 생성할 수 없다.
- evaluator로 지정되지 않은 관리자는 평가를 작성할 수 없지만 관리자 권한이 있으면 읽기는 가능하다.
- `single_choice`와 `yes_no` 답변은 선택지 1개만, `multiple_choice` 답변은 중복 없는 여러 선택지를 허용한다.
- 주관식 답변은 문항의 최소·최대 글자 수를 만족해야 한다.
- 제출된 지원서 삭제는 기본 UI에서 제공하지 않는다. 개인정보 삭제 요청은 별도의 운영 절차로 처리한다.
- 집계 점수는 원본 평가에서 계산한다. 캐시 컬럼을 추가하더라도 원본을 진실 공급원으로 유지한다.

## 6. RLS와 서버 데이터 접근

- 모든 신규 recruitment 테이블에 RLS를 활성화한다.
- 브라우저에서 service role key를 사용하지 않는다.
- 지원자용 읽기/제출은 Route Handler에서 Supabase access token을 검증한 뒤 서버 client로 처리하는 방식을 우선한다.
- 지원자는 열린 모집 정보와 질문을 읽을 수 있지만 정답 점수(`auto_score`)와 면접 평가 문항은 볼 수 없다.
- 지원자는 본인의 제출 데이터와 공개 가능한 상태만 읽을 수 있다.
- 지원자에게는 최종적으로 합격/불합격 상태만 공개하며 지원서 점수, 면접 점수, 관리자 코멘트는 공개하지 않는다.
- 관리자는 서버의 지갑 세션 및 `member.is_admin` 검사를 통과해야 한다.
- 서버 전용 `SUPABASE_SERVICE_ROLE_KEY`를 사용하더라도 API별 소유권·관리자 검사를 생략하지 않는다.
- 지원서 제출은 DB transaction 또는 단일 RPC 함수로 application과 answers를 원자적으로 생성한다.

## 7. 화면 및 라우트

### 7.1 지원자 화면

#### `/apply`

- 현재 `open` 모집이 없으면 모집 준비/마감 안내를 보여준다.
- 로그인하지 않은 사용자는 로그인 CTA와 원래 경로 redirect를 제공한다.
- 이미 제출한 사용자는 새 폼 대신 제출 완료 요약과 현재 공개 가능한 상태를 보여준다.
- 개인정보 입력 → 지원서 문항 → 제출 확인의 명확한 흐름을 제공한다.
- 제출 직전 확인 화면에서 “제출 후 수정할 수 없음”을 명시하고 최종 동의를 받는다.
- 제출 직전 개인정보 수집·이용 동의문과 필수 동의 체크박스를 제공한다.
- 필수 문항, 글자 수, 선택지 유효성은 클라이언트와 서버에서 모두 검증한다.
- 브라우저 새로고침 후 복구되는 임시 저장은 범위에 포함하지 않는다.

#### `/apply/complete`

- 제출 번호, 제출 시각, 모집명, 지원 파트, 현재 상태를 표시한다.
- 답변 전체를 다시 보여줄 수 있지만 수정 버튼은 제공하지 않는다.

### 7.2 관리자 화면

#### `/admin/recruitment`

- 모집 기수 목록과 상태, 접수 기간, 지원자 수를 표시한다.
- 새 모집 생성, draft 편집, 상태 전환을 제공한다.
- `open` 전환 시 잠금 영향을 확인하는 확인 UI가 필요하다.

#### `/admin/recruitment/[campaignId]/form`

- 지원 파트 관리
- 지원서 질문 생성·정렬·삭제
- Yes/No, 단일 객관식, 복수 선택, 주관식 유형 설정
- 주관식 최소·최대 글자 수 설정
- 최대 배점과 auto/manual 설정
- auto 선택지별 점수 설정
- 면접 평가 문항 생성·정렬·삭제
- 평가자 관리자 지정
- 모집이 `draft`가 아니면 읽기 전용으로 표시한다.

#### `/admin/recruitment/[campaignId]/applications`

Notion database와 유사한 관리자용 테이블을 제공한다.

기본 열:

- 이름
- 출생연도
- 대학교
- 학과
- 지원 파트
- 지원 상태
- 지원서 총점
- 지원서 평가 진행률
- 면접 총점
- 면접 평가 진행률
- 제출 시각

기능:

- 행 전체를 클릭해 상세 페이지로 이동
- 상태, 지원 파트, 학교 검색/필터
- 이름 검색
- 제출일·지원서 점수·면접 점수 정렬
- 모바일에서는 핵심 열만 먼저 보여주고 상세 정보는 행 액션 또는 카드형 목록으로 제공
- 페이지 전체 가로 스크롤은 만들지 않고 필요한 경우 테이블 컨테이너만 스크롤

#### `/admin/recruitment/[campaignId]/applications/[applicationId]`

한 화면에서 지원서 검토와 면접 평가를 수행한다.

- 상단: 지원자 기본 정보, 상태, 지원서/면접 총점, 평가 진행률
- 본문 왼쪽 또는 주 영역: 질문과 제출 답변, 자동 점수, 관리자별 수동 점수·코멘트
- 면접 영역: 문항별 관리자 점수와 코멘트
- 본인 평가 입력은 명확한 저장 상태(`저장 중/저장됨/오류`)를 보여준다.
- 다른 관리자의 평가를 작성자 이름과 함께 읽을 수 있다.
- 본인 평가 전에도 다른 관리자의 점수와 코멘트를 표시한다.
- 지원서 평가 완료 및 면접 평가 완료 버튼을 분리하고, 누락 문항이 있으면 완료 처리를 거절한다.
- 상태 변경 UI와 변경 이력을 제공한다.
- 여러 지원자를 선택해 같은 상태로 일괄 변경할 수 있다. 각 지원자별 상태 이력을 남기며 일부만 조용히 실패하는 동작은 금지한다.
- 이전/다음 지원자로 이동할 수 있다.
- 지원서 원문과 개인정보 수정 기능은 제공하지 않는다.

## 8. API 요구사항

정확한 세분화는 구현 시 조정할 수 있지만 다음 책임 경계를 유지한다.

### 지원자 API

- `GET /api/recruitment/current`: 현재 공개 모집과 지원자용 질문 반환
- `GET /api/recruitment/my-application`: 로그인 사용자의 제출 여부와 공개 상태 반환
- `POST /api/recruitment/applications`: 지원서 원자적 제출

### 관리자 API

- 모집 CRUD 및 상태 전환
- 지원 파트 CRUD
- draft 상태의 지원서/면접 문항 CRUD 및 정렬
- 평가자 지정/해제
- 지원자 목록 조회, 필터, 정렬, pagination
- 지원자 상세 조회
- 본인의 지원서 문항 평가 upsert
- 본인의 면접 평가 upsert
- 지원 상태 변경과 이력 생성
- 여러 지원자의 상태 일괄 변경과 지원자별 이력 생성

### 공통 API 규칙

- 입력은 서버에서 스키마 검증한다. 새 의존성을 추가할 필요가 없다면 명시적 TypeScript validator를 사용할 수 있다.
- 오류는 `{ error: string, code?: string, fieldErrors?: Record<string, string> }` 형태로 일관되게 반환한다.
- 인증 실패는 `401`, 권한 부족은 `403`, 상태 충돌·중복 제출은 `409`, 검증 실패는 `400` 또는 `422`를 사용한다.
- 평가 upsert는 `(application, question, evaluator)` unique key를 기준으로 한다.
- 목록 API는 기본 pagination을 적용하고 지원서 본문을 목록 응답에 포함하지 않는다.
- auto 문항의 선택지 점수와 전체 관리자 코멘트는 지원자 API 응답에서 제거한다.

## 9. UI·접근성 기준

모든 화면은 `DESIGN.md`의 Academic Monolith 원칙을 따른다.

- 일반 지원 화면은 `SiteChrome`을 사용한다.
- 관리자 화면은 기존 protected admin layout과 관리자 내비게이션에 통합한다.
- 폼은 레이블을 입력 위에 배치하고 오류는 해당 입력 바로 아래에 텍스트로 표시한다.
- 주요 의사결정 영역의 Primary CTA는 하나만 둔다.
- 상태는 색상만이 아니라 상태명 텍스트가 포함된 badge로 표시한다.
- 버튼과 입력의 최소 터치 높이는 44px다.
- 키보드만으로 질문 생성, 폼 입력, 테이블 행 진입, 평가 저장이 가능해야 한다.
- 질문 순서 변경은 키보드 대체 수단을 제공한다. drag-and-drop만 제공하지 않는다.
- 390px과 1440px에서 긴 질문, 긴 학교명, 빈 상태, 오류 상태를 검수한다.
- 로딩, 데이터 없음, 마감, 이미 제출함, 권한 없음 상태를 각각 명시적으로 설계한다.
- 관리 테이블은 높은 정보 밀도를 허용하되 동일한 카드의 반복보다 표, 구획, 조용한 surface 대비를 우선한다.

## 10. 감사 로그와 운영 안전성

- 질문 생성·수정·삭제, 모집 상태 변경, 지원 상태 변경, 평가 저장의 작성자와 시각을 추적한다.
- 최소 요구사항은 상태 변경 이력이며, 가능하면 범용 `recruitment_audit_log`를 추가한다.
- 제출 후 질문 잠금은 UI뿐 아니라 DB/API에서 강제한다.
- 관리자 평가의 마지막 수정 시각을 표시한다.
- 동시 평가 저장 시 다른 관리자의 값을 덮어쓰지 않는다.
- 동일 관리자가 여러 탭에서 수정할 가능성에 대비해 `updated_at` 기반 optimistic concurrency 또는 마지막 저장 경고를 고려한다.
- CSV export, 파일 첨부, 이메일/SMS 발송, 익명 블라인드 평가, 자동 합격 판정은 1차 범위에서 제외한다.

## 11. 구현 순서

1. SQL migration: 모집, 문항, 지원서, 평가, 상태 이력, index, constraint, RLS
2. 서버 데이터 모듈과 인증 helper
3. 관리자 모집·문항 편집 화면
4. 지원자 `/apply` 제출 흐름
5. 관리자 지원자 목록과 상세 평가 화면
6. 점수 집계 및 진행률
7. 상태 변경과 결과 공개 정책
8. 접근성, 반응형, 오류/빈 상태 검수
9. 테스트 및 문서 갱신

## 12. 테스트 요구사항

### 단위/통합 테스트

- auto yes/no 및 객관식 점수 계산
- 수동 점수 범위 검증
- 여러 관리자 점수 합산
- 미평가 항목의 진행률 계산
- 마감 전/후 제출 가능 여부
- 동일 모집 중복 제출 방지
- 제출 후 질문 및 답변 수정 거절
- evaluator가 아닌 관리자의 평가 쓰기 거절
- 다른 지원자의 지원서 조회 거절
- 결과 공개 전 최종 상태 비노출
- 상태 전환 및 이력 생성

### UI/E2E 테스트

- 비로그인 사용자의 `/apply` 로그인 유도
- 로그인 지원자의 정상 제출과 중복 제출 차단
- admin이 아닌 사용자의 관리자 라우트 차단
- draft 문항 생성과 open 이후 잠금
- 관리자 목록 필터·정렬·행 상세 이동
- 두 관리자 평가가 서로 덮어쓰지 않고 합산됨
- 모든 지정 평가자의 필수 평가 완료 전에는 점수가 잠정 상태로 표시됨
- 전체 점수 확정 후 평가 수정 요청이 거절됨
- 여러 지원자의 상태 일괄 변경 시 모든 대상의 이력이 생성됨
- 390px 및 1440px 핵심 화면 시각 검수

검증 명령은 최소 다음을 포함한다.

```bash
cd web
npm run build
npm run test:design
```

새 기능 테스트 스크립트를 추가했다면 해당 명령도 함께 실행한다.

## 13. 완료 기준

다음 조건을 모두 만족해야 1차 구현 완료로 본다.

- 관리자가 draft 모집과 지원서/면접 문항을 만들고 open할 수 있다.
- 로그인한 지원자가 열린 모집에 한 번만 제출할 수 있다.
- 제출 후 지원서와 질문이 수정되지 않는다.
- 제출 취소와 재제출 기능이 지원자·관리자 모두에게 제공되지 않는다.
- 여러 지정 관리자가 문항별 점수와 코멘트를 독립적으로 저장할 수 있다.
- 지원서 및 면접 점수가 합계 정책대로 계산된다.
- 모든 지정 평가자의 필수 평가가 끝난 경우에만 지원서/면접 점수가 확정된다.
- 관리자 목록에서 지원자 기본 정보, 상태, 점수, 평가 진행률을 확인할 수 있다.
- 행 클릭으로 상세 지원서 검토와 면접 평가 화면에 진입할 수 있다.
- 지원 상태 변경 이력이 남고 결과 공개 전 지원자에게 최종 결과가 노출되지 않는다.
- 여러 지원자의 상태를 일괄 변경해도 각 지원자별 상태 이력이 남는다.
- 서버 인가, RLS, DB constraint가 UI 우회 요청도 차단한다.
- `DESIGN.md` 기준과 모바일/데스크톱 접근성 검수를 통과한다.

## 14. 구현 전 확인 가능한 후속 정책

아래 항목은 1차 구현을 막지 않는 기본값으로 정했다. 운영진 정책이 달라지면 구현 전에 이 절만 수정한다.

- 면접 점수 역시 관리자별 점수의 평균이 아닌 합계를 사용한다.
- 지원자 결과 화면에는 합격/불합격만 표시하고 세부 점수와 관리자 코멘트는 공개하지 않는다.
- 결과 발표 이메일 알림은 제공하지 않는다. 지원자가 로그인해 결과를 확인한다.
- 파일 첨부와 포트폴리오 URL 전용 필드는 1차 범위에서 제외한다. 필요하면 지원서 질문으로 URL을 받을 수 있다.
- 모집별 평가자는 관리자가 명시적으로 지정한다.
- 지정된 평가자는 모집에 제출된 모든 지원자를 평가한다.
- 지원서 임시 저장과 제출 취소는 제공하지 않는다.
- 합격자를 `member` 테이블에 자동 등록하지 않는다. 회원 등록은 운영진이 별도로 처리한다.
- 한 번에 하나의 모집 기수만 `open`할 수 있다.
- 불합격자를 포함한 지원자 개인정보는 별도 삭제 기한 없이 보관한다. 향후 개인정보 처리방침과 운영 정책이 정해지면 보관 기간 및 파기 절차를 추가한다.
- 개인정보 동의는 필수이며 동의문 버전과 제출 당시 원문을 함께 보관한다.
- 전체 평가가 완료되어 점수가 확정된 뒤에는 평가 점수와 코멘트를 수정할 수 없다.
