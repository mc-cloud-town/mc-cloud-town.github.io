import { expect, test, type Page } from '@playwright/test';
import { atRest, openPage } from './helpers/dimensions';
import {
  clickAt,
  clickedAt,
  coverAtLanding,
  coverAtMoves,
  coverRuns,
  flashState,
  type Frame,
  heldFrames,
  jumpTo,
  landedOn,
  landingFrames,
  ready,
  record,
  recorded,
  recordHeld,
  scrollToSection,
  shownPictures,
  topOf,
  visibleScenes,
  watchLanding,
} from './helpers/home';

test.describe('home: jumping to a section', () => {
  const historyLength = (page: Page) =>
    page.evaluate(() => window.history.length);

  test('to the next dimension: the page travels there through the portal, with no cover', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#overworld', 0);
    const entries = await historyLength(page);
    await record(page);
    await page.locator('.dim-bar nav a[data-d="nether"]').click();
    await landedOn(page, '#nether');
    const frames = await recorded(page);
    // it moved over many frames, always forwards, for between 1.2 and 2.2 seconds
    const moving = frames.filter((f, i) => i > 0 && f.y !== frames[i - 1].y);
    expect(moving.length).toBeGreaterThan(20);
    frames.forEach((f, i) =>
      expect(f.y, `frame ${i}`).toBeGreaterThanOrEqual(frames[i - 1]?.y ?? 0),
    );
    const took = moving.at(-1)!.t - moving[0].t;
    expect(took).toBeGreaterThan(1000);
    expect(took).toBeLessThan(2500);
    // never covered: the reader rides the transition of this boundary, the portal
    expect(Math.max(...frames.map((f) => f.cover))).toBe(0);
    expect(Math.max(...frames.map((f) => f.portal))).toBeGreaterThan(0.5);
    const seen = frames.map((f) => f.scenes.join('+'));
    expect(seen).toContain('w3');
    expect(seen.at(-1)).toBe('nether');
    // arrived
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'nether');
    await expect(page.locator('.dim-bar nav a.on')).toHaveAttribute(
      'data-d',
      'nether',
    );
    await expect(page.locator('#nether [data-heading]')).toBeFocused();
    expect(new URL(page.url()).hash).toBe('#nether');
    expect(await historyLength(page)).toBe(entries);
    expect(await shownPictures(page)).toEqual(['0']);
    // and the way back is a travel too
    await record(page);
    await page.locator('.rail a[data-d="overworld"]').click();
    await landedOn(page, '#overworld');
    const back = await recorded(page);
    expect(
      back.filter((f, i) => i > 0 && f.y !== back[i - 1].y).length,
    ).toBeGreaterThan(20);
    expect(Math.max(...back.map((f) => f.cover))).toBe(0);
    expect(await visibleScenes(page)).toEqual(['town']);
    expect(new URL(page.url()).hash).toBe('#overworld');
    expect(await historyLength(page)).toBe(entries);
  });

  test('farther away: the page cuts under a cover, and lands with everything in place', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    const entries = await historyLength(page);
    const cover = page.locator('.dim-cover');
    await expect(cover).toHaveCSS('visibility', 'hidden');
    await expect(cover).toHaveCSS('opacity', '0');

    // hero → respawn, from the button in the hero
    await record(page);
    await page.locator('.hero a.btn').click();
    await landedOn(page, '#respawn');
    let frames = await recorded(page);
    // opacity only: 280ms in, 520ms out
    expect(await coverRuns(page)).toEqual(['opacity:280', 'opacity:520']);
    const start = frames[0].y;
    expect(start).toBe(0);
    // the cover is whole before the page moves, and before the dimension changes
    const moved = frames.findIndex((f) => f.y !== start);
    expect(moved).toBeGreaterThan(0);
    expect(await coverAtLanding(page)).toBe(1);
    expect(frames[moved].cover).toBe(1);
    const changed = frames.findIndex((f) => f.dim !== 'overworld');
    expect(changed).toBeGreaterThan(0);
    expect(frames[changed].cover).toBe(1);
    // one cut: the page is only ever at the start or at the target
    expect(new Set(frames.map((f) => f.y)).size).toBe(2);
    // no transition of the page in between is ever seen: neither the portal nor the white-out
    expect(Math.max(...frames.map((f) => f.portal * (1 - f.cover)))).toBe(0);
    expect(Math.max(...frames.map((f) => f.flash * (1 - f.cover)))).toBe(0);
    // it lifts over about half a second, onto day one
    const lifting = frames.filter((f) => f.cover > 0 && f.cover < 1 && f.y);
    expect(lifting.length).toBeGreaterThan(5);
    for (const f of lifting) expect(f.scenes).toEqual(['day1']);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'respawn');
    await expect(page.locator('.dim-bar nav a.on')).toHaveAttribute(
      'data-d',
      'respawn',
    );
    await expect(page.locator('#respawn h2')).toBeFocused();
    await expect(page.locator('#respawn h2')).toHaveCSS('opacity', '1');
    expect(new URL(page.url()).hash).toBe('#respawn');

    // respawn → nether: over the End and the whole pinned ledger, onto the opening
    await record(page);
    await page.locator('.dim-bar nav a[data-d="nether"]').click();
    await landedOn(page, '#nether');
    frames = await recorded(page);
    expect(await coverAtLanding(page)).toBe(1);
    expect(new Set(frames.map((f) => f.y)).size).toBe(2);
    expect(await visibleScenes(page)).toEqual(['nether']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'nether');
    await expect(page.locator('#nether [data-heading]')).toBeFocused();
    // not inside the pin: the stage is still below, on its first facility
    expect(await topOf(page, '.ledger-stage')).toBeGreaterThan(900);
    expect(await shownPictures(page)).toEqual(['0']);
    await expect(page.locator('.ledger-now h3')).toHaveText('地獄大廳');
    await expect(page.locator('#nether p.body')).toHaveCSS('opacity', '1');

    // nether → respawn again, then all the way back to the overworld
    await page.locator('.dim-bar nav a[data-d="respawn"]').click();
    await landedOn(page, '#respawn');
    expect(await visibleScenes(page)).toEqual(['day1']);
    await record(page);
    await page.locator('.dim-bar nav a[data-d="overworld"]').click();
    await landedOn(page, '#overworld');
    frames = await recorded(page);
    expect(await coverRuns(page)).toEqual(['opacity:280', 'opacity:520']);
    expect(await coverAtLanding(page)).toBe(1);
    expect(new Set(frames.map((f) => f.y)).size).toBe(2);
    expect(await visibleScenes(page)).toEqual(['town']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'overworld');
    await expect(page.locator('.dim-bar nav a.on')).toHaveAttribute(
      'data-d',
      'overworld',
    );
    await expect(page.locator('#overworld [data-heading]')).toBeFocused();
    expect(new URL(page.url()).hash).toBe('#overworld');
    // one entry, however many sections were visited
    expect(await historyLength(page)).toBe(entries);
    // the page is the reader's again
    await page.mouse.move(720, 450);
    const y = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 300);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(y);
  });

  test('the cover takes the tone of where it leads: night for the End, even by day', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { theme: 'light' });
    await ready(page);
    const tones = (frames: Frame[]) => [
      ...new Set(frames.filter((f) => f.cover > 0).map((f) => f.tone)),
    ];
    // hero → the End: two dimensions away
    await record(page);
    await page.locator('.dim-bar nav a[data-d="end"]').click();
    await landedOn(page, '#end');
    let frames = await recorded(page);
    expect(await coverAtLanding(page)).toBe(1);
    expect(tones(frames)).toEqual(['rgb(6, 8, 11)']);
    expect(await visibleScenes(page)).toEqual(['hall']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
    // the End → the top of the page, by the logo: the paper of the day theme
    await record(page);
    await page.locator('.dim-bar .logo').click();
    await landedOn(page, '.hero');
    frames = await recorded(page);
    expect(await coverAtLanding(page)).toBe(1);
    expect(tones(frames)).toEqual(['rgb(238, 242, 245)']);
    expect(await visibleScenes(page)).toEqual(['spawn']);
    await expect(page.locator('.hero h1')).toBeFocused();
    expect(new URL(page.url()).hash).toBe('');
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test('from the sheet on a phone: it closes into the cover or into the travel, and the page is free again', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, '/');
    await ready(page);
    const menu = page.locator('.dim-bar [data-action="menu"]');
    const sheet = page.locator('.dim-sheet');
    const sheetOpacity = () =>
      sheet.evaluate((el) => +getComputedStyle(el).opacity);
    const open = async () => {
      await menu.click();
      await expect(sheet).toHaveCSS('opacity', '1');
      await expect(sheet.locator('a').last()).toHaveCSS('opacity', '1');
    };
    const free = async () => {
      await expect(sheet).toHaveCSS('visibility', 'hidden');
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      expect(
        await page.evaluate(() => [
          getComputedStyle(document.body).overflowY,
          getComputedStyle(document.documentElement).overflowY,
          document.querySelector('main')!.inert,
        ]),
      ).toEqual(['visible', 'visible', false]);
      const y = await page.evaluate(() => window.scrollY);
      await page.mouse.move(195, 500);
      await page.mouse.wheel(0, 240);
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeGreaterThan(y);
      // let the smooth scroll run out before the test moves the page itself
      await page.waitForTimeout(1500);
    };

    // far: hero → the End. The sheet stays whole until the cover is over it, and is gone before the cover lifts.
    await open();
    await record(page);
    await sheet.locator('a[data-d="end"]').click();
    await landedOn(page, '#end');
    const cut = await recorded(page);
    const moved = cut.findIndex((f) => f.y !== cut[0].y);
    expect(moved).toBeGreaterThan(0);
    expect(await coverAtLanding(page)).toBe(1);
    cut
      .slice(0, moved)
      .forEach((f, i) =>
        expect(
          f.sheet === 1 || f.cover === 1,
          `before the cut, frame ${i}`,
        ).toBe(true),
      );
    const lifting = cut.slice(moved).filter((f) => f.cover < 1);
    expect(lifting.length).toBeGreaterThan(5);
    for (const f of lifting) {
      expect(f.sheet).toBe(0);
      expect(f.scenes).toEqual(['hall']);
    }
    expect(new Set(cut.map((f) => f.y)).size).toBe(2);
    expect(await sheetOpacity()).toBe(0);
    expect(await visibleScenes(page)).toEqual(['hall']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
    await expect(page.locator('#end [data-heading]')).toBeFocused();
    await free();

    // near: back at the top, to the overworld. The sheet closes while the page is already on its way.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => visibleScenes(page)).toEqual(['spawn']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'overworld');
    await open();
    await record(page);
    await sheet.locator('a[data-d="overworld"]').click();
    await landedOn(page, '#overworld');
    const frames = await recorded(page);
    expect(Math.max(...frames.map((f) => f.cover))).toBe(0);
    expect(
      frames.filter((f, i) => i > 0 && f.y !== frames[i - 1].y).length,
    ).toBeGreaterThan(20);
    expect(await visibleScenes(page)).toEqual(['town']);
    await expect(page.locator('#overworld [data-heading]')).toBeFocused();
    await free();
  });

  test('reduced motion: no travel, an instant jump behind a fade of at most 120ms', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { reducedMotion: true });
    await ready(page);
    await jumpTo(page, '#overworld');
    await expect.poll(() => visibleScenes(page)).toEqual(['town']);
    for (const [d, scene, sel] of [
      ['nether', 'nether', '#nether'], // the next dimension
      ['respawn', 'day1', '#respawn'], // two away
      ['overworld', 'town', '#overworld'], // three away
    ] as const) {
      await record(page);
      await page.locator(`.dim-bar nav a[data-d="${d}"]`).click();
      await landedOn(page, sel);
      const frames = await recorded(page);
      // every fade of the cover is short
      const fades = (await coverRuns(page)).map((r) => Number(r.split(':')[1]));
      expect(fades.length, d).toBeGreaterThan(0);
      expect(
        (await coverRuns(page)).every((r) => r.startsWith('opacity:')),
        d,
      ).toBe(true);
      expect(Math.max(...fades), d).toBeLessThanOrEqual(120);
      // covered, and the page is only ever at the start or at the target
      expect(await coverAtLanding(page), d).toBe(1);
      expect(new Set(frames.map((f) => f.y)).size, d).toBe(2);
      await expect.poll(() => visibleScenes(page), d).toEqual([scene]);
      await expect(page.locator('html')).toHaveAttribute('data-dim', d);
      await expect(page.locator(`${sel} [data-heading]`)).toBeFocused();
      expect(new URL(page.url()).hash).toBe(sel);
    }
    expect(
      await page.evaluate(() =>
        document.documentElement.classList.contains('lenis'),
      ),
    ).toBe(false);
  });
});

