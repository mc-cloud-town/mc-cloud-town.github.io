import { expect, test } from '@playwright/test';
import {
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  LOCALES,
  openPage,
} from './helpers/dimensions';
import {
  collectionData,
  detail,
  detailGone,
  detailOpen,
  routeCollection,
  WORKS,
} from './helpers/collection';

const PATH = '/redstoneCollection/';
const DATA = collectionData('redstone');

test.describe('redstone collection: the gallery', () => {
  test('is in the new shell, in the nether, and shows every work of the routed data', async ({
    page,
  }) => {
    await routeCollection(page, 'redstone');
    await openPage(page, PATH);
    await expect(page.locator('.dim-bar')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'nether');
    await expect(page.locator('.head h1')).toContainText('紅石作品');

    const cards = page.locator('.works .work');
    await expect(cards).toHaveCount(WORKS.length);
    const first = cards.first();
    await expect(first.locator('h2')).toHaveText('Star Bow Mini');
    await expect(first.locator('.meta')).toContainText('2024.03.17');
    await expect(first.locator('.meta')).toContainText('FlandreLed');
    // two names in one string of the data are two names
    await expect(cards.nth(1).locator('.meta')).toContainText('Alice');
    await expect(cards.nth(1).locator('.meta')).toContainText('Bob');
    await expect(first.locator('.tags')).toContainText('珍珠炮');
    // the picture has its room before it has loaded, and is asked for only when it is near
    const img = first.locator('figure img');
    await expect(img).toHaveAttribute('loading', 'lazy');
    await expect(img).toHaveAttribute('src', /images\/redstoneCollection\//);
    const box = await first.locator('figure').boundingBox();
    expect(box!.width / box!.height).toBeCloseTo(16 / 9, 1);
    await expect(page.locator('.tools .count')).toContainText('4 / 4');
    await expectNoMissingKeys(page);
  });

  test('a failed request explains itself, and retry brings the works', async ({
    page,
  }) => {
    await page.route(DATA, (r) => r.abort());
    await openPage(page, PATH);
    await expect(page.locator('.empty[data-state="error"]')).toContainText(
      '作品資料載入失敗',
    );
    await expect(page.locator('.works .work')).toHaveCount(0);
    await page.unroute(DATA);
    await routeCollection(page, 'redstone');
    await page.locator('.empty button').click();
    await expect(page.locator('.works .work')).toHaveCount(WORKS.length);
    await expect(page.locator('.empty')).toHaveCount(0);
  });

  test('tags and search narrow the list, and nothing found says so', async ({
    page,
  }) => {
    await routeCollection(page, 'redstone');
    await openPage(page, PATH);
    const cards = page.locator('.works .work');
    await expect(cards).toHaveCount(4);
    const chip = (v: string) =>
      page.locator(`.chips[data-filter="tag"] button[data-v="${v}"]`);

    await chip('紅石').click();
    await expect(cards).toHaveCount(2);
    await expect(chip('紅石')).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/tag=/);
    // a second tag narrows further: both must be on the work
    await chip('TNT').click();
    await expect(cards).toHaveCount(1);
    await expect(cards.locator('h2')).toHaveText('Star Bow Mini');
    await chip('').click();
    await expect(cards).toHaveCount(4);
    await expect(page).not.toHaveURL(/tag=/);

    const search = page.locator('.tools .search');
    await search.fill('carol');
    await expect(cards).toHaveCount(1);
    await expect(cards.locator('h2')).toHaveText('出生點雕塑');
    await search.fill('粉末');
    await expect(cards).toHaveCount(1);
    await search.fill('no such work');
    await expect(cards).toHaveCount(0);
    await expect(page.locator('.empty[data-state="empty"]')).toBeVisible();
    await expect(page.locator('.tools .count')).toContainText('0 / 4');
    await search.fill('');
    await expect(cards).toHaveCount(4);
  });

  test('the old addresses still work: ?tag= filters, ?share= opens that work', async ({
    page,
  }) => {
    await routeCollection(page, 'redstone');
    await openPage(page, `${PATH}?tag=${encodeURIComponent('建築')}`);
    await expect(page.locator('.works .work')).toHaveCount(1);
    await openPage(page, `${PATH}?share=1`);
    await detailOpen(page);
    await expect(detail(page).locator('h2')).toHaveText('粉末複製機');
    await expect(page).toHaveURL(/work=powder/);
  });

  for (const locale of LOCALES)
    test(`no missing words, gallery and detail: ${locale}`, async ({
      page,
    }) => {
      await routeCollection(page, 'redstone');
      await openPage(page, `${PATH}?work=star_bow`, { locale });
      await detailOpen(page);
      await expect(page.locator('.works .work')).toHaveCount(4);
      await expectNoMissingKeys(page);
      // every control of the detail has a name
      for (const b of await detail(page).locator('button, a').all())
        expect(
          (
            (await b.getAttribute('aria-label')) ??
            (await b.textContent()) ??
            ''
          ).trim(),
        ).not.toBe('');
    });

  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ])
    test(`no sideways scroll, gallery and detail: ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await routeCollection(page, 'redstone');
      await openPage(page, PATH);
      await expect(page.locator('.works .work')).toHaveCount(4);
      await expectNoHorizontalScroll(page);
      await page.locator('.work h2 a').first().click();
      await detailOpen(page);
      await expectNoHorizontalScroll(page);
      // nor inside the detail itself
      const [scroll, client] = await detail(page).evaluate((el) => [
        el.scrollWidth,
        el.clientWidth,
      ]);
      expect(scroll).toBeLessThanOrEqual(client);
    });
});

test.describe('redstone collection: the detail of a work', () => {
  test('opening a work puts it in the address and brings the detail in over several frames, with the focus inside', async ({
    page,
  }) => {
    await routeCollection(page, 'redstone');
    await openPage(page, PATH);
    await expect(page.locator('.works .work')).toHaveCount(4);
    await expect(detail(page)).toHaveAttribute('data-open', 'false');
    await expect(detail(page)).toHaveCSS('visibility', 'hidden');

    // click, and read the detail's opacity in every frame from then on
    const frames = await page.evaluate(async () => {
      const el = document.querySelector<HTMLElement>('.dim .work-detail')!;
      document.querySelector<HTMLElement>('.work h2 a')!.click();
      const seen: number[] = [];
      const t0 = performance.now();
      while (performance.now() - t0 < 700) {
        await new Promise((r) => requestAnimationFrame(r));
        seen.push(+getComputedStyle(el).opacity);
      }
      return seen;
    });
    const rising = frames.filter((o) => o > 0.02 && o < 0.98);
    expect(rising.length, `frames: ${frames.join(' ')}`).toBeGreaterThan(3);
    expect(frames[0]).toBeLessThan(0.5);
    expect(frames.at(-1)).toBe(1);
    for (let i = 1; i < frames.length; i++)
      expect(frames[i]).toBeGreaterThanOrEqual(frames[i - 1] - 0.001);

    await expect(page).toHaveURL(/\/redstoneCollection\/\?work=star_bow$/);
    await detailOpen(page);
    await expect(detail(page)).toHaveAttribute('role', 'dialog');
    expect(
      await page.evaluate(() =>
        Boolean(
          document.activeElement?.closest('.work-detail') &&
            document.activeElement !== document.body,
        ),
      ),
    ).toBe(true);
    // the page behind is out of reach
    expect(
      await page.evaluate(() =>
        ['.dim-bar', 'main', '.dim-foot'].map(
          (s) => (document.querySelector(s) as HTMLElement).inert,
        ),
      ),
    ).toEqual([true, true, true]);
  });

  test('the detail carries everything of the work: pictures, video, people, words, links', async ({
    page,
  }) => {
    await routeCollection(page, 'redstone');
    await openPage(page, `${PATH}?work=star_bow`);
    await detailOpen(page);
    const d = detail(page);
    await expect(d.locator('h2')).toHaveText('Star Bow Mini');
    await expect(d).toContainText('2024.03.17');
    await expect(d).toContainText('FlandreLed');
    await expect(d).toContainText('一台很小的珍珠炮。');
    await expect(d).toContainText('第二段說明。');
    await expect(
      d.locator('a[href="https://discord.com/channels/1/2/3"]'),
    ).toBeVisible();
    await expect(
      d.locator('a[href="https://www.youtube.com/@emiraleph"]'),
    ).toHaveText('Emir');
    await expect(d).toContainText('NoLink');
    // the video is a link and a frame that loads only when asked: no player in the page
    await expect(
      d.locator('a[href="https://www.youtube.com/watch?v=gFAjlbvHx0o"]'),
    ).toBeVisible();
    await expect(d.locator('iframe')).toHaveCount(0);
    // three pictures and the video, one at a time
    await expect(d.locator('.wd-slide')).toHaveCount(4);
    await expect(d.locator('.wd-slide[data-current="true"]')).toHaveCount(1);
    await expect(d.locator('.wd-count')).toHaveText('1 / 4');
    // share links carry this work's address
    const share = await d
      .locator('.wd-share a')
      .evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    expect(share.length).toBe(4);
    for (const href of share)
      expect(decodeURIComponent(href)).toContain(
        '/redstoneCollection/?work=star_bow',
      );
    // a tag of the work filters the gallery by it and closes the detail
    await d.locator('.wd-tags button', { hasText: 'TNT' }).click();
    await detailGone(page);
    await expect(page.locator('.works .work')).toHaveCount(1);
  });

  test('the pictures are a sequence the keyboard walks: buttons, arrows, thumbnails', async ({
    page,
  }) => {
    await routeCollection(page, 'redstone');
    await openPage(page, `${PATH}?work=star_bow`);
    await detailOpen(page);
    const d = detail(page);
    const count = d.locator('.wd-count');
    const prev = d.locator('[data-action="prev"]');
    const next = d.locator('[data-action="next"]');
    await expect(prev).toBeDisabled();
    await next.focus();
    await page.keyboard.press('Enter');
    await expect(count).toHaveText('2 / 4');
    await expect(prev).toBeEnabled();
    await page.keyboard.press('ArrowRight');
    await expect(count).toHaveText('3 / 4');
    await page.keyboard.press('ArrowLeft');
    await expect(count).toHaveText('2 / 4');
    await d.locator('.wd-thumbs button').nth(3).click();
    await expect(count).toHaveText('4 / 4');
    await expect(next).toBeDisabled();
    await expect(d.locator('.wd-slide[data-current="true"]')).toHaveAttribute(
      'data-kind',
      'video',
    );
    await expect(d.locator('.wd-slide[data-current="true"]')).toHaveCSS(
      'opacity',
      '1',
    );
    // a work with a single picture has no sequence controls
    await page.keyboard.press('Escape');
    await detailGone(page);
    await page.locator('.work[data-work="powder"] h2 a').click();
    await detailOpen(page);
    await expect(d.locator('.wd-slide')).toHaveCount(1);
    await expect(d.locator('[data-action="next"]')).toHaveCount(0);
  });

  test('Escape closes it, the address is the gallery again, and the focus is back on the work', async ({
    page,
  }) => {
    await routeCollection(page, 'redstone');
    await openPage(page, PATH);
    const link = page.locator('.work[data-work="powder"] h2 a');
    await link.click();
    await detailOpen(page);
    await expect(page).toHaveURL(/work=powder/);
    await page.keyboard.press('Escape');
    await detailGone(page);
    await expect(page).toHaveURL(/\/redstoneCollection\/$/);
    await expect(link).toBeFocused();
    expect(
      await page.evaluate(() =>
        ['.dim-bar', 'main', '.dim-foot'].map(
          (s) => (document.querySelector(s) as HTMLElement).inert,
        ),
      ),
    ).toEqual([false, false, false]);
  });

  test('Back closes it and Forward opens it again; the close button is the same step back', async ({
    page,
  }) => {
    await routeCollection(page, 'redstone');
    await openPage(page, PATH);
    const link = page.locator('.work[data-work="star_bow"] h2 a');
    await link.click();
    await detailOpen(page);
    await page.goBack();
    await detailGone(page);
    await expect(page).toHaveURL(/\/redstoneCollection\/$/);
    await expect(link).toBeFocused();
    await expect(page.locator('.works .work')).toHaveCount(4);
    await page.goForward();
    await detailOpen(page);
    await expect(detail(page).locator('h2')).toHaveText('Star Bow Mini');
    await detail(page).locator('[data-action="close"]').click();
    await detailGone(page);
    await expect(page).toHaveURL(/\/redstoneCollection\/$/);
    // one step, not a new entry: forward is the work again
    await page.goForward();
    await detailOpen(page);
  });

  test('the focus stays in the detail: Tab goes round', async ({ page }) => {
    await routeCollection(page, 'redstone');
    await openPage(page, `${PATH}?work=star_bow`);
    await detailOpen(page);
    const inside = () =>
      page.evaluate(() =>
        Boolean(document.activeElement?.closest('.work-detail')),
      );
    const n = await detail(page).locator('button:enabled, a[href]').count();
    expect(n).toBeGreaterThan(5);
    for (let i = 0; i < n + 3; i++) {
      await page.keyboard.press('Tab');
      expect(await inside()).toBe(true);
    }
    for (let i = 0; i < n + 3; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await inside()).toBe(true);
    }
  });

  test('a work’s address opens it on a direct load; closing leaves the gallery, and an unknown work is just the gallery', async ({
    page,
  }) => {
    await routeCollection(page, 'redstone');
    await openPage(page, `${PATH}?work=spawn`);
    await detailOpen(page);
    await expect(detail(page).locator('h2')).toHaveText('出生點雕塑');
    await detail(page).locator('[data-action="close"]').click();
    await detailGone(page);
    await expect(page).toHaveURL(/\/redstoneCollection\/$/);
    await expect(page.locator('.works .work')).toHaveCount(4);
    await expect(page.locator('.work[data-work="spawn"] h2 a')).toBeFocused();

    await openPage(page, `${PATH}?work=nothing-like-it`);
    await expect(page.locator('.works .work')).toHaveCount(4);
    await expect(detail(page)).toHaveAttribute('data-open', 'false');
  });

  test('less motion: the detail still arrives, by a brief fade', async ({
    page,
  }) => {
    await routeCollection(page, 'redstone');
    await openPage(page, PATH, { reducedMotion: true });
    await page.locator('.work h2 a').first().click();
    await detailOpen(page);
    expect(
      await detail(page).evaluate((el) => getComputedStyle(el).transform),
    ).toBe('none');
    await page.keyboard.press('Escape');
    await detailGone(page);
  });
});
