# HYBLOCK

HYBLOCK 학회 공식 웹사이트와 운영 도구를 함께 관리하는 저장소다. 공개 홈페이지뿐 아니라 회원 가입·인증, 세션/출석 운영, EAS 증명 발급, SBT 수료증 발급까지 포함한다.

> 문서 기준일: 2026-07-17. 문서의 “현재”는 저장소에 커밋된 소스와 마이그레이션을 기준으로 한다.

## 현재 구현 범위

- 공개 사이트: 소개, 회칙, 공지 목록/검색/상세, 활동 사진, 개인정보처리방침, 이용약관
- 회원: Google OAuth, Google 계정-지갑 연동, 지갑 서명 로그인, 지갑 기반 회원 가입, 마이페이지
- 출석: 세션 생성/활성화, 6자리 출석 코드, 45초 개인 QR, 관리자 카메라·이미지 QR 스캔, 출석 상태 수동 보정
- 관리자: 회원 산출물 상태, 공지, 활동/세션, 출석, EAS 증명 관리
- 블록체인: `HyblockIssuer`를 통한 EAS 증명 발급, 서버 소유자 지갑을 통한 `HyblockSBT` 민팅

## 저장소 구성

| 경로 | 역할 |
| --- | --- |
| `web` | Next.js App Router 기반 공개·회원·관리자 웹과 Route Handlers |
| `database` | Supabase Postgres 마이그레이션과 스키마 문서 |
| `eas` | Foundry 기반 Solidity 컨트랙트, 배포 스크립트, 테스트 |
| `docs` | 전체 아키텍처, 기술 스택, 플로우, 운영 문서 |

## 빠른 시작

### Web

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Supabase 마이그레이션과 Google OAuth redirect URL, Reown project ID, Upstash Redis, 체인 관련 환경변수를 먼저 준비해야 전체 기능을 사용할 수 있다. 상세 순서는 [운영 가이드](docs/OPERATIONS.md)를 참고한다.

### Contracts

```bash
git submodule update --init --recursive
cd eas
cp .env.example .env
forge build
forge test
```

## 문서

- [아키텍처](docs/ARCHITECTURE.md)
- [현재 기술 스택](docs/TECH_STACK.md)
- [사용자·운영 플로우](docs/FLOWS.md)
- [운영 및 배포 가이드](docs/OPERATIONS.md)
- [디자인 시스템](docs/DESIGN_SYSTEM.md)
- [Web 패키지](web/README.md)
- [지갑 세션과 QR 출석](web/docs/wallet-session-and-qr-attendance.md)
- [DB 스키마](database/docs/Schema.md)
- [DB 구현 가이드](database/docs/IMPLEMENTATION_GUIDE.md)
- [스마트 컨트랙트](eas/docs/contracts.md)

## 현재 구현에서 구분해야 할 것

- `assignment` 테이블 마이그레이션은 남아 있지만 웹 런타임은 산출물 판정에 `member.has_assignment`를 사용한다.
- `ActivityTracker`와 `HyblockResolver`는 컨트랙트/배포 코드에 포함되지만 웹에서 활동 데이터를 동기화하거나 직접 호출하는 파이프라인은 없다.
- 공개 활동 사진과 홈의 요약 공지는 정적 데이터다. `/notices`와 관리자 공지 화면만 Supabase `notice` 테이블을 사용한다.
- 관리자 권한과 SBT 민팅은 Google 세션이 아니라 서버의 지갑 세션 쿠키를 기준으로 한다.

## 어드민 증명 발급(SBT) 개선 정리 — `improve/admin-certificates`

> 작성일: 2026-07-29. 관리자 증명 발급 화면(`/admin/certificates`)과 관련 API·DB 코드를 리뷰하면서 찾은 문제 4가지를 수정했다.
> 변경 파일 3개, +175 / −91줄, 전체 타입체크(`tsc --noEmit`) 0 에러 통과.

### 한눈에 보기

