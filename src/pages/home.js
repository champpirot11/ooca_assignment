// หน้าแรก (ดีไซน์ Intro1 ของ Panupong) — ooca ถือร่ม เว้นที่ว่างข้างๆ ไว้ให้คุณ ฝนตกกระทบร่ม ใต้ร่มแห้ง
// การแตะปุ่มเข้า = การแตะครั้งแรก → เบราว์เซอร์อนุญาตให้เล่นเสียงในบทเกริ่น
import { REDUCE } from '../lib/util.js';
import umbrella from '../art/home-umbrella.svg?raw';
import logo from '../art/home-logo.svg?raw';   // โลโก้จากไฟล์ดีไซน์หน้าแรก

// รูปทรงร่ม (พิกัดดีไซน์ 390×844): ผ้าร่มโค้งจากขอบซ้ายถึงขวา, ขอบล่างของร่ม, จุดที่น้ำหยดจากชายร่ม
const CX = 205, HW = 174, TOP = 100, RIM = 240, X0 = CX - HW, X1 = CX + HW;
const canopy = (x) => RIM - (RIM - TOP) * Math.sqrt(Math.max(0, 1 - ((x - CX) / HW) ** 2));   // ความสูงผ้าร่มที่ตำแหน่ง x
const TIPS = [33, 33, 376, 376, 352], GROUND = 432;   // หยดเฉพาะชายร่มด้านนอก (ไม่หยดใส่ ooca)

