// tests/dimensions-home-frames.spec.ts
// Frame times of a wheel scroll through the whole home page at 1440×900, zone by zone.
// In a file of its own: the browser is started with the graphics card where there is one (a launch option, which
// belongs to the worker), because a film of full-screen cross-fades is drawn by the compositor, and the software
// renderer of a default headless browser measures the machine's processor instead of the page.
import { expect, test } from '@playwright/test';
import { openPage } from './helpers/dimensions';
import { arrived } from './helpers/home';

/** FRAMES_SOFTWARE=1 measures the default (software) headless browser instead. */
const SOFTWARE = Boolean(process.env.FRAMES_SOFTWARE);

test.use({
  launchOptions: {
    args:
      !SOFTWARE && process.platform === 'win32'
        ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
        : [],
  },
});

/** A frame is slow when it took more than two refreshes of a 60Hz screen. */
const SLOW_MS = 33.4;

/**
 * The share of slow frames allowed in any one zone and over the whole page (and never fewer than three frames:
 * the hero is passed in half a second, where one frame is 3%).
 * With the graphics card, measured on the machine this was written on (Intel UHD, Direct3D 11; two runs):
 * 0–1.9% in every zone, one or two frames of thirty in the hero, 0.2–0.6% over the whole page. 5% leaves room for a busy
 * machine and still fails on a real regression (a layout or a paint per frame shows up as tens of percent).
 * In software (SwiftShader; two runs): hero 16–26%, overworld 8–11%, nether 1–8%, the End 5–9%, the credits
 * (three layers of stars) 30–36%, the respawn 13–15%, 10–11% over the whole page. The limit there is the worst
 * zone with a margin, only so that the test still says something where there is no graphics card: it measures
 * the processor, not how the page feels.
 */
const LIMIT = { gpu: 0.05, software: 0.45 };

const ZONES = ['hero', 'overworld', 'nether', 'end', 'credits', 'respawn'];

test('a wheel scroll through the whole home page stays smooth, zone by zone', async ({
  page,
}, info) => {
  test.skip(
    Boolean(process.env.CI),
    'frame timing is only meaningful on a real machine',
  );
  test.skip(info.project.name !== 'desktop', 'measured at 1440×900 only');
  test.slow();
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPage(page, '/');
  await arrived(page);

  // what actually draws the page: a software renderer names itself
  const renderer = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    return String(
      (gl && ext && gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) ?? 'none',
    );
  });
  const software = /swiftshader|llvmpipe|software|none/i.test(renderer);

  const height = await page.evaluate(() => {
    const w = window as unknown as {
      __frames: { d: number; zone: number }[];
    };
    // where each zone begins, on the page as it is laid out (the pin's length included)
    const starts = [
      '#overworld',
      '#nether',
      '#end',
      '#credits',
      '#respawn',
    ].map(
      (s) =>
        document.querySelector(s)!.getBoundingClientRect().top + window.scrollY,
    );
    w.__frames = [];
    let last = performance.now();
    const frame = (t: number) => {
      const mid = window.scrollY + window.innerHeight / 2;
      w.__frames.push({
        d: t - last,
        zone: starts.filter((y) => mid >= y).length,
      });
      last = t;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    return document.documentElement.scrollHeight - window.innerHeight;
  });

  await page.mouse.move(700, 450);
  for (let i = 0; i < Math.ceil(height / 120) + 10; i++) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(40);
  }
  // the smooth scroll comes to rest at the foot of the page
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollHeight -
          window.innerHeight -
          window.scrollY,
      ),
    )
    .toBeLessThan(4);

  const frames = (
    await page.evaluate(
      () =>
        (window as unknown as { __frames: { d: number; zone: number }[] })
          .__frames,
    )
  ).slice(2);
  const rows = [
    ...ZONES.map((name, i) => ({ name, i })),
    { name: 'all', i: -1 },
  ].map(({ name, i }) => {
    const own = frames
      .filter((f) => i < 0 || f.zone === i)
      .map((f) => f.d)
      .sort((a, b) => a - b);
    const slow = own.filter((d) => d > SLOW_MS).length;
    return {
      name,
      frames: own.length,
      slow,
      share: own.length ? slow / own.length : 0,
      p95: own[Math.floor(own.length * 0.95)] ?? 0,
      max: own[own.length - 1] ?? 0,
    };
  });
  const table = [
    `renderer: ${renderer}`,
    ...rows.map(
      (r) =>
        `${r.name.padEnd(9)} ${String(r.frames).padStart(5)} frames  ${String(r.slow).padStart(4)} over 33ms (${(r.share * 100).toFixed(1)}%)  p95 ${r.p95.toFixed(1)}ms  max ${r.max.toFixed(0)}ms`,
    ),
  ].join('\n');
  console.log(table);
  await info.attach('frame-times.txt', {
    body: table,
    contentType: 'text/plain',
  });

  const limit = software ? LIMIT.software : LIMIT.gpu;
  for (const r of rows) {
    expect(r.frames, `${r.name}: the scroll passed through it`).toBeGreaterThan(
      20,
    );
    expect(
      r.share,
      `${r.name}: ${r.slow} of ${r.frames} frames over 33ms (${software ? 'software' : 'graphics card'}: ${renderer})`,
    ).toBeLessThanOrEqual(Math.max(limit, 3 / r.frames));
  }
});
