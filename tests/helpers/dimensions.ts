import { expect, type Page } from '@playwright/test';

export const VIEWPORTS = [
  { name: 'phone-s', width: 360, height: 740 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'phone-land', width: 844, height: 390 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'tablet-land', width: 1024, height: 768 },
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'desktop-l', width: 1920, height: 1080 },
  { name: 'ultrawide', width: 2560, height: 1440 },
] as const;

export const LOCALES = ['zh_TW', 'zh_CN', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export type ThemeName = 'light' | 'dark';

/** Open a page with a fixed theme and language, analytics and ads blocked. */
export const openPage = async (
  page: Page,
  path: string,
  opts: { theme?: ThemeName; locale?: Locale; reducedMotion?: boolean } = {},
) => {
  const { theme = 'dark', locale = 'zh_TW', reducedMotion = false } = opts;
  await page.route(/googletagmanager|googlesyndication|google-analytics/, (r) =>
    r.abort(),
  );
  if (reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(
    ([t, l]) => {
      try {
        // Seed only once, so a reload keeps what the page itself saved.
        if (!localStorage.getItem('ctec-theme-preference'))
          localStorage.setItem('ctec-theme-preference', t);
        if (!localStorage.getItem('i18nextLng'))
          localStorage.setItem('i18nextLng', l);
      } catch {}
    },
    [theme, locale],
  );
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.locator('.dim').waitFor();
  await page.evaluate(() => document.fonts.ready);
};

/** Choose a language from the bar's own list (the pill with the globe), and wait until the list has closed. */
export const setLanguage = async (page: Page, code: Locale) => {
  const trigger = page.locator('.dim-bar [data-action="language"]');
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await page
    .locator(`.dim-bar .lang-list [role="option"][data-value="${code}"]`)
    .click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.dim-bar .lang-list')).toHaveCSS(
    'visibility',
    'hidden',
  );
};

export const expectNoHorizontalScroll = async (page: Page) => {
  const [scroll, inner] = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    window.innerWidth,
  ]);
  expect(scroll, 'page must not scroll sideways').toBeLessThanOrEqual(inner);
};

/**
 * Every visible [data-t] block in the viewport must stay inside the viewport width,
 * must not overflow its own box, must not overlap another [data-t] block,
 * and must not sit under the fixed bar.
 */
export const expectTextFits = async (
  page: Page,
  { within = '' }: { within?: string } = {},
) => {
  const problems = await page.evaluate((root) => {
    const out: string[] = [];
    const vw = window.innerWidth,
      vh = window.innerHeight;
    const bar = document.querySelector('.dim-bar')?.getBoundingClientRect();
    const label = (el: Element) =>
      `${el.getAttribute('data-t')}:"${(el.textContent ?? '').trim().slice(0, 24)}"`;
    const els = [
      ...document.querySelectorAll<HTMLElement>(
        root ? root + ' [data-t]' : '[data-t]',
      ),
    ].filter((el) => {
      const r = el.getBoundingClientRect(),
        s = getComputedStyle(el);
      return (
        r.width > 0 &&
        r.height > 0 &&
        r.bottom > 0 &&
        r.top < vh &&
        s.visibility !== 'hidden' &&
        +s.opacity > 0.5
      );
    });
    const rects = els.map((el) => el.getBoundingClientRect());
    els.forEach((el, i) => {
      const r = rects[i];
      if (r.left < -1 || r.right > vw + 1)
        out.push(`outside viewport: ${label(el)}`);
      if (el.scrollWidth > el.clientWidth + 1)
        out.push(`overflows its box: ${label(el)}`);
      if (
        bar &&
        !el.closest('.dim-bar') &&
        r.top < bar.bottom - 1 &&
        r.bottom > bar.top + 1 &&
        r.top >= 0
      )
        out.push(`under the bar: ${label(el)}`);
      for (let j = i + 1; j < els.length; j++) {
        if (el.contains(els[j]) || els[j].contains(el)) continue;
        const q = rects[j];
        const w = Math.min(r.right, q.right) - Math.max(r.left, q.left),
          h = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
        if (w > 2 && h > 2)
          out.push(`overlap: ${label(el)} × ${label(els[j])}`);
      }
    });
    return out;
  }, within);
  expect(problems, problems.join('\n')).toEqual([]);
};

/** Below 1025px every control must be at least 44 × 44. Text sizes must respect the floors. */
export const expectTapTargets = async (page: Page) => {
  const problems = await page.evaluate(() => {
    const out: string[] = [];
    const vh = window.innerHeight;
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect(),
        s = getComputedStyle(el);
      return (
        r.width > 0 &&
        r.height > 0 &&
        r.bottom > 0 &&
        r.top < vh &&
        s.visibility !== 'hidden'
      );
    };
    if (window.innerWidth <= 1024) {
      document
        .querySelectorAll('.dim a, .dim button, .dim input, .dim select')
        .forEach((el) => {
          if (!visible(el)) return;
          const r = el.getBoundingClientRect();
          if (r.width < 43.5 || r.height < 43.5)
            out.push(
              `tap target ${Math.round(r.width)}×${Math.round(r.height)}: ${el.tagName} "${(el.textContent ?? '').trim().slice(0, 20)}"`,
            );
        });
    }
    document.querySelectorAll('.dim [data-t]').forEach((el) => {
      if (!visible(el)) return;
      const size = parseFloat(getComputedStyle(el).fontSize),
        floor = el.getAttribute('data-t') === 'note' ? 11 : 14;
      if (size < floor)
        out.push(
          `font ${size}px < ${floor}px: "${(el.textContent ?? '').trim().slice(0, 20)}"`,
        );
    });
    return out;
  });
  expect(problems, problems.join('\n')).toEqual([]);
};

/** A missing translation renders its key, which always starts with "dimensions.". */
export const expectNoMissingKeys = async (page: Page) => {
  const text = await page.evaluate(
    () => document.querySelector('.dim')?.textContent ?? '',
  );
  expect(text).not.toContain('dimensions.');
};
