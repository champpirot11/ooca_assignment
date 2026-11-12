import { defineConfig } from 'vite';
// base './' = เปิดจากโฟลเดอร์ย่อยได้ (เช่น GitHub Pages: username.github.io/repo-name/)
export default defineConfig({ base: './', build: { chunkSizeWarningLimit: 900 } });
