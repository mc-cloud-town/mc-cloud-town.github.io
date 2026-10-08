import { expect, test, type Page } from '@playwright/test';

const LEGACY = [
  '/join/',
  '/hardware/',
  '/openSource/',
  '/partner/',
  '/collaborative/',
  '/redstoneCollection/',
  '/architectureCollection/',
];

test.describe('legacy shell', () => {
  for (const route of LEGACY) {
    test(`${route} still renders inside the legacy shell`, async ({ page }) => {
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      await expect(page.locator('[data-shell="legacy"]')).toBeVisible();
      await expect(page.locator('.dim')).toHaveCount(0);
    });
  }
});

import {
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  expectTapTargets,
  expectTextFits,
  LOCALES,
  openPage,
  VIEWPORTS,
} from './helpers/dimensions';

test.describe('dimensions shell', () => {
  test('member page renders inside the new shell with the new typefaces', async ({
    page,
  }) => {
    await openPage(page, '/member/');
    await expect(page.locator('.dim-bar')).toBeVisible();
    await expect(page.locator('.dim-foot')).toBeVisible();
    await expect(page.locator('[data-shell="legacy"]')).toHaveCount(0);
    const fonts = await page.evaluate(() =>
      [...document.fonts]
        .filter((f) => f.status === 'loaded')
        .map((f) => f.family.replace(/"/g, '')),
    );
    expect(fonts).toContain('Chiron Hei HK');
  });

  test('theme toggle switches data-theme and survives a reload', async ({
    page,
  }) => {
    await openPage(page, '/member/', { theme: 'dark' });
    await page.locator('.dim-bar [data-action="theme"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('language select changes the nav copy', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    await page
      .locator('.dim-bar select[data-action="language"]')
      .selectOption('en');
    await expect(page.locator('.dim-bar nav')).toContainText('Overworld');
    await expectNoMissingKeys(page);
  });

  test('narrow screens get a menu that reaches every link', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, '/member/');
    await expect(page.locator('.dim-bar nav')).toBeHidden();
    await page.locator('.dim-bar [data-action="menu"]').click();
    const sheet = page.locator('.dim-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('a')).toHaveCount(6);
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });

  for (const vp of VIEWPORTS) {
    test(`shell fits ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await openPage(page, '/member/');
      await expectNoHorizontalScroll(page);
      await expectTapTargets(page);
      await expectTextFits(page);
      // scrolled down, page text legitimately passes under the fixed bar: check the footer on its own
      await page.locator('.dim-foot').scrollIntoViewIfNeeded();
      await expectTextFits(page, { within: '.dim-foot' });
    });
  }

  for (const locale of LOCALES) {
    for (const width of [880, 1024, 1280]) {
      test(`bar items fit and do not overlap: ${locale} ${width}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await openPage(page, '/member/', { locale });
        // wait until the locale's copy is rendered
        await expect(page.locator('.dim-bar nav')).toContainText(
          { zh_TW: '終界', zh_CN: '末地', en: 'The End' }[locale],
        );
        const problems = await page.evaluate(() => {
          const vw = window.innerWidth;
          const items = [
            ...document.querySelectorAll<HTMLElement>(
              '.dim-bar .logo, .dim-bar nav a, .dim-bar .pill',
            ),
          ].filter((el) => el.getBoundingClientRect().width > 0);
          const rects = items.map((el) => el.getBoundingClientRect());
          const out: string[] = [];
          // the logo must keep its aspect ratio, not be squeezed by the nav
          const img =
            document.querySelector<HTMLImageElement>('.dim-bar .logo img');
          if (img) {
            const r = img.getBoundingClientRect();
            if (r.width < (img.naturalWidth / img.naturalHeight) * r.height - 1)
              out.push('logo squeezed: ' + Math.round(r.width) + 'px');
          }
          const name = (el: HTMLElement) =>
            el.textContent?.trim() || el.className;
          rects.forEach((r, i) => {
            if (r.left < -0.5 || r.right > vw + 0.5)
              out.push('outside viewport: ' + name(items[i]));
            for (let j = i + 1; j < rects.length; j++) {
              const q = rects[j];
              if (
                Math.min(r.right, q.right) - Math.max(r.left, q.left) > 1 &&
                Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > 1
              )
                out.push('overlap: ' + name(items[i]) + ' x ' + name(items[j]));
            }
          });
          return out;
        });
        expect(problems, problems.join(', ')).toEqual([]);
      });
    }
  }

  test('resizing past the breakpoint closes the sheet and lets the page scroll again', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, '/member/');
    await page.locator('.dim-bar [data-action="menu"]').click();
    await expect(page.locator('.dim-sheet')).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('.dim-sheet')).toBeHidden();
    // nothing holds the page any more: no lock on the document, and the wheel moves it
    expect(
      await page.evaluate(() => [
        getComputedStyle(document.body).overflowY,
        getComputedStyle(document.documentElement).overflowY,
      ]),
    ).toEqual(['visible', 'visible']);
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 300);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
  });
});

