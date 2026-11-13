// ในร้านแผ่นเสียง ooca - ฟังใจ: ฉาก ตัวละคร หน้าจอ ทั้งหมดออกแบบโดย Panupong (Figma)
// โค้ดนี้ทำเฉพาะการเคลื่อนไหว กล้อง เสียง และการโต้ตอบ
//  • ฉากยาว 1610×1036 ภาพเดียว กล้องเลื่อนตามมาสคอต และซูมเข้า/ออกตามความสูงของกล่องขาว
//  • มาสคอตเปลี่ยนท่าด้วยการเฟด เดินด้านข้างเมื่อย้ายจุด
//  • คำตอบทั้งหมดอยู่ในหน่วยความจำของหน้านี้เท่านั้น ไม่ถูกส่งออกไปไหน
import sceneUrl from '../art/shop/scene.svg?url';
import facesUrl from '../art/shop/faces.svg?url';
import logoUrl from '../art/shop/ooca-logo.svg?url';
// ปกแผ่นเสียง 8 มู้ด (ออกแบบโดย Panupong) — ชื่อไฟล์ cover-<มู้ด>.svg
const COVER = Object.fromEntries(Object.entries(import.meta.glob('../art/covers/cover-*.svg', { eager: true, query: '?url', import: 'default' })).map(([k, v]) => [k.match(/cover-(\w+)\.svg/)[1], v]));
import { audio } from '../lib/audio.js';
import { REDUCE, clamp } from '../lib/util.js';
import { createRain } from '../lib/rain.js';
import { TOPICS, RAIN, SONGS, MOODS, TRACK, HEART, ACTION, batteryReply, pickMood, LINKS, isRisk } from './shopdata.js';
import { saveReceipt } from './receipt-image.js';
import walkSvg from '../art/shop/src-svg/m-walk.svg?raw';
// ท่าเดิน: ใช้ SVG ตัวจริงเพื่อขยับขาได้ (2 path แรกในไฟล์คือขา)
const WALK = walkSvg.replace(/<svg[^>]*>/, (t) => t.replace(/ width="[^"]*"| height="[^"]*"/g, '')).replace('<path ', '<path class="leg leg1" ').replace(/(<path class="leg leg1"[^>]*>[\s\S]*?)<path /, '$1<path class="leg leg2" ');

