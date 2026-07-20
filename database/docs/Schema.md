# HYBLOCK 데이터베이스 스키마

## 1. 개요

Supabase Postgres가 회원과 운영 데이터의 source of truth다. Google 계정은 Supabase Auth에 저장되며, Auth user와 `member`를 연결하는 별도 FK는 없다. 애플리케이션은 Auth user metadata의 `wallet_address`와 `member.wallet_address`를 맞춰 회원을 찾는다.

## 2. 테이블 사용 상태

| 테이블 | 역할 | Web 런타임 |
| --- | --- | --- |
| `member` | 회원, 지갑, 소속, 권한, 산출물 여부 | 사용 |
| `attendance_session` | 활동/세션과 출석 활성 상태 | 사용 |
| `attendance_record` | 회원별 출석 결과 | 사용 |
| `external_activity` | 회원별 외부 활동 증빙 | 사용 |
| `assignment` | 산출물별 증빙 스키마 | 현재 미사용 |
| `semester_criteria_tracking` | 조건별 사전 집계 | 사용 |
| `attestation` | EAS UID와 공개 데이터 | 사용 |
| `sbt_issuance` | SBT 민팅 이력 | 사용 |
| `notice` | 공지와 첨부 이미지 URL | 사용 |

`assignment` 마이그레이션은 남아 있지만 현재 후보 조회, 상세 조회, 자격 표시는 모두 `member.has_assignment`를 사용한다.

## 3. 관계

```text
member
  ├─ attendance_record ───── attendance_session
  ├─ external_activity ───── attendance_session
  ├─ assignment ──────────── attendance_session  (현재 web 미사용)
  ├─ semester_criteria_tracking
  ├─ attestation
  └─ sbt_issuance

notice  (독립)
```

## 4. `member`

회원 기본 정보와 서버 권한의 기준이다.

주요 컬럼:

| 컬럼 | 의미 |
| --- | --- |
| `id` | identity PK |
| `wallet_address` | nullable, unique EVM 주소 |
| `name`, `major` | 회원 프로필 |
| `affiliation` | `development` 또는 `business` |
| `cohort` | 기수 |
| `role` | member/리드/회장단 역할 |
| `period_start`, `period_end` | 활동 기간 |
| `is_active` | 로그인·출석 대상 활성 여부 |
| `is_admin` | 관리자 페이지/API 권한 |
| `has_assignment` | 현재 산출물 조건 충족 여부 |

애플리케이션의 지갑 로그인은 소문자 주소로 조회하지만 DB 컬럼 자체가 항상 소문자로 저장되도록 강제하는 constraint는 없다. 회원 생성 코드는 소문자로 정규화한다.

## 5. `attendance_session`

공개 활동의 운영 정보와 출석 세션을 하나의 테이블로 관리한다.

주요 컬럼:

- `session_id` UUID PK
- `cohort`
- `session_type`: `basic`, `advanced`, `misc`, `external`, `hackathon`
- `target_affiliation`: `development`, `business`, `null`
- `title`, `content`
- `check_in_code`
- `session_start_time`, `session_end_time`
- `status`: `scheduled`, `in_progress`, `completed`, `cancelled`
- `created_at`, `updated_at`

운영 규칙:

- `advanced`는 애플리케이션에서 target affiliation을 필수로 요구한다.
- 활성화 시 6자리 code와 기본 20분 종료 시각을 설정한다.
- `session_start_time`은 출석의 10분 지각 기준에도 사용한다.
- 만료를 감지하면 애플리케이션이 세션을 완료하고 결석 레코드를 채운다.

## 6. `attendance_record`

member/session당 하나의 출석 결과를 저장한다.

주요 컬럼:

- `attendance_id` UUID PK
- `session_id` FK
- `member_id` FK
- `attended_at`: 결석이면 `null`
- `status`: `present`, `late`, `absent`
- `created_at`