const openSheet = async (page: Page) => {
  await page.locator('.dim-bar [data-action="menu"]').click();
  await expect(page.locator('.dim-sheet')).toHaveCSS('opacity', '1');
  await expect(page.locator('.dim-sheet a').last()).toHaveCSS('opacity', '1');
};

test.describe('dimensions shell: the menu is a designed transition', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('opening: the sheet fades up and its links arrive one after another', async ({
    page,
  }) => {
    await openPage(page, '/member/');
    await page.locator('.dim-sheet').waitFor({ state: 'attached' });
    const run = await page.evaluate(async () => {
      const sheet = document.querySelector<HTMLElement>('.dim-sheet')!;
      const links = [...sheet.querySelectorAll('a')];
      const opacity = (el: Element) => +getComputedStyle(el).opacity;
      const delayOf = (el: Element) =>
        Math.max(
          -1,
          ...el
            .getAnimations()
            .map((a) => Number(a.effect!.getComputedTiming().delay)),
        );
      document
        .querySelector<HTMLElement>('.dim-bar [data-action="menu"]')!
        .click();
      // let React commit, then look before a single frame has been painted
      await new Promise((r) => setTimeout(r, 0));
      const start = {
        sheet: opacity(sheet),
        moving: sheet.getAnimations().length,
        travel: getComputedStyle(sheet).transform,
        first: delayOf(links[0]),
        last: delayOf(links[links.length - 1]),
      };
      const frames: { sheet: number; first: number; last: number }[] = [];
      const t0 = performance.now();
      while (performance.now() - t0 < 900) {
        await new Promise((r) => requestAnimationFrame(r));
        frames.push({
          sheet: opacity(sheet),
          first: opacity(links[0]),
          last: opacity(links[links.length - 1]),
        });
      }
      return { start, frames, links: links.length };
    });
    expect(run.links).toBe(6);
    // immediately after the click it is not yet opaque, it is on its way, and it starts a little higher
    expect(run.start.sheet).toBeLessThan(1);
    expect(run.start.moving).toBeGreaterThan(0);
    expect(run.start.travel).not.toBe('none');
    // rising, never falling back, and it arrives
    const sheet = run.frames.map((f) => f.sheet);
    sheet.forEach((v, i) =>
      expect(v, `frame ${i}`).toBeGreaterThanOrEqual(
        (sheet[i - 1] ?? 0) - 0.001,
      ),
    );
    expect(sheet.at(-1)).toBe(1);
    // the last link starts after the first one, and both arrive
    expect(run.start.first).toBeGreaterThanOrEqual(0);
    expect(run.start.last).toBeGreaterThan(run.start.first);
    const seen = (k: 'first' | 'last') =>
      run.frames.findIndex((f) => f[k] > 0.5);
    expect(seen('first')).toBeGreaterThanOrEqual(0);
    expect(seen('last')).toBeGreaterThanOrEqual(seen('first'));
    expect(run.frames.at(-1)).toEqual({ sheet: 1, first: 1, last: 1 });
    await expect(page.locator('.dim-sheet')).toHaveCSS('transform', 'none');
  });

  test('the whole opening takes less than half a second', async ({ page }) => {
    await openPage(page, '/member/');
    await page.locator('.dim-sheet').waitFor({ state: 'attached' });
    const longest = await page.evaluate(async () => {
      document
        .querySelector<HTMLElement>('.dim-bar [data-action="menu"]')!
        .click();
      await new Promise((r) => setTimeout(r, 0));
      return Math.max(
        0,
        ...[...document.querySelectorAll('.dim-sheet, .dim-sheet a')].flatMap(
          (el) =>
            el.getAnimations().map((a) => {
              const t = a.effect!.getComputedTiming();
              return Number(t.delay ?? 0) + Number(t.duration ?? 0);
            }),
        ),
      );
    });
    expect(longest).toBeGreaterThan(200);
    expect(longest).toBeLessThanOrEqual(460);
  });

  test('closing: the sheet fades out first and only then leaves, and Tab never reaches it', async ({
    page,
  }) => {
    await openPage(page, '/member/');
    await openSheet(page);
    const closing = await page.evaluate(async () => {
      const sheet = document.querySelector<HTMLElement>('.dim-sheet')!;
      document
        .querySelector<HTMLElement>('.dim-bar [data-action="menu"]')!
        .click();
      await new Promise((r) => setTimeout(r, 0));
      const cs = getComputedStyle(sheet);
      return {
        visibility: cs.visibility,
        display: cs.display,
        pointer: cs.pointerEvents,
        inert: sheet.inert,
        longest: Math.max(
          0,
          ...sheet.getAnimations().map((a) => {
            const t = a.effect!.getComputedTiming();
            return Number(t.delay ?? 0) + Number(t.duration ?? 0);
          }),
        ),
      };
    });
    // still there and on its way out, but already out of reach
    expect(closing.display).not.toBe('none');
    expect(closing.visibility).toBe('visible');
    expect(closing.pointer).toBe('none');
    expect(closing.inert).toBe(true);
    expect(closing.longest).toBeGreaterThanOrEqual(150);
    expect(closing.longest).toBeLessThanOrEqual(260);
    await expect(page.locator('.dim-sheet')).toHaveCSS('visibility', 'hidden');
    await expect(page.locator('.dim-sheet')).toHaveCSS('opacity', '0');
    // the page scrolls again
    expect(
      await page.evaluate(() => getComputedStyle(document.body).overflow),
    ).not.toBe('hidden');
    // a full round of Tab stops only outside the sheet
    const stops: boolean[] = [];
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press('Tab');
      stops.push(
        await page.evaluate(
          () => !!document.activeElement?.closest('.dim-sheet'),
        ),
      );
    }
    expect(stops).toHaveLength(14);
    expect(stops).not.toContain(true);
  });

  test('focus moves to the first link on open and back to the button on close', async ({
    page,
  }) => {
    await openPage(page, '/member/');
    const button = page.locator('.dim-bar [data-action="menu"]');
    const first = page.locator('.dim-sheet a').first();
    await button.click();
    await expect(first).toBeFocused();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await button.click();
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.click();
    await expect(first).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
    await expect(page.locator('.dim-sheet')).toBeHidden();
  });

  test('after closing, a click where a link was reaches the page underneath', async ({
    page,
  }) => {
    await openPage(page, '/member/');
    await openSheet(page);
    const box = (await page.locator('.dim-sheet a').nth(2).boundingBox())!;
    const x = box.x + 40,
      y = box.y + box.height / 2;
    await page.evaluate(() => {
      document.addEventListener(
        'click',
        (e) => {
          const t = e.target as HTMLElement;
          if (t.closest('.dim-bar')) return;
          e.preventDefault();
          (window as unknown as { hit: string }).hit = t.closest('.dim-sheet')
            ? 'sheet'
            : t.closest('main')
              ? 'page'
              : t.tagName;
        },
        true,
      );
    });
    // already during the fade the sheet is not what is under the pointer
    const during = await page.evaluate(
      async ([px, py]) => {
        document
          .querySelector<HTMLElement>('.dim-bar [data-action="menu"]')!
          .click();
        await new Promise((r) => setTimeout(r, 0));
        const sheet = document.querySelector('.dim-sheet')!;
        return {
          fading: getComputedStyle(sheet).visibility === 'visible',
          sheet: !!document.elementFromPoint(px, py)?.closest('.dim-sheet'),
        };
      },
      [x, y],
    );
    expect(during).toEqual({ fading: true, sheet: false });
    await expect(page.locator('.dim-sheet')).toHaveCSS('visibility', 'hidden');
    await page.mouse.click(x, y);
    expect(
      await page.evaluate(() => (window as unknown as { hit: string }).hit),
    ).toBe('page');
  });

  test('reduced motion: a brief fade, no travel, every link together', async ({
    page,
  }) => {
    await openPage(page, '/member/', { reducedMotion: true });
    await page.locator('.dim-sheet').waitFor({ state: 'attached' });
    const run = await page.evaluate(async () => {
      const sheet = document.querySelector<HTMLElement>('.dim-sheet')!;
      const links = [...sheet.querySelectorAll('a')];
      const closed = getComputedStyle(sheet).visibility;
      document
        .querySelector<HTMLElement>('.dim-bar [data-action="menu"]')!
        .click();
      await new Promise((r) => setTimeout(r, 0));
      const timing = [sheet, ...links].flatMap((el) =>
        el.getAnimations().map((a) => {
          const t = a.effect!.getComputedTiming();
          return Number(t.delay ?? 0) + Number(t.duration ?? 0);
        }),
      );
      return {
        closed,
        longest: Math.max(0, ...timing),
        travel: getComputedStyle(sheet).transform,
        links: links.map((a) => [
          getComputedStyle(a).opacity,
          getComputedStyle(a).transform,
        ]),
      };
    });
    expect(run.closed).toBe('hidden');
    expect(run.longest).toBeLessThanOrEqual(120);
    expect(run.travel).toBe('none');
    expect(run.links).toHaveLength(6);
    for (const l of run.links) expect(l).toEqual(['1', 'none']);
    await expect(page.locator('.dim-sheet')).toHaveCSS('opacity', '1');
    await page.keyboard.press('Escape');
    await expect(page.locator('.dim-sheet')).toHaveCSS('visibility', 'hidden');
  });

  test('the menu button swaps its icon and fills while the sheet is open', async ({
    page,
  }) => {
    await openPage(page, '/member/');
    const button = page.locator('.dim-bar [data-action="menu"]');
    const bars = button.locator('.anticon-menu'),
      cross = button.locator('.anticon-close');
    await expect(button.locator('svg')).toHaveCount(2);
    await expect(button).toHaveAccessibleName('選單');
    await expect(bars).toHaveCSS('opacity', '1');
    await expect(cross).toHaveCSS('opacity', '0');
    const empty = await button.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    // on its way: both the icons and the fill are moving
    const moving = await page.evaluate(async () => {
      const b = document.querySelector<HTMLElement>(
        '.dim-bar [data-action="menu"]',
      )!;
      b.click();
      await new Promise((r) => setTimeout(r, 0));
      return [
        b.getAnimations().length,
        b.querySelector('.anticon-close')!.getAnimations().length,
      ];
    });
    expect(moving[0]).toBeGreaterThan(0);
    expect(moving[1]).toBeGreaterThan(0);
    await expect(button).toHaveAccessibleName('關閉');
    await expect(bars).toHaveCSS('opacity', '0');
    await expect(cross).toHaveCSS('opacity', '1');
    await expect(button).not.toHaveCSS('background-color', empty);
    await button.click();
    // off the button: where a pointer hovers, the fill is also the hover state
    await page.mouse.move(10, 400);
    await expect(bars).toHaveCSS('opacity', '1');
    await expect(button).toHaveCSS('background-color', empty);
  });
});

