import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 1800 },
  server: { host: true, port: 5173 },
});
