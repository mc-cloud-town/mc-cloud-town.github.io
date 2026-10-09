import { expect, test, type Page } from '@playwright/test';
import { ready } from './helpers/home';

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
  atRest,
  expectFooterLines,
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  expectTapTargets,
  expectTextFits,
  FOOTER_PAGES,
  LOCALES,
  NOT_HERE,
  openPage,
  setLanguage,
  skipIn,
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
    await setLanguage(page, 'en');
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

  test('opening, the panel is whole before a link shows; closing, the links are gone before the panel thins', async ({
    page,
  }) => {
    await openPage(page, '/member/');
    await page.locator('.dim-sheet').waitFor({ state: 'attached' });
    const sample = () =>
      page.evaluate(async () => {
        const sheet = document.querySelector<HTMLElement>('.dim-sheet')!;
        const links = [...sheet.querySelectorAll('a')];
        const opacity = (el: Element) => +getComputedStyle(el).opacity;
        document
          .querySelector<HTMLElement>('.dim-bar [data-action="menu"]')!
          .click();
        const frames: { sheet: number; links: number }[] = [];
        const t0 = performance.now();
        while (performance.now() - t0 < 800) {
          await new Promise((r) => requestAnimationFrame(r));
          frames.push({
            sheet: opacity(sheet),
            links: Math.max(...links.map(opacity)),
          });
        }
        return frames;
      });
    const opening = await sample();
    expect(opening.length).toBeGreaterThan(10);
    // both are seen on their way, so the order below is really observed
    expect(opening.some((f) => f.links > 0.02 && f.links < 0.98)).toBe(true);
    for (const [i, f] of opening.entries())
      if (f.links > 0.02)
        expect(f.sheet, `opening frame ${i}`).toBeGreaterThanOrEqual(0.9);
    expect(opening.at(-1)).toEqual({ sheet: 1, links: 1 });
    const closing = await sample();
    expect(closing.some((f) => f.sheet > 0.02 && f.sheet < 0.9)).toBe(true);
    for (const [i, f] of closing.entries())
      if (f.sheet < 0.9)
        expect(f.links, `closing frame ${i}`).toBeLessThanOrEqual(0.1);
    expect(closing.at(-1)).toEqual({ sheet: 0, links: 0 });
  });

  test('while the sheet is open Tab stays in the bar and the sheet, and the page is in reach again when it closes', async ({
    page,
  }) => {
    skipIn(['webkit'], NOT_HERE.tabToLinks);
    skipIn(['firefox'], NOT_HERE.tabWraps);
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    const outside = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('.dim > *')]
          .filter((el) => !el.matches('.dim-bar, .dim-sheet'))
          .map((el) => (el as HTMLElement).inert),
      );
    expect(await outside()).toEqual([false, false]);
    await openSheet(page);
    expect(await outside()).toEqual([true, true]);
    const where = () =>
      page.evaluate(() => {
        const el = document.activeElement;
        return el?.closest('.dim-sheet')
          ? 'sheet'
          : el?.closest('.dim-bar')
            ? 'bar'
            : el === document.body
              ? 'body'
              : 'page';
      });
    const stops: string[] = [];
    for (let i = 0; i < 24; i++) {
      await page.keyboard.press('Tab');
      stops.push(await where());
    }
    expect(stops).toContain('sheet');
    expect(stops).toContain('bar');
    expect(stops).not.toContain('page');
    await page.keyboard.press('Escape');
    await expect(page.locator('.dim-sheet')).toHaveCSS('visibility', 'hidden');
    expect(await outside()).toEqual([false, false]);
    const after: string[] = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      after.push(await where());
    }
    expect(after).toContain('page');
    expect(after).not.toContain('sheet');
  });

  test('opened with the pointer the first link shows no focus ring; opened with the keyboard it does', async ({
    page,
  }) => {
    skipIn(['firefox'], NOT_HERE.focusRing);
    await openPage(page, '/member/');
    const button = page.locator('.dim-bar [data-action="menu"]');
    const first = page.locator('.dim-sheet a').first();
    const ring = () => first.evaluate((el) => el.matches(':focus-visible'));
    const box = (await button.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(first).toBeFocused();
    expect(await ring()).toBe(false);
    await expect(first).toHaveCSS('outline-style', 'none');
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(first).toBeFocused();
    expect(await ring()).toBe(true);
    await expect(first).toHaveCSS('outline-style', 'solid');
  });

  test('with the sheet open the scroll keys are held, but not with Ctrl, Meta or Alt', async ({
    page,
  }) => {
    await openPage(page, '/member/');
    await openSheet(page);
    const prevented = (init: {
      key: string;
      ctrlKey?: boolean;
      metaKey?: boolean;
      altKey?: boolean;
      shiftKey?: boolean;
    }) =>
      page.evaluate((o) => {
        const e = new KeyboardEvent('keydown', {
          ...o,
          bubbles: true,
          cancelable: true,
        });
        document.querySelector('.dim-sheet a')!.dispatchEvent(e);
        return e.defaultPrevented;
      }, init);
    for (const key of ['ArrowDown', 'PageDown', 'End', 'Home', ' ']) {
      expect(await prevented({ key }), key).toBe(true);
      expect(await prevented({ key, ctrlKey: true }), `Ctrl+${key}`).toBe(
        false,
      );
      expect(await prevented({ key, metaKey: true }), `Meta+${key}`).toBe(
        false,
      );
      expect(await prevented({ key, altKey: true }), `Alt+${key}`).toBe(false);
    }
    // Shift is not a shortcut: Shift+Space scrolls back
    expect(await prevented({ key: ' ', shiftKey: true })).toBe(true);
  });

  test('a link in the sheet closes it and goes to its page', async ({
    page,
  }) => {
    await openPage(page, '/survivalProgress/');
    await openSheet(page);
    await page.locator('.dim-sheet a[href="/member/"]').click();
    await expect(page).toHaveURL(/\/member\/$/);
    await expect(page.locator('.head h1')).toBeVisible();
    await expect(page.locator('.dim-sheet')).toHaveCSS('visibility', 'hidden');
    await expect(page.locator('.dim-bar [data-action="menu"]')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    // nothing is left holding the page
    expect(
      await page.evaluate(() => document.querySelector('main')!.inert),
    ).toBe(false);
    // (the step is a transition now: the page is the reader's when its cover has gone)
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
    await expect(page.locator('html')).not.toHaveAttribute('data-nav', /.*/);
    await page.mouse.move(195, 500);
    await page.mouse.wheel(0, 300);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
  });

  test('switching language with the sheet open keeps it open, in the new language, with the page still held', async ({
    page,
  }) => {
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await page.evaluate(() => window.scrollTo(0, 300));
    await openSheet(page);
    const sheet = page.locator('.dim-sheet');
    const button = page.locator('.dim-bar [data-action="menu"]');
    await setLanguage(page, 'en');
    await expect(sheet.locator('a')).toHaveText([
      'Overworld',
      'Nether',
      'The End',
      'Progress',
      'Members',
      'Join us',
    ]);
    await expect(button).toHaveAccessibleName('Close');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(sheet).toHaveCSS('opacity', '1');
    await expect(sheet).toHaveCSS('visibility', 'visible');
    for (const a of await sheet.locator('a').all())
      await expect(a).toHaveCSS('opacity', '1');
    expect(await sheet.evaluate((el) => (el as HTMLElement).inert)).toBe(false);
    expect(
      await page.evaluate(() => document.querySelector('main')!.inert),
    ).toBe(true);
    await page.mouse.move(195, 500);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.scrollY)).toBe(300);
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCSS('visibility', 'hidden');
    await expect(button).toHaveAccessibleName('Menu');
    expect(
      await page.evaluate(() => document.querySelector('main')!.inert),
    ).toBe(false);
  });

  test('when the sheet closes because the screen grew, focus is on the same link in the bar, not on the hidden button', async ({
    page,
  }) => {
    skipIn(['webkit'], NOT_HERE.tabToLinks);
    await openPage(page, '/member/');
    await openSheet(page);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() =>
      document.activeElement?.closest('.dim-sheet')
        ? document.activeElement.getAttribute('href')
        : null,
    );
    expect(focused).toBeTruthy();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('.dim-sheet')).toBeHidden();
    await expect(page.locator('.dim-bar [data-action="menu"]')).toBeHidden();
    const link = page.locator(`.dim-bar nav a[href="${focused}"]`);
    await expect(link).toBeVisible();
    await expect(link).toBeFocused();
    expect(
      await page.evaluate(() => document.querySelector('main')!.inert),
    ).toBe(false);
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
    // the pill says what it is for and what is chosen
    await expect(
      page.locator('.dim-bar [data-action="language"]'),
    ).toHaveAccessibleName('語言：繁體中文');
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

