---
version: "alpha"
name: HYBLOCK Academic Monolith
description: A structured, credible visual system for HYBLOCK's public academic pages and operational tools.
colors:
  primary: "#0E4A84"
  primary-container: "#002147"
  on-primary: "#FFFFFF"
  surface: "#FDFDFD"
  surface-low: "#F8F9FB"
  surface-container: "#F1F3F7"
  surface-high: "#E9ECF1"
  surface-lowest: "#FFFFFF"
  on-surface: "#0A0C10"
  on-surface-muted: "#64748B"
  outline-variant: "#E2E8F0"
  secondary-container: "#E0E7FF"
  on-secondary-container: "#0E4A84"
  primary-fixed: "#DBEAFE"
  error: "#E11D48"
  error-container: "#FFDAD6"
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 3.75rem
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: -0.06em
  title-md:
    fontFamily: Space Grotesk
    fontSize: 2rem
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: -0.04em
  body-lg:
    fontFamily: Manrope
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 2rem
  body-md:
    fontFamily: Manrope
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.75rem
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 0.75rem
    fontWeight: 700
    lineHeight: 1rem
    letterSpacing: 0.18em
rounded:
  control: 8px
  card: 12px
  panel: 16px
  pill: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  section: 64px
  section-lg: 96px
components:
  page:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
  section-muted:
    backgroundColor: "{colors.surface-low}"
    textColor: "{colors.on-surface}"
    padding: "{spacing.section}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
    height: 44px
    padding: 16px
  button-primary-hover:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.control}"
    height: 44px
    padding: 16px
  button-secondary-hover:
    backgroundColor: "{colors.surface-high}"
    textColor: "{colors.primary}"
  card:
    backgroundColor: "{colors.surface-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.card}"
    padding: "{spacing.xl}"
  panel-dark:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.panel}"
    padding: "{spacing.xl}"
  badge-info:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    rounded: "{rounded.pill}"
    padding: 8px
  icon-tint:
    backgroundColor: "{colors.primary-fixed}"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
    size: 44px
  status-error:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: 8px
  error-panel:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.card}"
    padding: "{spacing.md}"
  text-muted:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.body-md}"
  divider:
    backgroundColor: "{colors.outline-variant}"
    height: 1px
---

## Overview

HYBLOCK의 시각 언어는 **Academic Monolith**다. 학술 동아리의 신뢰감과 블록체인의 구조적 이미지를 결합하며, 자신감 있는 학술 간행물과 절제된 기술 콘솔의 중간 지점을 지향한다.

- **Structured:** 명확한 그리드, 큰 제목, 충분한 구획으로 우선순위를 먼저 보여준다.
- **Progressive:** 짙은 블루와 높은 명도 대비로 기술적이고 전진하는 인상을 만든다.
- **Credible:** 장식보다 가독성, 예측 가능한 상태, 정확한 정보 전달을 우선한다.
- **Purposeful density:** 소개 페이지는 호흡이 넓고, 폼과 운영 화면은 더 조밀하되 답답하지 않아야 한다.

HYBLOCK은 일반적인 SaaS 스타터처럼 보여서는 안 된다. 모든 콘텐츠를 같은 카드에 넣거나, 보라색 계열 그라데이션·과도한 glassmorphism·의미 없는 장식 도형으로 기술적인 분위기를 대신하지 않는다.

## Colors

실제 Tailwind v4 토큰의 기준은 `web/app/globals.css`의 `@theme`다. 이 문서와 코드가 다르면 임의로 한쪽을 덮어쓰지 말고 불일치를 먼저 확인한다.

- **Primary**는 핵심 CTA, 활성 내비게이션, 중요한 링크·아이콘과 의도적인 대형 브랜드 히어로에 사용한다. 모든 구분선, 정보 배너, 카드 배경에 장식적으로 반복하지 않는다.
- **Primary Container**는 표 헤더, 어두운 사이드 패널처럼 구조를 만드는 짙은 면에 사용한다. Primary CTA와 경쟁하는 두 번째 강조 버튼으로 사용하지 않는다.
- **Surface 단계**로 화면의 깊이를 만든다. 흰 카드만 반복하지 말고 페이지·섹션·컨테이너의 명도 차이를 먼저 사용한다.
- **Primary Fixed / Secondary Container**는 아이콘 배경이나 작은 정보 배지처럼 낮은 강도의 강조에만 사용한다.
- **Error와 상태색**은 실제 상태 의미가 있을 때만 사용한다. 브랜드를 표현하기 위해 초록·주황·빨강을 사용하지 않으며, 색만으로 상태를 전달하지 않는다.
- 한 의사결정 영역에는 지배적인 Primary CTA를 하나만 둔다. 독립된 행이나 반복 항목처럼 행동 단위가 분리된 경우만 예외다.
- 기존 토큰으로 표현할 수 있는 색을 새 hex 값으로 추가하지 않는다. 새 색이 범용적으로 필요하면 검토·테스트 후 토큰과 이 문서를 함께 갱신한다.

