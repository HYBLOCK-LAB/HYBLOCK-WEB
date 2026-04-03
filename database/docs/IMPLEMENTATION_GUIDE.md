# 데이터베이스 백엔드 구현 가이드

## 개요

이 문서에는 프로젝트의 데이터베이스 스키마에 대한 백엔드 구현 가이드 및 참고 사항을 적어두었습니다.


---

## 1. Personal Info 테이블

#### 목적
학회원의 기본 정보를 관리합니다.

#### 고려 사항: 학기 변경 시 소속 및 역할 업데이트

학기 변경 시 학회원의 소속(affiliation)과 역할(role)이 변경될 수 있습니다. 이 경우 다음과 같은 로직을 고려하여 구현해야 합니다.

**처리 시나리오:**
1. 역할 변경(예: 일반 회원 → 임원진) 시 `role` 값 업데이트
2. 소속 변경(예: 개발 팀->비즈니스 팀)시 'affiliation' 값 업데이트| 수료 조건도 달라짐
3. 비활성화된 회원(`is_active = false`)의 경우, `personal_info` 수정은 가능하지만 해당 학회원의 이전 출석 기록(`attendance`)은 유지

**주의사항:**
- `personal_info` 수정 시 기존 출석 기록에는 영향을 주지 않음
- 세션별 출석 관리는 `session`의 생성 시점 기준 cohort 정보로 처리

---

## 2. Session 테이블

### 세션 상태 자동 관리

#### 목적
세션 시작/종료 시간을 기반으로 세션 상태를 자동으로 업데이트합니다.

#### 비즈니스 규칙

| 조건 | Status | 설명 |
|------|--------|------|
| 초기 상태 | `scheduled` | 세션이 생성된 직후 상태 |
| 현재 시간 ≥ `session_start_time` | `in_progress` | 세션이 시작된 이후 |
| 현재 시간 ≥ `session_end_time` | `completed` | 세션이 종료된 이후 |

#### 실행 시점
- 배치 작업으로 주기적 업데이트 (예: 1분마다)
- 세션 조회 시 현재 시간 기준으로 상태 계산

### 참고 사항
-세션 테이블을 생성해야 수료 기준에 대한 데이터 수집 가능
-세션 기수와 학회원의 기수 비교를 통해 신입/시니어 판별 가능
-세션 기수가 곧 다른 학기를 의미(활용하여 학기별로 수료 기준 충족 여부 확인)- 예: 2학기 이상 참여



---

## 3. Attendance 테이블

### 출석 상태 자동 관리

#### 목적
출석 기록의 `status`를 자동으로 계산하고, 세션 완료 시 미출석자를 자동으로 처리합니다.

#### 비즈니스 규칙 1: 출석 상태 계산

새로운 출석 기록을 생성할 때, `attended_at` 필드와 세션의 `session_start_time`을 비교하여 상태를 결정합니다.

| 조건 | Status | 설명 |
|------|--------|------|
| `attended_at` = NULL | `absent` | 세션에 출석하지 않은 경우 |
| `attended_at` ≤ `session_start_time` + 10분 | `present` | 세션 시작 후 10분 이내에 출석 |
| `attended_at` > `session_start_time` + 10분 | `late` | 세션 시작 후 10분을 초과하여 출석 |

#### 비즈니스 규칙 2: 미출석자 자동 생성

세션의 상태가 `completed`로 변경될 때, 아직 출석 기록이 없는 모든 활동 중인 학회원에 대해 `absent` 레코드를 자동으로 생성합니다.

**처리 절차:**
1. 해당 세션의 `cohort` 확인
2. 해당 cohort의 `is_active = true`인 모든 학회원 조회
3. 이미 attendance 기록이 있는 학회원 제외
4. 남은 학회원에 대해 자동으로 `absent` 레코드 생성
   - `attended_at = NULL`
   - `status = 'absent'`

#### 실행 시점
- **규칙 1**: 새로운 attendance 레코드를 생성할 때 (사용자 출석 인증 시)
- **규칙 2**: `session.status`가 `'completed'`로 업데이트될 때

