# HYBLOCK DB 구현 가이드

## 1. 데이터 원칙

### 회원 식별

- 내부 조인과 발급 이력은 `member.id`를 사용한다.
- 로그인 외부 식별자는 `member.wallet_address`다.
- Google user와 member는 `user_metadata.wallet_address`를 매개로 애플리케이션에서 연결한다.
- Supabase Auth user ID를 `member`에 저장하는 컬럼이나 FK는 없다.

### 원본·집계·발급 분리

| 계층 | 데이터 |
| --- | --- |
| 원본 | `attendance_record`, `external_activity`, `member.has_assignment`, 회원 활동 기간 |
| 집계 | `semester_criteria_tracking` |
| EAS 발급 | `attestation` |
| SBT 발급 | `sbt_issuance` |

집계가 없어도 관리자 후보 화면은 원본 fallback을 사용한다. 그러나 SBT 최종 자격은 원본/집계가 아니라 attestation 네 타입이다.

## 2. Supabase client

### 서버 DB client

`web/lib/supabase.ts`는 다음 우선순위로 key를 읽는다.

1. `SUPABASE_SERVICE_ROLE_KEY`
2. `SUPABASE_SECRET_KEY`
3. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. `NEXT_PUBLIC_SUPABASE_ANON_KEY`

운영 Route Handler의 쓰기와 관리자 조회에는 서버 전용 key를 사용한다. 공개 key fallback은 로컬 설정 누락을 숨길 수 있으므로 운영값으로 의존하지 않는다.

### 브라우저 Auth client

브라우저 client는 publishable/anon key만 사용하고 Google session을 유지한다. DB 관리자 CRUD는 브라우저 Supabase client로 직접 수행하지 않고 Next.js API를 거친다.

### access token 검증 client

개인 QR API는 Bearer token을 서버의 Supabase Auth client로 검증한 뒤 user metadata를 사용한다.

## 3. 회원 생성과 권한

`POST /api/members`:

- 지갑 주소 형식을 검사하고 소문자로 저장한다.
- 이름, 전공, development/business, 1 이상 기수를 요구한다.
- `role=member`, `period_start=now`, `is_active=true`, `has_assignment=false`로 만든다.
- 현재 요청 자체에 서명 session이나 Google access token을 요구하지 않는다.

관리자:

- `is_admin`은 DB에서 별도로 설정한다.
- 보호 요청마다 session 주소로 member를 다시 읽는다.
- `is_active=false` 또는 `is_admin=false`가 되면 다음 요청부터 접근이 거부된다.

## 4. 세션과 출석

### 세션 CRUD

`/api/activities`가 `attendance_session`을 생성·수정·삭제한다. `advanced`만 target affiliation을 저장하며 다른 타입은 null로 정규화한다.

### 활성화

- 기본 출석 창: 20분
- code: 6자리
- 지각 경계: session start + 10분
- 만료/완료: 상태 completed, code 제거, 미기록 대상 회원 absent 생성

심화 세션의 대상 회원은 `member.affiliation`으로 필터링한다. 기본/기타/외부/해커톤은 전체 활성 회원을 대상으로 한다.

### 중복과 상태 수정

- DB unique `(session_id, member_id)`
- QR·코드 체크인은 기존 레코드가 있으면 중복 insert하지 않는다.
- 관리자 수동 변경은 upsert를 사용한다.
- `nonParticipation`은 delete다.

## 5. 증명 후보

`getCertificateCandidates(type)`은 두 결과를 합친다.

1. `semester_criteria_tracking`에서 같은 type, `is_met=true`
2. 타입별 원본 fallback

fallback 규칙:

| 타입 | 기준 |
| --- | --- |
| `attendance` | present/late 원본이 한 건 이상 있는 회원 |
| `external_activity` | external_activity가 한 건 이상 있는 회원 |
| `assignment` | `member.has_assignment=true` |
| `participation_period` | active member, 운영자 수동 검토 |

같은 타입 attestation이 있으면 후보에서 제외한다. tracking 후보와 fallback 후보가 겹치면 같은 wallet 주소로 병합하고 tracking detail을 우선한다.

후보 조회 자체의 attendance 최소치는 없다. 별도로 마이페이지의 조건 현황은 core basic/advanced present·late 6건 이상을 attendance 충족으로 표시한다. 이 표시 기준과 attestation 발급 후보 기준을 동일 정책으로 맞출 필요가 있다.

## 6. EAS 저장

on-chain 발급과 DB 저장은 하나의 원자적 트랜잭션이 아니다.

1. 클라이언트 지갑이 `HyblockIssuer.issue`를 보낸다.
2. receipt에서 EAS UID를 파싱한다.
3. 관리자 API가 wallet 주소로 member를 조회한다.
4. `attestation`을 insert한다.

chain 성공 후 insert가 실패할 수 있다. `eas_uid`와 `(member_id, attestation_type)` unique constraint가 중복을 막지만 자동 reconciliation job은 없다.

## 7. SBT 자격과 저장

`getSbtEligibility`는 화면 설명용 조건과 최종 민팅 조건을 따로 계산한다.

### 조건 현황 표시

- 이미 발급된 attestation 타입
- tracking `is_met=true`
- core session 출석 6건 이상
- external activity 또는 external/hackathon 출석 한 건 이상
- `member.has_assignment=true`

### 최종 민팅 가능

- `attestation` 네 타입 모두 존재
- `sbt_issuance` 없음

서버 민팅 후 receipt의 token ID를 `sbt_issuance`에 insert한다. 민팅 성공과 insert 사이에도 원자성이 없으므로 tx hash 기반 복구 절차가 필요하다.

## 8. 공지와 정적 콘텐츠

- `/notices`와 `/admin/notices`는 `notice`를 공유한다.
- 공지 이미지 업로드 기능은 없고 URL 배열만 저장한다.
- 홈 공지 요약은 `site-content.ts`의 정적 배열이다.
- `/activities` 앨범은 `public/Album`의 정적 파일 목록이다.
- 관리자 activity CRUD는 `attendance_session`을 다루며 공개 앨범과 연결되지 않는다.

## 9. 레거시 호환 코드

세션 query 일부는 `check_in_code` 또는 `target_affiliation` 컬럼이 없는 DB의 PostgREST 오류를 감지해 컬럼을 뺀 query로 재시도한다. 모든 migration이 적용된 신규 환경에서는 fallback이 필요하지 않다.

`assignment` 테이블도 초기 설계 흔적이다. 현재 운영 모델을 유지한다면 마이그레이션/문서에서 deprecated로 확정하고, 증빙이 필요하다면 반대로 Web CRUD를 복구해 `has_assignment` boolean을 파생값으로 바꾸는 선택이 필요하다.

## 10. 운영 체크리스트

- migration 순서와 두 개의 `008` 확인
- server service role key 확인
- member wallet 주소의 유일성·정규화 확인
- 관리자 `is_active`, `is_admin` 확인
- advanced target affiliation 누락 확인
- tracking 자동 계산 job이 없음을 인지
- on-chain/DB 저장 불일치 모니터링
- RLS/backup/retention 정책을 Supabase 프로젝트에서 별도 확인

## 11. 관련 문서

- [스키마](Schema.md)
- [운영 가이드](../../docs/OPERATIONS.md)
- [아키텍처](../../docs/ARCHITECTURE.md)
- [플로우](../../docs/FLOWS.md)
