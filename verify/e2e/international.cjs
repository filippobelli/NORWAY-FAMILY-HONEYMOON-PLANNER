// Cataloghi reali serviti solo dalla copia IndexedDB di un browser isolato.
// Nessuna credenziale reale, nessuna richiesta a Supabase o ad altri servizi esterni.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { serve, launch, context, check, results } = require('./serve.cjs');
const root = path.resolve(__dirname, '../..');
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, 'international.json');
execFileSync(process.execPath, [path.join(root, 'node_modules/tsx/dist/cli.mjs'), path.join(__dirname, 'international-bundles.ts'), file]);
const fixture = JSON.parse(fs.readFileSync(file, 'utf8'));
const server = serve(4189);

(async () => {
  const browser = await launch();
  try {
    const sets = Object.keys(fixture.bundles).map((key) => [key]);
    sets.push(Object.keys(fixture.bundles));
    for (const keys of sets) {
      const label = keys.join('+');
      const ctx = await context(browser, { viewport: { width: 1440, height: 1000 } });
      const errors = [];
      const bundles = keys.map((k) => fixture.bundles[k]);
      const base = bundles[0].places.find((p) => p.is_base);
      const city = bundles[0].place_texts.find((p) => p.place_key === base.place_key);
      const trip = { ...fixture.empty, countries: bundles.map((b) => ({ code: b.country.code, releaseId: b.release.release_id })), stops: [{ id: 'test-city', kind: 'luogo', destinationId: base.place_key, name: city.name, lat: base.lat, lng: base.lng, nights: 3, notes: '', weatherPlanB: '' }], legs: [] };
      await ctx.route((url) => url.hostname !== 'localhost', (r) => r.abort());
      await ctx.addInitScript(async ({ bundles, trip }) => {
        if (location.origin !== 'http://localhost:4189') return;
        if (sessionStorage.getItem('international-ready')) return;
        localStorage.clear();
        localStorage.setItem('nfhp.ui.mode', 'planning');
        localStorage.setItem('nfhp.cloud.config', JSON.stringify({ url: 'https://fixture.supabase.co', anonKey: 'fixture-public-key' }));
        localStorage.setItem('nfhp.trip.v1', JSON.stringify(trip));
        await new Promise((resolve, reject) => {
          const req = indexedDB.open('nfhp-dati', 1);
          req.onupgradeneeded = () => { for (const name of ['base', 'cataloghi', 'meta']) if (!req.result.objectStoreNames.contains(name)) req.result.createObjectStore(name); };
          req.onerror = () => reject(req.error);
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction('cataloghi', 'readwrite');
            for (const b of bundles) tx.objectStore('cataloghi').put(b, b.release.release_id);
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => reject(tx.error);
          };
        });
        sessionStorage.setItem('international-ready', '1');
      }, { bundles, trip });
      const page = await ctx.newPage();
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto('http://localhost:4189/#/catalogo');
      await page.waitForFunction((count) => document.querySelectorAll('.catalog .dest').length === count, keys.length * 30);
      check(await page.locator('.catalog .dest').count() === keys.length * 30, `${label}: catalogo dal dispositivo completo`);
      await page.locator('.dest-head').first().click();
      check(/idoneità bambini da verificare/i.test(await page.locator('.dest-open').innerText()), `${label}: idoneità sconosciuta dichiarata`);
      await page.goto('http://localhost:4189/#/configuratore');
      const options = await page.locator('select').evaluateAll((ss) => ss.flatMap((s) => [...s.options].map((o) => o.value)));
      check(options.some((s) => /^[a-z]{2}-[a-z]{3}$/.test(s)) && !options.includes('bgo'), `${label}: aeroporti dei cataloghi caricati`);
      check((await page.locator('.region-list').innerText()).includes(bundles[0].regions[0].name), `${label}: regioni della nazione`);
      await page.goto('http://localhost:4189/#/crociere');
      check((await page.locator('body').innerText()).includes('non contengono ancora crociere'), `${label}: trasporti mancanti dichiarati`);
      await page.setViewportSize({ width: 375, height: 812 });
      for (const route of ['catalogo', 'configuratore', 'pianifica', 't/oggi', 'impostazioni']) {
        await page.goto(`http://localhost:4189/#/${route}`);
        await page.waitForTimeout(100);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        check(overflow <= 1, `${label}: ${route} a 375 px senza overflow`);
      }
      await ctx.setOffline(true);
      await page.goto('http://localhost:4189/#/catalogo');
      check(await page.locator('.catalog .dest').count() === keys.length * 30, `${label}: catalogo consultabile senza rete`);
      check(errors.length === 0, `${label}: nessun errore JavaScript`, errors.join(' | '));
      await page.screenshot({ path: path.join(out, `international-${keys.length === 1 ? keys[0] : 'multi'}.png`) });
      await ctx.close();
    }
    console.log(`${results.ok} OK, ${results.fail} FAIL`);
  } finally { await browser.close(); server.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; server.close(); });