test.describe('home: a jump that interrupts a jump', () => {
  /** The link of the first jump, hero → respawn: in the fixed bar, so that clicking it never scrolls the page. */
  const far = (page: Page) => page.locator('.dim-bar nav a[data-d="respawn"]');
  /** The arrival has played out: the bar stands still, and the page is at the top. */
  const arrived = async (page: Page) => {
    await expect(page.locator('.dim-bar')).toHaveCSS('opacity', '1');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  };
  /** Where the page stands, everything a landing changes, and that no cover is left. */
  const arrivedAt = async (
    page: Page,
    d: 'overworld' | 'nether' | 'end' | 'respawn',
    scene: string,
  ) => {
    await landedOn(page, `#${d}`);
    await expect.poll(() => visibleScenes(page)).toEqual([scene]);
    await expect(page.locator('html')).toHaveAttribute('data-dim', d);
    await expect(page.locator('.dim-bar nav a.on')).toHaveAttribute(
      'data-d',
      d,
    );
    await expect(page.locator(`#${d} [data-heading]`)).toBeFocused();
    expect(new URL(page.url()).hash).toBe(`#${d}`);
    const cover = page.locator('.dim-cover');
    await expect(cover).toHaveAttribute('data-on', 'false');
    await expect(cover).toHaveCSS('opacity', '0');
    await expect(cover).toHaveCSS('visibility', 'hidden');
  };
  /** The page never moved in a frame in which the cover could be seen through. */
  const neverMovedUncovered = async (page: Page, frames: Frame[]) => {
    const moved = frames.filter((f, i) => i > 0 && f.y !== frames[i - 1].y);
    expect(moved.length).toBeGreaterThan(0);
    for (const f of moved)
      expect(f.cover, `moved to ${f.y}`).toBeGreaterThanOrEqual(0.99);
    const moves = await coverAtMoves(page);
    expect(moves.length).toBeGreaterThan(0);
    for (const m of moves)
      expect(m.cover, `moved to ${m.to}`).toBeGreaterThanOrEqual(0.99);
    return moves;
  };

  for (const [name, below] of [
    ['as soon as the cover begins to lift', 0.99],
    ['when the cover has half lifted', 0.5],
    ['when the cover has nearly gone', 0.25],
  ] as const)
    test(`a second far jump ${name}: the page waits for the cover to be whole again`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await openPage(page, '/');
      await ready(page);
      await arrived(page);
      await record(page);
      // hero → respawn; and in the lift of that cut, respawn → overworld
      await clickAt(
        page,
        '.dim-bar nav a[data-d="overworld"]',
        'lifting',
        below,
      );
      await far(page).click();
      const clicked = await clickedAt(page);
      await arrivedAt(page, 'overworld', 'town');
      const frames = await recorded(page);
      // the second jump was asked for in the lift, on the first target
      expect(clicked.cover).toBeLessThan(below);
      expect(clicked.cover).toBeGreaterThan(0);
      const stops = [...new Set(frames.map((f) => f.y))];
      expect(stops.length).toBe(3);
      expect(stops[0]).toBe(0);
      expect(clicked.y).toBe(stops[1]);
      const moves = await neverMovedUncovered(page, frames);
      expect(moves.length).toBe(2);
      // and the cover was seen through in between: this was an interruption of the lift, not a second cut after it
      const between = frames.filter((f) => f.y === stops[1]);
      expect(Math.min(...between.map((f) => f.cover))).toBeLessThan(below);
      // no transition of the page is seen on the way
      expect(Math.max(...frames.map((f) => f.portal * (1 - f.cover)))).toBe(0);
    });

  test('a second far jump while the cover is whole goes at once, and only the second target is landed on', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await arrived(page);
    await page.evaluate(() => {
      const w = window as unknown as { __urls: string[] };
      w.__urls = [];
      const replace = window.history.replaceState.bind(window.history);
      window.history.replaceState = (state, unused, url) => {
        w.__urls.push(String(url));
        replace(state, unused, url);
      };
    });
    await record(page);
    // hero → respawn; under the whole cover, with the page already there, → the End
    await clickAt(page, '.dim-bar nav a[data-d="end"]', 'whole');
    await far(page).click();
    const clicked = await clickedAt(page);
    await arrivedAt(page, 'end', 'hall');
    const frames = await recorded(page);
    expect(clicked.cover).toBe(1);
    const moves = await neverMovedUncovered(page, frames);
    expect(moves.length).toBe(2);
    // the cover was whole already: nothing to wait for
    expect(moves[1].at - clicked.t).toBeLessThan(300);
    // one cover for both: in once, out once
    expect(await coverRuns(page)).toEqual(['opacity:280', 'opacity:520']);
    // the first target was never arrived at
    expect(
      await page.evaluate(
        () => (window as unknown as { __urls: string[] }).__urls,
      ),
    ).toEqual(['#end']);
    // the cover never showed the first target
    for (const f of frames.filter((f) => f.cover < 0.99 && f.y !== 0))
      expect(f.scenes).toEqual(['hall']);
  });
});

