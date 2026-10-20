<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Design: principles and process

The site is the "three dimensions" design: the home page is a film through the Overworld, the Nether, the End and
back to the respawn point; the other pages are reference pages in the same shell. The design is specified in
`docs/superpowers/specs/2026-10-07-dimensions-redesign-design.md` and drawn in `docs/design-demos/`. Read both
before changing anything a visitor sees.

## Principles

- **The site presents as a film.** Every visible change of state is a designed transition: a scene change, a menu
  opening, a step to another page, a jump to a section, a picture arriving. Nothing appears, disappears or moves
  abruptly. This holds for everything, including what the demos do not show. A change of dimension (into the
  Overworld, the Nether or the End, and the wake into the respawn) may play over the words of the section that is
  leaving, never over those of the dimension that is coming: they appear only once it has played out. The wake, a
  fade through solid black, is the one exception: the respawn's words come up out of it as it clears.
- **The demos are the design.** Where a demo covers something, the product matches it. Do not replace an approved
  design because a measurement disagrees with it: an automated contrast number is not a defect.
- **Veils, not patches.** Text stands on the scene's veil, the way `dimensions-v3-video.html` does it. Every scene
  keeps its veil, and none is veiled so heavily that the picture is lost. Never put a ground or a strip under one
  block of text. If a picture reads too dark, lower that scene's `strength` in `src/constants/scenes.ts` and keep
  the veil's shape. By day as by night the words on a picture are light ink on a black veil: the day's veil is thin
  and the words carry their own shade (spec 4.2). A picture is never washed toward paper, its veil is never
  coloured, and on the home page the Nether and the End have no day.
- **Design for the reader's comfort, not to fill space.** An empty side is not a problem to solve by spreading
  content across it. Judge a section as part of the whole page, with what stands above and below it.
- **Alignment follows the content's shape.** A list reads from the left, and its rules run from gutter to gutter.
  Items placed side by side span the full width; they are not left-aligned with one side open. What shares a row
  shares a baseline, and neighbouring sections share their edges.
- **One layout in every language.** zh_TW, zh_CN and en use the same layout. Size columns by their content so the
  longest language fits, and check English early: it is usually the longest.
- **Decide what each width shows before drawing it.** For every breakpoint, state what is shown, what is stacked
  and what is left out (the mascot, the rail). No horizontal scroll, no broken words, and every control at least
  44 × 44px up to 1024px wide.
- **Both themes are first-class.** Check day and night for every change.
- **The loader shows at once.** A loader that does not appear is the worst case; progress is a nicety. It uses the
  system font and is never blocked by fonts or scripts, plays from 0 to 100 without being cut short or starting
  part-filled, shows the lesser of its planned run and real progress, and keeps moving throughout. A returning
  visitor does not see it.
- **The hero is the anniversary video**, not a group photo, and the visitor never sees a black frame while it loads.
- **No game assets in the repository.** It is public: portals and the loader are drawn by code.
- **Words.** Only "first in Asia" is stated as a rank. Community links are icons with accessible names.

## Process

1. **Try it in a demo first.** For any new layout or a change the demos do not cover, build a standalone page in
   `docs/design-demos/` (theme switch, `?lang=en`) and get it approved before touching the product. Commit the demo.
2. **Then build it in the product to match the demo**, and say plainly where the product had to differ and why.
3. **Check with screenshots**: wide, tablet and phone widths, day and night, Chinese and English.
4. **Keep the process light.** A small visual change gets a quick check and a screenshot, not an audit or a review
   loop. Make small changes directly.
5. **Commit at logical checkpoints**: one unit of work per commit, never one large commit.
6. **Answer a question before acting on it.** A question about how something works is not a request to change it.
7. **Feedback from the team changes the spec**: update the spec when a decision replaces what it says.

Tests are Playwright against the static export (`yarn build && yarn test:e2e`). When a design changes, rewrite the
tests that describe the old one; they describe the design, they do not define it.
