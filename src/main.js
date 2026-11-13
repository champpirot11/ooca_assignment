import { createHome } from './pages/home.js';
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
  cur = n; audio.scene(nxt.page === 'shop' ? 'shopfront' : nxt.page, nxt.stage); screenEl.classList.toggle('last', n === LAST); screenEl.classList.toggle('first', n === 0);   // หน้าร้าน (ฉาก 5) ยังเป็นเพลงบทเกริ่น เพลงในร้านเริ่มตอนเข้าร้าน · ฉากแรกไม่มีปุ่มกลับ ฉากสุดท้ายไม่มีข้าม
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
screenEl.addEventListener('click', (e) => {
  audio.unlock();
  if (home.on) return;
  if (screenEl.classList.contains('in-shop')) return;
  if (e.target.closest('.back, .skip, .cta, .sound')) return;
  next();   // แตะตรงไหนก็ไปฉากต่อไป (ย้อนกลับใช้ปุ่ม <)
});
const sndBtn = $('sound');
function paintSound() { sndBtn.setAttribute('aria-pressed', String(!audio.muted)); sndBtn.setAttribute('aria-label', audio.muted ? 'เปิดเสียง' : 'ปิดเสียง'); sndBtn.classList.toggle('off', audio.muted); }
sndBtn.addEventListener('click', () => { audio.unlock(); audio.setMuted(!audio.muted); paintSound(); });
paintSound();
$('back').addEventListener('click', () => { audio.unlock(); back(); });
$('skip').addEventListener('click', () => { if (cur < LAST) go(LAST); });
const talk = createShopFlow({ onExit: leaveShop }); screenEl.appendChild(talk.el);
// หน้าแรก: กดปุ่ม = ปลดล็อกเสียง แล้วเริ่มบทเกริ่นฉาก 1 พร้อมเสียงฝน
// กดเริ่ม: จอค่อยๆ มืด → เข้าบทเกริ่นฉาก 1 → ค่อยๆ สว่าง
const blk = document.createElement('div'); blk.className = 'fadeblk'; screenEl.appendChild(blk);
let entering = false;
const home = createHome({ onEnter: () => { if (entering) return; entering = true; audio.unlock(); audio.scene('none'); blk.classList.add('on');
  setTimeout(() => { home.hide(true); resetPrologue(); go(0); audio.scene('none'); hp.classList.add('on'); screenEl.classList.add('notice'); setTimeout(() => { blk.classList.remove('on'); entering = false; }, 350); }, 1300); } });
