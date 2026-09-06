/**
 * 기수(cohort) <-> 학기(term) 변환 유틸.
 *
 * HYBLOCK 기수는 학기 단위로 1씩 증가한다.
 *   - 1기  = 2022학년도 1학기
 *   - 2기  = 2022학년도 2학기
 *   - 3기  = 2023학년도 1학기
 *   - ...
 *
 * 새 기수가 생겨도 `LATEST_COHORT` 숫자 하나만 올리면 되고,
 * 라벨/목록/기본값은 모두 여기서 계산한다.
 */

/** 1기의 학년도. */
export const COHORT_EPOCH_ACADEMIC_YEAR = 2022;

/** 회원가입 폼 등에서 선택 가능한 가장 높은 기수. 새 학기가 열리면 이 값만 올린다. */
export const LATEST_COHORT = 15;

export type Semester = 1 | 2;

export type CohortTerm = {
  /** 학년도 (예: 2026) */
  academicYear: number;
  /** 학기 (1 | 2) */
  semester: Semester;
};

/** 기수 번호 -> 학년도/학기 */
export function cohortToTerm(cohort: number): CohortTerm {
  const index = Math.max(1, Math.trunc(cohort)) - 1;
  return {
    academicYear: COHORT_EPOCH_ACADEMIC_YEAR + Math.floor(index / 2),
    semester: index % 2 === 0 ? 1 : 2,
  };
}

/** 학년도/학기 -> 기수 번호 */
export function termToCohort({ academicYear, semester }: CohortTerm): number {
  return (academicYear - COHORT_EPOCH_ACADEMIC_YEAR) * 2 + (semester === 1 ? 1 : 2);
}

/**
 * 특정 시점이 속한 기수.
 * 국내 학사일정 기준: 3~8월 = 1학기, 9~2월 = 2학기(1~2월은 직전 학년도).
 */
export function getCurrentCohort(now: Date = new Date()): number {
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  if (month <= 1) {
    // 1~2월: 직전 학년도 2학기
    return termToCohort({ academicYear: year - 1, semester: 2 });
  }
  if (month <= 7) {
    // 3~8월: 1학기
    return termToCohort({ academicYear: year, semester: 1 });
  }
  // 9~12월: 2학기
  return termToCohort({ academicYear: year, semester: 2 });
}

/** "9기 (26학년도 1학기)" 형태의 라벨 */
export function formatCohortLabel(cohort: number): string {
  const { academicYear, semester } = cohortToTerm(cohort);
  const shortYear = String(academicYear % 100).padStart(2, '0');
  return `${cohort}기 (${shortYear}학년도 ${semester}학기)`;
}

export type CohortOption = {
  value: string;
  label: string;
};

/**
 * 회원가입 폼용 기수 옵션 목록(최신 기수부터 내림차순).
 * 기본 상한은 `LATEST_COHORT`이며, 현재 기수가 더 크면 현재 기수까지 자동 확장한다.
 */
export function listCohortOptions(maxCohort: number = LATEST_COHORT): CohortOption[] {
  const ceiling = Math.max(maxCohort, LATEST_COHORT, getCurrentCohort(), 1);
  const options: CohortOption[] = [];
  for (let cohort = ceiling; cohort >= 1; cohort -= 1) {
    options.push({ value: String(cohort), label: formatCohortLabel(cohort) });
  }
  return options;
}

/** 회원가입 시 기본 선택값(현재 기수). */
export function getDefaultCohort(): number {
  return getCurrentCohort();
}