| 순서 | 개선 내용 | 영역 | 수정 파일 |
| --- | --- | --- | --- |
| 1 | 발급 결과에 **easscan 링크** 추가 — 온체인 기록을 클릭 한 번으로 확인 | 프론트 UX | `web/components/admin/CertificateManager.tsx` |
| 2 | SBT 자격 조회 API의 **입력 검증·에러 노출·와일드카드** 문제 수정 | 보안 | `web/app/api/certificates/sbt-eligibility/route.ts`, `web/lib/supabase-certificate.ts` |
| 3 | "참여 기간" 발급 후보에 **전체 활성 멤버가 뜨던 문제**(오발급 위험) 제거 | DB 로직 | `web/lib/supabase-certificate.ts` |
| 4 | 온체인 발급 성공 후 **DB 저장 실패 시 UID 유실·중복 발급 위험** 해결 | 프론트 상태 | `web/components/admin/CertificateManager.tsx` |

### 배경: 증명 발급이 동작하는 순서

핵심은 **블록체인 기록이 먼저, DB 기록이 나중**이라는 점이다.

```
관리자가 멤버 선택
→ 지갑 서명으로 온체인 발급 (HyblockIssuer.issue)
→ tx 확정 후 Attested 이벤트에서 UID 추출
→ POST /api/certificates/save-attestation 으로 UID를 DB에 저장
→ 기발급 목록 갱신
```

블록체인에 쓴 기록은 되돌릴 수 없고, DB 기록은 다시 시도할 수 있다. 이 성질 차이가 개선 4의 핵심 배경이다.

### 개선 1 — 발급 결과에 easscan 링크 추가

발급이 끝나면 화면에 EAS UID 문자열만 표시됐다. 온체인 기록을 확인하려면 관리자가 easscan 주소를 직접 조합해야 했다.
UID로 easscan 조회 URL을 만드는 헬퍼를 추가하고, 발급 정보 카드에 "easscan에서 보기" 링크를 달았다.

```tsx
function easscanAttestationUrl(uid: string): string {
  // 이 프로젝트 기본 체인은 Sepolia. (심화: 연결된 chainId에 따라 도메인 분기)
  return `https://sepolia.easscan.org/attestation/view/${uid}`;
}
```

easscan 도메인은 체인마다 다르다(Sepolia는 `sepolia.easscan.org`, 메인넷은 `easscan.org`). 지금은 프로젝트 기본 체인인 Sepolia로 고정했다.

### 개선 2 — SBT 자격 조회 API 보안 강화

`/api/certificates/sbt-eligibility`는 **로그인 없이 누구나 호출할 수 있는 공개 API**인데,

1. 지갑 주소 형식을 검증하지 않았고
2. 서버 내부 에러 메시지를 그대로 응답에 노출했으며
3. DB 조회에 쓴 `ilike`가 `%`, `_`를 와일드카드로 해석해 `?wallet=%` 같은 입력이 전체 멤버에 매칭될 수 있었다.

```diff
- if (!walletAddress) {
-   return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
+ if (!walletAddress || !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
+   return NextResponse.json({ error: '유효하지 않은 지갑 주소입니다.' }, { status: 400 });
  }

- } catch (error: any) {
-   console.error('SBT Eligibility Check Error:', error.message);
-   return NextResponse.json({ error: error.message }, { status: 500 });  // 내부 정보 노출!
+ } catch (error) {
+   console.error('GET /api/certificates/sbt-eligibility error:', error);  // 서버 로그에만
+   return NextResponse.json({ error: 'SBT 자격 정보를 불러오지 못했습니다.' }, { status: 500 });
  }
```

```diff
  .select('id, has_assignment')
- .ilike('wallet_address', walletAddress)
+ .eq('wallet_address', walletAddress.toLowerCase())
  .maybeSingle<...>();