// หน้าเตือนใส่หูฟัง: แตะแล้วข้อความจาง → ฉาก 1 เริ่มใหม่พร้อมเสียงฝนค่อยๆ ดังขึ้น
const hp = document.createElement('div'); hp.className = 'hp'; hp.setAttribute('role', 'button'); hp.setAttribute('aria-label', 'แตะเพื่อเริ่ม');
hp.innerHTML = `<div class="hp-ic"><svg aria-hidden="true" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M43.2464 20.5378C42.692 16.4903 40.6035 12.8864 37.3508 10.4283C36.7778 9.98473 35.8538 10.0956 35.4102 10.687C35.1884 10.9827 35.096 11.3524 35.1515 11.722C35.2069 12.0916 35.3917 12.4243 35.6874 12.6276C38.3488 14.6606 40.0676 17.5992 40.5296 20.9074C40.9917 24.2156 40.123 27.5238 38.09 30.1852C37.4062 31.0908 36.593 31.904 35.6874 32.5878C35.3917 32.8096 35.2069 33.1422 35.1515 33.5119C35.096 33.8815 35.2069 34.2511 35.4287 34.5284C35.6874 34.8795 36.1125 35.0828 36.5376 35.0828C36.8518 35.0828 37.129 34.9904 37.3693 34.8056C38.4782 33.9554 39.4762 32.9759 40.3078 31.867C42.7474 28.6327 43.8009 24.6037 43.2464 20.5378Z" fill="white"/>
<path d="M37.8867 22.6077C37.8867 19.7246 36.3712 17.0262 33.6174 15.0302C33.026 14.5867 32.1019 14.7345 31.6769 15.3444C31.4551 15.6401 31.3811 16.0097 31.4366 16.3794C31.492 16.749 31.6953 17.0632 31.991 17.285C34.0055 18.745 35.1329 20.6486 35.1329 22.6262C35.1329 24.6037 34.024 26.5073 32.0095 27.9674C31.7138 28.1892 31.5105 28.5033 31.4551 28.873C31.3996 29.2426 31.492 29.5938 31.6953 29.9079C31.9541 30.2591 32.3792 30.4809 32.8227 30.4809C33.1184 30.4809 33.3956 30.3885 33.6359 30.2221C36.3712 28.2076 37.8867 25.5093 37.8867 22.6077Z" fill="white"/>
<path d="M27.9627 4.34777C27.0941 3.47913 25.5786 3.47913 24.6914 4.34777L13.7318 15.3074H7.85466C5.56294 15.3074 3.69629 17.174 3.69629 19.4658V25.0103C3.69629 27.302 5.56294 29.1686 7.85466 29.1686H13.7503L24.7099 40.1283C25.1535 40.5718 25.7264 40.8121 26.3363 40.8121C26.9462 40.8121 27.5376 40.5718 27.9627 40.1283C28.3878 39.7032 28.628 39.1118 28.6465 38.5019V5.99263C28.6465 5.36426 28.4063 4.79133 27.9627 4.34777ZM25.8743 7.1385V37.3745L15.3028 26.803C15.044 26.5442 14.6929 26.3964 14.3232 26.3964H7.85466C7.09691 26.3964 6.46854 25.768 6.46854 25.0103V19.4658C6.46854 18.708 7.09691 18.0796 7.85466 18.0796H14.3232C14.6929 18.0796 15.044 17.9318 15.3028 17.673L25.8743 7.1385Z" fill="white"/>
</svg><svg aria-hidden="true" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M22.1781 5.35986C17.3746 5.35986 12.7678 7.26805 9.37119 10.6646C5.97459 14.0612 4.06641 18.668 4.06641 23.4715V34.3385C4.06641 35.5737 4.55708 36.7583 5.43049 37.6317C6.3039 38.5051 7.4885 38.9958 8.72369 38.9958H10.7936C12.0288 38.9958 13.2134 38.5051 14.0868 37.6317C14.9602 36.7583 15.4509 35.5737 15.4509 34.3385V27.0938C15.4509 25.8587 14.9602 24.6741 14.0868 23.8007C13.2134 22.9272 12.0288 22.4366 10.7936 22.4366H8.72369C8.18275 22.4393 7.67218 22.5256 7.19196 22.6953C7.39377 18.857 9.06067 15.2424 11.849 12.5968C14.6373 9.95125 18.3344 8.47643 22.1781 8.47643C26.0217 8.47643 29.7188 9.95125 32.5071 12.5968C35.2955 15.2424 36.9624 18.857 37.1642 22.6953C36.6712 22.5258 36.1537 22.4384 35.6324 22.4366H33.5625C32.3273 22.4366 31.1427 22.9272 30.2693 23.8007C29.3959 24.6741 28.9052 25.8587 28.9052 27.0938V34.3385C28.9052 35.5737 29.3959 36.7583 30.2693 37.6317C31.1427 38.5051 32.3273 38.9958 33.5625 38.9958H35.6324C36.8676 38.9958 38.0522 38.5051 38.9256 37.6317C39.799 36.7583 40.2897 35.5737 40.2897 34.3385V23.4715C40.2897 21.0931 39.8212 18.7379 38.911 16.5405C38.0009 14.3431 36.6668 12.3465 34.9849 10.6646C33.3031 8.98282 31.3065 7.64873 29.1091 6.73853C26.9117 5.82833 24.5565 5.35986 22.1781 5.35986ZM37.1849 27.0649V34.3385C37.1849 34.7502 37.0213 35.1451 36.7302 35.4362C36.439 35.7274 36.0442 35.8909 35.6324 35.8909H33.5625C33.1508 35.8909 32.7559 35.7274 32.4648 35.4362C32.1737 35.1451 32.0101 34.7502 32.0101 34.3385V27.0938C32.0101 26.6821 32.1737 26.2873 32.4648 25.9961C32.7559 25.705 33.1508 25.5414 33.5625 25.5414H35.6324C36.0392 25.5413 36.4297 25.7009 36.72 25.9858C37.0104 26.2707 37.1773 26.6582 37.1849 27.0649ZM10.7936 25.5414C11.2053 25.5414 11.6002 25.705 11.8913 25.9961C12.1825 26.2873 12.346 26.6821 12.346 27.0938V34.3385C12.346 34.7502 12.1825 35.1451 11.8913 35.4362C11.6002 35.7274 11.2053 35.8909 10.7936 35.8909H8.72369C8.31196 35.8909 7.91709 35.7274 7.62596 35.4362C7.33482 35.1451 7.17126 34.7502 7.17126 34.3385V27.0938C7.17126 26.6821 7.33482 26.2873 7.62596 25.9961C7.91709 25.705 8.31196 25.5414 8.72369 25.5414H10.7936Z" fill-rule="evenodd" clip-rule="evenodd" fill="white"/>
</svg></div>
  <b>เปิดเสียง หรือใส่หูฟังไว้จะดีที่สุด</b><p>ใช้เวลาประมาณ 5–10 นาที<br>ข้อมูลทุกอย่างอยู่ในเครื่องคุณเท่านั้น ไม่ถูกส่งไปไหน</p><small>แตะเพื่อไปต่อ</small>`;
