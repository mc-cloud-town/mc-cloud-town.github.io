// Day lab: a switch between the night, the day as it is now, and the candidates for the day (day-lab.css).
// Remembered across the demo pages; ?day=night|now|tint|subtitle|cinema chooses one from the address.
// Two questions are still open, and each has a switch of its own:
//   head   an inner page of the Nether or the End: is its header in the dimension's daylight colour ('dim'),
//          or has it no day, as on the home page ('night')?   ?head=dim|night
//   paper  the new paper ('new') or the paper as it is today ('now')?   ?paper=new|now
// ?dim=nether|end|overworld shows an inner page as a page of that dimension.
(() => {
  const root = document.documentElement,
    KEY = 'ctec-day-lab';
  const inner = root.classList.contains('lab-inner');
  const OPTS = {
    head: ['dim', 'night', '標頭：隨維度', '標頭：無日'],
    paper: ['new', 'now', '紙面：新', '紙面：現行'],
  };
  const opt = { head: 'dim', paper: 'new' };
  const MODES = [
    ['night', '夜'],
    ['now', '現行'],
    ['tint', '日光'],
    ['subtitle', '字幕（備案）'],
    ['cinema', '電影'],
  ];
  const home = root.classList.contains('lab-home');
  const themeBtn = document.getElementById('theme');
  let mode = 'night';

  const nav = document.createElement('div');
  nav.className = 'day-lab';
  nav.setAttribute('role', 'group');
  nav.setAttribute('aria-label', '日間設計實驗');
  nav.innerHTML =
    MODES.map(
      ([k, t]) => `<button type="button" data-k="${k}">${t}</button>`,
    ).join('') +
    Object.keys(OPTS)
      .filter((k) => k !== 'head' || inner)
      .map((k) => `<button type="button" data-opt="${k}"></button>`)
      .join('');
  document.body.append(nav);

  // The candidate in force where the visitor is now. On the home page the Nether and the End have no daylight:
  // there the candidate is the night's own (cinema).
  const pic = () => {
    if (mode === 'night' || mode === 'now') return '';
    const dim = root.dataset.dim;
    const noDay = home || (inner && opt.head === 'night');
    return noDay && (dim === 'end' || dim === 'nether') ? 'cinema' : mode;
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
    for (const b of nav.querySelectorAll('[data-opt]')) {
      const [a, , ta, tb] = OPTS[b.dataset.opt];
      b.textContent = opt[b.dataset.opt] === a ? ta : tb;
    }
  };
  const apply = (m) => {
    mode = m;
    const light = m !== 'night';
    root.dataset.theme = light ? 'light' : 'dark';
    if (m === 'night' || m === 'now') delete root.dataset.day;
    else root.dataset.day = m;
    if (opt.paper === 'now') root.dataset.paper = 'now';
    else delete root.dataset.paper;
    setPic();
    if (themeBtn && themeBtn.textContent.trim().length === 1)
      themeBtn.textContent = light ? '日' : '夜';
    try {
      localStorage.setItem(KEY, m);
      for (const k in opt) localStorage.setItem(`${KEY}-${k}`, opt[k]);
      localStorage.setItem('ctec-theme', light ? 'light' : 'dark');
    } catch {}
    paint();
  };

  nav.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const o = b.dataset.opt;
    if (o) {
      opt[o] = opt[o] === OPTS[o][0] ? OPTS[o][1] : OPTS[o][0];
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
  let start = q.get('day');
  if (inner && q.get('dim')) root.dataset.dim = q.get('dim');
  try {
    if (!known(start)) start = localStorage.getItem(KEY);
    for (const k in opt) {
      const v = q.get(k) ?? localStorage.getItem(`${KEY}-${k}`);
      if (OPTS[k].slice(0, 2).includes(v)) opt[k] = v;
    }
  } catch {}
  if (!known(start)) start = root.dataset.theme === 'light' ? 'now' : 'night';
  apply(start);
})();
