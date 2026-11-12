# ooca · A Small Mental Health Experience — บทเกริ่น (Prologue)

เว็บมือถือขนาดเล็กสำหรับ assignment ของ ooca  
**คอนเซปต์:** ร้านแผ่นเสียงที่ซ่อนอยู่ข้างทาง — ฝนคือสิ่งที่ผู้ใช้เจอมา ส่วนร้านคือที่หลบฝน  
ตอบคำถามสั้นๆ → ได้เพลงที่คัดมาให้ → จบด้วยใบเสร็จที่มีประโยคเล็กๆ ให้ใจชื้นขึ้น

> สถานะตอนนี้: **บทเกริ่น หน้า 1–4 เสร็จ**, หน้า 5 (หน้าร้าน) รอภาพจากดีไซน์, ฉากในร้านและคำถามยังไม่ทำ

## รัน

```bash
npm install
npm run dev            # เปิดที่ http://localhost:5173 (แนะนำเปิดในโหมดมือถือของเบราว์เซอร์)
npm run build          # ได้โฟลเดอร์ dist/ (ใช้ base './' ขึ้น GitHub Pages ได้เลย)
npm run build:single   # ได้ dist-single/index.html ไฟล์เดียว ไว้ส่งดูบนมือถือ
```

พารามิเตอร์สำหรับทดสอบ: `?step=3` เริ่มที่หน้า 3 · `&t=5` ข้ามเวลาไปข้างหน้า 5 วินาที · `&rain=0` ปิดฝน

## โครงสร้าง

```
src/
  main.js            ลำดับ 5 หน้า, ข้อความพาดหัว, progress, ปุ่มกลับ/ข้าม, แตะเพื่อไปต่อ
  style.css          UI ร่วมทุกหน้า (หน่วย --u = 1px ของดีไซน์ 390×844)
  pages/
    rain.js          หน้า 1  เมฆ + ฝน 3D
    hand.js          หน้า 2  มือรับฝน (Three.js, โมเดล 3D + cel-shade)
    walk.js          หน้า 3–4 ขาเดิน 8 ท่า → ชะลอ → หยุด → แสงอุ่นเข้ามา (ฉากเดียว 2 สถานะ)
    shop.js          หน้า 5  หน้าร้าน (รอภาพ: วาง src/art/p5-shop.svg หรือ .png ขนาด 390×844 แล้วระบบดึงไปใช้เอง)
  lib/
    rain.js          ฝน 3D ที่ใช้ร่วมกัน   ripples.js วงน้ำบนพื้น   frames.js ท่าเดิน (จาก SVG ที่วาดเอง)
  art/               พื้นหลัง/พื้น/ท่าเดิน/โมเดลมือ
```

ค่าที่ปรับได้อยู่ที่หัวไฟล์ `WALK` ใน `pages/walk.js` (ความเร็วเดิน, เวลาแสงเข้า, เกรเดียนต์มืด ฯลฯ) และ `STEPS` ใน `main.js` (ข้อความ, เวลาหน่วง)

## การตัดสินใจด้าน UX

- แตะที่ไหนก็ได้บนจอเพื่อไปต่อ; คำว่า "แตะเพื่อไปต่อ" ค่อยๆ โผล่หลังผู้ใช้มีเวลาอ่านแล้ว (ไม่กระพริบทันที) และมีปุ่ม **ย้อนกลับ / ข้ามบทเกริ่น** ตลอด
- หน้าสุดท้ายเปลี่ยนเป็นปุ่มจริง (ไม่ใช่แค่ข้อความ) เพื่อให้รู้ว่าจุดนี้คือทางเข้า
- Touch target ≥ 44px, margin ข้าง 24, safe area บน 47 / ล่าง 34 ตามกริด 4 คอลัมน์ใน Figma
- มีเสียงประกอบ (ฝน ก้าวเท้า ไฟ) เริ่มหลังแตะครั้งแรก และมีปุ่มปิดเสียงเสมอ
- เคารพ `prefers-reduced-motion` (ปิดฝน/เมฆลอย/ขาเดิน เหลือภาพนิ่ง)
- ตัวอักษรเป็นข้อความจริง (อ่านด้วย screen reader ได้) ไม่ใช่ภาพ

