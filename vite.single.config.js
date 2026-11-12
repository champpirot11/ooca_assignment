import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
// รวมทุกอย่าง (โค้ด/ฟอนต์/ภาพ/โมเดล) เป็นไฟล์ HTML ไฟล์เดียว ไว้ส่งดูตัวอย่างบนมือถือ:  npm run build:single
export default defineConfig({ base: './', plugins: [viteSingleFile()], build: { outDir: 'dist-single', assetsInlineLimit: 100000000, chunkSizeWarningLimit: 5000 } });