test.describe('home: a jump that is interrupted', () => {
  const bar = (page: Page, d: string) =>
    page.locator(`.dim-bar nav a[data-d="${d}"]`);
  /** Every address the page gives itself from now on. */
  const watchAddress = (page: Page) =>
    page.evaluate(() => {
      const w = window as unknown as { __urls?: string[] };
      const watched = Boolean(w.__urls);
      w.__urls = [];
      if (watched) return;
      const replace = window.history.replaceState.bind(window.history);
      window.history.replaceState = (state, unused, url) => {
        w.__urls!.push(String(url));
        replace(state, unused, url);
      };
    });
  const addresses = (page: Page) =>
    page.evaluate(() => (window as unknown as { __urls: string[] }).__urls);
  const start = async (page: Page, width = 1440, height = 900) => {
    await page.setViewportSize({ width, height });
    await openPage(page, '/');
    await ready(page);
    await expect(page.locator('.dim-bar')).toHaveCSS('opacity', '1');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await watchAddress(page);
  };
  const coverGone = async (page: Page) => {
    const cover = page.locator('.dim-cover');
    await expect(cover).toHaveAttribute('data-on', 'false');
    await expect(cover).toHaveCSS('opacity', '0');
    await expect(cover).toHaveCSS('visibility', 'hidden');
  };

  test('another section clicked while the cover comes in: only the second is gone to', async ({
    page,
  }) => {
    await start(page);
    await record(page);
    // hero → respawn; before the cover is whole, → the End
    await clickAt(page, '.dim-bar nav a[data-d="end"]', 'coming');
    await bar(page, 'respawn').click();
    const clicked = await clickedAt(page);
    expect(clicked.cover).toBeGreaterThan(0.3);
    expect(clicked.cover).toBeLessThan(0.9);
    expect(clicked.y).toBe(0);
    await landedOn(page, '#end');
    const frames = await recorded(page);
    // one cover, one move, under the whole cover; the respawn is never seen, arrived at or named
    expect(await coverRuns(page)).toEqual(['opacity:280', 'opacity:520']);
    expect(new Set(frames.map((f) => f.y)).size).toBe(2);
    const moves = await coverAtMoves(page);
    expect(moves.map((m) => m.cover)).toEqual([1]);
    expect(await addresses(page)).toEqual(['#end']);
    for (const f of frames) expect(f.scenes).not.toContain('day1');
    expect(frames.map((f) => f.dim)).not.toContain('respawn');
    expect(await visibleScenes(page)).toEqual(['hall']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
    await expect(page.locator('.dim-bar nav a.on')).toHaveAttribute(
      'data-d',
      'end',
    );
    await expect(page.locator('#end [data-heading]')).toBeFocused();
    await coverGone(page);
  });

  for (const moment of ['coming', 'whole', 'lifting'] as const)
    test(`the same far section clicked again while the cover is ${moment}: one cut, and the cover comes once`, async ({
      page,
    }) => {
      await start(page);
      await record(page);
      await clickAt(page, '.dim-bar nav a[data-d="respawn"]', moment, 0.6);
      await bar(page, 'respawn').click();
      const clicked = await clickedAt(page);
      if (moment === 'lifting') expect(clicked.cover).toBeLessThan(0.6);
      await landedOn(page, '#respawn');
      await coverGone(page);
      const frames = await recorded(page);
      // one fade in and one out: the cover does not come back for the second click
      expect(await coverRuns(page)).toEqual(['opacity:280', 'opacity:520']);
      const from = frames.findIndex((f) => f.cover === 1);
      expect(from).toBeGreaterThan(0);
      frames
        .slice(from + 1)
        .forEach((f, i) =>
          expect(f.cover, `frame ${i} of the lift`).toBeLessThanOrEqual(
            frames[from + i].cover,
          ),
        );
      // one move, under the whole cover, and arrived once
      expect(new Set(frames.map((f) => f.y)).size).toBe(2);
      expect((await coverAtMoves(page)).map((m) => m.cover)).toEqual([1]);
      expect(await addresses(page)).toEqual(['#respawn']);
      await expect(page.locator('#respawn h2')).toBeFocused();
      await expect(page.locator('#respawn h2')).toHaveCSS('opacity', '1');
      expect(await visibleScenes(page)).toEqual(['day1']);
    });

  test('the same near section clicked again on the way: the travel goes on as it was', async ({
    page,
  }) => {
    await start(page);
    await scrollToSection(page, '#overworld', 0);
    await watchAddress(page);
    await record(page);
    // the overworld → the nether; a second later, the same link once more
    await page.evaluate(() => {
      const link = document.querySelector<HTMLElement>(
        '.dim-bar nav a[data-d="nether"]',
      )!;
      link.addEventListener(
        'click',
        () =>
          setTimeout(() => {
            (window as unknown as { __again: number }).__again =
              performance.now();
            link.click();
          }, 1000),
        { once: true },
      );
    });
    await bar(page, 'nether').click();
    await landedOn(page, '#nether');
    const again = await page.evaluate(
      () => (window as unknown as { __again: number }).__again,
    );
    expect(again).toBeGreaterThan(0);
    const frames = await recorded(page);
    frames.forEach((f, i) =>
      expect(f.y, `frame ${i}`).toBeGreaterThanOrEqual(frames[i - 1]?.y ?? 0),
    );
    // the page was well on its way at the second click, and does not start again from a standstill:
    // in the 150ms after it, it covers at least half of what it covered in the 150ms before
    const span = (from: number, to: number) => {
      const inside = frames.filter((f) => f.t >= from && f.t <= to);
      expect(inside.length).toBeGreaterThan(3);
      return inside.at(-1)!.y - inside[0].y;
    };
    const before = span(again - 150, again);
    const after = span(again, again + 150);
    expect(before).toBeGreaterThan(100);
    expect(after).toBeGreaterThan(before * 0.5);
    // one travel: within its 2.2 seconds, and arrived once
    const moving = frames.filter((f, i) => i > 0 && f.y !== frames[i - 1].y);
    expect(moving.at(-1)!.t - moving[0].t).toBeLessThan(2350);
    expect(await addresses(page)).toEqual(['#nether']);
    expect(Math.max(...frames.map((f) => f.cover))).toBe(0);
    await expect(page.locator('#nether [data-heading]')).toBeFocused();
    expect(await visibleScenes(page)).toEqual(['nether']);
  });

  test('the wheel takes over a travel that began in the sheet: the travel yields, and the page is the reader’s', async ({
    page,
  }) => {
    await start(page, 390, 844);
    await scrollToSection(page, '#overworld', 0);
    const y0 = await page.evaluate(() => window.scrollY);
    await watchAddress(page);
    const menu = page.locator('.dim-bar [data-action="menu"]');
    const sheet = page.locator('.dim-sheet');
    await menu.click();
    await expect(sheet).toHaveCSS('opacity', '1');
    await expect(sheet.locator('a').last()).toHaveCSS('opacity', '1');
    await record(page);
    await sheet.locator('a[data-d="nether"]').click();
    // on its way
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(y0 + 600);
    // the reader turns the wheel the other way
    await page.mouse.move(195, 500);
    await page.mouse.wheel(0, -500);
    // the page comes to rest, and stays: the travel does not pick up again
    let last = -1;
    await expect
      .poll(
        async () => {
          const y = await page.evaluate(() => window.scrollY);
          const still = y === last;
          last = y;
          return still;
        },
        { intervals: [400] },
      )
      .toBe(true);
    await page.waitForTimeout(2400);
    const rest = await page.evaluate(() => window.scrollY);
    expect(rest).toBe(last);
    const nether = rest + (await topOf(page, '#nether'));
    expect(rest).toBeLessThan(nether - 400);
    expect(rest).toBeGreaterThan(y0);
    const frames = await recorded(page);
    // it never got to the nether, and no cover came
    for (const f of frames) {
      expect(f.y).toBeGreaterThanOrEqual(y0);
      expect(f.y).toBeLessThan(nether - 400);
    }
    expect(Math.max(...frames.map((f) => f.cover))).toBe(0);
    // the address is not that of the place that was given up, and nothing was arrived at
    expect(new URL(page.url()).hash).toBe('');
    expect(await addresses(page)).toEqual([]);
    // the sheet is closed and the page is not inert
    await expect(sheet).toHaveCSS('visibility', 'hidden');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(
      await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('[inert]')].map(
          (el) => el.className,
        ),
      ),
    ).toEqual(['lang-list', 'dim-sheet']);
    // the focus is not left in the closed sheet, nor put on the heading of the place given up
    expect(
      await page.evaluate(() => {
        const at = document.activeElement;
        return [
          Boolean(at && document.querySelector('.dim-sheet')!.contains(at)),
          Boolean(at && document.querySelector('#nether')!.contains(at)),
        ];
      }),
    ).toEqual([false, false]);
    // and the page still scrolls, and a jump still works
    await page.mouse.wheel(0, 300);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(rest);
    await page.waitForTimeout(1500);
    await menu.click();
    await expect(sheet.locator('a').last()).toHaveCSS('opacity', '1');
    await sheet.locator('a[data-d="nether"]').click();
    await landedOn(page, '#nether');
    await expect(page.locator('#nether [data-heading]')).toBeFocused();
    expect(new URL(page.url()).hash).toBe('#nether');
  });

  test('a far jump from the sheet: the page behind stays held and inert until the cover is whole', async ({
    page,
  }) => {
    await start(page, 390, 844);
    const menu = page.locator('.dim-bar [data-action="menu"]');
    const sheet = page.locator('.dim-sheet');
    await menu.click();
    await expect(sheet).toHaveCSS('opacity', '1');
    await expect(sheet.locator('a').last()).toHaveCSS('opacity', '1');
    await recordHeld(page);
    await sheet.locator('a[data-d="end"]').click();
    await landedOn(page, '#end');
    await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
    // one more frame, so that the last one recorded is from after the release
    await page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => done(null))),
    );
    const frames = await heldFrames(page);
    const whole = frames.findIndex((f) => f.cover === 1);
    expect(whole).toBeGreaterThan(5);
    const coming = frames.slice(0, whole);
    // the wheel was turned while the cover could be seen through
    expect(coming.filter((f) => f.wheel).length).toBe(1);
    // until the cover is whole the page is held, inert, and where it was
    coming.forEach((f, i) =>
      expect([f.inert, f.stopped, f.y], `frame ${i}, cover ${f.cover}`).toEqual(
        [true, true, 0],
      ),
    );
    // then the sheet lets it go, under the cover: it is not inert any more
    const after = frames.slice(whole);
    const released = after.findIndex((f) => !f.inert);
    expect(released).toBeGreaterThanOrEqual(0);
    after
      .slice(0, released + 1)
      .forEach((f) => expect(f.cover, 'let go under the cover').toBe(1));
    // but the cut holds it where it is for as long as there is any cover: one hold hands over to the other
    for (const f of frames.filter((f) => f.cover > 0.01))
      expect(f.stopped, `cover ${f.cover}`).toBe(true);
    expect(frames.at(-1)).toMatchObject({ inert: false, stopped: false });
    // the page is only ever at the top or on the End: the wheel moved nothing
    expect(new Set(frames.map((f) => f.y)).size).toBe(2);
    await expect(sheet).toHaveCSS('visibility', 'hidden');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#end [data-heading]')).toBeFocused();
    expect(await visibleScenes(page)).toEqual(['hall']);
    await coverGone(page);
    // free again
    const y = await page.evaluate(() => window.scrollY);
    await page.mouse.move(195, 500);
    await page.mouse.wheel(0, 240);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(y);
  });
});

