import gsap from 'gsap';

/**
 * The wake into the respawn: a jump at light speed (docs/design-demos/dimensions-v3-video.html; chosen 2026-10-20,
 * spec 5.3). Drawn in code on one screen-sized canvas (LightSpeedCanvas.tsx); no game asset is used.
 *
 * The End's stars as points in depth, flying at the camera. The scroll plays five numbers (`addLightSpeed`, below):
 * how much of the canvas is seen (`alpha`), how much of its own black stands behind the stars (`bg`), their `speed`,
 * and for the credits' last line whether the canvas has taken it over (`glyphs`) and how far it has flown (`flight`).
 * The stars move by the clock, so they keep flowing while the scroll rests; the speed draws them out from points into
 * streaks. The line's points are placed by the scroll, not the clock, so scrolling back puts the line together again.
 *
 * The canvas draws only while something of it is to be seen: setting `alpha` or `glyphs` above nothing starts it on
 * GSAP's ticker (after the scroll has moved the page in that tick), and it takes itself off when both are back at
 * nothing. A hidden canvas costs nothing.
 */

/** The colours of the End's specks (Starfield.tsx). */
const COLOURS = [
  '159,232,216',
  '201,167,255',
  '111,183,255',
  '235,240,245',
  '88,214,176',
];

/** How many stars fly: fewer where the screen is small (a phone), where the same count would be denser and costlier. */
const starCount = (w: number, h: number) => (Math.min(w, h) < 600 ? 400 : 700);

/** The line's points are sampled every this many CSS pixels: on a coarser grid the thin strokes fall between them. */
const STEP = 2;

interface Star {
  x: number;
  y: number;
  z: number;
  c: string;
}
interface Glyphs {
  el: HTMLElement;
  /** offsets from the line's box: where they stand is read from the line on every frame */
  pts: { rx: number; ry: number; z: number; keep: number }[];
  /** the line drawn whole, at the canvas's resolution, in its own colour */
  img: HTMLCanvasElement;
  pad: number;
  color: string;
  dot: number;
  /** the middle of the line's ink, from its box */
  ink: { x: number; y: number };
  /** canvas pixels to a CSS pixel */
  k: number;
}

/**
 * The line as the page draws it, off screen, in its own type, size, letter spacing and colour, from where its text
 * begins and on its own baseline; and the same line as points, sampled every two CSS pixels, edges included.
 */
const sample = (el: HTMLElement, k: number): Glyphs => {
  const r = el.getBoundingClientRect(),
    cs = getComputedStyle(el),
    pad = r.height * 0.3,
    oc = document.createElement('canvas');
  oc.width = Math.max(1, Math.ceil(r.width * k));
  oc.height = Math.max(1, Math.ceil((r.height + pad * 2) * k));
  const o = oc.getContext('2d')!;
  o.scale(k, k);
  o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  o.textAlign = 'left';
  o.letterSpacing = cs.letterSpacing;
  o.textBaseline = 'alphabetic';
  o.fillStyle = cs.color;
  // the line's own baseline, found by a mark set on it for a moment
  const mark = document.createElement('span');
  mark.style.cssText =
    'display:inline-block;width:0;height:0;vertical-align:baseline';
  el.append(mark);
  const base = mark.getBoundingClientRect().top - (r.top - pad);
  mark.remove();
  // where the text itself begins on the page, not the middle of its box
  const range = document.createRange();
  range.selectNodeContents(el);
  const left = range.getBoundingClientRect().left - r.left;
  o.fillText((el.textContent ?? '').trim(), left, base);
  const px = o.getImageData(0, 0, oc.width, oc.height).data,
    pts: Glyphs['pts'] = [];
  for (let y = 0; y < oc.height / k; y += STEP)
    for (let x = 0; x < oc.width / k; x += STEP)
      if (px[(Math.round(y * k) * oc.width + Math.round(x * k)) * 4 + 3] > 50)
        pts.push({
          rx: x,
          ry: y - pad,
          z: 0.3 + Math.random() * 0.65,
          keep: Math.random(),
        });
  const n = pts.length || 1;
  return {
    el,
    pts,
    ink: {
      x: pts.reduce((m, p) => m + p.rx, 0) / n,
      y: pts.reduce((m, p) => m + p.ry, 0) / n,
    },
    img: oc,
    pad,
    color: (cs.color.match(/[\d.]+/g) ?? ['255', '255', '255'])
      .slice(0, 3)
      .join(','),
    // big enough that neighbouring points touch: no gaps between them at rest
    dot: STEP * k * 1.45,
    k,
  };
};

