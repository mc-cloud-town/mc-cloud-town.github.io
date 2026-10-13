// Day lab: a switch between the night, the day as it is now, and the candidates for the day (day-lab.css).
// Remembered across the demo pages; ?day=night|now|cinema|tint|subtitle|sky|glass|print|halo chooses one from
// the address, and ?nether=night|day says whether the Nether has a day.
(() => {
  const root = document.documentElement,
    KEY = 'ctec-day-lab',
    NETHER_KEY = 'ctec-day-lab-nether';
  const MODES = [
    ['night', '夜'],
    ['now', '現行'],
    ['cinema', 'A 電影'],
    ['tint', 'B 日光'],
    ['subtitle', 'C 字幕'],
    ['sky', 'D 天色'],
    ['glass', 'E 玻璃'],
    ['print', 'F 版畫'],
    ['halo', 'G 光暈'],
  ];
  const home = root.classList.contains('lab-home');
  const themeBtn = document.getElementById('theme');
  let mode = 'night',
    nether = 'day';

  const nav = document.createElement('div');
  nav.className = 'day-lab';
  nav.setAttribute('role', 'group');
  nav.setAttribute('aria-label', '日間設計實驗');
  nav.innerHTML =
    MODES.map(
      ([k, t]) => `<button type="button" data-k="${k}">${t}</button>`,
    ).join('') + (home ? '<button type="button" data-nether></button>' : '');
  document.body.append(nav);
  const netherBtn = nav.querySelector('[data-nether]');

  // The candidate in force where the visitor is now. On the home page the End has no daylight, and neither has
  // the Nether when the second switch says so: there the candidate is the night's own (cinema).
  const pic = () => {
    if (mode === 'night' || mode === 'now') return '';
    if (!home) return mode;
    const dim = root.dataset.dim;
    if (dim === 'end' || (dim === 'nether' && nether === 'night'))
      return 'cinema';
    return mode;
  };
  const setPic = () => {
    const p = pic();
    if (p) {
      if (root.dataset.pic !== p) root.dataset.pic = p;
    } else delete root.dataset.pic;
  };
  const paint = () => {
    for (const b of nav.querySelectorAll('[data-k]'))
      b.setAttribute('aria-pressed', String(b.dataset.k === mode));
    if (netherBtn)
      netherBtn.textContent = nether === 'night' ? '地獄：無日' : '地獄：有日';
  };
  const apply = (m) => {
    mode = m;
    const light = m !== 'night';
    root.dataset.theme = light ? 'light' : 'dark';
    if (m === 'night' || m === 'now') delete root.dataset.day;
    else root.dataset.day = m;
    setPic();
    if (themeBtn && themeBtn.textContent.trim().length === 1)
      themeBtn.textContent = light ? '日' : '夜';
    try {
      localStorage.setItem(KEY, m);
      localStorage.setItem(NETHER_KEY, nether);
      localStorage.setItem('ctec-theme', light ? 'light' : 'dark');
    } catch {}
    paint();
  };

  nav.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b === netherBtn) {
      nether = nether === 'night' ? 'day' : 'night';
      apply(mode);
    } else apply(b.dataset.k);
  });
  // the page's own day/night button: the night is the night, and the day is the candidate last chosen
  let lastDay = 'now';
  new MutationObserver((list) => {
    if (list.some((r) => r.attributeName === 'data-dim')) setPic();
    const light = root.dataset.theme === 'light';
    if (mode !== 'night') lastDay = mode;
    if (light === (mode !== 'night')) return;
    apply(light ? lastDay : 'night');
  }).observe(root, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-dim'],
  });

  const q = new URLSearchParams(location.search);
  const known = (k) => MODES.some(([m]) => m === k);
  let start = q.get('day'),
    startNether = q.get('nether');
  try {
    if (!known(start)) start = localStorage.getItem(KEY);
    startNether ??= localStorage.getItem(NETHER_KEY);
  } catch {}
  if (!known(start)) start = root.dataset.theme === 'light' ? 'now' : 'night';
  nether = startNether === 'night' ? 'night' : 'day';
  apply(start);
})();
