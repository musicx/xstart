import { settings, saveSettings, siteIcon } from './store.js';
import { PROVIDERS } from './providers.js';

const $ = (s) => document.querySelector(s);

export function initAI() {
  const box = $('#prompt'), chips = $('#providers'), btn = $('#ask');

  const shown = (id) => !settings.aiHidden.includes(id);
  const renderChips = () => chips.replaceChildren(...PROVIDERS.filter((p) => shown(p.id)).map((p) => {
    const c = document.createElement('button');
    c.type = 'button';
    c.className = 'chip' + (settings.aiSelected.includes(p.id) ? ' on' : '');
    c.innerHTML = `<img src="${siteIcon(p.url)}" alt=""><span></span>`;
    c.querySelector('span').textContent = p.name;
    c.onclick = () => {
      const s = new Set(settings.aiSelected);
      s.has(p.id) ? s.delete(p.id) : s.add(p.id);
      settings.aiSelected = PROVIDERS.map((x) => x.id).filter((id) => s.has(id));
      saveSettings('aiSelected');
      renderChips();
    };
    return c;
  }));

  const send = () => {
    const prompt = box.value.trim();
    const ids = settings.aiSelected.filter(shown);
    if (!prompt || !ids.length) return;
    chrome.runtime.sendMessage({ type: 'ask', prompt, ids, autoSend: settings.aiAutoSend });
  };

  const autosize = () => { box.style.height = 'auto'; box.style.height = `${Math.min(box.scrollHeight, 200)}px`; };
  box.addEventListener('input', autosize);
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); }
  });
  btn.onclick = send;
  renderChips();
  window.addEventListener('xstart:settings', renderChips);
}