export class LightSpeed {
  /** the credits' last line, which the canvas takes over where it stands and carries away with the stars */
  line: HTMLElement | null = null;
  private a = 0;
  private g = 0;
  bg = 0;
  speed = 0;
  flight = 0;

  private cx: CanvasRenderingContext2D | null;
  private w = 0;
  private h = 0;
  private stars: Star[] = [];
  private glyphs: Glyphs | null = null;
  private vp: { x: number; y: number } | null = null;
  private running = false;
  private last = 0;
  private frames = 0;
  private resize: ResizeObserver;

  constructor(private cv: HTMLCanvasElement) {
    this.cx = cv.getContext('2d');
    this.size();
    // On its own size, not the window's: the scrollbar comes when the loader lets the page go, which narrows the
    // canvas without any resize of the window, and a canvas left at the old size is drawn squeezed.
    this.resize = new ResizeObserver(() => {
      this.size();
      this.glyphs = null;
      this.vp = null;
      if (this.running) this.frame();
    });
    this.resize.observe(cv);
    cv.dataset.frames = '0';
  }

  /** how much of the stars and their black is seen */
  get alpha() {
    return this.a;
  }
  set alpha(v: number) {
    this.a = v;
    if (v > 0.001) this.wake();
  }
  /** 1 while the canvas draws the credits' last line (the page's line is hidden then) */
  get glyph() {
    return this.g;
  }
  set glyph(v: number) {
    this.g = v;
    if (v > 0) this.wake();
  }

  private size() {
    // the canvas's own laid-out size: innerWidth counts the scrollbar, and a canvas drawn that wide but shown
    // narrower is squeezed toward the left
    const r = Math.min(window.devicePixelRatio || 1, 1.5);
    this.w = this.cv.width = Math.max(1, Math.round(this.cv.clientWidth * r));
    this.h = this.cv.height = Math.max(1, Math.round(this.cv.clientHeight * r));
  }

