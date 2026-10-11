// tests/dimensions-label.spec.ts
// The dimension name by day. Where the layout has a clear side (above 860px) it stands upright on the bare
// photograph, on a strip of paper of its own, as wide as its words. Where it has not, the veil runs bottom-up under
// the whole screen and the name lies on that veil: there it carries no ground of its own.
import { expect, test, type Page } from '@playwright/test';
import {
  atRest,
  expectLegible,
  LOCALES,
  openPage,
  type Locale,
} from './helpers/dimensions';
import { arrived, jumpTo } from './helpers/home';

/** The layouts in which the name lies on the bottom-up veil, up to the last width of it. */
const ON_THE_VEIL = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
  { width: 860, height: 900 },
];
/** The layouts in which it stands upright on the photograph, from the first width of it. */
const ON_THE_PHOTO = [
  { width: 861, height: 900 },
  { width: 1024, height: 768 },
];
const CLEAR = 'rgba(0, 0, 0, 0)';
const PAPER = 'rgba(238, 242, 245, 0.95)';

/** The label's painted box, its ground, and the box of its words alone. */
const boxOf = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => {
    const s = getComputedStyle(el);
    const range = document.createRange();
    range.selectNodeContents(el);
    const words = range.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    return {
      ground: s.backgroundColor,
      image: s.backgroundImage,
      padX: parseFloat(s.paddingLeft) + parseFloat(s.paddingRight),
      padY: parseFloat(s.paddingTop) + parseFloat(s.paddingBottom),
      width: box.width,
      height: box.height,
      wordsWidth: words.width,
      wordsHeight: words.height,
      upright: s.writingMode === 'vertical-rl',
    };
  });

const INNER = [
  ['progress', '/survivalProgress/', '.entry'],
  ['members', '/member/', '.person'],
] as const;

for (const vp of ON_THE_VEIL)
  test.describe(`the dimension name by day at ${vp.width}×${vp.height}: on the veil`, () => {
    for (const locale of LOCALES) {
      test(`home, ${locale}: the words alone, and they can be read`, async ({
        page,
      }) => {
        test.slow();
        await page.setViewportSize(vp);
        await openPage(page, '/', { theme: 'light', locale: locale as Locale });
        await arrived(page);
        // the End is dark whatever the theme: its name has no paper in any layout
        for (const id of ['overworld', 'nether', 'end']) {
          await jumpTo(page, `#${id}`, 0);
          await atRest(page);
          const label = `#${id} .vt`;
          await expect(page.locator(label)).toBeInViewport();
          const box = await boxOf(page, label);
          expect(box.upright, `${id}: it lies in the line`).toBe(false);
          expect(box.ground, `${id}: no ground of its own`).toBe(CLEAR);
          expect(box.image, `${id}: no ground of its own`).toBe('none');
          expect(box.padX + box.padY, `${id}: no strip, so no padding`).toBe(0);
          await expectLegible(page, label);
        }
      });

      for (const [name, url, first] of INNER)
        test(`${name}, ${locale}: the words alone, and they can be read`, async ({
          page,
        }) => {
          await page.setViewportSize(vp);
          await openPage(page, url, {
            theme: 'light',
            locale: locale as Locale,
          });
          await page.locator(first).first().waitFor();
          await atRest(page);
          const label = '.head .vt';
          await expect(page.locator(label)).toBeInViewport();
          const box = await boxOf(page, label);
          expect(box.upright).toBe(false);
          expect(box.ground, 'no ground of its own').toBe(CLEAR);
          expect(box.image, 'no ground of its own').toBe('none');
          expect(box.padX + box.padY, 'no strip, so no padding').toBe(0);
          await expectLegible(page, label);
        });
    }
  });

for (const vp of ON_THE_PHOTO)
  test.describe(`the dimension name by day at ${vp.width}×${vp.height}: on the photograph`, () => {
    /** The strip is the label's: its words and its padding, never the row's or the column's. */
    const hugs = (box: Awaited<ReturnType<typeof boxOf>>, what: string) => {
      expect(box.upright, `${what}: upright`).toBe(true);
      expect(box.ground, `${what}: on its strip of paper`).toBe(PAPER);
      expect(box.padX, `${what}: the strip has its padding`).toBeGreaterThan(0);
      expect(box.width, `${what}: as wide as its words`).toBeLessThanOrEqual(
        box.wordsWidth + box.padX + 2,
      );
      expect(box.height, `${what}: as tall as its words`).toBeLessThanOrEqual(
        box.wordsHeight + box.padY + 2,
      );
      expect(box.width, `${what}: never a bar`).toBeLessThan(vp.width / 4);
    };
    for (const locale of LOCALES) {
      test(`home, ${locale}: the strip hugs the words`, async ({ page }) => {
        test.slow();
        await page.setViewportSize(vp);
        await openPage(page, '/', { theme: 'light', locale: locale as Locale });
        await arrived(page);
        for (const id of ['overworld', 'nether']) {
          await jumpTo(page, `#${id}`, 0);
          await atRest(page);
          hugs(await boxOf(page, `#${id} .vt`), id);
          await expectLegible(page, `#${id} .vt`);
        }
        // the End: dark, and so without paper
        await jumpTo(page, '#end', 0);
        await atRest(page);
        expect((await boxOf(page, '#end .vt')).ground).toBe(CLEAR);
      });

      for (const [name, url, first] of INNER)
        test(`${name}, ${locale}: the strip hugs the words`, async ({
          page,
        }) => {
          await page.setViewportSize(vp);
          await openPage(page, url, {
            theme: 'light',
            locale: locale as Locale,
          });
          await page.locator(first).first().waitFor();
          await atRest(page);
          hugs(await boxOf(page, '.head .vt'), name);
          await expectLegible(page, '.head .vt');
        });
    }
  });

test.describe('the dimension name by night', () => {
  for (const vp of [ON_THE_VEIL[1], ON_THE_PHOTO[1]])
    test(`${vp.width}×${vp.height}: no ground in either layout, as before`, async ({
      page,
    }) => {
      await page.setViewportSize(vp);
      await openPage(page, '/');
      await arrived(page);
      await jumpTo(page, '#overworld', 0);
      await atRest(page);
      const home = await boxOf(page, '#overworld .vt');
      expect(home.ground).toBe(CLEAR);
      expect(home.padX + home.padY).toBe(0);
      await openPage(page, '/member/');
      await page.locator('.person').first().waitFor();
      await atRest(page);
      const inner = await boxOf(page, '.head .vt');
      expect(inner.ground).toBe(CLEAR);
      expect(inner.padX + inner.padY).toBe(0);
    });
});
