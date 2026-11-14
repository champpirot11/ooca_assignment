// วาดใบเสร็จลง canvas แล้วคืน URL ของรูป PNG (ทำงานในเครื่องผู้ใช้ทั้งหมด ไม่อัปโหลดไปไหน)
const SEGW = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
function wrap(c, t, mw) {
  const seg = SEGW ? [...SEGW.segment(t)].map((x) => x.segment) : t.split(/(\s+)/), L = []; let cur = '';
  for (const w of seg) { if (c.measureText(cur + w).width > mw && cur) { L.push(cur.trim()); cur = w; } else cur += w; }
  if (cur.trim()) L.push(cur.trim()); return L;
}
function paint(c, d, logo, on) {
  const W = 600, P = 44, mw = W - P * 2, F = (w, s) => `${w} ${s}px 'Gotham Rounded', Prompt, sans-serif`; let y = 40;
  // จัดกึ่งกลาง/ชิดขวาเองด้วยการวัดความกว้าง (Safari บางรุ่นไม่สนใจ textAlign กับข้อความไทย)
  const T = (t, x, f, col, al = 'left') => { c.font = f; if (on) { c.fillStyle = col; c.textAlign = 'left'; const w = c.measureText(t).width; c.fillText(t, al === 'center' ? x - w / 2 : al === 'right' ? x - w : x, y); } };
  const dash = () => { y += 12; if (on) { c.strokeStyle = '#d9d9d9'; c.lineWidth = 2; c.setLineDash([8, 6]); c.beginPath(); c.moveTo(P, y); c.lineTo(W - P, y); c.stroke(); c.setLineDash([]); } y += 30; };
  if (on && logo) c.drawImage(logo, W / 2 - 62, y, 124, 124 * logo.height / logo.width); y += 84;
  T('ร้านแผ่นเสียง ooca - ฟังใจ', W / 2, F(500, 26), '#2b2b2b', 'center'); y += 32; T('ที่หลบฝนสำหรับใจที่เหนื่อย', W / 2, F(400, 19), '#5b5b5b', 'center'); y += 44;
  T(d.when, P, F(400, 18), '#8d8d8d'); T('#0001', W - P, F(400, 18), '#8d8d8d', 'right'); dash();
  // ปกแผ่นเล็กๆ หน้ารายการแผ่นเสียง
  const cw = 58, cx = P + cw + 14; if (on && d.coverImg) c.drawImage(d.coverImg, P, y - 22, cw, cw * 86 / 89);
  T(`แผ่นเสียง · ${d.mood.th} (${d.mood.en})`, cx, F(400, 20), '#2b2b2b'); T('0.00', W - P, F(400, 20), '#2b2b2b', 'right'); y += 28; T('เพลง: ' + d.track, cx, F(400, 17), '#8d8d8d'); y += 34;
  if (d.why) { c.font = F(400, 16); for (const l of wrap(c, 'เลือกให้จาก: ' + d.why, mw)) { T(l, P, F(400, 16), '#8d8d8d'); y += 26; } y += 8; }   // เหตุผลที่ได้เพลงนี้
  for (const r of ['ที่นั่งหลบฝน (ไม่จำกัดเวลา)', 'คนฟังคุณเล่า']) { T(r, P, F(400, 20), '#2b2b2b'); T('0.00', W - P, F(400, 20), '#2b2b2b', 'right'); y += 34; } y -= 12; dash();
  T('รวมทั้งหมด', P, F(500, 26), '#2b2b2b'); T('0.00', W - P, F(500, 26), '#2b2b2b', 'right'); y += 34; T('ชำระด้วย: การเข้ามาหลบฝน', P, F(400, 19), '#2b2b2b'); dash();
  T('ถึงคุณ' + (d.topic ? ' เรื่อง' + d.topic : ''), P, F(400, 18), '#8d8d8d'); y += 8; c.font = F(500, 24);
  for (const l of wrap(c, d.heart, mw)) { y += 38; T(l, P, F(500, 24), '#00897D'); } y += 34; T('— ooca', W - P, F(400, 18), '#8d8d8d', 'right'); dash();
  if (d.action) {   // กล่อง "ลองทำสัก 1 นาที" ให้ตรงกับใบเสร็จบนจอ
    c.font = F(400, 20); const L = wrap(c, d.action, mw - 40), bh = 46 + L.length * 32;
    if (on) { c.fillStyle = '#EFEFF3'; c.beginPath(); if (c.roundRect) c.roundRect(P, y - 26, mw, bh, 16); else c.rect(P, y - 26, mw, bh); c.fill(); }
    y += 4; T('ลองทำสัก 1 นาที', P + 20, F(400, 17), '#8d8d8d'); for (const l of L) { y += 32; T(l, P + 20, F(400, 20), '#2b2b2b'); } y += bh - 36 - L.length * 32 + 6; dash();
  }
  const help = d.heavy ? ['สายด่วนสุขภาพจิต 1323 (24 ชั่วโมง)', 'ถ้าอยู่ในอันตรายตอนนี้โทร 1669'] : ['ถ้าอยากคุยกับใครสักคน', 'โทร 1323 ได้ตลอด 24 ชั่วโมง'];
  T(help[0], W / 2, F(d.heavy ? 500 : 400, 18), '#8a5a50', 'center'); y += 28; T(help[1], W / 2, F(400, 18), '#8a5a50', 'center'); dash();
  T('ขอบคุณที่แวะมานะครับ', W / 2, F(400, 20), '#5b5b5b', 'center'); y += 30; T('ฝนหยุดเมื่อไหร่ ก็กลับมาได้เสมอ', W / 2, F(400, 20), '#5b5b5b', 'center'); y += 26;
  if (on) { c.fillStyle = '#2b2b2b'; for (let x = P + 30, i = 0; x < W - P - 30; i++) { const w = [2, 4, 2, 6, 3][i % 5]; c.fillRect(x, y, w, 40); x += w + [3, 2, 5, 3, 4][i % 5]; } } y += 66;
  return y;
}
export async function saveReceipt(d) {
  try { await Promise.all([document.fonts.load('400 20px Prompt'), document.fonts.load('500 20px Prompt')]); } catch (e) {}
  const img = (src) => new Promise((res) => { if (!src) return res(null); const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  const [logo, coverImg] = await Promise.all([img(d.logoUrl), img(d.cover)]); d = { ...d, coverImg };
  const W = 600, H = paint(document.createElement('canvas').getContext('2d'), d, logo, false) + 16, k = 2;
  const cv = document.createElement('canvas'); cv.width = W * k; cv.height = H * k; const c = cv.getContext('2d'); c.scale(k, k);
  c.fillStyle = '#F7F7F9'; c.fillRect(0, 0, W, H - 16); paint(c, d, logo, true);
  c.fillStyle = '#F7F7F9'; c.beginPath(); c.moveTo(0, H - 16); for (let x = 0; x <= W; x += 20) { c.lineTo(x + 10, H); c.lineTo(x + 20, H - 16); } c.fill();
  return new Promise((res) => cv.toBlob((b) => res(b ? URL.createObjectURL(b) : null), 'image/png'));
}
