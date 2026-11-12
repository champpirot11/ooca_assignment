// ฉากคุยในร้าน (เคาน์เตอร์) — ภาพจาก scene1.svg ของผู้ออกแบบ, โค้ดทำเฉพาะการเคลื่อนไหว/เสียง/โต้ตอบ
//  • มูก้าพูด: ข้อความค่อยๆ ขึ้นทีละตัวพร้อมเสียงปิ๊บ · ระหว่างพูดปุ่มกดไม่ได้ (ปุ่มเทาแบบในดีไซน์)
//  • แตะที่ไหนก็ได้บนจอระหว่างพูด = จบท่อนนั้นทันที (แตะอีกทีตอนรอ = ข้ามไปท่อนถัดไป)
//  • กล่องขาวด้านล่างสูงตามเนื้อหา ยิ่งสูงฉากในร้านยิ่งซูมออก
import scene from '../art/talk-scene.svg?raw';
import bubbleD from '../art/talk-bubble.txt?raw';
import dotsD from '../art/talk-dots.txt?raw';
import { audio } from '../lib/audio.js';
import { REDUCE, clamp } from '../lib/util.js';

const SEG = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'grapheme' }) : null;
const graphemes = (t) => (SEG ? [...SEG.segment(t)].map((x) => x.segment) : Array.from(t));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- บทพูด (ตาม "บทพูดมูก้า v2") ---------- */
const hour = new Date().getHours();
const greet2 = hour >= 5 && hour < 11 ? 'เช้านี้ก็มีฝนนะ เข้ามาหลบก่อนได้' : hour >= 11 && hour < 17 ? 'ฝนกำลังจะตกแล้ว เข้ามาหลบได้นะ' : hour >= 17 && hour < 21 ? 'ข้างนอกฝนหนักเลย เข้ามาหลบก่อนไหม' : 'ดึกแล้ว ฝนยังไม่หยุดเลย นั่งในร้านก่อนได้นะ';
const RAIN = [
  { id: 'drizzle', label: 'ปรอยๆ', lv: .25, reply: ['ฝนปรอยๆ ก็ทำให้เปียกได้นะ'] },
  { id: 'wet', label: 'ตกพอเปียก', lv: .5, reply: ['เปียกมาสักพักแล้วสินะ', 'ผ้าผืนนั้นช่วยได้นิดหน่อย'] },
  { id: 'heavy', label: 'ตกหนัก', lv: .8, reply: ['หนักจริงๆ นะ', 'อยู่ตรงนี้ก่อนได้'] },
  { id: 'storm', label: 'พายุ', lv: 1, reply: ['วันนี้หนักจริงๆ สินะ', 'ขอบคุณที่บอกให้เรารู้', 'นั่งตรงนี้ด้วยกันก่อนได้นะ'], heavy: true },
];
const batteryReply = (v) => v <= 10 ? ['วันนี้หนักจริงๆ สินะ', 'ขอบคุณที่บอกให้เรารู้', 'นั่งตรงนี้ด้วยกันก่อนได้นะ']
  : v <= 30 ? ['เหลือน้อยจริงๆ', 'ที่นี่ชาร์จได้นะ ไม่ต้องรีบเต็ม']
  : v <= 60 ? ['ครึ่งๆ กลางๆ', 'ยังไปต่อได้ แต่เหนื่อยก็ได้นะ']
  : ['ยังมีแรงอยู่นะ', 'เก็บไว้ใช้ในวันที่ต้องการ'];

