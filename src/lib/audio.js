// เสียงทั้งหมดสังเคราะห์สดด้วย Web Audio (ไม่มีไฟล์เสียง → ไม่มีปัญหาลิขสิทธิ์ และไฟล์เล็ก)
// ฝน = นอยส์กรองความถี่ + เม็ดฝนเป็นจังหวะสุ่ม · ก้าวเท้า = ตุบต่ำ + น้ำกระเซ็น · ไฟ = ฮัมอุ่นๆ + กระพริบ/แตกเปาะ
import rainUrl from '../art/audio/rain.ogg?url';
import stepUrl from '../art/audio/step-water.ogg?url';
import musicUrl from '../art/audio/shop-loop.mp3?url';
import introUrl from '../art/audio/intro-music.mp3?url';   // "Sad Quiet Goodbye Letter" — Alex Morgan (Pixabay)
const KEY = 'ooca-sound';
// ช่วงของแต่ละก้าวใน step-water.ogg [เริ่ม, ยาว] วินาที (ตามตารางตัดของผู้ทำไฟล์)
const STEP_SLICES = [[0.08, 0.854], [1.014, 0.704], [1.798, 0.624], [2.502, 0.624], [3.206, 0.854]];
const bufs = {}; let stepIdx = 0;
async function loadBuf(name, url) {
  try {
    let ab;
    if (url.startsWith('data:')) { const b = atob(url.split(',')[1]), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); ab = u.buffer; }   // ไฟล์เดียวแบบฝัง: ไม่ใช้ fetch
    else ab = await (await fetch(url)).arrayBuffer();
    bufs[name] = await ctx.decodeAudioData(ab); if (name === 'rain') startRain(); if (name === 'music' && M.on) useFileMusic(); if (name === 'intro') introSet();
  } catch (e) { console.warn('โหลดเสียงไม่ได้', name, e); }
}
function startRain() {
  if (bus.rain || !bufs.rain) return;
  const s = ctx.createBufferSource(); s.buffer = bufs.rain; s.loop = true; const g = ctx.createGain(); g.gain.value = 0; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 20000; s.connect(g); g.connect(lp); lp.connect(master); s.start(); bus.rain = g; bus.rainLP = lp;
}
let ctx = null, master = null, noiseBuf = null, muted = false, scn = null, dropTimer = 0;
try { muted = localStorage.getItem(KEY) === 'off'; } catch (e) {}
const bus = {};            // rainBed, rainLow, hum
let rainLevel = 0, rainTarget = 0, dropRate = 0;

function noise() {
  if (noiseBuf) return noiseBuf;
  const n = ctx.sampleRate * 3, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  let last = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = (w * .6 + last * 6) * .5; }   // ผสมขาว+น้ำตาลให้เสียงนุ่ม
  return (noiseBuf = b);
}
function loop(filters, gainVal) {
  const s = ctx.createBufferSource(); s.buffer = noise(); s.loop = true; s.loopStart = Math.random() * 2;
  let node = s; for (const f of filters) { node.connect(f); node = f; }
  const g = ctx.createGain(); g.gain.value = gainVal; node.connect(g); g.connect(master); s.start(); return g;
}
const filt = (type, f, q = .7) => { const x = ctx.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; return x; };