screenEl.appendChild(hp);
hp.addEventListener('click', (e) => { e.stopPropagation(); if (!hp.classList.contains('on')) return; audio.unlock(); hp.classList.remove('on'); screenEl.classList.remove('notice'); resetPrologue(); go(0); });
screenEl.appendChild(home.el); home.mount();
// หน้าแรก: แตะตรงไหนก็ได้ครั้งแรก = เปิดเสียงฝนข้างนอก + เพลงในร้าน (เบราว์เซอร์ไม่ให้เล่นเสียงก่อนแตะ)
home.el.addEventListener('pointerdown', () => { if (entering || !home.on) return; audio.unlock(); if (!home.heard) { home.heard = true; audio.scene('home'); } }, { capture: true });
const startHome = !(param('step', 0) || param('talk', 0) || param('song', 0)); if (!startHome) home.hide();
// หน้าแรกมีเสียงฝน + เพลงร้านเหมือนในร้าน: ลองเล่นทันที (บางเบราว์เซอร์อนุญาต) ถ้าถูกบล็อก เสียงจะขึ้นเองตอนแตะครั้งแรก + มีป้าย "แตะเพื่อเปิดเสียง" บอกไว้
const snd = document.createElement('button'); snd.className = 'hm-snd'; snd.setAttribute('aria-label', 'แตะเพื่อเปิดเสียง');
snd.innerHTML = `<svg aria-hidden="true" viewBox="0 0 45 45"><path fill="currentColor" d="M27.96 4.35c-.87-.87-2.38-.87-3.27 0L13.73 15.3H7.85a4.16 4.16 0 0 0-4.16 4.16v5.55a4.16 4.16 0 0 0 4.16 4.16h5.9l10.96 10.96a2.28 2.28 0 0 0 3.89-1.63V5.99c0-.63-.24-1.2-.68-1.64ZM25.87 7.14v30.24L15.3 26.8a1.4 1.4 0 0 0-.98-.4H7.85c-.76 0-1.38-.63-1.38-1.39v-5.54c0-.76.62-1.39 1.38-1.39h6.47c.37 0 .72-.15.98-.4L25.87 7.13ZM37.89 22.6c0-2.88-1.52-5.58-4.27-7.57a1.4 1.4 0 0 0-1.94.31 1.4 1.4 0 0 0 .31 1.94c2.02 1.46 3.14 3.36 3.14 5.34s-1.1 3.88-3.12 5.34a1.4 1.4 0 0 0-.31 1.94c.26.35.68.57 1.13.57.3 0 .57-.09.81-.26 2.74-2.01 4.25-4.71 4.25-7.61Z"/></svg><span>แตะเพื่อเปิดเสียง</span>`;
home.el.appendChild(snd); snd.addEventListener('click', () => audio.unlock());
if (startHome) { audio.unlock(); audio.scene('home'); home.heard = true; }
setInterval(() => snd.classList.toggle('off', audio.running || audio.muted || !home.on), 300);
function resetPrologue() { Object.values(pages).forEach((p) => { p.el.classList.remove('on'); p.leave?.(); }); copyEls.forEach((c) => c.classList.remove('on')); hint.classList.remove('on'); cta.classList.remove('on'); clearTimeout(hintTimer); cur = -1; }
function leaveShop() { talk.stop(); screenEl.classList.remove('in-shop'); resetPrologue(); home.show(); home.heard = true; audio.scene('home'); }   // จบแล้วกลับหน้าแรก   // จบแล้วกลับหน้าแรก คำตอบถูกล้างแล้ว
function enterShop(from = 0) { audio.unlock(); screenEl.classList.add('in-shop'); window.dispatchEvent(new CustomEvent('prologue:done')); talk.start(from); }
cta.addEventListener('click', () => enterShop());
addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { if (e.target.closest?.('button')) return; e.preventDefault(); next(); } if (e.key === 'ArrowLeft') back(); });

/* ===== ลูปหลัก: ทุกหน้าใช้ rAF ตัวเดียว ===== */
function resize() { Object.values(pages).forEach((p) => p.resize?.()); home.resize(); }
addEventListener('resize', resize);
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.max(0, Math.min((now - last) / 1000, .05)); last = now;
  if (home.on) { home.tick(dt); return; }
  const s = STEPS[cur]; if (s) pages[s.page].tick(dt);
}

if (!startHome) go(Math.max(0, Math.min(LAST, +param('step', 1) - 1)));
if (cur >= 0) { const t = +param('t', 0); const p = pages[STEPS[cur].page]; for (let k = 0; k < t * 60; k++) p.tick(1 / 60); }   // ?step=3&t=5 ข้ามไปดูช่วงนั้นเลย (ไว้ทดสอบ)
requestAnimationFrame(loop);
window.__prologue = { go, pages, talk, enterShop };
if (param('talk') || param('song')) enterShop();   // ?talk=1 ข้ามไปฉากคุยเลย (ไว้ทดสอบ)