test.describe('home: a cut holds the page', () => {
  /**
   * From the click until the cover has begun to lift, the reader keeps turning the wheel and pressing Page Down
   * (real input, as fast as it can be sent). Resolves when the cut has landed.
   */
  const insist = async (page: Page, target: string) => {
    // watched in the page, frame by frame: from here the whole cover could be missed between two looks
    await page.evaluate(() => {
      const w = window as unknown as { __lifting?: boolean };
      let whole = false;
      const tick = () => {
        const c = getComputedStyle(document.querySelector('.dim-cover')!);
        const cover = c.visibility === 'hidden' ? 0 : +c.opacity;
        if (cover === 1) whole = true;
        if (whole && cover < 0.6) w.__lifting = true;
        else requestAnimationFrame(tick);
      };
      tick();
    });
    const lifting = () =>
      page.evaluate(() =>
        Boolean((window as unknown as { __lifting?: boolean }).__lifting),
      );
    let sent = 0;
    while (!(await lifting())) {
      await page.mouse.wheel(0, 240);
      await page.keyboard.press('PageDown');
      expect(++sent, 'the cover never lifted').toBeLessThan(400);
    }
    expect(sent).toBeGreaterThan(3);
    await landedOn(page, target);
    await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
  };
  /** The page moved once, under a whole cover, and stands on the target. */
  const heldThroughout = async (page: Page, frames: Frame[]) => {
    // there were frames in which the cover could be seen through
    const coming = frames.findIndex((f) => f.cover === 1);
    expect(coming).toBeGreaterThan(3);
    frames.forEach((f, i) => {
      if (i > 0 && f.y !== frames[i - 1].y)
        expect(f.cover, `frame ${i}: ${frames[i - 1].y} → ${f.y}`).toBe(1);
    });
    expect(new Set(frames.map((f) => f.y)).size).toBe(2);
    expect((await coverAtMoves(page)).map((m) => m.cover)).toEqual([1]);
  };
  const scrollsAgain = async (page: Page, by = 300) => {
    const y = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, by);
    await expect.poll(() => page.evaluate(() => window.scrollY)).not.toBe(y);
  };
  const start = async (page: Page, reducedMotion = false) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { reducedMotion });
    await ready(page);
    await expect(page.locator('.dim-bar')).toHaveCSS('opacity', '1');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    // the pointer over the page, clear of the bar and the rail
    await page.mouse.move(720, 500);
  };

  for (const [from, link, target, scene] of [
    ['the bar', '.dim-bar nav a[data-d="respawn"]', '#respawn', 'day1'],
    ['the rail', '.rail a[data-d="end"]', '#end', 'hall'],
  ] as const)
    test(`a far jump from ${from}: the wheel and Page Down move nothing while the cover can be seen through`, async ({
      page,
    }) => {
      await start(page);
      await record(page);
      // clicked in the page, so that the pointer stays where the wheel is turned
      await page.locator(link).evaluate((el: HTMLElement) => el.click());
      await insist(page, target);
      const frames = await recorded(page);
      await heldThroughout(page, frames);
      expect(frames[0].y).toBe(0);
      expect(await visibleScenes(page)).toEqual([scene]);
      await expect(page.locator(`${target} [data-heading]`)).toBeFocused();
      // nothing about the layout changed for it
      expect(
        await page.evaluate(() => [
          getComputedStyle(document.body).overflowY,
          getComputedStyle(document.documentElement).overflowY,
        ]),
      ).toEqual(['visible', 'visible']);
      // and now the page is the reader's again: the wheel, and the key
      await scrollsAgain(page, -300);
      await page.waitForTimeout(1500);
      const y = await page.evaluate(() => window.scrollY);
      await page.keyboard.press('PageUp');
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeLessThan(y);
    });

  test('with reduced motion, where the page scrolls natively, a cut holds it too', async ({
    page,
  }) => {
    await start(page, true);
    await record(page);
    await page
      .locator('.dim-bar nav a[data-d="respawn"]')
      .evaluate((el: HTMLElement) => el.click());
    // the fade is 100ms: the input is sent in the page, in every frame that has any cover
    await page.evaluate(() => {
      const w = window as unknown as { __let?: number; __sent?: number };
      const tick = () => {
        const c = getComputedStyle(document.querySelector('.dim-cover')!);
        if (c.visibility === 'hidden') return;
        const at = document.elementFromPoint(720, 500)!;
        for (const e of [
          new WheelEvent('wheel', {
            deltaY: 240,
            bubbles: true,
            cancelable: true,
          }),
          new KeyboardEvent('keydown', {
            key: 'PageDown',
            bubbles: true,
            cancelable: true,
          }),
        ]) {
          at.dispatchEvent(e);
          w.__sent = (w.__sent ?? 0) + 1;
          // what is not prevented, the browser would act on
          if (!e.defaultPrevented) w.__let = (w.__let ?? 0) + 1;
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
    await landedOn(page, '#respawn');
    const frames = await recorded(page);
    expect(new Set(frames.map((f) => f.y)).size).toBe(2);
    const sent = await page.evaluate(() => {
      const w = window as unknown as { __let?: number; __sent?: number };
      return [w.__sent ?? 0, w.__let ?? 0];
    });
    expect(sent[0]).toBeGreaterThan(6);
    expect(sent[1]).toBe(0);
    await scrollsAgain(page, -300);
  });

  test('on a touch screen a finger moves nothing while the cover can be seen through', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'touch input is driven on the mobile project only');
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, '/');
    await ready(page);
    await expect(page.locator('.dim-bar')).toHaveCSS('opacity', '1');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', y?: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: y === undefined ? [] : [{ x: 195, y }],
      });
    // a finger does scroll this page, when nothing holds it
    await touch('touchStart', 700);
    for (let y = 680; y >= 400; y -= 20) await touch('touchMove', y);
    await touch('touchEnd');
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(100);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    // the hero's button → the respawn, and the finger drags up the screen until the cover is whole
    await record(page);
    await page.locator('.hero a.btn').evaluate((el: HTMLElement) => el.click());
    const whole = () =>
      page.evaluate(() => {
        const c = getComputedStyle(document.querySelector('.dim-cover')!);
        return c.visibility !== 'hidden' && +c.opacity === 1;
      });
    let moves = 0;
    await touch('touchStart', 700);
    for (let y = 680; !(await whole()); y = y > 300 ? y - 20 : 680) {
      await touch('touchMove', y);
      expect(++moves, 'the cover never came').toBeLessThan(400);
    }
    await touch('touchEnd');
    expect(moves).toBeGreaterThan(3);
    await landedOn(page, '#respawn');
    await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
    const frames = await recorded(page);
    frames.forEach((f, i) => {
      if (i > 0 && f.y !== frames[i - 1].y)
        expect(f.cover, `frame ${i}: ${frames[i - 1].y} → ${f.y}`).toBe(1);
    });
    expect(new Set(frames.map((f) => f.y)).size).toBe(2);
    // and afterwards the finger scrolls the page again
    const y0 = await page.evaluate(() => window.scrollY);
    await touch('touchStart', 300);
    for (let y = 320; y <= 600; y += 20) await touch('touchMove', y);
    await touch('touchEnd');
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeLessThan(y0 - 100);
  });
});

