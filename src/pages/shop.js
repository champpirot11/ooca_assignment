// หน้า 5 — หน้าร้านแผ่นเสียง (ภาพโดย Panupong: prologue_5.svg ตัดแถบสถานะ/ข้อความออก ใช้ของจริงในแอปแทน)
// เพิ่มแสง: กระจกเป็นสีไฟอุ่น, แสงฟุ้งออกนอกหน้าต่าง, ป้ายร้านสว่างนิดๆ, แสงวาบบนกระจกเป็นระยะ
import art from '../art/p5-scene.svg?raw';

export function createShopPage() {
  const el = document.createElement('section');
  el.className = 'page p5'; el.setAttribute('aria-label', 'หน้า 5 ร้านแผ่นเสียง ooca ฟังใจ');
  el.innerHTML = `<div class="art">${art}</div>`;
  return { el, mount() {}, enter() { el.classList.remove('lit'); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('lit'))); }, leave() { el.classList.remove('lit'); }, resize() {}, tick() {} };
}
