// Proposal lab: three changes to the home demo, each with a switch of its own, each off (as now) by default.
// The address chooses too: ?open=half|third, ?works=early|after, ?credits=now|delay; choices are remembered.
//   open     an opening's slow stretch: half a screen of scroll a line (now), or a third (shorter: about a screen
//            and a half less page in all, the lines still light up one after another)
//   works    a work's caption: comes up when its change is seven tenths through (now), or once the change has
//            played out, rising in place
//   credits  the credits: begin under the push into the stars (now, the first heading is on screen early in the
//            dissolve), or a screen lower, coming in once the push has played out
// Each is set when the page builds its choreography (dimensions-v3-video.html), so a switch builds the page again.
(() => {
  const SWITCHES = [
    [
      'open',
      ['half', '開場減速：每行半屏'],
      ['third', '開場減速：每行三分之一屏'],
    ],
    ['works', ['early', '作品說明：現行'], ['after', '作品說明：轉場後浮現']],
    ['credits', ['now', '製作名單：現行'], ['delay', '製作名單：延後一屏']],
  ];
  const style = document.createElement('style');
  style.textContent = `
    .proposal-lab { bottom: 110px; flex-wrap: wrap; justify-content: center; border-radius: 22px; }
    .proposal-lab button[aria-pressed='true'] { background: #86cdff; }
  `;
  document.head.append(style);

  const nav = document.createElement('div');
  nav.className = 'day-lab proposal-lab';
  nav.setAttribute('role', 'group');
  nav.setAttribute('aria-label', '提案');
  document.body.append(nav);

  const q = new URLSearchParams(location.search);
  const state = {};
  for (const [key, off, on] of SWITCHES) {
    let v = q.get(key);
    try {
      v ??= localStorage.getItem('ctec-proposal-' + key);
    } catch {}
    state[key] = v === on[0] ? on[0] : off[0];
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.key = key;
    b.textContent = state[key] === on[0] ? on[1] : off[1];
    b.setAttribute('aria-pressed', String(state[key] === on[0]));
    nav.append(b);
  }
  nav.addEventListener('click', (e) => {
    const key = e.target.closest('button')?.dataset.key;
    if (!key) return;
    const [, off, on] = SWITCHES.find(([k]) => k === key);
    const next = state[key] === on[0] ? off[0] : on[0];
    try {
      localStorage.setItem('ctec-proposal-' + key, next);
    } catch {}
    const url = new URL(location.href);
    url.searchParams.set(key, next);
    location.href = url.href;
  });
})();