---

## 4. External Activity 테이블

#### 목적
학회 외부 활동(강연, 해커톤, 컨퍼런스 등) 기록을 관리합니다.

#### 고려 사항

**증빙 자료 검증 방식**
- 증빙 자료 검증 방식은 추후 논의 및 결정 예정
- 현재는 증빙 자료 저장 및 관리 기능 구현
- 추후 검증 방식이 정의되면 해당 로직 추가 적용

---

## 5. Assignment 테이블

#### 목적
학기별 수료 조건 달성 기록을 관리합니다. 학회원의 스터디, 프로젝트, 리서치 등 산출물 참여 현황을 추적합니다.

#### 고려 사항

**산출물 증빙 자료 검증 방식**
- 증빙 자료 검증 방식은 추후 논의 및 결정 예정
- 현재는 증빙 자료(URL) 저장 및 관리 기능 구현
- 추후 검증 방식이 정의되면 해당 로직 추가 적용

**수료 조건 판별 로직**
- 개발팀: 학기별 스터디 또는 프로젝트 1개 이상 필수
- 비즈니스팀: 학기별 리서치 2개 이상 필수
- 소속(affiliation)과 학기(session)를 기준으로 수료 조건 충족 여부 검증

---

## 6. Semester Criteria Tracking 테이블

#### 목적
학기별 수료 조건 추적 및 관리합니다. 각 학회원이 특정 학기에 4가지 수료 조건(출석/외부활동/산출물/참여기간)을 달성했는지 기록합니다.

#### 데이터 흐름

1. **데이터 수집 (기존 테이블)**
   - `attendance`: QR 출석 기록
   - `external_activity`: 외부 활동 증빙
   - `assignment`: 산출물 증빙

2. **학기별 조건 추적 (semester_criteria_tracking)**
   - 백엔드 로직이 주기적으로 데이터 집계
   - 각 조건의 달성 여부를 `is_met` 필드로 기록
   - `details` JSON 필드에 세부 정보 저장

3. **UID 발급 로직**
   - 특정 criteria_type에 대해 2개 이상의 cohort에서 is_met = true 확인
   - 2학기 연속 조건 만족 시 → attestation 테이블에 UID 생성

#### 수료 조건별 로직

**1. attendance (출석)**
- 신입(freshman): 학기당 7회 이상 출석 필요
  - 지각 2회 = 결석 1회로 계산
- 시니어(senior): 학기당 6회 이상 출석 필요
  - 지각 2회 = 결석 1회로 계산

```sql
-- 예시: attendance 조건 판별
SELECT
  wallet_address,
  cohort,
  COUNT(*) FILTER (WHERE status = 'present') as present_count,
  COUNT(*) FILTER (WHERE status = 'late') as late_count,
  COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
  COUNT(*) FILTER (WHERE status = 'present') +
    FLOOR(COUNT(*) FILTER (WHERE status = 'late') / 2.0) as adjusted_attendance
FROM attendance a
JOIN session s ON a.session_id = s.session_id
JOIN personal_info p ON a.wallet_address = p.wallet_address
WHERE a.wallet_address = $1
GROUP BY a.wallet_address, s.cohort;
```

**2. external_activity (외부활동)**
- 학기당 1회 이상 필수

**3. assignment (산출물)**
- 개발팀: 학기당 스터디 또는 프로젝트 1개 이상 필수
- 비즈니스팀: 학기당 리서치 2개 이상 필수

**4. participation_period (참여기간)**
- 총 참여 기간 2학기 이상 필수
- 학회원의 cohort 정보로 추적

#### details 필드 구조 (JSONB)

```json
// attendance 타입
{
  "present_count": 7,
  "late_count": 2,
  "absent_count": 2,
  "adjusted_attendance": 6,
  "required_count": 7,
  "member_type": "freshman"
}

// external_activity 타입
{
  "activity_count": 2,
  "required_count": 1
}

// assignment 타입
{
  "submission_count": 1,
  "required_count": 1,
  "affiliation": "development"
}

// participation_period 타입
{
  "total_semesters": 2,
  "required_semesters": 2,
  "cohorts": [1, 2]
}
```