const ICON = {
  study: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5zM20 5.5C20 4.7 19.3 4 18.5 4H13v15h5.5c.8 0 1.5-.7 1.5-1.5z"/>',
  work: '<rect x="3.5" y="8" width="17" height="11" rx="2.5"/><path d="M9 8V6.5C9 5.7 9.7 5 10.5 5h3c.8 0 1.5.7 1.5 1.5V8M3.5 13h17"/>',
  family: '<path d="M4 11.5L12 5l8 6.5M6 10.5V19h12v-8.5M10 19v-5h4v5"/>',
  self: '<path d="M12 20s-7-4.2-7-9.5A4 4 0 0112 8a4 4 0 017 2.5C19 15.8 12 20 12 20z"/>',
  rest: '<path d="M19 14.5A7.5 7.5 0 019.5 5a7.5 7.5 0 109.5 9.5z"/>',
  none: '<rect x="5" y="10.5" width="14" height="9" rx="2.5"/><path d="M8 10.5V8a4 4 0 018 0v2.5M12 14v2"/>',
};
const CHIPS = [
  { label: 'การเรียน', bg: '#CFE4F7', k: '#2F6DB0', ic: 'study' },
  { label: 'การงาน', bg: '#FBE3A8', k: '#A8730F', ic: 'work' },
  { label: 'ครอบครัว', bg: '#F5C9C2', k: '#B5483B', ic: 'family' },
  { label: 'ตัวเอง', bg: '#D8D4F2', k: '#5B4DB5', ic: 'self' },
  { label: 'อยากพักเฉยๆ', bg: '#CDEBDD', k: '#2E8A66', ic: 'rest' },
  { label: 'ยังไม่อยากบอก', bg: '#E8E4DE', k: '#76695E', ic: 'none', none: true },
];
const chipHtml = (c, i) => `<button class="chip" data-act="chip" data-i="${i}" aria-pressed="false" aria-disabled="true" style="--c:${c.bg};--k:${c.k}"><span class="face"><svg class="glyph" viewBox="0 0 24 24" aria-hidden="true">${ICON[c.ic]}</svg><span class="vinyl" aria-hidden="true"><i></i></span></span><span class="tx">${c.label}</span><span class="ck" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M2.5 6.2l2.3 2.3 4.7-4.9"/></svg></span></button>`;

/* ---------- DOM ---------- */
const dropSvg = (n) => `<svg viewBox="0 0 48 32" aria-hidden="true">${[[12, 6], [28, 4], [20, 14], [38, 12], [8, 20], [30, 22], [18, 26], [42, 24]].slice(0, n).map(([x, y]) => `<path d="M${x} ${y}q-3 5 0 8q3-3 0-8z"/>`).join('')}</svg>`;
const stormSvg = '<svg viewBox="0 0 48 32" aria-hidden="true"><path d="M14 4q-3 5 0 8q3-3 0-8zM36 6q-3 5 0 8q3-3 0-8zM26 3l-7 13h6l-3 11 10-15h-6z"/></svg>';

