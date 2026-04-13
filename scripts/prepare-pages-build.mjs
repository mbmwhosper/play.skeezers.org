import { cpSync, existsSync, mkdirSync, rmSync, statSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(root, 'dist-pages');
const maxBytes = 25 * 1024 * 1024;

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const name of ['index.html', '404.html', '_headers', '_redirects', 'favicon.ico', 'css', 'js', 'img', 'fonts']) {
  const src = resolve(root, name);
  if (existsSync(src)) cpSync(src, resolve(outDir, name), { recursive: true });
}

const gamesSrc = resolve(root, 'games');
const gamesDest = resolve(outDir, 'games');
mkdirSync(gamesDest, { recursive: true });

for (const entry of ['adventure-capitalist', '1v1-lol']) {
  const src = resolve(gamesSrc, entry);
  if (!existsSync(src)) continue;
  const placeholderDir = resolve(gamesDest, entry);
  mkdirSync(placeholderDir, { recursive: true });
  cpSync(resolve(root, 'index.html'), resolve(placeholderDir, 'index.html'));
}

const walk = (dir, base = dir) => {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, item.name);
    if (item.isDirectory()) walk(full, base);
    else if (statSync(full).size <= maxBytes) {
      const rel = full.slice(base.length + 1);
      const dest = resolve(gamesDest, rel);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(full, dest);
    }
  }
};

if (existsSync(gamesSrc)) walk(gamesSrc);
console.log(`Prepared Pages build in ${outDir}`);
