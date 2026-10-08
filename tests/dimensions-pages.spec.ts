import { expect, test, type Page } from '@playwright/test';
import { openPage } from './helpers/dimensions';
import {
  animationOf,
  ENTRANCE_PARTS,
  entranceFrames,
  type EntranceFrame,
  type PartName,
  partFrames,
  timing,
  watchEntrance,
} from './helpers/pages';

const PROGRESS = /static-data\/[^/]+\/survivalProgress\.json/;
const entry = (n: number, title: string) => ({
  imageUrl: `survivalProgress/p${n}.webp`,
  title,
  subTitle: `milestone ${n}`,
});
const SEVEN = [
  entry(4, '2022/8/1'),
  entry(5, '2023/1/2'),
  entry(6, '2023/2/3'),
  entry(7, '2024/3/4'),
  entry(8, '2025/4/5'),
  entry(9, '2025/5/6'),
  entry(10, '2025/6/7'),
];

/** Every part of the header that is in the page has arrived: whole, and standing still. */
const settled = async (page: Page, names: PartName[]) => {
  for (const name of names)
    await expect(page.locator(ENTRANCE_PARTS[name]).first(), name).toHaveCSS(
      'opacity',
      '1',
    );
  await expect
    .poll(() =>
      page.evaluate(
        (sels) =>
          sels.flatMap((s) => document.querySelector(s)?.getAnimations() ?? [])
            .length,
        names.map((n) => ENTRANCE_PARTS[n]),
      ),
    )
    .toBe(0);
  // one more frame, so that the frame at rest is recorded too
  await page.evaluate(
    () =>
      new Promise((done) =>
        requestAnimationFrame(() => requestAnimationFrame(done)),
      ),
  );
};

/** A part only ever comes in: it never shows less than it did, and it never moves away from its place. */
const onlyArrives = (frames: EntranceFrame[], name: PartName, rise = true) => {
  const own = partFrames(frames, name);
  expect(own.length, name).toBeGreaterThan(5);
  const rest = own.at(-1)!;
  expect(rest.o, `${name} at rest`).toBe(1);
  own.forEach((f, i) => {
    if (i === 0) return;
    expect(f.o, `${name} frame ${i}: opacity`).toBeGreaterThanOrEqual(
      own[i - 1].o - 0.001,
    );
    // from below, towards its place
    expect(f.y, `${name} frame ${i}: place`).toBeLessThanOrEqual(
      own[i - 1].y + 0.5,
    );
    expect(f.y, `${name} frame ${i}: not past its place`).toBeGreaterThan(
      rest.y - 0.5,
    );
  });
  // the first frame it is in: not there yet, and (if it travels) below its place
  expect(own[0].o, `${name} first frame`).toBeLessThan(0.2);
  if (rise)
    expect(own[0].y - rest.y, `${name} starts below`).toBeGreaterThan(4);
  else expect(Math.abs(own[0].y - rest.y), `${name} stays`).toBeLessThan(0.5);
};

const HEADER: PartName[] = ['crumb', 'line0', 'line1', 'vt', 'lede', 'tools'];

