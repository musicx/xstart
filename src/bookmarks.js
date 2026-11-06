import { settings, saveSettings } from './store.js';
import { fetchSiteInfo } from './favicon.js';

const $ = (s) => document.querySelector(s);
const save = () => saveSettings('bookmarks');
const fetching = new Set();

export function initBookmarks() {
  const grid = $('#bookmarks'), dlg = $('#bm-dialog'), form = dlg.querySelector('form');
  let editing = null; // bookmark being edited, or null when adding
  let dragId = null;

  const letter = (b) => {
    const span = document.createElement('span');
    span.className = 'letter';
    span.textContent = (b.title || new URL(b.url).hostname).trim()[0]?.toUpperCase() ?? '?';
    let h = 0;
    for (const ch of b.url) h = (h * 31 + ch.charCodeAt(0)) % 360;
    span.style.background = `hsl(${h} 55% 50%)`;
    return span;
  };

  const tile = (b) => {
    const a = document.createElement('a');
    a.className = 'tile';
    a.href = b.url;
    a.draggable = true;
    a.dataset.id = b.id;
    const icon = document.createElement('div');
    icon.className = 'icon';
    if (b.icon) {
      const img = new Image();
      img.src = b.icon;
      img.alt = '';
      img.onerror = () => img.replaceWith(letter(b));
      icon.append(img);
    } else icon.append(letter(b));
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = b.title || new URL(b.url).hostname;
    const edit = document.createElement('button');
    edit.className = 'edit';
    edit.type = 'button';
    edit.title = '编辑';
    edit.textContent = '⋯';
    edit.onclick = (e) => { e.preventDefault(); open(b); };
    a.append(icon, name, edit);

    a.addEventListener('dragstart', () => { dragId = b.id; a.classList.add('dragging'); });
    a.addEventListener('dragend', () => { dragId = null; a.classList.remove('dragging'); });
    a.addEventListener('dragover', (e) => e.preventDefault());
    a.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!dragId || dragId === b.id) return;
      const list = settings.bookmarks;
      const to = list.findIndex((x) => x.id === b.id);
      const [moved] = list.splice(list.findIndex((x) => x.id === dragId), 1);
      list.splice(to, 0, moved); // lands after the target when dragging forward, before it when dragging back
      save();
      render();
    });
    return a;
  };

  const render = () => {
    const add = document.createElement('button');
    add.className = 'tile add';
    add.type = 'button';
    add.innerHTML = '<div class="icon">+</div><div class="name">添加</div>';
    add.onclick = () => open(null);
    grid.replaceChildren(...settings.bookmarks.map(tile), add);
    for (const b of settings.bookmarks) if (!b.icon && !fetching.has(b.id)) loadIcon(b);
  };

  const loadIcon = async (b) => {
    fetching.add(b.id);
    const info = await fetchSiteInfo(b.url);
    if (info.icon) b.icon = info.icon;
    if (!b.title && info.title) b.title = info.title;
    if (info.icon || info.title) { save(); render(); }
  };

  const open = (b) => {
    editing = b;
    form.title.value = b?.title ?? '';
    form.url.value = b?.url ?? '';
    form.icon.value = b?.icon?.startsWith('data:') ? '' : b?.icon ?? '';
    dlg.querySelector('.delete').hidden = !b;
    dlg.querySelector('.refetch').hidden = !b;
    dlg.querySelector('h3').textContent = b ? '编辑书签' : '添加书签';
    dlg.showModal();
    form.url.focus();
  };

  form.addEventListener('submit', async (e) => {
    if (e.submitter?.value !== 'save') return;
    let url = form.url.value.trim();
    if (!/^[a-z][\w+.-]*:/i.test(url)) url = `https://${url}`;
    const iconUrl = form.icon.value.trim();
    const b = editing ?? { id: crypto.randomUUID() };
    const urlChanged = b.url !== url;
    Object.assign(b, { title: form.title.value.trim(), url });
    if (iconUrl) b.icon = iconUrl;
    else if (urlChanged || !b.icon?.startsWith('data:')) b.icon = '';
    if (!editing) settings.bookmarks.push(b);
    fetching.delete(b.id);
    save();
    render();
  });
  dlg.querySelector('.delete').onclick = () => {
    settings.bookmarks = settings.bookmarks.filter((x) => x !== editing);
    save();
    render();
    dlg.close();
  };
  dlg.querySelector('.refetch').onclick = () => {
    if (!editing) return;
    editing.icon = '';
    form.icon.value = '';
    fetching.delete(editing.id);
    save();
    render();
  };

  render();
}
