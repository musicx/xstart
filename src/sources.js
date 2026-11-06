// Wallpaper sources. Each fetch() resolves to { id, url, title, credit, link }.
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const json = async (url, init) => {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
};
const width = () => Math.min(3840, Math.round(screen.width * devicePixelRatio));

export const SOURCES = {
  bing: {
    name: 'Bing 每日一图',
    async fetch() {
      const { images } = await json('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=zh-CN');
      const img = random(images);
      return {
        id: img.urlbase.replace(/^.*OHR\./, ''),
        url: `https://www.bing.com${img.urlbase}_UHD.jpg`,
        title: img.title,
        credit: img.copyright,
        link: img.copyrightlink,
      };
    },
  },
  unsplash: {
    name: 'Unsplash',
    async fetch(cfg) {
      if (!cfg.unsplashKey) throw new Error('Unsplash 需要 Access Key');
      const headers = { Authorization: `Client-ID ${cfg.unsplashKey}` };
      const q = cfg.unsplashQuery ? `&query=${encodeURIComponent(cfg.unsplashQuery)}` : '';
      const p = await json(`https://api.unsplash.com/photos/random?orientation=landscape&content_filter=high${q}`, { headers });
      fetch(p.links.download_location, { headers }); // required by Unsplash API guidelines
      return {
        id: p.id,
        url: `${p.urls.raw}&w=${width()}&q=85&fm=jpg`,
        title: p.description || p.alt_description || '',
        credit: `${p.user.name} / Unsplash`,
        link: `${p.links.html}?utm_source=xstart&utm_medium=referral`,
      };
    },
  },
  earthview: {
    name: 'Google Earth View',
    async fetch() {
      const list = await json(chrome.runtime.getURL('data/earthview.json'));
      const [id, place, lat, lng] = random(list);
      return {
        id: String(id),
        url: `https://www.gstatic.com/prettyearth/assets/full/${id}.jpg`,
        title: place,
        credit: 'Google Earth',
        link: `https://www.google.com/maps/@${lat},${lng},12z/data=!3m1!1e3`,
      };
    },
  },
  picsum: {
    name: 'Picsum 随机',
    async fetch() {
      const p = random(await json(`https://picsum.photos/v2/list?page=${1 + Math.floor(Math.random() * 10)}&limit=100`));
      const w = width();
      return {
        id: p.id,
        url: `https://picsum.photos/id/${p.id}/${w}/${Math.round((w * 9) / 16)}`,
        title: '',
        credit: `${p.author} / Picsum`,
        link: p.url,
      };
    },
  },
};
