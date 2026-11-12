// ฟอนต์อังกฤษ Gotham Rounded (ภาษาไทยใช้ Prompt อัตโนมัติ เพราะ Gotham ไม่มีตัวอักษรไทย)
// วางไฟล์ฟอนต์ที่มีสิทธิ์ใช้บนเว็บไว้ใน src/fonts/ ตั้งชื่อให้มีคำบอกน้ำหนัก เช่น
//   GothamRounded-Book.woff2 (400) · GothamRounded-Medium.woff2 (500) · GothamRounded-Bold.woff2 (600/700)
// ถ้ายังไม่มีไฟล์ หน้าเว็บใช้ Prompt แทนทั้งหมด
const files = import.meta.glob('./fonts/*.{woff2,woff,otf,ttf}', { eager: true, query: '?url', import: 'default' });
const W = [[/light/i, 300], [/book|regular/i, 400], [/medium/i, 500], [/semi|bold/i, 600]];
for (const [path, url] of Object.entries(files)) {
  const w = (W.find(([re]) => re.test(path)) || [, 400])[1];
  const f = new FontFace('Gotham Rounded', `url(${url})`, { weight: w === 600 ? '600 700' : String(w), style: /italic/i.test(path) ? 'italic' : 'normal', unicodeRange: 'U+0000-024F, U+2000-206F, U+20AC' });
  f.load().then((ff) => document.fonts.add(ff)).catch(() => {});
}
