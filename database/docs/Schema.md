# AbCS Database Schema Documentation

## 📋 개요

AbCS(Activity-Based Credential System)는 학회 활동 관리 및 블록체인 기반 수료증 발급 시스템입니다.
학회원의 활동을 추적하고, 수료 조건을 관리하며, EAS Attestation을 통해 자격을 증명하고, 최종적으로 SBT(Soul Bound Token)로 수료증을 발급합니다.

### 주요 기능
- **출석 관리**: 세션별 학회원 출석 기록 추적
- **외부 활동 추적**: 외부 활동 참여 증빙 자료 관리
- **산출물 관리**: 학기별 스터디/프로젝트/리서치 산출물 기록
- **수료 조건 추적**: 4가지 수료 조건(출석/외부활동/산출물/참여기간) 달성 여부 추적
- **자격 증명**: EAS(Ethereum Attestation Service)를 통한 영지식증명 기반 자격 증명
- **SBT 발급**: 수료 조건을 만족한 학회원에게 SBT 발급

---

## 🗂️ ERD (Entity Relationship Diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│                        personal_info                             │
│                  (PK: wallet_address)                            │
│                                                                   │
│  ├─ wallet_address (VARCHAR 42) [PK]                             │
│  ├─ name, major, affiliation, cohort, role                       │
│  ├─ period_start, period_end, is_active                          │
│  └─ Indices: role, cohort, is_active                             │
└──────────────┬──────────────────────────────────────────────────┘
               │ (1:N) wallet_address
               │
    ┌──────────┼──────────┬──────────┬─────────────┬─────────────┐
    │          │          │          │             │             │
    ▼          ▼          ▼          ▼             ▼             ▼
attendance  external_  assignment semester_    attestation   sbt_
 activity   activity            criteria_                   issuance
                              tracking

┌─────────────────────────────────────────────────────────────────┐
│                         session                                  │
│                   (PK: session_id)                               │
│                                                                   │
│  ├─ session_id (UUID) [PK]                                       │
│  ├─ cohort, session_type, content                                │
│  ├─ session_start_time, session_end_time, status                 │
│  └─ Indices: cohort, start_time, status                          │
└──────────────┬──────────────────────────────────────────────────┘
               │ (1:N) session_id
               │
    ┌──────────┼──────────┬──────────┐
    │          │          │          │
    ▼          ▼          ▼          ▼
attendance  external_  assignment
           activity

