// หน้า 2 — มือรับฝน เป็นวิดีโอ (อัดจากฉาก 3D เดิม): ช่วงมือลอยขึ้น 3.6 วิ เล่นครั้งเดียว แล้วต่อด้วยลูป 12.6 วิ ที่วนได้เนียน
// เสียงหยดน้ำตกบนมือ เล่นตามเวลาที่เม็ดฝนโดนมือจริงตอนอัด (PALM_*)
import introUrl from '../art/video/scene2-intro.mp4?url';
import loopUrl from '../art/video/scene2-loop.mp4?url';
import introPoster from '../art/video/scene2-poster.jpg?url';
import loopPoster from '../art/video/scene2-loop-poster.jpg?url';
import { PALM_INTRO, PALM_LOOP } from '../art/video/scene2-palm.js';
import { REDUCE } from '../lib/util.js';
import { audio } from '../lib/audio.js';

export function createHandPage() {
  const el = document.createElement('section');
  el.className = 'page'; el.setAttribute('aria-label', 'หน้า 2');
  el.innerHTML = `<video class="layer vid" data-v="loop" src="${loopUrl}" poster="${loopPoster}" muted playsinline loop preload="auto" aria-hidden="true"></video>
    <video class="layer vid" data-v="intro" src="${introUrl}" poster="${introPoster}" muted playsinline preload="auto" aria-hidden="true"></video>`;
  const loop = el.querySelector('[data-v="loop"]'), intro = el.querySelector('[data-v="intro"]');
  loop.muted = intro.muted = true;
  let phase = 'intro', lastT = 0, offT = 0;
  const cur = () => (phase === 'intro' ? intro : loop), list = () => (phase === 'intro' ? PALM_INTRO : PALM_LOOP);
  intro.addEventListener('ended', () => { phase = 'loop'; lastT = 0; loop.currentTime = 0; loop.play().catch(() => {}); });
  loop.addEventListener('playing', () => { if (phase === 'loop') intro.style.opacity = 0; });   // ซ่อนตัว intro ต่อเมื่อลูปเล่นแล้วจริง (ไม่มีจอดำคั่น)
  function start() {
    clearTimeout(offT); loop.pause();
    if (REDUCE) { phase = 'loop'; intro.style.opacity = 0; loop.currentTime = 0; return; }
    phase = 'intro'; lastT = 0; intro.style.opacity = 1; intro.currentTime = 0; loop.currentTime = 0; intro.play().catch(() => {});
  }
  return {
    el,
    mount() { intro.load(); loop.load(); },
    enter() { start(); },
    leave() { clearTimeout(offT); offT = setTimeout(() => { intro.pause(); loop.pause(); }, 1800); },
    resize() {},
    tick() {
      if (REDUCE) return;
      const v = cur(); if (v.paused && !v.ended && el.classList.contains('on')) v.play().catch(() => {});   // กลับมาจากแอปอื่น → เล่นต่อ
      const t = v.currentTime; if (t === lastT) return;
      const P = list(); let n = 0;
      for (const p of P) { if ((t > lastT ? p > lastT && p <= t : p > lastT || p <= t) && n < 3) { audio.palm(); n++; } }   // t < lastT = ลูปวนกลับ
      lastT = t;
    },
  };
}
