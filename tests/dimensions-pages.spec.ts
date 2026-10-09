import { expect, test, type Page } from '@playwright/test';
import { atRest, openPage } from './helpers/dimensions';
import { clickAt, clickedAt, ready } from './helpers/home';
import {
  animationOf,
  documentMark,
  ENTRANCE_PARTS,
  entranceFrames,
  type EntranceFrame,
  type NavFrame,
  navFrames,
  pageIsFree,
  type PartName,
  partFrames,
  timing,
  watchEntrance,
  watchNav,
} from './helpers/pages';

const PROGRESS = /static-data\/[^/]+\/survivalProgress\.json/;
const entry = (n: number, title: string) => ({
  imageUrl: `survivalProgress/p${n}.webp`,
  title,
  subTitle: `milestone ${n}`,
});
const MEMBERS = 'https://mc-ctec.org/static-data/member.json';
const ROSTER = {
  member: ['Alpha', 'Bravo', 'Charlie'].map((name, i) => ({
    name,
    uuid: `00000000-0000-0000-0000-00000000000${i}`,
  })),
  trial: ['Delta', 'Echo'].map((name, i) => ({
    name,
    uuid: `00000000-0000-0000-0000-0000000000${10 + i}`,
  })),
};
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

  for (const when of ['at once', 'late'] as const)
    test(`a roster that is there ${when} comes in from nothing: its rows are never seen before their heading`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      let answer = () => {};
      const asked = new Promise<void>((done) => (answer = done));
      await page.route(MEMBERS, async (r) => {
        if (when === 'late') await asked;
        await r.fulfill({ json: ROSTER });
      });
      await watchEntrance(page);
      await openPage(page, '/member/');
      if (when === 'late') {
        await settled(page, HEADER);
        await page.waitForTimeout(400);
        answer();
      }
      await expect(page.locator('.person')).toHaveCount(5);
      await settled(page, [...HEADER, 'list', 'group', 'people']);
      const frames = (await entranceFrames(page)).filter((f) => f.parts.people);
      expect(frames.length).toBeGreaterThan(5);
      // what the reader sees of the rows, and of their heading: its own opacity within its group's
      const rows = frames.map((f) => f.parts.people!.o * f.parts.group!.o);
      const heading = frames.map((f) => f.parts.list!.o * f.parts.group!.o);
      // the first frame the roster is in the page: nothing of it shows
      expect(rows[0]).toBeLessThan(0.05);
      expect(heading[0]).toBeLessThan(0.05);
      // it only ever comes in, and the rows are never ahead of nothing: while it waits for its turn, both are out of sight
      rows.forEach((o, i) => {
        if (i > 0)
          expect(o, `frame ${i}`).toBeGreaterThanOrEqual(rows[i - 1] - 0.001);
      });
      const tools = timing(await entranceFrames(page), 'tools');
      frames.forEach((f, i) => {
        if (f.t < tools.start)
          expect(rows[i], `frame ${i}: before the toolbar`).toBeLessThan(0.05);
      });
      expect(rows.at(-1)).toBe(1);
      expect(heading.at(-1)).toBe(1);
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

const NIGHT = 'rgb(6, 8, 11)';
const DAY = 'rgb(238, 242, 245)';
const bar = (page: Page, href: string) =>
  page.locator(`.dim-bar nav a[href="${href}"]`);

/** Until the step has ended: no cover, nothing under way, and (on an inner page) the title at rest. */
const arrived = async (page: Page, path: string) => {
  await expect.poll(() => new URL(page.url()).pathname).toBe(path);
  await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
  await expect(page.locator('html')).not.toHaveAttribute('data-nav', /.*/);
  if (path === '/') return ready(page);
  await settled(page, ['line0', 'line1', 'lede', 'tools']);
};

/** The leave half, as the frames show it, up to the frame in which the address changed. */
const expectLeave = (
  frames: NavFrame[],
  {
    from,
    to,
    tone,
    home,
  }: { from: string; to: string; tone: string; home: boolean },
) => {
  const change = frames.findIndex((f) => f.path === to);
  expect(change, 'the address changed').toBeGreaterThan(3);
  const before = frames.slice(0, change);
  for (const f of before) expect(f.path).toBe(from);
  // the cover came in over several frames, and was whole before the address changed
  const coming = before.filter((f) => f.cover > 0 && f.cover < 1);
  expect(coming.length).toBeGreaterThan(2);
  expect(before.at(-1)!.cover).toBe(1);
  // in the ground of where it leads
  for (const f of before.filter((f) => f.cover > 0)) expect(f.tone).toBe(tone);
  // meanwhile the content settles out: it only ever fades, upwards by a few pixels, and is gone when the cover is whole
  const leaving = before.filter((f) => f.nav === 'leaving' && f.main);
  expect(leaving.length).toBeGreaterThan(2);
  leaving.forEach((f, i) => {
    if (i === 0) return;
    expect(f.main!.o, `frame ${i}`).toBeLessThanOrEqual(
      leaving[i - 1].main!.o + 0.001,
    );
    expect(f.main!.y, `frame ${i}`).toBeLessThanOrEqual(
      leaving[i - 1].main!.y + 0.01,
    );
    expect(f.main!.y).toBeGreaterThanOrEqual(-12.01);
  });
  expect(leaving.some((f) => f.main!.o > 0.1 && f.main!.o < 0.9)).toBe(true);
  const whole = before.findIndex((f) => f.cover === 1);
  expect(before[whole - 1].main!.o).toBeLessThan(0.1);
  // the home page has a pinned stage inside: it fades where it stands; an inner page also rises a little
  if (home) for (const f of leaving) expect(f.main!.y).toBe(0);
  else expect(Math.min(...leaving.map((f) => f.main!.y))).toBeLessThan(-8);
  // and the page stays where it is for all of it
  expect(new Set(before.map((f) => f.y)).size).toBe(1);
  return change;
};

/** The arrive half on an inner page: the entrance is held under the whole cover and plays as it lifts. */
const expectArriveInner = (frames: NavFrame[], change: number) => {
  const after = frames.slice(change).filter((f) => f.line0);
  expect(after.length).toBeGreaterThan(10);
  // the first frame the title is in: below its place, and not to be seen
  expect(after[0].line0!.o).toBeLessThan(0.2);
  expect(after[0].line0!.y).toBeGreaterThan(4);
  expect(after[0].cover).toBe(1);
  // at the top of the new page
  for (const f of after) expect(f.y).toBe(0);
  // Under the whole cover the entrance is held: until the frame it is let go in, nothing of it is spent.
  // (In that frame the cover has only just begun to lift.)
  const go = after.findIndex((f) => f.nav === null);
  expect(go).toBeGreaterThan(2);
  for (const f of after.slice(0, go)) expect(f.cover).toBe(1);
  expect(after[go].cover).toBeGreaterThan(0.8);
  for (const f of after.slice(0, go + 1)) {
    expect(f.line0!.o).toBeLessThan(0.05);
    expect(f.line0!.y).toBe(after[0].line0!.y);
  }
  for (const f of after.slice(0, go)) expect(f.nav).toBe('covered');
  for (const f of after.slice(go)) expect(f.nav).toBeNull();
  // then the cover only lifts, and the line only rises
  after.forEach((f, i) => {
    if (i === 0) return;
    expect(f.cover, `frame ${i}: cover`).toBeLessThanOrEqual(
      after[i - 1].cover + 0.001,
    );
    expect(f.line0!.o, `frame ${i}: line`).toBeGreaterThanOrEqual(
      after[i - 1].line0!.o - 0.001,
    );
    expect(f.line0!.y, `frame ${i}: line`).toBeLessThanOrEqual(
      after[i - 1].line0!.y + 0.5,
    );
  });
  const lifting = after.filter((f) => f.cover > 0 && f.cover < 1);
  // (how many frames a busy machine draws is not the point: several, and in order)
  expect(lifting.length).toBeGreaterThan(3);
  // the title is already on its way while the cover is still lifting: one movement, not two
  expect(lifting.some((f) => f.line0!.o > 0.3)).toBe(true);
  expect(after.at(-1)).toMatchObject({ cover: 0, nav: null });
  expect(after.at(-1)!.line0).toEqual({ o: 1, y: 0 });
};

test.describe('going to another page', () => {
  for (const theme of ['dark', 'light'] as const)
    test(`home → members → progress → home, each a leave under the cover and an arrival (${theme})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await watchNav(page);
      await openPage(page, '/', { theme });
      await ready(page);
      await expect(page.locator('.loader')).toHaveCount(0);
      const mark = await documentMark(page);
      const ground = theme === 'dark' ? NIGHT : DAY;
      /**
       * On a quick line nothing is ever put on the cover: in a step whose cover was whole for less than a second,
       * no frame has a sign of life in the document. (Alone, every step here has the cover whole for about a
       * tenth of a second. Run beside many other tests the machine can take longer than the 1.2 s after which
       * the sign is due, and then it is right for it to show: such a step is noted, not judged.)
       */
      const noted = async () => {
        const got = await navFrames(page);
        expect(got.frames.length).toBeGreaterThan(10);
        const whole = got.frames.filter((f) => f.cover >= 0.99);
        const held = whole.length ? whole.at(-1)!.t - whole[0].t : 0;
        if (held < 1000)
          expect(got.frames.filter((f) => f.wait !== null)).toEqual([]);
        else
          test.info().annotations.push({
            type: 'slow machine',
            description: `the cover was whole for ${Math.round(held)} ms: the sign of life was not judged for this step`,
          });
        return got;
      };

      // home → members
      await navFrames(page);
      await bar(page, '/member/').click();
      await arrived(page, '/member/');
      let { frames, runs } = await noted();
      let change = expectLeave(frames, {
        from: '/',
        to: '/member/',
        tone: ground,
        home: true,
      });
      expectArriveInner(frames, change);
      // 280 ms in, 520 ms out: the cover's own lengths
      expect(runs).toEqual(['opacity:280', 'opacity:520']);
      await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
      await expect(bar(page, '/member/')).toHaveAttribute(
        'aria-current',
        'page',
      );

      // members → progress, from further down the page
      await page.locator('.person').first().waitFor();
      await page.evaluate(() =>
        window.scrollTo({ top: 700, behavior: 'instant' }),
      );
      await navFrames(page);
      await bar(page, '/survivalProgress/').click();
      await arrived(page, '/survivalProgress/');
      ({ frames, runs } = await noted());
      change = expectLeave(frames, {
        from: '/member/',
        to: '/survivalProgress/',
        tone: ground,
        home: false,
      });
      expect(frames[0].y).toBe(700);
      expectArriveInner(frames, change);
      expect(runs).toEqual(['opacity:280', 'opacity:520']);
      await expect(page.locator('html')).toHaveAttribute(
        'data-dim',
        'overworld',
      );

      // progress → home: the cover is the loader's night whatever the theme, and the loader takes over from it
      await navFrames(page);
      await page.locator('.head .crumb a').first().click();
      await expect.poll(() => new URL(page.url()).pathname).toBe('/');
      await ready(page);
      await expect(page.locator('.loader')).toHaveCount(0);
      ({ frames, runs } = await noted());
      change = expectLeave(frames, {
        from: '/survivalProgress/',
        to: '/',
        tone: NIGHT,
        home: false,
      });
      const home = frames.slice(change);
      // from the first frame of the home page: its loader, whole, and no cover under or over it
      expect(home.slice(0, 5).map((f) => f.loader)).toEqual([1, 1, 1, 1, 1]);
      for (const f of home) expect(f.cover).toBe(0);
      for (const f of home) expect(f.nav).toBeNull();
      // one fade only: the cover never lifted, the loader did
      expect(runs).toEqual(['opacity:280']);
      await expect(page.locator('.dim-cover')).toHaveCSS(
        'visibility',
        'hidden',
      );

      // all of it in one document
      expect(await documentMark(page)).toBe(mark);
    });

  test('the leave is at most 300 ms of content settling out, in the site’s motion', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    const main = page.locator('.dim main');
    await expect(main).toHaveCSS('transition-property', 'opacity, translate');
    await expect(main).toHaveCSS('transition-duration', '0.22s, 0.22s');
    await expect(main).toHaveCSS(
      'transition-timing-function',
      'cubic-bezier(0.215, 0.61, 0.355, 1), cubic-bezier(0.215, 0.61, 0.355, 1)',
    );
    await expect(page.locator('.dim-foot')).toHaveCSS(
      'transition-duration',
      /0\.22s/,
    );
  });

  test('the page is held from the click until the cover is whole, and is the reader’s again on arrival', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await watchNav(page);
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await page.mouse.move(720, 600);
    await navFrames(page);
    await bar(page, '/survivalProgress/').click();
    // the reader keeps turning the wheel and pressing Page Down for as long as the old page is there
    let sent = 0;
    while (new URL(page.url()).pathname === '/member/') {
      await page.mouse.wheel(0, 240);
      await page.keyboard.press('PageDown');
      expect(++sent, 'the page never changed').toBeLessThan(300);
    }
    expect(sent).toBeGreaterThan(1);
    await arrived(page, '/survivalProgress/');
    const { frames } = await navFrames(page);
    const change = frames.findIndex((f) => f.path === '/survivalProgress/');
    // while a cover could be seen through, the page did not move
    for (const f of frames.slice(0, change)) expect(f.y).toBe(0);
    for (const f of frames.slice(change).filter((f) => f.cover > 0))
      expect(f.y).toBe(0);
    for (const o of ['html', 'body'])
      await expect(page.locator(o)).toHaveCSS('overflow', 'visible');
    await page.locator('.entry').first().waitFor();
    await pageIsFree(page);
  });

  test('leaving from far down an inner page: the page does not move by a pixel while its content settles out', async ({
    page,
  }) => {
    // Firefox once followed the rise of the content with the scroll (scroll anchoring), for one frame of the leave
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await page.evaluate(() =>
      window.scrollTo({ top: 700, behavior: 'instant' }),
    );
    await expect
      .poll(() => page.evaluate(() => Math.round(window.scrollY)))
      .toBe(700);
    await page.evaluate(() => {
      const w = window as unknown as { __ys: [string, number, string][] };
      w.__ys = [];
      const tick = () => {
        w.__ys.push([
          window.location.pathname,
          window.scrollY,
          document.documentElement.dataset.nav ?? '',
        ]);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await bar(page, '/survivalProgress/').click();
    await arrived(page, '/survivalProgress/');
    const seen = await page.evaluate(
      () => (window as unknown as { __ys: [string, number, string][] }).__ys,
    );
    const before = seen.filter(([path]) => path === '/member/');
    expect(
      before.filter(([, , nav]) => nav === 'leaving').length,
    ).toBeGreaterThan(3);
    // not rounded: within a pixel of where it was, in every frame of the leave
    for (const [, y] of before) expect(Math.abs(y - 700)).toBeLessThan(1);
  });

  test('from the sheet at 390×844: the sheet stays whole until the cover is over it, and the new page is free', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await watchNav(page);
    await openPage(page, '/');
    await ready(page);
    await expect(page.locator('.loader')).toHaveCount(0);
    const mark = await documentMark(page);
    await page.locator('.dim-bar [data-action="menu"]').click();
    const sheet = page.locator('.dim-sheet');
    await expect(sheet).toHaveCSS('opacity', '1');
    await expect(sheet.locator('a').last()).toHaveCSS('opacity', '1');
    await navFrames(page);
    await sheet.locator('a[href="/member/"]').click();
    await arrived(page, '/member/');
    const { frames } = await navFrames(page);
    const change = frames.findIndex((f) => f.path === '/member/');
    const before = frames.slice(0, change);
    expect(before.at(-1)!.cover).toBe(1);
    // one sequence: the sheet is not seen leaving, the cover comes down over it
    for (const f of before.filter((f) => f.cover < 1))
      expect(f.sheet, `cover ${f.cover}`).toBe(1);
    // the page behind was held throughout
    for (const f of before) expect(f.stopped, `cover ${f.cover}`).toBe(true);
    expectArriveInner(frames, change);
    expect(await documentMark(page)).toBe(mark);
    // the new page: its sheet is closed, nothing is inert, and it scrolls
    await expect(sheet).toHaveCSS('visibility', 'hidden');
    await expect(sheet).toHaveAttribute('data-open', 'false');
    await expect(page.locator('.dim-bar [data-action="menu"]')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(
      await page.evaluate(() => document.querySelector('main')!.inert),
    ).toBe(false);
    await page.locator('.person').first().waitFor();
    await pageIsFree(page);
  });

  test('the destination is fetched when a link is pointed at, focused, or the sheet is opened: the click does not wait for the network', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const asked: string[] = [];
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (u.pathname.endsWith('.txt')) asked.push(u.pathname);
    });
    const fetched = (dir: string) => asked.filter((p) => p.startsWith(dir));
    await watchNav(page);
    await openPage(page, '/');
    await ready(page);
    await expect(page.locator('.loader')).toHaveCount(0);
    expect(fetched('/member/')).toEqual([]);
    expect(fetched('/survivalProgress/')).toEqual([]);
    // pointed at
    await bar(page, '/member/').hover();
    await expect.poll(() => fetched('/member/').length).toBeGreaterThan(0);
    expect(fetched('/survivalProgress/')).toEqual([]);
    // focused
    await bar(page, '/survivalProgress/').focus();
    await expect
      .poll(() => fetched('/survivalProgress/').length)
      .toBeGreaterThan(0);
    // What is left for the click: in this static export the router asks once more, for the page's own payload
    // (one small file), and nothing that was fetched ahead is asked for again.
    await page.waitForLoadState('networkidle');
    const ahead = fetched('/member/');
    expect(ahead.length).toBeGreaterThanOrEqual(2);
    asked.length = 0;
    const mark = await documentMark(page);
    await navFrames(page);
    await bar(page, '/member/').click();
    await arrived(page, '/member/');
    expect(await documentMark(page)).toBe(mark);
    const atClick = fetched('/member/');
    expect(atClick.length).toBeLessThanOrEqual(1);
    for (const p of atClick) expect(ahead).not.toContain(p);
    const { frames } = await navFrames(page);
    const whole = frames.filter((f) => f.cover === 1);
    // on a quick line the cover is whole for a beat, not for a wait
    expect(whole.at(-1)!.t - whole[0].t).toBeLessThan(600);

    // the sheet: opening it fetches every page it leads to
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.locator('.dim').waitFor();
    await page.waitForLoadState('networkidle');
    asked.length = 0;
    await page.locator('.dim-bar [data-action="menu"]').click();
    await expect
      .poll(() => fetched('/survivalProgress/').length)
      .toBeGreaterThan(0);
    // and the home page (its payload is at the root of the site)
    await expect
      .poll(() => asked.filter((p) => /^\/(index|__next)/.test(p)).length)
      .toBeGreaterThan(0);
  });

  /**
   * A destination whose payload is slow. From the first frame the cover is whole until the destination is in the
   * document, the cover stays whole; and the page that was left is never seen again.
   */
  const expectCoveredUntil = (frames: NavFrame[], from: string, to: string) => {
    const whole = frames.findIndex((f) => f.cover >= 0.99);
    const there = frames.findIndex((f) => f.path === to);
    expect(whole).toBeGreaterThan(0);
    expect(there).toBeGreaterThan(whole);
    frames
      .slice(whole, there + 1)
      .forEach((f, i) =>
        expect(f.cover, `frame ${i}`).toBeGreaterThanOrEqual(0.99),
      );
    for (const f of frames.slice(whole))
      if (f.path === from && f.main && f.main.o > 0)
        expect(f.cover).toBeGreaterThanOrEqual(0.99);
    return { whole, there };
  };
  /** The sign of life in these frames: came in after about 1.2 s of whole cover, and was gone before the lift. */
  const expectSignOfLife = (frames: NavFrame[], whole: number) => {
    const since = (f: NavFrame) => f.t - frames[whole].t;
    const signed = frames.filter((f) => f.wait !== null);
    expect(signed.length).toBeGreaterThan(5);
    // not before its time (the cover is whole a few frames before the clock starts: the sheet, a painted frame)
    expect(since(signed[0])).toBeGreaterThan(1150);
    expect(since(signed[0])).toBeLessThan(1700);
    // it eases in, and is whole
    expect(signed[0].wait).toBeLessThan(0.3);
    expect(Math.max(...signed.map((f) => f.wait!))).toBe(1);
    // only ever on a whole cover: it is out of the document before the cover begins to lift
    // (that it eases out, and how, is read from its styles in the next test: how many frames of those 220 ms
    // are drawn while the destination is being put on the screen is not ours to say)
    for (const f of signed) expect(f.cover).toBeGreaterThanOrEqual(0.99);
    const last = frames.indexOf(signed.at(-1)!);
    const lifting = frames.findIndex((f, i) => i > whole && f.cover < 0.99);
    expect(lifting).toBeGreaterThan(last);
  };

  test('a destination that is two seconds late: the cover stays whole, shows a sign of life, and lifts on the destination only', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route(/\/survivalProgress\/.*\.txt/, async (r) => {
      await new Promise((done) => setTimeout(done, 2000));
      await r.continue();
    });
    await watchNav(page);
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    const mark = await documentMark(page);
    // something of the reader's own on the page that is left
    await page.locator('.search').fill('zz-not-a-member');
    await expect(page.locator('.empty')).toBeVisible();
    await navFrames(page);
    await bar(page, '/survivalProgress/').click();
    // the map on the cover is being drawn while it shows
    const map = page.locator('.dim-cover .cover-wait canvas');
    await expect(map).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.dim-cover .cover-wait p')).toHaveText(
      '正在進入世界',
    );
    await expect
      .poll(async () => Number(await map.getAttribute('data-frames')))
      .toBeGreaterThan(5);
    await arrived(page, '/survivalProgress/');
    expect(await documentMark(page)).toBe(mark);
    const { frames, runs } = await navFrames(page);
    const { whole, there } = expectCoveredUntil(
      frames,
      '/member/',
      '/survivalProgress/',
    );
    // it did wait: whole for about two seconds
    expect(frames[there].t - frames[whole].t).toBeGreaterThan(1700);
    expectSignOfLife(frames, whole);
    // one cover: in once, out once
    expect(runs).toEqual(['opacity:280', 'opacity:520']);
    expectArriveInner(frames, there);
    // nothing of the page that was left is on this one
    await expect(page.locator('.search')).toHaveCount(0);
    await expect(page.locator('.dim-cover .cover-wait')).toHaveCount(0);
    await page.locator('.entry').first().waitFor();
    await pageIsFree(page);
  });

  test('the sign of life is the loader’s map in small: centred, pixelated, in the site’s motion; with reduced motion it is the finished map, still', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route(/\/survivalProgress\/.*\.txt/, async (r) => {
      await new Promise((done) => setTimeout(done, 5000));
      await r.continue();
    });
    for (const reducedMotion of [false, true]) {
      await openPage(page, '/member/', { reducedMotion, theme: 'light' });
      await page.locator('.person').first().waitFor();
      await page.locator('.dim-bar [data-action="menu"]').click();
      await page.locator('.dim-sheet a[href="/survivalProgress/"]').click();
      const sign = page.locator('.dim-cover .cover-wait');
      const map = sign.locator('canvas');
      await expect(map).toBeVisible({ timeout: 5000 });
      await expect(sign).toHaveCSS('opacity', '1');
      // in the middle of the screen, small, with hard pixels; the line under it is readable
      const box = (await sign.boundingBox())!;
      expect(Math.abs(box.x + box.width / 2 - 195)).toBeLessThan(1);
      expect(Math.abs(box.y + box.height / 2 - 422)).toBeLessThan(1);
      const size = (await map.boundingBox())!;
      expect(size.width).toBeLessThanOrEqual(126);
      expect(size.width).toBe(size.height);
      await expect(map).toHaveCSS('image-rendering', 'pixelated');
      await expect(sign.locator('p')).toHaveCSS('font-size', '12px');
      // by day the cover is the paper and the line is ink
      await expect(page.locator('.dim-cover')).toHaveCSS(
        'background-color',
        DAY,
      );
      await expect(sign.locator('p')).toHaveCSS('color', 'rgb(65, 76, 87)');
      // the menu sheet has gone under the cover: nothing of it shows through or beside the sign
      await expect(page.locator('.dim-sheet')).toHaveCSS(
        'visibility',
        'hidden',
      );
      const centre = () =>
        map.evaluate((c: HTMLCanvasElement) =>
          [...c.getContext('2d')!.getImageData(10, 10, 1, 1).data].join(),
        );
      if (reducedMotion) {
        await expect(sign).toHaveCSS('animation-name', 'dim-fade-0');
        await expect(sign).toHaveCSS('animation-duration', '0.12s');
        // drawn once, finished: the centre is done
        await page.waitForTimeout(400);
        expect(await map.getAttribute('data-frames')).toBe('1');
        expect(await centre()).toBe('242,244,246,255');
      } else {
        await expect(sign).toHaveCSS('animation-name', 'dim-cover-wait-in');
        await expect(sign).toHaveCSS('animation-duration', '0.45s');
        await expect(sign).toHaveCSS(
          'animation-timing-function',
          'cubic-bezier(0.16, 1, 0.3, 1)',
        );
        await expect(sign).toHaveCSS('transition-duration', '0.22s');
        // it goes on being drawn
        const drawn = Number(await map.getAttribute('data-frames'));
        await expect
          .poll(async () => Number(await map.getAttribute('data-frames')))
          .toBeGreaterThan(drawn + 5);
      }
      await arrived(page, '/survivalProgress/');
      await expect(sign).toHaveCount(0);
    }
  });

  test('a destination that never comes: the cover stays whole, and after the hard limit the browser loads the destination', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    // the router's payload never arrives; the page itself, as a document, is there
    await page.route(/\/survivalProgress\/.*\.txt/, () => {});
    await watchNav(page);
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    const mark = await documentMark(page);
    await navFrames(page);
    const clicked = Date.now();
    await bar(page, '/survivalProgress/').click();
    // ten seconds on: still this document, still covered, the sign of life showing
    await page.waitForTimeout(10_000);
    expect(await documentMark(page)).toBe(mark);
    const { frames } = await navFrames(page);
    const whole = frames.findIndex((f) => f.cover >= 0.99);
    expect(whole).toBeGreaterThan(0);
    for (const f of frames.slice(whole)) {
      expect(f.cover).toBeGreaterThanOrEqual(0.99);
      expect(f.path).toBe('/member/');
    }
    expect(frames.at(-1)!.wait).toBe(1);
    // at the limit (12 s: HARD_LIMIT_MS in pageTransition.ts) the destination is loaded as a document
    await expect
      .poll(() => documentMark(page).catch(() => mark), { timeout: 15_000 })
      .not.toBe(mark);
    expect(Date.now() - clicked).toBeGreaterThan(11_500);
    await arrived(page, '/survivalProgress/');
    await page.locator('.entry').first().waitFor();
    await pageIsFree(page);
  });

  test('a destination that cannot be fetched is loaded the plain way, and no cover is left on it', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route(/\/survivalProgress\/.*\.txt/, (r) => r.abort());
    await watchNav(page);
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    const mark = await documentMark(page);
    await bar(page, '/survivalProgress/').click();
    await arrived(page, '/survivalProgress/');
    // a new document
    expect(await documentMark(page)).not.toBe(mark);
    await page.locator('.entry').first().waitFor();
    await pageIsFree(page);
  });

  test('back and forward get the arrival only: no cover, no wait', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await watchNav(page);
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await bar(page, '/survivalProgress/').click();
    await arrived(page, '/survivalProgress/');
    const mark = await documentMark(page);

    await navFrames(page);
    await page.goBack();
    await arrived(page, '/member/');
    let { frames } = await navFrames(page);
    // never a cover, never a leave: the page before is simply there, with its entrance
    for (const f of frames) expect(f.cover).toBe(0);
    for (const f of frames) expect(f.nav).toBeNull();
    let there = frames.filter((f) => f.path === '/member/' && f.line0);
    expect(there[0].line0!.o).toBeLessThan(0.2);
    expect(there[0].line0!.y).toBeGreaterThan(4);
    expect(there.at(-1)!.line0).toEqual({ o: 1, y: 0 });
    // and not delayed: on its way within a few frames of being there
    expect(there.find((f) => f.line0!.o > 0.3)!.t - there[0].t).toBeLessThan(
      400,
    );
    await page.locator('.person').first().waitFor();
    await pageIsFree(page);

    await navFrames(page);
    await page.goForward();
    await arrived(page, '/survivalProgress/');
    ({ frames } = await navFrames(page));
    for (const f of frames) expect(f.cover).toBe(0);
    there = frames.filter((f) => f.path === '/survivalProgress/' && f.line0);
    expect(there[0].line0!.o).toBeLessThan(0.2);
    expect(there.at(-1)!.line0).toEqual({ o: 1, y: 0 });
    expect(await documentMark(page)).toBe(mark);
    await page.locator('.entry').first().waitFor();
    await pageIsFree(page);
  });

  /** Do something in the page, in the first frame in which the cover is coming in (between 0.3 and 0.9). */
  const whileComing = (
    page: Page,
    what: 'back' | 'restored' | 'sent away' | { click: string },
  ) =>
    page.evaluate((act) => {
      const tick = () => {
        const c = getComputedStyle(document.querySelector('.dim-cover')!);
        const cover = c.visibility === 'hidden' ? 0 : +c.opacity;
        if (!(cover > 0.3 && cover < 0.9)) return requestAnimationFrame(tick);
        (window as unknown as { __did: number }).__did = cover;
        if (act === 'back') window.history.back();
        else if (act === 'restored')
          window.dispatchEvent(
            new PageTransitionEvent('pageshow', { persisted: true }),
          );
        else if (act === 'sent away')
          // what `coverOut` does to the cover, without anything else knowing of it
          document.querySelector<HTMLElement>('.dim-cover')!.dataset.on =
            'false';
        else document.querySelector<HTMLElement>(act.click)!.click();
      };
      requestAnimationFrame(tick);
    }, what);
  const did = (page: Page) =>
    page.evaluate(() => (window as unknown as { __did?: number }).__did);

  test('a step back during the leave is not held up: the leave is given up, nothing is left behind', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await watchNav(page);
    await openPage(page, '/survivalProgress/');
    await page.locator('.entry').first().waitFor();
    await bar(page, '/member/').click();
    await arrived(page, '/member/');
    await page.locator('.person').first().waitFor();
    await navFrames(page);
    await whileComing(page, 'back');
    await page.locator('.head .crumb a').first().click();
    await arrived(page, '/survivalProgress/');
    expect(await did(page)).toBeGreaterThan(0.3);
    const { frames } = await navFrames(page);
    // the home page was never gone to
    expect(new Set(frames.map((f) => f.path))).toEqual(
      new Set(['/member/', '/survivalProgress/']),
    );
    // from the frame the page stepped back, no cover
    const back = frames.findIndex((f) => f.path === '/survivalProgress/');
    for (const f of frames.slice(back)) expect(f.cover).toBe(0);
    await page.locator('.entry').first().waitFor();
    await pageIsFree(page);
    // and the next step is whole again: held, covered, arrived
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await navFrames(page);
    await bar(page, '/member/').click();
    await arrived(page, '/member/');
    const next = (await navFrames(page)).frames;
    expectArriveInner(
      next,
      expectLeave(next, {
        from: '/survivalProgress/',
        to: '/member/',
        tone: NIGHT,
        home: false,
      }),
    );
  });

  test('a second link during the leave: the reader goes to the second page only', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await watchNav(page);
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    const entries = await page.evaluate(() => window.history.length);
    await navFrames(page);
    await whileComing(page, {
      click: '.dim-bar nav a[href="/survivalProgress/"]',
    });
    await page.locator('.head .crumb a').first().click();
    await arrived(page, '/survivalProgress/');
    expect(await did(page)).toBeGreaterThan(0.3);
    const { frames, runs } = await navFrames(page);
    expect(new Set(frames.map((f) => f.path))).toEqual(
      new Set(['/member/', '/survivalProgress/']),
    );
    // one cover for both clicks: it never thinned before the page changed, and lifted once
    const change = frames.findIndex((f) => f.path === '/survivalProgress/');
    frames.slice(0, change).forEach((f, i, all) => {
      if (i > 0)
        expect(f.cover).toBeGreaterThanOrEqual(all[i - 1].cover - 0.001);
    });
    expect(runs.filter((r) => r === 'opacity:520')).toHaveLength(1);
    expectArriveInner(frames, change);
    expect(await page.evaluate(() => window.history.length)).toBe(entries + 1);
    await page.locator('.entry').first().waitFor();
    await pageIsFree(page);
  });

  test('the same link twice is one step', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await watchNav(page);
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    const entries = await page.evaluate(() => window.history.length);
    await navFrames(page);
    await whileComing(page, {
      click: '.dim-bar nav a[href="/survivalProgress/"]',
    });
    await bar(page, '/survivalProgress/').click();
    await arrived(page, '/survivalProgress/');
    expect(await did(page)).toBeGreaterThan(0.3);
    const { frames, runs } = await navFrames(page);
    expect(runs).toEqual(['opacity:280', 'opacity:520']);
    expectArriveInner(
      frames,
      expectLeave(frames, {
        from: '/member/',
        to: '/survivalProgress/',
        tone: NIGHT,
        home: false,
      }),
    );
    expect(await page.evaluate(() => window.history.length)).toBe(entries + 1);
    await page.goBack();
    await arrived(page, '/member/');
    await page.locator('.person').first().waitFor();
    await pageIsFree(page);
  });

  test('a page restored from the cache during the leave: the cover is taken away, the step is given up, the page is free', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await watchNav(page);
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await navFrames(page);
    await whileComing(page, 'restored');
    await bar(page, '/survivalProgress/').click();
    await expect.poll(() => did(page)).toBeGreaterThan(0.3);
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
    // long enough for a step that was not given up to have happened
    await page.waitForTimeout(800);
    expect(new URL(page.url()).pathname).toBe('/member/');
    const { frames } = await navFrames(page);
    expect(Math.max(...frames.map((f) => f.cover))).toBeLessThan(1);
    expect(frames.at(-1)!.main).toEqual({ o: 1, y: 0 });
    await pageIsFree(page);
    // the hold was let go once, not twice: the next step holds the page again
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await navFrames(page);
    await bar(page, '/survivalProgress/').click();
    await arrived(page, '/survivalProgress/');
    const next = (await navFrames(page)).frames;
    expectArriveInner(
      next,
      expectLeave(next, {
        from: '/member/',
        to: '/survivalProgress/',
        tone: NIGHT,
        home: false,
      }),
    );
  });

  test('clicks that are the browser’s own are left alone: Ctrl, Shift, the middle button, a new tab, a download, another site', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // Other sites are not visited: the click is what is under test. "No content" is the answer that leaves the
    // browser on the page it is on, so that the page can be looked at afterwards.
    await context.route(
      /discord\.gg|discord\.com|youtube\.com|twitter\.com|x\.com|github\.com/,
      (r) => r.fulfill({ status: 204 }),
    );
    await watchNav(page);
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await navFrames(page);
    const link = bar(page, '/survivalProgress/');
    const untouched = async (what: string) => {
      await page.bringToFront();
      await page.waitForTimeout(500);
      const { frames } = await navFrames(page);
      expect(frames.length, what).toBeGreaterThan(3);
      for (const f of frames) {
        expect(f.cover, what).toBe(0);
        expect(f.nav, what).toBeNull();
        expect(f.main!.o, what).toBe(1);
        expect(f.path, what).toBe('/member/');
      }
    };
    for (const [what, click] of [
      // (Ctrl here, Cmd on a Mac: the key that opens a link in a new tab on this platform)
      ['Ctrl or Cmd', () => link.click({ modifiers: ['ControlOrMeta'] })],
      ['Shift', () => link.click({ modifiers: ['Shift'] })],
      ['middle button', () => link.click({ button: 'middle' })],
    ] as const) {
      const opened = context
        .waitForEvent('page', { timeout: 3000 })
        .catch(() => null);
      await click();
      await untouched(what);
      await (await opened)?.close();
    }
    // a link that opens a new tab
    const tab = context
      .waitForEvent('page', { timeout: 3000 })
      .catch(() => null);
    await page.locator('.dim-bar a.discord').click();
    await untouched('target=_blank');
    await (await tab)?.close();
    // another site, in this tab
    await page.locator('.dim-foot a', { hasText: 'YouTube' }).click();
    await untouched('another site');
    // a download
    await page.evaluate(() => {
      const a = document.createElement('a');
      a.href = '/banner.jpg';
      a.download = 'banner.jpg';
      a.id = 'probe-download';
      a.textContent = 'download';
      // where nothing is over it
      a.style.cssText = 'position:fixed;left:24px;bottom:24px;z-index:99';
      document.querySelector('.dim main')!.prepend(a);
    });
    const download = page.waitForEvent('download');
    await page.locator('#probe-download').click();
    await untouched('download');
    await (await download).cancel();
    // and the plain click still is a step
    await link.click();
    await arrived(page, '/survivalProgress/');
  });

  for (const moment of ['coming', 'whole', 'lifting'] as const)
    test(`a far jump on the home page, then a link to another page while its cover is ${moment}: the step takes the cover over`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await watchNav(page);
      await openPage(page, '/');
      await ready(page);
      await expect(page.locator('.loader')).toHaveCount(0);
      const mark = await documentMark(page);
      await navFrames(page);
      // armed for that moment of the cut, then the cut: hero → respawn
      await clickAt(page, '.dim-bar nav a[href="/member/"]', moment, 0.7);
      await page.locator('.hero a.btn').click();
      const clicked = await clickedAt(page);
      await arrived(page, '/member/');
      expect(await documentMark(page)).toBe(mark);
      const { frames } = await navFrames(page);
      const after = frames.filter((f) => f.t >= clicked.t);
      // from the first frame the cover is whole after that click, until the members page is in the document:
      // it stays whole (the cut does not lift it)
      const whole = after.findIndex((f) => f.cover >= 0.99);
      const there = after.findIndex((f) => f.path === '/member/' && f.line0);
      expect(whole).toBeGreaterThanOrEqual(0);
      expect(there).toBeGreaterThan(whole);
      after
        .slice(whole, there + 1)
        .forEach((f, i) =>
          expect(f.cover, `frame ${i}`).toBeGreaterThanOrEqual(0.99),
        );
      // and the home page is never seen again: none of its content under a cover that can be seen through
      for (const f of after.slice(whole))
        if (f.path === '/' && f.main && f.main.o > 0)
          expect(f.cover).toBeGreaterThanOrEqual(0.99);
      // the cut does not move the page any further once the step has it
      const home = after.filter((f) => f.path === '/');
      expect(new Set(home.map((f) => f.y)).size).toBe(1);
      // the members page plays its entrance from its start, under the cover that lifts once
      expectArriveInner(
        frames,
        frames.findIndex((f) => f.path === '/member/'),
      );
      expect(new URL(page.url()).hash).toBe('');
      await page.locator('.person').first().waitFor();
      await pageIsFree(page);
    });

  test('a link to another page, then a far jump while the cover comes in: one step, and no cut', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await watchNav(page);
    await openPage(page, '/');
    await ready(page);
    await expect(page.locator('.loader')).toHaveCount(0);
    const entries = await page.evaluate(() => window.history.length);
    await navFrames(page);
    await clickAt(page, '.hero a.btn', 'coming');
    await bar(page, '/member/').click();
    expect((await clickedAt(page)).cover).toBeGreaterThan(0.3);
    await arrived(page, '/member/');
    const { frames, runs } = await navFrames(page);
    // the page never moved (expectLeave: one place for the whole leave), one cover in and out
    expectArriveInner(
      frames,
      expectLeave(frames, {
        from: '/',
        to: '/member/',
        tone: NIGHT,
        home: true,
      }),
    );
    expect(runs).toEqual(['opacity:280', 'opacity:520']);
    expect(new URL(page.url()).hash).toBe('');
    expect(await page.evaluate(() => window.history.length)).toBe(entries + 1);
    await page.locator('.person').first().waitFor();
    await pageIsFree(page);
  });

  test('a cover that is sent away while a step is leaving: no step, the content comes back, the page is free', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await watchNav(page);
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await navFrames(page);
    await whileComing(page, 'sent away');
    await bar(page, '/survivalProgress/').click();
    await expect.poll(() => did(page)).toBeGreaterThan(0.3);
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
    await page.waitForTimeout(800);
    expect(new URL(page.url()).pathname).toBe('/member/');
    const { frames } = await navFrames(page);
    expect(Math.max(...frames.map((f) => f.cover))).toBeLessThan(1);
    // the content had begun to leave, and is back
    expect(Math.min(...frames.map((f) => f.main!.o))).toBeLessThan(0.9);
    expect(frames.at(-1)).toMatchObject({ nav: null, main: { o: 1, y: 0 } });
    await pageIsFree(page);
    // and the next step is whole
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await navFrames(page);
    await bar(page, '/survivalProgress/').click();
    await arrived(page, '/survivalProgress/');
    const next = (await navFrames(page)).frames;
    expectArriveInner(
      next,
      expectLeave(next, {
        from: '/member/',
        to: '/survivalProgress/',
        tone: NIGHT,
        home: false,
      }),
    );
  });

  test('reduced motion: a cross-fade of at most 120 ms each way, and nothing travels', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await watchNav(page);
    await openPage(page, '/member/', { reducedMotion: true });
    await page.locator('.person').first().waitFor();
    const mark = await documentMark(page);
    await expect(page.locator('.dim main')).toHaveCSS(
      'transition-duration',
      '0.1s',
    );
    await navFrames(page);
    await bar(page, '/survivalProgress/').click();
    await arrived(page, '/survivalProgress/');
    const { frames, runs } = await navFrames(page);
    expect(runs).toEqual(['opacity:100', 'opacity:120']);
    const change = frames.findIndex((f) => f.path === '/survivalProgress/');
    expect(frames[change - 1].cover).toBe(1);
    for (const f of frames) {
      expect(f.main?.y ?? 0).toBe(0);
      expect(f.line0?.y ?? 0).toBe(0);
    }
    expect(await documentMark(page)).toBe(mark);
    await page.locator('.entry').first().waitFor();
    await pageIsFree(page);
  });
});

test.describe('going to a legacy page', () => {
  /** The footer's own link to a legacy page. */
  const LEGACY_LINK = '.dim-foot .pages a[href="/join/"]';
  /**
   * Bring that link onto the screen, at its foot (so the page is far down, and still has a little way to go),
   * and wait until the page is at rest there.
   */
  const legacyLink = async (page: Page) => {
    await page.locator(LEGACY_LINK).evaluate((a) =>
      window.scrollTo({
        top:
          a.getBoundingClientRect().bottom +
          window.scrollY -
          window.innerHeight +
          8,
        behavior: 'instant',
      }),
    );
    await atRest(page);
    await expect(page.locator(LEGACY_LINK)).toBeInViewport();
  };
  /** The legacy page, with nothing of the shell or of a step on it. */
  const onLegacy = async (page: Page) => {
    await expect(page.locator('[data-shell="legacy"]')).toBeVisible();
    await expect(page.locator('.dim-cover')).toHaveCount(0);
    expect(
      await page.evaluate(() => ({
        nav: document.documentElement.getAttribute('data-nav'),
        dim: document.documentElement.getAttribute('data-dim'),
      })),
    ).toEqual({ nav: null, dim: null });
  };

  for (const theme of ['dark', 'light'] as const)
    test(`from an inner page: the leave half only, and back clears everything (${theme})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await watchNav(page);
      await openPage(page, '/member/', { theme });
      await page.locator('.person').first().waitFor();
      await legacyLink(page);
      const mark = await documentMark(page);
      await navFrames(page);
      await page.locator(LEGACY_LINK).click();
      await onLegacy(page);
      expect(await documentMark(page)).toBe(mark);
      const { frames, runs } = await navFrames(page);
      // the leave, as between two pages of the shell: content out, cover whole, page held, in the theme's ground
      const change = expectLeave(frames, {
        from: '/member/',
        to: '/join/',
        tone: theme === 'dark' ? NIGHT : DAY,
        home: false,
      });
      // and no arrive half: the cover never lifts, it goes with the shell
      expect(runs).toEqual(['opacity:280']);
      for (const f of frames.slice(change)) {
        expect(f.cover).toBe(0);
        expect(f.nav).toBeNull();
      }
      // the legacy page is the reader's
      await page.mouse.move(720, 450);
      await page.mouse.wheel(0, 300);
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeGreaterThan(0);

      // back: the inner page plays its entrance, with no cover, and is free
      await navFrames(page);
      await page.goBack();
      await arrived(page, '/member/');
      const back = (await navFrames(page)).frames;
      for (const f of back) expect(f.cover).toBe(0);
      const there = back.filter((f) => f.path === '/member/' && f.line0);
      expect(there[0].line0!.o).toBeLessThan(0.2);
      expect(there.at(-1)!.line0).toEqual({ o: 1, y: 0 });
      await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
      await page.locator('.person').first().waitFor();
      await pageIsFree(page);
      // and a step between pages of the shell is whole again afterwards
      await page.evaluate(() =>
        window.scrollTo({ top: 0, behavior: 'instant' }),
      );
      await navFrames(page);
      await bar(page, '/survivalProgress/').click();
      await arrived(page, '/survivalProgress/');
      const next = (await navFrames(page)).frames;
      expectArriveInner(
        next,
        expectLeave(next, {
          from: '/member/',
          to: '/survivalProgress/',
          tone: theme === 'dark' ? NIGHT : DAY,
          home: false,
        }),
      );
    });

  for (const from of ['/member/', '/'] as const)
    test(`from far down ${from}: the legacy page is at its top, and stays there`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await watchNav(page);
      await openPage(page, from);
      if (from === '/') {
        await ready(page);
        await expect(page.locator('.loader')).toHaveCount(0);
      } else await page.locator('.person').first().waitFor();
      // the link is in the footer, at the foot of the page
      await legacyLink(page);
      const y = await page.evaluate(() => window.scrollY);
      expect(y).toBeGreaterThan(800);
      const mark = await documentMark(page);
      // The order under test: the router puts the legacy page at its top while it commits; the browser tells the
      // page of that scroll a little later, and the shell's effects are cleaned up a little later too. Which of the
      // two comes first is not ours to say, so the test says it: the moment the legacy page is in the document
      // (a microtask after the commit, before any clean-up that was put off), the page is told of the scroll.
      await page.evaluate(() => {
        const seen = new MutationObserver(() => {
          if (!document.querySelector('[data-shell="legacy"]')) return;
          seen.disconnect();
          const w = window as unknown as { __told: number; __held: boolean };
          w.__told = window.scrollY;
          window.dispatchEvent(new Event('scroll'));
          // and is the page still held then? (a hold cancels the wheel)
          w.__held = !document.dispatchEvent(
            new WheelEvent('wheel', {
              deltaY: 100,
              bubbles: true,
              cancelable: true,
            }),
          );
        });
        seen.observe(document.body, { childList: true, subtree: true });
      });
      await navFrames(page);
      await page.locator(LEGACY_LINK).click();
      await onLegacy(page);
      // the router had put the page at its top when the scroll was told of, and the step's hold had been let go
      expect(
        await page.evaluate(() => {
          const w = window as unknown as { __told?: number; __held?: boolean };
          return [w.__told, w.__held];
        }),
      ).toEqual([0, false]);
      expect(await documentMark(page)).toBe(mark);
      // a good many frames on: whatever was still to be dispatched has been
      await page.evaluate(
        () =>
          new Promise<void>((done) => {
            let n = 0;
            const tick = () =>
              ++n < 30 ? requestAnimationFrame(tick) : done();
            requestAnimationFrame(tick);
          }),
      );
      const { frames } = await navFrames(page);
      // held where it was for the whole leave
      const before = frames.filter((f) => f.path === from);
      expect(before.length).toBeGreaterThan(5);
      for (const f of before) expect(f.y).toBe(y);
      // and at the top of the legacy page in every frame of it
      const there = frames.filter((f) => f.path === '/join/');
      expect(there.length).toBeGreaterThan(25);
      there.forEach((f, i) => expect(f.y, `frame ${i}`).toBe(0));
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });

  test('a legacy page that is two seconds late: the cover stays whole with a sign of life, and goes with the shell', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route(/\/join\/.*\.txt/, async (r) => {
      await new Promise((done) => setTimeout(done, 2000));
      await r.continue();
    });
    await watchNav(page);
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await legacyLink(page);
    const mark = await documentMark(page);
    await navFrames(page);
    await page.locator(LEGACY_LINK).click();
    await expect(page.locator('.dim-cover .cover-wait canvas')).toBeVisible({
      timeout: 5000,
    });
    await onLegacy(page);
    expect(await documentMark(page)).toBe(mark);
    const { frames, runs } = await navFrames(page);
    const whole = frames.findIndex((f) => f.cover >= 0.99);
    const there = frames.findIndex((f) => f.path === '/join/');
    expect(there).toBeGreaterThan(whole);
    expect(frames[there].t - frames[whole].t).toBeGreaterThan(1700);
    // whole until the members page was gone; the members page is never seen under less
    for (const f of frames.slice(whole))
      if (f.path === '/member/') expect(f.cover).toBeGreaterThanOrEqual(0.99);
    expect(frames.some((f) => f.wait === 1)).toBe(true);
    // the cover never lifts: it goes with the shell, and the sign with it
    expect(runs).toEqual(['opacity:280']);
    for (const f of frames.slice(there)) expect(f.wait).toBeNull();
  });

  test('a legacy page that cannot be fetched is loaded the plain way, and stepping back leaves no cover and no hold', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route(/\/join\/.*\.txt/, (r) => r.abort());
    await watchNav(page);
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await legacyLink(page);
    const mark = await documentMark(page);
    await page.locator(LEGACY_LINK).click();
    await onLegacy(page);
    // a new document this time
    expect(await documentMark(page)).not.toBe(mark);
    await page.goBack();
    await arrived(page, '/member/');
    await page.locator('.person').first().waitFor();
    await pageIsFree(page);
  });

  test('the browser’s own clicks on a link to a legacy page are left alone', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await watchNav(page);
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await legacyLink(page);
    await navFrames(page);
    const opened = context
      .waitForEvent('page', { timeout: 5000 })
      .catch(() => null);
    await page.locator(LEGACY_LINK).click({ modifiers: ['ControlOrMeta'] });
    await page.bringToFront();
    await page.waitForTimeout(500);
    const { frames } = await navFrames(page);
    expect(frames.length).toBeGreaterThan(3);
    for (const f of frames) {
      expect(f.cover).toBe(0);
      expect(f.nav).toBeNull();
      expect(f.path).toBe('/member/');
    }
    await (await opened)?.close();
  });
});
