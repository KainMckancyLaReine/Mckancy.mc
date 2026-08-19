import { defineConfig } from 'vite';

// The Vite entry lives in app/index.html (never touched by the build),
// so the build output can safely overwrite the repo-root index.html
// that GitHub Pages actually serves without corrupting the source.
export default defineConfig({
  root: 'app',
  base: './',
  server: {
    fs: { allow: ['..'] },
  },
  build: {
    outDir: '../dist',
    assetsDir: 'build',
    emptyOutDir: true,
  },
});
