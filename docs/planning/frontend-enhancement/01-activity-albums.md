# 활동별 앨범 고도화 기획

## 1. 목표

현재 사진 단위 목록을 iOS 사진 앱처럼 시간 순서로 탐색하되, 사용자가 사진이 아니라 ‘활동’을 먼저 이해하게 만든다. 목록에서는 연도와 월 아래에 활동 앨범을 표시하고, 앨범을 누르면 별도 상세 페이지에서 설명과 전체 사진을 확인한다.

관리자는 활동을 생성하고 사진을 올리며 대표 사진을 직접 선택한다. 날짜가 확정되지 않은 활동은 잘못된 연·월에 넣지 않고 `날짜 확인 중` 영역에 분리한다.

## 2. 현재 문제와 근거

- 공개 활동 데이터는 `web/lib/site-content.ts`의 사진 28장으로 관리된다.
- 실제 활동은 8개지만 현재 화면은 사진 28개를 모두 같은 수준의 카드로 보여준다.
- 날짜가 없는 사진 7장은 네 개 활동에 걸쳐 있고 모두 `날짜 확인 중`으로 반복된다.
- 모바일 필터의 내부 너비가 화면보다 길어 마지막 항목이 잘리지만 스크롤 가능하다는 단서가 없다.
- 홈은 배열 앞의 12장을 그대로 사용해 같은 활동 사진이 반복될 수 있다.
- 원본 이미지 용량이 크고 첫 이미지에서 LCP 경고가 확인됐다.
- 기존 `/admin/activities`는 사진 관리가 아니라 출석 세션 관리 화면이다.
- 원격 `main`도 활동 페이지와 갤러리의 디자인 토큰을 수정해 현재 로컬 `ActivitiesGallery.tsx`와 실제 병합 충돌이 발생한다.

## 3. 원격 통합 제약

- 최신 `origin/main`의 디자인 시스템과 현재 활동 아카이브의 데이터·필터·다국어 기능을 모두 보존한다.
- `ActivitiesGallery.tsx`의 실제 병합 충돌을 해소해야 한다.
- Tailwind 토큰은 `surface-lowest`, `on-surface-muted`, `outline-variant` 형식을 사용한다.
- 원격 Playwright 설정에 1440px·390px 활동 회귀 검사를 포함한다.

## 4. 사용자 시나리오

### 방문자

1. 활동 페이지에 들어온다.
2. 최신 연도와 월을 먼저 본다.
3. 카테고리 또는 연도를 선택해 범위를 좁힌다.
4. 활동 카드에서 대표 사진, 제목, 날짜, 사진 수를 확인한다.
5. 활동 상세 페이지로 이동해 설명과 전체 사진을 본다.
6. 뒤로 가면 기존 필터·스크롤 맥락으로 돌아간다.

### 관리자

1. 관리자 앨범 화면에서 새 활동을 만든다.
2. 한국어·영어 제목과 설명, 카테고리, 날짜를 입력한다.
3. 여러 사진을 업로드하고 순서를 정한다.
4. 업로드된 사진 중 대표 사진을 선택한다.
5. 미리보기 후 게시한다.
6. 잘못된 정보는 수정하고, 게시 중단은 삭제 대신 상태 변경으로 처리한다.

## 5. 경로와 화면

### `/activities`

- 페이지 제목과 짧은 설명
- 카테고리 필터: 전체, 해커톤, 기초 세션, 심화 세션, 외부 활동
- 연도 선택: 전체 또는 데이터에 존재하는 연도
- 연도 제목
  - 월 제목
    - 활동 앨범 카드 그리드
- 맨 아래 `날짜 확인 중` 별도 구역
- 결과가 없을 때 필터 초기화 버튼

카드 정보:

- 관리자 지정 대표 사진
- 활동명
- 날짜 또는 `날짜 확인 중`
- 카테고리
- 사진 수

### `/activities/[slug]`

- 목록으로 돌아가기
- 활동 제목, 날짜, 카테고리, 설명
- 대표 사진
- 전체 사진 그리드
- 사진마다 대체 텍스트
- 존재하지 않거나 비공개인 앨범은 `notFound()` 처리

사진 확대 모달은 1차 필수 범위가 아니다. 상세 페이지를 먼저 완성한 뒤 별도 후속 PR에서 키보드 접근 가능한 라이트박스로 추가할 수 있다.

### `/admin/activity-albums`

- 앨범 목록과 게시 상태
- 새 앨범 생성
- 앨범 정보 수정
- 다중 이미지 업로드와 업로드 진행 상태
- 사진 순서 변경
- 대표 사진 선택
- 게시·비공개 전환

기존 `/admin/activities`의 출석 세션 기능은 변경하지 않는다.

## 6. 컴포넌트 구조

```text
ActivitiesPage (Server)
├── ActivityArchiveHeader
├── ActivityArchiveFilters (Client)
├── ActivityYearSection
│   └── ActivityMonthSection
│       └── ActivityAlbumCard
└── UndatedActivitySection

ActivityDetailPage (Server)
├── ActivityDetailHeader
└── ActivityPhotoGrid

AdminActivityAlbumsPage (Server)
└── ActivityAlbumManager (Client)
    ├── ActivityAlbumForm
    ├── ActivityImageUploader
    ├── ActivityImageSorter
    └── CoverImageSelector
```

## 7. 데이터 구조

### `activity_album`

| 필드 | 형식 | 설명 |
| --- | --- | --- |
| `id` | bigint | 내부 식별자 |
| `slug` | text unique | 상세 URL |
| `title_ko`, `title_en` | text | 다국어 제목 |
| `description_ko`, `description_en` | text | 다국어 설명 |
| `category` | text | 허용된 활동 분류 |
| `activity_date` | date nullable | 연·월 그룹화의 기준 |
| `cover_image_id` | bigint nullable | 관리자 지정 대표 사진 |
| `status` | draft/published | 공개 상태 |
| `created_by` | member FK | 생성 관리자 |
| `created_at`, `updated_at` | timestamptz | 감사 정보 |

