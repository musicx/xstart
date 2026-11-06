// Tiny IndexedDB key-value store: holds the current wallpaper blob, the save-directory handle,
// and images waiting for directory permission.
const db = new Promise((resolve, reject) => {
  const req = indexedDB.open('xstart', 1);
  req.onupgradeneeded = () => { req.result.createObjectStore('kv'); req.result.createObjectStore('pending'); };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const run = async (store, mode, fn) => {
  const tx = (await db).transaction(store, mode);
  const req = fn(tx.objectStore(store));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  });
};

export const get = (key, store = 'kv') => run(store, 'readonly', (s) => s.get(key));
export const set = (key, value, store = 'kv') => run(store, 'readwrite', (s) => s.put(value, key));
export const del = (key, store = 'kv') => run(store, 'readwrite', (s) => s.delete(key));
export const keys = (store) => run(store, 'readonly', (s) => s.getAllKeys());