test.describe('dimensions shell: icons and state changes', () => {
  test('the theme button shows a moon at night and a sun by day, and cross-fades between them', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/', { theme: 'dark' });
    const button = page.locator('.dim-bar [data-action="theme"]');
    const sun = button.locator('.anticon-sun'),
      moon = button.locator('.anticon-moon');
    await expect(button).toHaveAccessibleName('切換白天或夜晚');
    await expect(button.locator('svg')).toHaveCount(2);
    await expect(moon).toHaveCSS('opacity', '1');
    await expect(sun).toHaveCSS('opacity', '0');
    const moving = await page.evaluate(async () => {
      const b = document.querySelector<HTMLElement>(
        '.dim-bar [data-action="theme"]',
      )!;
      b.click();
      // the theme attribute is written in an effect
      await new Promise((r) => setTimeout(r, 50));
      return [
        document.documentElement.dataset.theme,
        b.querySelector('.anticon-sun')!.getAnimations().length,
      ];
    });
    expect(moving[0]).toBe('light');
    expect(moving[1]).toBeGreaterThan(0);
    await expect(sun).toHaveCSS('opacity', '1');
    await expect(moon).toHaveCSS('opacity', '0');
    await expect(sun).toHaveCSS('transform', 'none');
  });

  test('every bar control carries an icon and keeps its name', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    await expect(page.locator('.dim-bar .lang svg')).toHaveCount(1);
    await expect(
      page.locator('.dim-bar select[data-action="language"]'),
    ).toHaveAccessibleName('語言');
    await expect(page.locator('.dim-bar .discord svg')).toHaveCount(1);
    await expect(page.locator('.dim-bar .discord')).toContainText('Discord');
    // the decorative icons say nothing to a screen reader
    expect(await page.locator('.dim-bar .anticon').count()).toBeGreaterThan(3);
    const spoken = await page
      .locator('.dim-bar .anticon')
      .evaluateAll(
        (els) => els.filter((el) => !el.closest('[aria-hidden="true"]')).length,
      );
    expect(spoken).toBe(0);
  });

  test('switching theme cross-fades the surfaces instead of snapping', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/', { theme: 'dark' });
    await page.locator('.person').first().waitFor();
    const seconds = (sel: string, prop: string) =>
      page
        .locator(sel)
        .first()
        .evaluate((el, p) => {
          const cs = getComputedStyle(el);
          const props = cs.transitionProperty.split(',').map((x) => x.trim());
          const durs = cs.transitionDuration.split(',').map(parseFloat);
          const i = props.findIndex((x) => x === p || x === 'background');
          return i < 0 ? 0 : durs[i % durs.length];
        }, prop);
    expect(await seconds('.dim', 'background-color')).toBeGreaterThan(0);
    for (const sel of ['.dim-bar', '.tools', '.dim-foot'])
      expect(await seconds(sel, 'border-color'), sel).toBeGreaterThan(0);
    for (const sel of ['.dim-bar', '.tools'])
      expect(await seconds(sel, 'background-color'), sel).toBeGreaterThan(0);
    expect(await seconds('.dim-bar .pill', 'background-color')).toBeGreaterThan(
      0,
    );
    expect(await seconds('.dim-bar nav a', 'opacity')).toBeGreaterThan(0);
    expect(await seconds('.dim-foot a', 'color')).toBeGreaterThan(0);
    // nothing uses the catch-all
    const all = await page.evaluate(
      () =>
        [...document.querySelectorAll('.dim, .dim *')].filter(
          (el) =>
            getComputedStyle(el)
              .transitionProperty.split(', ')
              .includes('all') &&
            parseFloat(getComputedStyle(el).transitionDuration) > 0,
        ).length,
    );
    expect(all).toBe(0);
    // and the bar really is in between right after the click
    const moving = await page.evaluate(async () => {
      document
        .querySelector<HTMLElement>('.dim-bar [data-action="theme"]')!
        .click();
      await new Promise((r) => setTimeout(r, 50));
      return document.querySelector('.dim-bar')!.getAnimations().length;
    });
    expect(moving).toBeGreaterThan(0);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});
