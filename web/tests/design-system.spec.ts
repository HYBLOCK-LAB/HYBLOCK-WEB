import { expect, test } from '@playwright/test';

const designLabPages = [
  { path: '/design-lab', name: 'landing' },
  { path: '/design-lab/editorial', name: 'editorial' },
  { path: '/design-lab/application', name: 'application' },
  { path: '/design-lab/dashboard', name: 'dashboard' },
];

for (const designPage of designLabPages) {
  test(`${designPage.name} keeps the design system without page overflow`, async ({ page }, testInfo) => {
    const response = await page.goto(designPage.path, { waitUntil: 'domcontentloaded' });

    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);

    const layout = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);

      return {
        clientWidth: root.clientWidth,
        scrollWidth: root.scrollWidth,
        primary: styles.getPropertyValue('--color-monolith-primary').trim(),
      };
    });

    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
    expect(layout.primary).toBe('#0e4a84');

    if (designPage.name === 'dashboard') {
      const tableHeader = await page.locator('thead').evaluate((element) => {
        const styles = getComputedStyle(element);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
        };
      });

      expect(tableHeader.backgroundColor).toBe('rgb(0, 33, 71)');
      expect(tableHeader.color).toBe('rgb(255, 255, 255)');
    }

    const screenshotPath = testInfo.outputPath(`${designPage.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await testInfo.attach(`${designPage.name}-${testInfo.project.name}`, {
      path: screenshotPath,
      contentType: 'image/png',
    });
  });
}

test('HYBLOCK 소개 CTA keeps its label centered on one line', async ({ page }, testInfo) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();

  const introCta = page.getByRole('link', { name: 'HYBLOCK 소개', exact: true });
  await expect(introCta).toBeVisible();

  const alignment = await introCta.evaluate((element) => {
    const buttonRect = element.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(element);
    const textRect = range.getBoundingClientRect();
    const styles = getComputedStyle(element);

    return {
      horizontalOffset: Math.abs(
        buttonRect.left + buttonRect.width / 2 - (textRect.left + textRect.width / 2),
      ),
      verticalOffset: Math.abs(
        buttonRect.top + buttonRect.height / 2 - (textRect.top + textRect.height / 2),
      ),
      whiteSpace: styles.whiteSpace,
    };
  });

  expect(alignment.horizontalOffset).toBeLessThanOrEqual(1);
  expect(alignment.verticalOffset).toBeLessThanOrEqual(2);
  expect(alignment.whiteSpace).toBe('nowrap');

  const screenshotPath = testInfo.outputPath('home-hero.png');
  await introCta.scrollIntoViewIfNeeded();
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await testInfo.attach(`home-hero-${testInfo.project.name}`, {
    path: screenshotPath,
    contentType: 'image/png',
  });
});

test('activity archive shows albums without responsive overflow', async ({ page }, testInfo) => {
  const response = await page.goto('/activities', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();

  await expect(page.getByRole('heading', { level: 1, name: 'Activities' })).toBeVisible();
  await expect(page.getByText('8개의 앨범', { exact: true })).toBeVisible();
  await expect(page.locator('a[href^="/activities/"]')).toHaveCount(8);
  await expect(page.getByRole('heading', { name: 'Monad Blitz 해커톤', exact: true })).toHaveCount(1);

  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);

  if (testInfo.project.name === 'mobile-chromium') {
    await expect(page.getByRole('combobox', { name: '활동 분류' })).toBeVisible();
    await expect(page.getByRole('button', { name: '메뉴 열기' })).toBeVisible();
  } else {
    await expect(page.getByRole('group', { name: '활동 분류' })).toBeVisible();
  }

  const axelarCover = page.getByRole('img', { name: 'Axelar와 Squid를 소개하는 심화 세션 발표' });
  await axelarCover.scrollIntoViewIfNeeded();
  await expect.poll(() => axelarCover.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);

  const screenshotPath = testInfo.outputPath('activities.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach(`activities-${testInfo.project.name}`, {
    path: screenshotPath,
    contentType: 'image/png',
  });
});

test('shared chrome keeps navigation and external links readable', async ({ page }, testInfo) => {
  const response = await page.goto('/apply', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: '페이지 작업중입니다.' })).toBeVisible();

  await expect(page.getByRole('link', { name: 'HYBLOCK Medium' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'HYBLOCK Instagram' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'HYBLOCK LinkedIn' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'HYBLOCK X' })).toBeVisible();

  if (testInfo.project.name === 'mobile-chromium') {
    const menuButton = page.getByRole('button', { name: '메뉴 열기' });
    await menuButton.click();
    await expect(page.getByRole('navigation', { name: '모바일 메뉴' })).toBeVisible();
    await expect(page.getByRole('link', { name: '공지사항' })).toBeVisible();
    await expect(page.getByRole('link', { name: '활동' })).toBeVisible();
  }
});
