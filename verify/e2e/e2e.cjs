const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = require('path').resolve(__dirname, '../../dist-local');
const OUT = process.argv[2];
const srv = http.createServer((req, res) => { res.setHeader('Content-Type','text/html; charset=utf-8'); res.end(fs.readFileSync(path.join(ROOT,'index.html'))); }).listen(4173);
const log = []; const fail = (m) => { console.log('FAIL:', m); process.exitCode = 1; };
const ok = (m) => console.log('OK:', m);
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, locale: 'it-IT' });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') log.push(m.text()); });
  p.on('pageerror', (e) => log.push('PAGEERROR ' + e.message));
  p.on('dialog', (d) => d.accept());
  await p.route('**/unpkg.com/**', (r) => r.abort());
  await p.route(/openstreetmap.org\/|arcgisonline/, (r) => r.abort());
  let osrmCalls = 0;
  await p.route('**/routing.openstreetmap.de/**', (r) => { osrmCalls++; r.fulfill({ contentType: 'application/json', body: JSON.stringify({ code: 'Ok', routes: [{ distance: 1, duration: 1, legs: [{ steps: [
    { mode: 'driving', distance: 120000, duration: 7200, geometry: { coordinates: [[5.3,60.4],[6,60.7]] } },
    { mode: 'ferry', distance: 6000, duration: 1500, name: 'Test ferje', geometry: { coordinates: [[6,60.7],[6.2,60.8]] } },
    { mode: 'driving', distance: 50000, duration: 3000, geometry: { coordinates: [[6.2,60.8],[7.1,60.86]] } } ] }] }] }) }); });
  await p.route('**/overpass-api.de/**', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ elements: [
    { type: 'node', id: 11, lat: 60.87, lon: 7.12, tags: { tourism: 'chalet', name: 'Test Hytte Fjord', website: 'https://example.org' } },
    { type: 'node', id: 12, lat: 60.86, lon: 7.10, tags: { tourism: 'camp_site', name: 'Test Camping' } } ] }) }));

  await p.goto('http://localhost:4173/#/itinerario');
  await p.waitForSelector('text=Tappe');
  (await p.textContent('.save-state')).includes('Salvato solo qui') ? ok('stato salvataggio dichiarato') : fail('stato salvataggio');
  await p.waitForSelector('.map-error', { timeout: 20000 }).then(() => ok('mappa: errore gestito senza bloccare l\'app')).catch(() => fail('overlay errore mappa'));

  const add = async (q) => { await p.fill('input[aria-label="Cerca località"]', q); await p.click('.suggestions button >> nth=0'); };
  await add('Bergen'); await add('Flåm'); await add('Geiranger');
  const n = await p.locator('.stops > li').count(); n === 3 ? ok('3 tappe aggiunte') : fail('tappe ' + n);
  await p.click('.stops > li:nth-child(1) [aria-label="Una notte in più"]');
  await p.click('.stops > li:nth-child(2) [aria-label="Una notte in più"]');
  await p.click('.stops > li:nth-child(2) [aria-label="Una notte in più"]');
  (await p.locator('text=Collegamento non calcolato').count()) === 2 ? ok('2 tratti non calcolati') : fail('tratti non calcolati');
  await p.click('text=Calcola tratti mancanti');
  await p.waitForSelector('text=Calcolati 2 tratti', { timeout: 15000 }).then(() => ok('calcolo tratti')).catch(() => fail('calcolo tratti'));
  const sum = await p.textContent('.stops > li:nth-child(1) .leg-summary');
  /170 km su strada/.test(sum) && /1 traghetto/.test(sum) ? ok('tratto: km strada separati dal traghetto → ' + sum.trim()) : fail('summary ' + sum);
  osrmCalls === 2 ? ok('2 chiamate routing (throttle)') : fail('osrm calls ' + osrmCalls);
  await p.screenshot({ path: OUT + '/1-itinerario.png', fullPage: true });

  // Sposta tappa e verifica ricalcolo necessario
  await p.click('.stops > li:nth-child(3) [aria-label="Sposta su"]');
  (await p.locator('text=Collegamento non calcolato').count()) >= 1 ? ok('riordino: coppie nuove tornano non calcolate') : fail('riordino');
  await p.click('.stops > li:nth-child(2) [aria-label="Sposta giù"]');

  await p.click('a[href="#/giornate"]'); await p.waitForSelector('.day');
  const days = await p.locator('.day').count(); days === 7 ? ok('7 giornate (2+3+1 notti +1)') : fail('giornate ' + days);
  await p.screenshot({ path: OUT + '/2-giornate.png', fullPage: true });

  await p.click('a[href="#/costiera"]');
  await p.click('text=+ Nuova opzione Hurtigruten');
  await p.selectOption('section.form-panel select >> nth=2', 'Måløy');
  await p.fill('section.form-panel input[type=number] >> nth=0', '9');
  const priceInput = p.locator('section.form-panel .money input').first(); await priceInput.fill('640');
  await p.click('text=Salva opzione');
  await p.click('text=Includi nel budget');
  (await p.locator('.row-selected').count()) === 1 ? ok('opzione costiera inclusa') : fail('costiera');
  await p.screenshot({ path: OUT + '/3-costiera.png', fullPage: true });

  await p.click('a[href="#/hytte"]');
  await p.selectOption('select[aria-label="Tappa"]', { index: 2 });
  await p.click('text=Cerca su OpenStreetMap');
  await p.waitForSelector('text=Test Hytte Fjord');
  await p.click('.osm-results li:has-text("Test Hytte Fjord") button');
  await p.locator('.form-panel .money input').first().fill('1800');
  const cur = p.locator('.form-panel .money select').first(); await cur.selectOption('NOK');
  await p.click('.form-panel >> text=Salva');
  (await p.locator('text=scelta').count()) >= 1 ? ok('hytte salvata e scelta per la tappa') : fail('hytte');
  const ext = await p.locator('.ext-links a').count(); ext === 3 ? ok('3 link di ricerca esterni') : fail('ext ' + ext);
  await p.screenshot({ path: OUT + '/4-hytte.png', fullPage: true });

  await p.click('a[href="#/budget"]');
  const tot = await p.textContent('.kpi strong >> nth=0');
  // hytte: 1800 NOK × 3 notti / 11.8 = 457.6 ; costiera 640 → 1098
  /1\.?098/.test(tot) ? ok('budget totale ' + tot) : fail('budget ' + tot);
  await p.screenshot({ path: OUT + '/5-budget.png', fullPage: true });

  await p.reload(); await p.waitForSelector('.kpi'); await p.waitForTimeout(300);
  const tot2 = await p.textContent('.kpi strong >> nth=0'); tot2 === tot ? ok('persistenza locale dopo ricarica') : fail('persistenza ' + tot2);

  await p.click('a[href="#/catalogo"]'); await p.waitForSelector('.card');
  const cards = await p.locator('.card').count(); ok('catalogo schede: ' + cards);
  await p.click('a[href="#/viaggio"]'); await p.waitForSelector('text=Backup su file');
  (await p.locator('button[type=submit]:has-text("Accedi")').count()) === 1 ? ok('cloud configurato: form di accesso visibile') : fail('cloud');

  // Mobile
  await p.setViewportSize({ width: 390, height: 844 });
  await p.click('a[href="#/itinerario"]');
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  overflow <= 0 ? ok('nessuno scroll orizzontale su mobile') : fail('overflow mobile ' + overflow);
  await p.screenshot({ path: OUT + '/6-mobile.png', fullPage: false });
  await p.click('a[href="#/budget"]');
  const ov2 = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ov2 <= 0 ? ok('budget mobile senza overflow') : fail('overflow budget ' + ov2);
  await p.screenshot({ path: OUT + '/7-mobile-budget.png', fullPage: true });

  // Errore routing
  await p.setViewportSize({ width: 1360, height: 900 });
  await p.unroute('**/routing.openstreetmap.de/**');
  await p.route('**/routing.openstreetmap.de/**', (r) => r.abort());
  await p.click('a[href="#/itinerario"]');
  await p.click('.stops > li:nth-child(1) .leg-head button');
  await p.waitForSelector('[role=alert].error', { timeout: 10000 }).then(async () => ok('errore routing mostrato: ' + (await p.textContent('[role=alert].error')))).catch(() => fail('errore routing'));

  const real = log.filter((l) => !/unpkg|ERR_FAILED|routing\.openstreetmap|Failed to load resource/.test(l));
  real.length ? fail('console: ' + real.join(' | ')) : ok('nessun errore JS in console');
  await b.close(); srv.close();
})().catch((e) => { console.error(e); srv.close(); process.exit(1); });
