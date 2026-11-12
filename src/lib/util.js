export const rnd = (a, b) => a + Math.random() * (b - a);
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const sm = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };   // smoothstep
export const lerp = (a, b, t) => a + (b - a) * t;
export const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const DW = 390, DH = 844;       // ขนาดดีไซน์ใน Figma
const q = new URLSearchParams(location.search);
export const param = (k, d = null) => (q.has(k) ? q.get(k) : d);
