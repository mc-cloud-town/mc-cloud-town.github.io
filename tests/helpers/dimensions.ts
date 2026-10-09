import { expect, test, type Page } from '@playwright/test';

/** The engines that are run on request beside Chromium (playwright.config.ts names their projects after them). */
export type OtherEngine = 'webkit' | 'firefox';

/**
 * Why a test is not run in another engine: what it measures, not what the page does, depends on the engine as
 * Playwright runs it here. Each is a harness difference; the page's own behaviour in that engine is covered by
 * the tests that do run. (Measured on this machine: `engines.mjs` in the final-fix workspace.)
 */
export const NOT_HERE = {
  /** WebKit's Windows port draws about 40 frames a second with gaps of 70 ms and more, under no load at all. */
  frames:
    'reads a transition frame by frame, and this engine draws a 280 ms fade in one or two frames here: the counts of frames and what the first frame shows cannot be met',
  /** Firefox: in one direct load of three the first frame comes when the first fade is half over. */
  firstFrame:
    'judges the first frame it can record, which this engine draws later after the page begins than Chromium does',
  classicScrollbar:
    'needs a scrollbar that takes room in the layout, which Playwright cannot switch on in this engine',
  scrollbarColor:
    'this engine has no scrollbar-color: the sheet keeps the system scrollbar',
  tabToLinks:
    'Safari does not stop on links with Tab unless the reader has asked for it in the system settings',
  tabWraps:
    'Tab after the last link goes to the browser itself, and there is none in this engine as Playwright runs it: the focus stays',
  focusRing:
    'this engine decides :focus-visible for a focus set by script from how the element before it was focused, not from the key just pressed',
} as const;

/** First statement of a test that cannot be measured in an engine: skips it there, with the reason in the report. */
export const skipIn = (engines: OtherEngine[], reason: string) =>
  test.skip(
    engines.includes(test.info().project.name as OtherEngine),
    `${engines.join(' and ')}: ${reason}`,
  );

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
 *
 * `passing` is for a page that is being read on, away from a section's top: it names what is fixed or stuck over
 * the page (the bar, a stuck toolbar). Text goes behind those by design (they carry their own ground), so a block
 * that is behind one of them at this moment is not compared with anything; it must still fit the viewport and
 * its own box.
 */
export const expectTextFits = async (
  page: Page,
  { within = '', passing = '' }: { within?: string; passing?: string } = {},
) => {
  const problems = await page.evaluate(
    ([root, over]) => {
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
      const chrome = over ? [...document.querySelectorAll(over)] : [];
      const behind = els.map(
        (el, i) =>
          !chrome.some((c) => c.contains(el)) &&
          chrome.some((c) => {
            const q = c.getBoundingClientRect(),
              r = rects[i];
            return (
              Math.min(r.right, q.right) - Math.max(r.left, q.left) > 0 &&
              Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > 0
            );
          }),
      );
      els.forEach((el, i) => {
        const r = rects[i];
        if (r.left < -1 || r.right > vw + 1)
          out.push(`outside viewport: ${label(el)}`);
        // (an inline box has no width of its own to overflow, and the engines do not agree on what they
        // report for one: Chromium and WebKit say 0 for both, Firefox the width of the text for one of them)
        if (
          getComputedStyle(el).display !== 'inline' &&
          el.scrollWidth > el.clientWidth + 1
        )
          out.push(`overflows its box: ${label(el)}`);
        if (behind[i]) return;
        if (
          bar &&
          !el.closest('.dim-bar') &&
          r.top < bar.bottom - 1 &&
          r.bottom > bar.top + 1 &&
          r.top >= 0
        )
          out.push(`under the bar: ${label(el)}`);
        for (let j = i + 1; j < els.length; j++) {
          if (behind[j] || el.contains(els[j]) || els[j].contains(el)) continue;
          const q = rects[j];
          const w = Math.min(r.right, q.right) - Math.max(r.left, q.left),
            h = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
          if (w > 2 && h > 2)
            out.push(`overlap: ${label(el)} × ${label(els[j])}`);
        }
      });
      return out;
    },
    [within, passing] as const,
  );
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

/**
 * Nothing that is read is moving any more: no entrance or state change is still running, and every text block,
 * section and scene on screen has kept its place and its opacity (its own and its ancestors') for a few samples
 * in a row. Waits on the page itself instead of sleeping, so a check made after it measures the page at rest.
 * Things that never stop on purpose (the stars, the portal, the scroll cue, a camera drift) are not looked at.
 */
export const atRest = (page: Page, timeout = 15_000) =>
  page.waitForFunction(
    () => {
      const w = window as unknown as { __rest?: { sig: string; n: number } };
      const vh = window.innerHeight;
      const running = document.getAnimations().some((a) => {
        const t = a.effect?.getComputedTiming();
        // held (paused) counts as well: an entrance that waits has not played
        return (
          a.playState !== 'finished' &&
          a.playState !== 'idle' &&
          !!t &&
          t.iterations !== Infinity
        );
      });
      const through = (el: Element) => {
        let o = 1;
        for (
          let e: Element | null = el;
          e && e !== document.documentElement;
          e = e.parentElement
        ) {
          const c = getComputedStyle(e);
          if (c.visibility === 'hidden') return 0;
          o *= +c.opacity;
        }
        return o.toFixed(2);
      };
      const sig = [
        Math.round(window.scrollY),
        ...[
          ...document.querySelectorAll('.dim [data-t], .dim main > section'),
        ].flatMap((el) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -vh || r.top > 2 * vh) return [];
          return [
            `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)},${through(el)}`,
          ];
        }),
        ...[...document.querySelectorAll('.dim .scene')].map((el) => {
          const c = getComputedStyle(el);
          return c.visibility === 'hidden' ? '0' : (+c.opacity).toFixed(2);
        }),
      ].join('|');
      const last = w.__rest;
      w.__rest = {
        sig,
        n: !running && last && last.sig === sig ? last.n + 1 : 0,
      };
      return w.__rest.n >= 3;
    },
    null,
    { timeout, polling: 120 },
  );

