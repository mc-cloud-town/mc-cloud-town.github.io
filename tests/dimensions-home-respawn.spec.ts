import { expect, test, type Page } from '@playwright/test';
import {
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  expectTextFits,
  openPage,
  setLanguage,
} from './helpers/dimensions';
import {
  flashState,
  ready,
  scrollToSection,
  visibleScenes,
} from './helpers/home';

test.describe('home: respawn', () => {
  test('the page ends on day one with the join call', async ({ page }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#respawn', 0);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'respawn');
    await expect(page.locator('#respawn h2')).toHaveText(
      '下一個里程碑，等你一起蓋。',
    );
    await expect(page.locator('#respawn a.btn')).toHaveAttribute(
      'href',
      /discord\.gg/,
    );
    await expect(page.locator('#respawn .depts li')).toHaveCount(3);
    // each department leads straight to where it takes applications
    const actions = page.locator('#respawn .depts li a');
    await expect(actions).toHaveCount(3);
    await expect(actions.nth(0)).toHaveAttribute(
      'href',
      /discord\.com\/channels\//,
    );
    await expect(actions.nth(1)).toHaveAttribute('href', /forms\.gle\//);
    await expect(actions.nth(2)).toHaveAttribute('href', /forms\.gle\//);
    for (const a of await actions.all()) {
      await expect(a).toHaveAttribute('target', '_blank');
      await expect(a).toHaveAttribute('rel', /noopener/);
    }
    await expect(page.locator('#respawn .dim-foot')).toBeVisible();
    await expect(page.locator('.dim-foot')).toHaveCount(1);
    await expectNoMissingKeys(page);
  });

  test('the wake: the stars white out, day one comes up under the white, and it all undoes', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    // before it starts: the stars, no white
    await scrollToSection(page, '#respawn', -1.3);
    expect(await visibleScenes(page)).toEqual(['end']);
    expect(await flashState(page)).toBe(0);
    // partway in: the white is rising over the stars
    await scrollToSection(page, '#respawn', -0.7);
    expect(await visibleScenes(page)).toEqual(['end']);
    const rising = await flashState(page);
    expect(rising).toBeGreaterThan(0.1);
    expect(rising).toBeLessThan(0.9);
    // the middle: nothing but white
    await scrollToSection(page, '#respawn', -0.5);
    expect(await flashState(page)).toBeGreaterThan(0.98);
    // partway out: day one under the clearing white
    await scrollToSection(page, '#respawn', -0.3);
    expect(await visibleScenes(page)).toEqual(['day1']);
    const clearing = await flashState(page);
    expect(clearing).toBeGreaterThan(0.1);
    expect(clearing).toBeLessThan(0.9);
    // landed
    await scrollToSection(page, '#respawn', 0);
    expect(await visibleScenes(page)).toEqual(['day1']);
    expect(await flashState(page)).toBe(0);
    const scale = (scene: string) =>
      page
        .locator(`.scene[data-scene="${scene}"] .zoom`)
        .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
    expect(await scale('day1')).toBeCloseTo(1, 2);
    // and back: the white again, then the stars, with day one switched off
    await scrollToSection(page, '#respawn', -0.5);
    expect(await flashState(page)).toBeGreaterThan(0.98);
    await scrollToSection(page, '#respawn', -1.3);
    expect(await visibleScenes(page)).toEqual(['end']);
    expect(await flashState(page)).toBe(0);
    await expect(page.locator('.scene[data-scene="day1"]')).toBeHidden();
    expect(await scale('end')).toBeCloseTo(1, 2);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
  });

  test('the mascot rises with the title and keeps floating; the bar marks the respawn and the rail is full', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    const rail = page.locator('.rail');
    await scrollToSection(page, '#respawn', 0);
    await expect(page.locator('.dim-bar nav a.on')).toHaveAttribute(
      'data-d',
      'respawn',
    );
    // the rail has no stop for the respawn: none is marked, and the line is full
    await expect(rail.locator('a')).toHaveCount(3);
    await expect(rail.locator('a.on')).toHaveCount(0);
    expect(
      await rail
        .locator('b')
        .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).d),
    ).toBeGreaterThan(0.95);
    const pal = page.locator('#respawn .pal');
    await expect(pal).toHaveCSS('opacity', '1');
    const at = () =>
      pal.evaluate((el) => {
        // the floating is on these two properties; the transform belongs to the rise
        const c = getComputedStyle(el);
        return `${c.translate} ${c.rotate}`;
      });
    const first = await at();
    await page.waitForTimeout(600);
    expect(await at()).not.toBe(first);
  });

  for (const [name, width, height, theme] of [
    ['a phone by day', 390, 844, 'light'],
    ['a phone on its side', 844, 390, 'dark'],
    ['a tablet on its side by day', 1024, 768, 'light'],
    ['a desktop', 1440, 900, 'dark'],
  ] as const)
    test(`on ${name} the respawn fits, down to the footer`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/', { theme });
      await ready(page);
      await scrollToSection(page, '#respawn', 0);
      expect(await visibleScenes(page)).toEqual(['day1']);
      await expect(page.locator('#respawn h2')).toHaveCSS('opacity', '1');
      await expectTextFits(page, { within: '#respawn' });
      // The footer is the shell's own (13px links, as on the inner pages): the type floors are checked for
      // what this section adds, and the sizes to tap for every link in it.
      const floors = await page.evaluate(() =>
        [...document.querySelectorAll('#respawn [data-t]')]
          .filter((el) => !el.closest('.dim-foot'))
          .map((el) => ({
            size: parseFloat(getComputedStyle(el).fontSize),
            floor: el.getAttribute('data-t') === 'note' ? 11 : 14,
          })),
      );
      expect(floors.length).toBe(12);
      for (const f of floors) expect(f.size).toBeGreaterThanOrEqual(f.floor);
      // the rail is for wide, tall screens only
      const rail = page.locator('.rail');
      await expect(rail).toHaveCount(1);
      if (width > 860 && height > 480) await expect(rail).toBeVisible();
      else await expect(rail).toBeHidden();
      // the very end of the page
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );
      await page.waitForTimeout(1500);
      expect(await visibleScenes(page)).toEqual(['day1']);
      await expect(page.locator('#respawn .dim-foot')).toBeInViewport();
      await expect(
        page.locator('#respawn .depts li a').last(),
      ).toBeInViewport();
      // (at the end of the page the list is read on from further up: on a short screen its first rows are
      // passing behind the bar by now, the more so since the footer has a line more)
      await expectTextFits(page, {
        within: '#respawn .depts',
        passing: '.dim-bar',
      });
      await expectTextFits(page, { within: '#respawn .dim-foot' });
      // The footer is the shell's own (13px links, as on the inner pages), so only the sizes to tap are checked here.
      const small = await page.evaluate(() =>
        window.innerWidth > 1024
          ? []
          : [...document.querySelectorAll('#respawn a')]
              .map((a) => a.getBoundingClientRect())
              .filter((r) => r.width < 43.5 || r.height < 43.5)
              .map((r) => `${Math.round(r.width)}x${Math.round(r.height)}`),
      );
      expect(small).toEqual([]);
      // the call to join, three ways to apply, and the footer's eleven: six pages of the site, five links out
      expect(await page.locator('#respawn a').count()).toBe(15);
      await expectNoHorizontalScroll(page);
      // by day the page is light again after the End
      if (theme === 'light')
        await expect(page.locator('.dim')).toHaveCSS(
          'background-color',
          'rgb(238, 242, 245)',
        );
    });

  for (const locale of ['zh_TW', 'zh_CN', 'en'] as const)
    for (const [width, height] of [
      [1440, 900],
      [1070, 640],
    ] as const)
      test(`each department's link stands under its description, which has the width of the column (${locale}, ${width}×${height})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height });
        await openPage(page, '/', { locale });
        await ready(page);
        await scrollToSection(page, '#respawn', 0.2);
        await expect(page.locator('#respawn .depts')).toHaveCSS('opacity', '1');
        const rows = await page
          .locator('#respawn .depts li')
          .evaluateAll((els) =>
            els.map((li) => {
              const box = (sel: string) =>
                li.querySelector(sel)!.getBoundingClientRect();
              const [name, text, link] = [box('b'), box('span'), box('a')];
              const span = li.querySelector('span')!;
              const lines = Math.round(
                text.height / parseFloat(getComputedStyle(span).lineHeight),
              );
              return {
                nameRight: name.right,
                textLeft: text.left,
                textWidth: text.width,
                textBottom: text.bottom,
                linkLeft: link.left,
                linkTop: link.top,
                lines,
                perLine: span.textContent!.length / lines,
              };
            }),
          );
        expect(rows).toHaveLength(3);
        for (const r of rows) {
          // name | description, and the link on a line of its own beneath the description, flush with it
          expect(r.textLeft).toBeGreaterThan(r.nameRight);
          expect(r.linkTop).toBeGreaterThanOrEqual(r.textBottom);
          expect(r.linkTop - r.textBottom).toBeLessThan(28);
          expect(Math.abs(r.linkLeft - r.textLeft)).toBeLessThanOrEqual(1);
          expect(r.textWidth).toBeGreaterThanOrEqual(320);
          expect(r.lines).toBeLessThanOrEqual(2);
          // a comfortable measure: Chinese never wraps after a handful of characters
          if (locale !== 'en' && r.lines > 1)
            expect(r.perLine).toBeGreaterThanOrEqual(14);
        }
        await expectTextFits(page, { within: '#respawn .depts' });
      });

  /** The mascot and the department list, as boxes on the screen. */
  const mascotAndList = async (page: Page) => {
    const [list, mascot] = await Promise.all([
      page.locator('#respawn .depts').boundingBox(),
      page.locator('#respawn .pal').boundingBox(),
    ]);
    return { list: list!, mascot: mascot! };
  };

  // 1101px is the narrowest screen with the mascot: the width at which the bar, too, leaves its narrow layout
  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [1280, 720],
    [1101, 700],
  ] as const)
    test(`at ${width}×${height} the mascot stands beside the departments, centred on them`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      // the longest copy
      await openPage(page, '/', { locale: 'en' });
      await ready(page);
      await scrollToSection(page, '#respawn', 0.25);
      const pal = page.locator('#respawn .pal');
      await expect(pal).toBeVisible();
      await expect(pal).toHaveCSS('opacity', '1');
      // let its rise finish: from here on it only floats a few pixels around its place
      await page.waitForTimeout(1700);
      const { list, mascot } = await mascotAndList(page);
      expect(mascot.width).toBeGreaterThanOrEqual(300);
      expect(list.width).toBeGreaterThanOrEqual(590);
      // a column of its own to the right of the list, one gutter away
      const gutter = await page
        .locator('#respawn')
        .evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft));
      const gap = mascot.x - (list.x + list.width);
      expect(gap).toBeGreaterThan(gutter - 16);
      expect(gap).toBeLessThan(gutter + 16);
      expect(mascot.x + mascot.width).toBeLessThanOrEqual(width);
      // centred on the block of the three departments
      expect(
        Math.abs(mascot.y + mascot.height / 2 - (list.y + list.height / 2)),
      ).toBeLessThanOrEqual(16);
      // and clear of what is above and below it
      const [button, foot] = await Promise.all([
        page.locator('#respawn a.btn').boundingBox(),
        page.locator('#respawn .dim-foot img').boundingBox(),
      ]);
      const clear = (b: {
        x: number;
        y: number;
        width: number;
        height: number;
      }) =>
        b.x + b.width <= mascot.x ||
        b.y + b.height <= mascot.y ||
        b.y >= mascot.y + mascot.height;
      expect(clear(button!)).toBe(true);
      expect(clear(foot!)).toBe(true);
      await expectNoHorizontalScroll(page);
    });

  for (const [width, height] of [
    [1100, 700],
    [1024, 768],
    [844, 390],
    [768, 1024],
    [390, 844],
  ] as const)
    test(`at ${width}×${height} there is no mascot, and the departments have its room`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/', { locale: 'en' });
      await ready(page);
      await scrollToSection(page, '#respawn', 0.25);
      const pal = page.locator('#respawn .pal');
      await expect(pal).toHaveCount(1);
      await expect(pal).toBeHidden();
      await expect(pal).toHaveCSS('display', 'none');
      // not fetched either
      expect(
        await pal.evaluate((el: HTMLImageElement) => [
          el.loading,
          el.naturalWidth,
        ]),
      ).toEqual(['lazy', 0]);
      // the list is as wide as the column allows, up to its own measure
      const m = await page.locator('#respawn').evaluate((el) => {
        const c = getComputedStyle(el);
        return {
          column:
            el.clientWidth -
            parseFloat(c.paddingLeft) -
            parseFloat(c.paddingRight),
          list: el.querySelector('.depts')!.getBoundingClientRect().width,
        };
      });
      // up to 860px the text has the whole width; above, it stays on the veiled side of the picture (62% of the screen)
      const room = width <= 860 ? m.column : Math.min(m.column, 0.62 * width);
      expect(m.list).toBeGreaterThanOrEqual(Math.min(720, room) - 1);
      // more than it has beside the mascot (54% of the screen)
      if (width > 860 && width < 1161)
        expect(m.list).toBeGreaterThan(0.54 * width + 40);
      await scrollToSection(page, '#respawn .depts', -0.4);
      await expectTextFits(page, { within: '#respawn .depts' });
      await expectNoHorizontalScroll(page);
    });

  test('by day the words of the respawn stand on paper: a wide veil under the list, and paper under the footer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { theme: 'light', locale: 'en' });
    await ready(page);
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await expect.poll(() => visibleScenes(page)).toEqual(['day1']);
    // how much paper lies over the picture at a point of the screen: the veil's own colour stops, read from its gradient
    const veil = page.locator('.scene[data-scene="day1"] .veil');
    await expect(veil).toHaveClass(/veil--wide/);
    const stops = await veil.evaluate((el) =>
      [
        ...getComputedStyle(el).backgroundImage.matchAll(
          /rgba?\(([^)]+)\) (\d+)%/g,
        ),
      ].map((m) => [Number(m[1].split(',')[3] ?? 1), Number(m[2])]),
    );
    // at least 90% paper up to 56% of the width
    expect(stops.slice(0, 2)).toEqual([
      [0.97, 0],
      [0.92, 56],
    ]);
    // the longest description ends inside that
    const ends = await page
      .locator('#respawn .depts li > span')
      .evaluateAll((els) =>
        els.map((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return Math.max(...[...range.getClientRects()].map((r) => r.right));
        }),
      );
    expect(ends).toHaveLength(3);
    for (const right of ends) expect(right / 1440).toBeLessThan(0.58);
    // the footer has its own paper, from edge to edge
    const foot = page.locator('#respawn .dim-foot');
    await expect(foot).toHaveCSS('background-image', /linear-gradient\(0deg/);
    const box = (await foot.boundingBox())!;
    expect(box.x).toBeLessThanOrEqual(0);
    expect(box.x + box.width).toBeGreaterThanOrEqual(1440);
    await expectTextFits(page, { within: '#respawn .dim-foot' });
    await expectNoHorizontalScroll(page);
    // by night there is no band: the veil of the scene is dark enough
    await page.locator('.dim-bar [data-action="theme"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(foot).toHaveCSS('background-image', 'none');
  });

  test('on a phone a department stacks: name, description, link', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, '/', { locale: 'en' });
    await ready(page);
    await scrollToSection(page, '#respawn .depts', -0.3);
    const rows = await page.locator('#respawn .depts li').evaluateAll((els) =>
      els.map((li) =>
        ['b', 'span', 'a'].map((sel) => {
          const r = li.querySelector(sel)!.getBoundingClientRect();
          return { left: Math.round(r.left), top: r.top, bottom: r.bottom };
        }),
      ),
    );
    expect(rows).toHaveLength(3);
    for (const [name, text, link] of rows) {
      expect(text.top).toBeGreaterThanOrEqual(name.bottom - 1);
      expect(link.top).toBeGreaterThanOrEqual(text.bottom - 1);
      expect(text.left).toBe(name.left);
      expect(link.left).toBe(name.left);
    }
    await expectTextFits(page, { within: '#respawn .depts' });
    await expectNoHorizontalScroll(page);
  });

  test('switching language inside the respawn keeps the wake, the departments and the footer working', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#respawn', 0);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await setLanguage(page, 'en');
    await expect(page.locator('#respawn h2')).toHaveText(
      'The next milestone is waiting for you.',
    );
    await page.waitForTimeout(800);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await expect(page.locator('#respawn .depts li b')).toHaveText([
      'Redstone',
      'Building',
      'Logistics',
    ]);
    await expect(page.locator('#respawn .depts li a').first()).toContainText(
      'Submission channel',
    );
    await expect(page.locator('#respawn h2')).toHaveCSS('opacity', '1');
    await expect(page.locator('#respawn .depts')).toHaveCSS('opacity', '1');
    await expect(page.locator('#respawn .pal')).toHaveCSS('opacity', '1');
    await scrollToSection(page, '#respawn', 0);
    await expectTextFits(page, { within: '#respawn' });
    // the wake was measured again: its middle is still nothing but white, and it still undoes
    await scrollToSection(page, '#respawn', -0.5);
    expect(await flashState(page)).toBeGreaterThan(0.98);
    await scrollToSection(page, '#respawn', -1.3);
    expect(await visibleScenes(page)).toEqual(['end']);
    expect(await flashState(page)).toBe(0);
    await setLanguage(page, 'zh_CN');
    await expect(page.locator('#respawn h2')).toHaveText(
      '下一个里程碑，等你一起盖。',
    );
    await scrollToSection(page, '#respawn', 0);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'respawn');
    await expectNoMissingKeys(page);
  });
});
