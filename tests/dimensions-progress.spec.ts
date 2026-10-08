// tests/dimensions-progress.spec.ts
import { expect, test, type Page } from '@playwright/test';
import { expectNoMissingKeys, openPage } from './helpers/dimensions';

const DATA = /static-data\/[^/]+\/survivalProgress\.json/;

/** Click, let React commit, and report what is moving on `watch` before a frame is painted. */
const clickAndWatch = (page: Page, click: string, watch: string) =>
  page.evaluate(
    async ([c, w]) => {
      document.querySelector<HTMLElement>(c)!.click();
      await new Promise((r) => setTimeout(r, 0));
      const el = document.querySelector<HTMLElement>(w);
      if (!el) return null;
      return {
        opacity: +getComputedStyle(el).opacity,
        longest: Math.max(
          0,
          ...el.getAnimations().map((a) => {
            const t = a.effect!.getComputedTiming();
            return Number(t.delay ?? 0) + Number(t.duration ?? 0);
          }),
        ),
      };
    },
    [click, watch],
  );

test.describe('progress page', () => {
  test('lists every milestone, newest first', async ({ page, request }) => {
    const list = await (
      await request.get(
        'https://mc-ctec.org/static-data/zh_TW/survivalProgress.json',
      )
    ).json();
    await openPage(page, '/survivalProgress/');
    await expect(page.locator('.entry')).toHaveCount(list.length);
    await expect(page.locator('.entry h2').first()).toHaveText(
      list[list.length - 1].subTitle,
    );
    await expectNoMissingKeys(page);
  });

  test('/survival/ is the same page', async ({ page }) => {
    await openPage(page, '/survival/');
    await expect(page.locator('.entry').first()).toBeVisible();
  });

  test('dimension and year filters combine, and an empty result explains itself', async ({
    page,
  }) => {
    await openPage(page, '/survivalProgress/');
    await page.locator('.entry').first().waitFor();
    await page.locator('[data-filter="dim"] button[data-v="end"]').click();
    const end = await page.locator('.entry:visible').count();
    expect(end).toBeGreaterThan(0);
    for (const e of await page.locator('.entry:visible').all())
      await expect(e).toHaveAttribute('data-dim', 'end');
    await page.locator('[data-filter="year"] button[data-v="2025"]').click();
    await expect(page.locator('.entry')).toHaveCount(0);
    await expect(page.locator('.empty')).toContainText('這個組合沒有里程碑');
    await expect(page.locator('.tools .count')).toContainText('0 /');
    await expect(page.locator('.year')).toHaveCount(0);
    await page.locator('[data-filter="dim"] button[data-v=""]').click();
    expect(await page.locator('.entry').count()).toBeGreaterThan(0);
    for (const e of await page.locator('.entry').all())
      await expect(e).toHaveAttribute('data-year', '2025');
  });

  test('only confirmed entries carry a dimension tag', async ({ page }) => {
    await openPage(page, '/survivalProgress/');
    await page.locator('.entry').first().waitFor();
    const tagged = await page.locator('.entry .dimtag').count(),
      all = await page.locator('.entry').count();
    expect(tagged).toBeGreaterThan(0);
    expect(tagged).toBeLessThan(all);
  });

  test('the big year and the accent follow the entry being read', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/survivalProgress/');
    const first2022 = page.locator('.entry[data-year="2022"]').first();
    await first2022.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
    await expect(page.locator('.year b')).toHaveText('2022');
    for (const d of ['nether', 'end', 'overworld']) {
      const entry = page.locator(`.entry[data-dim="${d}"]`).first();
      await entry.evaluate((e) => e.scrollIntoView({ block: 'center' }));
      await expect(page.locator('html')).toHaveAttribute('data-dim', d);
      await expect(page.locator('.year b')).toHaveText(
        (await entry.getAttribute('data-year')) ?? '',
      );
    }
  });

  test('a failed request shows an explanation and a retry control', async ({
    page,
  }) => {
    await page.route(DATA, (r) => r.abort());
    await openPage(page, '/survivalProgress/');
    await expect(page.locator('.empty')).toContainText('進度資料載入失敗');
    await expect(page.locator('.empty button')).toBeVisible();
  });
});