관계 요약:
- personal_info.wallet_address (1:N) → 모든 활동 및 추적 테이블
- session.session_id (1:N) → 활동 테이블 3개 (attendance, external_activity, assignment)
- sbt_issuance ↔ personal_info: 1:1 관계
- 모든 FK는 ON DELETE CASCADE 정책 적용
```

---

## 📊 테이블 목록

| 테이블명 | 용도 | 주요 식별자 |
|---------|------|-----------|
| `personal_info` | 학회원 기본 정보 및 활동 기간 | wallet_address (PK) |
| `session` | 세션(수업/활동) 정보 | session_id (PK) |
| `attendance` | 출석 기록 | attendance_id (PK) |
| `external_activity` | 외부 활동 참여 증빙 | activity_id (PK) |
| `assignment` | 산출물/과제 제출 | assignment_id (PK) |
| `semester_criteria_tracking` | 학기별 수료 조건 추적 | tracking_id (PK) |
| `attestation` | EAS 자격 증명 기록 | attestation_id (PK) |
| `sbt_issuance` | SBT 수료증 발급 기록 | issuance_id (PK) |

---

## 🔍 테이블 상세 설명

### 1. personal_info
학회원의 기본 정보 및 활동 기간을 관리하는 중심 엔티티입니다.

**주요 컬럼**
- `wallet_address` (VARCHAR 42, PK): Ethereum 지갑 주소 (0x + 40자)
- `name` (VARCHAR 100): 학회원 이름
- `major` (VARCHAR 100): 전공
- `affiliation` (VARCHAR 30): 소속 팀 (development, business)
- `cohort` (INTEGER): 학회 기수
- `role` (VARCHAR 30): 역할 (member, developmentLead, businessLead, president, vicePresident)
- `period_start`, `period_end` (TIMESTAMP): 활동 기간
- `is_active` (BOOLEAN): 활동 중 여부

**제약조건**
- `chk_personal_info_affiliation`: affiliation IN ('development', 'business')
- `chk_personal_info_role`: role IN ('member', 'developmentLead', 'businessLead', 'president', 'vicePresident')

**인덱스**
- `idx_personal_info_role`: 운영진 권한 검증, 역할별 필터링
- `idx_personal_info_cohort`: 기수별 회원 조회
- `idx_personal_info_is_active`: 활동 중인 회원 필터링

---

### 2. session
세션(강의, 워크샵, 외부 활동 등)의 정보를 관리합니다.

**주요 컬럼**
- `session_id` (UUID, PK): 세션 고유 ID
- `cohort` (INTEGER): 세션이 속한 기수
- `session_type` (VARCHAR 25): 세션 타입 (basic, advanced, external)
- `content` (TEXT): 세션 주제, 노션 URL 등
- `session_start_time`, `session_end_time` (TIMESTAMP): 세션 시간 정보
- `status` (VARCHAR 25): 세션 상태 (scheduled, in_progress, completed, cancelled)

**제약조건**
- `chk_session_status`: status IN ('scheduled', 'in_progress', 'completed', 'cancelled')
- `chk_session_type`: session_type IN ('basic', 'advanced', 'external')
- `chk_session_end_after_start`: session_end_time > session_start_time (NULL 허용)

**인덱스**
- `idx_session_cohort`: 기수별 세션 조회
- `idx_session_start_time`: 시간 기반 세션 조회
- `idx_session_status`: 상태별 세션 필터링
- `idx_session_cohort_start_time`: 기수별 시간순 조회 (복합 인덱스)

---

### 3. attendance
학회원의 출석 기록을 관리합니다.

**주요 컬럼**
- `attendance_id` (UUID, PK): 출석 기록 고유 ID
- `session_id` (UUID, FK): session 테이블 참조
- `wallet_address` (VARCHAR 42, FK): personal_info 테이블 참조
- `name` (VARCHAR 100): 학생 이름 (비정규화)
- `student_id` (VARCHAR 30): 학번 또는 학생 ID
- `attended_at` (TIMESTAMP): 실제 출석 시간 (absent는 NULL)
- `status` (VARCHAR 20): 출석 상태 (present, late, absent)

**제약조건**
- FK `fk_attendance_session`: ON DELETE CASCADE
- FK `fk_attendance_wallet`: ON DELETE CASCADE
- `uq_attendance_session_wallet`: 같은 세션에서 중복 출석 불가
- `chk_attendance_status`: status IN ('present', 'late', 'absent')

**인덱스**
- `idx_attendance_wallet`: 학생별 출석 기록 조회
- `idx_attendance_session`: 세션별 출석 기록 조회
- `idx_attendance_status`: 상태별 필터링
- `idx_attendance_session_wallet`: 특정 세션의 특정 학생 기록 조회
- `idx_attendance_session_status`: 세션별 출석 상태 통계
- `idx_attendance_attended_at`: 시간 기반 조회

---

### 4. external_activity
학회원의 외부 활동 참여를 증빙자료 URL과 함께 기록합니다.

**주요 컬럼**
- `activity_id` (UUID, PK): 참여 기록 고유 ID
- `wallet_address` (VARCHAR 42, FK): personal_info 테이블 참조
- `session_id` (UUID, FK): session 테이블 참조
- `evidence_url` (TEXT): 증빙 자료 URL (필수)

**제약조건**
- FK `fk_external_activity_wallet`: ON DELETE CASCADE
- FK `fk_external_activity_session`: ON DELETE CASCADE
- `uq_external_activity_session_wallet`: 같은 세션에서 중복 기록 방지

**인덱스**
- `idx_external_activity_wallet`: 학생별 외부 활동 조회
- `idx_external_activity_session`: 세션별 외부 활동 조회
- `idx_external_activity_wallet_session`: 특정 학생의 세션별 활동 조회

---

### 5. assignment
학회원의 산출물(스터디, 프로젝트, 리서치) 제출 기록을 관리합니다.

**주요 컬럼**
- `assignment_id` (UUID, PK): 과제 기록 고유 ID
- `wallet_address` (VARCHAR 42, FK): personal_info 테이블 참조
- `session_id` (UUID, FK): session 테이블 참조
- `affiliation` (VARCHAR 50): 제출 당시 소속 팀
- `assignment_title` (VARCHAR 255): 과제명 (스터디, 프로젝트, 리서치 등)
- `evidence_url` (TEXT): 증빙 자료 URL

**제약조건**
- FK `fk_assignment_wallet`: ON DELETE CASCADE
- FK `fk_assignment_session`: ON DELETE CASCADE
- `uq_assignment_evidence`: 같은 학생의 같은 세션에서 같은 증빙 자료 중복 등록 방지

**인덱스**
- `idx_assignment_wallet`: 학생별 산출물 조회
- `idx_assignment_session`: 세션별 산출물 조회
- `idx_assignment_affiliation`: 팀별 산출물 조회
- `idx_assignment_title`: 과제명별 조회
- `idx_assignment_wallet_session`: 특정 학생의 세션별 산출물 조회

---

### 6. semester_criteria_tracking
각 학기별로 학회원이 4가지 수료 조건을 달성했는지 추적합니다.

**주요 컬럼**
- `tracking_id` (UUID, PK): 추적 기록 고유 ID
- `wallet_address` (VARCHAR 42, FK): personal_info 테이블 참조
- `cohort` (INTEGER): 기수/학기 (session.cohort와 대응)
- `criteria_type` (VARCHAR 30): 수료 조건 타입
  - `attendance`: 출석 조건
  - `external_activity`: 외부 활동 조건
  - `assignment`: 산출물 조건
  - `participation_period`: 참여 기간 조건
- `is_met` (BOOLEAN): 해당 학기 조건 달성 여부
- `details` (JSONB): 세부 정보 (출석 횟수, 산출물 개수 등)

**제약조건**
- FK `fk_semester_criteria_wallet`: ON DELETE CASCADE
- `uq_semester_criteria_wallet_cohort_type`: 같은 학기에 같은 조건 타입은 1개만
- `chk_semester_criteria_type`: criteria_type 유효성 검사

**인덱스**
- `idx_semester_criteria_wallet`: 특정 학생의 학기별 조건 조회
- `idx_semester_criteria_cohort`: 기수별 조건 달성 현황
- `idx_semester_criteria_type`: 조건 타입별 통계
- `idx_semester_criteria_is_met`: 조건 달성 여부 필터링
- `idx_semester_criteria_wallet_type`: 학생별 조건 타입 조회
- `idx_semester_criteria_wallet_cohort`: 2학기 연속 조건 확인 (복합 인덱스)

---

### 7. attestation
EAS(Ethereum Attestation Service)를 통한 자격 증명을 기록합니다.

**주요 컬럼**
- `attestation_id` (UUID, PK): Attestation 고유 ID
- `wallet_address` (VARCHAR 42, FK): personal_info 테이블 참조
- `personal_data_hash` (CHAR 66): 개인정보 해시 (0x + 64자)
- `revealed_data` (JSONB): 공개된 데이터 (JSON 형식, NULL 허용)
- `is_graduated` (BOOLEAN): 수료 여부
- `eas_uid` (CHAR 66, UNIQUE): EAS Attestation UID (0x + 64자) - 전역 고유
- `attestation_type` (VARCHAR 50): Attestation 타입 (attendance, external_activity, assignment, participation_period)

**제약조건**
- FK `fk_attestation_wallet`: ON DELETE CASCADE
- `uq_attestation_eas_uid`: EAS UID는 전역적으로 고유
- `uq_attestation_wallet_type`: 사용자당 각 타입별 1개만 허용
- `chk_attestation_type`: attestation_type 유효성 검사

**인덱스**
- `idx_attestation_wallet`: 특정 학생의 증명 조회
- `idx_attestation_eas_uid`: EAS UID로 증명 검증
- `idx_attestation_type`: 타입별 증명 필터링
- `idx_attestation_wallet_type`: 학생별 타입 조회 (복합 인덱스)

---

### 8. sbt_issuance
수료 조건을 만족한 학회원에게 발급된 SBT(Soul Bound Token)의 정보를 기록합니다.

**주요 컬럼**
- `issuance_id` (UUID, PK): SBT 발급 기록 고유 ID
- `wallet_address` (VARCHAR 42, FK, UNIQUE): personal_info 테이블 참조 - 학회원당 1개만 발급
- `token_id` (BIGINT, UNIQUE): ERC721 tokenId (고유 식별자)
- `contract_address` (VARCHAR 42): SBT 스마트 컨트랙트 주소
- `transaction_hash` (CHAR 66, UNIQUE): 민팅 트랜잭션 해시 (0x + 64자)
- `minted_at` (TIMESTAMP): 실제 SBT 민팅 시간 (블록체인 트랜잭션 확정 시간)

**제약조건**
- FK `fk_sbt_issuance_wallet`: ON DELETE CASCADE
- `uq_sbt_issuance_wallet_address`: 학회원당 1개의 SBT만 발급
- `uq_sbt_issuance_token_id`: tokenId는 고유
- `uq_sbt_issuance_transaction_hash`: 트랜잭션 해시는 고유

**인덱스**
- `idx_sbt_issuance_wallet`: 특정 학생의 SBT 조회
- `idx_sbt_issuance_token_id`: tokenId로 SBT 검증
- `idx_sbt_issuance_contract`: 컨트랙트별 SBT 그룹화
- `idx_sbt_issuance_tx_hash`: 트랜잭션 해시로 SBT 검증

---

## 🔗 테이블 관계

### 1. 학회원 중심 관계
`personal_info`는 모든 활동 및 추적 데이터의 중심입니다.
- **1:N 관계**로 모든 활동 데이터와 연결됨
- `wallet_address`가 외래키로 사용됨
- 학회원 삭제 시 모든 관련 데이터도 CASCADE 삭제됨

```
personal_info ──┬── attendance (N)
                ├── external_activity (N)
                ├── assignment (N)
                ├── semester_criteria_tracking (N)
                ├── attestation (N)
                └── sbt_issuance (1)
