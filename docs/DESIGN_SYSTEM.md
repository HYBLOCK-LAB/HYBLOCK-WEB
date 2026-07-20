# HYBLOCK 디자인 시스템

## 1. 기준 파일

현재 Tailwind CSS v4의 실제 토큰 기준은 `web/app/globals.css`의 `@theme`이다. `web/tailwind.config.ts`에는 이전 토큰이 남아 있고 CSS에서 `@config`로 불러오지 않으므로 새 UI와 문서는 `globals.css` 값을 따른다.

기존 컴포넌트에는 `text-monolith-primaryContainer`, `font-display`, `shadow-ambient`처럼 이전 config 이름도 남아 있다. 이 이름은 현재 `@theme`의 kebab-case token과 일치하지 않으므로 새 코드에서 복제하지 말고, 스타일 설정을 통합한 뒤 기존 사용처를 일괄 검증해야 한다.

| 토큰 | 현재 값 | 용도 |
| --- | --- | --- |
| `monolith-primary` | `#0e4a84` | 브랜드/주요 액션 |
| `monolith-primary-container` | `#002147` | 진한 강조 배경 |
| `monolith-on-primary` | `#ffffff` | 주요 배경 위 텍스트 |
| `monolith-surface` | `#fdfdfd` | 기본 화면 배경 |
| `monolith-surface-low` | `#f8f9fb` | 보조 패널 |
| `monolith-on-surface` | `#0a0c10` | 기본 텍스트 |
| `monolith-on-surface-muted` | `#64748b` | 설명 텍스트 |
| `monolith-error` | `#e11d48` | 오류/경고 |

폰트 변수는 별도 웹폰트 패키지가 아니라 시스템 fallback을 사용한다.

- display: Avenir Next, Pretendard, Noto Sans KR, Segoe UI
- body: Inter, Pretendard, Noto Sans KR, Segoe UI

푸터 소셜 아이콘은 `layout.tsx`에서 Font Awesome CDN stylesheet를 불러온다.

## 2. 시각 원칙

- 공개 사이트와 운영 도구가 같은 브랜드 컬러를 공유한다.
- 주요 CTA는 primary/primary-container 배경과 흰색 텍스트를 사용한다.
- 보조 액션은 밝은 surface와 outline border를 사용한다.
- 카드와 모달은 큰 radius, 얕은 border, `shadow-monolith` 중심으로 구성한다.
- UID, 지갑 주소, transaction hash는 줄바꿈 가능한 monospace 영역에 둔다.
- 기술 상태명보다 다음 행동과 결과를 먼저 설명한다.

## 3. 타이포그래피

- eyebrow: `font-display text-xs font-bold uppercase tracking-[0.18em~0.22em]`
- 페이지 제목: 굵은 display 계열과 음수 letter spacing
- 본문: `text-sm`~`text-lg`, `leading-7` 이상
- 식별자: `font-mono`, `break-all`

## 4. 액션 계층

### Primary

- 로그인, 지갑 연동 확정, 출석 시작, 증명/SBT 발급
- primary 단색 또는 blue gradient
- 로딩·disabled 상태를 반드시 제공

### Secondary

- 새로고침, 상세 보기, 지갑 다시 선택
- surface 배경과 outline border

### Destructive

- 공지/활동 삭제, 세션 취소처럼 결과가 명확한 경우만 error 계열 사용
- 실행 전 대상과 영향 범위를 확인

## 5. 상태와 용어

- 아직 Google 계정에 저장하지 않은 주소: `연동할 지갑`
- Supabase user metadata에 저장된 주소: `연결된 지갑`
- 서버 nonce 검증이 끝난 상태: `지갑 로그인`
- Wagmi가 단순 연결된 상태와 서버 지갑 session을 같은 의미로 쓰지 않는다.
- 출석은 `출석`, `지각`, `결석`, `미참여`로 통일한다.

Google 경로는 Google 로그인 후 지갑 연동이 필요하다. 별도로 활성 member는 Google 없이 지갑 서명 로그인만으로도 회원 기능에 접근할 수 있다.

## 6. 다국어

언어 상태는 Zustand `language-store`에 저장하고 `text-content.ts`의 한국어/영어 사전을 사용한다. 아직 모든 고정 문구가 사전으로 이동한 것은 아니므로, 새 화면에서는 같은 컴포넌트 안에 한국어와 영어가 섞이지 않도록 한다.

## 7. 컴포넌트 기준

- 공통 chrome: `web/components/SiteChrome.tsx`
- 전역 토큰: `web/app/globals.css`
- 인증 shell: `web/components/auth/AuthShell.tsx`
- 지갑 UI: `web/components/wallet/*`
- 관리자 shell: `web/components/admin/AdminSectionShell.tsx`

기존 컴포넌트와 다른 색/spacing을 추가하기 전에 `@theme` 토큰으로 표현할 수 있는지 먼저 확인한다.