test.describe('dimensions shell: the language menu', () => {
  const trigger = (page: Page) =>
    page.locator('.dim-bar [data-action="language"]');
  const list = (page: Page) => page.locator('.dim-bar .lang-list');
  const options = (page: Page) => list(page).locator('[role="option"]');
  /** The option the keyboard is on. */
  const active = (page: Page) =>
    list(page).locator('[role="option"][data-active="true"]');

  test('the pill opens a list in the design, with the current language marked', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    // no system control any more
    await expect(page.locator('.dim-bar select')).toHaveCount(0);
    await expect(trigger(page)).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger(page)).toContainText('繁');
    await expect(list(page)).toHaveCSS('visibility', 'hidden');
    await trigger(page).click();
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(list(page)).toHaveAttribute('role', 'listbox');
    await expect(list(page)).toHaveCSS('opacity', '1');
    // endonyms, the same in every language
    await expect(options(page)).toHaveText(['繁體中文', '简体中文', 'English']);
    await expect(options(page).nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(options(page).nth(1)).toHaveAttribute(
      'aria-selected',
      'false',
    );
    // the current one in the accent colour of the page (the End, on the members page)
    await expect(options(page).nth(0)).toHaveCSS('color', 'rgb(205, 176, 255)');
    await expect(options(page).nth(2)).toHaveCSS('color', 'rgb(242, 244, 246)');
    // a surface of the bar's family: the page's ground, a hairline, rounded; under the pill, flush with its right edge
    await expect(list(page)).toHaveCSS('background-color', 'rgb(6, 8, 11)');
    await expect(list(page)).toHaveCSS('border-top-width', '1px');
    await expect(list(page)).not.toHaveCSS('border-top-left-radius', '0px');
    const [pill, panel] = await Promise.all([
      trigger(page).boundingBox(),
      list(page).boundingBox(),
    ]);
    expect(panel!.y).toBeGreaterThanOrEqual(pill!.y + pill!.height);
    expect(panel!.y - (pill!.y + pill!.height)).toBeLessThan(16);
    expect(
      Math.abs(panel!.x + panel!.width - (pill!.x + pill!.width)),
    ).toBeLessThan(1.5);
    // choosing switches, closes, and is remembered
    await options(page).nth(2).click();
    await expect(page.locator('.dim-bar nav')).toContainText('Overworld');
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(list(page)).toHaveCSS('visibility', 'hidden');
    await expect(trigger(page)).toContainText('EN');
    await expect(trigger(page)).toBeFocused();
    await page.reload();
    await expect(page.locator('.dim-bar nav')).toContainText('Overworld');
    await trigger(page).click();
    await expect(options(page).nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(options(page)).toHaveText(['繁體中文', '简体中文', 'English']);
    await expectNoMissingKeys(page);
  });

  test('it is operated from the keyboard: arrows move, Enter chooses, Escape and Tab close', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    await trigger(page).focus();
    await page.keyboard.press('Enter');
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
    // it opens on the current language
    await expect(active(page)).toHaveText('繁體中文');
    await expect(list(page)).toBeFocused();
    expect(await list(page).getAttribute('aria-activedescendant')).toBe(
      await active(page).getAttribute('id'),
    );
    await page.keyboard.press('ArrowDown');
    await expect(active(page)).toHaveText('简体中文');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(active(page)).toHaveText('English');
    await page.keyboard.press('Home');
    await expect(active(page)).toHaveText('繁體中文');
    await page.keyboard.press('End');
    await expect(active(page)).toHaveText('English');
    await page.keyboard.press('ArrowUp');
    await expect(active(page)).toHaveText('简体中文');
    // Escape: closed, nothing chosen, focus back on the pill
    await page.keyboard.press('Escape');
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger(page)).toBeFocused();
    await expect(page.locator('.dim-bar nav')).toContainText('主世界');
    // Space opens too; Enter chooses
    await page.keyboard.press('Space');
    await expect(list(page)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('.dim-bar nav')).toContainText('地狱');
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger(page)).toBeFocused();
    await expect(trigger(page)).toContainText('简');
    // the arrow keys open it as well; Space chooses
    await page.keyboard.press('ArrowDown');
    await expect(active(page)).toHaveText('简体中文');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Space');
    await expect(page.locator('.dim-bar nav')).toContainText('地獄');
    // Tab closes and moves on
    await page.keyboard.press('Enter');
    await expect(list(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(list(page)).toHaveCSS('visibility', 'hidden');
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest('.dim-bar .lang'),
      ),
    ).toBe(false);
    await expect(page.locator('.dim-bar nav')).toContainText('地獄');
  });

  test('a click outside closes it, and so does the pill itself', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await trigger(page).click();
    await expect(list(page)).toHaveCSS('opacity', '1');
    await page.mouse.click(400, 500);
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(list(page)).toHaveCSS('visibility', 'hidden');
    await trigger(page).click();
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
    await trigger(page).click();
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.dim-bar nav')).toContainText('主世界');
    // closed, it is out of reach of the pointer and of Tab
    expect(
      await list(page).evaluate((el) => [
        (el as HTMLElement).inert,
        getComputedStyle(el).pointerEvents,
      ]),
    ).toEqual([true, 'none']);
  });

  test('it opens and closes as a transition: fading in while it comes down from the pill', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    const run = () =>
      page.evaluate(async () => {
        const el = document.querySelector<HTMLElement>('.dim-bar .lang-list')!;
        document
          .querySelector<HTMLElement>('.dim-bar [data-action="language"]')!
          .click();
        await new Promise((r) => setTimeout(r, 0));
        const timing = el.getAnimations().map((a) => {
          const t = a.effect!.getComputedTiming();
          return [
            (a as CSSTransition).transitionProperty,
            Number(t.delay ?? 0) + Number(t.duration ?? 0),
          ] as [string, number];
        });
        const frames: { opacity: number; y: number; visible: boolean }[] = [];
        const t0 = performance.now();
        while (performance.now() - t0 < 700) {
          await new Promise((r) => requestAnimationFrame(r));
          const c = getComputedStyle(el);
          frames.push({
            opacity: +c.opacity,
            y: new DOMMatrix(c.transform).f,
            visible: c.visibility === 'visible',
          });
        }
        return { timing, frames };
      });
    const opening = await run();
    const fade = opening.timing.find(([p]) => p === 'opacity');
    const move = opening.timing.find(([p]) => p === 'transform');
    expect(fade?.[1]).toBeGreaterThanOrEqual(150);
    expect(fade?.[1]).toBeLessThanOrEqual(450);
    expect(move?.[1]).toBeGreaterThanOrEqual(150);
    expect(move?.[1]).toBeLessThanOrEqual(450);
    const o = opening.frames.map((f) => f.opacity);
    // seen on its way, rising and never falling back, and it arrives in place
    expect(o.some((v) => v > 0.02 && v < 0.98)).toBe(true);
    o.forEach((v, i) =>
      expect(v, `frame ${i}`).toBeGreaterThanOrEqual((o[i - 1] ?? 0) - 0.001),
    );
    expect(opening.frames[0].y).toBeLessThan(0);
    expect(opening.frames.at(-1)).toEqual({ opacity: 1, y: 0, visible: true });
    const closing = await run();
    const out = closing.frames.map((f) => f.opacity);
    expect(out.some((v) => v > 0.02 && v < 0.98)).toBe(true);
    // still to be seen while it fades, gone from sight only at the end
    expect(closing.frames[0].visible).toBe(true);
    expect(closing.frames.at(-1)!.opacity).toBe(0);
    expect(closing.frames.at(-1)!.visible).toBe(false);
    const leave = closing.timing.find(([p]) => p === 'opacity');
    expect(leave?.[1]).toBeGreaterThanOrEqual(100);
    expect(leave?.[1]).toBeLessThan(fade![1]);
  });

  test('reduced motion: a brief fade, no travel', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/', { reducedMotion: true });
    const run = await page.evaluate(async () => {
      const el = document.querySelector<HTMLElement>('.dim-bar .lang-list')!;
      const before = getComputedStyle(el).transform;
      document
        .querySelector<HTMLElement>('.dim-bar [data-action="language"]')!
        .click();
      await new Promise((r) => setTimeout(r, 0));
      return {
        before,
        during: getComputedStyle(el).transform,
        longest: Math.max(
          0,
          ...el.getAnimations().map((a) => {
            const t = a.effect!.getComputedTiming();
            return Number(t.delay ?? 0) + Number(t.duration ?? 0);
          }),
        ),
      };
    });
    expect(run.before).toBe('none');
    expect(run.during).toBe('none');
    expect(run.longest).toBeGreaterThan(0);
    expect(run.longest).toBeLessThanOrEqual(120);
    await expect(list(page)).toHaveCSS('opacity', '1');
    await options(page).nth(2).click();
    await expect(page.locator('.dim-bar nav')).toContainText('Overworld');
  });

  for (const [width, height, theme] of [
    [390, 844, 'light'],
    [844, 390, 'dark'],
    [1024, 768, 'dark'],
  ] as const)
    test(`at ${width}×${height} the list is on screen and every row is big enough to tap (${theme})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/member/', { theme });
      await trigger(page).click();
      await expect(list(page)).toHaveCSS('opacity', '1');
      const rows = await options(page).evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return {
            w: r.width,
            h: r.height,
            inside:
              r.left >= 0 &&
              r.top >= 0 &&
              r.right <= window.innerWidth &&
              r.bottom <= window.innerHeight,
            size: parseFloat(getComputedStyle(el).fontSize),
          };
        }),
      );
      expect(rows).toHaveLength(3);
      for (const r of rows) {
        // 44px is the requirement, and the styles ask for exactly that. A box that is laid out at 44px can be
        // measured a fraction under it (43.99999 was read here now and then): the same half pixel of rounding
        // that expectTapTargets allows, and no more.
        expect(r.w).toBeGreaterThanOrEqual(43.5);
        expect(r.h).toBeGreaterThanOrEqual(43.5);
        expect(r.inside).toBe(true);
        expect(r.size).toBeGreaterThanOrEqual(14);
      }
      await expectNoHorizontalScroll(page);
      await expectTapTargets(page);
      if (theme === 'light')
        await expect(list(page)).toHaveCSS(
          'background-color',
          'rgb(238, 242, 245)',
        );
    });

  test('next to the open menu sheet: it opens above the sheet, and neither closes the other', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await page.evaluate(() => window.scrollTo(0, 300));
    await openSheet(page);
    const sheet = page.locator('.dim-sheet');
    await trigger(page).click();
    await expect(list(page)).toHaveCSS('opacity', '1');
    await expect(sheet).toHaveCSS('opacity', '1');
    // the list is what is on top where it stands
    const onTop = await options(page)
      .nth(1)
      .evaluate((el) => {
        const r = el.getBoundingClientRect();
        return !!document
          .elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
          ?.closest('.lang-list');
      });
    expect(onTop).toBe(true);
    // the arrows move in the list; they do not scroll anything
    await page.keyboard.press('ArrowDown');
    await expect(active(page)).toHaveText('简体中文');
    // Escape closes the list only
    await page.keyboard.press('Escape');
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(sheet).toHaveCSS('opacity', '1');
    await expect(page.locator('.dim-bar [data-action="menu"]')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    // choose one: the sheet stays, in the new language, with the page still held
    await setLanguage(page, 'en');
    await expect(sheet.locator('a').first()).toHaveText('Overworld');
    await expect(sheet).toHaveCSS('opacity', '1');
    expect(await page.evaluate(() => window.scrollY)).toBe(300);
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCSS('visibility', 'hidden');
  });
});

test.describe('dimensions shell: the dimension is on the document from the first paint', () => {
  interface DimLog {
    /** every value of `<html data-dim>` from the first frame on, in order, without repeats */
    dims: (string | null)[];
    /** what it was when the first element of the shell had been parsed */
    atShell?: string | null;
    /** what it was, and how the document scrolled, when the parser had finished: before hydration */
    atParsed?: { dim: string | null; scroll: string; hydrated: boolean };
  }
  /** Watch `<html data-dim>` from before the page's own first script. */
  const watchDim = (page: Page) =>
    page.addInitScript(() => {
      const w = window as unknown as { __dim: DimLog };
      const log: DimLog = { dims: [] };
      w.__dim = log;
      const read = () => document.documentElement.getAttribute('data-dim');
      const hydrated = () => {
        const bar = document.querySelector('.dim-bar, [data-shell="legacy"]');
        return Boolean(
          bar && Object.keys(bar).some((k) => k.startsWith('__reactFiber')),
        );
      };
      new MutationObserver(() => {
        const d = read();
        if (log.dims.at(-1) !== d) log.dims.push(d);
        if (log.atShell === undefined && document.querySelector('.dim'))
          log.atShell = d;
      }).observe(document, {
        attributes: true,
        attributeFilter: ['data-dim'],
        childList: true,
        subtree: true,
      });
      document.addEventListener('DOMContentLoaded', () => {
        log.atParsed = {
          dim: read(),
          scroll: getComputedStyle(document.documentElement).scrollBehavior,
          hydrated: hydrated(),
        };
      });
    });
  const hydrated = (page: Page) =>
    page.waitForFunction(() => {
      const bar = document.querySelector('.dim-bar, [data-shell="legacy"]');
      return Boolean(
        bar && Object.keys(bar).some((k) => k.startsWith('__reactFiber')),
      );
    });
  const dimLog = (page: Page) =>
    page.evaluate(() => (window as unknown as { __dim: DimLog }).__dim);

  for (const [path, dim] of [
    ['/member/', 'end'],
    ['/survivalProgress/', 'overworld'],
    ['/survival/', 'overworld'],
    ['/', 'overworld'],
    ['/home/', 'overworld'],
  ] as const)
    test(`a hard load of ${path}: data-dim is ${dim} before the page is parsed to its end, and never anything else`, async ({
      page,
    }) => {
      await watchDim(page);
      await openPage(page, path);
      await hydrated(page);
      // two more frames: whatever hydration's effects set has been set
      await page.evaluate(
        () =>
          new Promise((done) =>
            requestAnimationFrame(() => requestAnimationFrame(done)),
          ),
      );
      const log = await dimLog(page);
      // the page's own dimension is there when the shell's first element is, and when the parser ends
      expect(log.atShell).toBe(dim);
      expect(log.atParsed).toEqual({ dim, scroll: 'auto', hydrated: false });
      // and hydration does not take it through another one on the way (members: not the overworld first)
      expect(log.dims.filter((d) => d !== null)).toEqual([dim]);
      await expect(page.locator('html')).toHaveAttribute('data-dim', dim);
    });

  test('a legacy page never has it', async ({ page }) => {
    await watchDim(page);
    await page.goto('/join/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-shell="legacy"]')).toBeVisible();
    await hydrated(page);
    const log = await dimLog(page);
    expect(log.atParsed?.dim).toBeNull();
    // the legacy pages keep the site's own smooth scrolling
    expect(log.atParsed?.scroll).toBe('smooth');
    expect(log.dims.filter((d) => d !== null)).toEqual([]);
    expect(
      await page.evaluate(() =>
        document.documentElement.hasAttribute('data-dim'),
      ),
    ).toBe(false);
  });

  test('leaving the shell for a legacy page without a reload takes it away, and coming back brings the page’s own', async ({
    page,
  }) => {
    await openPage(page, '/member/');
    await hydrated(page);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
    await page.evaluate(() => {
      // a client-side step to a legacy page, as Next's router makes it
      (
        window as unknown as { next: { router: { push: (u: string) => void } } }
      ).next.router.push('/join/');
    });
    await expect(page.locator('[data-shell="legacy"]')).toBeVisible();
    expect(
      await page.evaluate(() =>
        document.documentElement.hasAttribute('data-dim'),
      ),
    ).toBe(false);
    await page.goBack();
    await expect(page.locator('.dim .head h1')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
  });
});

test.describe('footer: the other pages of the site', () => {
  /** The six links of the row, by language, in the footer's order. */
  const WORDS = {
    zh_TW: {
      label: '其他頁面',
      links: [
        '紅石作品',
        '建築作品',
        '開源項目',
        '伺服器硬體',
        '合作夥伴及團隊',
        '加入我們',
      ],
    },
    zh_CN: {
      label: '其他页面',
      links: [
        '红石作品',
        '建筑作品',
        '开源项目',
        '服务器硬件',
        '合作伙伴及团队',
        '加入我们',
      ],
    },
    en: {
      label: 'More pages',
      links: [
        'Redstone',
        'Building',
        'Open Source',
        'Server Hardware',
        'Partners',
        'Join Us',
      ],
    },
  } as const;

  for (const [path, first] of [
    ['/', '.hero h1'],
    ['/survivalProgress/', '.entry'],
    ['/member/', '.person'],
  ] as const)
    test(`${path} leads to every legacy page from its footer, as a labelled group`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await openPage(page, path);
      if (path === '/') await ready(page);
      await page.locator(first).first().waitFor();
      const group = page.locator('.dim-foot nav.pages');
      await expect(group).toHaveCount(1);
      await expect(group).toHaveAccessibleName(WORDS.zh_TW.label);
      await expect(
        page.getByRole('navigation', { name: '其他頁面' }),
      ).toHaveCount(1);
      const links = group.locator('a');
      await expect(links).toHaveText([...WORDS.zh_TW.links]);
      expect(
        await links.evaluateAll((as) => as.map((a) => a.getAttribute('href'))),
      ).toEqual([...FOOTER_PAGES]);
      // every legacy route is one of them, or the same page under its other address
      const reachable = new Set<string>([...FOOTER_PAGES, '/collaborative/']);
      for (const route of LEGACY) expect(reachable.has(route)).toBe(true);
    });

  for (const locale of LOCALES)
    for (const [width, height] of [
      [1440, 900],
      [1024, 768],
      [768, 1024],
      [390, 844],
      [360, 740],
    ] as const)
      test(`the row at ${width}×${height} in ${locale}: the footer's own type, its words evenly spaced, big enough to tap`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height });
        await openPage(page, '/member/', { locale });
        await page.locator('.person').first().waitFor();
        await page.locator('.dim-foot').scrollIntoViewIfNeeded();
        await atRest(page);
        const group = page.locator('.dim-foot nav.pages');
        await expect(group.locator('.label')).toHaveText(WORDS[locale].label);
        await expect(group.locator('a')).toHaveText([...WORDS[locale].links]);
        await expectNoMissingKeys(page);
        // the same type and the same hover as the links out of the site
        const style = (sel: string) =>
          page
            .locator(sel)
            .first()
            .evaluate((el) => {
              const c = getComputedStyle(el);
              return [
                c.fontFamily,
                c.fontSize,
                c.fontWeight,
                c.color,
                c.transitionProperty,
                c.transitionDuration,
              ];
            });
        expect(await style('.dim-foot .pages a')).toEqual(
          await style('.dim-foot .links a'),
        );
        await expectFooterLines(page);
        await expectTextFits(page, { within: '.dim-foot' });
        await expectTapTargets(page);
        await expectNoHorizontalScroll(page);
        // no word is broken: each link is one line
        for (const a of await group.locator('a').all())
          expect((await a.boundingBox())!.height).toBeLessThanOrEqual(44.5);
      });

  test('a link of the row eases to the accent under the pointer, like the other links of the footer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    const link = page.locator('.dim-foot .pages a').first();
    await link.scrollIntoViewIfNeeded();
    await atRest(page);
    const rest = await link.evaluate((el) => getComputedStyle(el).color);
    await link.hover();
    // on its way: neither the colour at rest nor the accent yet
    const colours = await link.evaluate(
      (el) =>
        new Promise<string[]>((done) => {
          const seen: string[] = [];
          const tick = () => {
            seen.push(getComputedStyle(el).color);
            if (seen.length < 30) requestAnimationFrame(tick);
            else done(seen);
          };
          tick();
        }),
    );
    expect(new Set(colours).size).toBeGreaterThan(3);
    expect(colours.at(-1)).not.toBe(rest);
    await expect(link).toHaveCSS('color', 'rgb(205, 176, 255)');
  });
});