## การใช้ AI (AI-use disclosure)

- **งานออกแบบ (Figma): ออกแบบและวาดเองทั้งหมดโดยผู้ทำ** — ภาพประกอบ ตัวละคร ท่าเดิน 9 ท่า พื้นหลัง เลย์เอาต์ ข้อความ และดีไซน์ทุกหน้าจอ
- **โค้ด: เขียนด้วยความช่วยเหลือของ Claude (Anthropic)** ตามที่โจทย์อนุญาต — ผู้ทำเป็นผู้กำหนดคอนเซปต์ ทิศทางการเคลื่อนไหว และตรวจเทียบกับดีไซน์
- AI ให้ภาพ **reference** (ผังร้าน, ตัวอย่างเลย์เอาต์) ระหว่างคิดงานเท่านั้น และไม่ถูกนำมาใช้เป็นหน้าจอส่งงาน

## เครดิตและลิขสิทธิ์ของ asset

| รายการ | ที่มา | สัญญาอนุญาต |
|---|---|---|
| ภาพประกอบทุกชิ้น (เมฆ ขา พื้น แสง) | วาดเองใน Figma | ของผู้ทำ |
| `src/art/r_hand.glb` โมเดลมือ 3D | **TODO: ใส่ชื่อผู้สร้าง + ลิงก์ + license ให้ตรงกับที่ดาวน์โหลดมา** | ตรวจสอบก่อนส่ง |
| `src/art/audio/rain.ogg` เสียงฝน (ผสมจาก 3 แหล่ง) | [Rain (loopable)](https://opengameart.org/content/rain-loopable) โดย Ylmir · [wind1](https://opengameart.org/content/wind1) โดย Luke.RUSTLTD · [100 CC0 SFX #2](https://opengameart.org/content/100-cc0-sfx-2) โดย rubberduck (ฟ้าร้องไกลๆ) — มิกซ์เป็นลูปโดย roxycon-dev/Ciallo-Reader | CC0 1.0 |
| `src/art/audio/step-water.ogg` เสียงย่ำน้ำ | [Footsteps_Walk.wav](https://freesound.org/people/Nox_Sound/sounds/490951/) โดย Nox_Sound · [Wading in Shallow Water.wav](https://freesound.org/people/ryansitz/sounds/342932/) โดย ryansitz — ตัดต่อโดย dgreenheck/tidewater | CC0 1.0 |
| `src/art/audio/shop-loop.mp3` เพลงพื้นหลังในร้าน | [Piano Background Gentle Study Flow](https://pixabay.com/th/music/%E0%B8%A5%E0%B8%B0%E0%B8%84%E0%B8%A3%E0%B9%80%E0%B8%A5%E0%B8%81-piano-background-gentle-study-flow-578490/) โดย alex-morgan จาก Pixabay — ตัดต่อเป็นลูปเนียน ปรับความดัง และบีบอัดเป็นโมโน 72 kbps (ไม่ใช่ไฟล์ต้นฉบับ) | [Pixabay Content License](https://pixabay.com/service/license-summary/) (ใช้ฟรีรวมเชิงพาณิชย์ ไม่ต้องให้เครดิตแต่ใส่ไว้เพื่อความโปร่งใส) |
| เสียงไฟฮัม/กระพริบ, เสียงแตะ, เสียงหยดบนฝ่ามือ | สังเคราะห์สดด้วย Web Audio ใน `src/lib/audio.js` | ของผู้ทำ |
| Three.js r128 | mrdoob/three.js | MIT |
| ฟอนต์ Prompt (@fontsource/prompt) | Cadson Demak | SIL OFL 1.1 |
| Vite | vitejs/vite | MIT |