`UNIQUE(session_id, member_id)`가 중복 레코드를 막는다. 관리자의 `nonParticipation` 상태는 DB enum 값이 아니라 해당 레코드가 없는 상태로 표현한다.

## 7. `external_activity`

외부 활동 증빙을 저장한다.

- `activity_id` UUID PK
- `member_id`, `session_id` FK
- `evidence_url`
- `created_at`, `updated_at`
- `UNIQUE(session_id, member_id)`

external activity 증명 fallback과 SBT 조건 현황 표시에 사용한다.

## 8. `assignment`

산출물 제목, 소속, evidence URL을 저장하도록 만든 초기 스키마다.

- `assignment_id` UUID PK
- `member_id`, `session_id` FK
- `affiliation`
- `assignment_title`
- `evidence_url`
- timestamps

현재 Web은 이 테이블에 CRUD/query를 수행하지 않는다. 운영에서는 `member.has_assignment=true/false`만 사용하며, 관리자 후보 상세도 이 boolean을 가상 산출물 한 건으로 변환한다. 두 모델 중 하나로 통합하기 전까지 문서와 기능에서 혼용하지 않는다.

## 9. `semester_criteria_tracking`

회원·기수·조건 타입별 집계 결과다.

- `tracking_id` UUID PK
- `member_id` FK
- `cohort`
- `criteria_type`: `attendance`, `external_activity`, `assignment`, `participation_period`
- `is_met`
- `details` JSONB
- timestamps
- `UNIQUE(member_id, cohort, criteria_type)`

증명 후보 조회는 `is_met=true`를 우선 사용하지만, 데이터가 없거나 일부만 있어도 원본 fallback 후보를 합친다. 이 저장소에는 tracking 값을 자동 계산하는 batch/job이 없다.

## 10. `attestation`

EAS 발급 결과의 off-chain 인덱스다.

- `attestation_id` UUID PK
- `member_id` FK
- `personal_data_hash` 66자 hex
- `revealed_data` JSONB
- `is_graduated`
- `eas_uid` unique 66자 hex
- `attestation_type` 네 조건 타입 중 하나
- `created_at`
- `UNIQUE(member_id, attestation_type)`

SBT 민팅의 최종 자격은 이 테이블에 네 타입이 모두 있는지로 판단한다. `is_graduated`는 현재 웹 발급에서 항상 false다.

## 11. `sbt_issuance`

member당 한 번의 SBT 발급 결과를 저장한다.

- `issuance_id` UUID PK
- `member_id` unique FK
- `token_id` unique bigint
- `contract_address`
- `transaction_hash` unique
- `minted_at`, `created_at`

중복 민팅 방지와 마이페이지 발급 상태 확인에 사용한다.

## 12. `notice`

공지 목록과 상세의 source of truth다.

- `id` bigserial PK
- `category`, `title`, `author`, `date`
- `content` text
- `images` text array
- timestamps

본문은 Markdown/GFM으로 렌더링한다. `images`는 파일 저장소가 아니라 외부 이미지 URL 목록이다. 홈 화면 공지 요약은 이 테이블과 자동 동기화되지 않는다.

## 13. 마이그레이션 주의

- 자동 migration runner가 없다.
- `008_create_sbt_issuance.sql`과 `008_add_check_in_code_to_attendance_session.sql`이 번호를 공유한다.
- `002_create_session.sql`에도 `check_in_code`가 이미 있어 추가 migration은 idempotent 보정 역할이다.
- RLS policy, storage bucket, seed/admin 데이터 migration은 저장소에 없다.
- 현재 소스에는 `target_affiliation`/`check_in_code`가 없는 구 스키마를 위한 일부 fallback query가 남아 있다.

적용 순서는 [운영 가이드](../../docs/OPERATIONS.md)를 따른다.

## 14. 관련 문서

- [DB 구현 가이드](IMPLEMENTATION_GUIDE.md)
- [아키텍처](../../docs/ARCHITECTURE.md)
- [플로우](../../docs/FLOWS.md)