## Typography

- **Space Grotesk:** 영문 display, 짧은 eyebrow, 숫자, 제목에 사용한다.
- **Manrope:** 한글과 영문 본문, 폼, 내비게이션, 메타 정보에 사용한다.
- H1은 굵고 좁은 자간으로 명확한 시작점을 만든다. 모든 제목과 본문을 같은 무게로 굵게 만들지 않는다.
- uppercase와 넓은 자간은 짧은 영문 레이블에만 사용한다. 긴 한글 문장이나 폼 설명에는 적용하지 않는다.
- 한글 제목에는 `break-keep`을 우선 적용한다. 본문에는 음수 자간을 사용하지 않고 `leading-7`~`leading-9`의 읽기 리듬을 유지한다.
- 버튼의 영문+한글 혼합 문구는 짧을 때 `whitespace-nowrap`과 중앙 정렬을 사용한다. 긴 문구는 억지로 한 줄에 가두지 않는다.

## Layout

- 기본 콘텐츠 폭은 `max-w-7xl`, 좌우 여백은 `px-6 lg:px-8`이다.
- 일반 섹션은 `py-16 lg:py-24`, 강조 섹션은 최대 `py-20 lg:py-28`을 기준으로 한다.
- 마케팅 화면은 12열 히어로와 2~3열 가치 카드, 문서 화면은 `max-w-2xl`~`max-w-3xl` 본문, 폼은 단계 안내와 입력 영역, 운영 화면은 KPI와 표를 조합한다.
- 이 조합은 출발점이지 고정 템플릿이 아니다. 콘텐츠와 사용자 과업에 따라 열 비율과 밀도를 조절한다.
- 390px에서는 한 열, 768px부터 필요한 2열, 1280px 이상에서 12열을 사용한다. 페이지 전체 가로 스크롤은 금지하고 넓은 표만 내부에서 스크롤한다.
- 빈 상태는 큰 공백 속 작은 `No data` 한 줄로 끝내지 않는다. 원인이나 현재 상태를 설명하고, 해결 행동이 있으면 하나의 명확한 CTA를 제공한다.
- 긴 제목, 여러 줄 레이블, 빈 데이터, 오류 메시지, 로딩 상태에서도 레이아웃이 무너지지 않아야 한다.

## Elevation & Depth

기본 화면은 평평하고 조용해야 한다. 깊이는 Surface 명도와 1px Outline 경계로 만들고, 그림자는 계층이 실제로 필요한 요소에만 사용한다.

- 일반 카드와 표에는 경계선 또는 Surface 대비를 사용한다. 모든 카드에 강한 그림자를 적용하지 않는다.
- `shadow-monolith`은 독립적으로 떠 있는 주요 패널, 모달, 선택된 강조 요소처럼 제한된 곳에만 사용한다.
- Primary CTA의 낮은 블루 그림자는 허용하지만, 같은 화면의 보조 버튼에는 같은 깊이를 주지 않는다.
- hover 이동은 `.interactive-soft`의 1px 이내로 제한한다. 큰 scale 변화나 튀는 모션을 반복하지 않는다.
- 그라데이션은 블루 계열의 대형 브랜드 히어로 배경에서만 절제해 사용할 수 있다. 버튼, 상태 배지, 일반 카드에는 사용하지 않는다.

## Shapes

- 작은 컨트롤은 8px, 카드 12px, 주요 패널 16px를 기본으로 한다.
- pill 형태는 짧은 CTA, 상태 배지, 필터처럼 형태의 의미가 분명한 요소에만 사용한다.
- 한 화면에서 같은 역할의 컴포넌트는 같은 radius를 사용한다. 임의의 `rounded-[Npx]`를 새 패턴처럼 확산하지 않는다.
- 카드 안에 카드가 반복될수록 radius와 경계를 한 단계 낮춰 계층을 분명히 한다.

## Components

