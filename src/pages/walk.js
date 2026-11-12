// หน้า 3–4 — ฉากเดิน (เห็นแค่ขา) → ชะลอ → หยุด → แสงอุ่นจากร้านค่อยๆ เข้ามา
// เป็นฉากเดียวที่มี 2 สถานะ: stage 3 = เดินอยู่, stage 4 = หยุดเดิน + แสงเข้า (ย้อนกลับได้)
import groundUrl from '../art/ground.png';
import glowPath from '../art/glow-path.txt?raw';
import { FRAMES, META } from '../lib/frames.js';
import { createRain } from '../lib/rain.js';
import { createRipples } from '../lib/ripples.js';
import { audio } from '../lib/audio.js';
import { sm, lerp, REDUCE, param, DW, DH } from '../lib/util.js';

/* ===== ปรับค่าได้ที่นี่ ===== */
export const WALK = {
  period: .70,        // วินาทีต่อ 1 ท่า (8 ท่า = 1 ก้าวคู่) — เพิ่ม = เดินช้าลง
  fade: .16,          // เวลาเฟดสลับท่า
  speed: 72,          // ความเร็วพื้นเลื่อนซ้าย (px ดีไซน์/วินาที) ให้ใกล้ระยะก้าว
  slowDelay: .3,      // หลังแตะ ก่อนเริ่มชะลอ
  lightDelay: .2,     // หลังแตะ ก่อนแสงเริ่มเข้า
  lightIn: 4.5,       // แสงใช้เวลาเข้า
  lightOut: 2.2,      // แสงใช้เวลาจางออก (ตอนกดย้อนกลับ)
  settle: 1.6,        // เวลาเฟดจากท่าเดินไปท่ายืนนิ่ง (วินาที) หลังแตะ
  reflection: .16,    // เงาสะท้อนบนพื้นเปียก
  rain: { count: 90, strength: .5 },
  // เกรเดียนต์มืดที่นายวางทับขา: stop เปลี่ยนจากหน้า 3 → หน้า 4 ตามดีไซน์
  overlay: { a: [.342, .306], b: [1, .6706] },
};
const S = 1.1154, HIPX = 166, GROUND_Y = 611, RAIN_LAND = [578, 838], GROUND_W = 1200;

