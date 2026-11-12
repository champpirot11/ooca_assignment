// ฝน 3D (Three.js) ที่ใช้ร่วมกันทุกหน้า — เส้นฝนมีมิติใกล้/ไกล วาดลงแคนวาสโปร่งใส
// ใช้สี per-vertex RGBA + normal blending (ห้ามใช้ AdditiveBlending บนแคนวาสโปร่งใส จะเป็นเส้นดำ)
import * as THREE from 'three';
import { rnd, sm, DW, DH } from './util.js';

const FOV = 42, CAMZ = 7.2;

export function createRain(canvas, opt) {
  const R = {
    count: 100, startY: [330, 470], fadeIn: 90, speed: [5, 11], length: [.35, .8],
    slant: -0.08, color: [.62, .78, .76], strength: .6,
    land: null,            // [yไกล, yใกล้] ถ้ามี = ตกลงถึงพื้นแล้ววนใหม่ (ใช้กับฉากเดิน); ไม่มี = ตกยาวพ้นจอ
    onLand: null,          // (xScreen, yScreen, depth) เรียกเมื่อเม็ดฝนแตะพื้น
    warm: null,            // (xScreen) => 0..1 ผสมสีส้มอุ่นจากแสงร้าน
    ...opt,
  };
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(FOV, DW / DH, .1, 100);
  cam.position.set(0, 2.5, CAMZ); cam.lookAt(0, .4, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(r.width, r.height, false);
  }
  const v3 = new THREE.Vector3();
  const sy = (x, y, z) => (1 - v3.set(x, y, z).project(cam).y) / 2 * DH;      // world -> y บนจอดีไซน์
  const sx = (x, y, z) => (v3.set(x, y, z).project(cam).x + 1) / 2 * DW;
  function yAt(x, z, target) { let lo = -8, hi = 30; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (sy(x, m, z) > target) lo = m; else hi = m; } return (lo + hi) / 2; }

  const N = R.count, pos = new Float32Array(N * 6), col = new Float32Array(N * 8), D = [];
  function spawn(i, first) {
    const d = D[i] || (D[i] = {});
    d.z = rnd(-6, 5);
    const depth = (d.z + 6) / 11, halfH = Math.tan(FOV * Math.PI / 360) * (CAMZ - d.z), halfW = halfH * DW / DH;
    d.x = rnd(-halfW * 1.15, halfW * 1.15);
    d.sy0 = rnd(R.startY[0], R.startY[1]);
    d.land = R.land ? R.land[0] + (R.land[1] - R.land[0]) * depth + rnd(-8, 8) : DH + 20;   // ไกล = ขอบบนพื้น, ใกล้ = ขอบล่าง
    d.y = yAt(d.x, d.z, first ? rnd(d.sy0, R.land ? d.land : DH + 30) : d.sy0);
    d.on = Math.random() < (R.density ?? 1);   // density: ใช้เปิด/ปิดเม็ดฝนทีละเม็ดตอนเกิดใหม่ (ฝนค่อยๆ ตกลงมาจากบน)
    d.v = rnd(R.speed[0], R.speed[1]) * (.8 + .4 * depth); d.len = rnd(R.length[0], R.length[1]); d.k = .4 + .6 * depth; d.depth = depth;
  }
  for (let i = 0; i < N; i++) spawn(i, true);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 4));
  scene.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false })));

  function write() {
    for (let i = 0; i < N; i++) {
      const d = D[i], y = d.y, ty = y + d.len, tx = d.x - R.slant * d.len;
      pos[i * 6] = d.x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = d.z; pos[i * 6 + 3] = tx; pos[i * 6 + 4] = ty; pos[i * 6 + 5] = d.z;
      let a = d.on ? d.k * R.strength * sm((sy(d.x, y, d.z) - d.sy0) / R.fadeIn) : 0;
      const c = R.color; let r = c[0], g = c[1], b = c[2];
      if (R.warm) { const w = R.warm(sx(d.x, y, d.z)) * .75; r += (1 - r) * w; g += (.8 - g) * w; b += (.46 - b) * w; a *= 1 + .6 * w; }
      col.set([r, g, b, a, r, g, b, a], i * 8);
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
  }
  function step(dt) {
    for (let i = 0; i < N; i++) {
      const d = D[i], v = d.v * (R.speedMul ?? 1); d.y -= v * dt; d.x += R.slant * v * dt;
      if (sy(d.x, d.y, d.z) >= d.land) { if (R.onLand) R.onLand(sx(d.x, d.y, d.z), d.land, d.depth); spawn(i, false); }
    }
  }
  function render() { write(); renderer.render(scene, cam); }
  resize();
  return { step, render, resize, cfg: R, renderer };
}