test.describe('home: a cover is never left stuck', () => {
  /** No cover, nothing inert, and the wheel moves the page. */
  const free = async (page: Page) => {
    const cover = page.locator('.dim-cover');
    await expect(cover).toHaveAttribute('data-on', 'false');
    await expect(cover).toHaveCSS('opacity', '0');
    await expect(cover).toHaveCSS('visibility', 'hidden');
    await expect(cover).toHaveCSS('pointer-events', 'none');
    // the cut holds the page no longer
    await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
    // nothing of the page is inert: only what is closed (the sheet, the language list)
    expect(
      await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('[inert]')].map(
          (el) => el.className,
        ),
      ),
    ).toEqual(['lang-list', 'dim-sheet']);
    const y = await page.evaluate(() => window.scrollY);
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, y > 2000 ? -300 : 300);
    await expect.poll(() => page.evaluate(() => window.scrollY)).not.toBe(y);
    // let the smooth scroll run out
    await page.waitForTimeout(1500);
  };
  const bar = (page: Page, d: string) =>
    page.locator(`.dim-bar nav a[data-d="${d}"]`);
  const start = async (page: Page, reducedMotion = false) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { reducedMotion });
    await ready(page);
    await expect(page.locator('.dim-bar')).toHaveCSS('opacity', '1');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    return errors;
  };

  for (const reducedMotion of [false, true])
    test(`a cut that fails under the cover lets the page go${reducedMotion ? ', with reduced motion too' : ''}`, async ({
      page,
    }) => {
      const errors = await start(page, reducedMotion);
      // the landing on the respawn fails, once: its heading cannot take the focus
      await page.evaluate(() => {
        const h = document.querySelector<HTMLElement>(
          '#respawn [data-heading]',
        )!;
        h.focus = () => {
          delete (h as { focus?: unknown }).focus;
          (window as unknown as { __failed: boolean }).__failed = true;
          throw new Error('the landing failed');
        };
      });
      await record(page);
      await bar(page, 'respawn').click();
      await expect
        .poll(() =>
          page.evaluate(
            () => (window as unknown as { __failed?: boolean }).__failed,
          ),
        )
        .toBe(true);
      // it failed under a whole cover, and the cover lifts all the same
      await free(page);
      const frames = await recorded(page);
      expect(Math.max(...frames.map((f) => f.cover))).toBe(1);
      // not swallowed: the failure is reported, once
      expect(errors).toEqual(['the landing failed']);
      // and the next jumps are ordinary ones: a far one cuts and lands
      await record(page);
      await bar(page, 'overworld').click();
      await landedOn(page, '#overworld');
      expect(await coverAtLanding(page)).toBe(1);
      await expect(page.locator('#overworld [data-heading]')).toBeFocused();
      if (!reducedMotion) {
        // a near one travels, with no cover: nothing still believes that a cover is up
        await record(page);
        await bar(page, 'nether').click();
        await landedOn(page, '#nether');
        expect(Math.max(...(await recorded(page)).map((f) => f.cover))).toBe(0);
      }
      await free(page);
      expect(errors).toEqual(['the landing failed']);
    });

  test('a history that refuses another entry does not stop a jump', async ({
    page,
  }) => {
    const errors = await start(page);
    // as a browser does when the address is replaced too often
    await page.evaluate(() => {
      window.history.replaceState = () => {
        (window as unknown as { __refused: boolean }).__refused = true;
        throw new DOMException('too many calls', 'SecurityError');
      };
    });
    await bar(page, 'respawn').click();
    await landedOn(page, '#respawn');
    expect(
      await page.evaluate(
        () => (window as unknown as { __refused?: boolean }).__refused,
      ),
    ).toBe(true);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await expect(page.locator('#respawn h2')).toBeFocused();
    // a travel ends the same way
    await bar(page, 'end').click();
    await landedOn(page, '#end');
    await expect(page.locator('#end [data-heading]')).toBeFocused();
    await free(page);
    expect(errors).toEqual([]);
  });

  test('a target that goes away during the cut: the page stays where it is, and is let go', async ({
    page,
  }) => {
    const errors = await start(page);
    await record(page);
    // while the cover is coming in, the respawn is taken out of the page
    await page.evaluate(() => {
      const tick = () => {
        const c = getComputedStyle(document.querySelector('.dim-cover')!);
        if (c.visibility === 'hidden' || +c.opacity < 0.3)
          return requestAnimationFrame(tick);
        document.querySelector('#respawn')!.remove();
      };
      requestAnimationFrame(tick);
    });
    await bar(page, 'respawn').click();
    await expect(page.locator('#respawn')).toHaveCount(0);
    const cover = page.locator('.dim-cover');
    await expect(cover).toHaveCSS('visibility', 'hidden');
    const frames = await recorded(page);
    // the cover did come, and the page never moved under it
    expect(Math.max(...frames.map((f) => f.cover))).toBe(1);
    expect([...new Set(frames.map((f) => f.y))]).toEqual([0]);
    // nothing claims that the reader is on a section that is not there
    expect(new URL(page.url()).hash).toBe('');
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'overworld');
    expect(await visibleScenes(page)).toEqual(['spawn']);
    await free(page);
    // the next jump is an ordinary travel
    await record(page);
    await bar(page, 'overworld').click();
    await landedOn(page, '#overworld');
    expect(Math.max(...(await recorded(page)).map((f) => f.cover))).toBe(0);
    expect(errors).toEqual([]);
  });

  test('leaving the page under a whole cover takes the cover away', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    // to the home page without a reload, so that going back unmounts it without one
    await page.locator('.head .crumb a').nth(1).click();
    await ready(page);
    await landedOn(page, '#end');
    await expect(page.locator('.dim-bar')).toHaveCSS('opacity', '1');
    // the End → the overworld; under the whole cover, back to the roster
    await page.evaluate(() => {
      const y0 = window.scrollY;
      const tick = () => {
        const c = getComputedStyle(document.querySelector('.dim-cover')!);
        if (
          !(c.visibility !== 'hidden' && +c.opacity === 1) ||
          Math.abs(window.scrollY - y0) < 2
        )
          return requestAnimationFrame(tick);
        (window as unknown as { __left: boolean }).__left = true;
        window.history.back();
      };
      requestAnimationFrame(tick);
    });
    await bar(page, 'overworld').click();
    await page.locator('.person').first().waitFor();
    expect(
      await page.evaluate(
        () => (window as unknown as { __left?: boolean }).__left,
      ),
    ).toBe(true);
    const cover = page.locator('.dim-cover');
    await expect(cover).toHaveCount(1);
    await expect(cover).toHaveAttribute('data-on', 'false');
    await expect(cover).toHaveCSS('visibility', 'hidden');
    await expect(cover).toHaveCSS('opacity', '0');
    // and it stays away: the cut that was under way does nothing more
    await page.waitForTimeout(1200);
    await expect(cover).toHaveCSS('visibility', 'hidden');
    await expect(cover).toHaveAttribute('data-on', 'false');
    // the roster can be used
    await page.locator('.dim-bar [data-action="theme"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(errors).toEqual([]);
  });

  for (const hash of ['#%', '#%E0%A4%A'])
    test(`arriving with the malformed hash ${hash} is arriving at the top`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setViewportSize({ width: 1440, height: 900 });
      await openPage(page, `/${hash}`);
      await ready(page);
      await expect(page.locator('.loader')).toBeHidden();
      expect(new URL(page.url()).hash).toBe(hash);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await expect.poll(() => visibleScenes(page)).toEqual(['spawn']);
      await expect(page.locator('.hero h1')).toBeVisible();
      await expect(page.locator('.hero h1')).toHaveText(/雲鎮工藝/);
      await expect(page.locator('.dim-bar')).toHaveCSS('opacity', '1');
      // the choreography was built: the smooth scroll is there, and so is the pin
      expect(
        await page.evaluate(() =>
          document.documentElement.classList.contains('lenis'),
        ),
      ).toBe(true);
      await expect(page.locator('.pin-spacer')).toHaveCount(1);
      // the hero's button works
      await page.locator('.hero a.btn').click();
      await landedOn(page, '#respawn');
      await expect(page.locator('#respawn h2')).toBeFocused();
      await free(page);
      expect(errors).toEqual([]);
    });
});

