const WEEK = '日一二三四五六';
const pad = (n) => String(n).padStart(2, '0');

export function initClock() {
  const time = document.querySelector('#time'), date = document.querySelector('#date');
  const tick = () => {
    const d = new Date();
    const t = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (time.textContent !== t) {
      time.textContent = t;
      date.textContent = `${d.getMonth() + 1}月${d.getDate()}日 · 星期${WEEK[d.getDay()]}`;
    }
  };
  tick();
  setInterval(tick, 1000);
}
