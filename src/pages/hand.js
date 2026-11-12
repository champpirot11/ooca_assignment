// หน้า 2 — มือรับฝน (โมเดล 3D + เชดเดอร์แบบภาพประกอบ) บนก้อนเมฆจากดีไซน์
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import bg from '../art/bg2.svg?raw';
import handUrl from '../art/r_hand.glb?url';
import { REDUCE, DW, DH } from '../lib/util.js';
import { audio } from '../lib/audio.js';

const SLIDE_DELAY = .5, SLIDE_IN = 3.4;                   // มือค่อยๆ ลอยขึ้นมารับฝน
const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return .5 - .5 * Math.cos(Math.PI * x); };

export function createHandPage() {
  const el = document.createElement('section');
  el.className = 'page'; el.setAttribute('aria-label', 'หน้า 2');
  el.innerHTML = `<div class="art">${bg}</div><canvas class="layer fadeTop"></canvas><div class="shade"></div>`;
  const canvas = el.querySelector('canvas');
  let renderer, scene, camera, handPivot, running = false, time = 0, built = false;
  const PALM = new THREE.Vector3(0, .18, .35), HAND_BASE_Y = -.9;
  let rainGeo, RAIN_COUNT = 360, rainSpeeds, ripples = [], splashes = [], ripIdx = 0, spIdx = 0;
  const MAX_RIPPLES = 40, MAX_SPLASH = 60;

  function build() {
    if (built) return; built = true;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x14262a, .05);
    camera = new THREE.PerspectiveCamera(42, DW / DH, .1, 100); camera.position.set(0, 2.5, 7.2); camera.lookAt(0, .4, 0);
    scene.add(new THREE.AmbientLight(0xaecbc6, .35));
    const key = new THREE.DirectionalLight(0xdfe9e6, .8); key.position.set(2, 9, 3.5); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, .25); rim.position.set(0, 4, -5); scene.add(rim);

    // 4 ระดับสีแบบ cel-shade
    const tc = document.createElement('canvas'); tc.width = 4; tc.height = 1; const tx = tc.getContext('2d');
    ['#5f6663', '#8d9490', '#c4c9c4', '#c4c9c4'].forEach((c, i) => { tx.fillStyle = c; tx.fillRect(i, 0, 1, 1); });
    const grad = new THREE.CanvasTexture(tc); grad.minFilter = grad.magFilter = THREE.NearestFilter;
    const handMat = new THREE.MeshToonMaterial({ color: 0xc4a08e, gradientMap: grad });

    handPivot = new THREE.Group(); scene.add(handPivot);
    new GLTFLoader().load(handUrl, (gltf) => {
      let model = gltf.scene; const meshes = [];
      model.traverse((c) => { if (c.isMesh) meshes.push(c); });
      meshes.forEach((c) => { c.material = handMat; c.frustumCulled = false; });
      const holder = new THREE.Group(); holder.add(model); holder.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
      model.position.sub(center); holder.scale.setScalar(3 / Math.max(size.x, size.y, size.z));
      holder.rotation.set(-.95, 0, 3.14); holder.position.set(0, -.55, .3);
      handPivot.add(holder); handPivot.updateMatrixWorld(true);
      const a = new THREE.Vector3(), b = new THREE.Vector3(); let wrist = null, knuckle = null;
      holder.traverse((o) => { if (o.name === 'wrist') wrist = o; if (o.name === 'middle-finger-phalanx-proximal') knuckle = o; });
      if (wrist && knuckle) { wrist.getWorldPosition(a); knuckle.getWorldPosition(b); PALM.copy(a.lerp(b, .6)); PALM.x -= handPivot.position.x; PALM.z -= handPivot.position.z; PALM.y -= handPivot.position.y; PALM.z += .12; }
      place();
    }, undefined, (e) => console.error('โหลดมือไม่ได้', e));

    // ฝน: 95 เส้นแรกเล็งไปที่ฝ่ามือ
    const pos = new Float32Array(RAIN_COUNT * 6); rainSpeeds = new Float32Array(RAIN_COUNT); rainGeo = new THREE.BufferGeometry();
    for (let i = 0; i < RAIN_COUNT; i++) {
      const palm = i < 95; let x, z;
      if (palm) { x = (Math.random() - .5) * .8; z = .3 + (Math.random() - .5) * .7; } else { x = (Math.random() - .5) * 16; z = (Math.random() - .5) * 12; }
      const y = Math.random() * 11, len = .3 + Math.random() * .45;
      pos.set([x, y, z, x, y - len, z], i * 6); rainSpeeds[i] = (.15 + Math.random() * .2) * 60;     // หน่วย ต่อวินาที
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x86aaa6, transparent: true, opacity: .55, depthWrite: false })));

    const ringGeo = new THREE.RingGeometry(.015, .045, 32);
    for (let i = 0; i < MAX_RIPPLES; i++) {
      const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.visible = false; handPivot.add(m); ripples.push({ mesh: m, active: false, age: 0, maxAge: 35, speed: .03 });
    }
    const spGeo = new THREE.SphereGeometry(.022, 6, 6);
    for (let i = 0; i < MAX_SPLASH; i++) {
      const m = new THREE.Mesh(spGeo, new THREE.MeshBasicMaterial({ color: 0xcfe0dc, transparent: true, opacity: .7 }));
      m.visible = false; handPivot.add(m); splashes.push({ mesh: m, active: false, age: 0, maxAge: 18, vx: 0, vy: 0, vz: 0 });
    }
    resize();
  }
  function place() {        // ตำแหน่งมือตามเวลา (ลอยขึ้นมาจากขอบล่าง แล้วหายใจเบาๆ)
    if (!handPivot) return;
    const t = time, breatheY = Math.sin(t * 1.5) * .05, breatheRoll = Math.cos(t * 1.2) * .02;
    const arrive = REDUCE ? 1 : smooth((t - SLIDE_DELAY) / SLIDE_IN), away = 1 - arrive, hover = Math.min(1, arrive * 1.5);
    handPivot.position.y = HAND_BASE_Y + breatheY * hover - 3.6 * away; handPivot.position.x = .35 * away;
    handPivot.rotation.z = breatheRoll * hover + .16 * away; handPivot.rotation.x = -.12 * away;
    camera.position.x = Math.sin(t * .25) * .06; camera.lookAt(0, .4, 0);
  }
  function ripple(lx, lz) {
    audio.palm();
    const r = ripples[ripIdx]; ripIdx = (ripIdx + 1) % MAX_RIPPLES;
    r.mesh.position.set(lx, PALM.y + .02, lz); r.mesh.scale.setScalar(.2); r.mesh.visible = true; r.active = true; r.age = 0; r.maxAge = 30 + Math.random() * 15; r.speed = .03 + Math.random() * .02;
    r.mesh.material.color.setHex(Math.random() > .3 ? 0xcfe0dc : 0xaac2bf);
    const n = 3 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      const s = splashes[spIdx]; spIdx = (spIdx + 1) % MAX_SPLASH;
      s.mesh.position.set(lx, PALM.y + .03, lz); s.mesh.visible = true; s.active = true; s.age = 0; s.maxAge = 16 + Math.random() * 10;
      const ang = Math.random() * Math.PI * 2, sp = .015 + Math.random() * .03; s.vx = Math.cos(ang) * sp; s.vy = .04 + Math.random() * .06; s.vz = Math.sin(ang) * sp;
    }
  }
  function resize() { if (!renderer) return; const r = canvas.getBoundingClientRect(); if (!r.width) return; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(r.width, r.height, false); }

  function tick(dt) {
    if (!built || !running) return;
    time += dt; place();
    const f = dt * 60, pos = rainGeo.attributes.position.array;       // เดิมคำนวณต่อเฟรมที่ 60fps
    for (let i = 0; i < RAIN_COUNT; i++) {
      const spd = rainSpeeds[i] * dt; pos[i * 6 + 1] -= spd; pos[i * 6 + 4] -= spd;
      const headY = pos[i * 6 + 4], cx = pos[i * 6], cz = pos[i * 6 + 2];
      const palmDist = Math.hypot(cx - handPivot.position.x - PALM.x, cz - (handPivot.position.z + PALM.z)), surf = handPivot.position.y + PALM.y;
      if (headY <= surf && palmDist < .45 && headY >= surf - .4) { ripple(cx - handPivot.position.x, cz - handPivot.position.z); pos[i * 6 + 1] = 9.5 + Math.random() * 2; pos[i * 6 + 4] = pos[i * 6 + 1] - .38; }
      else if (headY < -3.5) { pos[i * 6 + 1] = 9.5 + Math.random() * 2; pos[i * 6 + 4] = pos[i * 6 + 1] - .38; }
    }
    rainGeo.attributes.position.needsUpdate = true;
    for (const r of ripples) if (r.active) { r.age += f; const p = r.age / r.maxAge; r.mesh.scale.setScalar(.2 + r.speed * r.age * 2.2); r.mesh.material.opacity = (1 - p) * .85; if (r.age >= r.maxAge) { r.active = false; r.mesh.visible = false; } }
    for (const s of splashes) if (s.active) { s.age += f; s.mesh.position.x += s.vx * f; s.mesh.position.y += s.vy * f; s.mesh.position.z += s.vz * f; s.vy -= .0035 * f; s.mesh.material.opacity = Math.max(0, 1 - s.age / s.maxAge); if (s.mesh.position.y <= PALM.y || s.age >= s.maxAge) { s.active = false; s.mesh.visible = false; } }
    renderer.render(scene, camera);
  }
  return {
    el,
    mount() { build(); },
    enter() { build(); time = 0; running = true; resize(); },
    leave() { running = false; },
    resize,
    tick,
  };
}
