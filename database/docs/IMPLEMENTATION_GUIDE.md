# HYBLOCK Database Implementation Guide

## 1. 목적

이 문서는 HYBLOCK 데이터베이스를 실제 구현 관점에서 어떻게 다루는지 정리한 가이드다.

HYBLOCK는 별도 수료증 서비스가 아니라 학회 홈페이지 레포이며, 이 안에 다음 기능이 함께 들어 있다.
- 회원/권한 관리
- 출석 관리
- 관리자 증명 발급
- 학회원 SBT 발급

## 2. 구현 원칙

### 원본 데이터와 발급 이력을 분리한다

원본 활동 데이터:
- `attendance_record`
- `external_activity`
- `assignment`

발급 결과 데이터:
- `attestation`
- `sbt_issuance`

이 둘을 분리해 두면 운영자가 원본 기록을 다시 보면서 발급 상태를 추적하기 쉽다.

### 회원 식별은 `member` 기준으로 맞춘다

- 웹 세션
- 관리자 권한
- 증명 발급 저장
- SBT 발급 저장

모두 최종적으로 `member.id`, `member.wallet_address`에 연결된다.

## 3. 주요 테이블별 구현 포인트

### `member`

역할:
- 회원 기본 정보 저장
- admin 여부 판단
- wallet address 매핑

구현 포인트:
- 관리자 페이지 접근은 `is_admin = true` 기준
- 지갑 로그인 이후 `wallet_address`로 회원을 찾는다
- `is_active`는 운영 중인 회원 여부 판단에 사용한다

### `attendance_session`

역할:
- 출석 가능한 세션 단위 정의

구현 포인트:
- QR 출석은 반드시 활성 세션과 연결되어야 한다
- 세션 상태 기반으로 출석 허용 범위를 제어할 수 있다

### `attendance_record`

역할:
- 출석 결과 저장

구현 포인트:
- 출석 상태는 `present`, `late`, `absent`를 사용한다
- 관리자 증명 후보 fallback 조회 시 실제 출석 기록 원본으로 사용된다

### `external_activity`

역할:
- 외부 활동 증빙 저장

구현 포인트:
- 증명 후보 조회의 raw fallback 데이터로 사용된다
- `evidence_url`은 운영 검토 시 근거 자료 역할을 한다

### `assignment`

역할:
- 산출물 기록 저장

구현 포인트:
- 관리자 증명 후보 조회 시 raw fallback 데이터로 사용된다
- `affiliation`과 함께 저장하면 팀 기준 판별에 유리하다

### `semester_criteria_tracking`

역할:
- 조건 달성 집계 결과 저장

구현 포인트:
- 현재 관리자 증명 후보 조회는 이 테이블을 우선 사용한다
- 집계가 비어 있으면 raw 데이터 fallback으로 보완한다
- 즉 현재 운영상 필수 절대값은 아니지만, 집계 결과를 저장하는 표준 위치다

### `attestation`

역할:
- EAS 증명 발급 결과 저장

구현 포인트:
- `attestation_type`, `eas_uid`, `personal_data_hash`, `revealed_data`를 저장한다
- 학회원의 SBT 자격 판정은 이 테이블 기준으로 한다
- 관리자 화면의 `기발급 증명` 목록도 이 테이블에서 조회한다

### `sbt_issuance`

역할:
- SBT 민팅 결과 저장

구현 포인트:
- `member_id` 기준으로 중복 발급 여부를 확인한다
- `token_id`, `transaction_hash`, `contract_address`를 저장한다

## 4. 현재 실제 플로우에서의 DB 사용

### 관리자 증명 발급

1. 후보 조회
   - `semester_criteria_tracking` 우선
   - 없으면 raw 활동 테이블 fallback
2. 온체인 발급
3. `attestation` 저장

### 학회원 SBT 발급

1. `attestation`에서 4종 증명 존재 여부 확인
2. `sbt_issuance`에서 기존 발급 여부 확인
3. 온체인 민팅
4. `sbt_issuance` 저장

## 5. 운영상 주의점

### 증명 후보가 비어 보이는 경우

확인 순서:
1. `semester_criteria_tracking` 데이터 존재 여부
2. raw 활동 테이블에 실제 데이터가 있는지
3. 해당 member에 이미 같은 타입 attestation이 있는지

### SBT 발급이 막히는 경우

확인 순서:
1. `attestation`에 4종이 모두 있는지
2. `sbt_issuance`가 이미 있는지
3. wallet session과 member.wallet_address가 일치하는지

## 6. 현재 비범위

이 문서는 현재 구현 기준으로 작성한다. 아래는 현재 필수 범위로 보지 않는다.
- multi-sig 기반 민팅 승인
- IPFS 메타데이터 파이프라인
- 별도 배치 기반 자동 집계 시스템

## 7. 참고 문서

- [DB 스키마](/home/jaeman/Codes/HYBLOCK-WEB/database/docs/Schema.md)
- [아키텍처](/home/jaeman/Codes/HYBLOCK-WEB/docs/ARCHITECTURE.md)
- [플로우](/home/jaeman/Codes/HYBLOCK-WEB/docs/FLOWS.md)
- [운영 가이드](/home/jaeman/Codes/HYBLOCK-WEB/docs/OPERATIONS.md)
