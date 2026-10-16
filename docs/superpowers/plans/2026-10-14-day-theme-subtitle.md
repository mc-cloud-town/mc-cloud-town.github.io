# Day Theme ("Subtitle" Veil) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** By day, words on a picture are light ink with their own shade over a thin black veil (as film subtitles), instead of dark ink on a wash of paper; the home page's Nether and End have no day.

**Architecture:** CSS only. The day keeps the night's layout and veil shapes and changes custom properties: on the home page the picture tokens are set on `.dim.dim--home` and the paper tokens are given back to the ground under the respawn; on inner pages the picture tokens are set on `.head` alone. No component or markup changes are expected.

**Tech Stack:** Next.js static export, plain CSS with native nesting (`src/styles/dimensions/`), Playwright against the export (`yarn build && yarn test:e2e`).

**Spec:** `docs/superpowers/specs/2026-10-07-dimensions-redesign-design.md` §4.2 (the bullets dated 2026-10-14). **Demo (the design):** `docs/design-demos/day-lab.css`, candidate `subtitle`, seen on `dimensions-v3-video.html?day=subtitle`, `members.html?day=subtitle`, `progress.html?day=subtitle`, `respawn-lab.html?day=subtitle`.

## Global Constraints

- Read `AGENTS.md` first. The demos are the design; match them. Veils, not patches: never a ground, strip or panel under one block of text.
- The night theme must not change at all. Every rule added here is under `[data-theme='light']`.
- The paper (what has no picture under it: inner page bodies, tools, footer, the ground under the respawn) keeps today's day values: `--bg #eef2f5`, `--panel #ffffff`, `--fg #0f1418`, `--muted #414c57`, `--v 238, 242, 245`, `--line rgba(15, 20, 24, 0.24)`, `--accent #0b6fb5` (Nether `#c2330f`, End `#6234c4`).
- Picture ink by day: `--fg #ffffff`, `--muted #eef2f5`, `--line rgba(255, 255, 255, 0.45)`, `--logo invert(1)`; accents Overworld `#cfeaff`, Nether `#ffd0c0`, End `#e6d8ff`.
- The shade, exactly: `0 1px 2px rgba(0, 0, 0, 0.75), 0 0 14px rgba(0, 0, 0, 0.55), 0 0 40px rgba(0, 0, 0, 0.4)`. Solid buttons (light ground, dark words) carry none.
- Day veil: colour `0, 0, 0`. Side `0.42 / 0.28 / 0 / 0`; foot `0.5 / 0.25 / 0`; hero `0.4 / 0.2 / 0 / 0.2 / 0.35`; bottom-up at 860px and below `0.5 / 0.3 / 0.12`. A scene's `strength` applies by day as by night.
- One layout in zh_TW, zh_CN and en; no horizontal scroll; controls at least 44 × 44px up to 1024px.
- Tests describe the design, they do not define it: rewrite a test that describes the old day (dark ink on paper veils, the strip under the dimension name, a contrast measurement of words on a picture); do not bend the CSS to keep it green.
- Commit one logical unit at a time, locally. Never push. Commit messages in the repository's style (`fix:`/`feat:`/`test:`/`docs:` then a plain sentence), ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **The bar over the paper ground (home, by day).** At the very foot of the home page on a short or narrow screen the ground may reach the fixed bar: its light words must not end up on paper. Check 390 × 844 and 1024 × 768 scrolled to the end.
- **Overlays of the home bar by day** (the language list, the phone menu): they take `--bg`/`--panel`/`--fg` from `.dim.dim--home`, so they turn dark with light words; they must stay readable and whole, not half paper.
- **Theme switched while on the home page's Nether or End**: nothing visible may change there but the theme button's icon, and scrolling back to the Overworld must show the day's veil.
- **A bright picture under small words** (the progress page's header: a white building and sky): the paragraph must be readable with the shade alone.
- **English at 390px** on the home opening and an inner header: the longer words keep the same layout and stay on the veil.

---

### Task 1: The home page by day

**Files:**

- Modify: `src/styles/dimensions/tokens.css` (the `[data-theme='light'][data-dim='end'] .dim.dim--home` block near the end, and the base `*` transition)
- Modify: `src/styles/dimensions/home.css` (the day rules at the end of the file, about lines 1125–1189; the bar's fog near line 233)
- Modify: `src/styles/dimensions/shell.css:19` (what is behind the shell on the home page)
- Test: `tests/dimensions-home.spec.ts`, `tests/dimensions-home-respawn.spec.ts`, `tests/dimensions-home-jumps.spec.ts`, `tests/dimensions-shell.spec.ts`, `tests/dimensions-label.spec.ts`

**Interfaces:**

- Produces: the custom property `--shade` (a `text-shadow` value, `none` where there is none), set with the tokens. Task 2 does not consume it: inner pages write the shade out themselves.

- [ ] **Step 1: Read the design.** Open `docs/design-demos/day-lab.css` (sections "cinema", "subtitle", "what every candidate does with those") and the spec's §4.2. Run `yarn build` once so the export exists.

- [ ] **Step 2: Write the failing tests** in `tests/dimensions-home.spec.ts`, next to the test `the day theme turns dark in the End and light again after it` (use that test's own way of opening the page and reaching a section):

```ts
test('by day the words on a picture are light and carry a shade, and the veil is thin and black', async ({
  page,
}) => {
  await openPage(page, '/', { theme: 'light' });
  await scrollToSection(page, '#overworld');
  const got = await page.evaluate(() => {
    const dim = getComputedStyle(document.querySelector('.dim.dim--home')!);
    const say = getComputedStyle(document.querySelector('#overworld .say')!);
    const name = getComputedStyle(document.querySelector('#overworld .vt')!);
    return {
      v: dim.getPropertyValue('--v').replace(/\s/g, ''),
      s1: dim.getPropertyValue('--s1').trim(),
      ink: say.color,
      shade: say.textShadow,
      strip: name.backgroundColor,
    };
  });
  expect(got.v).toBe('0,0,0');
  expect(Number(got.s1)).toBeCloseTo(0.42);
  expect(got.ink).toBe('rgb(255, 255, 255)');
  expect(got.shade).not.toBe('none');
  // no strip of paper under the dimension's name: it stands on the veil like every other word
  expect(got.strip).toBe('rgba(0, 0, 0, 0)');
});

test('by day the Nether has no daylight: the night veil and ink, as in the End', async ({
  page,
}) => {
  await openPage(page, '/', { theme: 'light' });
  await scrollToSection(page, '#nether');
  await expect(page.locator('html')).toHaveAttribute('data-dim', 'nether');
  const got = await page.evaluate(() => {
    const dim = getComputedStyle(document.querySelector('.dim.dim--home')!);
    return {
      v: dim.getPropertyValue('--v').replace(/\s/g, ''),
      s1: dim.getPropertyValue('--s1').trim(),
      fg: dim.getPropertyValue('--fg').trim(),
      accent: dim.getPropertyValue('--accent').trim(),
    };
  });
  expect(got).toEqual({
    v: '6,8,11',
    s1: '0.92',
    fg: '#f2f4f6',
    accent: '#ff6a45',
  });
});

test('by day the ground under the respawn is paper, with dark words and no shade', async ({
  page,
}) => {
  await openPage(page, '/', { theme: 'light' });
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  const got = await page.evaluate(() => {
    const foot = getComputedStyle(document.querySelector('.ground .dim-foot')!);
    return { ink: foot.color, shade: foot.textShadow };
  });
  expect(got.shade).toBe('none');
  // dark ink: every channel under 128
  expect(
    got.ink
      .match(/\d+/g)!
      .slice(0, 3)
      .every((n) => Number(n) < 128),
  ).toBe(true);
});
```

If a selector differs in the product (`.say`, `.vt`, `.ground .dim-foot`), read `src/components/dimensions/home/` and use the real one; keep the assertions.

- [ ] **Step 3: Run them and see them fail.** `yarn build && yarn playwright test tests/dimensions-home.spec.ts -g "by day"` — expected: the three new tests fail (`--v` is `238,242,245`, the Nether is light, the strip is paper).

- [ ] **Step 4: Tokens** (`src/styles/dimensions/tokens.css`). Replace the block `[data-theme='light'][data-dim='end'] .dim.dim--home { … }` and its comment with:

```css
/* By day the home page is still the film: the pictures keep their daylight under a thin black veil, and the
   words on them are light and carry their own shade, as subtitles do (spec 4.2). Only the ground under the
   respawn is paper (home.css gives it the paper's tokens back). */
[data-theme='light'] .dim.dim--home {
  --bg: #0b0f13;
  --panel: #151b21;
  --fg: #ffffff;
  --muted: #eef2f5;
  --v: 0, 0, 0;
  --line: rgba(255, 255, 255, 0.45);
  --logo: invert(1);
  --accent: #cfeaff;
  --accent-ink: #cfeaff;
  --s1: 0.42;
  --s2: 0.28;
  --s3: 0;
  --s4: 0;
  --f1: 0.5;
  --f2: 0.25;
  --f3: 0;
  --h1: 0.4;
  --h2: 0.2;
  --h3: 0;
  --h4: 0.2;
  --h5: 0.35;
  --n1: 0.5;
  --n2: 0.3;
  --n3: 0.12;
  --shade: 0 1px 2px rgba(0, 0, 0, 0.75), 0 0 14px rgba(0, 0, 0, 0.55),
    0 0 40px rgba(0, 0, 0, 0.4);
}
/* The Nether and the End have no daylight: there the home page is as it is by night, veil, ink and accent. */
[data-theme='light']:is([data-dim='nether'], [data-dim='end']) .dim.dim--home {
  --bg: #06080b;
  --panel: #0e1217;
  --fg: #f2f4f6;
  --muted: #a3adb8;
  --v: 6, 8, 11;
  --line: rgba(242, 244, 246, 0.18);
  --logo: invert(1);
  --accent: #ff6a45;
  --accent-ink: #ff6a45;
  --s1: 0.92;
  --s2: 0.7;
  --s3: 0.2;
  --s4: 0.32;
  --f1: 0.95;
  --f2: 0.5;
  --f3: 0.28;
  --h1: 0.82;
  --h2: 0.4;
  --h3: 0.12;
  --h4: 0.62;
  --h5: 0.78;
  --n1: 0.9;
  --n2: 0.62;
  --n3: 0.3;
  --shade: none;
}
[data-theme='light'][data-dim='end'] .dim.dim--home {
  --accent: #cdb0ff;
  --accent-ink: #cdb0ff;
}
```

In the same file, add `text-shadow 0.3s ease` to the base `* { transition: … }` list, so the shade arrives with the theme where an element names no transition of its own.

- [ ] **Step 5: The home stylesheet** (`src/styles/dimensions/home.css`, the day rules at the end of the file). Make these changes and update each comment to say what is true now:

1. Delete the rule that gives the Overworld scenes' `.cam` a paper ground by day (`[data-theme='light']:not([data-dim='end']) .dim.dim--home .scene:is(…) .cam`): under light words the stage's black is the ground by day as by night.
2. Delete the two day accents for the sections (`… [data-dim='nether'] { --accent: #c2330f }` and `… [data-dim='end'] { --accent: #6234c4 }`): a section of the Nether or the End is read under the night's veil, so it keeps the night's accent.
3. Delete `… .dim.dim--home .veil { --veil-k: 1; }`: a scene's strength applies by day too.
4. Delete the day's narrower `.veil--side` gradient (the `@media (min-width: 861px)` block with the stops `0.97 / 0.94 / 0.3 / 0`): the side veil is the base one, from the tokens.
5. Delete the strip of paper under `.open .vt` (the last `@media (min-width: 861px)` block): that is a patch.
6. Add:

```css
/* day: the words on a picture carry their shade (--shade, tokens.css; none by night and in the Nether and the
   End). A solid button has its own ground and carries none. */
.dim.dim--home :is(main, .dim-bar) {
  text-shadow: var(--shade, none);
}
.dim.dim--home :is(.btn, .ground) {
  text-shadow: none;
}
/* day: the bar's fog is as thin as the veil */
[data-theme='light']:not([data-dim='nether'], [data-dim='end'])
  .dim.dim--home
  .dim-bar::before {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0));
}
/* day: the departments' links stand on the far side of the respawn's picture, which the side veil leaves clear */
[data-theme='light'] .dim.dim--home .scene[data-scene='day1'] .veil {
  --s3: 0.2;
  --s4: 0.2;
}
/* day: the ground under the respawn is paper, and what stands on it is read in the paper's ink */
[data-theme='light'] .dim.dim--home .ground {
  --bg: #eef2f5;
  --panel: #ffffff;
  --fg: #0f1418;
  --muted: #414c57;
  --v: 238, 242, 245;
  --line: rgba(15, 20, 24, 0.24);
  --logo: none;
  --accent: #0b6fb5;
  --accent-ink: #095b95;
  color: var(--fg);
}
```

If the home page's content is not inside a `main`, or the solid button is not `.btn`, use the product's real selectors (read `src/components/dimensions/home/`).

- [ ] **Step 6: Behind the shell** (`src/styles/dimensions/shell.css:19`). Change the selector to `html[data-theme='light']:is([data-dim='nether'], [data-dim='end']):has(.dim.dim--home) body` and extend its comment to name the Nether.

- [ ] **Step 7: Run the new tests and see them pass.** `yarn build && yarn playwright test tests/dimensions-home.spec.ts -g "by day"`.

- [ ] **Step 8: Run the home and shell suites and rewrite what describes the old day.** `yarn playwright test tests/dimensions-home.spec.ts tests/dimensions-home-respawn.spec.ts tests/dimensions-home-jumps.spec.ts tests/dimensions-shell.spec.ts tests/dimensions-label.spec.ts`. Known to describe the old day: `the day theme turns dark in the End and light again after it` (now: night tokens in the Nether and the End, day tokens after), `by day the home page is dark inside the End, and so is what is behind it; light again after it` (now also the Nether), the respawn tests with `'light'` rows (`by day the page is light again after the End`), and the label tests (the strip under the name is gone). For each failure decide: the product is wrong (fix the CSS) or the test describes the old design (rewrite it to state the new one). Never delete a test without replacing what it protected.

- [ ] **Step 9: Look at it.** Screenshot the home page by day at 1440 × 900, 820 × 1180 and 390 × 844, at the hero, the Overworld opening, one work scene, the Nether ledger, the End credits, the respawn, and the very end of the page; and the opening and respawn in English at 390. Compare with the demo (`docs/design-demos/dimensions-v3-video.html?day=subtitle`, `respawn-lab.html?day=subtitle`). Check each line of **Review Focus** that names the home page, and the night theme at one width (it must be unchanged). Fix what differs.

- [ ] **Step 10: Commit.** One commit for the product (`feat: by day the home page keeps its pictures: a thin black veil, light words with their own shade, and no daylight in the Nether or the End`) and one for the tests if they are large (`test: …`).

---

### Task 2: An inner page's header by day

**Files:**

- Modify: `src/styles/dimensions/inner.css` (the header: about lines 5–20 for the `--head-*` variables, 41–82 for the two veils, 105–135 for the crumb and the name, 280–300 and 352–362 for the narrow layout and the name's box; also the header variants near 570–610)
- Test: `tests/dimensions-pages.spec.ts`, `tests/dimensions-members.spec.ts`, `tests/dimensions-progress.spec.ts`, `tests/dimensions-label.spec.ts`, `tests/dimensions-matrix.spec.ts`

**Interfaces:**

- Consumes: nothing from Task 1.
- Produces: nothing later tasks rely on.

- [ ] **Step 1: Read the design.** `docs/design-demos/day-lab.css` ("inner header: the same side veil, and the picture sinks into the paper under it") and `members.html?day=subtitle`, `progress.html?day=subtitle`. In the product, a header has two veils that cross-fade with the theme: `.head .bg::before` (night) and `.head .bg::after` (day). Keep that mechanism; only the day's veil and the header's ink change.

- [ ] **Step 2: Write the failing test** in `tests/dimensions-pages.spec.ts` (use the file's own helpers and its list of inner pages if it has one; otherwise these three):

```ts
for (const [path, accent] of [
  ['/survivalProgress/', 'rgb(207, 234, 255)'],
  ['/member/', 'rgb(230, 216, 255)'],
] as const)
  test(`by day the header of ${path} is read in light words with a shade, on a thin black veil that sinks into the paper`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, path, { theme: 'light' });
    const got = await page.evaluate(() => {
      const head = document.querySelector('.dim .head')!;
      const veil = getComputedStyle(head.querySelector('.bg')!, '::after');
      const name = getComputedStyle(head.querySelector('.vt')!);
      return {
        ink: getComputedStyle(head.querySelector('h1')!).color,
        shade: getComputedStyle(head.querySelector('h1')!).textShadow,
        crumb: getComputedStyle(head.querySelector('.crumb .acc')!).color,
        veilOn: veil.opacity,
        veil: veil.backgroundImage,
        strip: name.backgroundColor,
        nameInk: name.color,
      };
    });
    expect(got.ink).toBe('rgb(255, 255, 255)');
    expect(got.shade).not.toBe('none');
    expect(got.crumb).toBe(accent);
    expect(got.veilOn).toBe('1');
    // black, never paper, across the picture; paper only where the picture sinks into the page
    expect(got.veil).toContain('rgba(0, 0, 0, 0.42)');
    expect(got.veil).toContain('rgb(238, 242, 245)');
    expect(got.veil).toContain('56px');
    expect(got.strip).toBe('rgba(0, 0, 0, 0)');
    expect(got.nameInk).toBe('rgb(255, 255, 255)');
  });
```

- [ ] **Step 3: Run it and see it fail.** `yarn build && yarn playwright test tests/dimensions-pages.spec.ts -g "by day the header"` — expected: fails on the ink (`rgb(15, 20, 24)`).

- [ ] **Step 4: The header's ink by day.** In `src/styles/dimensions/inner.css`, inside the file's `.dim { … }` block next to the other `[data-theme='light'] &` rules, add:

```css
/* By day a header's picture keeps its daylight under a thin black veil, and the words on it are light and
   carry their own shade, as on the home page (spec 4.2). The accent is the dimension's, in its picture ink. */
[data-theme='light'] & .head {
  --fg: #ffffff;
  --muted: #eef2f5;
  --line: rgba(255, 255, 255, 0.45);
  --accent: #cfeaff;
  --accent-ink: #cfeaff;
  color: var(--fg);
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.75),
    0 0 14px rgba(0, 0, 0, 0.55),
    0 0 40px rgba(0, 0, 0, 0.4);
}
[data-theme='light'][data-dim='nether'] & .head {
  --accent: #ffd0c0;
  --accent-ink: #ffd0c0;
}
[data-theme='light'][data-dim='end'] & .head {
  --accent: #e6d8ff;
  --accent-ink: #e6d8ff;
}
```

- [ ] **Step 5: The day's veil.** Replace the day veil's own declarations (`.head .bg::after { --v: var(--v-day); --head-n2: …; --head-n3: …; opacity: 0; }`) with:

```css
.head .bg::after {
  /* the day's: black and thin across the picture, and the picture's last 56px sink into the paper under it
     (every word of a header stands above its 56px of padding) */
  background: linear-gradient(
      0deg,
      rgb(var(--v-day)) 0,
      rgba(var(--v-day), 0) 56px
    ), linear-gradient(90deg, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.28) 42%, rgba(
          0,
          0,
          0,
          0
        ) 78%, rgba(0, 0, 0, 0) 100%);
  opacity: 0;
}
```

and in the `@media (max-width: 860px)` block, where both veils become bottom-up, give the day's its own:

```css
.head .bg::after {
  background: linear-gradient(
      0deg,
      rgb(var(--v-day)) 0,
      rgba(var(--v-day), 0) 56px
    ), linear-gradient(0deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.3) 60%, rgba(
          0,
          0,
          0,
          0.12
        ) 100%);
}
```

(keep the shared rule for `::before`; make sure the day's rule comes after it so it wins). Remove the variables `--head-day-n2` and `--head-day-n3`, which nothing reads any more. If a header's bottom padding is not 56px at some width or in some variant (check the variants near lines 570–610), use that header's real padding for the sink so no word stands in it.

- [ ] **Step 6: The dimension's name.** Delete the strip of paper under `.head .vt` by day (the `@media (min-width: 861px) { [data-theme='light'] & .head .vt { background…; padding… } }` block), the `transition` on `.head .vt` that eased the strip in, and the later `[data-theme='light'] & .head .vt { line-height: 1; margin-right: 0; }` that kept the strip's box. The name is a word on the veil like the others.

- [ ] **Step 7: Run the new test and see it pass.** `yarn build && yarn playwright test tests/dimensions-pages.spec.ts -g "by day the header"`.

- [ ] **Step 8: Run the inner pages' suites and rewrite what describes the old day.** `yarn playwright test tests/dimensions-pages.spec.ts tests/dimensions-members.spec.ts tests/dimensions-progress.spec.ts tests/dimensions-label.spec.ts tests/dimensions-matrix.spec.ts tests/dimensions-hardware.spec.ts tests/dimensions-join.spec.ts tests/dimensions-partner.spec.ts tests/dimensions-opensource.spec.ts tests/dimensions-redstone.spec.ts tests/dimensions-architecture.spec.ts tests/dimensions-notfound.spec.ts`. Known to describe the old day: the test in `tests/dimensions-progress.spec.ts` near line 626 about the crumb's accent ink ("the same hue, never lighter" — over a picture the crumb is now the light picture accent; the paper's `--accent-ink` still serves `.partner .tag` and anything else on paper), the label tests for inner pages (the strip), and any use of `expectLegible` on words in a header by day. Same rule as Task 1 Step 8.

- [ ] **Step 9: Look at it.** Screenshot every inner page's header by day (members, progress, redstone, architecture, open source, partner, hardware, join, and the not-found page, which is dark by design and must not change) at 1440 × 900 and 390 × 844, plus members and progress in English at 390, and one page by night (unchanged). Compare members and progress with the demo. Check the **Review Focus** line about a bright picture on the progress page. Fix what differs.

- [ ] **Step 10: Commit.** `feat: by day an inner page's header keeps its picture: a thin black veil, light words with their own shade, and no strip under the dimension's name`, and the tests separately if large.

---

### Task 3: The principle on record, and the whole suite

**Files:**

- Modify: `AGENTS.md` (the "Veils, not patches" and "Both themes are first-class" principles)
- Test: the whole suite

- [ ] **Step 1: The principle.** In `AGENTS.md`, extend "Veils, not patches." with one sentence: by day as by night the words on a picture are light ink on a black veil; the day's veil is thin and the words carry their own shade (spec 4.2); a picture is never washed toward paper, its veil is never coloured, and on the home page the Nether and the End have no day. Do not touch the block at the top that `next dev` writes.

- [ ] **Step 2: The whole suite.** `yarn lint && yarn build && yarn test:e2e`. Every failure is either a product defect from Tasks 1–2 (fix it) or a test of the old day that was missed (rewrite it). Report the final counts.

- [ ] **Step 3: The acceptance pictures.** Home, members and progress at 1440 × 900, 820 × 1180 and 390 × 844, day and night, zh_TW and en: save them under the scratchpad and list anything that differs from the demos.

- [ ] **Step 4: Commit.** `docs: the day's veil as a principle: light words on a thin black veil, never paper under a picture`.
