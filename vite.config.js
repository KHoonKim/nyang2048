import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 4009,
  },
  build: {
    outDir: 'www',
    assetsDir: 'assets',
    target: 'esnext'
  }
});