```

`eq + toLowerCase`로 바꿔도 안전한 이유: 회원 생성 코드(`lib/supabase-member.ts`)가 지갑 주소를 `.trim().toLowerCase()`로 항상 소문자로 저장하고 있음을 확인했다.

**팀 규칙으로 기억하자** — ① 공개 API일수록 입력 검증을 더 엄격하게 ② 서버 에러 원문은 `console.error`로 로그에만 남기고 사용자에겐 일반 메시지만 ③ 사용자 입력을 `ilike`에 바로 넣지 않기.

### 개선 3 — "참여 기간" 발급 후보 정리

발급 후보는 원래 `semester_criteria_tracking`에서 조건 충족(`is_met=true`)으로 기록된 멤버가 뜨는 구조인데, 보조(fallback) 로직이 참여 기간 유형에서는 **조건과 무관하게 모든 활성 멤버를 후보로 반환**했다. 관리자가 목록만 믿고 발급하면 자격 미달자에게 증명이 나갈 수 있었다.

출석·외부활동·산출물은 원시 기록으로 자동 판정이 가능하지만, 참여 기간은 학기 단위 판단이라 tracking 테이블이 유일한 신뢰 기준이다. 그래서 참여 기간의 fallback을 제거했다.

```diff
- // participation_period: 모든 활성 멤버를 조회해서 후보로 반환 (약 24줄)
+ // participation_period: 학기 단위 판단이라 원시 레코드로 자동 판정할 수 없다.
+ // 유일한 권위 출처인 semester_criteria_tracking(is_met=true)에 기록된 멤버만
+ // 후보가 된다. 모든 활성 멤버를 반환하면 오발급 위험이 있으므로 fallback을 두지 않는다.
+ return [];
```

**동작 변화**: "참여 기간" 탭의 발급 대기 목록이 이전보다 짧아지거나 비어 보일 수 있다. 버그가 아니라 tracking 데이터가 입력된 멤버만 정직하게 보여주는 것이다. 후보가 안 뜨면 tracking 데이터 입력 여부를 먼저 확인한다.

### 개선 4 — 온체인 발급 성공 + DB 저장 실패 시 복구 흐름

발급은 ① 온체인 기록(되돌릴 수 없음) → ② DB 저장(재시도 가능) 순서다. ②가 실패하면 체인에는 증명이 존재하는데 DB엔 기록이 없는 상태가 된다. 기존 코드는 이때 에러 메시지만 띄우고 UID를 버렸다. 멤버는 발급 대기 목록에 계속 남으니, 관리자가 또 발급하면 **중복 온체인 증명 + 가스비 낭비**로 이어진다.

해결 구조 — "저장만 다시 시도":

- DB 저장에 필요한 값(UID 포함)을 고아 증명(orphaned) 상태로 보존한다.
- 화면에 경고 카드를 띄운다: UID + easscan 링크 + **"DB 저장 다시 시도" 버튼**.
- 이 상태에서는 일반 "증명 발급" 버튼을 숨겨 실수로 온체인에 또 발급하는 것을 차단한다.
- 저장 로직을 `persistAttestation()` 함수로 분리해 최초 저장과 재시도가 같은 코드를 쓴다.

```tsx
type AttestState = 'idle' | 'signing' | 'pending' | 'success' | 'error' | 'save_failed';

// 온체인 발급은 성공했으나 DB 저장이 실패한 "고아" 증명. 온체인 재발급 없이
// 저장만 재시도하기 위해 저장에 필요한 값을 모두 보존한다.
type OrphanedAttestation = {
  candidate: CertificateCandidate;
  type: CertificateType;
  uid: Hex;
  personalDataHash: Hex;
  revealedData: Record<string, unknown>;
};
```

```tsx
// persistAttestation 핵심 부분
// 409 = 이미 DB에 저장됨. 이전 저장이 성공했으나 응답만 유실된 경우 등으로
// 사실상 해결된 상태이므로 성공으로 처리한다.
if (!res.ok && res.status !== 409) {
  throw new Error(json.error ?? '증명 저장에 실패했습니다.');
}
```

**왜 409를 성공으로 처리하나**: DB에는 저장됐는데 응답만 네트워크에서 유실되는 경우가 있다. 재시도하면 중복 방지 제약(`UNIQUE(member_id, attestation_type)`) 때문에 409가 돌아오는데, 이는 "이미 잘 저장돼 있다"는 뜻이다. 409를 에러로 취급하면 관리자는 영원히 실패 화면에 갇힌다.

**운영 시 행동 요령**: "온체인 발급은 완료됐지만 DB 저장에 실패했습니다"라는 노란 카드가 보이면 **절대 다시 발급하지 말고**, 카드의 "DB 저장 다시 시도" 버튼만 누른다. UID와 easscan 링크가 카드에 함께 표시된다.

### 검증 상태

- TypeScript 전체 타입체크(`tsc --noEmit`): 0 에러
- 개발 서버에서 `/admin/certificates` 정상 컴파일·응답(HTTP 200) 확인
- 새 환경변수 요구 없음 — Vercel 설정 변경 없이 배포 가능
- 실제 발급 화면에서의 동작 확인(개선 1·4)은 Supabase + 관리자 지갑 로그인 환경이 필요해 아직 못 했다. 머지 전 실환경 테스트를 권장한다.