function init() {
  if (ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
  ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
  loadBuf('rain', rainUrl); loadBuf('step', stepUrl); loadBuf('music', musicUrl); loadBuf('intro', introUrl);        // ฝน = ไฟล์จริง CC0 (Ylmir + ลม + ฟ้าร้องไกลๆ) · ก้าวเท้า = ย่ำน้ำจริง CC0
  bus.rainBed = { gain: { setTargetAtTime() {} } }; bus.rainLow = bus.rainBed;
  // ฮัมหลอดไฟอุ่นๆ
  const hg = ctx.createGain(); hg.gain.value = 0; const hf = filt('lowpass', 420);
  [100, 150.4, 200.3].forEach((f, i) => { const o = ctx.createOscillator(); o.type = i ? 'sine' : 'sawtooth'; o.frequency.value = f; const og = ctx.createGain(); og.gain.value = [.5, .25, .18][i]; o.connect(og); og.connect(hf); o.start(); });
  hf.connect(hg); hg.connect(master); bus.hum = hg;
  setInterval(tickBeds, 100);
  // กลับเข้าแอปหลังพับจอ: iOS อาจค้างสถานะ interrupted → สั่งเล่นต่อทุกครั้งที่กลับมา/แตะจอ
  const wake = () => { if (ctx && !document.hidden && ctx.state !== 'running') ctx.resume().catch(() => {}); };
  document.addEventListener('visibilitychange', () => { if (!ctx) return; document.hidden ? ctx.suspend() : wake(); });
  ['pageshow', 'focus'].forEach((ev) => addEventListener(ev, wake)); ['touchend', 'pointerdown', 'keydown'].forEach((ev) => addEventListener(ev, wake, { passive: true }));
  return true;
}
function tickBeds() {      // ปรับความดังฝนอย่างนุ่มนวล + เม็ดฝนสุ่ม
  if (!ctx) return;
  rainLevel += (rainTarget - rainLevel) * .12;
  const wob = 1;
  if (bus.rain) bus.rain.gain.setTargetAtTime(rainLevel * .5 * wob, ctx.currentTime, .3);
}
function dropLoop() {
  clearTimeout(dropTimer);
  if (!ctx || muted || dropRate <= 0) { dropTimer = setTimeout(dropLoop, 400); return; }
  if (Math.random() < dropRate * .5) plink(.4 + Math.random() * .6);
  dropTimer = setTimeout(dropLoop, 90 + Math.random() * 160);
}
function burst({ dur = .08, f = 3000, q = 1, g = .05, type = 'bandpass', at = 0, pan = 0 }) {
  const t = ctx.currentTime + at, s = ctx.createBufferSource(); s.buffer = noise();
  const fl = filt(type, f, q), ga = ctx.createGain(); ga.gain.setValueAtTime(0, t); ga.gain.linearRampToValueAtTime(g, t + .004); ga.gain.exponentialRampToValueAtTime(.0001, t + dur);
  const out = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (out) out.pan.value = pan;
  s.connect(fl); fl.connect(ga); out ? (ga.connect(out), out.connect(master)) : ga.connect(master); s.start(t, Math.random() * 2, dur + .05);
}
function tone({ f = 600, f2 = 300, dur = .12, g = .04, type = 'sine', at = 0, pan = 0 }) {
  const t = ctx.currentTime + at, o = ctx.createOscillator(), ga = ctx.createGain(); o.type = type;
  o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  ga.gain.setValueAtTime(0, t); ga.gain.linearRampToValueAtTime(g, t + .005); ga.gain.exponentialRampToValueAtTime(.0001, t + dur);
  const out = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (out) out.pan.value = pan;
  o.connect(ga); out ? (ga.connect(out), out.connect(master)) : ga.connect(master); o.start(t); o.stop(t + dur + .05);
}
function plink(k = 1) { tone({ f: 1500 + Math.random() * 1800, f2: 700, dur: .06 + .05 * Math.random(), g: .012 * k, pan: Math.random() * 1.4 - .7 }); }

/* ---------- เพลงในร้าน: โลไฟแจ๊ซสั้นๆ สังเคราะห์เองในโค้ด (ไม่ใช้ไฟล์เพลง → ไม่มีเรื่องลิขสิทธิ์) ---------- */
const M = { on: false, bus: null, timer: 0, next: 0, bar: 0 };
const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
const CHORDS = [                    // Cmaj9 · Am9 · Dm9 · G13
  { b: 48, v: [52, 55, 59, 62] },
  { b: 45, v: [55, 59, 60, 64] },
  { b: 50, v: [53, 57, 60, 64] },
  { b: 43, v: [53, 59, 62, 64] },
];
const PENTA = [72, 74, 76, 79, 81, 84];
// เพลงคลอบทเกริ่น (เปียโนเศร้าเบาๆ) — เล่นวนใต้เสียงฝน ตั้งแต่ฉาก 1 จนเข้าร้าน แล้วเฟดออกให้เพลงในร้านแทน
const IN = { on: false, src: null, g: null };
function introSet() {
  if (!ctx || !bufs.intro) return;
  if (!IN.g) { IN.g = ctx.createGain(); IN.g.gain.value = 0; IN.g.connect(master); }
  const t = ctx.currentTime;
  if (IN.on && !IN.src) { const s = ctx.createBufferSource(); s.buffer = bufs.intro; s.loop = true; s.connect(IN.g); s.start(); IN.src = s; }
  IN.g.gain.cancelScheduledValues(t); IN.g.gain.setTargetAtTime(IN.on ? .32 : 0, t, IN.on ? 1.6 : 1.2);
  if (!IN.on && IN.src) { const s = IN.src; IN.src = null; setTimeout(() => { if (!IN.on) try { s.stop(); } catch (e) {} else IN.src = IN.src || s; }, 6000); }
}
function musicBus() {
  if (M.bus) return M.bus;
  const mg = ctx.createGain(); mg.gain.value = 0;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.Q.value = .5;
  const dl = ctx.createDelay(1); dl.delayTime.value = .39; const fb = ctx.createGain(); fb.gain.value = .3; const wet = ctx.createGain(); wet.gain.value = .22;
  const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 1800;
  mg.connect(lp); lp.connect(master); lp.connect(dl); dl.connect(dlp); dlp.connect(fb); fb.connect(dl); dlp.connect(wet); wet.connect(master);
  return (M.bus = mg);
}
function mnote(f, t, dur, g, type = 'sine', detune = 0) {
  const o = ctx.createOscillator(), ga = ctx.createGain(); o.type = type; o.frequency.value = f; o.detune.value = detune;
  ga.gain.setValueAtTime(0, t); ga.gain.linearRampToValueAtTime(g, t + .012); ga.gain.exponentialRampToValueAtTime(g * .35, t + .25); ga.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(ga); ga.connect(M.bus); o.start(t); o.stop(t + dur + .05);
}
function mnoise(t, dur, f, type, q, g) {
  const s = ctx.createBufferSource(); s.buffer = noise(); const fl = filt(type, f, q), ga = ctx.createGain();
  ga.gain.setValueAtTime(0, t); ga.gain.linearRampToValueAtTime(g, t + .003); ga.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(fl); fl.connect(ga); ga.connect(M.bus); s.start(t, Math.random() * 2, dur + .05);
}
function mkick(t) { const o = ctx.createOscillator(), ga = ctx.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(45, t + .12); ga.gain.setValueAtTime(.09, t); ga.gain.exponentialRampToValueAtTime(.0001, t + .2); o.connect(ga); ga.connect(M.bus); o.start(t); o.stop(t + .25); }
function scheduleBar(t0) {
  const BEAT = 60 / 74, c = CHORDS[M.bar % 4];
  const rh = (n, t, dur, g) => { mnote(mtof(n), t, dur, g, 'sine'); mnote(mtof(n) * 2, t, dur * .5, g * .22, 'sine'); mnote(mtof(n), t, dur, g * .3, 'triangle', 6); };
  c.v.forEach((n, i) => rh(n, t0 + i * .014, BEAT * 3.2, .03));                  // คอร์ดเต็ม จังหวะที่ 1
  c.v.forEach((n, i) => rh(n, t0 + BEAT * 2.5 + i * .01, BEAT * 1.2, .018));      // เคาะเบาๆ จังหวะ 3.5
  mnote(mtof(c.b), t0, BEAT * 1.8, .09, 'sine'); mnote(mtof(c.b), t0 + BEAT * 2, BEAT * 1.2, .06, 'sine');
  mkick(t0); mkick(t0 + BEAT * 2.5);
  mnoise(t0 + BEAT, .12, 2400, 'bandpass', .8, .016); mnoise(t0 + BEAT * 3, .12, 2400, 'bandpass', .8, .016);   // สแนร์แปรงนุ่ม
  for (let k = 0; k < 8; k++) mnoise(t0 + BEAT * (k / 2) + (k % 2 ? BEAT * .06 : 0), .04, 7500, 'highpass', .5, k % 2 ? .006 : .01);   // ไฮแฮตสวิง
  if (Math.random() < .75) {                                                      // ทำนองสั้นๆ แบบเลือกโน้ตสุ่ม ไม่ซ้ำกันทุกรอบ
    const slots = [1, 1.5, 2.5, 3, 3.5].sort(() => Math.random() - .5).slice(0, 2 + Math.floor(Math.random() * 2)).sort((a, b) => a - b);
    let idx = Math.floor(Math.random() * PENTA.length);
    slots.forEach(b => { idx = Math.max(0, Math.min(PENTA.length - 1, idx + Math.floor(Math.random() * 3) - 1)); mnote(mtof(PENTA[idx]), t0 + BEAT * b, BEAT * 1.4, .022, 'triangle'); });
  }
  for (let k = 0; k < 6; k++) mnoise(t0 + Math.random() * BEAT * 4, .012, 4000 + Math.random() * 3000, 'highpass', .5, .008 + Math.random() * .01);   // เสียงเข็มแผ่นเสียงแตกปุ๊บปั๊บ
  M.bar++; return BEAT * 4;
}
function useFileMusic() {      // มีไฟล์เพลงจริง (Pixabay) → ใช้ไฟล์ แล้วหยุดเพลงสังเคราะห์
  if (!ctx || !M.on || M.src || !bufs.music) return;
  const b = musicBus(), g = ctx.createGain(), t = ctx.currentTime;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.55, t + 3);
  const src = ctx.createBufferSource(); src.buffer = bufs.music; src.loop = true; src.connect(g); g.connect(b); src.start();
  M.src = src; M.fileG = g; M.synth = false; clearInterval(M.timer);
}
function musicTick() {
  if (!ctx || !M.on) return;
  while (M.next < ctx.currentTime + .6) M.next += scheduleBar(Math.max(M.next, ctx.currentTime + .05));
}
function musicOn(on) {
  if (!ctx) return;
  const b = musicBus(), t = ctx.currentTime;
  if (on && !M.on) {
    M.on = true; b.gain.cancelScheduledValues(t); b.gain.setTargetAtTime(.9, t, 2.5);
    if (bufs.music) useFileMusic();
    else { M.synth = true; M.next = t + .2; clearInterval(M.timer); M.timer = setInterval(musicTick, 200); musicTick(); }   // ไฟล์ยังโหลดไม่เสร็จ/โหลดไม่ได้ → เพลงสังเคราะห์เป็นตัวสำรอง
  } else if (!on && M.on) {
    M.on = false; b.gain.setTargetAtTime(0, t, .8); clearInterval(M.timer);
    if (M.src) { const s = M.src; M.src = null; setTimeout(() => { try { s.stop(); } catch (e) {} }, 4000); }
  }
}

