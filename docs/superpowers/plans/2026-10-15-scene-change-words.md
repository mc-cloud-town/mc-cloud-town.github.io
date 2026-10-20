# Words After the Scene Change: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the home page, the words of the section that is coming never appear while the scene change into it is still playing; dimension openings slow down smoothly while their statement lights up; the credits' last line sinks into the wake; the respawn's words come up out of the white.

**Architecture:** The scene changes keep their timing (`TRANSITIONS` in `src/constants/scenes.ts`, `addTransition` in `src/lib/dimensions/transitions.ts`, each scrubbed from its section's top at the foot of the screen to the head). Only the words move: layout (padding in `src/styles/dimensions/home.css`) and the reveals in `src/lib/dimensions/choreography.ts`. Section jumps (`src/lib/dimensions/sectionJumps.ts`) land where the words are.

**Tech Stack:** Next.js static export, GSAP + ScrollTrigger + Lenis, plain CSS, Playwright against the export (`yarn build && yarn test:e2e`).

**Spec:** `docs/superpowers/specs/2026-10-07-dimensions-redesign-design.md` §5.3 (the rules dated 2026-10-15). **Demo (the design):** `docs/design-demos/dimensions-v3-video.html` — read its choreography script (search for "A dimension's opening", "works:", "the credits", "respawn: wake up").

## Global Constraints

- Read `AGENTS.md` first (it also says to read the Next.js guide in `node_modules/next/dist/docs/` before writing Next.js code). The demos are the design: where the demo and the product differ in something this plan does not name, keep the product as it is.
- Do not change the timing, shape or order of any scene change. Do not change anything this plan does not name.
- The rule: a scene change may play over the words of the section that is leaving, never over those of the section that is coming. The one exception is the wake (solid white): the respawn's words come up out of it as it clears.
- Scroll-driven motion uses transform and opacity only.
- Both themes, every width, zh_TW / zh_CN / en; no horizontal scroll; controls 44 × 44px up to 1024px.
- Reduced motion (`opts.reduced` in choreography.ts; spec §5.4): no carrying, no rising; the lines are lit and the words simply present when they are reached; the layout (padding) is the same, so jumps land in the same places.
- Tests describe the design: rewrite tests of the old timing; never delete one without replacing what it protected.
- Commit locally at logical checkpoints, never push. Messages in the repository's style, ending with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

- **Pins measured in order.** The Nether's ledger pins the screen for three screens above the End. Every trigger below it (the End's opening, the credits, the wake) must be measured after that pin has taken its room: in the demo a re-sort of triggers put the wake three screens early, on the member list. Measure each trigger's start against the real position of its section after load, after the member list has filled in, and after a language switch.
- **A section jump to the Nether, the End or the respawn** (bar, rail, `#hash` on arrival) must land on words, not on an empty screen of scene.
- **The upright name above 860px** must not jump: it holds by its own `position: sticky`; it is not carried by the slow stretch.
- **A language switch inside an opening** (lines change count and length): the slow stretch and the padding are measured again; nothing below moves wrongly.
- **Day theme**: the openings' words carry the day's shade (`--shade`) as before; nothing here may drop it.

---

### Task 1: Words after the scene change, in the product

**Files:**

- Modify: `src/styles/dimensions/home.css` (`.open` about line 434 and its narrow rule about 930; `.credits` about 683; `.credits .fin` about 740; `.respawn` about 749)
- Modify: `src/lib/dimensions/choreography.ts` (`reveals`, `work`, the credits, the respawn)
- Modify: `src/lib/dimensions/sectionJumps.ts` (where a jump lands)
- Test: `tests/dimensions-home.spec.ts`, `tests/dimensions-home-jumps.spec.ts`, `tests/dimensions-home-respawn.spec.ts`, `tests/dimensions-home-frames.spec.ts` (and any other test that fails because of these changes)

**Interfaces:**

- Consumes: `TRANSITIONS` (unchanged), `addTransition` (unchanged).
- Produces: nothing other tasks use.

- [ ] **Step 1: Read.** `AGENTS.md`; spec §5.3 and §5.4; the demo's choreography (the five places named above) and its stylesheet rules for `.open`, `.credits`, `.credits .fin`, `.respawn`; then `src/lib/dimensions/choreography.ts`, `transitions.ts`, `sectionJumps.ts`, and the home components that render the openings, works, credits and respawn (`src/components/dimensions/home/`). Note where the product differs from the demo (it has its own respawn composition from `respawn-lab.html`, a ground and the site's footer under it).