### `activity_album_image`

| 필드 | 형식 | 설명 |
| --- | --- | --- |
| `id` | bigint | 이미지 식별자 |
| `album_id` | activity_album FK | 소속 활동 |
| `storage_path` | text unique | Storage 객체 경로 |
| `alt_ko`, `alt_en` | text | 이미지 설명 |
| `sort_order` | integer | 상세 화면 순서 |
| `uploaded_by` | member FK | 업로드 관리자 |
| `created_at` | timestamptz | 업로드 시각 |

연도와 월은 별도 저장하지 않고 `activity_date`에서 계산한다. 날짜가 `null`이면 미정 구역으로 보낸다. 대표 사진은 해당 앨범에 속한 이미지만 선택할 수 있도록 서버에서 검증한다.

## 8. 기존 데이터 이전

1. 현재 사진 28장을 활동명 기준으로 8개 앨범으로 묶는다.
2. 운영 담당자가 각 활동 날짜와 대표 사진을 확인한다.
3. 큰 PNG·JPEG 원본은 웹용 크기와 용량으로 변환한다.
4. Supabase Storage에 업로드하고 DB 레코드를 만든다.
5. 이전 결과를 확인한 뒤 공개 페이지가 DB를 읽도록 전환한다.
6. 홈 미리보기는 사진 12장이 아니라 최신 게시 앨범을 하나씩 보여주도록 바꾼다.

전환 전까지는 현재 정적 데이터를 제거하지 않는다. DB 이전 성공과 화면 검증 후 별도 PR에서 사용 중단한다.

## 9. 서버·클라이언트 경계와 API

- 공개 목록·상세 조회: Server Component에서 Supabase 조회
- 카테고리·연도 필터: URL 검색 매개변수를 바꾸는 Client Component
- 관리자 폼·업로드·정렬: Client Component
- 생성·수정·게시·삭제: 관리자 인증 Route Handler
- 파일 업로드: 허용 MIME, 개수, 용량을 서버 정책과 Storage 정책 양쪽에서 검증

예상 API:

- `GET /api/admin/activity-albums`
- `POST /api/admin/activity-albums`
- `PATCH /api/admin/activity-albums/[id]`
- `POST /api/admin/activity-albums/[id]/images`
- `PATCH /api/admin/activity-albums/[id]/images/order`
- `DELETE /api/admin/activity-albums/[id]/images/[imageId]`

앨범 삭제는 1차 버전에서 물리 삭제보다 `draft` 전환을 우선한다. Storage 파일의 실제 삭제 정책은 운영자 확인 후 확정한다.

## 10. 반응형 기준

| 화면 | 목록 | 상세 |
| --- | --- | --- |
| 1440px | 3~4열, 연·월 제목을 명확히 구분 | 사진 3~4열 |
| 768px | 2열, 필터 줄바꿈 | 사진 2~3열 |
| 390px | 1열 또는 작은 2열, 필터 전체 노출 | 사진 2열, 본문 1열 |

모바일 필터는 잘리는 가로 스크롤 대신 줄바꿈 또는 `select`를 사용한다. 앨범 카드 이미지 비율을 고정해 로딩 중 레이아웃 이동을 막는다.

## 11. 접근성·성능

- 연도는 `h2`, 월은 `h3`, 카드 제목은 논리적인 하위 제목으로 구성한다.
- 대표 사진과 상세 사진에 내용 기반 대체 텍스트를 제공한다.
- 단순 장식 이미지는 빈 대체 텍스트를 사용한다.
- 첫 화면 핵심 대표 이미지에만 우선 로딩을 적용한다.
- 썸네일 크기에 맞는 `sizes`를 지정하고 원본을 그대로 내려받지 않는다.
- 포커스 표시와 44px 수준의 모바일 터치 영역을 확보한다.
- 사진 정렬 UI는 드래그만 강제하지 않고 위·아래 이동 버튼도 제공한다.
- 원격 `DESIGN.md`의 표면·간격·CTA 원칙을 따르고 신규 임의 hex 색상이나 camelCase 토큰을 추가하지 않는다.

## 12. 상태 처리

- 로딩: 카드 크기를 유지하는 skeleton
- 빈 결과: 선택한 필터 조건과 초기화 버튼
- 오류: 다시 시도 버튼과 사용자용 설명
- 업로드 중: 파일별 진행·성공·실패 표시
- 일부 업로드 실패: 성공 파일을 숨기지 않고 실패 파일만 재시도
- 저장하지 않은 관리자 폼에서 이탈: 경고 제공

## 13. 완료 조건

- 연도 → 월 → 활동 구조로 게시 앨범을 탐색할 수 있다.
- 날짜가 없는 앨범은 별도 영역에만 나타난다.
- 카드에서 상세 페이지로 이동하고 새로고침해도 정상 표시된다.
- 관리자가 앨범과 사진을 추가하고 대표 사진을 선택할 수 있다.
- 관리자가 아닌 사용자는 앨범 변경 API를 호출할 수 없다.
- 홈에는 같은 활동 사진만 반복되지 않고 서로 다른 최신 앨범이 표시된다.
- 390px에서 필터 잘림과 페이지 가로 스크롤이 없다.
- 이미지 실패, 빈 앨범, 비공개 앨범, 잘못된 slug를 처리한다.
- 원격 Playwright 설정에서 1440px와 390px 활동 목록·상세 검사가 통과한다.
