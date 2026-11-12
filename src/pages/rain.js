// หน้า 1 — ก้อนเมฆจากดีไซน์ + ฝนตกลงมาจากใต้ก้อนเมฆ
import bg from '../art/bg1.svg?raw';
import { createRain } from '../lib/rain.js';
import { REDUCE, param } from '../lib/util.js';

export function createRainPage() {
  const el = document.createElement('section');
  el.className = 'page'; el.setAttribute('aria-label', 'หน้า 1');
  el.innerHTML = `<div class="art">${bg}</div><canvas class="layer"></canvas>`;
  let rain = null;
  const count = +param('rain', 170);
  function ensure() {
    if (rain || REDUCE || !count) return;
    rain = createRain(el.querySelector('canvas'), { count, startY: [330, 470], strength: .95 });
    rain.render();
  }
  return {
    el,
    mount() { ensure(); },
    enter() { ensure(); rain?.resize(); },
    leave() {},
    resize() { rain?.resize(); },
    tick(dt) { if (!rain) return; rain.step(dt); rain.render(); },
  };
}