const POSE_URL = import.meta.glob('../art/shop/m-*.webp', { eager: true, query: '?url', import: 'default' });
// ท่า: [กว้างในฉาก, สัดส่วนสูง/กว้างของไฟล์, จุดยืน x (0..1), จุดยืน y (0..1)]
// จุดยืน y = ตำแหน่งเท้าในไฟล์ (วัดจากภาพจริง) เพื่อให้เท้าแตะพื้นพอดี ไม่ลอย/ไม่จม
// ขนาด/จุดกึ่งกลาง ปรับให้หัวมาสคอตกว้างเท่ากันทุกท่า (วัดจากภาพ) และกึ่งกลางหัวอยู่จุดเดียวกัน → ตอนเฟดเปลี่ยนท่าตัวซ้อนกันพอดี ไม่เลื่อน
// [ความกว้างในฉาก, สัดส่วน สูง/กว้าง, จุดกึ่งกลางแนวนอน (0–1), ระดับเท้า (0–1)]
const POSE = {
  sit: [220, 152 / 220, 0, 0], stand: [286, 234 / 263, .497, .99], care: [286, 234 / 263, .497, .99], wave: [239, 199 / 200, .51, .99],
  towel: [236, 199 / 200, .491, .99], find: [238, 230 / 200, .506, .98], found1: [218, 220 / 200, .502, .975], found2: [220, 239 / 200, .49, .9],
  listen: [244, 234 / 200, .536, .978], umbrella: [400, 354 / 378, .67, .99], confuse: [236, 210 / 200, .52, .98], walk: [218, 223 / 200, .502, .975],
};
// ความกว้างช่วงเท้าของแต่ละท่า (วัดจากภาพ) ใช้กำหนดขนาดเงาให้เท่ากันทุกท่า
const FEET = { stand: .25, care: .25, wave: .32, towel: .3, find: .3, found1: .33, found2: .33, listen: .33, umbrella: .2, confuse: .27, walk: .34 };
const COUNTER_TOP = 401;   // ขอบบนเคาน์เตอร์ในฉาก (ตอนนั่งอยู่หลังเคาน์เตอร์ ส่วนที่ต่ำกว่านี้ถูกเคาน์เตอร์บัง)
const SEG = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'grapheme' }) : null;
const graphemes = (t) => (SEG ? [...SEG.segment(t)].map((x) => x.segment) : Array.from(t));
const wait = (ms) => new Promise((r) => setTimeout(r, REDUCE ? Math.min(ms, 120) : ms));
const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createShopFlow({ onExit } = {}) {
  const el = document.createElement('section');
  el.className = 'sf'; el.setAttribute('aria-label', 'ในร้านแผ่นเสียง ooca ฟังใจ');
  el.innerHTML = `
    <div class="sf-view"><div class="sf-world" id="world">
      <img class="sf-scene" src="${sceneUrl}" alt="" draggable="false">
      <div class="sf-desk" id="desk"></div><div class="sf-notes" id="notes"></div>
      <img class="sf-sit" id="sitimg" src="${POSE_URL['../art/shop/m-sit.webp']}" alt="" draggable="false">
      <div class="sf-masc" id="masc"><i class="sf-shadow"></i><div class="sf-body" id="body">${Object.keys(POSE).filter((k) => k !== 'sit').map((k) => k === 'walk' ? `<div class="svgp" data-p="walk">${WALK}</div>` : `<img data-p="${k}" src="${POSE_URL[`../art/shop/m-${k}.webp`]}" alt="" draggable="false">`).join('')}</div></div>
    </div><canvas class="sf-rainc" id="rainc"></canvas><div class="sf-dim" id="dim"></div></div>
    <button class="sf-help" id="help">อยากคุยกับใครสักคน</button>
    <div class="sf-bubble" id="bubble" aria-live="polite"><b>ooca:</b><p id="btext"></p></div>
    <div class="sf-sheet" id="sheet"><div class="sf-in" id="sin"><div class="sf-top" id="top"></div><div class="sf-embed" id="embed" hidden></div><div class="sf-dyn" id="dyn"></div></div></div>
    <div class="sf-modal" id="modal" hidden></div>`;
  const $ = (s) => el.querySelector(s);
  const world = $('#world'), sitImg = $('#sitimg'), masc = $('#masc'), shadow = el.querySelector('.sf-shadow'), body = $('#body'), bubble = $('#bubble'), btext = $('#btext'), sheet = $('#sheet'), sin = $('#sin'), dyn = $('#dyn'), embed = $('#embed'), top = $('#top'), modal = $('#modal');
  const st = { topics: [], rain: null, battery: null, songs: [], note: '', heavy: false, mood: null };
  let alive = false, run = 0, kb = 0;
  const U = () => el.clientWidth / 390;

  /* ---------- กล้อง + มาสคอต ---------- */
  const m = { x: 120, y: 418, pose: 'sit', flip: 1 }; const cam = { boost: 1, dx: 0, fy: 0, dur: 1500 }; let S = 1, ox = 0, oy = 0, side = false;   // ทุกอย่างช้าๆ นุ่มๆ
  function layout(dur = cam.dur) {
    const u = U(), W = el.clientWidth, H = el.clientHeight, sh = sin.offsetHeight; sheet.style.height = sh + 'px';
    const sceneH = Math.max(120 * u, H - sh - kb + 20 * u);
    // กล่องขาวสูง → ซูมฉากออกให้ตัว + บับเบิ้ลยังพอดีในพื้นที่ที่เหลือ (บับเบิ้ลไม่บังตัว)
    // ถ้าที่เหลือเตี้ยจนวางบับเบิ้ลเหนือหัวไม่ได้ → โหมดข้าง: ตัวชิดซ้าย บับเบิ้ลอยู่ข้างตัว
    const zTop = (sceneH / u - 150) / 250; side = zTop < .45;
    const z = clamp(Math.min((.25 + sceneH / u / 950) * cam.boost, side ? (sceneH / u - 64) / 250 : zTop), .28, 1.3); S = z * u;
    ox = clamp(W * (side ? .26 : .5) - (m.x + (side ? 0 : cam.dx)) * S, W - 1610 * S, 0); oy = Math.min(.93 * sceneH - (cam.fy || m.y) * S, 0);
    world.style.transitionDuration = (REDUCE ? 0 : dur) + 'ms'; world.style.transform = `translate(${ox}px,${oy}px) scale(${S})`;
    el.style.setProperty('--kb', kb + 'px'); placeBubble(dur);
  }
  function placeBubble(dur = 0) {
    const u = U(), W = el.clientWidth, [w, r, , ay] = POSE[m.pose], top = oy + (m.y - w * r * ay) * S, sx = ox + (m.pose === 'sit' ? 122 : m.x) * S;
    bubble.classList.toggle('side', side); bubble.style.maxWidth = side ? Math.max(150 * u, W - (sx + 112 * S) - 22 * u) + 'px' : '';
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight; let left, y;
    if (side) { left = Math.min(sx + 112 * S + 10 * u, W - bw - 12 * u); y = Math.max(56 * u, Math.min(top + 30 * S, el.clientHeight - sin.offsetHeight - kb - bh - 10 * u)); }
    else { left = clamp(sx - bw * .4, 12 * u, W - bw - 12 * u); y = Math.max(56 * u, top - bh - 6 * u); }
    bubble.style.transitionDuration = (REDUCE ? 0 : dur) + 'ms'; bubble.style.transform = `translate(${left}px,${y}px)`; bubble.style.setProperty('--tail', clamp(sx - left, 26 * u, bw - 26 * u) + 'px');
  }
  new ResizeObserver(() => alive && layout(1100)).observe(sin); addEventListener('resize', () => alive && layout(0));
  // แป้นพิมพ์มือถือ: ยกกล่องขาวตามแป้น · หุบแป้นแล้วต้องกลับลงที่เดิม (iOS บางทีไม่ส่ง resize ตอนหุบ → เช็กซ้ำตอน blur/scroll ด้วย)
  function readKb() { const v = window.visualViewport; let k = v ? Math.max(0, innerHeight - v.height - v.offsetTop) : 0; if (k < 80 || !el.querySelector('textarea:focus, input:focus')) k = 0; if (k !== kb) { kb = k; if (alive) layout(220); } }
  if (window.visualViewport) { visualViewport.addEventListener('resize', readKb); visualViewport.addEventListener('scroll', readKb); }
  el.addEventListener('focusout', () => { setTimeout(() => { readKb(); if (!kb) window.scrollTo(0, 0); }, 60); setTimeout(readKb, 400); });
  el.addEventListener('focusin', () => setTimeout(readKb, 350));
  function placeMasc(dur = 0) { masc.style.transitionDuration = dur + 'ms'; masc.style.left = m.x + 'px'; masc.style.top = m.y + 'px'; }
  function pose(p, flip = m.flip) {
    m.pose = p; m.flip = flip;   // ทิศหันเก็บไว้ที่แต่ละภาพ → ภาพเก่าที่กำลังจางไม่พลิกกลับ/วาป
    body.querySelectorAll('[data-p]').forEach((im) => { const on = im.dataset.p === p; im.classList.toggle('on', on); if (on) {
      const [w, r, ax, ay] = POSE[p], h = w * r, clip = 0;
      im.style.cssText = `--flip:${flip};width:${w}px;left:${-w * (flip < 0 ? 1 - ax : ax)}px;top:${-h * ay}px;${clip ? `clip-path:inset(0 0 ${clip}px 0)` : ''}`; }});
    sitImg.classList.toggle('on', p === 'sit');   // ภาพนั่งหลังเคาน์เตอร์อยู่กับที่ในฉาก แค่เฟดเข้า/ออก
    body.classList.toggle('sit', p === 'sit'); placeBubble(500);
    const sw = POSE[p][0] * (FEET[p] || .3) * 1.35; Object.assign(shadow.style, { width: sw + 'px', height: sw * .2 + 'px', left: -sw / 2 + 'px', top: -sw * .1 + 'px' });
  }
  const hop = () => {};   // ไม่กระโดดแล้ว เปลี่ยนท่าด้วยการเฟดอย่างเดียว ให้นิ่งและสบายตา
  async function walkTo(x, y, endPose = 'stand') {
    const d = Math.hypot(x - m.x, y - m.y); if (d < 8) { pose(endPose, 1); return; }
    if (m.pose === 'sit') { say.hide(); m.x = x; m.y = y; placeMasc(0); pose(endPose, 1); layout(1800); await wait(1500); return; }   // จากท่านั่ง (กดข้าม) → เฟดไปที่ใหม่ช้าๆ ไม่เดินลงมา
    const dur = REDUCE ? 50 : clamp(d * 11, 2600, 6200), my = run; say.hide();
    pose('walk', x < m.x ? -1 : 1); body.classList.add('walking'); m.x = x; m.y = y; placeMasc(dur); layout(dur);
    const steps = setInterval(() => audio.fx('foot'), 700); await wait(dur); clearInterval(steps);
    body.classList.remove('walking'); if (my === run) pose(endPose, 1);
  }

  /* ---------- บับเบิลคำพูด ---------- */
  let typing = null, skipType = false, idleT = 0;
  // พิมพ์ทีละตัว แต่กล่องมีขนาดเต็มตั้งแต่แรก (ข้อความที่ยังไม่ขึ้นถูกซ่อนไว้) กล่องจึงไม่ขยาย/กระโดด
  // ถ้ามีคำพูดใหม่มาแทรก คำพูดเก่าหยุดทันที (กันตัวอักษรสองประโยคปนกัน)
  let sayId = 0;
  async function say(text, { hold = 0 } = {}) {
    const my = run, id = ++sayId, wasOn = bubble.classList.contains('on'), g = graphemes(text);
    btext.innerHTML = '<span class="t"></span><span class="r"></span>'; const t = btext.firstChild, r = btext.lastChild; r.textContent = text;
    bubble.classList.add('on'); placeBubble(wasOn ? 700 : 0); body.classList.add('speak'); skipType = false;
    typing = (async () => { for (let i = 0; i < g.length; i++) { if (my !== run || id !== sayId) return; if (skipType || REDUCE) { t.textContent = text; r.textContent = ''; break; }
      t.textContent += g[i]; r.textContent = g.slice(i + 1).join(''); if (i % 2 === 0 && g[i].trim()) audio.blip(i); await wait(g[i] === '\n' ? 340 : 58); } })();
    await typing; if (id !== sayId) return; body.classList.remove('speak'); typing = null;
    if (hold) { skipType = false; const t0 = performance.now(); while (performance.now() - t0 < hold && !skipType && my === run && id === sayId) await wait(60); }
  }
  say.hide = () => { sayId++; bubble.classList.remove('on'); body.classList.remove('speak'); };
  el.addEventListener('pointerdown', (e) => { audio.unlock(); if (!e.target.closest('button, a, textarea, .sf-paper, .sf-batt, .sf-opt, iframe')) skipType = true; nudge(); });
  function nudge() { clearTimeout(idleT); idleT = setTimeout(async () => { if (!alive || typing || !dyn.querySelector('.sf-q')) return; const p = m.pose; pose('confuse'); await say('ไม่ต้องรีบนะครับ\nค่อยๆ คิดได้เลย', { hold: 2600 }); if (m.pose === 'confuse') pose(p); }, 30000); }

  /* ---------- กล่องขาว ---------- */
  const DOTS = '<span class="sf-dots"><i></i><i></i><i></i></span>';
  // เปลี่ยนเนื้อหากล่องขาว: ของเก่าค่อยๆ จาง ของใหม่ค่อยๆ ขึ้น (ไม่วาป)
  function swapOut() {
    if (dyn.childElementCount && !REDUCE) { const g = dyn.cloneNode(true); g.removeAttribute('id'); g.querySelectorAll('[id]').forEach((x) => x.removeAttribute('id')); g.className = dyn.className + ' sf-ghost';
      Object.assign(g.style, { left: dyn.offsetLeft + 'px', top: dyn.offsetTop + 'px', width: dyn.offsetWidth + 'px' }); sin.appendChild(g); setTimeout(() => g.remove(), 500); }
    dyn.style.animation = 'none'; void dyn.offsetWidth; dyn.style.animation = '';
  }
  function setSheet({ hint = '', html = '', btn = null, skip = '', cls = '', back = false } = {}) {
    swapOut(); dyn.className = 'sf-dyn ' + cls;
    const bk = back ? '<button class="sf-back" data-r="back" aria-label="กลับข้อก่อนหน้า"><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>' : '';
    dyn.innerHTML = `${hint || back ? `<div class="sf-hrow">${bk}<p class="sf-hint" id="hint">${hint}</p></div>` : ''}${html}<button class="sf-btn" id="sfgo" disabled>${DOTS}</button>${skip ? `<button class="sf-skip" id="sfskip">${skip}</button>` : ''}`;
    if (btn !== null) setBtn(btn);
  }
  function setBtn(label, ok = true) { const b = dyn.querySelector('#sfgo'); if (!b) return; b.innerHTML = label ? esc(label) : DOTS; b.disabled = !label || !ok; b.classList.toggle('ready', !!label && ok); }
  const press = () => new Promise((res) => { const my = run, h = (e) => { const b = e.target.closest('#sfgo:not(:disabled), #sfskip, [data-r]'); if (!b || my !== run) return; dyn.removeEventListener('click', h);
      if (b.id === 'sfgo') { b.innerHTML = DOTS; b.disabled = true; b.classList.remove('ready'); }   // กดแล้วเป็นปุ่มโหลดทันที รู้ว่ากดไปแล้ว
      audio.fx(b.id === 'sfskip' || b.dataset.r === 'back' ? 'type' : 'soft'); res(b.id === 'sfgo' ? 'go' : b.id === 'sfskip' ? 'skip' : b.dataset.r); }; dyn.addEventListener('click', h); });
  const toScreen = (wx, wy) => [ox + wx * S, oy + wy * S];

  /* ---------- ลำดับเรื่อง ---------- */
  async function intro() {
    cam.boost = 1; cam.dx = 75; cam.fy = 622; m.x = 20; m.y = 258; placeMasc(); pose('sit', 1); setSheet({ skip: 'ข้ามบทสนทนา' }); layout(0);
    const skipP = press(); let skipped = false; skipP.then((r) => { if (r === 'skip') { skipped = true; skipType = true; } });
    const line = async (t, hold = 2300) => { if (!skipped) await say(t, { hold }); };
    await wait(500); await line('ยินดีต้อนรับสู่\nร้านแผ่นเสียงฟังใจครับ'); await line('ฝนในใจคุณตกหนักมากเลย\nเข้ามานั่งพักก่อนสิครับ', 0);
    if (!skipped) { setBtn('นั่งพัก'); await skipP.then((r) => r === 'go' && null); }
    if (!skipped) { const p2 = (setSheet({ skip: 'ข้ามบทสนทนา' }), press()); p2.then((r) => { if (r === 'skip') { skipped = true; skipType = true; } });
      say.hide(); m.x = 200; m.y = 625; cam.dx = 0; cam.fy = 0; placeMasc(0); pose('towel'); hop(); layout(1600); audio.fx('cloth'); await wait(900);
      await line('นี่ครับผ้าเช็ดตัว', 0); if (!skipped) { setBtn('รับผ้าเช็ดตัว'); await p2; }
      if (!skipped) { const p3 = (setSheet({ skip: 'ข้ามบทสนทนา' }), press()); p3.then((r) => { if (r === 'skip') { skipped = true; skipType = true; } });
        audio.fx('cloth'); pose('stand'); hop(); await line('ช่วงนี้คงจะเจออะไรมาเยอะเลยสินะ'); await line('เบนสายตาจากความกดดัน\nแล้วปล่อยใจให้เต้นไปตามจังหวะที่แผ่วเบา'); await line('ผมขอลองช่วยหาเพลงที่บรรเทา\nสิ่งที่คุณแบกรับอยู่ตอนนี้ดูนะครับ', 0);
        if (!skipped) { setBtn('ตอบคำถาม'); await p3; } } }
  }

  // ตำแหน่งวางกระดาษบนเคาน์เตอร์ฝั่งซ้าย (ไม่โดนตัวมาสคอตบัง) · ขนาดเล็กพอดีโต๊ะ
  const PW = 19, SLOT = [[72, 409], [96, 407], [120, 410], [84, 417], [108, 418], [132, 416], [64, 418], [142, 408], [100, 413]];
  async function q1() {
    cam.dx = 0; cam.fy = 0; await walkTo(249, 625, 'wave'); const desk = $('#desk');
    setSheet({ cls: 'sf-q', hint: 'แตะกระดาษเพื่อฉีกให้ ooca', html: `<div class="sf-papers" id="papers">${TOPICS.map((t, i) => `<button class="sf-paper" data-i="${i}" style="--k:${t.k}" aria-pressed="${st.topics.includes(i)}"><span class="pp"><b>${t.label}</b><i></i><i></i><i></i></span><span class="ph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 8H5V4M5 8a8 8 0 111 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span></button>`).join('')}</div>`, btn: '', skip: 'ข้ามข้อนี้' });
    setBtn('ไปต่อ 1/5', st.topics.length > 0); say('ช่วงนี้หนักใจเรื่องอะไรอยู่บ้างครับ\nฉีกกระดาษฝากไว้กับผมได้เลย');
    const papers = dyn.querySelector('#papers'), my = run; let said = st.topics.length > 0;
    // เลื่อนด้านข้าง: นิ้วปัดได้ปกติ + เมาส์ลากได้ + ล้อเมาส์ได้
    papers.addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { papers.scrollBy({ left: e.deltaY * 1.4, behavior: 'smooth' }); e.preventDefault(); } }, { passive: false });
    let drag = null, dragged = false;
    papers.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; drag = { x: e.clientX, l: papers.scrollLeft }; dragged = false; });
    addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) { dragged = true; papers.classList.add('drag'); } if (dragged) papers.scrollLeft = drag.l - dx; });
    addEventListener('pointerup', () => { drag = null; papers.classList.remove('drag'); });
    papers.addEventListener('click', (e) => { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);
    papers.onclick = (e) => {
      const b = e.target.closest('.sf-paper'); if (!b || my !== run || b.classList.contains('busy')) return; const i = +b.dataset.i, t = TOPICS[i], on = !st.topics.includes(i);
      const r = b.getBoundingClientRect(), R = el.getBoundingClientRect(), k = st.topics.length;
      if (on) {
        st.topics.push(i); b.setAttribute('aria-pressed', 'true'); b.classList.add('busy'); audio.fx('tear');
        const [wx, wy] = SLOT[i], rot = ((i * 59) % 13 - 6) * 3, [tx, ty] = toScreen(wx, wy);
        const fly = document.createElement('div'); fly.className = 'sf-fly'; fly.style.cssText = `left:${r.left - R.left}px;top:${r.top - R.top}px;width:${r.width}px;height:${r.height}px;--k:${t.k}`; fly.innerHTML = b.querySelector('.pp').outerHTML; el.appendChild(fly);
        const sc = PW * S / r.width, ddx = tx - (r.left - R.left) - r.width / 2, ddy = ty - (r.top - R.top) - r.height / 2, D = REDUCE ? 1 : 1500;
        // ยกขึ้นนิดหนึ่ง → ลอยเป็นโค้งไปหาเคาน์เตอร์ → ค่อยๆ จางหาย แล้วกระดาษบนโต๊ะค่อยๆ ปรากฏ
        fly.animate([{ transform: 'translate(0,0) rotate(0) scale(1)', opacity: 1 }, { transform: `translate(${ddx * .12}px,${-46 * U()}px) rotate(-4deg) scale(1.04)`, opacity: 1, offset: .22 }, { transform: `translate(${ddx * .7}px,${ddy * .62}px) rotate(${rot * .7}deg) scale(${(1 + sc) / 2.2})`, opacity: .9, offset: .7 }, { transform: `translate(${ddx}px,${ddy}px) rotate(${rot}deg) scale(${sc})`, opacity: 0 }], { duration: D, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'forwards' }).onfinish = () => { fly.remove(); b.classList.remove('busy'); };
        setTimeout(() => { if (!st.topics.includes(i) || my !== run) return; const d = document.createElement('div'); d.className = 'sf-dp'; d.dataset.i = i; d.style.cssText = `left:${wx}px;top:${wy}px;--r:${rot}deg;--k:${t.k};--s:${PW / (114 * U())}`; d.innerHTML = b.querySelector('.pp').outerHTML; desk.appendChild(d); requestAnimationFrame(() => d.classList.add('on')); audio.fx('land'); hop(); }, D * .66);
        if (!said) { said = true; say('ผมจะเก็บไว้ให้ดี ไม่บอกใครแน่นอน'); } else audio.pick(k + 1);
      } else { st.topics = st.topics.filter((x) => x !== i); b.setAttribute('aria-pressed', 'false'); const d = desk.querySelector(`[data-i="${i}"]`); if (d) { d.classList.remove('on'); setTimeout(() => d.remove(), 700); } audio.fx('type'); }
      setBtn('ไปต่อ 1/5', st.topics.length > 0);
    };
    if (await press() === 'skip') { st.topics = []; desk.innerHTML = ''; }
  }

  async function q2() {
    await walkTo(456, 640, 'stand');
    setSheet({ cls: 'sf-q', back: true, hint: 'เลือกระดับความแรงของฝน', html: `<div class="sf-faces">${RAIN.map((r, i) => `<button class="sf-face" data-i="${i}" style="--c:${r.c};--k:${r.k};--fx:${-r.fx}" aria-pressed="${st.rain === i}"><i style="background-image:url(${facesUrl})"></i><span>${r.label}</span></button>`).join('')}</div>`, btn: '', skip: 'ข้ามข้อนี้' });
    setBtn('ไปต่อ 2/5', st.rain !== null); say('ฝนในใจคุณตกหนักแค่ไหน'); const my = run;
    const apply = (i) => { const r = RAIN[i]; rainTo(r.lv); audio.room(.3 + r.lv * .6, 900 + r.lv * 2600); $('#dim').style.opacity = r.lv * .2; };
    if (st.rain !== null) { apply(st.rain); pose('umbrella', -1); cam.dx = 70; layout(1500); }
    dyn.querySelector('.sf-faces').onclick = (e) => {
      const b = e.target.closest('.sf-face'); if (!b || my !== run) return; const i = +b.dataset.i, r = RAIN[i]; if (st.rain === i) return; st.rain = i;
      dyn.querySelectorAll('.sf-face').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); audio.fx('face', i); apply(i);
      if (m.pose !== 'umbrella') { pose('umbrella', -1); cam.dx = 70; layout(1500); } hop(); say(r.reply); setBtn('ไปต่อ 2/5', true);
    };
    const res = await press(); if (res === 'skip') st.rain = null;
    rainTo(0); $('#dim').style.opacity = 0; audio.room(.45, 1500); if (m.pose === 'umbrella') { pose('stand', 1); cam.dx = 0; layout(1500); }
    return res;
  }

  async function q3() {
    await walkTo(456, 640, 'stand');
    const HINT = 'เลือกระดับแบตเตอรี่ในใจคุณ';
    setSheet({ cls: 'sf-q', back: true, hint: HINT, html: `<div class="sf-batt" id="batt" role="slider" aria-label="แบตเตอรี่ในใจ" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><div class="cells">${'<i></i>'.repeat(10)}</div><b></b></div>`, btn: '', skip: 'ข้ามข้อนี้' });
    setBtn('ไปต่อ 3/5', false); say('แบตเตอรี่ในใจคุณเหลืออยู่เท่าไหร่ครับ'); const batt = dyn.querySelector('#batt'), cells = [...batt.querySelectorAll('i')], hint = dyn.querySelector('#hint'), my = run; let lastSaid = -1, sayT = 0, cur = -1;
    const set = (v, quiet) => { v = clamp(Math.round(v), 0, 10); if (cur === v) return; cur = v; st.battery = v * 10; cells.forEach((c, i) => c.classList.toggle('on', i < v));
      batt.dataset.tone = v <= 2 ? 'low' : v <= 5 ? 'mid' : 'ok'; batt.classList.toggle('has', v > 0); batt.setAttribute('aria-valuenow', v * 10);
      hint.innerHTML = `${HINT} <b class="pct" data-tone="${batt.dataset.tone}">${v * 10}%</b>`; if (!quiet) audio.fx('seg', v); $('#dim').style.opacity = (1 - v / 10) * .18; setBtn('ไปต่อ 3/5', true);
      clearTimeout(sayT); sayT = setTimeout(() => { const band = v <= 1 ? 0 : v <= 3 ? 1 : v <= 6 ? 2 : 3; if (my !== run || band === lastSaid) return; lastSaid = band; pose(v <= 1 ? 'care' : 'stand'); say(batteryReply(v * 10)); }, 700); };
    if (st.battery !== null) { lastSaid = -2; set(st.battery / 10, true); }
    const at = (e) => { const r = batt.querySelector('.cells').getBoundingClientRect(); set(Math.ceil((e.clientX - r.left) / r.width * 10)); };
    batt.onpointerdown = (e) => { batt.setPointerCapture(e.pointerId); at(e); batt.onpointermove = at; }; batt.onpointerup = batt.onpointercancel = () => (batt.onpointermove = null);
    batt.onkeydown = (e) => { const v = Math.max(cur, 0); if (e.key === 'ArrowRight' || e.key === 'ArrowUp') set(v + 1); if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') set(v - 1); };
    const res = await press(); if (res === 'skip') st.battery = null; clearTimeout(sayT); $('#dim').style.opacity = 0;
    return res;
  }

  const helpCard = `<div class="sf-care"><a class="sf-btn ready" href="tel:1323">สายด่วนสุขภาพจิต 24 ชั่วโมง โทร 1323</a><a class="sf-btn ghost" href="${LINKS.ooca}" target="_blank" rel="noopener">คุยกับนักจิตวิทยา ooca</a><p>ถ้าอยู่ในอันตรายตอนนี้โทร 1669</p></div>`;
  async function danger(fromNote = false) {
    st.heavy = true; pose('care'); cam.boost = 1.12;
    for (;;) {
      say(fromNote ? 'ขอบคุณที่บอกผมนะครับ\nผมเป็นห่วงคุณจริงๆ' : 'ไม่ต้องฝืนตัวเองนะครับ');
      swapOut(); dyn.className = 'sf-dyn'; dyn.innerHTML = fromNote
        ? `<h3 class="sf-h">ผมขอเช็กใจคุณหน่อยนะครับ</h3><p class="sf-p">ถ้าตอนนี้ใจหนักมาก หรือมีความคิดอยากทำร้ายตัวเอง คุณไม่ต้องแบกไว้คนเดียว มีคนพร้อมคุยกับคุณอยู่ตอนนี้เลย ถ้าไม่ได้หมายความแบบนั้น ก็นั่งต่อกับผมได้เลยครับ</p>${helpCard}<button class="sf-skip" data-r="stay">ขอนั่งต่ออีกหน่อย</button>`
        : `<h3 class="sf-h">ตอนนี้คุณเหนื่อยมากเลยใช่ไหม</h3><p class="sf-p">ไม่ต้องตอบอะไรเพิ่มก็ได้ ถ้าอยากคุยกับใครสักคนตอนนี้ มีคนพร้อมฟังอยู่นะ</p>${helpCard}<button class="sf-skip" data-r="stay">ขอนั่งต่ออีกหน่อย</button>`;
      await press(); say('ผมอยู่ตรงนี้นะครับ');
      swapOut(); dyn.innerHTML = `<h3 class="sf-h">เล่นต่อได้เลยไม่ต้องรีบ</h3><p class="sf-p">ผมจะพาไปทีละข้อ ข้ามข้อไหนก็ได้ และเลือกแผ่นเสียงที่เบาและอ่อนโยนให้</p><button class="sf-btn ready" data-r="go">ไปต่อ</button><button class="sf-btn ghost" data-r="talk">ขอคุยกับใครสักคนก่อน</button>`;
      if (await press() === 'go') break;
    }
    cam.boost = 1; pose('stand');
  }

  async function q4() {
    await walkTo(770, 512, 'stand');
    setSheet({ cls: 'sf-q', back: true, hint: 'เลือกได้ 2 ข้อ', html: `<div class="sf-opts" id="opts">${SONGS.map((s, i) => `<button class="sf-opt" data-i="${i}" style="--c:${s.c}" aria-pressed="${st.songs.includes(i)}"><i class="v"></i><span>${s.label}</span><i class="ck"><svg viewBox="0 0 12 12"><path d="M2.5 6.2l2.3 2.3 4.7-4.9"/></svg></i></button>`).join('')}</div>`, btn: '', skip: 'ข้ามข้อนี้' });
    setBtn('ไปต่อ 4/5', st.songs.length > 0); say('ถ้าสมมติว่าชีวิตของคุณตอนนี้เป็นเพลง\nจะเป็นเพลงแนวไหนครับ'); const my = run;
    dyn.querySelector('#opts').onclick = (e) => {
      const b = e.target.closest('.sf-opt'); if (!b || my !== run) return; const i = +b.dataset.i;
      if (st.songs.includes(i)) st.songs = st.songs.filter((x) => x !== i);
      else { if (st.songs.length >= 2) { const old = st.songs.shift(); dyn.querySelector(`.sf-opt[data-i="${old}"]`).setAttribute('aria-pressed', 'false'); } st.songs.push(i); audio.fx('seg', SONGS[i].n); setTimeout(() => audio.fx('seg', SONGS[i].n + SONGS[i].iv), 220); say(SONGS[i].say); }
      b.setAttribute('aria-pressed', String(st.songs.includes(i))); pose(st.songs.length ? 'listen' : 'stand'); if (st.songs.includes(i)) hop(); setBtn('ไปต่อ 4/5', st.songs.length > 0);
    };
    const res = await press(); if (res === 'skip') st.songs = []; return res;
  }

  async function q5() {
    await walkTo(950, 512, 'stand');
    setSheet({ cls: 'sf-q', back: true, hint: 'ฝากไว้ในกระดาษโน้ต', html: `<label class="sf-note"><textarea id="note" rows="3" placeholder="พิมพ์ตรงนี้ หรือข้ามไปก็ได้" aria-label="ข้อความฝากถึง ooca"></textarea><span id="cnt">0/80</span></label>`, btn: 'ค้นหาเพลง' });
    say('มีอะไรอยากฝากไว้กับผมไหม\nเขียนสั้นๆ ก็ได้'); const ta = dyn.querySelector('#note');
    ta.oninput = () => { let g = graphemes(ta.value.replace(/\n{2,}/g, '\n')); if (g.length > 80) { g = g.slice(0, 80); ta.value = g.join(''); } dyn.querySelector('#cnt').textContent = g.length + '/80'; audio.fx('type'); };
    if (st.note) { ta.value = st.note; ta.oninput(); }
    ta.onfocus = () => setTimeout(() => layout(400), 380);
    const res = await press(); st.note = ta.value.trim(); ta.blur(); if (res === 'back') return res;
    if (st.note) { dyn.querySelector('.sf-note').classList.add('sent'); audio.fx('tear'); await wait(900);
      if (isRisk(st.note)) { say.hide(); await danger(true); return; }   // ข้อความเสี่ยง → ดูแลก่อน แล้วค่อยเล่นต่อ
      pose('found1'); hop(); await say('ผมจะเก็บไว้ให้ดีนะครับ', { hold: 1400 }); }
  }

  async function findSong() {
    st.mood = pickMood(st); setSheet({ hint: 'กำลังค้นหาเพลง' }); cam.boost = 1.05; await walkTo(459, 505, 'find');
    say('ผมจะหาเพลง\nที่เหมาะกับอารมณ์คุณช่วงนี้ให้นะ'); for (let i = 0; i < 4; i++) { await wait(900); audio.fx('rummage'); hop(); }
    pose('found1'); hop(); audio.fx('found'); await say('ผมเจอแล้ว ไปฟังเพลงกันนะ', { hold: 1500 });
    cam.boost = 1.12; await walkTo(742, 470, 'found2');
  }

  const TT = `<svg class="sf-tt" viewBox="0 0 330 214" aria-hidden="true"><rect y="10" width="330" height="204" rx="30" fill="#00796D"/><rect width="330" height="204" rx="30" fill="#00C4B3"/><path d="M30 0h160v204H30A30 30 0 010 174V30A30 30 0 0130 0z" fill="#00A896"/><rect x="40" y="176" width="28" height="13" rx="2" fill="#2F4A4A"/><rect x="246" y="176" width="30" height="13" rx="2" fill="#16181d"/><rect x="286" y="176" width="6" height="13" rx="2" fill="#2F4A4A"/><rect x="230" y="88" width="12" height="4" rx="1" fill="#2D6BE0"/>
    <g class="rec"><circle cx="124" cy="98" r="71" fill="#1E1E22"/><circle cx="124" cy="98" r="52" fill="none" stroke="#ffffff14" stroke-width="1.5"/><circle cx="124" cy="98" r="40" fill="none" stroke="#ffffff14" stroke-width="1.5"/><circle cx="124" cy="98" r="30" fill="#F0655B"/><path d="M124 70a28 28 0 0124 14" fill="none" stroke="#ffffff55" stroke-width="3" stroke-linecap="round"/><circle cx="124" cy="98" r="6" fill="#F6B73C"/><circle cx="124" cy="98" r="2" fill="#1E1E22"/></g>
    <g class="arm"><path d="M212 40v104" stroke="#6E7378" stroke-width="5" stroke-linecap="round"/><rect x="204" y="28" width="16" height="18" rx="3" fill="#1E1E22"/><rect x="206" y="138" width="12" height="16" rx="2" fill="#1E1E22" transform="rotate(8 212 146)"/></g></svg>`;
  let widget = null, playing = false;
  function setPlaying(on) { playing = on; el.classList.toggle('playing', on); if (on) spawnNotes(); }
  function spawnNotes() { const box = $('#notes'); if (box.dataset.on) return; box.dataset.on = 1; const iv = setInterval(() => { if (!alive) { clearInterval(iv); delete box.dataset.on; return; } if (!playing) return; const n = document.createElement('span'); n.textContent = ['♪', '♫', '♩'][Math.random() * 3 | 0]; n.style.cssText = `left:${840 + Math.random() * 90}px;top:${225 + Math.random() * 20}px;--dx:${(Math.random() * 120 - 40) | 0}px;color:${['#00C4B3', '#F0655B', '#F6B73C', '#5B4DB5'][Math.random() * 4 | 0]}`; box.appendChild(n); setTimeout(() => n.remove(), 3600); }, 700); }
  function mountEmbed() {
    if (embed.firstChild) return; embed.innerHTML = `<iframe title="เครื่องเล่นเพลง SoundCloud" scrolling="no" frameborder="no" allow="autoplay; encrypted-media" src="${TRACK.embed}"></iframe>`;
    const f = embed.firstChild, sc = document.createElement('script'); sc.src = 'https://w.soundcloud.com/player/api.js';
    sc.onload = () => { try { widget = window.SC.Widget(f); const E = window.SC.Widget.Events; widget.bind(E.PLAY, () => { setPlaying(true); audio.music(false); }); widget.bind(E.PAUSE, () => setPlaying(false)); widget.bind(E.FINISH, () => setPlaying(false)); } catch (e) {} };
    document.head.appendChild(sc);
  }
  async function player() {
    mountEmbed(); const mood = MOODS[st.mood];
    top.innerHTML = `<div class="sf-ttw">${TT}</div>`; setSheet({ cls: 'sf-player', btn: '' });
    await say('เขาว่ากันว่าเสียงเพลง\nช่วยปลดปล่อยความรู้สึกของเราได้นะ'); setBtn('ฟังเพลง'); await press();
    setBtn(''); el.classList.add('needle'); await wait(1700); audio.fx('needle'); await wait(600);
    try { widget?.play(); } catch (e) {} setPlaying(true); audio.music(false); pose('listen'); hop(); cam.boost = 1;
    embed.hidden = false; top.classList.add('small');
    dyn.insertAdjacentHTML('afterbegin', `<div class="sf-mean"><div class="sf-cv"><img src="${COVER[st.mood]}" alt="ปกแผ่น ${mood.th}"><span><small>แผ่นของคุณวันนี้</small><b class="mood">${mood.th}</b><i>${mood.en}</i></span></div><small>ความหมายจากเพลง</small><b>${esc(TRACK.title)}</b><p>${esc(TRACK.meaning)}</p></div>`);
    dyn.querySelector('#sfgo').insertAdjacentHTML('afterend', '<button class="sf-skip" id="sfskip">รับใบเสร็จ</button>'); say('ฟังไปด้วยกันนะครับ');
    setBtn('พักฟังเพลงสักแป๊บนะ', false); const my = run; setTimeout(() => { if (my === run && dyn.classList.contains('sf-player')) { setBtn('รับใบเสร็จ'); dyn.querySelector('#sfskip')?.remove(); } }, 10000);
    await press();
  }

  async function receipt() {
    const mood = MOODS[st.mood], d = new Date(), MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const when = `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear() + 543} · ${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')} น.`;
    const topic = st.topics.length && !st.heavy ? TOPICS[st.topics[0]].label : null, heart = st.heavy ? 'แค่มาถึงตรงนี้ ก็พอแล้วนะ ไม่ต้องทำอะไรต่อก็ได้' : HEART[topic] || HEART._;
    const data = { when, mood, cover: COVER[st.mood], track: TRACK.title, topic, heart, action: st.heavy ? null : ACTION(st.battery), heavy: st.heavy, logoUrl };
    say.hide(); pose('listen'); top.innerHTML = ''; top.classList.remove('small'); embed.classList.add('slim');
    swapOut(); dyn.className = 'sf-dyn sf-rc'; dyn.innerHTML = `<div class="sf-rcw" id="rcw"><i class="slot"></i><div class="sf-paperr" id="rp"><img class="lg" src="${logoUrl}" alt="ooca"><b class="nm">ร้านแผ่นเสียง ooca - ฟังใจ</b><small>ที่หลบฝนสำหรับใจที่เหนื่อย</small>
      <div class="r sm"><span>${when}</span><span>#0001</span></div><hr><div class="r cv"><img src="${COVER[st.mood]}" alt=""><span>แผ่นเสียง · ${mood.th}<br>(${mood.en})<br><small>เพลง: ${esc(TRACK.title)}</small></span><span>0.00</span></div><div class="r"><span>ที่นั่งหลบฝน (ไม่จำกัดเวลา)</span><span>0.00</span></div><div class="r"><span>คนฟังคุณเล่า</span><span>0.00</span></div><hr>
      <div class="r tot"><span>รวมทั้งหมด</span><span>0.00</span></div><div class="r"><span>ชำระด้วย: การเข้ามาหลบฝน</span></div><hr>
      <div class="hrt"><small>ถึงคุณ${topic ? ' เรื่อง' + topic : ''}</small><p>${heart}</p><em>— ooca</em></div>${data.action ? `<hr><div class="act"><small>ลองทำสัก 1 นาที</small><p>${data.action}</p></div>` : ''}
      <hr><div class="hl">${st.heavy ? '<b>สายด่วนสุขภาพจิต 1323 (24 ชั่วโมง)</b><br>ถ้าอยู่ในอันตรายตอนนี้โทร 1669' : 'ถ้าอยากคุยกับใครสักคน โทร 1323 ได้ตลอด 24 ชั่วโมง'}</div><i class="bar"></i><p class="th">ขอบคุณที่แวะมานะครับ<br>ฝนหยุดเมื่อไหร่ ก็กลับมาได้เสมอ</p></div></div>
      <div class="sf-after" id="after"><button class="sf-btn ready" data-r="save">บันทึกภาพใบเสร็จ</button><a class="sf-btn ghost" href="${LINKS.ooca}" target="_blank" rel="noopener">คุยกับนักจิตวิทยาที่ ooca</a><button class="sf-skip" data-r="done">เสร็จสิ้น</button></div>`;
    const rp = dyn.querySelector('#rp'), rcw = dyn.querySelector('#rcw');
    // 1) กล่องขาวค่อยๆ ยืดขึ้น  2) กระดาษค่อยๆ เลื่อนออกจากช่องพิมพ์อย่างต่อเนื่อง  3) ปุ่มค่อยๆ ปรากฏ
    await wait(60); rcw.classList.add('open'); await wait(1300);
    const prt = setInterval(() => audio.fx('print'), 820); audio.fx('print'); rp.classList.add('out'); await wait(4200); clearInterval(prt);
    audio.fx('soft'); hop(); rcw.classList.add('done'); dyn.querySelector('#after').classList.add('on');
    for (;;) { const r = await press(); if (r === 'done') break; if (r === 'save') { const url = await saveReceipt(data).catch(() => null); if (url) { openModal(`<div class="sf-saved"><img src="${url}" alt="ใบเสร็จของคุณ"><p>กดค้างที่รูปเพื่อบันทึก หรือกดดาวน์โหลด<br>รูปนี้อยู่ในเครื่องของคุณเท่านั้น</p><a class="sf-btn ready" href="${url}" download="ooca-receipt.png">ดาวน์โหลด</a><button class="sf-btn ghost" data-x>ปิด</button></div>`); } } }
  }

  async function bye() {
    try { widget?.pause(); } catch (e) {} setPlaying(false); el.classList.remove('needle'); embed.hidden = true; embed.classList.remove('slim'); top.innerHTML = ''; audio.music(true);
    setSheet({}); cam.boost = 1; pose('wave'); hop(); audio.fx('bye'); el.classList.add('warm');
    await say('ฝนหยุดเมื่อไหร่\nก็กลับมาได้เสมอนะครับ', { hold: 1200 }); setBtn('กลับไปที่หน้าแรก'); await press();
    Object.assign(st, { topics: [], rain: null, battery: null, songs: [], note: '', heavy: false, mood: null }); onExit?.();
  }

  // ป๊อปอัปค่อยๆ เด้งขึ้น/หายไป (ไม่วาป)
  let mT = 0;
  function openModal(html) { clearTimeout(mT); modal.innerHTML = html; modal.hidden = false; modal.classList.remove('show'); void modal.offsetWidth; modal.classList.add('show'); audio.fx('soft'); }
  function closeModal() { modal.classList.remove('show'); clearTimeout(mT); mT = setTimeout(() => { modal.hidden = true; }, REDUCE ? 0 : 380); }
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('[data-x]')) closeModal(); });
  $('#help').addEventListener('click', () => { openModal(`<div class="sf-saved care"><h3 class="sf-h">มีคนพร้อมฟังคุณอยู่นะ</h3><p class="sf-p">คุยกับใครสักคนตอนนี้ได้เลย หรือจะกลับมานั่งต่อก็ได้</p>${helpCard}<button class="sf-btn ghost" data-x>กลับไปนั่งต่อ</button></div>`); audio.fx('soft'); });

  /* ---------- ฝนแบบเดียวกับบทเกริ่น (Three.js) ใช้ในข้อ 2 ---------- */
  let rainFx = null, rainOn = false, rainLast = 0, rainOffAt = 0;
  function rainTo(lv) {
    if (REDUCE) return;
    if (!rainFx) rainFx = createRain($('#rainc'), { count: 320, startY: [-60, 10], fadeIn: 40, strength: 0, density: 0, color: [.42, .56, .74], speed: [5, 10], length: [.35, .75], slant: -0.1 });
    rainFx.resize(); rainFx.cfg.density = lv; if (lv) Object.assign(rainFx.cfg, { strength: .55 + lv * .45, speedMul: .75 + lv * .6 }); else rainOffAt = performance.now();
    if (!rainOn) { rainOn = true; rainLast = performance.now(); requestAnimationFrame(rainTick); }
  }
  function rainTick(now) {   // ฝนที่ตกค้างอยู่จะตกจนสุดจอเองหลังหยุด แล้วลูปก็หยุดตาม
    const dt = Math.min(.05, (now - rainLast) / 1000); rainLast = now; rainFx.step(dt); rainFx.render();
    if (alive && (rainFx.cfg.density > 0 || now - rainOffAt < 2500)) requestAnimationFrame(rainTick); else rainOn = false;
  }

  async function start(from = 0) {
    const my = ++run; alive = true; el.classList.add('on'); el.classList.remove('warm', 'needle', 'playing'); $('#desk').innerHTML = ''; embed.hidden = true; top.innerHTML = ''; audio.scene('shop'); audio.room(.45, 1500); nudge();
    const gate = async () => { if (!st.heavy && st.battery !== null && (st.battery <= 10 || (st.battery <= 20 && RAIN[st.rain]?.storm))) await danger(); };
    const seq = [intro, q1, q2, q3, gate, q4, q5, findSong, player, receipt, bye], Q = new Set([q1, q2, q3, q4, q5]);
    for (let i = from; i < seq.length; i++) {
      if (my !== run) return; const r = await seq[i](); if (my !== run) return; say.hide(); dyn.classList.add('locked');
      if (r === 'back') { let j = i - 1; while (j > 0 && !Q.has(seq[j])) j--; i = j - 1; }   // ย้อนไปข้อก่อนหน้า (คำตอบเดิมยังอยู่)
    }
  }
  function stop() { run++; alive = false; el.classList.remove('on'); try { widget?.pause(); } catch (e) {} }
  return { el, start, stop, state: st, _dbg: { layout, pose, m, cam } };
}