  /**
   * Start drawing. On the ticker, which runs after the scroll has moved the page in the same tick; and once at
   * once, after the change that woke it has finished: the page's line may have been hidden in this very tick, and
   * must not be missing from the screen for a frame.
   */
  private wake() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    gsap.ticker.add(this.frame);
    queueMicrotask(() => this.running && this.frame());
  }

  private sleep() {
    this.running = false;
    gsap.ticker.remove(this.frame);
    this.cv.style.visibility = 'hidden';
    this.vp = null;
    this.glyphs = null;
  }

  dispose() {
    this.sleep();
    this.resize.disconnect();
  }

  private frame = () => {
    const cx = this.cx;
    const on = this.a > 0.001 || this.g > 0;
    if (!cx || !on) return this.sleep();
    const now = performance.now(),
      dt = Math.min(50, now - this.last) / 16.7;
    this.last = now;
    this.cv.style.visibility = 'visible';
    this.cv.dataset.frames = String(++this.frames);
    const { w, h } = this,
      k = w / Math.max(1, this.cv.clientWidth);
    if (!this.stars.length)
      this.stars = Array.from({ length: starCount(w / k, h / k) }, () => ({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random(),
        c: COLOURS[(Math.random() * COLOURS.length) | 0],
      }));
    // The vanishing point is the middle of the line's ink, not of the screen or of its box: the line sits below
    // and to the side of the middle, and points flying from anywhere else would carry it down and aside as they
    // came closer. It follows the line while the line flies (held, the line does not move on the screen; on a
    // touch screen it scrolls on with the page, and the jump goes with it rather than leaving it behind), and is
    // kept where it was from then on, so nothing jumps at full speed.
    if (!this.vp && this.line) this.glyphs ??= sample(this.line, k);
    if (!this.vp || (this.g > 0 && this.glyphs)) {
      const gl = this.glyphs;
      if (gl && gl.pts.length) {
        const at = gl.el.getBoundingClientRect();
        this.vp = { x: (at.left + gl.ink.x) * k, y: (at.top + gl.ink.y) * k };
      } else this.vp ??= { x: w / 2, y: h / 2 };
    }
    const f = Math.max(w, h) * 0.5,
      { x: ox, y: oy } = this.vp,
      v = this.speed,
      a = this.a;
    cx.clearRect(0, 0, w, h);
    cx.fillStyle = `rgba(5,6,8,${this.bg * a})`;
    cx.fillRect(0, 0, w, h);
    cx.lineCap = 'round';
    const step = (0.0012 + v * v * 0.045) * dt,
      tail = 0.0015 + v * v * 0.32,
      m = 8 * k;
    for (const s of this.stars) {
      s.z -= step;
      if (s.z <= 0.02) {
        s.z += 0.98;
        s.x = Math.random() * 2 - 1;
        s.y = Math.random() * 2 - 1;
      }
      if (a <= 0.001) continue;
      const z0 = s.z + tail,
        x1 = ox + (s.x / s.z) * f,
        y1 = oy + (s.y / s.z) * f,
        x0 = ox + (s.x / z0) * f,
        y0 = oy + (s.y / z0) * f;
      // (off the screen at both ends: nothing to draw)
      if (
        (x1 < -m && x0 < -m) ||
        (x1 > w + m && x0 > w + m) ||
        (y1 < -m && y0 < -m) ||
        (y1 > h + m && y0 > h + m)
      )
        continue;
      const near = 1 - s.z;
      cx.strokeStyle = `rgba(${s.c},${(0.25 + near * 0.6) * a})`;
      cx.lineWidth = 0.6 + near * near * 2.4;
      cx.beginPath();
      cx.moveTo(x0, y0);
      cx.lineTo(x1, y1);
      cx.stroke();
    }
    if (this.g > 0 && this.line) {
      const gl = (this.glyphs ??= sample(this.line, k)),
        t = this.flight,
        gt = 0.0005 + v * v * 0.12,
        // The line, hidden, is still where it stands (held, or scrolling with the page on a touch screen): the
        // points are placed from where it is now, not where it was when they were sampled.
        at = gl.el.getBoundingClientRect(),
        gk = gl.k,
        // While it stands the line is drawn whole, exactly as the page drew it; as the flight begins it hands
        // over to its points within the first stretch, so the points are never seen at rest.
        whole = Math.max(0, 1 - t / 0.12);
      if (whole > 0) {
        cx.globalAlpha = this.g * whole;
        cx.drawImage(gl.img, at.left * gk, (at.top - gl.pad) * gk);
        cx.globalAlpha = 1;
      }
      if (whole < 1) {
        // as they go they thin into fine streaks and dim, as the stars are: not a mass of white
        cx.strokeStyle = `rgba(${gl.color},${this.g * (1 - t * 0.8) * (1 - whole)})`;
        cx.lineWidth = gl.dot * (1 - t) + gk * t;
        // one path for all the points: they share their colour and width (thousands of strokes cost a phone)
        cx.beginPath();
        for (const p of gl.pts) {
          // most points fall away as the line goes, so what reaches light speed is a few fine streaks
          if (p.keep < t * 0.95) continue;
          const sx = (at.left + p.rx) * gk,
            sy = (at.top + p.ry) * gk,
            // a point placed in depth so that it stands where the letter is, then carried at the camera
            gx = ((sx - ox) * p.z) / f,
            gy = ((sy - oy) * p.z) / f,
            z = p.z * (1 - 0.96 * t),
            z0 = z + gt;
          cx.moveTo(ox + (gx / z0) * f, oy + (gy / z0) * f);
          cx.lineTo(ox + (gx / z) * f + 0.01, oy + (gy / z) * f);
        }
        cx.stroke();
      }
    } else this.glyphs = null;
  };
}

const ENGINES = new WeakMap<HTMLCanvasElement, LightSpeed>();

