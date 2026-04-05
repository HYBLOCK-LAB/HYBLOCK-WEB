# HYBLOCK Web Design System

이 문서는 현재 `web` 디렉토리의 구현을 기준으로 정리한 HYBLOCK 웹 디자인 시스템과 UI 가이드다. 목적은 새 페이지나 컴포넌트를 추가할 때 기존 화면과 톤, 구조, 인터랙션을 일관되게 유지하는 것이다.

## 1. Design Principles

- HYBLOCK는 `깔끔한 연구 조직 + 운영 도구` 톤을 유지한다.
- 브랜드 인상은 밝은 배경, 짙은 블루 포인트, 낮은 채도의 회색 표면으로 만든다.
- 기본 UI는 과한 장식보다 `명확한 정보 계층`, `정제된 카드`, `가벼운 인터랙션`에 집중한다.
- 관리 화면도 별도 제품처럼 보이게 하지 않고, 같은 디자인 언어 안에서 더 실무적인 밀도를 가진다.

## 2. Brand Foundation

### Color Tokens

기준 정의: [tailwind.config.ts](/Users/jiseopshin/Desktop/Develop/hyblock/HYBLOCK-WEB/web/tailwind.config.ts), [globals.css](/Users/jiseopshin/Desktop/Develop/hyblock/HYBLOCK-WEB/web/app/globals.css)

| Token | Value | Usage |
| --- | --- | --- |
| `monolith.primary` | `#003361` | 핵심 CTA, active 상태, 헤더 포인트 |
| `monolith.primaryContainer` | `#0e4a84` | hover, 보조 블루, gradient 종점 |
| `monolith.primaryFixed` | `#d4e3ff` | 아이콘 배경, 보조 강조면 |
| `monolith.surface` | `#f9f9fe` | 전체 배경 시작점 |
| `monolith.surfaceLow` | `#f3f3f9` | 카드/패널의 기본 배경 |
| `monolith.surfaceContainer` | `#ededf3` | 구획 분리용 중간 표면 |
| `monolith.surfaceHigh` | `#e7e8ed` | 더 강한 구분이 필요할 때 |
| `monolith.surfaceLowest` | `#ffffff` | 메인 카드, 헤더, 모달 배경 |
| `monolith.onSurface` | `#191c20` | 본문 텍스트 |
| `monolith.onSurfaceMuted` | `#53637c` | 설명문, 비활성 네비, 메타 정보 |
| `monolith.outlineVariant` | `#c2c6d1` | 약한 경계선 |
| `monolith.secondaryContainer` | `#d0e1fe` | 보조 강조 배경 |
| `monolith.error` | `#ba1a1a` | 에러 텍스트 |
| `monolith.errorContainer` | `#ffdad6` | 에러 박스 배경 |

### Background Language

- 전역 배경은 단색이 아니라 `radial-gradient + linear-gradient` 조합을 쓴다.
- 블루는 전면 채우기보다 `포인트 컬러`로 사용한다.
- 흰색 카드가 떠 보이도록 배경은 늘 아주 옅은 회청색 계열을 유지한다.

### Typography

- Display: `Space Grotesk`
- Body: `Manrope`
- 제목은 조밀하고 강하게, 본문은 여유 있게 쓴다.

권장 규칙:

- 페이지 타이틀: `font-display`, `font-black`, 강한 negative tracking
- 본문/설명: `text-sm` 또는 `text-base`, `leading-7` 이상
- 보조 라벨: uppercase + tracking 확장

## 3. Layout Rules

### Global Shell

기준 구현: [SiteChrome.tsx](/Users/jiseopshin/Desktop/Develop/hyblock/HYBLOCK-WEB/web/components/SiteChrome.tsx)

- 최대 폭은 주로 `max-w-7xl`
- 기본 수평 패딩은 `px-6`, 큰 화면에서 `lg:px-8`
- 헤더는 `sticky top-0`, 밝은 반투명 배경과 blur를 사용
- 모바일은 하단 고정 네비를 별도로 둔다

### Page Spacing

- 일반 콘텐츠 섹션: `py-12` 또는 `py-16`
- 큰 소개/관리 페이지: `lg:py-16`
- 카드 내부 패딩은 `p-5`, `p-6`, 큰 패널은 `p-8`

### Admin Layout

기준 구현: [AdminSectionShell.tsx](/Users/jiseopshin/Desktop/Develop/hyblock/HYBLOCK-WEB/web/components/admin/AdminSectionShell.tsx)