- **Site chrome:** 일반 페이지는 `SiteChrome`을 사용해 헤더·푸터·언어 전환 흐름을 유지한다.
- **Buttons:** 최소 높이 44px, `inline-flex items-center justify-center`로 레이블을 중앙 정렬한다. Secondary는 중립 배경과 얇은 경계로 조용하게 표현하며 Primary와 경쟁하지 않는다.
- **Cards:** 흰 배경에는 경계선 또는 주변 Surface 대비를 둔다. 카드 하나의 시각 강조는 아이콘, 왼쪽 선, 숫자 중 한 곳에 집중한다. 모든 콘텐츠를 동일한 카드 그리드로 만들지 않는다.
- **Forms:** 레이블은 입력 위에 두고 focus는 Primary 경계와 옅은 링으로 표현한다. 오류는 입력 바로 아래에서 텍스트와 색을 함께 사용한다.
- **Tables:** 헤더는 Primary Container 또는 옅은 Surface 구획을 사용한다. 숫자와 날짜는 빠르게 스캔할 수 있게 정렬하고, 모바일에서는 표 컨테이너만 가로 스크롤한다.
- **Status:** 배지는 항상 상태 텍스트를 포함한다. 장식용 배지와 실제 상태 배지를 같은 강도로 만들지 않는다.

대표 패턴은 `/design-lab`, `/design-lab/editorial`, `/design-lab/application`, `/design-lab/dashboard`에서 확인한다. 이 페이지들은 참고 구현이며 모든 새 화면을 같은 구조로 복제하기 위한 템플릿은 아니다.

## Do's and Don'ts

### Do

- 공통 토큰과 기존 컴포넌트를 먼저 사용하고, 의도적인 차이는 콘텐츠와 과업으로 설명한다.
- 강한 제목, 조용한 보조 텍스트, 하나의 중심 행동으로 정보 위계를 만든다.
- 390px과 1440px에서 긴 텍스트·빈 상태·오류 상태를 함께 확인한다.
- 버튼과 입력의 44px 터치 영역, 키보드 focus, WCAG AA 대비를 유지한다.
- 상태를 색과 텍스트로 함께 전달하고 장식 아이콘에는 `aria-hidden="true"`를 사용한다.

### Don't

- Primary를 모든 배경, 구분선, 아이콘에 범용 accent처럼 사용하지 않는다.
- 모든 섹션을 동일한 흰 카드, 동일한 그림자, 동일한 3열 그리드로 만들지 않는다.
- 버튼·카드·배지마다 서로 다른 radius와 그림자를 즉흥적으로 추가하지 않는다.
- 버튼이나 카드에 장식용 그라데이션, 과한 blur, glassmorphism을 사용하지 않는다.
- 모바일 표의 모든 열을 억지로 압축하거나 페이지 전체를 가로 스크롤시키지 않는다.
- 기존 화면 하나에서 발견한 일회성 스타일을 곧바로 범용 규칙으로 승격하지 않는다.

## Agent Instructions

UI를 생성하거나 수정할 때 이 문서를 기본 판단 기준으로 사용한다. 다만 현재 디자인은 완전히 고정된 체계가 아니므로 이 문서를 절대적인 잠금 규칙으로 취급하지 않는다. 사용자의 명시적 요구, 접근성, 과업 특성에 따른 합리적인 변형은 허용하며 그 이유를 설명한다.

범용 디자인 변경은 토큰, 공통 컴포넌트 상태, 전역 타이포그래피·여백·radius, 두 페이지 이상에서 반복될 패턴을 뜻한다. 이런 변경은 다음 순서를 따른다.

1. 영향받는 화면과 기존 규칙을 확인하고, 변경이 일회성인지 범용적인지 구분한다.
2. 브랜드 인상이나 공통 규칙을 바꾸는 경우 사용자 또는 팀의 충분한 확인을 받는다.
3. 관련 디자인 랩을 포함해 서로 다른 페이지 유형에서 구현하고 390px·1440px 화면을 육안 검수한다.
4. `web`에서 `npm run build`와 `npm run test:design`을 실행하고, 새 규칙이 기존 테스트에 없으면 회귀 검사를 추가한다.
5. 재사용 가능한 패턴으로 확인된 뒤에만 토큰·제약·예외를 `DESIGN.md`에 반영한다.

국소 실험이나 특정 페이지의 예외는 바로 문서 규칙으로 만들지 않는다. 확신이 없으면 기존 문서를 기본값으로 사용하되, 필요한 차이를 코드와 작업 설명에 남기고 문서는 유지한다. 문서와 실제 UI가 충돌하면 한쪽을 기계적으로 강제하지 말고 대표 화면과 사용 목적을 확인한 뒤 정합성을 맞춘다.
