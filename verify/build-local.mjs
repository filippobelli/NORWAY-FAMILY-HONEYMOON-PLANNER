// Build di verifica con esbuild (React preinstallato nell'ambiente), senza Vite.
// Produce dist-local/index.html autonomo (JS e CSS inline) per test nel browser.
import { build } from '/opt/npm-tools/node_modules/esbuild/lib/main.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const r = await build({
  entryPoints: [resolve(root, 'src/main.tsx')],
  bundle: true, minify: true, format: 'iife', write: false, outdir: 'out',
  jsx: 'automatic', target: 'es2020', nodePaths: ['/opt/npm-tools/node_modules'],
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
  loader: { '.css': 'css' }, logLevel: 'warning',
});
const js = r.outputFiles.find((f) => f.path.endsWith('.js')).text;
const css = r.outputFiles.find((f) => f.path.endsWith('.css'))?.text ?? '';
let html = readFileSync(resolve(root, 'index.html'), 'utf8');
html = html.replace('<script type="module" src="/src/main.tsx"></script>', '')
  .replace('</head>', `<style>${css}</style></head>`)
  .replace('</body>', `<script>${js.replace(/<\/script/g, '<\\/script')}</script></body>`);
mkdirSync(resolve(root, 'dist-local'), { recursive: true });
writeFileSync(resolve(root, 'dist-local/index.html'), html);
console.log('dist-local/index.html', (html.length / 1024).toFixed(0), 'KB');
