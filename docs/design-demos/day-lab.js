// Day lab: a switch between the night, the day as it is now, and the candidates for the day (day-lab.css).
// Remembered across the demo pages; ?day=night|now|subtitle|cinema chooses one from the address.
// ?dim=nether|end|overworld shows an inner page as a page of that dimension.
(() => {
  const root = document.documentElement,
    KEY = 'ctec-day-lab';
  const inner = root.classList.contains('lab-inner');
  const MODES = [
    ['night', '夜'],
    ['now', '現行'],
    ['subtitle', '字幕'],
    ['cinema', '電影'],
  ];
  const home = root.classList.contains('lab-home');
  const themeBtn = document.getElementById('theme');
  let mode = 'night';

  const nav = document.createElement('div');
  nav.className = 'day-lab';
  nav.setAttribute('role', 'group');
  nav.setAttribute('aria-label', '日間設計實驗');
  nav.innerHTML = MODES.map(
    ([k, t]) => `<button type="button" data-k="${k}">${t}</button>`,
  ).join('');
  document.body.append(nav);

  // The candidate in force where the visitor is now. On the home page the Nether and the End have no daylight:
  // there the candidate is the night's own (cinema). An inner page has the day's veil whatever its dimension.
  const pic = () => {
    if (mode === 'night' || mode === 'now') return '';
    const dim = root.dataset.dim;
    return home && (dim === 'end' || dim === 'nether') ? 'cinema' : mode;
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
      localStorage.setItem('ctec-theme', light ? 'light' : 'dark');
    } catch {}
    paint();
  };

  nav.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) apply(b.dataset.k);
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
  let start = q.get('day');
  if (inner && q.get('dim')) root.dataset.dim = q.get('dim');
  try {
    if (!known(start)) start = localStorage.getItem(KEY);
  } catch {}
  if (!known(start)) start = root.dataset.theme === 'light' ? 'now' : 'night';
  apply(start);
})();
