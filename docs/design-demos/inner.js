// Shared by the inner pages: the theme toggle, remembered across pages.
(() => {
  const root = document.documentElement,
    btn = document.getElementById('theme');
  const apply = (light) => {
    root.dataset.theme = light ? 'light' : 'dark';
    if (btn) btn.textContent = light ? '日' : '夜';
  };
  let saved = null;
  try {
    saved = localStorage.getItem('ctec-theme');
  } catch {}
  apply(saved === 'light');
  btn?.addEventListener('click', () => {
    const light = root.dataset.theme !== 'light';
    apply(light);
    try {
      localStorage.setItem('ctec-theme', light ? 'light' : 'dark');
    } catch {}
  });
})();
