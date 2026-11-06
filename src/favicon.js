// Find the best icon for a site: <link> icons from its HTML (largest first), then Google's
// favicon service, then /favicon.ico. Returns { icon: dataURL | '', title }.
const TIMEOUT = 8000;

export async function fetchSiteInfo(pageUrl) {
  const origin = new URL(pageUrl).origin;
  const candidates = [];
  let title = '';
  try {
    const res = await fetch(pageUrl, { signal: AbortSignal.timeout(TIMEOUT) });
    // Chrome 156+ logs a CSP violation for every inline handler (onload=, onclick=…) in parsed HTML,
    // even though the inert document never runs them; rename those attributes before parsing.
    const html = (await res.text()).replace(/([\s/])on[a-z]+\s*=/gi, '$1data-x=');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    title = doc.querySelector('title')?.textContent.trim() ?? '';
    const base = doc.querySelector('base[href]')?.getAttribute('href');
    const baseUrl = base ? new URL(base, res.url).href : res.url;
    const links = [...doc.querySelectorAll('link[rel~="icon"], link[rel^="apple-touch-icon"]')];
    const score = (l) => {
      if (/svg/.test(l.type) || /\.svg(\?|$)/.test(l.getAttribute('href'))) return 1000;
      const sizes = (l.getAttribute('sizes') ?? '').match(/\d+/g)?.map(Number) ?? [];
      return sizes.length ? Math.max(...sizes) : l.rel.includes('apple-touch-icon') ? 180 : 16;
    };
    links.sort((a, b) => score(b) - score(a));
    for (const l of links) candidates.push(new URL(l.getAttribute('href'), baseUrl).href);
  } catch { /* unreachable page: fall through to icon services */ }
  candidates.push(`https://www.google.com/s2/favicons?domain=${new URL(pageUrl).hostname}&sz=128`);
  candidates.push(`${origin}/favicon.ico`);

  for (const url of candidates) {
    const icon = await toDataUrl(url);
    if (icon) return { icon, title };
  }
  return { icon: '', title };
}

async function toDataUrl(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) return '';
    const blob = await res.blob();
    if (!blob.type.startsWith('image/') || !blob.size) return '';
    const dataUrl = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
    // make sure the browser can actually decode it
    await new Promise((ok, fail) => { const img = new Image(); img.onload = ok; img.onerror = fail; img.src = dataUrl; });
    return dataUrl;
  } catch {
    return '';
  }
}