test.describe('home: arriving, leaving and robustness', () => {
  for (const [hash, scene, dim] of [
    ['#nether', 'nether', 'nether'],
    ['#end', 'hall', 'end'],
    ['#respawn', 'day1', 'respawn'],
  ] as const)
    test(`arriving with ${hash}: when the loader lifts the page is already there`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await watchLanding(page, hash);
      await openPage(page, `/${hash}`);
      await ready(page);
      await expect(page.locator('.loader')).toBeHidden();
      await landedOn(page, hash);
      const seen = await landingFrames(page);
      const lifting = seen.filter((f) => f.loader < 0.99);
      expect(lifting.length).toBeGreaterThan(5);
      expect(seen.length - lifting.length).toBeGreaterThan(5);
      for (const f of lifting) {
        expect(Math.abs(f.top)).toBeLessThanOrEqual(1);
        expect(f.scenes).toBe(scene);
      }
      await expect(page.locator('html')).toHaveAttribute('data-dim', dim);
      expect(await visibleScenes(page)).toEqual([scene]);
      // the pin was measured before the landing
      await expect(page.locator('.pin-spacer')).toHaveCount(1);
      if (hash === '#nether')
        expect(await topOf(page, '.ledger-stage')).toBeGreaterThan(900);
      expect(new URL(page.url()).hash).toBe(hash);
    });

  test('arriving with #respawn stays on the respawn when the names arrive late and the credits grow', async ({
    page,
  }) => {
    let release = () => {};
    const held = new Promise<void>((done) => {
      release = done;
    });
    await page.route(/member\.json/, async (r) => {
      await held;
      await r.fulfill({
        json: {
          member: Array.from({ length: 160 }, (_, i) => ({
            uuid: `m${i}`,
            name: `member_${i}`,
          })),
          trial: Array.from({ length: 40 }, (_, i) => ({
            uuid: `t${i}`,
            name: `trial_${i}`,
          })),
        },
        headers: { 'access-control-allow-origin': '*' },
      });
    });
    await openPage(page, '/#respawn');
    await ready(page);
    await landedOn(page, '#respawn');
    const before = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    release();
    await expect(
      page.locator('#credits [data-names="member"] span'),
    ).toHaveCount(160);
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeGreaterThan(before);
    await landedOn(page, '#respawn');
    expect(await visibleScenes(page)).toEqual(['day1']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'respawn');
  });

  test('arriving with a hash under reduced motion lands there too', async ({
    page,
  }) => {
    await openPage(page, '/#end', { reducedMotion: true });
    await ready(page);
    await landedOn(page, '#end');
    await expect.poll(() => visibleScenes(page)).toEqual(['hall']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
  });

  test('resizing mid-scroll keeps the scene in step with the section', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '[data-work="end-0"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['moon']);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(1200);
    await scrollToSection(page, '[data-work="end-0"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['moon']);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1200);
    await scrollToSection(page, '#credits', 0.3);
    expect(await visibleScenes(page)).toEqual(['end']);
    await scrollToSection(page, '#respawn', 0);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(1200);
    await scrollToSection(page, '#respawn', 0);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await expect(page.locator('.pin-spacer')).toHaveCount(1);
  });

  test('leaving for a legacy page cleans up, and coming back rebuilds', async ({
    page,
  }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#nether');
    expect(
      await page.evaluate(() =>
        document.documentElement.classList.contains('lenis'),
      ),
    ).toBe(true);
    await page.goto('/join/');
    await expect(page.locator('[data-shell="legacy"]')).toBeVisible();
    expect(
      await page.evaluate(() =>
        document.documentElement.hasAttribute('data-dim'),
      ),
    ).toBe(false);
    expect(
      await page.evaluate(() =>
        document.documentElement.classList.contains('lenis'),
      ),
    ).toBe(false);
    await expect(page.locator('.dim-cover')).toHaveCount(0);
    await page.goBack();
    await ready(page);
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
    await scrollToSection(page, '#overworld');
    expect(await visibleScenes(page)).toEqual(['town']);

    // The same by a link of the shell, the footer's: the leave half under the cover, then the legacy page, and
    // nothing of the step on it.
    await expect(page.locator('.loader')).toHaveCount(0);
    const link = page.locator('.dim-foot .pages a[href="/join/"]');
    await link.evaluate((a) => {
      window.scrollTo({
        top:
          a.getBoundingClientRect().bottom +
          window.scrollY -
          window.innerHeight +
          8,
        behavior: 'instant',
      });
      (window as unknown as { __same: boolean }).__same = true;
    });
    await atRest(page);
    await expect(link).toBeInViewport();
    const y = await page.evaluate(() => window.scrollY);
    await record(page);
    await link.click();
    await expect(page.locator('[data-shell="legacy"]')).toBeVisible();
    // the cover came in whole over the page, which stayed where it was, before the page changed
    const frames = await recorded(page);
    expect(Math.max(...frames.map((f) => f.cover))).toBe(1);
    for (const f of frames.filter((f) => f.scenes.length > 0))
      expect(f.y).toBe(y);
    // in the same document, and nothing of the shell or of the step is left on the legacy page
    expect(
      await page.evaluate(() =>
        Boolean((window as unknown as { __same?: boolean }).__same),
      ),
    ).toBe(true);
    await expect(page.locator('.dim-cover')).toHaveCount(0);
    expect(
      await page.evaluate(() => ({
        nav: document.documentElement.getAttribute('data-nav'),
        dim: document.documentElement.getAttribute('data-dim'),
        lenis: [...document.documentElement.classList].filter((c) =>
          c.startsWith('lenis'),
        ),
      })),
    ).toEqual({ nav: null, dim: null, lenis: [] });
    // the legacy page is not held: the wheel moves it
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 300);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
    // and back: the home page again, with its loader, no cover, nothing held
    await page.goBack();
    await ready(page);
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
    await expect(page.locator('html')).not.toHaveAttribute('data-nav', /.*/);
    await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
    await expect(page.locator('.dim main')).toHaveCSS('opacity', '1');
    await scrollToSection(page, '#overworld');
    expect(await visibleScenes(page)).toEqual(['town']);
  });

  test('leaving for an inner page without a reload takes the smooth scroll and the pin away, and coming back rebuilds them', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    const state = () =>
      page.evaluate(() => ({
        lenis: [...document.documentElement.classList].filter((c) =>
          c.startsWith('lenis'),
        ),
        spacers: document.querySelectorAll('.pin-spacer').length,
        covers: document.querySelectorAll('.dim-cover').length,
      }));
    expect(await state()).toEqual({ lenis: [], spacers: 0, covers: 1 });
    await page.evaluate(() => {
      (window as unknown as { __same: boolean }).__same = true;
    });
    // in-app links: the document is never reloaded
    const sameDocument = () =>
      page.evaluate(() =>
        Boolean((window as unknown as { __same?: boolean }).__same),
      );
    await page.locator('.head .crumb a').nth(1).click();
    await ready(page);
    await landedOn(page, '#end');
    expect(await sameDocument()).toBe(true);
    expect(await visibleScenes(page)).toEqual(['hall']);
    const home = await state();
    expect(home.lenis).toContain('lenis');
    expect(home.spacers).toBe(1);
    await page.goBack();
    await page.locator('.person').first().waitFor();
    expect(await sameDocument()).toBe(true);
    await expect.poll(state).toEqual({ lenis: [], spacers: 0, covers: 1 });
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
    // the inner page scrolls natively again
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 400);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
    await page.goForward();
    await ready(page);
    await scrollToSection(page, '#overworld');
    expect(await visibleScenes(page)).toEqual(['town']);
    expect((await state()).spacers).toBe(1);
  });

  test('coming back to an inner page from deep in the home page: it is at its top at once, and the wheel is the reader’s straight away', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await page.locator('.head .crumb a').nth(1).click();
    await ready(page);
    await landedOn(page, '#end');
    // far further down than the inner page is long
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(5000);
    // every frame drawn after the step back: where the page is
    await page.evaluate(() => {
      const w = window as unknown as { __back?: number[] };
      window.addEventListener(
        'popstate',
        () => {
          const drawn: number[] = [];
          w.__back = drawn;
          const tick = () => {
            drawn.push(Math.round(window.scrollY));
            if (drawn.length < 30) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        },
        { once: true },
      );
    });
    await page.goBack();
    const drawn = await (
      await page.waitForFunction(() => {
        const frames = (window as unknown as { __back?: number[] }).__back;
        return frames && frames.length >= 30 ? frames : null;
      })
    ).jsonValue();
    // never where the home page was, and never on its way up from there
    expect(drawn).toEqual(Array(30).fill(0));
    await expect(page.locator('.person').first()).toBeVisible();

    // and again, with the wheel turned the moment the page is there: nothing is still moving it
    await page.goForward();
    await ready(page);
    await landedOn(page, '#end');
    await page.mouse.move(720, 450);
    await page.goBack();
    await page.mouse.wheel(0, 400);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
    expect(
      await page.evaluate(() => [
        ...document.documentElement.classList,
        document.querySelectorAll('.pin-spacer').length,
      ]),
    ).toEqual([0]);
  });

  test('with reduced motion nothing is scrubbed, every section is readable and scenes still change', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { reducedMotion: true });
    await ready(page);
    expect(
      await page.evaluate(() =>
        document.documentElement.classList.contains('lenis'),
      ),
    ).toBe(false);
    for (const [sel, scene] of [
      ['#overworld', 'town'],
      ['[data-work="overworld-1"]', 'w2'],
      ['#nether', 'nether'],
      ['[data-work="end-0"]', 'moon'],
      ['#respawn', 'day1'],
    ] as const) {
      await jumpTo(page, sel, 0.1);
      await expect
        .poll(() => visibleScenes(page), { message: sel })
        .toEqual([scene]);
    }
    // the respawn: nothing waits for an animation, the white-out never shows, the mascot stands still
    for (const sel of ['#respawn h2', '#respawn .depts', '#respawn .pal'])
      await expect(page.locator(sel)).toHaveCSS('opacity', '1');
    expect(await flashState(page)).toBe(0);
    const pal = page.locator('#respawn .pal');
    const at = () =>
      pal.evaluate((el) => {
        // the floating is on these two properties; the transform belongs to the rise
        const c = getComputedStyle(el);
        return `${c.translate} ${c.rotate}`;
      });
    const still = await at();
    await page.waitForTimeout(600);
    expect(await at()).toBe(still);
    await jumpTo(page, '#respawn', -0.5);
    await page.waitForTimeout(300);
    expect(await flashState(page)).toBe(0);
    await jumpTo(page, '#overworld', 0.1);
    await expect.poll(() => visibleScenes(page)).toEqual(['town']);
    const lines = page.locator('#overworld .say span');
    expect(await lines.count()).toBe(3);
    for (const span of await lines.all())
      await expect(span).toHaveCSS('opacity', '1');
    // the facilities are a list in the flow of the page: no stage, nothing pinned
    await expect(page.locator('#ledger .ledger-plain > li')).toHaveCount(6);
    await expect(page.locator('.ledger-plain')).toHaveCSS('position', 'static');
    await expect(page.locator('.ledger-stage')).toHaveCount(0);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    // the rail still says where the reader is
    await jumpTo(page, '#nether', 0.1);
    await expect(page.locator('.rail a.on')).toHaveAttribute(
      'data-d',
      'nether',
    );
  });
});

