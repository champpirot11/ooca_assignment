import '@fontsource/prompt/400.css';
import '@fontsource/prompt/500.css';
import '@fontsource/prompt/600.css';
import './fonts.js';
import './style.css';
import { createRainPage } from './pages/rain.js';
import { createHandPage } from './pages/hand.js';
import { createWalkPage } from './pages/walk.js';
import { createShopPage } from './pages/shop.js';
import './shop.css';
import { createShopFlow } from './pages/shopflow.js';
import { REDUCE, param } from './lib/util.js';
import { audio } from './lib/audio.js';

/* ===== เนื้อหาบทเกริ่น 5 หน้า =====
   page   = ฉากที่ใช้ (หน้า 3 กับ 4 เป็นฉากเดินเดียวกัน คนละสถานะ)
   copy   = ข้อความพาดหัว (<em> = สีเขียว teal)
   delay  = หน่วงก่อนข้อความขึ้น (วินาที)   hint = หน่วงก่อนคำว่า "แตะเพื่อไปต่อ"   lock = ช่วงที่ยังแตะข้ามไม่ได้ (ms) */
const STEPS = [
  { page: 'rain', copy: 'ช่วงนี้..... <em>ในใจคุณ</em><br>มีฝนตกมาสักพักแล้ว', delay: .5, hint: 2.2, lock: 900 },
  { page: 'hand', small: true, copy: 'เรื่องเรียน เรื่องงาน เรื่องที่บ้าน<br>หรือแม้แต่เรื่องที่คุณไม่อาจบอกกับใคร<br>ตกลงมาทีละหยด <em>จนคุณเปียกโดยไม่รู้ตัว</em>', delay: 1.0, hint: 4.5, lock: 1500 },
  { page: 'walk', stage: 3, copy: 'คุณเดินมาเรื่อยๆ.....<br>โดยไม่ได้คิดว่าจะไปไหน', delay: .6, hint: 2.4, lock: 1200 },
  { page: 'walk', stage: 4, copy: 'แล้วก็เห็นแสงไฟอุ่นๆ<br>อยู่ข้างทาง', delay: 1.7, hint: 5.5, lock: 2500 },
  { page: 'shop', copy: 'ร้านแผ่นเสียงเล็กๆ<br><em>ที่คุณไม่เคยสังเกต</em>', delay: .8, hint: 1.4, lock: 800, cta: true },
];
const LAST = STEPS.length - 1;

const $ = (id) => document.getElementById(id);
const screenEl = $('screen'), stack = $('stack'), progress = [...$('progress').children], copies = $('copies');
const hint = $('hint'), cta = $('cta'), toastEl = $('toast');

const pages = { rain: createRainPage(), hand: createHandPage(), walk: createWalkPage(), shop: createShopPage() };
Object.values(pages).forEach((p) => { stack.appendChild(p.el); p.mount?.(); });
const copyEls = STEPS.map((s) => { const d = document.createElement('div'); d.className = 'copy' + (s.small ? ' sm' : ''); d.innerHTML = s.copy; d.style.setProperty('--d', s.delay + 's'); copies.appendChild(d); return d; });

let cur = -1, hintTimer = 0, unlockAt = 0, leaveTimers = {};
function toast(m) { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('show'), 1800); }

