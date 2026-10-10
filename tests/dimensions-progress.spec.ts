// tests/dimensions-progress.spec.ts
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';
import {
  atRest,
  expectLegible,
  expectNoMissingKeys,
  openPage,
  setLanguage,
} from './helpers/dimensions';

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

/** One reading of `watchLanding`: where the page is, and how the entry asked for stands in it. */
interface LandFrame {
  /** a frame, or the moment right after something changed a height or moved the page */
  on: 'frame' | 'change';
  y: number;
  /** the entry is in the page */
  there: boolean;
  /** how much of it shows, through everything it is inside of */
  shown: number;
  /** where its own box begins, from the top of the screen (without the rise it arrives with) */
  top: number;
  /** the highlight: how strong it is, and the animation that runs it */
  mark: number;
  marking: string;
}

/**
 * Record the page and the entry `#entry-<no>` from the first frame on. Once the entry is there, also at every
 * change that could move it (the content changes its height, the page is scrolled): read after the page itself
 * has answered the change, in the same frame, which is what that frame then shows.
 */
const watchLanding = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { __land: LandFrame[]; __want?: string };
    w.__land = [];
    let watching = false;
    const read = (on: LandFrame['on']) => {
      const el = w.__want
        ? document.querySelector<HTMLElement>(w.__want)
        : null;
      let shown = 1;
      for (let e: HTMLElement | null = el; e; e = e.parentElement) {
        const c = getComputedStyle(e);
        if (c.visibility === 'hidden') shown = 0;
        shown *= +c.opacity;
      }
      const before = el && getComputedStyle(el, '::before');
      let top = 0;
      for (let e: HTMLElement | null = el; e; e = e.offsetParent as HTMLElement)
        top += e.offsetTop;
      w.__land.push({
        on,
        y: Math.round(window.scrollY),
        there: !!el,
        shown: el ? shown : 0,
        top: Math.round(top - window.scrollY),
        mark: before && before.content !== 'none' ? +before.opacity : 0,
        marking: before ? before.animationName : 'none',
      });
      if (el && !watching) {
        watching = true;
        // registered after the page's own, so they run after them
        new ResizeObserver(() => read('change')).observe(el.closest('main')!);
        window.addEventListener('scroll', () => read('change'));
      }
    };
    // a frame is read when it has been drawn
    const drawn = new MessageChannel();
    drawn.port1.onmessage = () => read('frame');
    const tick = () => {
      drawn.port2.postMessage(0);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
const landFrames = (page: Page) =>
  page.evaluate(() => (window as unknown as { __land: LandFrame[] }).__land);

/** The entry stands right under the bar and the toolbar, and nothing of the page covers it. */
const expectLandedOn = async (page: Page, no: number) => {
  const entry = page.locator(`#entry-${no}`);
  await expect(entry).toHaveCount(1);
  await expect(entry).toBeVisible();
  await expect
    .poll(
      () =>
        page.evaluate((id) => {
          const el = document.querySelector(id)!.getBoundingClientRect();
          const tools = document
            .querySelector('.dim .tools')!
            .getBoundingClientRect();
          const bar = document
            .querySelector('.dim-bar')!
            .getBoundingClientRect();
          return {
            // below the toolbar wherever that is, and a line below where it sticks, under the bar
            clear: el.top >= tools.bottom,
            // (offsets are whole pixels and the page scrolls to whole pixels: a pixel either way)
            placed: Math.abs(el.top - (bar.bottom + tools.height) - 24) <= 1.5,
          };
        }, `#entry-${no}`),
      { message: `entry ${no} under the bar and the toolbar` },
    )
    .toEqual({ clear: true, placed: true });
};

test.describe('progress page: an address that names an entry', () => {
  const list = async (request: APIRequestContext) =>
    (await (
      await request.get(
        'https://mc-ctec.org/static-data/zh_TW/survivalProgress.json',
      )
    ).json()) as { subTitle: string }[];

  test('every entry has its own id, the number of the milestone', async ({
    page,
    request,
  }) => {
    const total = (await list(request)).length;
    await openPage(page, '/survivalProgress/');
    await expect(page.locator('.entry')).toHaveCount(total);
    const ids = await page
      .locator('.entry')
      .evaluateAll((els) => els.map((e) => e.id));
    expect(ids).toEqual(
      Array.from({ length: total }, (_, i) => `entry-${total - i}`),
    );
    // nothing is asked for: the page is at its top and no entry is marked
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator('.entry[data-landed]')).toHaveCount(0);
  });

  for (const index of [0, 5, 30])
    test(`the old ?index=${index} lands on that entry (the ${index}th from the newest), in place before the list shows, and marks it for a moment`, async ({
      page,
      request,
    }) => {
      const data = await list(request);
      const no = data.length - index;
      await watchLanding(page);
      await page.addInitScript(
        (id) => ((window as unknown as { __want: string }).__want = id),
        `#entry-${no}`,
      );
      await openPage(page, `/survivalProgress/?index=${index}`);
      await expect(page.locator(`#entry-${no} h2`)).toHaveText(
        data[data.length - 1 - index].subTitle,
      );
      await expectLandedOn(page, no);
      // the filters are all open, so it is in the list
      for (const f of ['dim', 'year'])
        await expect(
          page.locator(`[data-filter="${f}"] button[data-v=""]`),
        ).toHaveAttribute('aria-pressed', 'true');
      // it is marked: the mark swells and fades, in the motion of the page
      await expect(page.locator(`#entry-${no}`)).toHaveAttribute(
        'data-landed',
        '',
      );
      await expect
        .poll(async () => {
          const frames = await landFrames(page);
          const peak = Math.max(...frames.map((f) => f.mark));
          return peak > 0.05 && frames.at(-1)!.mark === 0;
        })
        .toBe(true);
      const frames = await landFrames(page);
      const withEntry = frames.filter((f) => f.there);
      const final = withEntry.at(-1)!;
      // no pop: in the first frame the entry is in the page, it is where it will stay on the screen;
      expect(Math.abs(withEntry[0].top - final.top)).toBeLessThanOrEqual(2);
      // whatever changes a height or moves the page after that is answered before the frame is drawn;
      const changes = withEntry.filter((f) => f.on === 'change');
      for (const f of changes)
        expect(Math.abs(f.top - final.top)).toBeLessThanOrEqual(2);
      // and at rest it stays there
      for (const f of withEntry.slice(-30))
        expect(Math.abs(f.top - final.top)).toBeLessThanOrEqual(2);
      // it was not shown before it was there, and it came in (its first frame is not whole)
      expect(withEntry[0].shown).toBeLessThan(0.5);
      expect(final.shown).toBe(1);
      // the mark is a fade both ways: several frames between nothing and its peak, and it begins from nothing
      const marked = frames.filter((f) => f.on === 'frame' && f.mark > 0);
      expect(marked.length).toBeGreaterThan(20);
      const peak = Math.max(...marked.map((f) => f.mark));
      const at = marked.findIndex((f) => f.mark === peak);
      expect(at, 'frames of the swell').toBeGreaterThanOrEqual(3);
      expect(marked.length - at, 'frames of the fade').toBeGreaterThan(20);
      expect(marked[0].mark).toBeLessThan(peak);
      expect(frames.find((f) => f.marking !== 'none')!.marking).toBe(
        'entry-landed',
      );
      expect(Math.max(...marked.map((f) => f.mark))).toBeLessThanOrEqual(0.2);
    });

  test('an entry hash lands on that entry too', async ({ page, request }) => {
    const total = (await list(request)).length;
    const no = total - 12;
    await openPage(page, `/survivalProgress/#entry-${no}`);
    await expectLandedOn(page, no);
    await expect(page.locator(`#entry-${no}`)).toHaveAttribute(
      'data-landed',
      '',
    );
  });

  test('a hash that names an entry the filters hide opens the filters, and lands on it', async ({
    page,
    request,
  }) => {
    const total = (await list(request)).length;
    await openPage(page, '/survivalProgress/');
    await page.locator('.entry').first().waitFor();
    await page.locator('[data-filter="dim"] button[data-v="end"]').click();
    const hidden = await page.evaluate((n) => {
      const shown = new Set(
        [...document.querySelectorAll('.entry')].map((e) => e.id),
      );
      for (let no = n - 8; no > 0; no--)
        if (!shown.has(`entry-${no}`)) return no;
      return 0;
    }, total);
    expect(hidden).toBeGreaterThan(0);
    await expect(page.locator(`#entry-${hidden}`)).toHaveCount(0);
    await page.evaluate((no) => (window.location.hash = `entry-${no}`), hidden);
    await expect(
      page.locator('[data-filter="dim"] button[data-v=""]'),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.entry')).toHaveCount(total);
    await expectLandedOn(page, hidden);
  });

  for (const address of [
    '?index=9999',
    '?index=-1',
    '?index=abc',
    '?index=',
    '#entry-0',
    '#entry-9999',
    '#entry-x',
  ])
    test(`${address} names no entry: the page opens at its top, without an error`, async ({
      page,
      request,
    }) => {
      const total = (await list(request)).length;
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await openPage(page, `/survivalProgress/${address}`);
      await expect(page.locator('.entry')).toHaveCount(total);
      await atRest(page);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await expect(page.locator('.entry[data-landed]')).toHaveCount(0);
      await expect(page.locator('.head h1')).toBeVisible();
      expect(errors).toEqual([]);
    });

  test('reduced motion: it lands on the entry, and nothing is marked', async ({
    page,
    request,
  }) => {
    const total = (await list(request)).length;
    await watchLanding(page);
    await page.addInitScript(
      (id) => ((window as unknown as { __want: string }).__want = id),
      `#entry-${total - 5}`,
    );
    await openPage(page, '/survivalProgress/?index=5', { reducedMotion: true });
    await expectLandedOn(page, total - 5);
    await atRest(page);
    await page.waitForTimeout(1200);
    const frames = (await landFrames(page)).filter((f) => f.there);
    expect(frames.length).toBeGreaterThan(30);
    for (const f of frames) expect(f.mark).toBe(0);
  });

  test('another language keeps the reader where they are: the entry is landed on once', async ({
    page,
    request,
  }) => {
    const total = (await list(request)).length;
    await openPage(page, '/survivalProgress/?index=5');
    await expectLandedOn(page, total - 5);
    // The reader goes back to the top themselves, with a key. (Not by script: for the first moments after the
    // landing the entry is kept in place against anything but the reader, while the page settles around it.)
    await page.keyboard.press('Home');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await setLanguage(page, 'en');
    await expect(page.locator('.tools [data-v="overworld"]')).toHaveText(
      'Overworld',
    );
    await expect(page.locator('.entry')).toHaveCount(total);
    await atRest(page);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  /** A colour as hue (degrees) and relative luminance. */
  const hueAndLight = (rgb: string) => {
    const [r, g, b] = rgb.match(/[\d.]+/g)!.map((v) => +v / 255);
    const max = Math.max(r, g, b),
      d = max - Math.min(r, g, b);
    const hue =
      60 *
      (max === r
        ? ((g - b) / d + 6) % 6
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4);
    const lin = (v: number) =>
      v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    return {
      hue,
      light: 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b),
    };
  };

  // the page takes the dimension of the entry that is being read: its header can be seen in any of the three
  for (const [width, height] of [
    [1440, 900],
    [1024, 768],
    [390, 844],
  ] as const)
    test(`by day at ${width}×${height} the current page of the crumb can be read over the header's picture in each dimension, in an ink of the accent's own hue`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/survivalProgress/', { theme: 'light' });
      await page.locator('.entry').first().waitFor();
      await expect
        .poll(() =>
          page
            .locator('.head .bg img')
            .evaluate(
              (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
            ),
        )
        .toBe(true);
      const here = page.locator('.head .crumb .acc');
      const colours = () =>
        page.evaluate(() => ({
          text: getComputedStyle(document.querySelector('.head .crumb .acc')!)
            .color,
          // the accent itself, which lines, marks and hovers go on using
          mark: getComputedStyle(document.querySelector('.dim')!)
            .getPropertyValue('--accent')
            .trim(),
        }));
      for (const [dim, token, accent] of [
        ['overworld', '#0b6fb5', 'rgb(11, 111, 181)'],
        ['nether', '#c2330f', 'rgb(194, 51, 15)'],
        ['end', '#6234c4', 'rgb(98, 52, 196)'],
      ]) {
        await page.evaluate((d) => {
          document.documentElement.dataset.dim = d;
        }, dim);
        await atRest(page);
        await expect(here).toBeVisible();
        await expectLegible(page, '.head .crumb .acc');
        const { text, mark } = await colours();
        // lines and marks keep the accent; the words are the same hue, never lighter
        expect(mark, `${dim}: the accent`).toBe(token);
        const [ink, own] = [hueAndLight(text), hueAndLight(accent)];
        expect(Math.abs(ink.hue - own.hue), `${dim}: hue`).toBeLessThan(3);
        expect(ink.light, `${dim}: no lighter`).toBeLessThanOrEqual(
          own.light + 0.001,
        );
      }
      // by night the words are in the accent itself
      await page.evaluate(() => {
        document.documentElement.dataset.dim = 'overworld';
      });
      await page.locator('.dim-bar [data-action="theme"]:visible').click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await atRest(page);
      expect((await colours()).text).toBe('rgb(134, 205, 255)');
    });
});
