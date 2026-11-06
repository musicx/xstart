import { settings, saveSettings, siteIcon } from './store.js';

const ENGINES = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=%s' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=%s' },
  baidu: { name: '百度', url: 'https://www.baidu.com/s?wd=%s' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' },
  brave: { name: 'Brave', url: 'https://search.brave.com/search?q=%s' },
};
export { ENGINES };

const $ = (s) => document.querySelector(s);

export function initSearch() {
  const form = $('#search'), input = $('#q'), btn = $('#engine-btn'), menu = $('#engine-menu');

  const render = () => {
    const e = ENGINES[settings.engine] ?? ENGINES.google;
    btn.querySelector('img').src = siteIcon(e.url);
    btn.title = e.name;
    input.placeholder = `在 ${e.name} 中搜索`;
  };

  menu.replaceChildren(...Object.entries(ENGINES).map(([id, e]) => {
    const li = document.createElement('li');
    li.innerHTML = `<img src="${siteIcon(e.url)}" alt=""><span></span>`;
    li.querySelector('span').textContent = e.name;
    li.onclick = () => {
      settings.engine = id;
      saveSettings('engine');
      render();
      menu.hidden = true;
      input.focus();
    };
    return li;
  }));

  btn.onclick = (ev) => { ev.stopPropagation(); menu.hidden = !menu.hidden; };
  document.addEventListener('click', () => { menu.hidden = true; });

  const go = (newTab) => {
    const q = input.value.trim();
    if (!q) return;
    const url = (ENGINES[settings.engine] ?? ENGINES.google).url.replace('%s', encodeURIComponent(q));
    if (newTab) window.open(url);
    else location.href = url;
  };
  form.onsubmit = (ev) => { ev.preventDefault(); go(false); };
  // Cmd/Ctrl+Enter opens results in a new tab
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) { ev.preventDefault(); go(true); }
  });

  render();
  window.addEventListener('xstart:settings', render);
}