export function createHome({ onEnter }) {
  const el = document.createElement('section');
  el.className = 'home on'; el.setAttribute('aria-label', 'หน้าแรก ooca ร้านแผ่นเสียงฟังใจ');
  el.innerHTML = `<canvas class="hm-rain" aria-hidden="true"></canvas><div class="hm-stage">
      <div class="hm-art" role="img" aria-label="ooca ก้อนเมฆถือร่ม เว้นที่ว่างใต้ร่มไว้ให้คุณ">${umbrella}</div>
      <div class="hm-logo" role="img" aria-label="ooca">${logo}</div>
      <h1 class="hm-title">ooca ร้านแผ่นเสียง - ฟังใจ</h1>
      <p class="hm-copy">ฝนตกในใจหนักแค่ไหน ก็แวะมาหลบได้นะ<br>เล่าให้ฟังสักนิด แล้วรับแผ่นเสียงกลับไปหนึ่งแผ่น</p>
      <button class="hm-btn" id="hmgo">เข้าไปหลบฝน</button>
    </div><canvas class="hm-rain front" aria-hidden="true"></canvas>`;
  const stage = el.querySelector('.hm-stage'), [cvB, cvF] = el.querySelectorAll('canvas'), off = { x: 0, y: 0, w: 390, h: 844 }, cb = cvB.getContext('2d'), cf = cvF.getContext('2d');
  let s = 1, dpr = 1;
  const drops = [], splashes = [], drips = [], rings = [];
  const spawn = (y0) => ({ x: off.x0 + Math.random() * (off.w + 80) - 40, y: y0 ?? -20 - Math.random() * 60, v: 520 + Math.random() * 240, l: 10 + Math.random() * 12, a: .25 + Math.random() * .35 });

  function layout() {
    const W = el.clientWidth, H = el.clientHeight; s = Math.min(W / 390, H / 844); dpr = Math.min(devicePixelRatio || 1, 2);
    off.x = (W - 390 * s) / 2; off.y = (H - 844 * s) / 2; off.x0 = -off.x / s; off.w = W / s; off.y0 = -off.y / s; off.h = H / s;   // ฝนเต็มจอ (พิกัดดีไซน์ขยายออกข้างๆ)
    Object.assign(stage.style, { width: 390 * s + 'px', height: 844 * s + 'px', left: off.x + 'px', top: off.y + 'px', '--s': s });
    for (const c of [cvB, cvF]) { c.width = W * dpr; c.height = H * dpr; }
  }
  const DX = .16;   // ฝนเฉียงนิดๆ
  function tick(dt) {
    dt = Math.min(dt, .05);
    for (const d of drops) {
      const px = d.x, py = d.y; d.y += d.v * dt; d.x += d.v * DX * dt;
      const inCanopy = d.x > X0 && d.x < X1;
      if (inCanopy && d.y >= canopy(d.x) && d.y < GROUND) {   // ชนผ้าร่ม → กระเด็นเป็นจุดเล็กๆ (ใต้ร่มไม่มีฝน)
        if (py <= canopy(px) + 3) { const y = canopy(d.x); for (let k = 0; k < 2; k++) splashes.push({ x: d.x, y, vx: (Math.random() - .5) * 90, vy: -60 - Math.random() * 70, t: 0 }); }
        Object.assign(d, spawn());
      } else if (d.y > off.y0 + off.h + 20 || (!inCanopy && d.y > GROUND && Math.random() < .5 && d.y < GROUND + 260)) {   // ตกถึงพื้นนอกร่ม → วงน้ำ
        if (d.y < GROUND + 280 && !(d.x > X0 - 10 && d.x < X1 + 10)) rings.push({ x: d.x, y: d.y, t: 0 });
        Object.assign(d, spawn());
      }
    }
    if (Math.random() < dt * 2.2) { const x = TIPS[Math.random() * TIPS.length | 0]; drips.push({ x, y: canopy(x) + 4, v: 0, hang: .35 + Math.random() * .4 }); }   // หยดน้ำจากชายร่ม
    for (const p of drips) { if (p.hang > 0) { p.hang -= dt; continue; } p.v += 900 * dt; p.y += p.v * dt; }
    for (let i = drips.length - 1; i >= 0; i--) if (drips[i].y > GROUND) { const x = drips[i].x; if (x < X0 + 8 || x > X1 - 8) rings.push({ x, y: GROUND + Math.random() * 6, t: 0 }); drips.splice(i, 1); }
    for (const p of splashes) { p.t += dt; p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    for (let i = splashes.length - 1; i >= 0; i--) if (splashes[i].t > .35) splashes.splice(i, 1);
    for (const r of rings) r.t += dt; for (let i = rings.length - 1; i >= 0; i--) if (rings[i].t > .9) rings.splice(i, 1);
    draw();
  }
  function draw() {
    const k = s * dpr;
    for (const c of [cb, cf]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cvB.width, cvB.height); c.setTransform(k, 0, 0, k, off.x * dpr, off.y * dpr); }
    cb.lineCap = 'round';
    for (const d of drops) { cb.strokeStyle = `rgba(255,255,255,${d.a})`; cb.lineWidth = 1.1; cb.beginPath(); cb.moveTo(d.x - d.l * DX, d.y - d.l); cb.lineTo(d.x, d.y); cb.stroke(); }
    for (const r of rings) { const e = r.t / .9; cb.strokeStyle = `rgba(255,255,255,${.35 * (1 - e)})`; cb.lineWidth = 1; cb.beginPath(); cb.ellipse(r.x, r.y, 3 + e * 16, 1 + e * 4, 0, 0, Math.PI * 2); cb.stroke(); }
    cf.fillStyle = 'rgba(255,255,255,.75)';
    for (const p of splashes) { cf.globalAlpha = 1 - p.t / .35; cf.beginPath(); cf.arc(p.x, p.y, 1.3, 0, Math.PI * 2); cf.fill(); }
    cf.globalAlpha = 1;
    for (const p of drips) { cf.fillStyle = 'rgba(220,255,250,.85)'; cf.beginPath(); cf.ellipse(p.x, p.y + 3, 1.9, 2.8 + Math.min(4, p.v / 260), 0, 0, Math.PI * 2); cf.fill(); }
  }
  el.querySelector('#hmgo').addEventListener('click', () => onEnter());
  if (window.ResizeObserver) new ResizeObserver(() => layout()).observe(el);   // จัดกลางใหม่ทุกครั้งที่ขนาดจอเปลี่ยน (เดสก์ท็อป/หมุนจอ)
  return {
    el,
    show() { el.classList.remove('instant'); el.classList.add('on'); layout(); },
    hide(instant) { el.classList.toggle('instant', !!instant); el.classList.remove('on'); },
    get on() { return el.classList.contains('on'); },
    resize() { layout(); },
    mount() { layout(); for (let i = 0; i < 110; i++) { const d = spawn(off.y0 + Math.random() * off.h); if (d.x > X0 && d.x < X1 && d.y > canopy(d.x) && d.y < GROUND) d.y = off.y0 - 10; drops.push(d); } draw(); },
    tick(dt) { if (!el.classList.contains('on') || REDUCE) return; tick(dt); },
  };
}
