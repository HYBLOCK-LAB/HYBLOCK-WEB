# HYBLOCK Database Schema

## 1. 개요

HYBLOCK의 데이터베이스는 학회원 정보, 활동 기록, 증명 발급 이력, SBT 발급 이력을 관리한다.

현재 구현 기준의 핵심 흐름은 아래와 같다.
- `member`에 회원과 권한 정보 저장
- 출석/활동/산출물 원본 데이터를 개별 테이블에 저장
- 관리자 증명 발급 후 `attestation`에 UID 기록
- SBT 민팅 후 `sbt_issuance`에 발급 결과 기록

## 2. 핵심 테이블

| 테이블 | 역할 |
| --- | --- |
| `member` | 회원 기본 정보, 지갑 주소, admin 여부 |
| `attendance_session` | 출석 세션 정보 |
| `attendance_record` | 출석 기록 |
| `external_activity` | 외부 활동 기록 |
| `assignment` | 산출물 기록 |
| `semester_criteria_tracking` | 수료 조건 집계 결과 |
| `attestation` | EAS attestation UID 및 메타 정보 |
| `sbt_issuance` | SBT 발급 이력 |

## 3. 관계 요약

```text
member
  ├─ attendance_record
  ├─ external_activity
  ├─ assignment
  ├─ semester_criteria_tracking
  ├─ attestation
  └─ sbt_issuance

attendance_session
  ├─ attendance_record
  └─ external_activity
```

## 4. 테이블 설명

### `member`

회원의 기본 정보와 권한 정보를 저장한다.

주요 컬럼:
- `id`
- `wallet_address`
- `name`
- `major`
- `affiliation`
- `cohort`
- `role`
- `is_active`
- `is_admin`

운영 포인트:
- 관리자 접근 제어는 `is_admin` 기준
- wallet session 로그인 후 `wallet_address`로 회원을 매핑

### `attendance_session`

출석 가능한 세션 단위를 저장한다.

주요 컬럼:
- `session_id`
- `title`
- `cohort`
- `session_type`
- `target_affiliation`
- `check_in_code`
- `status`
- `session_start_time`
- `session_end_time`

`session_type` 값:
- `basic`
- `advanced`
- `misc`
- `external`
- `hackathon`

`target_affiliation` 값:
- `development`
- `business`
- `null`

운영 포인트:
- `basic`, `misc`, `external`, `hackathon`은 전체 회원 대상 세션으로 취급한다.
- `advanced`는 `target_affiliation`이 있어야 어느 파트 대상인지 판별할 수 있다.
- `check_in_code`는 운영진의 수동 출석 확인 코드로 사용한다.
- `session_end_time`은 단순 종료 시각뿐 아니라 활성 세션 만료 시각으로도 사용한다.
- 현재 구현에서는 활성화 시 기본 20분 만료를 잡고, 시간이 지나면 QR 발급/스캔에서 비활성으로 처리한다.

### `attendance_record`

회원의 출석 기록을 저장한다.

주요 컬럼:
- `attendance_id`
- `member_id`
- `session_id`
- `status`
- `attended_at`

상태 예시:
- `present`
- `late`
- `absent`

### `external_activity`

외부 활동 참여 및 증빙 링크를 저장한다.

주요 컬럼:
- `activity_id`
- `member_id`
- `session_id`
- `evidence_url`

### `assignment`

산출물 제출 기록을 저장한다.

주요 컬럼:
- `assignment_id`
- `member_id`
- `assignment_title`
- `affiliation`
- `evidence_url`

### `semester_criteria_tracking`

수료 조건 집계 결과를 저장한다.

주요 컬럼:
- `tracking_id`
- `member_id`
- `cohort`
- `criteria_type`
- `is_met`
- `details`

`criteria_type` 값:
- `attendance`
- `external_activity`
- `assignment`
- `participation_period`

주의:
- 현재 관리자 증명 화면은 이 테이블을 우선 사용한다.
- 집계가 비어 있으면 raw 활동 데이터 fallback도 사용한다.

### `attestation`

관리자가 발급한 EAS 증명 정보를 저장한다.

주요 컬럼:
- `attestation_id`
- `member_id`
- `attestation_type`
- `eas_uid`
- `personal_data_hash`
- `revealed_data`
- `is_graduated`
- `created_at`

운영 포인트:
- 학회원의 SBT 발급 자격 판정은 이 테이블 기준으로 한다.
- 같은 타입의 증명이 이미 있으면 관리자 화면에서 `기발급 증명`으로 확인 가능하다.

### `sbt_issuance`

SBT 발급 결과를 저장한다.

주요 컬럼:
- `issuance_id`
- `member_id`
- `token_id`
- `contract_address`
- `transaction_hash`
- `minted_at`

운영 포인트:
- 같은 회원이 이미 발급받았는지 확인하는 기준 테이블이다.

## 5. 현재 플로우에서 실제로 쓰는 판단 기준

### 출석 QR 노출

기본 규칙:
- `basic`, `misc`, `external`, `hackathon`은 전체 회원에게 노출 가능
- `advanced`는 `member.affiliation = attendance_session.target_affiliation`일 때만 노출

주의:
- `advanced`인데 `target_affiliation`이 비어 있으면 회원 QR 후보에서 숨긴다.

### 증명 발급 후보

우선순위:
1. `semester_criteria_tracking`
2. raw 활동 데이터

### SBT 발급 가능 여부

필수 증명 4종:
- `attendance`
- `external_activity`
- `assignment`
- `participation_period`

중복 발급 방지:
- `sbt_issuance` 존재 여부로 확인

## 6. 참고 문서

- [아키텍처](/home/jaeman/Codes/HYBLOCK-WEB/docs/ARCHITECTURE.md)
- [플로우](/home/jaeman/Codes/HYBLOCK-WEB/docs/FLOWS.md)
- [운영 가이드](/home/jaeman/Codes/HYBLOCK-WEB/docs/OPERATIONS.md)