// ข้อ 4: วลีดนตรีสั้นๆ ~4–5 วิ บุคลิกต่างกันตามแต่ละตัวเลือก (เรียงตาม SONGS) · กดข้อใหม่ = วลีเก่าหยุด · เพลงร้านเบาลงระหว่างเล่น
const N = (m) => 440 * Math.pow(2, (m - 69) / 12);
const VB = { nodes: [], g: null, t: 0 };
function vbus() {
  if (VB.g) return VB.g;
  const g = ctx.createGain(); g.gain.value = 1; const dl = ctx.createDelay(1); dl.delayTime.value = .32; const fb = ctx.createGain(); fb.gain.value = .28; const wet = ctx.createGain(); wet.gain.value = .25; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
  g.connect(master); g.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(master);
  return (VB.g = g);
}
function v(m, at, dur, g, type = 'triangle', cut = 0) {   // โน้ตหนึ่งตัว: เข้าเร็ว ค่อยๆ จาง (คล้ายเปียโน/ระฆัง)
  const t = ctx.currentTime + at, o = ctx.createOscillator(), ga = ctx.createGain(); o.type = type; o.frequency.value = typeof m === 'number' && m < 200 ? N(m) : m;
  ga.gain.setValueAtTime(0, t); ga.gain.linearRampToValueAtTime(g, t + .015); ga.gain.exponentialRampToValueAtTime(g * .4, t + Math.min(.5, dur * .4)); ga.gain.exponentialRampToValueAtTime(.0001, t + dur);
  let last = ga; if (cut) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; ga.connect(f); last = f; }
  o.connect(ga); last.connect(vbus()); o.start(t); o.stop(t + dur + .05); VB.nodes.push(o);
}
const chord = (ms, at, dur, g, type, roll = .03) => ms.forEach((m, i) => v(m, at + i * roll, dur, g, type));
const VIBE = [
  () => { [72, 76, 79, 84].forEach((m, i) => v(m, i * .12, .9, .07)); [79, 81, 79, 76, 77, 76, 72].forEach((m, i) => v(m, .7 + i * .3, .6, .06)); chord([60, 64, 67], .6, 3.6, .035, 'sine'); chord([65, 69, 72], 2.4, 2.2, .03, 'sine'); },   // สดใส
  () => { chord([53, 57, 60, 64], 0, 2.6, .05, 'sine', .14); chord([48, 52, 55, 59], 2.2, 2.6, .05, 'sine', .14); v(69, .6, 1.6, .045, 'triangle'); v(67, 2.8, 1.8, .045, 'triangle'); },   // ช้าๆ สบาย
  () => { chord([57, 60, 64], 0, 2.4, .05, 'triangle', .06); [76, 74, 72, 71].forEach((m, i) => v(m, .5 + i * .55, 1.1, .055)); chord([53, 57, 60], 2.4, 2.4, .045, 'triangle', .06); v(69, 3.4, 1.6, .05); },   // เศร้า
  () => { v(88, 0, 2.6, .035, 'sine'); v(83, 1.9, 2.8, .028, 'sine'); v(76, 3.4, 1.6, .02, 'sine'); },   // เงียบๆ: เสียงระฆังห่างๆ
  () => { [0, .5, .9, 1.25, 1.55].forEach((at) => { tone({ f: 120, f2: 42, dur: .4, g: .13, at }); [40, 47, 52].forEach((m) => v(m, at, .5, .05, 'sawtooth', 700)); }); [40, 47, 52, 55].forEach((m, i) => v(m, 2 + i * .02, 2.8, .05, 'sawtooth', 1100)); },   // หนักๆ ระบาย: ทุ้มหนักเร่งขึ้นแล้วปล่อย
  () => { [79, 76, 72, 74, 76, 79, 81, 79].forEach((m, i) => v(N(m) * (1 + (Math.random() - .5) * .006), i * .45, 1.1, .05, 'triangle')); chord([48, 55, 64], 0, 3.8, .025, 'sine', .1); },   // คิดถึงวันเก่า: กล่องดนตรี
  () => { for (let k = 0; k < 4; k++) [64, 67, 71, 67].forEach((m, i) => v(m, k * .95 + i * .23, .5, .045 - k * .006, 'sine')); chord([52, 59], 0, 4.2, .03, 'sine'); },   // วนๆ คิดไม่หยุด
  () => { [60, 62, 64, 67, 69, 72, 76].forEach((m, i) => v(m, i * .42, 1, .03 + i * .007)); chord([60, 64, 67, 72], 3, 2, .045, 'sine', .05); },   // ค่อยๆ ดีขึ้น
];
export const audio = {
  // ข้อ 4: เพลงร้านเฟดหาย (0) แล้วกลับมาเท่าเดิม (1) ตอนไปข้อ 5
  duck(k) { if (!ctx || !M.bus || !M.on) return; const t = ctx.currentTime; M.bus.gain.cancelScheduledValues(t); M.bus.gain.setTargetAtTime(.9 * k, t, k ? 1.2 : .6); },
  vibe(i) {
    if (!ctx || !VIBE[i]) return; const t = ctx.currentTime;
    VB.nodes.forEach((o) => { try { o.stop(t + .08); } catch (e) {} }); VB.nodes = [];
    vbus().gain.cancelScheduledValues(t); VB.g.gain.setValueAtTime(0, t); VB.g.gain.linearRampToValueAtTime(2.4, t + .1);   // ดังขึ้นชัดๆ   // ตัดวลีเก่านุ่มๆ
    VIBE[i]();

  },
  get muted() { return muted; },
  get running() { return !!ctx && ctx.state === 'running'; },
  unlock() { if (!init()) return; if (ctx.state === 'suspended') ctx.resume(); dropLoop(); },
  setMuted(m) { muted = m; try { localStorage.setItem(KEY, m ? 'off' : 'on'); } catch (e) {} if (ctx) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, .08); },
  music(on) { musicOn(on); },
  // ฉาก: เปลี่ยนความดังของฝนและพื้นเสียงตามหน้า
  scene(name, stage) {
    const S = { home: [.45, 0], shopfront: [.8, 0], rain: [1, .0], hand: [.65, .55], walk: [.85, 0], shop: [.45, 0] };
    const [r, d] = S[name] || [0, 0];
    const inside = name === 'shop' || name === 'home';   // หน้าแรกก็อยู่ในร้าน: ฝนข้างนอกอู้อี้ + เพลงร้าน
    rainTarget = r; dropRate = 0; scn = name + (stage || ''); if (ctx && bus.rainLP) bus.rainLP.frequency.setTargetAtTime(inside ? 1500 : 20000, ctx.currentTime, .3);
    if (inside && ctx) bus.hum.gain.setTargetAtTime(.012, ctx.currentTime, 1.2);
    musicOn(inside); IN.on = ['rain', 'hand', 'walk', 'shopfront'].includes(name); introSet();
    if (!inside && name !== 'walk' && ctx) bus.hum.gain.setTargetAtTime(0, ctx.currentTime, .4);
  },
  // ในร้าน: ฝนข้างนอกเบาลงและอู้อี้ (level 0..1, cutoff Hz) + ฮัมไฟเบาๆ
  room(level, cutoff = 1500) { rainTarget = level; if (ctx && bus.rainLP) bus.rainLP.frequency.setTargetAtTime(cutoff, ctx.currentTime, .6); },
  // เสียงมูก้าพูด: ปิ๊บสั้นๆ ทีละตัวอักษร (i = ลำดับตัวอักษร ใช้เปลี่ยนโน้ตเล็กน้อย ไม่ให้ซ้ำจนน่ารำคาญ)
  blip(i = 0) { if (!ctx || muted) return; const n = [0, 3, 7, 5, 10, 2][i % 6]; const f = 520 * Math.pow(2, n / 12) * (1 + Math.random() * .02); tone({ f, f2: f * .97, dur: .06, g: .022, type: 'triangle' }); },
  pop() { if (!ctx || muted) return; tone({ f: 300, f2: 620, dur: .09, g: .03, type: 'sine' }); tone({ f: 900, f2: 900, dur: .05, g: .008, at: .05 }); },
  pick(n = 1) { if (!ctx || muted) return; const f = 520 * Math.pow(2, ([0, 2, 4, 7, 9, 12][Math.min(5, Math.max(0, n - 1))]) / 12); tone({ f, f2: f, dur: .16, g: .022, type: 'sine' }); tone({ f: f * 2, f2: f * 2, dur: .22, g: .008, at: .04 }); },
  choose() { if (!ctx || muted) return; tone({ f: 660, f2: 660, dur: .12, g: .02, type: 'sine' }); tone({ f: 990, f2: 990, dur: .18, g: .012, at: .06 }); },
  rainLevel(l) { if (!ctx || muted) return; for (let k = 0; k < 2 + Math.round(l * 3); k++) plink(.5 + l); },
  tickN(v) { if (!ctx || muted) return; tone({ f: 380 + v * 520, f2: 380 + v * 520, dur: .05, g: .016, type: 'square' }); },
  tap() { if (!ctx || muted) return; tone({ f: 520, f2: 380, dur: .07, g: .018, type: 'sine' }); },
  back() { if (!ctx || muted) return; tone({ f: 380, f2: 280, dur: .07, g: .016 }); },
  // เอฟเฟกต์ในร้าน (สังเคราะห์สด เบาๆ ไม่รบกวน)
  fx(n, v = 0) {
    if (!ctx || muted) return;
    const F = {
      tear: () => { burst({ dur: .16, f: 2600, q: .6, g: .05 }); burst({ dur: .12, f: 4200, q: .8, g: .035, at: .07 }); },
      land: () => { tone({ f: 190, f2: 120, dur: .07, g: .03 }); burst({ dur: .03, f: 1800, q: .7, g: .02 }); },
      cloth: () => burst({ dur: .22, f: 900, q: .5, g: .03, type: 'lowpass' }),
      foot: () => { tone({ f: 120, f2: 70, dur: .08, g: .03 }); burst({ dur: .025, f: 700, q: .8, g: .012 }); },
      face: () => { tone({ f: 420 + v * 90, f2: 380 + v * 90, dur: .12, g: .022, type: 'triangle' }); for (let k = 0; k <= v; k++) plink(.6 + v * .3); },
      seg: () => tone({ f: 330 * Math.pow(2, v / 12), f2: 330 * Math.pow(2, v / 12), dur: .07, g: .018, type: 'triangle' }),
      rummage: () => { burst({ dur: .07, f: 1400, q: 1.2, g: .03 }); tone({ f: 240, f2: 200, dur: .05, g: .02, at: .05 }); },
      found: () => [0, 4, 7, 12].forEach((n, i) => tone({ f: 523 * Math.pow(2, n / 12), f2: 523 * Math.pow(2, n / 12), dur: .22, g: .02, at: i * .09 })),
      needle: () => { tone({ f: 110, f2: 45, dur: .22, g: .09 }); burst({ dur: .5, f: 5200, q: .4, g: .012, at: .08 }); },
      print: () => { for (let i = 0; i < 12; i++) burst({ dur: .04, f: 1800 + (i % 3) * 500, q: 2, g: .022, at: i / 14 }); },
      stamp: () => { tone({ f: 130, f2: 45, dur: .2, g: .1 }); burst({ dur: .05, f: 900, q: .7, g: .05 }); },
      type: () => tone({ f: 760 + Math.random() * 80, f2: 700, dur: .03, g: .01, type: 'triangle' }),
      soft: () => { tone({ f: 392, f2: 392, dur: .5, g: .016 }); tone({ f: 523, f2: 523, dur: .7, g: .012, at: .12 }); },
      bye: () => [0, 7, 12, 16].forEach((n, i) => tone({ f: 392 * Math.pow(2, n / 12), f2: 392 * Math.pow(2, n / 12), dur: .9, g: .014, at: i * .22 })),
    };
    F[n]?.();
  },
  // เม็ดฝนตกลงฝ่ามือ
  palm() { if (!ctx || muted) return; plink(1.6); if (Math.random() < .4) burst({ dur: .05, f: 4500, q: 2, g: .01 }); },
  // เท้าลงพื้นเปียก (side: -1 ซ้าย, 1 ขวา)
  step(side = 1) {
    if (!ctx || muted || !bufs.step) return;
    const [st, du] = STEP_SLICES[stepIdx = (stepIdx + 1 + Math.floor(Math.random() * 3)) % STEP_SLICES.length];   // สุ่มก้าว ไม่ซ้ำติดกัน
    const src = ctx.createBufferSource(); src.buffer = bufs.step; src.playbackRate.value = .94 + Math.random() * .12;
    const g = ctx.createGain(), t = ctx.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.55, t + .01); g.gain.setTargetAtTime(0, t + du * .8, .05);
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (pan) pan.pan.value = side * .25;
    src.connect(g); pan ? (g.connect(pan), pan.connect(master)) : g.connect(master); src.start(t, st, du); src.stop(t + du + .1);
    tone({ f: 90, f2: 50, dur: .18, g: .04, pan: side * .2 });      // น้ำหนักเท้าเบาๆ
  },
  // แสงจากร้าน: l = 0..1 ระดับแสง, flick = ค่ากระพริบ (รอบๆ 1)
  light(l, flick) {
    if (!ctx) return; const t = ctx.currentTime;
    bus.hum.gain.setTargetAtTime(l * .03 * Math.max(0, 1 + (flick - 1) * 6), t, .05);
    if (l > .15 && flick < .975 && Math.random() < .25) burst({ dur: .012, f: 2500, q: .5, g: .05 * l, type: 'highpass' });   // แตกเปาะตอนไฟกระพริบ
  },
  lightOn() { if (!ctx || muted) return; tone({ f: 880, f2: 880, dur: .9, g: .012, type: 'sine' }); tone({ f: 1320, f2: 1320, dur: 1.2, g: .008, at: .08 }); burst({ dur: .02, f: 3000, q: .5, g: .06, type: 'highpass' }); },
};
