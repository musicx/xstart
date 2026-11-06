import { settings, saveSettings } from './store.js';
import { ENGINES } from './search.js';
import { SOURCES } from './sources.js';
import { refresh, grantAndFlush, dirName } from './wallpaper.js';
import { PROVIDERS } from './providers.js';

const $ = (s) => document.querySelector(s);
const INTERVALS = [[0, '每次打开新标签页'], [15, '15 分钟'], [60, '1 小时'], [360, '6 小时'], [1440, '每天']];

export function initSettings() {
  const panel = $('#settings'), f = panel.querySelector('form'), w = settings.wallpaper;

  f.engine.replaceChildren(...Object.entries(ENGINES).map(([id, e]) => new Option(e.name, id)));
  f.interval.replaceChildren(...INTERVALS.map(([v, label]) => new Option(label, v)));
  const checkbox = (name, value, text) => {
    const l = document.createElement('label');
    l.innerHTML = `<input type="checkbox" name="${name}" value="${value}"> <span></span>`;
    l.querySelector('span').textContent = text;
    return l;
  };
  $('#sources').replaceChildren(...Object.entries(SOURCES).map(([id, s]) => checkbox('source', id, s.name)));
  $('#ai-providers').replaceChildren(...PROVIDERS.map((p) => checkbox('aiProvider', p.id, p.name)));

  const fill = async () => {
    f.engine.value = settings.engine;
    f.autoSend.checked = settings.aiAutoSend;
    for (const c of f.querySelectorAll('[name=aiProvider]')) c.checked = !settings.aiHidden.includes(c.value);
    for (const c of f.querySelectorAll('[name=source]')) c.checked = w.sources.includes(c.value);
    f.unsplashKey.value = w.unsplashKey;
    f.unsplashQuery.value = w.unsplashQuery;
    f.interval.value = w.interval;
    f.save.checked = w.save;
    $('#dir-name').textContent = (await dirName()) || '未选择';
  };

  f.addEventListener('change', (e) => {
    const n = e.target.name;
    if (n === 'engine') { settings.engine = f.engine.value; saveSettings('engine'); window.dispatchEvent(new Event('xstart:settings')); return; }
    if (n === 'autoSend') { settings.aiAutoSend = f.autoSend.checked; saveSettings('aiAutoSend'); return; }
    if (n === 'aiProvider') {
      settings.aiHidden = [...f.querySelectorAll('[name=aiProvider]:not(:checked)')].map((c) => c.value);
      saveSettings('aiHidden');
      window.dispatchEvent(new Event('xstart:settings'));
      return;
    }
    w.sources = [...f.querySelectorAll('[name=source]:checked')].map((c) => c.value);
    w.unsplashKey = f.unsplashKey.value.trim();
    w.unsplashQuery = f.unsplashQuery.value.trim();
    w.interval = Number(f.interval.value);
    w.save = f.save.checked;
    saveSettings('wallpaper');
    if (n === 'source' || n.startsWith('unsplash')) refresh();
    if (n === 'save' && w.save) dirName().then((d) => d || $('#pick-dir').click());
  });
  f.addEventListener('submit', (e) => e.preventDefault());
  $('#pick-dir').onclick = () => grantAndFlush(true).catch((e) => e.name !== 'AbortError' && alert(e.message));
  window.addEventListener('xstart:dir', fill);

  $('#open-settings').onclick = () => { fill(); panel.classList.add('open'); };
  $('#close-settings').onclick = () => panel.classList.remove('open');
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') panel.classList.remove('open'); });
}
