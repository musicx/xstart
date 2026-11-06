// Web chat UIs that receive the prompt. `input` / `send` are tried first; fillPrompt falls back
// to generic detection, so a stale selector usually degrades rather than breaks.
export const PROVIDERS = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', input: '#prompt-textarea', send: '#composer-submit-button, button[data-testid="send-button"]' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/new', input: 'div.ProseMirror[contenteditable="true"]', send: 'button[aria-label="Send message"], button[aria-label="Send Message"]' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', input: 'rich-textarea .ql-editor[contenteditable="true"]', send: 'button.send-button, button[aria-label="Send message"], button[aria-label="发送"]' },
  { id: 'grok', name: 'Grok', url: 'https://grok.com/', input: 'form .ProseMirror[contenteditable="true"], form textarea', send: 'form button[type="submit"]' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com/', input: 'textarea#chat-input, textarea', send: '' },
  { id: 'qwen', name: 'Qwen', url: 'https://chat.qwen.ai/', input: 'textarea#chat-input, textarea', send: '#send-message-button, button.send-button' },
  { id: 'kimi', name: 'Kimi', url: 'https://www.kimi.com/', input: '.chat-input-editor[contenteditable="true"]', send: '.send-button-container, .send-button' },
  { id: 'doubao', name: '豆包', url: 'https://www.doubao.com/chat/', input: 'textarea[data-testid="chat_input_input"]', send: '#flow-end-msg-send, button[data-testid="chat_input_send_button"]' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/', input: '#ask-input, textarea', send: 'button[aria-label="Submit"], button[data-testid="submit-button"]' },
];

// Injected into the provider tab via chrome.scripting.executeScript; must be self-contained.
export async function fillPrompt(text, cfg) {
  if (window.__xstartFilled) return 'skipped';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const pick = (sel, root = document) => (sel ? [...root.querySelectorAll(sel)].find(visible) : undefined);
  // Generic fallback only after the provider selector had 8s to match: SPAs often mount helper
  // textareas (e.g. for measuring) before the real editor.
  const findInput = (i) =>
    pick(cfg.input) || (i >= 16 && (pick('textarea:not([readonly]):not([disabled])') || pick('[contenteditable="true"]')));

  const probe = text.slice(0, 20);
  const filled = (el) => (el.tagName === 'TEXTAREA' ? el.value : el.innerText).includes(probe);
  const insert = (el) => {
    el.focus();
    // insertText goes through the browser's editing pipeline, so React / ProseMirror / Quill / Lexical see it.
    document.execCommand('insertText', false, text);
    if (filled(el)) return;
    if (el.tagName === 'TEXTAREA') {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    }
  };

  let input;
  window.__xstartFilled = true;
  // Hydration can swap out a server-rendered editor right after we fill it, so re-check and refill.
  for (let attempt = 0; attempt < 3; attempt++) {
    for (let i = 0; i < 60 && !(input = findInput(i)); i++) await sleep(500);
    if (!input) return 'no-input';
    await sleep(400); // let the editor finish mounting
    if (!filled(input)) insert(input);
    await sleep(1000);
    input = findInput(99);
    if (input && filled(input)) break;
  }
  if (!input || !filled(input)) return 'fill-failed';
  if (!cfg.autoSend) return 'filled';

  // Generic send button: searched only near the input so unrelated "Send feedback" buttons don't match.
  const nearbySend = () => {
    let node = input;
    for (let i = 0; i < 8 && node; i++, node = node.parentElement) {
      const b = [...node.querySelectorAll('button')].find((b) =>
        visible(b) && /send|submit|发送/i.test(`${b.getAttribute('aria-label') ?? ''} ${b.dataset.testid ?? ''} ${b.id} ${b.className}`));
      if (b) return b;
    }
  };
  const ready = (b) => b && !b.disabled && b.getAttribute('aria-disabled') !== 'true';
  for (let i = 0; i < 20; i++) {
    const b = pick(cfg.send) || nearbySend();
    if (ready(b)) { b.click(); return 'sent'; }
    await sleep(250);
  }
  const key = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
  input.dispatchEvent(new KeyboardEvent('keydown', key));
  input.dispatchEvent(new KeyboardEvent('keypress', key));
  input.dispatchEvent(new KeyboardEvent('keyup', key));
  return 'enter';
}
