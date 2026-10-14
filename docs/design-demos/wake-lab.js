// Wake lab: how the respawn is entered after the wake (the white-out into day one). ?respawn=delay|float chooses
// one; the choice is remembered.
//   delay  the respawn begins a screen lower: the wake plays out, and its words then scroll in from the foot of the
//          screen.
//   float  the respawn stands in its own place, as before; its words are hidden under the white while it rises,
//          and come up, rising a little, one after another, as the white clears.
// The two are different layouts and triggers, set when the page builds its choreography
// (dimensions-v3-video.html), so a switch builds the page again.
(() => {
  const KEY = 'ctec-wake-lab';
  const MODES = [
    ['delay', '重生點：延後一屏'],
    ['float', '重生點：白光後浮現'],
  ];
  const style = document.createElement('style');
  style.textContent = '.wake-lab { bottom: 62px; }';
  document.head.append(style);

  const nav = document.createElement('div');
  nav.className = 'day-lab wake-lab';
  nav.setAttribute('role', 'group');
  nav.setAttribute('aria-label', '進入重生點的方式');
  nav.innerHTML = MODES.map(
    ([k, t]) => `<button type="button" data-k="${k}">${t}</button>`,
  ).join('');
  document.body.append(nav);

  const known = (k) => MODES.some(([m]) => m === k);
  let mode = new URLSearchParams(location.search).get('respawn');
  try {
    if (!known(mode)) mode = localStorage.getItem(KEY);
  } catch {}
  if (!known(mode)) mode = 'delay';
  for (const b of nav.children)
    b.setAttribute('aria-pressed', String(b.dataset.k === mode));

  nav.addEventListener('click', (e) => {
    const k = e.target.closest('button')?.dataset.k;
    if (!k || k === mode) return;
    try {
      localStorage.setItem(KEY, k);
    } catch {}
    const url = new URL(location.href);
    url.searchParams.set('respawn', k);
    location.href = url.href;
  });
})();