- 2단 레이아웃을 기본으로 사용한다.
- 좌측은 내비게이션 패널, 우측은 작업 패널이다.
- 최근 방향은 `테두리보다 그림자`를 우선한다.
- 관리자 화면은 공개 페이지보다 정보 밀도가 높지만 같은 색 체계를 유지한다.

## 4. Surface, Border, Shadow

### Surface Strategy

- 메인 카드: `bg-monolith-surfaceLowest`
- 보조 카드/패널: `bg-monolith-surfaceLow`
- 아주 약한 강조: `bg-monolith-primaryFixed`

### Border Strategy

- 최근 방향은 무거운 border 남발을 피한다.
- 꼭 필요할 때만 `border-monolith-outlineVariant/20` 또는 `/30` 정도를 사용한다.
- 관리자 화면은 border를 빼고 shadow로 레이어를 만든다.

### Shadow Strategy

- 기본 카드 shadow는 부드럽고 넓게 퍼지게 쓴다.
- 컬러 기반 shadow는 `rgba(0,51,97,...)` 계열을 사용한다.
- hover 시 그림자 강화 + 약간의 위로 뜨는 움직임을 같이 준다.

## 5. Radius and Shape

- 기본 모서리 감각은 둥근 편이다.
- 작은 액션 버튼: `rounded-md`, `rounded-lg`
- 일반 카드: `rounded-2xl`
- 큰 패널/관리 셸: `rounded-[2rem]`
- 지나치게 각진 UI는 현재 시스템과 어울리지 않는다.

## 6. Motion and Interaction

기준 정의: [globals.css](/Users/jiseopshin/Desktop/Develop/hyblock/HYBLOCK-WEB/web/app/globals.css)

### Shared Utility

- `.interactive-soft`
  - 버튼, 네비게이션, 작은 액션에 사용
  - hover/focus 시 `translateY(-1px)`와 부드러운 shadow 추가
- `.interactive-card`
  - 카드형 컴포넌트에 사용
  - hover/focus 시 `translateY(-3px)`와 더 강한 shadow

### Interaction Tone

- 인터랙션은 “빠르고 가볍게” 반응해야 한다.
- bounce, scale 과장, 진한 glow는 피한다.
- hover 컬러 변화보다 `표면 변화 + 그림자 + 미세 이동`이 우선이다.

## 7. Navigation Pattern

기준 데이터: [site-content.ts](/Users/jiseopshin/Desktop/Develop/hyblock/HYBLOCK-WEB/web/lib/site-content.ts), 구현: [SiteChrome.tsx](/Users/jiseopshin/Desktop/Develop/hyblock/HYBLOCK-WEB/web/components/SiteChrome.tsx)

### Public Header

- 로고는 좌측 고정
- `하이블록`은 드롭다운 트리거
- `공지사항`, `활동`, `출석 체크`는 1depth 메뉴
- 비연결 상태 우측 CTA는 `로그인`

### Admin Header

- admin에서는 브랜드 드롭다운을 제거한다
- 메뉴를 `멤버 관리 / 활동 관리 / 출석 관리`로 교체한다
- admin은 정보 접근 중심이므로 탐색 구조를 더 단순하게 유지한다

### Mobile Nav

- 모바일에서는 하단 고정 네비를 기본으로 사용한다
- 공개 영역과 admin 영역은 서로 다른 메뉴 셋을 가진다

## 8. Wallet / Auth UX

기준 구현: [WalletLoginSection.tsx](/Users/jiseopshin/Desktop/Develop/hyblock/HYBLOCK-WEB/web/components/auth/WalletLoginSection.tsx), [SiteChrome.tsx](/Users/jiseopshin/Desktop/Develop/hyblock/HYBLOCK-WEB/web/components/SiteChrome.tsx)

### Core Rules

- 지갑 연결은 로컬 커스텀 목록 대신 Reown/AppKit 모달을 직접 연다
- 연결 전 CTA 문구는 `Connect Wallet`
- 연결 후 헤더 우측은 `축약 주소 버튼 + 로그아웃 버튼`으로 분리한다
- 연결 상세 정보는 헤더에서 짧게, 계정 관리 행위는 modal에 위임한다

### Visual Rules

- 지갑 아이콘은 흰색 아이콘 단독 사용보다 `primaryFixed 배경 + primary 아이콘` 조합을 기본으로 한다
- 로그인 CTA는 일반 surface 버튼보다 더 강한 블루 gradient 버튼을 사용 가능하다
- raw 에러 문구는 직접 노출하지 않고 사용자 친화 문구로 치환한다

## 9. Component Recipes

### Primary Button