/**
 * Nothing is painted over a text block: at its centre, the topmost thing is the block itself (or part of it, or
 * what it is part of). A block can have its place, its size and its full opacity and still be behind a picture.
 * `passing` names what text goes behind by design while the page is read on (see `expectTextFits`).
 */
export const expectNotCovered = async (
  page: Page,
  { within = '', passing = '' }: { within?: string; passing?: string } = {},
) => {
  const problems = await page.evaluate(
    ([root, over]) => {
      const out: string[] = [];
      const vw = window.innerWidth,
        vh = window.innerHeight;
      const chrome = over ? [...document.querySelectorAll(over)] : [];
      const untouchable = (el: Element | null): boolean =>
        !!el &&
        el !== document.documentElement &&
        (getComputedStyle(el).pointerEvents === 'none' ||
          untouchable(el.parentElement));
      document
        .querySelectorAll<HTMLElement>(root ? root + ' [data-t]' : '[data-t]')
        .forEach((el) => {
          const r = el.getBoundingClientRect(),
            s = getComputedStyle(el);
          const x = r.left + r.width / 2,
            y = r.top + r.height / 2;
          if (
            r.width === 0 ||
            r.height === 0 ||
            x < 0 ||
            x >= vw ||
            y < 0 ||
            y >= vh ||
            s.visibility === 'hidden' ||
            +s.opacity <= 0.5 ||
            // what cannot be pointed at cannot be asked for either
            untouchable(el)
          )
            return;
          const top = document.elementFromPoint(x, y);
          if (!top || top === el || el.contains(top) || top.contains(el))
            return;
          if (chrome.some((c) => c.contains(top))) return;
          out.push(
            `covered by ${top.tagName.toLowerCase()}.${String(top.className).split(' ')[0]}: ${el.getAttribute('data-t')}:"${(el.textContent ?? '').trim().slice(0, 24)}"`,
          );
        });
      return out;
    },
    [within, passing] as const,
  );
  expect(problems, problems.join('\n')).toEqual([]);
};

/**
 * Text over a picture can be read: against what is actually painted behind it (the picture under its veils,
 * taken from a screenshot with the words made transparent), each block named by `selector` keeps the contrast
 * WCAG AA asks for (4.5 : 1; 3 : 1 for large text, from 24px, or from 18.66px in bold). The weakest twentieth of
 * the pixels behind a block is left out, so a single bright speck in a photograph does not decide it.
 */
export const expectLegible = async (
  page: Page,
  selector: string,
  /** ask for this ratio instead of AA's: for a block whose design is still to be decided, the least it may be meanwhile */
  floor?: number,
) => {
  const blocks = await page.evaluate((sel) => {
    const vh = window.innerHeight,
      vw = window.innerWidth;
    return [...document.querySelectorAll<HTMLElement>(sel)].flatMap((el) => {
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || +s.opacity <= 0.5) return [];
      const size = parseFloat(s.fontSize);
      // where the words are, line by line: a block is as wide as its column, its words often are not
      const lines: DOMRect[] = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(n);
        lines.push(...range.getClientRects());
      }
      return lines.flatMap((r) => {
        const x = Math.max(0, r.left),
          y = Math.max(0, r.top),
          w = Math.min(vw, r.right) - x,
          h = Math.min(vh, r.bottom) - y;
        if (w < 2 || h < 2) return [];
        return [
          {
            name: `${el.getAttribute('data-t') ?? el.tagName.toLowerCase()}:"${(el.textContent ?? '').trim().slice(0, 24)}"`,
            clip: { x, y, width: w, height: h },
            color: s.color,
            large: size >= 24 || (size >= 18.66 && +s.fontWeight >= 700),
          },
        ];
      });
    });
  }, selector);
  expect(blocks.length, `${selector} is on screen`).toBeGreaterThan(0);
  const hide = await page.addStyleTag({
    content: `${selector}, ${selector
      .split(',')
      .map((s) => `${s.trim()} *`)
      .join(
        ', ',
      )} { color: transparent !important; transition: none !important; }`,
  });
  const problems: string[] = [];
  try {
    for (const b of blocks) {
      const png = (await page.screenshot({ clip: b.clip })).toString('base64');
      const ratio = await page.evaluate(
        async ([data, color]) => {
          const bitmap = await createImageBitmap(
            await (await fetch(`data:image/png;base64,${data}`)).blob(),
          );
          const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(bitmap, 0, 0);
          const px = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
          const lin = (v: number) =>
            v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          const lum = (r: number, g: number, b: number) =>
            0.2126 * lin(r / 255) +
            0.7152 * lin(g / 255) +
            0.0722 * lin(b / 255);
          const [r, g, bl] = color.match(/[\d.]+/g)!.map(Number);
          const text = lum(r, g, bl);
          const all: number[] = [];
          for (let i = 0; i < px.length; i += 4) {
            const back = lum(px[i], px[i + 1], px[i + 2]);
            all.push(
              (Math.max(text, back) + 0.05) / (Math.min(text, back) + 0.05),
            );
          }
          all.sort((a, b) => a - b);
          return all[Math.floor(all.length * 0.05)];
        },
        [png, b.color] as const,
      );
      const need = floor ?? (b.large ? 3 : 4.5);
      if (ratio < need)
        problems.push(
          `contrast ${ratio.toFixed(2)} < ${need}: ${b.name} (${b.color})`,
        );
    }
  } finally {
    await hide.evaluate((el) => (el as Element).remove());
    // the words ease back into their colour: what is looked at next sees them whole
    await atRest(page);
  }
  expect(problems, problems.join('\n')).toEqual([]);
};