test.describe('home: stepping back lands where the reader was', () => {
  /** Where the reader is: the page, the section at the head of the screen and how far into it, the scenes, the facility. */
  const where = (page: Page) =>
    page.evaluate(() => {
      const sections = [...document.querySelectorAll('.dim--home main > *')];
      let i = 0;
      sections.forEach((s, k) => {
        if (s.getBoundingClientRect().top <= 1) i = k;
      });
      const shown = (el: Element) => {
        const c = getComputedStyle(el);
        return c.visibility !== 'hidden' && +c.opacity > 0.5;
      };
      return {
        y: Math.round(window.scrollY),
        section: sections[i]?.id || sections[i]?.className || '',
        into: Math.round(-sections[i]?.getBoundingClientRect().top),
        scenes: [...document.querySelectorAll<HTMLElement>('.scene')]
          .filter(shown)
          .map((s) => s.dataset.scene),
        facility: document.querySelector('.ledger-now h3')?.textContent ?? '',
        pictures: [...document.querySelectorAll<HTMLElement>('[data-ledger]')]
          .filter((i) => +getComputedStyle(i).opacity > 0.5)
          .map((i) => i.dataset.ledger),
        dim: document.documentElement.dataset.dim,
      };
    });
  /** The page has come to rest and nothing is over it. */
  const still = async (page: Page) => {
    await atRest(page);
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
  };
  /** Back on the home page: its loader has gone, and the page is at rest. */
  const backHome = async (page: Page) => {
    await page.goBack();
    await ready(page);
    await expect(page.locator('.loader')).toHaveCount(0);
    await still(page);
  };

  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ] as const) {
    test(`at ${width}×${height}, leaving from the credits through the link to the roster and stepping back: the credits again, at the same line`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/');
      await ready(page);
      // the names are in: they are a good part of the height of the credits
      await expect(page.locator('#credits .names span').first()).toBeAttached();
      const more = page.locator('#credits a.more');
      // the link in the middle of the screen, as a reader who is about to follow it has it
      await more.evaluate((el) => {
        const r = el.getBoundingClientRect();
        window.scrollTo({
          top: r.top + window.scrollY - window.innerHeight / 2,
          behavior: 'instant',
        });
      });
      await still(page);
      const before = await where(page);
      expect(before.section).toBe('credits');
      expect(before.scenes).toEqual(['end']);
      const linkAt = (await more.boundingBox())!.y;

      await more.click();
      await page.locator('.person').first().waitFor();
      await expect(page.locator('.dim-cover')).toHaveCSS(
        'visibility',
        'hidden',
      );
      await backHome(page);
      const after = await where(page);
      expect(after.section).toBe('credits');
      expect(after.scenes).toEqual(['end']);
      expect(after.dim).toBe('end');
      expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(4);
      expect(
        Math.abs((await more.boundingBox())!.y - linkAt),
      ).toBeLessThanOrEqual(4);
      // the page is the reader's: the wheel moves it on from there
      await page.mouse.move(width / 2, height / 2);
      await page.mouse.wheel(0, 300);
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeGreaterThan(after.y);
    });

    test(`at ${width}×${height}, leaving from inside the pinned ledger and stepping back: the same facility, its name and its picture`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/');
      await ready(page);
      // the fourth of six facilities
      await page.evaluate(() => {
        const top =
          document.querySelector('#ledger')!.getBoundingClientRect().top +
          window.scrollY;
        window.scrollTo({
          top: top + (3.5 / 6) * 3 * window.innerHeight,
          behavior: 'instant',
        });
      });
      await expect
        .poll(async () => (await where(page)).pictures)
        .toEqual(['3']);
      await still(page);
      const before = await where(page);
      expect(before.section).toBe('ledger');
      expect(before.facility).toBe('雙維度百萬豬布林交易');
      expect(before.scenes).toEqual(['nether']);

      // a link of the page itself: the way to the roster, from the bar or from the sheet
      if (width > 1100)
        await page.locator('.dim-bar nav a[href="/member/"]').click();
      else {
        await page.locator('.dim-bar [data-action="menu"]').click();
        await page.locator('.dim-sheet a[href="/member/"]').click();
      }
      await page.locator('.person').first().waitFor();
      await expect(page.locator('.dim-cover')).toHaveCSS(
        'visibility',
        'hidden',
      );
      await backHome(page);
      await expect
        .poll(async () => (await where(page)).pictures)
        .toEqual(['3']);
      const after = await where(page);
      expect(after.section).toBe('ledger');
      expect(after.facility).toBe('雙維度百萬豬布林交易');
      expect(after.scenes).toEqual(['nether']);
      expect(after.dim).toBe('nether');
      expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(4);
      await expect(page.locator('.pin-spacer')).toHaveCount(1);
    });
  }

  test('the place is there when the loader lifts: its scene and its picture from the first frame, and the page does not move after', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '[data-work="end-1"]', 0.5);
    await still(page);
    const before = await where(page);
    expect(before.scenes).toEqual(['farm']);
    await page.locator('.dim-bar nav a[href="/survivalProgress/"]').click();
    await page.locator('.entry').first().waitFor();
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
    // from the moment the home page is back: every frame in which its loader is no longer whole
    await page.evaluate(() => {
      const w = window as unknown as {
        __lift: { y: number; scenes: string; decoded: boolean }[];
      };
      w.__lift = [];
      const tick = () => {
        const loader = document.querySelector('.dim--home .loader');
        const home = document.querySelector('.dim--home');
        const c = loader && getComputedStyle(loader);
        const o = !c || c.visibility === 'hidden' ? 0 : +c.opacity;
        const inner = loader?.querySelector('.loader-in');
        if (
          home &&
          (o < 1 || (inner && +getComputedStyle(inner).opacity < 1))
        ) {
          const scenes = [
            ...document.querySelectorAll<HTMLElement>('.scene'),
          ].filter((s) => {
            const sc = getComputedStyle(s);
            return sc.visibility !== 'hidden' && +sc.opacity > 0.5;
          });
          w.__lift.push({
            y: Math.round(window.scrollY),
            scenes: scenes.map((s) => s.dataset.scene).join('+'),
            decoded: scenes.every((s) =>
              [...s.querySelectorAll('img')].every(
                (i) => i.complete && i.naturalWidth > 0,
              ),
            ),
          });
        }
        if (w.__lift.length < 90) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await backHome(page);
    const lift = await (
      await page.waitForFunction(() => {
        const f = (
          window as unknown as {
            __lift: { y: number; scenes: string; decoded: boolean }[];
          }
        ).__lift;
        return f.length >= 90 ? f : null;
      })
    ).jsonValue();
    for (const f of lift!) {
      expect(Math.abs(f.y - before.y)).toBeLessThanOrEqual(4);
      expect(f.scenes).toBe('farm');
      expect(f.decoded).toBe(true);
    }
  });

  test('a fresh visit starts at the top, whatever was remembered: by its address, and through the link home', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await expect(page.locator('#credits .names span').first()).toBeAttached();
    await scrollToSection(page, '#credits', 0.3);
    await still(page);
    const before = await where(page);
    expect(before.section).toBe('credits');
    expect(before.y).toBeGreaterThan(0);
    await page.locator('.dim-bar nav a[href="/member/"]').click();
    await page.locator('.person').first().waitFor();
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
    // the link home: a new visit to the page, not a step back to the old one
    await page.locator('.head .crumb a').first().click();
    await ready(page);
    await expect(page.locator('.loader')).toHaveCount(0);
    await still(page);
    let now = await where(page);
    expect(now.y).toBe(0);
    expect(now.scenes).toEqual(['spawn']);
    // and by its address, in a new document
    await page.goto('/');
    await ready(page);
    await still(page);
    now = await where(page);
    expect(now.y).toBe(0);
    expect(now.scenes).toEqual(['spawn']);
    // (the same address again takes the place of the visit before it in the history: one step back is the roster)
    await page.goBack();
    await page.locator('.person').first().waitFor();
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
    // and one more is the first visit, in a document that never saw it: where the reader was then, not the top
    await backHome(page);
    expect(new URL(page.url()).pathname).toBe('/');
    await expect(page.locator('#credits .names span').first()).toBeAttached();
    await still(page);
    const after = await where(page);
    expect(after.section).toBe('credits');
    expect(after.scenes).toEqual(['end']);
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(4);
  });

  /** The link to the roster in the credits, in the middle of the screen: the reader is about to follow it. */
  const toTheRosterLink = async (page: Page) => {
    // the names are in: they are a good part of the height of the credits
    await expect(page.locator('#credits .names span').first()).toBeAttached();
    await page.locator('#credits a.more').evaluate((el) => {
      const r = el.getBoundingClientRect();
      window.scrollTo({
        top: r.top + window.scrollY - window.innerHeight / 2,
        behavior: 'instant',
      });
    });
    await still(page);
  };
  const toTheRoster = async (page: Page, link: string) => {
    await page.locator(link).click();
    await page.locator('.person').first().waitFor();
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
  };

  test('after a jump from the bar the address names the End: read on to the credits, leave and step back, and it is the credits again', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await page.locator('.dim-bar nav a[data-d="end"]').click();
    await landedOn(page, '#end');
    const opening = (await where(page)).y;
    await toTheRosterLink(page);
    const before = await where(page);
    expect(before.section).toBe('credits');
    expect(before.scenes).toEqual(['end']);
    // several screens below the End's opening, which the address of this visit still names
    expect(before.y - opening).toBeGreaterThan(2 * 900);
    expect(new URL(page.url()).hash).toBe('#end');

    await toTheRoster(page, '#credits a.more');
    await backHome(page);
    expect(new URL(page.url()).hash).toBe('#end');
    const after = await where(page);
    expect(after.section).toBe('credits');
    expect(after.scenes).toEqual(['end']);
    expect(after.dim).toBe('end');
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(4);
    // the page is the reader's: the wheel moves it on from there
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 300);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(after.y);
  });

  test('a step forward to the visit is a return to it as well: the remembered place, not the section its address names', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    // the link home: a new visit, which starts at the top
    await page.locator('.head .crumb a').first().click();
    await ready(page);
    await expect(page.locator('.loader')).toHaveCount(0);
    await still(page);
    expect((await where(page)).y).toBe(0);
    await page.locator('.dim-bar nav a[data-d="end"]').click();
    await landedOn(page, '#end');
    await toTheRosterLink(page);
    const before = await where(page);
    expect(before.section).toBe('credits');

    await page.goBack();
    await page.locator('.person').first().waitFor();
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
    await page.goForward();
    await ready(page);
    await expect(page.locator('.loader')).toHaveCount(0);
    await still(page);
    expect(new URL(page.url()).hash).toBe('#end');
    const after = await where(page);
    expect(after.section).toBe('credits');
    expect(after.scenes).toEqual(['end']);
    expect(after.dim).toBe('end');
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(4);
  });

  test('a jump to the Nether and no scrolling after it: leaving and stepping back is the Nether’s opening', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await page.locator('.dim-bar nav a[data-d="nether"]').click();
    await landedOn(page, '#nether');
    await still(page);
    expect(new URL(page.url()).hash).toBe('#nether');
    const before = await where(page);
    expect(before.y).toBeGreaterThan(0);

    await toTheRoster(page, '.dim-bar nav a[href="/member/"]');
    await backHome(page);
    // what was remembered and what the address names are the same place
    await landedOn(page, '#nether');
    const after = await where(page);
    expect(after.scenes).toEqual(['nether']);
    expect(after.dim).toBe('nether');
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
  });

  test('on a return the remembered place wins over the hash; an address that names a section decides only where nothing is remembered', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // arrived at by its address, then read on down to the credits
    await openPage(page, '/#nether');
    await ready(page);
    await landedOn(page, '#nether');
    await toTheRosterLink(page);
    const before = await where(page);
    expect(before.section).toBe('credits');
    await toTheRoster(page, '.dim-bar nav a[href="/member/"]');
    // the address of that visit still names the nether: the reader was at the credits
    await backHome(page);
    expect(new URL(page.url()).hash).toBe('#nether');
    const after = await where(page);
    expect(after.section).toBe('credits');
    expect(after.scenes).toEqual(['end']);
    expect(after.dim).toBe('end');
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(4);
    // a link to a section, from another page: a new visit, and it lands where the address says
    await page.goForward();
    await page.locator('.person').first().waitFor();
    await page.goto('/#end');
    await ready(page);
    await landedOn(page, '#end');
    // the End's opening stands over the hall
    expect(await visibleScenes(page)).toEqual(['hall']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
  });

  test('reduced motion: the same place after a step back', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { reducedMotion: true });
    await ready(page);
    await jumpTo(page, '#ledger .ledger-plain > li:nth-child(5)', -0.2);
    await still(page);
    const before = await where(page);
    expect(before.section).toBe('ledger');
    expect(before.scenes).toEqual(['nether']);
    await page.locator('.dim-bar nav a[href="/member/"]').click();
    await page.locator('.person').first().waitFor();
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
    await backHome(page);
    const after = await where(page);
    expect(after.section).toBe('ledger');
    expect(after.scenes).toEqual(['nether']);
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(4);
  });
});
