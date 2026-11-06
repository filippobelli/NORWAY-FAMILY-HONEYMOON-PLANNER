// Supporto comune ai test nel browser: serve la build di produzione (dist/, da `npm run build`) e avvia Chromium.
// Servizi esterni: ogni script li intercetta o li blocca. Supabase non viene mai contattato davvero:
// sync.cjs usa un server finto, gli altri bloccano le richieste.
// Browser: PLAYWRIGHT_PATH indica il pacchetto playwright; CHROME_PATH (o Chrome installato) evita di scaricare Chromium.
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '../../dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.json': 'application/json' };

function serve(port) {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('Manca dist/index.html: esegui prima `npm run build`.');
  return http
    .createServer((req, res) => {
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      let file = path.join(DIST, url);
      if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
      res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
      res.end(fs.readFileSync(file));
    })
    .listen(port);
}

function chromium() {
  return require(process.env.PLAYWRIGHT_PATH || 'playwright').chromium;
}

async function launch() {
  const candidates = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
  const exe = candidates.find((p) => fs.existsSync(p));
  return chromium().launch({ args: ['--no-sandbox'], ...(exe ? { executablePath: exe } : {}) });
}

/** Contesto pulito: niente service worker (non deve servire risposte dalla cache durante i test), lingua italiana. */
async function context(browser, opts = {}) {
  return browser.newContext({ serviceWorkers: 'block', locale: 'it-IT', timezoneId: 'Europe/Rome', acceptDownloads: true, ...opts });
}

const results = { ok: 0, fail: 0 };
const ok = (m) => {
  results.ok++;
  console.log('OK:', m);
};
const fail = (m) => {
  results.fail++;
  console.log('FAIL:', m);
  process.exitCode = 1;
};
const check = (cond, m, detail = '') => (cond ? ok(m) : fail(`${m}${detail ? ` → ${detail}` : ''}`));

module.exports = { serve, launch, context, ok, fail, check, results };
