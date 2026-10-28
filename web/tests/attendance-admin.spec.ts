import { expect, test } from '@playwright/test';
import { createHmac } from 'node:crypto';

const eventName = '기본 1';
const address = '0x1111111111111111111111111111111111111111';

test.beforeEach(async ({ context, page }) => {
  const raw = JSON.stringify({ address, memberId: 1, expiresAt: Date.now() + 600000 });
  const signature = createHmac('sha256', 'attendance-browser-test-secret').update(raw).digest('base64url');
  await context.addCookies([{ name: 'hyblock_wallet_session', value: `${Buffer.from(raw).toString('base64url')}.${signature}`, domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' }]);
  await page.route('**/api/auth/wallet/session', (route) => route.fulfill({ json: { session: { address, memberId: 1, expiresAt: Date.now() + 600000 } } }));
});

async function mockEvents(page: import('@playwright/test').Page) {
  const participants = [
    { memberId: 1, name: '김하나', cohort: 1, affiliation: 'development', status: 'nonParticipation' },
    { memberId: 2, name: '박둘', cohort: 2, affiliation: 'business', status: 'late' },
    { memberId: 3, name: '이셋', cohort: 1, affiliation: 'development', status: 'nonParticipation' },
  ];
  const mutations: Array<Record<string, any>> = [];
  let fail = false;
  let active = false;
  let minutes = 10;
  let participantLoads = 0;
  await page.route('**/api/events**', async (route) => {
    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON();
      mutations.push(body);
      if (fail) return route.fulfill({ status: 500, json: { error: '저장 실패: 다시 시도해주세요.' } });
      participants.forEach((p) => { if (body.memberIds?.includes(p.memberId)) p.status = body.attendanceStatus; });
      return route.fulfill({ json: { success: true } });
    }
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      mutations.push(body);
      if (fail) return route.fulfill({ status: 500, json: { error: '지각 기준 설정을 저장하려면 DB 마이그레이션 014를 먼저 적용해주세요.' } });
      active = true;
      minutes = body.lateAfterMinutes;
      return route.fulfill({ json: { success: true, checkInCode: 'ABCDEF' } });
    }
    if (route.request().url().includes('includeParticipants=true')) {
      participantLoads++;
      return route.fulfill({ json: { participants } });
    }
    return route.fulfill({ json: {
      events: [eventName], attendanceData: participants.map((p) => ({ Name: p.name, [eventName]: ({ present: 'Attendence', late: 'Late', absent: 'Absence', nonParticipation: '' } as Record<string, string>)[p.status] })),
      activeEvents: active ? [{ name: eventName, activatedAt: new Date().toISOString(), checkInCode: 'ABCDEF' }] : [],
      activeEvent: null, categories: { [eventName]: '기본 세션' }, contents: {}, statuses: { [eventName]: active ? 'in_progress' : 'scheduled' }, lateAfterMinutes: { [eventName]: minutes },
    } });
  });
  return { mutations, setFailure: (value: boolean) => { fail = value; }, participantLoads: () => participantLoads };
}

test('search and one-click edit save immediately without reloading the roster', async ({ page }) => {
  const api = await mockEvents(page);
  await page.goto('/admin/attendance');
  await page.getByRole('button', { name: '출석 수정', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '기본 1 출석 수정', exact: true });
  await dialog.getByRole('textbox', { name: '회원 이름 검색' }).fill('김');
  const row = dialog.getByRole('group', { name: '김하나 출석 상태' });
  await row.getByRole('button', { name: '출석', exact: true }).click();
  await expect(row.getByRole('button', { name: '출석', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(dialog.getByRole('status')).toContainText('1명의 상태');
  await expect(dialog.getByRole('textbox', { name: '회원 이름 검색' })).toHaveValue('김');
  expect(api.participantLoads()).toBe(1);
  expect(api.mutations[0]).toMatchObject({ memberIds: [1], attendanceStatus: 'present' });
  await expect(dialog.getByRole('group', { name: '박둘 출석 상태' })).toHaveCount(0);
  const widths = await dialog.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('filter and bulk-select members then apply one change', async ({ page }) => {
  const api = await mockEvents(page);
  await page.goto('/admin/attendance');
  await page.getByRole('button', { name: '출석 수정', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: '파트 필터' }).selectOption('development');
  await dialog.getByRole('checkbox', { name: '검색 결과 전체 선택' }).check();
  await expect(dialog.getByRole('button', { name: '선택 2명 적용' })).toBeEnabled();
  await dialog.getByRole('combobox', { name: '일괄 변경 상태' }).selectOption('absent');
  await dialog.getByRole('button', { name: '선택 2명 적용' }).click();
  await expect(dialog.getByRole('status')).toContainText('2명의 상태를 결석');
  expect(api.mutations[0]).toMatchObject({ memberIds: [1, 3], attendanceStatus: 'absent' });
  await expect(dialog.getByRole('button', { name: '선택 0명 적용' })).toBeDisabled();
});

test('failed manual edit retains status and can be retried', async ({ page }) => {
  const api = await mockEvents(page);
  api.setFailure(true);
  await page.goto('/admin/attendance');
  await page.getByRole('button', { name: '출석 수정', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const row = dialog.getByRole('group', { name: '김하나 출석 상태' });
  await row.getByRole('button', { name: '출석', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('저장 실패');
  await expect(row.getByRole('button', { name: '미참여', exact: true })).toHaveAttribute('aria-pressed', 'true');
  api.setFailure(false);
  await row.getByRole('button', { name: '출석', exact: true }).click();
  await expect(row.getByRole('button', { name: '출석', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('activation sends the configured late threshold and displays it', async ({ page }) => {
  const api = await mockEvents(page);
  await page.goto('/admin/attendance');
  await page.getByRole('button', { name: '세션 활성화', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '기본 1 활성화', exact: true });
  await dialog.getByRole('spinbutton', { name: '지각 기준 (시작 후 분)' }).fill('5');
  await dialog.getByRole('button', { name: '설정하고 활성화' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('시작 후 5분 초과 시 지각', { exact: true })).toBeVisible();
  expect(api.mutations[0]).toMatchObject({ setActive: true, lateAfterMinutes: 5 });
});

test('activation failure stays in the dialog with an actionable error', async ({ page }) => {
  const api = await mockEvents(page);
  api.setFailure(true);
  await page.goto('/admin/attendance');
  await page.getByRole('button', { name: '세션 활성화', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '기본 1 활성화', exact: true });
  await dialog.getByRole('button', { name: '설정하고 활성화' }).click();
  await expect(dialog.getByRole('alert')).toContainText('014');
  await expect(dialog.getByRole('button', { name: '설정하고 활성화' })).toBeEnabled();
});