- 배경: `bg-monolith-primary`
- hover: `bg-monolith-primaryContainer`
- 텍스트: `text-white`
- 형태: `rounded-xl` 또는 `rounded-md`
- 유틸리티: `.interactive-soft`

### Secondary Surface Button

- 배경: `bg-monolith-surfaceLow` 또는 `bg-monolith-surfaceLowest`
- 경계: 약한 outline
- 텍스트: `text-monolith-onSurface`
- 사용처: 보조 액션, 토글, 링크형 버튼

### Status / Meta Chip

- active: `bg-monolith-primary text-white`
- muted: `bg-monolith-surfaceLowest text-monolith-onSurfaceMuted`
- soft emphasis: `bg-monolith-primaryFixed text-monolith-primary`

### Content Card

- 배경: `bg-monolith-surfaceLowest` 또는 `surfaceLow`
- 반경: `rounded-2xl`
- 내부 패딩: `p-5` 또는 `p-6`
- 관리자용 대형 카드면 shadow를 더 준다

### Admin Panel

- 좌측 nav: 작은 라벨 + 큰 타이틀 + 스택형 링크
- 우측 content: eyebrow + page title + description + tool area
- border 대신 shadow와 간격으로 레이어를 만든다

## 10. Content Style Guide

### Voice

- 학회/조직 톤은 단정하고 진지하게 유지한다
- 과도한 마케팅 문구보다 명확한 설명을 우선한다
- admin 설명은 기능 중심으로 더 직설적으로 쓴다

### Copy Patterns

- 섹션 eyebrow: 짧고 영어 또는 짧은 한글 태그
- 제목: 간결하고 강하게
- 설명문: 무엇을 할 수 있는지와 기대 결과를 바로 설명

예시:

- 좋은 예: `세션 관리, 활성화, 마감, QR 생성 로직을 관리자 UI로 정리한 화면입니다.`
- 피할 예: 추상적이고 기능이 보이지 않는 홍보성 문구

## 11. Do / Don't

### Do

- 밝은 surface 위에 블루 포인트를 올린다
- 카드와 패널의 깊이는 shadow와 spacing으로 만든다
- 타이틀과 본문 사이 계층을 분명히 둔다
- admin과 public UI를 분리하되 같은 토큰을 쓴다
- 인터랙션은 작고 정확하게 넣는다

### Don't

- 진한 검정 배경, 네온 계열, 과한 글로우를 쓰지 않는다
- border를 모든 컴포넌트에 습관적으로 넣지 않는다
- 순수 흰 배경 위에 흰 아이콘처럼 대비가 약한 조합을 만들지 않는다
- 페이지마다 다른 radius 체계나 다른 블루 계열을 새로 만들지 않는다
- 새로운 화면을 기존 헤더/모바일 네비 규칙과 어긋나게 만들지 않는다

## 12. Implementation Reference

- 디자인 토큰: [tailwind.config.ts](/Users/jiseopshin/Desktop/Develop/hyblock/HYBLOCK-WEB/web/tailwind.config.ts)
- 전역 배경/인터랙션 유틸리티: [globals.css](/Users/jiseopshin/Desktop/Develop/hyblock/HYBLOCK-WEB/web/app/globals.css)
- 글로벌 셸과 헤더: [SiteChrome.tsx](/Users/jiseopshin/Desktop/Develop/hyblock/HYBLOCK-WEB/web/components/SiteChrome.tsx)
- 로그인/지갑 UX: [WalletLoginSection.tsx](/Users/jiseopshin/Desktop/Develop/hyblock/HYBLOCK-WEB/web/components/auth/WalletLoginSection.tsx)
- admin 셸: [AdminSectionShell.tsx](/Users/jiseopshin/Desktop/Develop/hyblock/HYBLOCK-WEB/web/components/admin/AdminSectionShell.tsx)
- 네비게이션 데이터: [site-content.ts](/Users/jiseopshin/Desktop/Develop/hyblock/HYBLOCK-WEB/web/lib/site-content.ts)

## 13. Next Maintenance Rule

새 컴포넌트를 만들 때는 먼저 아래 순서로 맞춘다.

1. 새 색을 만들기 전에 기존 `monolith` 토큰으로 해결 가능한지 확인한다.
2. 새로운 버튼/카드가 필요하면 기존 레시피를 변형해서 만든다.
3. admin 화면은 border를 줄이고 shadow와 spacing을 우선한다.
4. 지갑, 인증, 관리자 기능은 기능보다 먼저 정보 계층과 액션 우선순위를 정리한다.