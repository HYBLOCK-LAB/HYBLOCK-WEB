# Design System

## 1. 목적

HYBLOCK 웹은 학회 공식 사이트와 운영 도구를 한 레포에서 함께 다룬다. 디자인 시스템의 목적은 다음 두 가지다.

- 학회 사이트 전반의 브랜드 일관성 유지
- 운영 화면에서도 같은 시각 언어를 유지하되, 상태와 액션은 더 명확하게 표현

## 2. 기본 원칙

- 브랜드 컬러는 `monolith.primary (#003361)`와 `monolith.primaryContainer (#0e4a84)`를 중심으로 사용한다.
- 주요 CTA는 흰 배경 위에서도 즉시 구분되도록 진한 블루 배경 또는 블루 그라데이션을 사용한다.
- 카드, 패널, 모달은 `rounded-[2rem]`, `border-monolith-outlineVariant/20`, `shadow-monolith` 계열을 기본으로 맞춘다.
- 보조 액션은 surface 배경과 outline border를 사용하고, 주요 액션보다 시각적 무게를 낮춘다.
- 상태 설명은 기술 구현을 그대로 노출하지 않고 사용자 행동 기준으로 쓴다.

## 3. 타이포그래피

- 섹션 eyebrow: `font-display`, `text-xs`, `uppercase`, `tracking-[0.22em]`
- 페이지/패널 제목: `font-black`, `tracking-[-0.05em]` 또는 `[-0.06em]`
- 본문 설명: `text-sm` 또는 `text-base`, `leading-7` 이상
- 주소/UID 같은 식별자는 일반 본문과 섞지 말고 줄바꿈 가능한 형태로 별도 노출한다.

## 4. 액션 계층

- Primary CTA
  - 진한 블루 또는 블루 그라데이션
  - 흰색 텍스트
  - 그림자 사용 가능
- Secondary CTA
  - surface 배경 + outline border
  - 본문색 텍스트
- Destructive / disconnect
  - primary보다 약한 무게의 neutral button으로 시작하고, 명확한 파괴 액션일 때만 강한 경고색 사용

## 5. 상태 문구 규칙

- 중간 기술 상태를 그대로 쓰지 않는다.
  - 예: `선택된 지갑`, `session metadata`, `wallet session`
- 사용자 관점 용어를 쓴다.
  - `연결된 지갑`
  - `연동할 지갑`
  - `이 지갑으로 연동 완료`
- 한 화면에서 같은 대상을 두 개의 라벨로 부르지 않는다.

## 6. 지갑 연동 화면 규칙

- 지갑이 아직 계정에 저장되지 않았으면 `연동할 지갑`으로 표기한다.
- 계정에 저장된 뒤에는 `연결된 지갑`만 보여준다.
- `지갑 다시 선택`은 잘못 연결한 경우를 위한 보조 액션으로만 둔다.
- 출석 용도에서는 `Google 로그인 + 1회 지갑 연동`을 완료 조건으로 설명한다.

## 7. 현재 반영 상태

- wallet-link 화면은 위 규칙에 맞춰 상태 문구를 정리했다.
- 출석 접근은 linked wallet이 없는 Google 계정을 wallet-link로 보낸다.
- 주요 wallet CTA는 블루 그라데이션 버튼으로 통일했다.
