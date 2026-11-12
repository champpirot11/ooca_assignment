// หน้าแรก — ฝนตกเบาๆ, ooca ถือร่มเว้นที่ว่างไว้ข้างๆ (ชวนมายืนด้วยกัน), ปุ่มเข้า
// การแตะปุ่มนี้ = การแตะครั้งแรก → เบราว์เซอร์อนุญาตให้เล่นเสียง ฉากเกริ่น 1 จึงได้ยินเสียงฝนตั้งแต่เริ่ม
import { createRain } from '../lib/rain.js';
import { REDUCE } from '../lib/util.js';
import logoUrl from '../art/shop/ooca-logo.svg?url';
import umbrellaUrl from '../art/shop/m-umbrella.webp?url';

export function createHome({ onEnter }) {
  const el = document.createElement('section');
  el.className = 'home on'; el.setAttribute('aria-label', 'หน้าแรก ooca ร้านแผ่นเสียงฟังใจ');
  el.innerHTML = `
    <div class="hm-sky"><canvas class="hm-rain"></canvas><i class="hm-glow"></i>
      <img class="hm-masc" src="${umbrellaUrl}" alt="ooca มาสคอตก้อนเมฆถือร่ม เว้นที่ว่างข้างๆ ไว้ให้คุณ" draggable="false"><i class="hm-shadow"></i></div>
    <div class="hm-text">
      <img class="hm-logo" src="${logoUrl}" alt="ooca">
      <h1 class="hm-title">ร้านแผ่นเสียงฟังใจ</h1>
      <p class="hm-copy">ฝนในใจตกหนักแค่ไหน ก็แวะมาหลบได้นะ<br>เล่าให้ฟังสักนิด แล้วรับแผ่นเสียงกลับไปหนึ่งแผ่น</p>
    </div>
    <div class="hm-foot">
      <button class="hm-btn" id="hmgo">เข้าไปหลบฝน</button>
      <p class="hm-meta"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0116 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg>เปิดเสียงไว้จะดีที่สุด · ประมาณ 5 นาที</p>
      <p class="hm-meta sm">สิ่งที่คุณเล่าอยู่ในเครื่องคุณเท่านั้น ไม่ถูกส่งไปไหน</p>
    </div>`;
  const cv = el.querySelector('.hm-rain'); let rain = null;
  const ensure = () => { if (rain || REDUCE) return; rain = createRain(cv, { count: 120, startY: [-60, 260], strength: .55 }); rain.resize(); };
  el.querySelector('#hmgo').addEventListener('click', () => { onEnter(); });
  return {
    el,
    show() { el.classList.add('on'); ensure(); },
    hide() { el.classList.remove('on'); },
    get on() { return el.classList.contains('on'); },
    resize() { rain?.resize(); },
    tick(dt) { if (!rain || !el.classList.contains('on')) return; rain.step(dt); rain.render(); },
    mount() { ensure(); },
  };
}