- [ ] **Step 2: Write failing tests** in the home specs, at 1440 × 900 and 390 × 844, both themes where the file already loops themes:

  1. For each scene change into a section that has words (the three openings, the five works, the credits): at every 2.5% of the change's own scroll range, strictly before its end, none of that section's text is inside the viewport with opacity above 0.05. (Measure the change's range from its ScrollTrigger, as the existing tests find them.)
  2. For each opening: half way through its slow stretch, its title (the tag above 860px, the name at 860px and below) stands at 20% ± 3% of the viewport height; and between any two scroll steps of 12px through the stretch, the upright name above 860px moves by no more than 24px (no jump).
  3. The wake: from its start to its middle the credits' last line keeps its place on screen (± 2px) and is visible; from its middle on it is hidden; the respawn's words are hidden until the middle and fully visible by its end.
  4. The wake's start equals the respawn section's top minus one screen, measured after the member list has loaded.
  5. A jump (the bar's link) to the Nether and to the End lands with the opening's title on screen (between 10% and 40% down) and its statement fully lit.
  6. With reduced motion: no transform on the openings' words at any point; the lines are lit.
     Run them and see them fail.

- [ ] **Step 3: Layout** (home.css). `.open` begins a screen lower at every width: its top padding is `100vh` (the narrow rule's `padding-top: 20vh` becomes `100vh` too). `.credits` top padding `100vh`. `.respawn` keeps its place. Comment each in the file's voice: its words reach the foot of the screen only as the change into it ends.

- [ ] **Step 4: Openings** (choreography.ts, `reveals` or a new function beside it). Port the demo's slow stretch: the run is `innerHeight * (0.33 * lines + 0.4)`, the carry `0.62` of it, the section's bottom padding grows by the carry (`calc(<its own bottom padding> + carry px)`, measured again on refresh), the start leaves the title at 20% at the stretch's middle, the opening's text column is carried with `sine.inOut` from 0 to the carry, the upright name only at 860px and below, the lines light one after another from 0.22 of the stretch (`0.24` each). Give these triggers `refreshPriority: -1` and `invalidateOnRefresh: true`. Keep the openings' other reveals (the name's rise, the `.rise` blocks) as they are. Do not re-sort triggers.

- [ ] **Step 5: Works** (`work`): the caption's reveal starts when the section's top reaches the head of the screen (`start: 'top top'`), otherwise as it is.

- [ ] **Step 6: The wake.** On the respawn's transition timeline (the one `addTransition` filled for `#respawn`): the credits' last line is carried down by half a screen over the first half (so it keeps its place on the screen) and hidden at the middle; the respawn's own blocks (its direct children that carry words, the mascot with them) are hidden from the start and come up from 0.5, `y: 40 → 0`, opacity `0 → 1`, `0.36` each, `0.02` apart, `power2.out`; the timeline's length must stay 1. Remove the respawn's own entrances that this replaces (its `.rise` blocks and the mascot's rise) — keep the mascot's idle float.

- [ ] **Step 7: Jumps** (sectionJumps.ts). A jump to an opening lands where its slow stretch is at its middle (title at 20%, statement lit); a jump to the respawn lands where it does now if the respawn's words are up there; check the credits too. Keep the jump's cover and timing as they are.

- [ ] **Step 8: Reduced motion.** No carry and no rising; the lines lit; the credits' last line and the respawn's words simply present (no hold, no hiding) — or as close as the existing reduced path allows; say what you chose.

- [ ] **Step 9: Run** the new tests, then the four home spec files in full; rewrite every test that still describes the old timing. Some home tests are load-sensitive (timeouts about pictures, the flash, the loader): re-run a timed-out test alone before concluding.

- [ ] **Step 10: Look at it.** Screenshots at 1440 × 900, 820 × 1180 and 390 × 844, day and night, zh_TW and en, through the Nether's portal, an opening's slow stretch, one work, the credits' start and the wake; compare with the demo. Check every line of **Review Focus**.

- [ ] **Step 11: Commit** at logical checkpoints (layout and openings; works; wake; jumps; tests).
