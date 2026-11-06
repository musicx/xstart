import { PROVIDERS, fillPrompt } from './src/providers.js';

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'ask') ask(msg.prompt, msg.ids, msg.autoSend);
});

async function ask(prompt, ids, autoSend) {
  const providers = ids.map((id) => PROVIDERS.find((p) => p.id === id)).filter(Boolean);
  await Promise.all(providers.map(async (p, i) => {
    const tab = await chrome.tabs.create({ url: p.url, active: i === 0 });
    const cfg = { input: p.input, send: p.send, autoSend };
    // Inject on every load completion for ~45s: sites that redirect (login, locale) get a new
    // document, and fillPrompt's window flag stops a double fill within the same document.
    const onUpdated = (tabId, info) => {
      if (tabId !== tab.id || info.status !== 'complete') return;
      chrome.scripting.executeScript({ target: { tabId }, func: fillPrompt, args: [prompt, cfg] })
        .then(([r]) => console.log(p.id, r?.result))
        .catch((e) => console.warn(p.id, e.message));
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
    setTimeout(() => chrome.tabs.onUpdated.removeListener(onUpdated), 45000);
  }));
}
