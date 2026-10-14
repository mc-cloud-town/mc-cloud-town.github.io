// Entry lab: when a dimension is entered through its scene change (the portal into the Nether, the fall into the
// End), are its opening's words there while the change plays, or do they wait until it has played out and then
// arrive? ?words=now|after chooses one from the address; the choice is remembered.
//   now    as the design has it: the words come up with the scroll, so they are already in place, half lit,
//          while the portal still covers the screen, and show through it as it clears.
//   after  the opening's words wait, hidden, until the change has played out (the section's top at the top of
//          the screen, where the scrubbed change ends); then they arrive, rising a little, in --t-in. Scrolling
//          back above that point hides them again, the same way.
(() => {
  const root = document.documentElement,
    KEY = 'ctec-entry-lab';
  const MODES = [
    ['now', '文字：現行'],
    ['after', '文字：動畫後'],
  ];
  const style = document.createElement('style');
  // The wait is on filter: opacity() and translate, not on opacity and transform: the words' own entrances
  // (the name rising, the statement lighting up) animate those, and must run on as they are.
  style.textContent = `
    html.entry-after .open:is(#nether, #end) > * {
      transition:
        filter 0.6s cubic-bezier(0.215, 0.61, 0.355, 1),
        translate 0.6s cubic-bezier(0.215, 0.61, 0.355, 1);
    }
    html.entry-after .open.entry-wait > * {
      filter: opacity(0);
      translate: 0 28px;
    }
    .entry-lab { bottom: 62px; }
  `;
  document.head.append(style);

  const nav = document.createElement('div');
  nav.className = 'day-lab entry-lab';
  nav.setAttribute('role', 'group');
  nav.setAttribute('aria-label', '進入維度時的文字');
  nav.innerHTML = MODES.map(
    ([k, t]) => `<button type="button" data-k="${k}">${t}</button>`,
  ).join('');
  document.body.append(nav);

  const sections = [...document.querySelectorAll('.open#nether, .open#end')];
  // in the wait while the section's top is still below the top of the screen: its change has not played out
  const sync = () => {
    for (const sec of sections)
      sec.classList.toggle('entry-wait', sec.getBoundingClientRect().top > 1);
  };

  let mode = 'now';
  const apply = (m) => {
    mode = m;
    root.classList.toggle('entry-after', m === 'after');
    for (const b of nav.children)
      b.setAttribute('aria-pressed', String(b.dataset.k === m));
    try {
      localStorage.setItem(KEY, m);
    } catch {}
  };
  nav.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) apply(b.dataset.k);
  });

  let start = new URLSearchParams(location.search).get('words');
  try {
    if (!MODES.some(([k]) => k === start)) start = localStorage.getItem(KEY);
  } catch {}
  apply(MODES.some(([k]) => k === start) ? start : 'now');
  sync();
  // the page scrolls through Lenis, which moves the document: a scroll event follows every step
  addEventListener('scroll', sync, { passive: true });
  addEventListener('resize', sync);
})();
