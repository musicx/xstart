import { loadSettings } from './store.js';
import { initSearch } from './search.js';
import { initAI } from './ai.js';
import { initBookmarks } from './bookmarks.js';
import { initWallpaper } from './wallpaper.js';
import { initSettings } from './settings.js';
import { initClock } from './clock.js';

initClock();
await loadSettings();
initWallpaper();
initSearch();
initAI();
initBookmarks();
initSettings();

// "/" focuses search from anywhere on the page
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !document.querySelector('dialog[open]')) {
    e.preventDefault();
    document.querySelector('#q').focus();
  }
});