/** The light-speed canvas of the page, as LightSpeedCanvas.tsx set it up (none with reduced motion). */
export const lightSpeedOf = (canvas: HTMLCanvasElement | null) =>
  canvas ? ENGINES.get(canvas) : undefined;
export const mountLightSpeed = (canvas: HTMLCanvasElement) => {
  const ls = new LightSpeed(canvas);
  ENGINES.set(canvas, ls);
  return () => {
    ENGINES.delete(canvas);
    ls.dispose();
  };
};

/**
 * The wake, written into a normalised 0..1 timeline over the screen of scroll in which the respawn comes up.
 * `from` and `to` are the two scene layers, `tunnel` the dark that closes in from the edges (.flash, its `--c`),
 * `line` the credits' last line.
 *
 * The End's stars give way to the flying ones, which gather speed and draw out into streaks while the edges darken;
 * the line becomes points where it stands and flies at the camera with them. At the middle the jump is at full speed
 * and the world behind is changed. Then out of light speed: the streaks pull back into points and fade, and the day
 * decelerates into place, landing with a jolt. The jump takes the whole of its screen of scroll.
 */
export const addLightSpeed = (
  tl: gsap.core.Timeline,
  ls: LightSpeed,
  from: { el: HTMLElement; zoom: HTMLElement },
  to: { el: HTMLElement; zoom: HTMLElement },
  tunnel: HTMLElement | null,
  line: HTMLElement | null,
) => {
  const im = { immediateRender: false };
  ls.line = line;
  tl.fromTo(
    from.zoom,
    { scale: 1 },
    { scale: 1.1, duration: 0.4, ease: 'sine.in' },
    0,
  )
    .fromTo(
      ls,
      { alpha: 0, bg: 0 },
      { alpha: 1, bg: 0.45, duration: 0.12, ease: 'none', ...im },
      0.03,
    )
    .fromTo(
      ls,
      { speed: 0 },
      { speed: 1, duration: 0.45, ease: 'power2.in', ...im },
      0.05,
    )
    // the flying stars' own black deepens slowly behind them, until it is whole at the middle
    .to(ls, { bg: 1, duration: 0.3, ease: 'power2.in' }, 0.2);
  if (line)
    // the line becomes points where it stands, before the flying stars come over it, and they fly at the camera
    // with the stars (the canvas draws it in the same frame as it is hidden here: LightSpeed.wake)
    tl.set(line, { opacity: 0 }, 0.03)
      .set(ls, { glyph: 1 }, 0.03)
      .fromTo(
        ls,
        { flight: 0 },
        { flight: 1, duration: 0.34, ease: 'power2.in', ...im },
        0.16,
      )
      .set(ls, { glyph: 0 }, 0.5);
  if (tunnel)
    tl.fromTo(
      tunnel,
      { '--c': 0 },
      { '--c': 0.55, duration: 0.32, ease: 'power2.in', ...im },
      0.18,
    ).to(tunnel, { '--c': 0, duration: 0.2, ease: 'power2.out' }, 0.5);
  tl.set(from.el, { autoAlpha: 0 }, 0.5)
    .set(to.el, { autoAlpha: 1 }, 0.5)
    .to(ls, { speed: 0, duration: 0.32, ease: 'power3.out' }, 0.5)
    .to(ls, { bg: 0, duration: 0.3, ease: 'power2.out' }, 0.5)
    .to(ls, { alpha: 0, duration: 0.2, ease: 'power1.in' }, 0.66)
    .fromTo(
      to.zoom,
      { scale: 1.8 },
      { scale: 1, duration: 0.46, ease: 'expo.out', ...im },
      0.5,
    );
  // a jolt: the day's layer knocked aside and settling, over a short stretch of the scroll
  [1, -0.8, 0.6, -0.4, 0.25, -0.1, 0].forEach((k, i) =>
    tl.to(
      to.el,
      { x: k * 16, y: -k * 16 * 0.5, duration: 0.014, ease: 'none' },
      0.52 + i * 0.014,
    ),
  );
  // the change spans its whole screen of scroll: the timeline is as long as 1, whatever ends before it
  tl.set({}, {}, 1);
};