test.describe('progress page: sticky toolbar and retry', () => {
  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ]) {
    test(`toolbar stays below the bar when scrolled: ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/survivalProgress/');
      await page.locator('.entry').first().waitFor();
      await page.evaluate(() => window.scrollTo(0, 2500));
      await page.waitForTimeout(300);
      const [bar, tools] = await Promise.all(
        ['.dim-bar', '.tools'].map((s) =>
          page.locator(s).evaluate((el) => el.getBoundingClientRect().toJSON()),
        ),
      );
      expect(tools.top).toBeGreaterThanOrEqual(bar.bottom - 1);
      expect(tools.bottom).toBeLessThanOrEqual(height);
    });
  }

  test('retry reloads the log after a failed request', async ({ page }) => {
    await page.route(DATA, (r) => r.abort());
    await openPage(page, '/survivalProgress/');
    await expect(page.locator('.empty')).toContainText('進度資料載入失敗');
    await page.unroute(DATA);
    await page.locator('.empty button').click();
    await expect(page.locator('.entry').first()).toBeVisible();
  });
});

const entry = (n: number, title: string) => ({
  imageUrl: `survivalProgress/p${n}.webp`,
  title,
  subTitle: `milestone ${n}`,
});
const num = (s: string | null) => Number(/\d+/.exec(s ?? '')?.[0]);

test.describe('progress page: data-driven numbers', () => {
  test('the lead total equals the toolbar total', async ({ page }) => {
    const list = [
      entry(4, '2022/8/1'),
      entry(5, '2023/1/2'),
      entry(6, '2023/2/3'),
      entry(7, '2024/3/4'),
      entry(8, '2025/4/5'),
      entry(9, '2025/5/6'),
      entry(10, '2025/6/7'),
    ];
    await page.route(DATA, (r) => r.fulfill({ json: list }));
    await openPage(page, '/survivalProgress/');
    await expect(page.locator('.entry')).toHaveCount(7);
    const lead = await page.locator('.head p[data-t="body"]').textContent();
    expect(num(/全部\s*\d+\s*個/.exec(lead ?? '')?.[0] ?? '')).toBe(7);
    await expect(page.locator('.tools .count')).toContainText('7 / 7');
  });

  test('the lead shows no number after a failed request', async ({ page }) => {
    await page.route(DATA, (r) => r.abort());
    await openPage(page, '/survivalProgress/');
    await expect(page.locator('.empty')).toContainText('進度資料載入失敗');
    const lead = await page.locator('.head p[data-t="body"]').textContent();
    expect(lead).not.toMatch(/\d+\s*個里程碑/);
    expect(lead).not.toContain('{{');
    expect(lead).not.toContain('NaN');
  });

  test('choosing a year updates the big year and its count', async ({
    page,
  }) => {
    await openPage(page, '/survivalProgress/');
    await page.locator('.entry').first().waitFor();
    await page.locator('[data-filter="year"] button[data-v="2023"]').click();
    const n = await page.locator('.entry').count();
    expect(n).toBeGreaterThan(0);
    await expect(page.locator('.year b')).toHaveText('2023');
    expect(num(await page.locator('.year small').textContent())).toBe(n);
  });

  test('choosing a dimension keeps the big year count equal to the rendered entries', async ({
    page,
  }) => {
    await openPage(page, '/survivalProgress/');
    await page.locator('.entry').first().waitFor();
    await page.locator('[data-filter="dim"] button[data-v="nether"]').click();
    expect(await page.locator('.entry').count()).toBeGreaterThan(0);
    const year = (await page.locator('.year b').textContent()) ?? '';
    expect(year).toMatch(/^\d{4}$/);
    const rendered = await page.locator(`.entry[data-year="${year}"]`).count();
    expect(rendered).toBeGreaterThan(0);
    expect(num(await page.locator('.year small').textContent())).toBe(rendered);
  });

  test('an entry with a malformed date is listed but gets no year chip or big year', async ({
    page,
  }) => {
    await page.route(DATA, (r) =>
      r.fulfill({
        json: [entry(4, '2022/8/1'), entry(5, '不明'), entry(6, '2023/1/2')],
      }),
    );
    await openPage(page, '/survivalProgress/');
    await expect(page.locator('.entry')).toHaveCount(3);
    await expect(page.locator('[data-filter="year"] button')).toHaveCount(3);
    await expect(page.locator('.year b')).toHaveText(/^\d{4}$/);
    await page.locator('[data-filter="year"] button[data-v="2022"]').click();
    await expect(page.locator('.entry')).toHaveCount(1);
    await expect(page.locator('.year b')).toHaveText('2022');
  });

  for (const locale of ['zh_TW', 'zh_CN', 'en'] as const) {
    test(`no missing i18n keys: ${locale}`, async ({ page }) => {
      await openPage(page, '/survivalProgress/', { locale });
      await page.locator('.entry').first().waitFor();
      await expectNoMissingKeys(page);
      await page.locator('[data-filter="year"] button[data-v="2025"]').click();
      await page.locator('[data-filter="dim"] button[data-v="end"]').click();
      await expect(page.locator('.empty')).toBeVisible();
      await expectNoMissingKeys(page);
    });
  }
});

test.describe('progress page: state changes are transitions', () => {
  const END = '[data-filter="dim"] button[data-v="end"]';
  const Y2025 = '[data-filter="year"] button[data-v="2025"]';

  test('chips ease between states, the list rises in after a filter, and so does the empty state', async ({
    page,
  }) => {
    await openPage(page, '/survivalProgress/');
    const first = page.locator('.entry').first();
    await first.waitFor();
    await expect(first).toHaveCSS('opacity', '1');
    const chip = await page.locator(END).evaluate((el) => {
      const cs = getComputedStyle(el);
      return [cs.transitionProperty, parseFloat(cs.transitionDuration)];
    });
    expect(chip[0]).toContain('background-color');
    expect(chip[1]).toBeGreaterThan(0);

    const list = await clickAndWatch(page, END, '.entry');
    expect(list!.longest).toBeGreaterThan(200);
    expect(list!.opacity).toBeLessThan(1);
    await expect(first).toHaveCSS('opacity', '1');
    await expect(first).toHaveCSS('transform', 'none');
    // the big year changes with a move of its own
    const year = await clickAndWatch(
      page,
      '[data-filter="year"] button[data-v="2023"]',
      '.year b',
    );
    expect(year!.longest).toBeGreaterThan(0);
    await expect(page.locator('.year b')).toHaveText('2023');

    const empty = await clickAndWatch(page, Y2025, '.empty');
    expect(empty!.longest).toBeGreaterThan(200);
    expect(empty!.opacity).toBeLessThan(1);
    await expect(page.locator('.empty')).toHaveCSS('opacity', '1');
  });

  test('a failed request eases its explanation in', async ({ page }) => {
    await page.route(DATA, (r) => r.abort());
    await openPage(page, '/survivalProgress/');
    const block = page.locator('.empty[data-state="error"]');
    await expect(block).toContainText('進度資料載入失敗');
    expect(
      await block.evaluate((el) => getComputedStyle(el).animationName),
    ).not.toBe('none');
    await expect(block).toHaveCSS('opacity', '1');
  });

  test('reduced motion: the list change is a brief fade without travel', async ({
    page,
  }) => {
    await openPage(page, '/survivalProgress/', { reducedMotion: true });
    const first = page.locator('.entry').first();
    await first.waitFor();
    await expect(first).toHaveCSS('opacity', '1');
    const list = await clickAndWatch(page, END, '.entry');
    expect(list!.longest).toBeGreaterThan(0);
    expect(list!.longest).toBeLessThanOrEqual(120);
    expect(await first.evaluate((el) => getComputedStyle(el).transform)).toBe(
      'none',
    );
    await expect(first).toHaveCSS('opacity', '1');
  });
});
