import { expect, test, type Page } from '@playwright/test';
import {
  atRest,
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  expectTextFits,
  openPage,
  setLanguage,
} from './helpers/dimensions';
import {
  flashState,
  landedOn,
  onTouch,
  ready,
  scrollAt,
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
    // each department leads straight to where it takes applications: all three, the one form
    const actions = page.locator('#respawn .depts li a');
    await expect(actions).toHaveCount(3);
    await expect(actions.nth(0)).toHaveAttribute('href', /forms\.gle\//);
    await expect(actions.nth(1)).toHaveAttribute('href', /forms\.gle\//);
    await expect(actions.nth(2)).toHaveAttribute('href', /forms\.gle\//);
    for (const a of await actions.all()) {
      await expect(a).toHaveAttribute('target', '_blank');
      await expect(a).toHaveAttribute('rel', /noopener/);
    }
    // and beside the call, the way to the full text: the join page, in this tab, as a step of the shell
    const more = page.locator('#respawn .acts a.more');
    await expect(more).toHaveCount(1);
    await expect(more).toHaveAttribute('href', '/join/');
    await expect(more).toContainText('完整的加入說明');
    await expect(more).not.toHaveAttribute('target', /.*/);
    await expect(page.locator('#respawn .dim-foot')).toBeVisible();
    await expect(page.locator('.dim-foot')).toHaveCount(1);
    await expectNoMissingKeys(page);
  });

  test('the wake: the stars fade to black, day one comes up out of the black, and it all undoes', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    // before it starts: the stars, no black
    await scrollToSection(page, '#respawn', -1.3);
    expect(await visibleScenes(page)).toEqual(['end']);
    expect(await flashState(page)).toBe(0);
    // partway in: the black is falling over the stars
    await scrollToSection(page, '#respawn', -0.7);
    expect(await visibleScenes(page)).toEqual(['end']);
    const rising = await flashState(page);
    expect(rising).toBeGreaterThan(0.1);
    expect(rising).toBeLessThan(0.9);
    // the middle: nothing but black (not a white-out: that was found too bright)
    await scrollToSection(page, '#respawn', -0.5);
    expect(await flashState(page)).toBeGreaterThan(0.98);
    await expect(page.locator('.flash')).toHaveCSS(
      'background-color',
      'rgb(5, 6, 8)',
    );
    // partway out: day one under the clearing black
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
    // and back: the black again, then the stars, with day one switched off
    await scrollToSection(page, '#respawn', -0.5);
    expect(await flashState(page)).toBeGreaterThan(0.98);
    await scrollToSection(page, '#respawn', -1.3);
    expect(await visibleScenes(page)).toEqual(['end']);
    expect(await flashState(page)).toBe(0);
    await expect(page.locator('.scene[data-scene="day1"]')).toBeHidden();
    expect(await scale('end')).toBeCloseTo(1, 2);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
  });

  test('the mascot has come up with the words, and keeps floating; the bar marks the respawn and the rail is full', async ({
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
        // the floating is on these two properties; the transform belongs to the wake (it came up with the words)
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
      expect(floors.length).toBe(13);
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
      // (on a short screen the footer is taller than the screen: its first rows are passing behind the bar)
      await expectTextFits(page, {
        within: '#respawn .dim-foot',
        passing: '.dim-bar',
      });
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
      // the call to join, the way to the join page, three ways to apply, and the footer's thirteen: eight pages
      // of the site, four marks of the community and the way to support it
      expect(await page.locator('#respawn a').count()).toBe(18);
      await expectNoHorizontalScroll(page);
      // by day the ground under the respawn is paper again, with dark words
      if (theme === 'light') {
        await expect(page.locator('#respawn .ground')).toHaveCSS(
          'color',
          'rgb(15, 20, 24)',
        );
        await expect(page.locator('body')).toHaveCSS(
          'background-color',
          'rgb(238, 242, 245)',
        );
      }
    });

  for (const locale of ['zh_TW', 'zh_CN', 'en'] as const)
    for (const [width, height] of [
      [1440, 900],
      [1070, 640],
    ] as const)
      test(`a department is one row from gutter to gutter: its name, what it looks for, and its way in at the far end (${locale}, ${width}×${height})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height });
        await openPage(page, '/', { locale });
        await ready(page);
        await scrollToSection(page, '#respawn .depts', -0.3);
        await expect(page.locator('#respawn .depts')).toHaveCSS('opacity', '1');
        const rows = await page
          .locator('#respawn .depts li')
          .evaluateAll((els) =>
            els.map((li) => {
              const box = (sel: string) =>
                li.querySelector(sel)!.getBoundingClientRect();
              const [row, name, text, link] = [
                li.getBoundingClientRect(),
                box('b'),
                box('span'),
                box('a'),
              ];
              const span = li.querySelector('span')!;
              return {
                left: row.left,
                right: row.right,
                nameLeft: name.left,
                nameRight: name.right,
                textLeft: text.left,
                textRight: text.right,
                linkLeft: link.left,
                linkRight: link.right,
                linkLines: li.querySelector('a')!.getClientRects().length,
                lines: Math.round(
                  text.height / parseFloat(getComputedStyle(span).lineHeight),
                ),
              };
            }),
          );
        expect(rows).toHaveLength(3);
        const gutter = await page
          .locator('#respawn .call')
          .evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft));
        for (const r of rows) {
          // the rule over the row runs from gutter to gutter
          expect(Math.abs(r.left - gutter)).toBeLessThanOrEqual(1);
          expect(Math.abs(r.right - (width - gutter))).toBeLessThanOrEqual(1);
          // name | description | way in
          expect(Math.abs(r.nameLeft - r.left)).toBeLessThanOrEqual(1);
          expect(r.textLeft).toBeGreaterThan(r.nameRight);
          expect(r.linkLeft).toBeGreaterThan(r.textLeft);
          expect(Math.abs(r.linkRight - r.right)).toBeLessThanOrEqual(1);
          expect(r.linkLines).toBe(1);
          expect(r.lines).toBeLessThanOrEqual(2);
          // the descriptions begin on one line
          expect(Math.abs(r.textLeft - rows[0].textLeft)).toBeLessThanOrEqual(
            1,
          );
        }
        await expectTextFits(page, { within: '#respawn .depts' });
      });

  /** The mascot and the block it stands beside (the call: label, title, ways in), as boxes on the screen. */
  const mascotAndCall = async (page: Page) => {
    const [call, mascot] = await Promise.all([
      page.locator('#respawn .call > div').boundingBox(),
      page.locator('#respawn .pal').boundingBox(),
    ]);
    return { call: call!, mascot: mascot! };
  };

  // 1024 × 768 is the tablet on its side; 861 is the narrowest screen with a side for the mascot to stand on
  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [1280, 720],
    [1101, 700],
    [1024, 768],
    [900, 700],
    [861, 700],
  ] as const)
    test(`at ${width}×${height} the mascot stands beside the call, at the far gutter and centred on it`, async ({
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
      // fetched, since it is shown
      await expect
        .poll(() => pal.evaluate((el: HTMLImageElement) => el.naturalWidth))
        .toBeGreaterThan(0);
      // let its rise finish: from here on it only floats a few pixels around its place
      await page.waitForTimeout(1700);
      const { call, mascot } = await mascotAndCall(page);
      // at the size the layout gives it (its own box: on the screen it is turned a degree as it floats)
      const size =
        width > 1100
          ? Math.min(0.28 * width, 400)
          : Math.min(0.26 * width, 300);
      expect(
        Math.abs(
          (await pal.evaluate((el: HTMLElement) => el.offsetWidth)) - size,
        ),
      ).toBeLessThan(2);
      const gutter = await page
        .locator('#respawn .call')
        .evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft));
      // the call begins at one gutter, the mascot ends at the other, and they are a gutter apart at least
      expect(Math.abs(call.x - gutter)).toBeLessThanOrEqual(1);
      expect(
        Math.abs(mascot.x + mascot.width - (width - gutter)),
      ).toBeLessThanOrEqual(16);
      expect(mascot.x - (call.x + call.width)).toBeGreaterThan(gutter - 16);
      // centred on the call
      expect(
        Math.abs(mascot.y + mascot.height / 2 - (call.y + call.height / 2)),
      ).toBeLessThanOrEqual(16);
      // and clear of the departments under both
      const depts = await page.locator('#respawn .depts').boundingBox();
      expect(depts!.y).toBeGreaterThanOrEqual(mascot.y + mascot.height - 16);
      await expectTextFits(page, { within: '#respawn .call' });
      await expectNoHorizontalScroll(page);
    });

  // 860: one column, there is no side to stand on. 1280 × 450: wide enough, not high enough.
  for (const [width, height] of [
    [860, 700],
    [844, 390],
    [768, 1024],
    [390, 844],
    [360, 740],
    [1280, 450],
  ] as const)
    test(`at ${width}×${height} the layout cannot hold the mascot: there is none, and the call has its room`, async ({
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
      // the departments run from gutter to gutter
      const m = await page.locator('#respawn .call').evaluate((el) => {
        const c = getComputedStyle(el);
        return {
          column:
            el.clientWidth -
            parseFloat(c.paddingLeft) -
            parseFloat(c.paddingRight),
          list: el.querySelector('.depts')!.getBoundingClientRect().width,
        };
      });
      expect(Math.abs(m.list - m.column)).toBeLessThanOrEqual(1);
      await scrollToSection(page, '#respawn .depts', -0.4);
      await expectTextFits(page, { within: '#respawn .depts' });
      await expectNoHorizontalScroll(page);
    });

  /** The colour of the screen at each point (the mean of a 5 × 5 patch), with the veil of the day-one scene or without it. */
  const colours = async (
    page: Page,
    points: [x: number, y: number][],
    veil: boolean,
  ) => {
    const hide = veil
      ? null
      : await page.addStyleTag({
          content:
            '.scene[data-scene="day1"] .veil { visibility: hidden !important; }',
        });
    const png = (await page.screenshot()).toString('base64');
    await hide?.evaluate((el) => (el as Element).remove());
    return page.evaluate(
      async ([data, at]) => {
        const bitmap = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${data}`)).blob(),
        );
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(bitmap, 0, 0);
        const k = bitmap.width / window.innerWidth;
        return at.map(([x, y]) => {
          const px = ctx.getImageData(x * k - 2, y * k - 2, 5, 5).data;
          const sum = [0, 0, 0];
          for (let i = 0; i < px.length; i += 4)
            for (let c = 0; c < 3; c++) sum[c] += px[i + c];
          return sum.map((v) => v / 25);
        });
      },
      [png, points] as const,
    );
  };

  // the paper of this scene by day is the design's own: solid where the text begins, then a long fall
  for (const locale of ['zh_TW', 'en'] as const)
    for (const [width, height] of [
      [1024, 768],
      [1280, 720],
      [1440, 900],
      [1920, 1080],
      [2560, 1440],
    ] as const)
      test(`by day at ${width}×${height} (${locale}) the veil of the respawn is the design's side veil alone: thin and black, it falls away gradually, and no other ground lies under the words`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height });
        await openPage(page, '/', { theme: 'light', locale });
        await ready(page);
        await page.evaluate(() =>
          window.scrollTo(0, document.documentElement.scrollHeight),
        );
        await expect.poll(() => visibleScenes(page)).toEqual(['day1']);
        // the photograph itself has come
        await expect
          .poll(() =>
            page
              .locator('.scene[data-scene="day1"] img')
              .evaluate(
                (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
              ),
          )
          .toBe(true);
        await atRest(page);
        // the ground alone is measured first: without the words that stand on it, and without the mascot
        const ground = await page.addStyleTag({
          content: '#respawn .call, .rail { visibility: hidden !important; }',
        });
        const foot = page.locator('#respawn .dim-foot');
        // (the band under the row is the ground the footer stands on: the picture sinks into it)
        const [join, band, bar] = await Promise.all([
          page.locator('#respawn .call > div').boundingBox(),
          page.locator('#respawn .ground').boundingBox(),
          page.locator('.dim-bar').boundingBox(),
        ]);
        // a row of the screen between the bar and the footer's own band
        const top = bar!.y + bar!.height + 40;
        expect(band!.y - top).toBeGreaterThan(100);
        const y = top + 0.4 * (band!.y - 20 - top);
        // How much black lies over the photograph at 41 points across that row: how far each has gone from the
        // photograph's own colour (the veil taken away) towards black. Where the photograph is nearly black itself
        // nothing can be told, and the point is left out.
        const xs = Array.from(
          { length: 41 },
          (_, i) => 6 + (i / 40) * (width - 12),
        );
        const points = xs.map((x) => [x, y] as [number, number]);
        const [veiled, bare] = [
          await colours(page, points, true),
          await colours(page, points, false),
        ];
        const black = xs.flatMap((x, i) => {
          const c = [0, 1, 2].reduce((best, k) =>
            bare[i][k] > bare[i][best] ? k : best,
          );
          if (bare[i][c] < 60) return [];
          return [{ at: x / width, alpha: 1 - veiled[i][c] / bare[i][c] }];
        });
        const profile = black
          .map((k) => `${k.at.toFixed(2)}:${k.alpha.toFixed(2)}`)
          .join(' ');
        expect(black.length, profile).toBeGreaterThan(20);
        // thin where the text begins: the day's side veil is 0.42 there, and never more
        const solid = black.filter((k) => k.at <= 0.3);
        expect(solid.length, profile).toBeGreaterThan(3);
        for (const k of solid) {
          expect(k.alpha, profile).toBeGreaterThan(0.25);
          expect(k.alpha, profile).toBeLessThan(0.5);
        }
        expect(join!.x / width).toBeLessThan(0.3);
        // the far side, where the departments' links stand: the veil is down to a fifth
        const far = black.filter((k) => k.at >= 0.76);
        expect(far.length, profile).toBeGreaterThan(3);
        for (const k of far) {
          expect(k.alpha, profile).toBeGreaterThan(0.1);
          expect(k.alpha, profile).toBeLessThan(0.3);
        }
        // between the two it only ever falls
        black.forEach((k, i) => {
          if (i)
            expect(k.alpha, profile).toBeLessThanOrEqual(
              black[i - 1].alpha + 0.04,
            );
        });
        await ground.evaluate((el) => (el as Element).remove());
        await atRest(page);
        // on the picture the veil is the only ground: the descriptions and the footer carry none of their own
        await expect(foot).toHaveCSS('background-image', 'none');
        const own = await page
          .locator('#respawn .depts li > span')
          .evaluateAll((els) =>
            els.map((el) => [
              getComputedStyle(el).backgroundImage,
              getComputedStyle(el, '::before').content,
            ]),
          );
        expect(own).toHaveLength(3);
        for (const o of own) expect(o).toEqual(['none', 'none']);
        await expectTextFits(page, { within: '#respawn .dim-foot' });
        await expectNoHorizontalScroll(page);
        // by night as by day, the scene carries the design's side veil
        await page.locator('.dim-bar [data-action="theme"]').click();
        await expect(page.locator('html')).toHaveAttribute(
          'data-theme',
          'dark',
        );
        await expect(foot).toHaveCSS('background-image', 'none');
        await expect(
          page.locator('.scene[data-scene="day1"] .veil'),
        ).toHaveClass(/veil--side/);
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
      'Application form',
    );
    // (the English text is longer: the respawn has moved a little down the page, and its words come up with the
    // wake, by the scroll: back at its top they are whole)
    await scrollToSection(page, '#respawn', 0);
    await expect(page.locator('#respawn h2')).toHaveCSS('opacity', '1');
    await expect(page.locator('#respawn .depts')).toHaveCSS('opacity', '1');
    await expect(page.locator('#respawn .pal')).toHaveCSS('opacity', '1');
    await scrollToSection(page, '#respawn', 0);
    await expectTextFits(page, { within: '#respawn' });
    // the wake was measured again: its middle is still nothing but black, and it still undoes
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
  // The pictures of the scenes are asked for when the loader lifts; on a slow line the one the reader cuts to may
  // not be there yet when the cover lifts.
  for (const reducedMotion of [false, true])
    test(`by day a cut to the respawn shows the stage, never a flash of paper, while its picture is on its way, and the picture fades in${reducedMotion ? ' (briefly, with reduced motion)' : ''}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      // the picture of day one is held back until the test lets it through
      let letThrough = () => {};
      const held = new Promise<void>((done) => (letThrough = done));
      await page.route(/survivalProgress\/p2\.webp/, async (route) => {
        await held;
        await route.continue();
      });
      await openPage(page, '/', { theme: 'light', reducedMotion });
      await ready(page);
      const picture = page.locator('.scene[data-scene="day1"] .cam > img');
      // a far jump, from the button of the hero: a cut under the cover
      await page.locator('.hero a.btn').click();
      await landedOn(page, '#respawn');
      await expect.poll(() => visibleScenes(page)).toEqual(['day1']);
      expect(
        await picture.evaluate((img: HTMLImageElement) => img.naturalWidth),
      ).toBe(0);
      // the side of the screen the veil leaves nearly clear, above the mascot: the stage's black, as by night, not paper
      const clear: [number, number][] = [0.12, 0.9].flatMap((y) =>
        [0.78, 0.86, 0.96].map((x) => [x * 1440, y * 900] as [number, number]),
      );
      for (const [i, rgb] of (await colours(page, clear, true)).entries())
        for (const c of rgb)
          expect(
            c,
            `the ground at ${clear[i].map(Math.round)}: ${rgb.map(Math.round)}`,
          ).toBeLessThan(40);
      // from here on, the picture's opacity in every frame
      await picture.evaluate((img) => {
        const w = window as unknown as { __fade: number[] };
        w.__fade = [];
        const tick = () => {
          w.__fade.push(+getComputedStyle(img).opacity);
          if (w.__fade.at(-1)! < 1 || w.__fade.length < 3)
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      letThrough();
      await expect(picture).toHaveCSS('opacity', '1');
      const fade = await page.evaluate(
        () => (window as unknown as { __fade: number[] }).__fade,
      );
      expect(
        await picture.evaluate((img: HTMLImageElement) => img.naturalWidth),
      ).toBeGreaterThan(0);
      // it was not there, and it came in over several frames: never a step from nothing to whole
      expect(fade[0], fade.join(' ')).toBe(0);
      fade.forEach((o, i) => {
        if (i) expect(o, fade.join(' ')).toBeGreaterThanOrEqual(fade[i - 1]);
      });
      expect(
        fade.filter((o) => o > 0.02 && o < 0.98).length,
        fade.join(' '),
      ).toBeGreaterThanOrEqual(reducedMotion ? 2 : 6);
      // opacity alone, in the site's own time for something that arrives (a brief fade with reduced motion)
      await expect(picture).toHaveCSS('transition-property', 'opacity');
      await expect(picture).toHaveCSS(
        'transition-duration',
        reducedMotion ? '0.12s' : '0.45s',
      );
      // the photograph is there now
      const now = await colours(page, clear, true);
      expect(
        now.some((rgb) => rgb.some((c) => c > 60)),
        'the photograph has colour',
      ).toBe(true);
    });

  test('by night the stage under a picture that is on its way is as dark as it was', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    let letThrough = () => {};
    const held = new Promise<void>((done) => (letThrough = done));
    await page.route(/survivalProgress\/p2\.webp/, async (route) => {
      await held;
      await route.continue();
    });
    await openPage(page, '/');
    await ready(page);
    await page.locator('.hero a.btn').click();
    await landedOn(page, '#respawn');
    const far: [number, number][] = [[0.96 * 1440, 0.9 * 900]];
    // under the night veil the bare stage is nearly black
    for (const c of (await colours(page, far, true))[0])
      expect(c).toBeLessThan(40);
    letThrough();
    await expect(
      page.locator('.scene[data-scene="day1"] .cam > img'),
    ).toHaveCSS('opacity', '1');
  });
});

/**
 * The words of the wake (spec 5.3): the credits' last line stays where it stands while the black falls over it and is
 * gone under the black when that is whole; the respawn's own words are under the black, and come up as it clears.
 * The wake runs over the screen of scroll in which the respawn comes up from the foot of the screen to the head.
 */
test.describe('home: the words of the wake', () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ])
    test(`at ${width}×${height} the credits' last line keeps its place until the middle and is gone from there; the respawn's words are hidden until the middle and whole by the end`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/');
      await ready(page);
      await expect(page.locator('#credits .names span').first()).toBeAttached();
      const start = await page.evaluate(
        () =>
          document.querySelector('#respawn')!.getBoundingClientRect().top +
          scrollY -
          innerHeight,
      );
      const at = async (progress: number) => {
        await scrollAt(page, start + progress * height);
        return page.evaluate(() => {
          const shown = (el: Element) => {
            const c = getComputedStyle(el);
            return c.visibility !== 'hidden' ? +c.opacity : 0;
          };
          const fin = document.querySelector('#credits .fin')!;
          const blocks = [...document.querySelectorAll('#respawn .call > *')]
            // (the mascot has no room on a phone)
            .filter((el) => getComputedStyle(el).display !== 'none');
          return {
            finTop: fin.getBoundingClientRect().top,
            fin: shown(fin),
            words: blocks.map(shown),
          };
        });
      };
      // (on a touch screen the last line is not held: it goes up with the page, spec 5.3.1)
      const touch = await onTouch(page);
      const first = await at(0.02);
      expect(first.fin).toBe(1);
      for (const p of [0.1, 0.2, 0.3, 0.4, 0.46]) {
        const now = await at(p);
        expect(now.fin, `last line at ${p}`).toBe(1);
        // it keeps its place on the screen while the page goes up under it (on a touch screen: it goes up with it)
        expect(
          Math.abs(
            now.finTop - first.finTop + (touch ? (p - 0.02) * height : 0),
          ),
          `place at ${p}`,
        ).toBeLessThan(height * 0.02 + 2);
        for (const w of now.words)
          expect(w, `words at ${p}`).toBeLessThan(0.05);
      }
      // (the place at the very start, to the pixel)
      const begin = await at(0);
      if (!touch)
        expect(
          Math.abs((await at(0.4)).finTop - begin.finTop),
        ).toBeLessThanOrEqual(2);
      for (const p of [0.52, 0.6, 0.7]) {
        const now = await at(p);
        expect(now.fin, `last line at ${p}`).toBe(0);
      }
      // the words come up one after another, the last whole by the end
      const late = await at(0.7);
      expect(Math.max(...late.words)).toBeGreaterThan(0);
      for (const w of (await at(1)).words) expect(w).toBe(1);
      // and back: the last line is there again, the words are under the black again
      const back = await at(0.3);
      expect(back.fin).toBe(1);
      for (const w of back.words) expect(w).toBeLessThan(0.05);
    });

  test('the wake begins one screen above the respawn, also after the member list has filled in and after a language switch', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    /** The last line is carried as much as the page has gone up since the wake began: that is how far in it is. */
    const began = async () => {
      const expected = await page.evaluate(
        () =>
          document.querySelector('#respawn')!.getBoundingClientRect().top +
          scrollY -
          innerHeight,
      );
      // (on a touch screen nothing is carried: the last line is whole before the middle of the wake and gone after it)
      if (await onTouch(page)) {
        const opacity = async (progress: number) => {
          await scrollAt(
            page,
            expected + progress * page.viewportSize()!.height,
          );
          return page
            .locator('#credits .fin')
            .evaluate((el) => +getComputedStyle(el).opacity);
        };
        return (await opacity(0.45)) === 1 && (await opacity(0.55)) === 0
          ? 0
          : 1;
      }
      await scrollAt(page, expected + 270);
      const carried = await page.evaluate(
        () =>
          new DOMMatrix(
            getComputedStyle(
              document.querySelector('#credits .fin')!,
            ).transform,
          ).m42,
      );
      return Math.round(carried - 270);
    };
    // before the member list: the page is short of it; after: the list is in
    expect(Math.abs(await began()), 'before the members').toBeLessThanOrEqual(
      2,
    );
    await expect(page.locator('#credits .names span').first()).toBeAttached();
    await page.waitForTimeout(600);
    expect(Math.abs(await began()), 'after the members').toBeLessThanOrEqual(2);
    await setLanguage(page, 'en');
    await page.waitForTimeout(800);
    expect(Math.abs(await began()), 'after the switch').toBeLessThanOrEqual(2);
  });

  test('with reduced motion the last line of the credits and the words of the respawn simply stand there', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { reducedMotion: true });
    await ready(page);
    const start = await page.evaluate(
      () =>
        document.querySelector('#respawn')!.getBoundingClientRect().top +
        scrollY -
        innerHeight,
    );
    for (const p of [0, 0.3, 0.6, 1]) {
      await scrollAt(page, start + p * 900);
      const state = await page.evaluate(() =>
        [
          document.querySelector('#credits .fin')!,
          ...document.querySelectorAll('#respawn .call > *'),
        ].map((el) => {
          const c = getComputedStyle(el);
          return `${c.visibility} ${c.opacity} ${c.transform}`;
        }),
      );
      for (const s of state) expect(s, `at ${p}`).toBe('visible 1 none');
    }
  });
});

test.describe('home: the respawn is there for assistive technology before the wake', () => {
  test('its heading and links are not hidden and can take the focus while the black has not come', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    // at the top of the page: the wake is far below
    const state = await page.evaluate(() =>
      [
        '#respawn h2',
        '#respawn a.btn',
        '#respawn .acts a.more',
        '#respawn .depts li a',
        '#credits .fin',
      ].map((sel) => {
        const el = document.querySelector<HTMLElement>(sel)!;
        const hidden = getComputedStyle(el).visibility === 'hidden';
        el.focus({ preventScroll: true });
        return [sel, hidden, document.activeElement === el];
      }),
    );
    for (const [sel, hidden, focused] of state) {
      expect(hidden, `${sel} is not visibility: hidden`).toBe(false);
      if (sel !== '#credits .fin' && sel !== '#respawn h2')
        expect(focused, `${sel} takes the focus`).toBe(true);
    }
  });
});
