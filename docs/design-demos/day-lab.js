// Day lab: a switch between the night, the day as it is now, and the two candidates for the day (day-lab.css).
// Remembered across the demo pages; ?day=night|now|cinema|paper chooses one from the address.
(() => {
  const root = document.documentElement,
    KEY = 'ctec-day-lab';
  const MODES = [
    ['night', '夜'],
    ['now', '日・現行'],
    ['cinema', '日・A 電影'],
    ['paper', '日・B 紙面'],
  ];
  // B has no home page for a narrow screen yet: there the home page shows A
  const narrow = matchMedia('(max-width: 860px)');
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

  const paint = () => {
    for (const b of nav.children)
      b.setAttribute('aria-pressed', String(b.dataset.k === mode));
  };
  const apply = (m) => {
    mode = m;
    const light = m !== 'night';
    root.dataset.theme = light ? 'light' : 'dark';
    let day = m === 'cinema' || m === 'paper' ? m : '';
    if (
      day === 'paper' &&
      root.classList.contains('lab-home') &&
      narrow.matches
    )
      day = 'cinema';
    if (day) root.dataset.day = day;
    else delete root.dataset.day;
    if (themeBtn && themeBtn.textContent.trim().length === 1)
      themeBtn.textContent = light ? '日' : '夜';
    try {
      localStorage.setItem(KEY, m);
      localStorage.setItem('ctec-theme', light ? 'light' : 'dark');
    } catch {}
    paint();
    // the two ways set text differently, so sections change height
    window.ScrollTrigger?.refresh();
  };

  nav.addEventListener('click', (e) => {
    const k = e.target.closest('button')?.dataset.k;
    if (k) apply(k);
  });
  narrow.addEventListener('change', () => apply(mode));
  // the page's own day/night button: the night is the night, and the day is the way last chosen
  let lastDay = 'now';
  new MutationObserver(() => {
    const light = root.dataset.theme === 'light';
    if (mode !== 'night') lastDay = mode;
    if (light === (mode !== 'night')) return;
    apply(light ? lastDay : 'night');
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  let start = new URLSearchParams(location.search).get('day');
  if (!MODES.some(([k]) => k === start)) {
    try {
      start = localStorage.getItem(KEY);
    } catch {}
  }
  if (!MODES.some(([k]) => k === start))
    start = root.dataset.theme === 'light' ? 'now' : 'night';
  apply(start);
})();
