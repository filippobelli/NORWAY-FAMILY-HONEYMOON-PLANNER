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
    const allKeys = Object.keys(fixture.bundles);
    const latest = allKeys.filter((key) => !allKeys.some((other) => fixture.bundles[other].country.code === fixture.bundles[key].country.code && fixture.bundles[other].release.version > fixture.bundles[key].release.version));
    const areasOnly = process.argv.includes('--areas');
    const rangeOnly = process.argv.includes('--range');
    const sets = areasOnly ? [[latest.find((k) => fixture.bundles[k].country.code === 'GB')], ['IN-1']] : (rangeOnly ? latest.filter((k) => fixture.bundles[k].country.code !== 'IN') : allKeys).map((key) => [key]);
    if (!areasOnly) sets.push(rangeOnly ? latest.filter((k) => ['DE', 'JP', 'GB', 'KH'].includes(fixture.bundles[k].country.code)) : latest);
    for (const keys of sets) {
      const label = keys.join('+');
      const ctx = await context(browser, { viewport: { width: 1440, height: 1000 } });
      const errors = [];
      const bundles = keys.map((k) => fixture.bundles[k]);
      const expected = bundles.reduce((sum, b) => sum + b.places.filter((p) => p.category !== 'porti' || p.region_key).length, 0);
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
      await page.waitForFunction((count) => document.querySelectorAll('.catalog .dest').length === count, expected);
      check(await page.locator('.catalog .dest').count() === expected, `${label}: catalogo dal dispositivo completo`);
      await page.locator('.dest-head').first().click();
      check(/idoneità bambini da verificare/i.test(await page.locator('.dest-open').innerText()), `${label}: idoneità sconosciuta dichiarata`);
      const station = bundles[0].places.find((p) => p.category === 'treni' && p.day_visit === false);
      if (station) {
        await page.getByLabel('Categoria', { exact: true }).selectOption('porti');
        check(await page.locator('.catalog .dest').count() === bundles.reduce((n, b) => n + b.places.filter((p) => p.category === 'porti').length, 0), `${label}: porti visibili e filtro corretto`);
        await page.getByLabel('Categoria', { exact: true }).selectOption('treni');
        const name = bundles[0].place_texts.find((p) => p.place_key === station.place_key).name;
        await page.locator('.catalog input[type="search"]').fill(name);
        await page.waitForFunction((name) => document.querySelector('.catalog .dest-name')?.textContent === name, name);
        const stationHead = page.locator('.dest-head').first();
        if (await stationHead.getAttribute('aria-expanded') !== 'true') await stationHead.click();
        await page.locator('.dest-open').getByRole('link', { name: /Cerca treni|Guida ufficiale ai trasporti/ }).waitFor({ state: 'visible' });
        check(await page.locator('.dest-open').getByRole('link', { name: /Cerca treni|Guida ufficiale ai trasporti/ }).isVisible(), `${label}: fonte ferroviaria nazionale visibile`);
        check(await page.locator('.dest-open').getByRole('button', { name: 'Pianifica come visita' }).count() === 0, `${label}: stazione distinta dalle attrazioni`);
        await page.locator('.dest-open').getByRole('button', { name: 'Aggiungi come tappa', exact: true }).click();
        const dialog = page.getByRole('dialog');
        check(await dialog.getByLabel('Notti', { exact: true }).inputValue() === '0', `${label}: stazione senza pernottamento implicito`);
        check((await page.evaluate(() => JSON.parse(localStorage.getItem('nfhp.trip.v1')).stops.length)) === 1, `${label}: proposta non applicata prima della conferma`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(50);
        check(await dialog.count() === 0 && await page.locator('.dest-open').getByRole('button', { name: 'Aggiungi come tappa', exact: true }).evaluate((el) => el === document.activeElement), `${label}: Escape e focus ripristinato`);
        await page.locator('.dest-open').getByRole('button', { name: 'Aggiungi come tappa', exact: true }).press('Enter');
        await page.getByRole('dialog').getByRole('button', { name: 'Applica al percorso', exact: true }).click();
        await page.waitForFunction(() => JSON.parse(localStorage.getItem('nfhp.trip.v1')).stops.length === 2);
        check(await page.evaluate(() => JSON.parse(localStorage.getItem('nfhp.trip.v1')).stops.reduce((n, s) => n + s.nights, 0)) === 3, `${label}: applicazione esplicita senza cambiare le notti`);
        await page.locator('.catalog input[type="search"]').fill('');
        await page.getByLabel('Categoria', { exact: true }).selectOption('');
      }
      if (keys.length === 1 && ['GB', 'IN'].includes(bundles[0].country.code)) {
        const areas = bundles[0].country.code === 'GB' ? [['gb-scotland', 'Scozia —'], ['gb-other', null]] : [['in-north', 'India del Nord —'], ['in-south', 'India del Sud —']];
        const areaSelect = page.getByLabel('Area di viaggio', { exact: true });
        for (const [id, prefix] of areas) {
          const regions = new Set(bundles[0].regions.filter((r) => prefix ? r.name.startsWith(prefix) : !r.name.startsWith('Scozia —')).map((r) => r.region_key));
          const subset = bundles[0].places.filter((p) => regions.has(p.region_key));
          await areaSelect.selectOption(id);
          check(await page.locator('.catalog .dest').count() === subset.length, `${id}: conteggio e perimetro corretti`);
          await page.getByLabel('Categoria', { exact: true }).selectOption('musei');
          check(await page.locator('.catalog .dest').count() === subset.filter((p) => p.category === 'musei').length, `${id}: filtri area e categoria combinati`);
          await page.getByLabel('Cerca nel catalogo', { exact: true }).fill('ricerca-nessun-risultato-fixture');
          check(await page.locator('.catalog .dest').count() === 0, `${id}: ricerca senza risultati`);
          await page.getByLabel('Cerca nel catalogo', { exact: true }).fill('');
          await page.getByLabel('Categoria', { exact: true }).selectOption('');
          await page.reload();
          await page.getByLabel('Area di viaggio', { exact: true }).waitFor();
          await page.waitForFunction((count) => document.querySelectorAll('.catalog .dest').length === count, subset.length);
          check(await areaSelect.inputValue() === id && await page.locator('.catalog .dest').count() === subset.length, `${id}: contesto conservato al ritorno`);
          await areaSelect.focus();
          check(await areaSelect.evaluate((el) => el === document.activeElement), `${id}: filtro raggiungibile da tastiera`);
        }
        await page.getByRole('button', { name: 'Azzera filtri', exact: true }).first().click();
        check(await page.locator('.catalog .dest').count() === expected, `${label}: tutte le aree ripristinate`);
      }
      await page.goto('http://localhost:4189/#/configuratore');
      const options = await page.locator('select').evaluateAll((ss) => ss.flatMap((s) => [...s.options].map((o) => o.value)));
      const airportKeys = bundles.flatMap((b) => b.places.filter((p) => p.category === 'aeroporti').map((p) => p.place_key));
      check(airportKeys.some((key) => options.includes(key)) && !options.includes('bgo'), `${label}: aeroporti dei cataloghi caricati`);
      check((await page.locator('.region-list').innerText()).includes(bundles[0].regions[0].name), `${label}: regioni della nazione`);
      if (keys.length === 1 && ['GB', 'IN'].includes(bundles[0].country.code)) {
        const area = bundles[0].country.code === 'GB' ? 'gb-scotland' : 'in-south';
        const before = await page.evaluate(() => localStorage.getItem('nfhp.trip.v1'));
        await page.getByLabel('Area da pianificare', { exact: true }).selectOption(area);
        check(await page.getByLabel('Area da pianificare', { exact: true }).inputValue() === area, `${area}: configuratore riconosce la scelta`);
        check(await page.evaluate(() => localStorage.getItem('nfhp.trip.v1')) === before, `${area}: scelta non applicata al viaggio`);
      }
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
      check(await page.locator('.catalog .dest').count() === expected, `${label}: catalogo consultabile senza rete`);
      check(errors.length === 0, `${label}: nessun errore JavaScript`, errors.join(' | '));
      await page.screenshot({ path: path.join(out, `international-${keys.length === 1 ? keys[0] : 'multi'}.png`) });
      await ctx.close();
    }
    console.log(`${results.ok} OK, ${results.fail} FAIL`);
  } finally { await browser.close(); server.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; server.close(); });