test.describe('headings inside the shell', () => {
  for (const theme of ['dark', 'light'] as const)
    for (const [path, first, headings] of [
      ['/survivalProgress/', '.entry', ['.head h1', '.entry h2']],
      ['/member/', '.person', ['.head h1', '.group h2']],
    ] as const)
      test(`${path} (${theme}): its headings are in the shell's ink, not in the legacy pages' text colour`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openPage(page, path, { theme });
        await page.locator(first).first().waitFor();
        await atRest(page);
        const ink = theme === 'dark' ? 'rgb(242, 244, 246)' : 'rgb(15, 20, 24)';
        // the shell's own ground colour for text, which is what the page around them has
        await expect(page.locator('.dim')).toHaveCSS('color', ink);
        for (const sel of headings) {
          expect(await page.locator(sel).count(), sel).toBeGreaterThan(0);
          await expect(page.locator(sel).first(), sel).toHaveCSS('color', ink);
        }
      });
});

test.describe('the language of the document', () => {
  const TAGS = { zh_TW: 'zh-Hant', zh_CN: 'zh-Hans', en: 'en' } as const;

  for (const path of ['/', '/member/'] as const)
    for (const locale of LOCALES)
      test(`${path} opened in ${locale}: <html lang> is ${TAGS[locale]}, and follows a change of language, with no hydration warning`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        const said: string[] = [];
        page.on('console', (m) => {
          if (['error', 'warning'].includes(m.type())) said.push(m.text());
        });
        page.on('pageerror', (e) => said.push(e.message));
        await openPage(page, path, { locale });
        await expect(page.locator('html')).toHaveAttribute(
          'lang',
          TAGS[locale],
        );
        if (path === '/') await ready(page);
        // and by the bar's own list, to each of the other two
        for (const next of LOCALES.filter((l) => l !== locale)) {
          await setLanguage(page, next);
          await expect(page.locator('html')).toHaveAttribute(
            'lang',
            TAGS[next],
          );
        }
        expect(
          said.filter((s) => /hydrat|did not match|mismatch/i.test(s)),
        ).toEqual([]);
      });

  test('a legacy page keeps the language tag it is served with, also when it is reached from the shell', async ({
    page,
    browser,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // what a legacy page is served with, and keeps (a visit of its own: it would leave its language behind)
    const visit = await browser.newContext();
    const other = await visit.newPage();
    await other.goto('/join/');
    await expect(other.locator('[data-shell="legacy"]')).toBeVisible();
    const served = await other.locator('html').getAttribute('lang');
    expect(served).toBe('zh');
    await visit.close();
    // from a page of the shell that is in English, by the footer's link: the same document
    await openPage(page, '/member/', { locale: 'en' });
    await page.locator('.person').first().waitFor();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    const link = page.locator('.dim-foot .pages a[href="/join/"]');
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await expect(page.locator('[data-shell="legacy"]')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', served!);
    // and back in the shell it is the reader's language again
    await page.goBack();
    await page.locator('.person').first().waitFor();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
