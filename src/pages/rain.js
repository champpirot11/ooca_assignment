// หน้า 1 — ก้อนเมฆ + ฝน เป็นวิดีโอวนลูป (อัดจากฉาก WebGL เดิมแบบความละเอียดเต็ม) ลื่นเท่ากันทุกเครื่อง
import loopUrl from '../art/video/scene1-loop.mp4?url';
import posterUrl from '../art/video/scene1-poster.jpg?url';
import { REDUCE } from '../lib/util.js';

export function createRainPage() {
  const el = document.createElement('section');
  el.className = 'page'; el.setAttribute('aria-label', 'หน้า 1');
  el.innerHTML = `<video class="layer vid" src="${loopUrl}" poster="${posterUrl}" muted playsinline loop preload="auto" aria-hidden="true"></video>`;
  const v = el.querySelector('video'); v.muted = true;
  let offT = 0;
  const play = () => { if (!REDUCE) v.play().catch(() => {}); };
  return {
    el,
    mount() { v.load(); },
    enter() { clearTimeout(offT); play(); },
    leave() { clearTimeout(offT); offT = setTimeout(() => v.pause(), 1800); },   // หยุดหลังเฟดออกเสร็จ
    resize() {},
    tick() { if (!REDUCE && v.paused && el.classList.contains('on')) play(); },   // กลับมาจากแอปอื่น → เล่นต่อ
  };
}