export function createTalk({ onExit } = {}) {
  const el = document.createElement('section');
  el.className = 'talk'; el.setAttribute('aria-label', 'ในร้านแผ่นเสียง');
  el.innerHTML = `
    <div class="tscene" id="tscene"><div class="tsvg">${scene}</div><div class="tshade"></div><div class="tglow"></div></div>
    <div class="bubble" id="bubble" aria-live="polite"><svg viewBox="112 95 211 161" aria-hidden="true"><path d="${bubbleD}" fill="#fff"/></svg><p class="btext" id="btext"></p></div>
    <div class="tbox" id="tbox"><div class="tin" id="tin"></div></div>`;
  const q = (s) => el.querySelector(s);
  const tsvg = q('.tsvg'), mascot = el.querySelector('#mascot'), bubble = q('#bubble'), btext = q('#btext'), tbox = q('#tbox'), tin = q('#tin');
  const shade = q('.tshade'), glow = q('.tglow');
  let u = 1;

  /* ----- กล่องขาว ↔ ซูมฉาก ----- */
  function layout() {
    u = el.getBoundingClientRect().width / 390 || 1;
    const h = tin.offsetHeight; tbox.style.height = h + 'px';
    const Hu = h / u, zs = clamp((844 - Hu - 8) / 600, .62, 1);
    el.style.setProperty('--zs', zs.toFixed(3));
  }
  new ResizeObserver(layout).observe(tin);
  const ready = () => requestAnimationFrame(layout);

  /* ----- พูดทีละตัว ----- */
  const T = { typing: false, finish: null, skipWait: null, token: 0 };
  async function sayOne(text, token) {
    const gs = graphemes(text);
    bubble.classList.remove('on', 'out'); btext.innerHTML = '';
    // วางข้อความเต็มไว้ก่อน (ซ่อนส่วนที่ยังไม่ถึง) บรรทัดจะได้ไม่ขยับตอนพิมพ์
    const shown = document.createElement('span'), rest = document.createElement('span'); rest.className = 'rest';
    btext.append(shown, rest); rest.textContent = text;
    void bubble.offsetWidth; bubble.classList.add('on'); audio.pop(); mascot?.classList.add('talk');
    await wait(REDUCE ? 0 : 260);
    let i = 0, done = false;
    T.typing = true; T.finish = () => { done = true; };
    while (i < gs.length && !done) {
      if (token !== T.token) return false;
      i++; shown.textContent = gs.slice(0, i).join(''); rest.textContent = gs.slice(i).join('');
      const c = gs[i - 1];
      if (c.trim()) { if (i % 2 === 0) audio.blip(i); }
      await wait(REDUCE ? 4 : c === ' ' ? 150 : 36);
    }
    shown.textContent = text; rest.textContent = ''; T.typing = false; T.finish = null; mascot?.classList.remove('talk');
    return true;
  }
  async function pause(ms, token) {
    await new Promise((res) => { const t = setTimeout(res, REDUCE ? 100 : ms); T.skipWait = () => { clearTimeout(t); res(); }; });
    T.skipWait = null; return token === T.token;
  }
  // segs = ประโยคทีละท่อน · ท่อนสุดท้ายค้างไว้ในกล่อง (ไม่หาย)
  async function say(segs, token) {
    for (let k = 0; k < segs.length; k++) {
      if (!(await sayOne(segs[k], token))) return false;
      if (k < segs.length - 1) { if (!(await pause(900 + segs[k].length * 22, token))) return false; bubble.classList.add('out'); await wait(REDUCE ? 0 : 220); }
    }
    return true;
  }

  /* ----- เนื้อกล่องขาว ----- */
  const dots = `<svg class="dots" viewBox="31.5 731.33 327 53" aria-hidden="true"><path d="${dotsD}" fill="#595959"/></svg>`;
  let uiLocked = true;
  const lock = (on) => { uiLocked = on; tin.classList.toggle('locked', on); tin.querySelectorAll('[data-act]').forEach((b) => b.setAttribute('aria-disabled', String(on))); };
  function mainBtn(label, act) { return `<button class="mbtn" data-act="${act}" aria-disabled="true"><span class="l">${label}</span>${dots}</button>`; }
  const skipLink = (act = 'skip') => `<button class="slink" data-act="${act}" aria-disabled="true">ข้ามไปก่อน</button>`;

  const UI = {
    idle: () => `<div class="pad idle"><button class="mbtn off" aria-disabled="true">${dots}</button></div>`,
    cta: () => `<div class="pad"><div class="mbtn-wrap">${mainBtn('นั่งลงก่อน', 'sit')}</div><p class="small">ใช้เวลาประมาณ 3 นาที · ข้ามได้ทุกข้อ</p></div>`,
    chips: () => `<div class="pad"><div class="chips">${CHIPS.map(chipHtml).join('')}</div>${mainBtn('ตกลง', 'chips-ok')}${skipLink()}</div>`,
    rain: () => `<div class="pad"><div class="cards">${RAIN.map((r, i) => `<button class="card" data-act="rain" data-i="${i}" aria-disabled="true" aria-pressed="false">${r.id === 'storm' ? stormSvg : dropSvg([2, 4, 7][i])}<span>${r.label}</span></button>`).join('')}</div>${mainBtn('ตกลง', 'rain-ok')}${skipLink()}</div>`,
    battery: () => `<div class="pad"><div class="batt" id="batt" data-act="batt" aria-disabled="true" role="slider" aria-label="แบตเตอรี่ใจ" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" tabindex="0"><div class="cap"></div><div class="body"><div class="fill" id="bfill"></div><div class="seg"><i></i><i></i><i></i><i></i></div><b id="bpct">50%</b></div></div><p class="small">ลากเพื่อเลือก ไฟในร้านจะเปลี่ยนตาม</p>${mainBtn('ตกลง', 'batt-ok')}${skipLink()}</div>`,
    end: () => `<div class="pad"><p class="small big">ตัวอย่างจบแค่นี้ — ข้อ 3 (หัวใจ) ยังไม่ทำ</p>${mainBtn('ดูอีกครั้ง', 'again')}</div>`,
  };
  function setUI(name) { tin.innerHTML = UI[name](); tin.dataset.ui = name; lock(name !== 'idle' ? true : true); if (name === 'battery') bindBattery(); ready(); }

  /* ----- ไฟในร้าน (ตอนลากแบต) ----- */
  function setLight(v) {   // v 0..1
    shade.style.setProperty('--dk', (.5 * (1 - v)).toFixed(3));
    glow.style.setProperty('--gl', (.1 + .55 * v).toFixed(3));
    el.classList.toggle('flick', v < .2);
    audio.light?.(v * .8, 1);
  }
  let battV = 50, rainPick = -1, answers = {};
  function bindBattery() {
    const b = q('#batt'), body = b.querySelector('.body'), fill = q('#bfill'), pct = q('#bpct'); let drag = false, lastTick = -1;
    const set = (v, snd) => { battV = clamp(Math.round(v), 0, 100); fill.style.width = battV + '%'; pct.textContent = battV + '%'; b.setAttribute('aria-valuenow', battV); fill.dataset.low = battV <= 20 ? '1' : '0'; setLight(battV / 100); const t = Math.round(battV / 10); if (snd && t !== lastTick) { lastTick = t; audio.tickN(battV / 100); navigator.vibrate?.(4); } };
    const at = (e) => { const r = body.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100, true); };
    b.addEventListener('pointerdown', (e) => { if (uiLocked) return; drag = true; b.setPointerCapture(e.pointerId); at(e); });
    b.addEventListener('pointermove', (e) => drag && at(e));
    b.addEventListener('pointerup', () => { drag = false; }); b.addEventListener('pointercancel', () => { drag = false; });
    b.addEventListener('keydown', (e) => { if (uiLocked) return; if (e.key === 'ArrowRight') set(battV + 5, true); if (e.key === 'ArrowLeft') set(battV - 5, true); });
    set(50, false);
  }

  /* ----- ลำดับเรื่อง ----- */
  let resolveAct = null;
  const waitAct = () => new Promise((r) => { resolveAct = r; });
  const act = (a, d) => { if (resolveAct) { const r = resolveAct; resolveAct = null; r({ a, d }); } };
  async function talk(segs, ui, token) {
    setUI(ui); lock(true);
    if (!(await say(segs, token))) return null;
    lock(false); tin.classList.add('ready'); return true;
  }
  function resetLight() { shade.style.setProperty('--dk', '0'); glow.style.setProperty('--gl', '.12'); el.classList.remove('flick'); audio.light?.(0, 1); }
  async function reply(segs, token) { setUI('idle'); tin.classList.remove('ready'); return say(segs, token); }

  async function run(from = 0) {
    const token = ++T.token; resolveAct = null;
    const ok = () => token === T.token;
    answers = {}; rainPick = -1; battV = 50; resetLight();
    audio.room(.22, 1400);
    mascot?.classList.remove('talk');
    // --- 1 ทักทาย ---
    if (from <= 0) {
      setUI('idle'); await wait(REDUCE ? 100 : 700); if (!ok()) return;
      if (!(await say(['ยินดีต้อนรับสู่\nร้านแผ่นเสียง ฟังใจ', greet2, 'ผ้าผืนนี้ให้ยืมนะ\nเช็ดตัวก่อน ไม่รีบ'], token))) return;
      setUI('cta'); lock(false); tin.classList.add('ready');
      await waitAct(); if (!ok()) return; audio.choose();
    }
    // --- 2 วันนี้ไปเจออะไรมา (เลือกได้หลายอัน) ---
    {
      const picks = new Set();
      const toggle = (i) => {
        const none = CHIPS[i].none;
        if (picks.has(i)) picks.delete(i); else { if (none) picks.clear(); else CHIPS.forEach((c, k) => c.none && picks.delete(k)); picks.add(i); }
        el.querySelectorAll('.chip').forEach((c) => { const on = picks.has(+c.dataset.i); c.classList.toggle('sel', on); c.setAttribute('aria-pressed', String(on)); });
        q('.mbtn')?.classList.toggle('go', picks.size > 0);
        audio.pick(picks.size); mascot?.classList.remove('hop'); void mascot?.getBoundingClientRect(); mascot?.classList.add('hop');
      };
      if (!(await talk(['วันนี้ไปเจออะไรมาบ้างนะ\nเลือกได้หลายอัน'], 'chips', token))) return;
      const r = await new Promise((res) => { const loop = async () => { const x = await waitAct(); if (!ok()) return res(null); if (x.a === 'chip') { toggle(+x.d); loop(); } else if ((x.a === 'chips-ok' && picks.size) || x.a === 'skip') res(x); else loop(); }; loop(); });
      if (!ok() || !r) return; audio.choose();
      const real = [...picks].filter((i) => !CHIPS[i].none).length;
      await reply(r.a === 'skip' || real === 0 ? ['ไม่เป็นไรนะ', 'เก็บไว้กับตัวก่อนก็ได้'] : real === 1 ? ['แบกอยู่เรื่องเดียว', 'แต่ก็หนักนะ', 'วางลงก่อนสักครู่'] : ['หลายเรื่องเลย', 'ไม่ต้องแก้ครบในวันนี้', 'แค่พักก่อนนะ'], token);
      if (!ok()) return; await wait(REDUCE ? 100 : 500);
    }
    // --- 3 ฝนตกหนักแค่ไหน ---
    for (;;) {
      if (!(await talk(['แล้วฝนที่พาคุณมาถึงร้านนี้\nตกหนักแค่ไหนนะ'], 'rain', token))) return;
      let pick = -1;
      const done = await new Promise((res) => {
        const loop = async () => { const r = await waitAct(); if (!ok()) return res(null); if (r.a === 'rain') { pick = +r.d; res2(r); } else if (r.a === 'rain-ok' && pick >= 0) res(r); else if (r.a === 'skip') res(r); else loop(); };
        const res2 = (r) => { document.querySelectorAll('.card').forEach((c) => { const on = +c.dataset.i === pick; c.classList.toggle('sel', on); c.setAttribute('aria-pressed', String(on)); });
          audio.choose(); audio.room(.22 + RAIN[pick].lv * .6, 1400 + RAIN[pick].lv * 4000); audio.rainLevel(RAIN[pick].lv); mascot?.classList.remove('hop'); void mascot?.getBoundingClientRect(); mascot?.classList.add('hop');
          q('.mbtn')?.classList.add('go'); loop(); };
        loop();
      });
      if (!ok() || !done) return;
      if (done.a === 'skip') { audio.tap(); await reply(['ไม่บอกก็ได้นะ', 'เดี๋ยวฝนก็คงบอกเอง'], token); audio.room(.22, 1400); }
      else { audio.choose(); await reply(RAIN[pick].reply, token); if (RAIN[pick].heavy) { if (!ok()) return; setUI('end'); lock(false); q('.small.big').textContent = 'เส้นทาง “หน้าพัก” (ยังไม่ได้ทำ) — ตัวอย่างจบแค่นี้'; tin.classList.add('ready'); const r = await waitAct(); if (r?.a === 'again') return run(0); return; } }
      if (!ok()) return; await wait(REDUCE ? 100 : 500);
      break;
    }
    // --- 4 แบตเตอรี่ใจ ---
    if (!(await talk(['แบตเตอรี่ใจคุณ\nเหลือเท่าไหร่นะ\nลากดูได้เลย'], 'battery', token))) return;
    const r = await new Promise((res) => { const loop = async () => { const x = await waitAct(); if (!ok()) return res(null); if (x.a === 'batt-ok' || x.a === 'skip') res(x); else loop(); }; loop(); });
    if (!ok() || !r) return;
    audio.choose();
    if (r.a === 'skip') await reply(['ไม่เป็นไร', 'ไปต่อกัน'], token); else await reply(batteryReply(battV), token);
    if (!ok()) return;
    await wait(REDUCE ? 100 : 700); resetLight(); setUI('end'); lock(false); tin.classList.add('ready');
    const e = await waitAct(); if (e?.a === 'again') run(0);
  }

  /* ----- อินพุต ----- */
  el.addEventListener('click', (e) => {
    audio.unlock();
    if (e.target.closest('.sound')) return;
    const b = e.target.closest('[data-act]');
    const locked = !tin.classList.contains('ready') || uiLocked;
    if (b && !locked) { audio.tap(); act(b.dataset.act, b.dataset.i); return; }
    // แตะที่จอ (รวมปุ่มที่ล็อก) = จบท่อนที่กำลังพูด / ข้ามช่วงรอ
    if (T.typing && T.finish) T.finish(); else if (T.skipWait) T.skipWait();
  });
  el.querySelector('#tin').addEventListener('click', () => {});

  return {
    el,
    mount() { },
    start(from = 0) { el.classList.add('on'); audio.scene('shop'); audio.room(.22, 1400); ready(); setTimeout(layout, 50); run(from); },
    stop() { T.token++; el.classList.remove('on'); },
    resize: layout,
  };
}