#### 백엔드 구현 권장 사항

1. **학기 종료 시점에 데이터 집계**
   - 세션 status가 `completed`로 변경될 때
   - 또는 배치 작업으로 주기적 업데이트

2. **2학기 연속 조건 확인**
   ```sql
   -- 특정 criteria_type에 대해 2학기 연속 is_met = true인 학회원 조회
   SELECT
     wallet_address,
     ARRAY_AGG(cohort ORDER BY cohort) as consecutive_cohorts
   FROM semester_criteria_tracking
   WHERE criteria_type = 'attendance'
     AND is_met = true
   GROUP BY wallet_address
   HAVING COUNT(DISTINCT cohort) >= 2
     AND MAX(cohort) - MIN(cohort) = 1;  -- 연속된 기수
   ```

3. **UID 발급 조건 확인**
   - 4가지 criteria_type 모두 위의 2학기 연속 조건 만족
   - 만족 시 attestation 테이블에 UID 생성

---

## 7. Attestation 테이블

#### 목적
학회 활동 인증 기록을 관리합니다.

---

## 8. SBT Issuance 테이블

#### 목적
민팅된 SBT(Soul Bound Token)의 토큰 정보를 저장하고 관리합니다. 4개의 UID를 모두 획득한 학회원의 SBT 발급 기록을 추적합니다.

#### 데이터 흐름

1. **SBT 민팅 조건 확인**
   - attestation 테이블에서 4개 타입 모두 is_graduated = true 확인
   - 학회원당 1개의 SBT만 발급 (UNIQUE 제약)

2. **스마트 컨트랙트 호출**
   - 민팅 함수 호출 (minting contract)
   - 반환된 tokenId와 transaction_hash 수령

3. **발급 기록 저장**
   - sbt_issuance 테이블에 기록 저장
   - 향후 조회, 검증, 감시 용도

#### 백엔드 구현 권장 사항

**1. SBT 민팅 조건 확인**
```sql
-- 4개의 UID를 모두 획득하고 아직 SBT가 발급되지 않은 학회원 조회
SELECT
  a.wallet_address,
  ARRAY_AGG(DISTINCT a.attestation_type) as uid_types,
  COUNT(DISTINCT a.attestation_type) as uid_count
FROM attestation a
LEFT JOIN sbt_issuance s ON a.wallet_address = s.wallet_address
WHERE s.wallet_address IS NULL  -- SBT 미발급
  AND a.is_graduated = true
GROUP BY a.wallet_address
HAVING COUNT(DISTINCT a.attestation_type) = 4;  -- 4개 타입 모두 필요
```

**2. 스마트 컨트랙트 호출**
- 조건을 만족하는 학회원에 대해 스마트 컨트랙트의 mint 함수 호출
- 반환값: { tokenId, transactionHash, ... }

**3. 발급 기록 저장**
```sql
INSERT INTO sbt_issuance (wallet_address, token_id, contract_address, transaction_hash, minted_at)
VALUES ($1, $2, $3, $4, NOW());
```

**4. 트랜잭션 모니터링 (선택 사항)**
- transaction_hash를 통해 블록체인 트랜잭션 상태 모니터링
- 실패 시 재시도 로직 구현
- 성공 시 생성 이벤트 발생

#### 주의사항

1. **UNIQUE 제약 준수**
   - wallet_address: 학회원당 1개만 발급
   - token_id: 전역적으로 고유
   - transaction_hash: 전역적으로 고유

2. **타임스탐프 관리**
   - `minted_at`: 블록체인 확정 시간 (스마트 컨트랙트에서 제공)
   - `created_at`: 데이터베이스 기록 시간

3. **데이터 무결성**
   - 민팅 후에만 기록 저장 (사전 예약 불가)
   - 실패한 민팅 기록은 저장하지 않음