test.describe('inner pages: the entrance', () => {
  for (const [path, width, height] of [
    ['/member/', 1440, 900],
    ['/survivalProgress/', 1440, 900],
    ['/member/', 390, 844],
  ] as const)
    test(`a direct load of ${path} at ${width}×${height}: the title rises line by line, the label and the lede follow, the toolbar after`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await watchEntrance(page);
      await openPage(page, path);
      await settled(page, HEADER);
      const frames = await entranceFrames(page);
      // from the first frame the header is in: nothing shows at rest and is then taken away again
      for (const name of ['crumb', 'line0', 'line1', 'vt', 'lede'] as const)
        onlyArrives(frames, name);
      // the toolbar is a fixture of the page: it fades in where it stands
      onlyArrives(frames, 'tools', false);
      // in order: the two lines of the title, then the label and the lede, then the toolbar
      const at = Object.fromEntries(
        HEADER.map((n) => [n, timing(frames, n)]),
      ) as Record<PartName, ReturnType<typeof timing>>;
      // (a frame can be late while the page loads, and then two neighbours are first seen in the same frame:
      // neighbours may tie, the title and the toolbar may not; the exact stagger is read from the styles below)
      expect(at.line0.start).toBeLessThanOrEqual(at.line1.start);
      expect(at.line1.start).toBeLessThanOrEqual(at.vt.start);
      expect(at.vt.start).toBeLessThanOrEqual(at.lede.start);
      expect(at.lede.start).toBeLessThanOrEqual(at.tools.start);
      expect(at.line0.start).toBeLessThan(at.tools.start);
      expect(at.line0.end).toBeLessThanOrEqual(at.line1.end);
      expect(at.line0.end).toBeLessThan(at.tools.end);
      // the picture settles like the home page's camera: from closer in, to its place
      expect(frames[0].zoom).toBeGreaterThan(1.03);
      await expect
        .poll(async () => (await entranceFrames(page)).at(-1)!.zoom)
        .toBe(1);
      // the whole of it is over in about two seconds (the picture goes on settling a little longer)
      expect(at.tools.end - frames[0].t).toBeLessThan(2200);
      expect(at.tools.end - frames[0].t).toBeGreaterThan(900);
    });

  test('the motion is the home hero’s: expo.out for the title and the label, power3.out for what follows, a tenth of a second apart', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    const read = (name: PartName) =>
      animationOf(page, ENTRANCE_PARTS[name].split(',')[0]);
    const [line0, line1, vt, lede, tools] = await Promise.all(
      (['line0', 'line1', 'vt', 'lede', 'tools'] as const).map(read),
    );
    const OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
    const RISE = 'cubic-bezier(0.215, 0.61, 0.355, 1)';
    expect(line0).toEqual({
      name: 'dim-enter-line',
      duration: '1.3s',
      delay: '0.08s',
      easing: OUT,
    });
    expect(line1).toEqual({
      name: 'dim-enter-line',
      duration: '1.3s',
      delay: '0.2s',
      easing: OUT,
    });
    expect(vt).toEqual({
      name: 'dim-enter-label',
      duration: '1.4s',
      delay: '0.32s',
      easing: OUT,
    });
    expect(lede).toEqual({
      name: 'dim-enter-rise',
      duration: '1s',
      delay: '0.44s',
      easing: RISE,
    });
    expect(tools).toEqual({
      name: 'dim-fade-0',
      duration: '0.8s',
      delay: '0.56s',
      easing: RISE,
    });
  });

  test('a list that is there at once still waits for its turn: it comes after the toolbar has begun', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route(PROGRESS, (r) => r.fulfill({ json: SEVEN }));
    await watchEntrance(page);
    await openPage(page, '/survivalProgress/');
    await expect(page.locator('.entry')).toHaveCount(7);
    await settled(page, [...HEADER, 'list', 'next']);
    const frames = await entranceFrames(page);
    const tools = timing(frames, 'tools');
    const list = timing(frames, 'list');
    // the data was there before the title had risen: the list was in the page while the toolbar was still to come
    expect(list.frames[0].t).toBeLessThan(tools.start);
    expect(list.start).toBeGreaterThan(tools.start);
    onlyArrives(frames, 'list');
    // and the link to the next page, which is in the served page, comes with it and not before
    expect(timing(frames, 'next').start).toBeGreaterThan(tools.start);
    onlyArrives(frames, 'next', false);
  });

  test('a list that arrives late does not wait any longer: it rises as soon as it is there', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    let answer = () => {};
    const asked = new Promise<void>((done) => (answer = done));
    await page.route(PROGRESS, async (r) => {
      await asked;
      await r.fulfill({ json: SEVEN });
    });
    await watchEntrance(page);
    await openPage(page, '/survivalProgress/');
    await settled(page, HEADER);
    // well after the entrance
    await page.waitForTimeout(400);
    answer();
    await expect(page.locator('.entry')).toHaveCount(7);
    await settled(page, ['list']);
    const frames = await entranceFrames(page);
    const list = timing(frames, 'list');
    // in the page, and on its way within a few frames
    expect(list.start - list.frames[0].t).toBeLessThan(120);
    onlyArrives(frames, 'list');
  });

  test('another language at boot changes the words, not the entrance: the same lines go on rising', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await watchEntrance(page);
    // the served page is in Traditional Chinese; the reader's language is English
    await page.addInitScript(() => {
      const w = window as unknown as { __line?: Element | null };
      const look = () => {
        w.__line ??= document.querySelector('.dim .head h1 span');
        if (!w.__line) requestAnimationFrame(look);
      };
      look();
    });
    await openPage(page, '/member/', { locale: 'en' });
    const line = page.locator('.dim .head h1 span').first();
    await expect(line).toHaveText('The credits,');
    await settled(page, HEADER);
    // the very element that was served
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { __line?: Element }).__line ===
          document.querySelector('.dim .head h1 span'),
      ),
    ).toBe(true);
    const frames = await entranceFrames(page);
    for (const name of ['line0', 'line1', 'lede'] as const) {
      const own = partFrames(frames, name);
      own.forEach((f, i) => {
        if (i > 0)
          expect(f.o, `${name} frame ${i}`).toBeGreaterThanOrEqual(
            own[i - 1].o - 0.001,
          );
      });
      expect(own[0].o).toBeLessThan(0.2);
    }
  });

  test('with scripts off the page is readable: the entrance plays and ends on the whole page', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.route(/googletagmanager|googlesyndication/, (r) => r.abort());
    for (const path of ['/member/', '/survivalProgress/']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      for (const name of [...HEADER, 'next'] as const) {
        const part = page.locator(ENTRANCE_PARTS[name]).first();
        await expect(part, `${path} ${name}`).toBeVisible();
        await expect(part, `${path} ${name}`).toHaveCSS('opacity', '1');
        await expect(part, `${path} ${name}`).toHaveCSS('transform', 'none');
      }
      await expect(page.locator('.dim .head h1')).not.toBeEmpty();
    }
    await context.close();
  });

  test('reduced motion: a brief fade, nothing travels, nothing waits', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route(PROGRESS, (r) => r.fulfill({ json: SEVEN }));
    await watchEntrance(page);
    await openPage(page, '/survivalProgress/', { reducedMotion: true });
    await expect(page.locator('.entry')).toHaveCount(7);
    await settled(page, [...HEADER, 'list', 'next']);
    const frames = await entranceFrames(page);
    for (const name of [...HEADER, 'list', 'next'] as const) {
      const own = partFrames(frames, name);
      expect(own.length, name).toBeGreaterThan(2);
      // nothing travels
      for (const f of own)
        expect(Math.abs(f.y - own.at(-1)!.y), name).toBeLessThan(0.5);
      // and the fade is brief: at 120 ms it is seen partly in no more than a handful of frames
      // (counted in frames, not on the clock: while a page loads, a frame can be late)
      expect(
        own.filter((f) => f.o > 0.02 && f.o < 0.98).length,
        name,
      ).toBeLessThanOrEqual(9);
      expect(own.at(-1)!.o, name).toBe(1);
    }
    // it does fade: the header was not simply there
    expect(partFrames(frames, 'line0')[0].o).toBeLessThan(0.9);
    // the picture does not move
    for (const f of frames) expect(f.zoom).toBe(1);
    // read from the styles as well: 120 ms, no delay, a fade
    for (const name of HEADER)
      expect(await animationOf(page, ENTRANCE_PARTS[name]), name).toMatchObject(
        { name: 'dim-fade-0', duration: '0.12s', delay: '0s' },
      );
  });
});
