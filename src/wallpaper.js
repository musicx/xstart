import { settings } from './store.js';
import { SOURCES } from './sources.js';
import * as idb from './idb.js';

const $ = (s) => document.querySelector(s);
let layers, front = 0, busy = false;

export async function initWallpaper() {
  layers = [...document.querySelectorAll('#bg img')];
  $('#next').onclick = () => refresh();
  $('#pending').onclick = () => grantAndFlush();

  const cur = await idb.get('current');
  if (cur) await show(cur);
  if (!cur || expired(cur)) refresh();
  // keep rotating while a tab stays open
  setInterval(async () => { const c = await idb.get('current'); if (!c || expired(c)) refresh(); }, 60_000);
  updatePending();
}

const expired = (cur) => Date.now() - cur.ts >= settings.wallpaper.interval * 60_000;

export async function refresh() {
  if (busy) return;
  busy = true;
  $('#next').classList.add('spin');
  try {
    const cfg = settings.wallpaper;
    const ids = cfg.sources.filter((id) => SOURCES[id] && (id !== 'unsplash' || cfg.unsplashKey));
    // try sources in random order until one works
    for (const id of ids.sort(() => Math.random() - 0.5)) {
      try {
        const meta = await SOURCES[id].fetch(cfg);
        const res = await fetch(meta.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const cur = { ...meta, source: id, blob, ts: Date.now() };
        await show(cur);
        await idb.set('current', cur);
        if (cfg.save) await saveImage(cur);
        return;
      } catch (e) {
        console.warn(`wallpaper source ${id} failed:`, e);
      }
    }
  } finally {
    busy = false;
    $('#next').classList.remove('spin');
  }
}

async function show(cur) {
  const next = layers[1 - front];
  const old = next.src;
  next.src = URL.createObjectURL(cur.blob);
  await next.decode().catch(() => {});
  next.classList.add('on');
  layers[front].classList.remove('on');
  front = 1 - front;
  if (old.startsWith('blob:')) URL.revokeObjectURL(old);

  const credit = $('#credit');
  credit.href = cur.link || '#';
  credit.querySelector('.title').textContent = cur.title || SOURCES[cur.source]?.name || '';
  credit.querySelector('.by').textContent = cur.credit || '';
}

// ---- saving to a user-picked directory (File System Access API) ----

const fileName = (cur) => {
  const ext = { 'image/png': 'png', 'image/webp': 'webp' }[cur.blob.type] ?? 'jpg';
  return `${cur.source}_${String(cur.id).replace(/[^\w.-]+/g, '_')}.${ext}`;
};

async function writableDir() {
  const dir = await idb.get('dir');
  return dir && (await dir.queryPermission({ mode: 'readwrite' })) === 'granted' ? dir : null;
}

async function write(dir, name, blob) {
  try {
    await dir.getFileHandle(name); // already saved (e.g. the same Bing image again)
  } catch {
    const w = await (await dir.getFileHandle(name, { create: true })).createWritable();
    await w.write(blob);
    await w.close();
  }
}

async function saveImage(cur) {
  const name = fileName(cur);
  const dir = await writableDir();
  if (dir) await write(dir, name, cur.blob);
  else await idb.set(name, cur.blob, 'pending');
  updatePending();
}

// Must run from a click: picking a directory and re-granting permission need a user gesture.
export async function grantAndFlush(pickNew = false) {
  let dir = pickNew ? null : await idb.get('dir');
  if (!dir) {
    dir = await window.showDirectoryPicker({ id: 'xstart-wallpapers', mode: 'readwrite', startIn: 'pictures' });
    await idb.set('dir', dir);
  }
  if ((await dir.requestPermission({ mode: 'readwrite' })) !== 'granted') return;
  for (const name of await idb.keys('pending')) {
    await write(dir, name, await idb.get(name, 'pending'));
    await idb.del(name, 'pending');
  }
  updatePending();
  window.dispatchEvent(new Event('xstart:dir'));
}

async function updatePending() {
  const n = (await idb.keys('pending')).length;
  const btn = $('#pending');
  btn.hidden = n === 0;
  btn.querySelector('span').textContent = n;
  btn.title = `${n} 张图片等待保存，点击授权目录`;
}

export const dirName = async () => (await idb.get('dir'))?.name ?? '';