/** The legacy pages the footer leads to, in its order. (`/collaborative/` is the same view as `/partner/`.) */
export const FOOTER_PAGES = [
  '/redstoneCollection/',
  '/architectureCollection/',
  '/openSource/',
  '/hardware/',
  '/partner/',
  '/join/',
] as const;

/**
 * The footer's two sets of links read as lines of words (measured on the words, not on the boxes that make them
 * big enough to tap). The links out: all on one row, the same space between each word and the next. The other
 * pages of the site: as many rows as the width asks for, each row beginning at the same edge, the same space
 * between its words as on the line of links out, and no row left with a scrap (the last is at least two fifths
 * as wide as the widest).
 */
export const expectFooterLines = async (page: Page) => {
  const read = (selector: string) =>
    page.locator(selector).evaluateAll((els) =>
      els.map((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const r = range.getBoundingClientRect();
        return {
          left: r.left,
          right: r.right,
          mid: (r.top + r.bottom) / 2,
          link: el.tagName === 'A',
        };
      }),
    );
  const problems: string[] = [];
  const uneven = (gaps: number[]) =>
    gaps.length > 1 && Math.max(...gaps) - Math.min(...gaps) > 1.5;
  const fmt = (gaps: number[]) => gaps.map((g) => g.toFixed(1)).join(', ');

  const out = await read('.dim-foot .links a');
  expect(out.length, 'links out of the site').toBeGreaterThan(2);
  const outRows = new Set(out.map((w) => Math.round(w.mid)));
  const outGaps = out.slice(1).map((w, i) => w.left - out[i].right);
  if (outRows.size > 1) problems.push(`footer links on ${outRows.size} rows`);
  else if (uneven(outGaps))
    problems.push(`footer links unevenly spaced: ${fmt(outGaps)}`);

  const pages = await read('.dim-foot .pages > *');
  expect(pages.filter((w) => w.link).length, 'links to other pages').toBe(
    FOOTER_PAGES.length,
  );
  expect(pages[0].link, 'the group begins with its label').toBe(false);
  const rows: (typeof pages)[] = [];
  for (const w of pages) {
    const row = rows.find((r) => Math.abs(r[0].mid - w.mid) < 8);
    if (row) row.push(w);
    else rows.push([w]);
  }
  const lefts = rows.map((r) => r[0].left);
  if (Math.max(...lefts) - Math.min(...lefts) > 1.5)
    problems.push(`rows of pages begin at ${fmt(lefts)}`);
  for (const [i, row] of rows.entries()) {
    const gaps = row.slice(1).map((w, k) => w.left - row[k].right);
    if (uneven(gaps))
      problems.push(`pages row ${i + 1} unevenly spaced: ${fmt(gaps)}`);
    if (outRows.size === 1 && gaps.length && outGaps.length)
      if (Math.abs(gaps[0] - outGaps[0]) > 1.5)
        problems.push(
          `pages row ${i + 1} is spaced ${gaps[0].toFixed(1)}, the links out ${outGaps[0].toFixed(1)}`,
        );
  }
  const linkRows = rows.filter((r) => r.some((w) => w.link));
  if (linkRows.length > 1) {
    const widths = linkRows.map((r) => r.at(-1)!.right - r[0].left);
    if (widths.at(-1)! < 0.4 * Math.max(...widths))
      problems.push(
        `the last row of pages is a scrap: ${fmt(widths)} wide per row`,
      );
  }
  expect(problems, problems.join('\n')).toEqual([]);
};