```

### 2. 세션 중심 관계
`session`은 활동 관련 3개 테이블과 연결됩니다.
- **1:N 관계**로 각 세션에 여러 활동 기록이 연결됨
- `session_id`가 외래키로 사용됨

```
session ──┬── attendance (N)
          ├── external_activity (N)
          └── assignment (N)
```

### 3. 수료 조건 추적
학기별 수료 조건 달성을 추적합니다.
- `semester_criteria_tracking`은 `personal_info`와 `cohort`을 통해 연결
- 4가지 기준 타입: attendance, external_activity, assignment, participation_period
- 2학기 연속 조건 만족 여부 판단의 기준 데이터 제공

### 4. 자격 증명 관계
EAS Attestation을 통한 증명 발급입니다.
- `attestation`은 `personal_info`와 1:N 관계
- `criteria_type`과 동일한 타입별로 구분
- `is_graduated` 필드로 최종 수료 여부 표시

### 5. SBT 발급 관계
최종 수료증 발급입니다.
- `sbt_issuance`는 `personal_info`와 **1:1 관계**
- 모든 4개 Attestation UID를 획득한 후에만 발급 가능
- 학회원당 단 1개의 SBT만 발급됨

---

## 💼 주요 비즈니스 로직

### 수료 조건 (4가지)
1. **출석 (attendance)**
   - 세션별 출석 기록을 통해 일정 횟수 이상 출석 여부 판단
   - `attendance.status` = 'present' 또는 'late'

2. **외부 활동 (external_activity)**
   - 외부 활동 참여 증빙으로 활동 여부 판단
   - `external_activity.evidence_url` 저장으로 증빙

3. **산출물 (assignment)**
   - 개발팀: 스터디 또는 프로젝트 1개 이상
   - 비즈니스팀: 리서치 2개 이상
   - `assignment.evidence_url`로 증빙

4. **참여 기간 (participation_period)**
   - `personal_info.period_start`부터 `period_end`까지의 활동 기간
   - 최소 참여 기간 요구사항 충족 여부 판단

### 수료 증명 플로우
1. 각 학기별로 4가지 수료 조건 달성 여부를 `semester_criteria_tracking`에 기록
2. 조건 달성 시 `attestation` 테이블에 EAS Attestation UID 저장
3. 모든 4개 타입의 Attestation을 획득하면 수료 자격 확정
4. SBT 스마트 컨트랙트 호출하여 토큰 민팅
5. 민팅 결과를 `sbt_issuance`에 기록

### 데이터 일관성
- **FK 제약**: 모든 학회원 참조는 CASCADE 삭제로 데이터 일관성 보장
- **UNIQUE 제약**: 중복 기록 방지
- **CHECK 제약**: 유효한 값만 저장
- **JSONB 필드**: 유연한 세부 정보 저장 (details, revealed_data)

---

## 📈 성능 고려사항

### 주요 인덱스 전략
- **단일 인덱스**: 자주 필터링하는 컬럼 (wallet_address, session_id, cohort 등)
- **복합 인덱스**: 함께 조회되는 컬럼 조합 (wallet_cohort, session_wallet 등)
- **선택적 인덱스**: 특정 상태/타입별 조회 최적화

### N+1 쿼리 방지
- JOIN을 통한 효율적인 데이터 조회
- 비정규화 데이터 (name, student_id in attendance) 활용으로 불필요한 JOIN 최소화

### 학기 전환 고려사항
- `cohort` 필드로 학기별 데이터 분리
- `semester_criteria_tracking`으로 2학기 연속 추적
- 배치 작업에서 `is_active` 인덱스 활용

---

## 🔐 데이터 보안

- **지갑 주소**: Ethereum 주소로 사용자 식별, 블록체인 통합
- **해시 저장**: `personal_data_hash`로 개인정보 보호
- **영지식증명**: EAS를 통한 검증, 민감 정보는 `revealed_data`에만 저장
- **불변성**: 출석/활동 기록은 수정 불가, 생성 후 조회만 가능
