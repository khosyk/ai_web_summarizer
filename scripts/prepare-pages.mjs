import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, '.pages-deploy');

const PAGE_FILES = ['legal.html', 'third-party-notices.html'];

mkdirSync(outDir, { recursive: true });

for (const name of PAGE_FILES) {
  const src = path.join(root, 'public', name);
  copyFileSync(src, path.join(outDir, name));
}

console.log(
  `[Web Summary] Pages artifact ready in .pages-deploy/: ${PAGE_FILES.join(', ')}`,
);
