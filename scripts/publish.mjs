// Copies the Vite build output to the repo root so GitHub Pages
// (configured to serve this branch's root directly, no Actions build)
// can serve it as static files. Run automatically at the end of `npm run build`.
import { existsSync, rmSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');
const distBuild = path.join(dist, 'build');
const rootBuild = path.join(root, 'build');
const distIndex = path.join(dist, 'index.html');
const rootIndex = path.join(root, 'index.html');

if (!existsSync(distIndex)) {
  console.error('dist/index.html not found — did `vite build` run?');
  process.exit(1);
}

if (existsSync(rootBuild)) rmSync(rootBuild, { recursive: true, force: true });
cpSync(distBuild, rootBuild, { recursive: true });
cpSync(distIndex, rootIndex);

console.log('Published dist/ → repo root (index.html + build/).');
