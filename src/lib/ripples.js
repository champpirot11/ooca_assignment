// วงน้ำบนพื้น (วงรีแบน) วาดด้วย Canvas 2D
import { rnd, sm, DW } from './util.js';

export function createRipples(canvas, { max = 60, warm = null } = {}) {
  const ctx = canvas.getContext('2d'); let scale = 1; const list = [];
  function resize() {
    const r = canvas.getBoundingClientRect(); if (!r.width) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = r.width * dpr; canvas.height = r.height * dpr; scale = r.width / DW * dpr;
  }
  function add(x, y, size, rings, peak) {
    if (list.length > max) return;
    for (let k = 0; k < rings; k++) list.push({ x, y, size: size * (1 - k * .2), delay: k * rnd(.14, .2), life: rnd(1, 1.5) * (size > 14 ? 1.25 : 1), peak: peak * (1 - k * .22), t: 0 });
  }
  function draw(dt) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.setTransform(scale, 0, 0, scale, 0, 0);
    for (let i = list.length - 1; i >= 0; i--) {
      const r = list[i]; r.t += dt; const a = r.t - r.delay; if (a < 0) continue;
      const p = a / r.life; if (p >= 1) { list.splice(i, 1); continue; }
      const rx = r.size * (.25 + .75 * Math.sqrt(p)), ry = rx * .28, al = r.peak * Math.pow(1 - p, 1.6);
      const w = warm ? warm(r.x) * .8 : 0;
      ctx.beginPath(); ctx.ellipse(r.x, r.y, rx, ry, 0, 0, Math.PI * 2); ctx.lineWidth = .9 + (1 - p) * .7;
      ctx.strokeStyle = `rgba(${Math.round(190 + 65 * w)},${Math.round(228 - 20 * w)},${Math.round(224 - 84 * w)},${al.toFixed(3)})`; ctx.stroke();
    }
  }
  resize();
  return { add, draw, resize };
}