function go(n) {
  n = Math.max(0, Math.min(LAST, n)); if (n === cur) return;
  const prev = cur >= 0 ? STEPS[cur] : null, nxt = STEPS[n];
  if (!prev || prev.page !== nxt.page) {
    if (prev) { const pp = pages[prev.page]; pp.el.classList.remove('on'); clearTimeout(leaveTimers[prev.page]); leaveTimers[prev.page] = setTimeout(() => pp.leave(), 750); }
    const np = pages[nxt.page]; clearTimeout(leaveTimers[nxt.page]); np.enter({ stage: nxt.stage }); np.el.classList.add('on');
  } else pages[nxt.page].setStage?.(nxt.stage);
  cur = n; audio.scene(nxt.page, nxt.stage); screenEl.classList.toggle('last', n === LAST);
  progress.forEach((p, i) => p.classList.toggle('on', i <= n));
  $('progress').setAttribute('aria-valuenow', n + 1);
  copyEls.forEach((c, i) => c.classList.toggle('on', i === n));
  hint.classList.remove('on'); cta.classList.remove('on'); clearTimeout(hintTimer);
  hintTimer = setTimeout(() => (nxt.cta ? cta : hint).classList.add('on'), (REDUCE ? .1 : nxt.hint) * 1000);
  unlockAt = performance.now() + (REDUCE ? 200 : nxt.lock);
}
const next = () => { if (cur < LAST && performance.now() >= unlockAt) { audio.tap(); go(cur + 1); } };
const back = () => { if (cur > 0) { audio.back(); go(cur - 1); } };

// แตะที่ไหนก็ได้บนจอ = ไปต่อ (ยกเว้นปุ่มด้านบนและปุ่ม CTA)
// ฝั่งซ้าย (1 ใน 3 ของจอ) = ย้อนกลับ · ที่เหลือฝั่งขวา = ไปต่อ
let heard = false;   // เบราว์เซอร์มือถือไม่ยอมเล่นเสียงจนกว่าจะแตะครั้งแรก → แตะแรกที่ฉาก 1 = เปิดเสียงฝนก่อน ยังไม่เปลี่ยนฉาก
screenEl.addEventListener('click', (e) => {
  audio.unlock();
  if (!heard) { heard = true; if (cur === 0 && !e.target.closest('.back, .skip, .cta, .sound')) return; }
  if (screenEl.classList.contains('in-shop')) return;
  if (e.target.closest('.back, .skip, .cta, .sound')) return;
  const r = screenEl.getBoundingClientRect(); (e.clientX - r.left < r.width / 3 ? back : next)();
});
const sndBtn = $('sound');
function paintSound() { sndBtn.setAttribute('aria-pressed', String(!audio.muted)); sndBtn.setAttribute('aria-label', audio.muted ? 'เปิดเสียง' : 'ปิดเสียง'); sndBtn.classList.toggle('off', audio.muted); }
sndBtn.addEventListener('click', () => { audio.unlock(); audio.setMuted(!audio.muted); paintSound(); });
paintSound();
$('back').addEventListener('click', () => { audio.unlock(); back(); });
$('skip').addEventListener('click', () => { if (cur < LAST) go(LAST); });
const talk = createShopFlow({ onExit: leaveShop }); screenEl.appendChild(talk.el);
function leaveShop() { talk.stop(); screenEl.classList.remove('in-shop'); cur = -1; go(0); }   // จบแล้วกลับหน้าแรก คำตอบถูกล้างแล้ว
function enterShop(from = 0) { audio.unlock(); screenEl.classList.add('in-shop'); window.dispatchEvent(new CustomEvent('prologue:done')); talk.start(from); }
cta.addEventListener('click', () => enterShop());
addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { if (e.target.closest?.('button')) return; e.preventDefault(); next(); } if (e.key === 'ArrowLeft') back(); });

/* ===== ลูปหลัก: ทุกหน้าใช้ rAF ตัวเดียว ===== */
function resize() { Object.values(pages).forEach((p) => p.resize?.()); }
addEventListener('resize', resize);
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.max(0, Math.min((now - last) / 1000, .05)); last = now;
  const s = STEPS[cur]; if (s) pages[s.page].tick(dt);
}

go(Math.max(0, Math.min(LAST, +param('step', 1) - 1)));
{ const t = +param('t', 0); const p = pages[STEPS[cur].page]; for (let k = 0; k < t * 60; k++) p.tick(1 / 60); }   // ?step=3&t=5 ข้ามไปดูช่วงนั้นเลย (ไว้ทดสอบ)
requestAnimationFrame(loop);
window.__prologue = { go, pages, talk, enterShop };
if (param('talk')) enterShop();   // ?talk=1 ข้ามไปฉากคุยเลย (ไว้ทดสอบ)