export function createWalkPage() {
  const el = document.createElement('section');
  el.className = 'page walk'; el.setAttribute('aria-label', 'หน้า 3–4');
  el.innerHTML = `
    <svg class="layer" viewBox="0 0 390 844" aria-hidden="true">
      <defs><linearGradient id="wBg" x1="195" y1="0" x2="195" y2="844" gradientUnits="userSpaceOnUse"><stop stop-color="#1F2A33"/><stop offset="1" stop-color="#34505A"/></linearGradient></defs>
      <rect width="390" height="844" fill="url(#wBg)"/><rect x="-21" y="562" width="432" height="282" fill="#1D2832"/>
    </svg>
    <div class="ground"><div class="track" id="wTrack"><i></i><i></i></div></div>
    <div class="ground gwarm" id="wWarm"><div class="track" id="wTrack2"><i></i><i></i></div></div>
    <svg class="layer" viewBox="0 0 390 844" aria-hidden="true">
      <defs>
        <linearGradient id="reflFade" gradientUnits="userSpaceOnUse" x1="0" y1="611" x2="0" y2="760"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <mask id="reflMask" maskUnits="userSpaceOnUse" x="0" y="560" width="390" height="284"><rect x="0" y="611" width="390" height="233" fill="url(#reflFade)"/></mask>
      </defs>
      <g id="wLegs">${FRAMES.map((f, i) => `<g class="fr" id="wf${i}" display="none">${f}</g>`).join('')}</g>
      <g mask="url(#reflMask)" opacity="${WALK.reflection}"><g transform="translate(0 ${GROUND_Y * 2}) scale(1 -1)"><use href="#wLegs"/></g></g>
    </svg>
    <svg class="layer" viewBox="0 0 390 844" aria-hidden="true">
      <defs><linearGradient id="wOv" x1="195" y1="0" x2="195" y2="980" gradientUnits="userSpaceOnUse"><stop id="wOv1" offset="${WALK.overlay.a[0]}" stop-color="#1F2A33"/><stop id="wOv2" offset="${WALK.overlay.b[0]}" stop-color="#34505A" stop-opacity="0"/></linearGradient></defs>
      <rect width="390" height="844" fill="url(#wOv)"/>
    </svg>
    <svg class="layer" id="wGlow" viewBox="0 0 390 844" aria-hidden="true" style="opacity:0">
      <defs>
        <filter id="glowBlur" x="194.576" y="27.1" width="561.824" height="789.963" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="52.7"/></filter>
        <radialGradient id="glowFill" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(524 470.5) rotate(101.374) scale(245.994 149.094)"><stop stop-color="#E48E43"/><stop offset="1" stop-color="#DBCFBA"/></radialGradient>
      </defs>
      <g filter="url(#glowBlur)"><path d="${glowPath}" fill="url(#glowFill)" fill-opacity="0.47"/></g>
    </svg>
    <canvas class="layer" id="wRip"></canvas><canvas class="layer" id="wRain"></canvas>`;
  el.style.setProperty('--gimg', `url(${groundUrl})`);

  const $ = (s) => el.querySelector(s);
  const legs = $('#wLegs'), FR = [...el.querySelectorAll('.fr')], track = $('#wTrack'), track2 = $('#wTrack2'), warm = $('#wWarm'), glow = $('#wGlow');
  const ov1 = $('#wOv1'), ov2 = $('#wOv2');
  FR.forEach((g, i) => { const m = META[i]; g.setAttribute('transform', `translate(${(HIPX - S * m.hip).toFixed(2)} ${(GROUND_Y - S * m.bottom).toFixed(2)}) scale(${S})`); });
  const footX = (i) => HIPX + S * (META[i].cx - META[i].hip);
  // ท่ายืนนิ่ง (ท่า 9) ในดีไซน์หน้า 4 วางที่ขนาดจริง ไม่ได้ขยาย 1.1154 เหมือนท่าเดิน → ตอนหยุดให้ค่อยๆ ย่อ/ย้ายไปตำแหน่งนั้น ไม่กระโดด
  const A9 = { x: HIPX - S * META[8].hip, y: GROUND_Y - S * META[8].bottom, s: S }, B9 = { x: 75.2, y: 236, s: 1 };
  const place9 = (t) => FR[8].setAttribute('transform', `translate(${lerp(A9.x, B9.x, t).toFixed(2)} ${lerp(A9.y, B9.y, t).toFixed(2)}) scale(${lerp(A9.s, B9.s, t).toFixed(4)})`);

  /* --- สถานะ --- */
  let stage = 3, tS = 0, f = 0, off = 21, rate = 1, stopped = false, target = -1, settle = 0, lightT = 0, LL = 0, T = 0;
  let lit = false, lastKey = '', trig = -1, rain = null, rip = null, active = false;

  // ชะลอแบบไหลต่อเนื่อง: ตำแหน่งก้าว f ไล่ตามเส้นโค้ง ease-out ที่ความเร็วต้นเท่าเดิม → ไม่ค้าง ไม่คลาน แล้วค่อยๆ เฟดเป็นท่ายืนช่วงท้าย
  let f0 = 0, dist = 0, tDur = 1, raw = 0;
  function advance(dt) {
    T += dt; tS += dt;
    const P = WALK.period; let df;
    if (stage === 4) {                                               // กดแล้ว: ขาค้างท่าปัจจุบัน แล้วเฟดไปท่ายืนทันที พื้นชะลอลงพร้อมกัน
      target = 1; df = 0; raw = Math.min(1, raw + dt / WALK.settle); stopped = raw >= 1;
      rate = 0; off += WALK.speed * Math.max(0, 1 - sm(raw)) * dt;
      lightT = Math.min(1, lightT + (tS >= WALK.lightDelay ? dt / WALK.lightIn : 0));
    } else {                                                          // ย้อนกลับมาเดินใหม่
      stopped = false; target = -1; raw = Math.max(0, raw - dt / .6);
      rate += (1 - rate) * Math.min(1, dt * 2.4); df = dt * rate / P;
      lightT = Math.max(0, lightT - dt / WALK.lightOut);
      f += df;
    }
    settle = raw;
    if (stage === 3) off += WALK.speed * Math.max(0, rate) * dt;
    LL = sm(lightT);
  }

  function setLegs() {
    const P = WALK.period, step = Math.floor(f + 1e-9), idx = step % 8, u = (f - step) * P, F = WALK.fade;
    const next = (idx + 1) % 8, a = F > 0 ? sm((u - (P - F)) / F) : (u >= P - F ? 1 : 0);
    const sa = sm(settle);               // ท่ายืนนิ่งค่อยๆ ซ้อนทับ
    const key = `${idx}|${a > 0 ? next : -1}|${sa > 0 ? 1 : 0}|${sa >= 1 ? 1 : 0}`;
    place9(1);   // ท่ายืนอยู่ตำแหน่งในดีไซน์หน้า 4 ตลอด ไม่เลื่อน/ไม่ย่อ — แค่เฟดเข้า
    if (key !== lastKey) {
      lastKey = key;
      FR.forEach((g, i) => g.setAttribute('display', (sa >= 1 ? i === 8 : (i === idx || (a > 0 && i === next) || (sa > 0 && i === 8))) ? 'inline' : 'none'));
      if (a > 0) legs.appendChild(FR[next]);                                       // ท่าถัดไปวางทับท่าปัจจุบันแล้วเฟดเข้า
      if (sa > 0) legs.appendChild(FR[8]);
    }
    // แตะแล้ว: ท่าเดิน (ท่าไหนก็ตาม) ค่อยๆ จางออก พร้อมท่ายืนจางเข้า
    FR[idx].setAttribute('opacity', (1 - sa).toFixed(3));
    if (a > 0) FR[next].setAttribute('opacity', (a * (1 - sa)).toFixed(3));
    if (sa > 0) FR[8].setAttribute('opacity', sa.toFixed(3));
    if (u >= P - F && trig !== step) { trig = step; if (next % 4 === 0) audio.step(next === 0 ? -1 : 1); }   // ท่า 1 และ 5 = เท้าแตะพื้น
  }
  function setGround() {
    const px = el.getBoundingClientRect().width / DW, tr = `translate3d(${(-(off % (GROUND_W * 2)) * px).toFixed(1)}px,0,0)`;
    track.style.transform = tr; track2.style.transform = tr;
  }
  function setLight() {
    const flick = 1 + .035 * Math.sin(T * 7.1) + .025 * Math.sin(T * 13.7 + 1);
    audio.light(LL, flick); if (stage === 4 && tS > WALK.lightDelay && !lit) { lit = true; audio.lightOn(); } if (stage === 3) lit = false;
    glow.style.opacity = (LL * Math.min(1, flick)).toFixed(3); warm.style.opacity = (.5 * LL * flick).toFixed(3);
    ov1.setAttribute('offset', lerp(WALK.overlay.a[0], WALK.overlay.a[1], LL).toFixed(4));
    ov2.setAttribute('offset', lerp(WALK.overlay.b[0], WALK.overlay.b[1], LL).toFixed(4));
  }
  const warmAt = (x) => LL * sm((x - 110) / 280);

  function ensureFx() {
    if (rain || REDUCE) return;
    rip = createRipples($('#wRip'), { max: 60, warm: warmAt });
    const n = +param('rain', WALK.rain.count);
    if (n > 0) rain = createRain($('#wRain'), {
      count: n, strength: WALK.rain.strength, startY: [330, 470], land: RAIN_LAND, warm: warmAt,
      onLand: (x, y, depth) => { if (y < 625 && x > 10 && x < 345) return;      // ไม่ให้วงน้ำไปโผล่ซ้อนบริเวณเท้า
        if (Math.random() < .03) rip.add(x, y, 4 + 10 * depth, 2, .3 + .3 * depth); },
    });
  }
  function frame() { setLegs(); setGround(); setLight(); }

  function applyStatic() {      // reduced-motion: ไม่เคลื่อนไหว แสดงท่าตามสถานะ
    if (stage === 4) { f = 2; stopped = true; settle = raw = 1; lightT = 1; LL = 1; } else { f = 0; settle = raw = 0; lightT = 0; LL = 0; }
    frame();
  }
  return {
    el,
    mount() { ensureFx(); frame(); },
    enter(opts = {}) {
      active = true; ensureFx(); rain?.resize(); rip?.resize();
      stage = opts.stage || 3; tS = 0;
      if (stage === 3) { f = 0; off = 21; rate = 1; stopped = false; target = -1; settle = 0; raw = 0; lightT = 0; LL = 0; lastKey = ''; }
      if (REDUCE) applyStatic(); else frame();
    },
    setStage(n) {
      if (n === stage) return; stage = n; tS = 0;
      if (n === 3 && REDUCE) applyStatic(); if (n === 4 && REDUCE) applyStatic();
    },
    leave() { active = false; },
    resize() { rain?.resize(); rip?.resize(); },
    tick(dt) {
      if (REDUCE) return;
      advance(dt); frame();
      if (rain) { rain.step(dt); rain.render(); }
      rip?.draw(dt);
    },
    get light() { return LL; },
  };
}
