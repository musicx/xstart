const DEFAULTS = {
  engine: 'google',
  aiSelected: ['chatgpt', 'claude', 'gemini', 'grok', 'deepseek', 'qwen'],
  aiAutoSend: true,
  aiHidden: [], // providers left out of the AI bar; a deny-list so newly added providers show up
  bookmarks: [
    ['GitHub', 'https://github.com'],
    ['YouTube', 'https://www.youtube.com'],
    ['Gmail', 'https://mail.google.com'],
    ['X', 'https://x.com'],
    ['Bilibili', 'https://www.bilibili.com'],
    ['知乎', 'https://www.zhihu.com'],
  ].map(([title, url]) => ({ id: crypto.randomUUID(), title, url, icon: '' })),
  wallpaper: {
    sources: ['bing', 'earthview'],
    interval: 60, // minutes; 0 = every new tab
    unsplashKey: '',
    unsplashQuery: 'landscape',
    save: false,
  },
};

export const settings = structuredClone(DEFAULTS);

export async function loadSettings() {
  const s = await chrome.storage.local.get(null);
  Object.assign(settings, s, { wallpaper: { ...DEFAULTS.wallpaper, ...s.wallpaper } });
  return settings;
}

export function saveSettings(...keys) {
  return chrome.storage.local.set(Object.fromEntries(keys.map((k) => [k, settings[k]])));
}

// Small icons for engines / AI providers (bookmarks cache their own; see favicon.js).
export const siteIcon = (pageUrl) => `https://www.google.com/s2/favicons?domain=${new URL(pageUrl).hostname}&sz=64`;
