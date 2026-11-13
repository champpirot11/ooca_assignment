// หน้าแรก (ดีไซน์ Intro1 ของ Panupong) — ฉากหลังคือในร้าน ooca เดินไปมา: ไปหาแผ่น → ไปฟังเพลง → เดินเล่น วนไปเรื่อยๆ
// การแตะปุ่มเข้า = การแตะครั้งแรก → เบราว์เซอร์อนุญาตให้เล่นเสียง ฉากเกริ่น 1 จึงได้ยินเสียงฝนตั้งแต่เริ่ม
import { REDUCE } from '../lib/util.js';
import sceneUrl from '../art/shop/scene.svg?url';
import logoUrl from '../art/shop/ooca-logo.svg?url';
import { POSE, FEET, WALK, POSE_URL } from './shopflow.js';

const USE = ['stand', 'find', 'found1', 'listen', 'wave', 'walk'];
// เส้นทางเดินในร้าน [x, y, ท่าที่ทำเมื่อถึง, ค้างกี่วินาที, หันซ้าย/ขวา]
const ROUTE = [[459, 505, 'find', 4.2, 1], [470, 505, 'found1', 2.6, 1], [742, 470, 'listen', 6, -1], [1010, 512, 'stand', 2.4, 1], [1180, 520, 'wave', 2.4, -1], [620, 520, 'stand', 2, 1]];

export function createHome({ onEnter }) {
  const el = document.createElement('section');
  el.className = 'home on'; el.setAttribute('aria-label', 'หน้าแรก ooca ร้านแผ่นเสียงฟังใจ');
  el.innerHTML = `
    <div class="hm-world" aria-hidden="true"><img class="hm-scene" src="${sceneUrl}" alt="" draggable="false"></div>
    <div class="hm-tint"></div>
    <div class="hm-world hm-front" aria-hidden="true"><div class="sf-masc hm-masc"><i class="sf-shadow"></i><div class="sf-body">${USE.map((k) => k === 'walk' ? `<div class="svgp" data-p="walk">${WALK}</div>` : `<img data-p="${k}" src="${POSE_URL[`../art/shop/m-${k}.webp`]}" alt="" draggable="false">`).join('')}</div><div class="hm-notes"></div></div></div>
    <div class="hm-text">
      <img class="hm-logo" src="${logoUrl}" alt="ooca">
      <h1 class="hm-title">ooca ร้านแผ่นเสียง - ฟังใจ</h1>
      <p class="hm-copy">ฝนตกในใจหนักแค่ไหน ก็แวะมาหลบได้นะ<br>เล่าให้ฟังสักนิด แล้วรับแผ่นเสียงกลับไปหนึ่งแผ่น</p>
    </div>
    <div class="hm-sheet">
      <button class="hm-btn" id="hmgo">เข้าไปหลบฝน</button>
      <p class="hm-meta"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>เปิดเสียงไว้จะดีที่สุด · ประมาณ 5–10 นาที</p>
      <p class="hm-meta sm">ข้อมูลทุกอย่างอยู่ในเครื่องคุณเท่านั้น ไม่ถูกส่งไปไหน</p>
    </div>`;
  const worlds = el.querySelectorAll('.hm-world'), masc = el.querySelector('.hm-masc'), body = masc.querySelector('.sf-body'), shadow = masc.querySelector('.sf-shadow'), notes = el.querySelector('.hm-notes');
  const m = { x: 620, y: 520, pose: '', flip: 1 }; let S = 1, ox = 0, oy = 0, camX = 620, step = 0, phase = 'idle', tPhase = 0, from = null, walkDur = 0;
  function pose(p, flip = m.flip) {
    m.pose = p; m.flip = flip;
    body.querySelectorAll('[data-p]').forEach((im) => { const on = im.dataset.p === p; im.classList.toggle('on', on); if (on) { const [w, r, ax, ay] = POSE[p]; im.style.cssText = `--flip:${flip};width:${w}px;left:${-w * (flip < 0 ? 1 - ax : ax)}px;top:${-w * r * ay}px`; } });
    body.classList.toggle('walking', p === 'walk');
    const sw = POSE[p][0] * (FEET[p] || .3) * 1.35; Object.assign(shadow.style, { width: sw + 'px', height: sw * .2 + 'px', left: -sw / 2 + 'px', top: -sw * .1 + 'px' });
    notes.classList.toggle('on', p === 'listen');
  }
  function layout() {
    const W = el.clientWidth, H = el.clientHeight; S = Math.max(W / 1610, Math.min(W / 390, H / 844) * .86);   // ขนาด ooca พอดีจอ ไม่ใหญ่จนบังข้อความ
    ox = Math.min(0, Math.max(W - 1610 * S, W / 2 - camX * S)); oy = Math.max(H - 1036 * S, H * .77 - 505 * S);   // เท้าอยู่ราว 3/4 ของจอ เหนือกล่องขาว (ด้านบนที่เลยฉากถูกสีเขียวทับไว้)
    worlds.forEach((w) => { w.style.transform = `translate(${ox}px,${oy}px) scale(${S})`; }); masc.style.left = m.x + 'px'; masc.style.top = m.y + 'px';
  }
  function next() {
    const [x, y, p, , f] = ROUTE[step % ROUTE.length]; const d = Math.hypot(x - m.x, y - m.y);
    if (d < 30) { phase = 'act'; tPhase = 0; pose(p, f); return; }
    from = { x: m.x, y: m.y, tx: x, ty: y }; walkDur = Math.max(1.6, d / 95); phase = 'walk'; tPhase = 0; pose('walk', x < m.x ? -1 : 1);
  }
  // โน้ตดนตรีลอยตอนฟังเพลง
  setInterval(() => { if (!notes.classList.contains('on') || !el.classList.contains('on')) return; const n = document.createElement('span'); n.textContent = ['♪', '♫', '♩'][Math.random() * 3 | 0]; n.style.left = (Math.random() * 60 - 30) + 'px'; notes.appendChild(n); setTimeout(() => n.remove(), 3200); }, 700);
  el.querySelector('#hmgo').addEventListener('click', () => onEnter());
  pose('stand', 1);
  return {
    el,
    show() { el.classList.add('on'); layout(); },
    hide() { el.classList.remove('on'); },
    get on() { return el.classList.contains('on'); },
    resize() { layout(); },
    mount() { layout(); next(); },
    tick(dt) {
      if (!el.classList.contains('on')) return;
      tPhase += dt;
      if (REDUCE) { if (m.pose !== 'listen') { m.x = 742; m.y = 470; pose('listen', -1); camX = 742; layout(); } return; }
      if (phase === 'walk') {
        const k = Math.min(1, tPhase / walkDur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        m.x = from.x + (from.tx - from.x) * e; m.y = from.y + (from.ty - from.y) * e;
        if (k >= 1) { const [, , p, , f] = ROUTE[step % ROUTE.length]; phase = 'act'; tPhase = 0; pose(p, f); }
      } else if (phase === 'act' && tPhase > ROUTE[step % ROUTE.length][3]) { step++; next(); }
      camX += (m.x - camX) * Math.min(1, dt * .8);   // กล้องตามช้าๆ นุ่มๆ
      layout();
    },
  };
}
