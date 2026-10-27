// Pianificazione familiare e scenari (browser reale, servizi esterni simulati).
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const OUT = process.argv[2] || path.resolve(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const srv = http.createServer((q, r) => { r.setHeader('Content-Type', 'text/html; charset=utf-8'); r.end(fs.readFileSync(path.resolve(__dirname, '../../dist-local/index.html'))); }).listen(4176);
const ok = (m) => console.log('OK:', m); const fail = (m) => { console.log('FAIL:', m); process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  p.on('dialog', (d) => d.accept());
  await p.route(/unpkg|openstreetmap\.org\/|arcgisonline|supabase\.co/, (r) => r.abort());
  // Percorso lungo finto Bergen→Geiranger che passa vicino a Flåm
  await p.route(/routing\.openstreetmap\.de/, (r) => {
    // Bergen → Voss → Flåm → Geiranger (punti indicativi, solo per il test)
    const way = [[5.32, 60.39], [6.42, 60.63], [7.11, 60.86], [7.0, 61.5], [7.2, 62.1]];
    const coords = []; for (let k = 0; k < way.length - 1; k++) for (let i = 0; i < 10; i++) { const [a, b] = [way[k], way[k + 1]]; coords.push([a[0] + (b[0] - a[0]) * i / 10, a[1] + (b[1] - a[1]) * i / 10]); }
    r.fulfill({ contentType: 'application/json', body: JSON.stringify({ code: 'Ok', routes: [{ distance: 1, duration: 1, legs: [{ steps: [{ mode: 'driving', distance: 420000, duration: 27000, geometry: { coordinates: coords } }] }] }] }) });
  });
  await p.goto('http://localhost:4176/#/itinerario'); await p.waitForSelector('text=Tappe');
  const add = async (q) => { await p.fill('input[aria-label="Cerca località"]', q); await p.click('.suggestions button >> nth=0'); };
  await add('Aeroporto Bergen'); await add('Bergen'); await add('Geiranger');
  (await p.textContent('.stops > li:nth-child(1) .stepper span')).includes('0 notti') ? ok('aeroporto aggiunto con 0 notti') : fail('aeroporto notti');
  await p.click('text=Calcola tratti mancanti');
  await p.waitForSelector('text=realistici', { timeout: 15000 }).then(() => ok('tratto con tempi teorici e realistici')).catch(() => fail('realistici'));
  await p.click('a[href="#/giornate"]'); await p.waitForSelector('.load-strip');
  const cells = await p.locator('.load-cell').count(); cells === 3 ? ok('striscia del carico: 3 giornate') : fail('celle ' + cells);
  (await p.locator('.load-eccessiva').count()) >= 1 ? ok('giornata da 7h30 di guida segnalata come troppo carica') : fail('nessuna giornata eccessiva');
  const ins = p.locator('.suggestion-list li', { hasText: 'Spezza il trasferimento' });
  (await ins.count()) >= 1 ? ok('proposta di tappa intermedia: ' + (await ins.first().textContent()).trim().slice(0, 80)) : fail('nessuna proposta intermedia');
  await p.screenshot({ path: OUT + '/p1-giornate.png', fullPage: true });
  const before = await p.locator('.day').count();
  await ins.first().locator('button').click();
  await p.waitForTimeout(300);
  const afterDays = await p.locator('.day').count(); afterDays === before + 1 ? ok('proposta applicata solo su richiesta: +1 giorno') : fail('giorni ' + before + '→' + afterDays);
  await p.click('.toast-action:has-text("Annulla")'); await p.waitForTimeout(300);
  (await p.locator('.day').count()) === before ? ok('"Annulla" ripristina l\'itinerario') : fail('annulla');
  await ins.first().locator('button').click(); await p.waitForTimeout(300);

  await p.click('a[href="#/scenari"]'); await p.waitForSelector('text=Nuovo scenario');
  await p.fill('#' + (await p.locator('label:has-text("Nome") >> nth=0').getAttribute('for')), 'Con nave');
  await p.selectOption('#' + (await p.locator('label:has-text("Tipo") >> nth=0').getAttribute('for')), 'auto_traghetti_costiera');
  await p.click('text=Crea scenario');
  (await p.locator('.scenario-card').count()) === 2 ? ok('2 scenari') : fail('scenari');
  (await p.locator('.metric-table').count()) === 1 ? ok('tabella di confronto visibile') : fail('tabella');
  (await p.locator('.scenario-card', { hasText: 'Con nave' }).locator('text=Nessun tratto di navigazione costiera').count()) === 1 ? ok('incoerenza tipo/contenuto segnalata') : fail('nota tipo');
  await p.locator('.scenario-card', { hasText: 'Con nave' }).locator('text=Apri per modificare').click();
  await p.click('a[href="#/itinerario"]');
  await p.click('.stops > li:nth-child(3) [aria-label^="Rimuovi"]');
  await p.click('a[href="#/scenari"]'); await p.waitForSelector('.metric-table');
  const daysRow = await p.locator('.metric-table tr', { hasText: 'Giorni' }).first().locator('td').allTextContents();
  daysRow[1] !== daysRow[2] ? ok('scenari indipendenti: giorni ' + daysRow.slice(1).join(' vs ')) : fail('giorni uguali ' + daysRow.join(','));
  await p.screenshot({ path: OUT + '/p2-scenari.png', fullPage: true });
  await p.setViewportSize({ width: 390, height: 844 });
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ov <= 0 ? ok('scenari su smartphone senza scroll orizzontale') : fail('overflow ' + ov);
  await p.click('a[href="#/giornate"]');
  const ov2 = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ov2 <= 0 ? ok('giornate su smartphone senza scroll orizzontale') : fail('overflow giornate ' + ov2);
  await p.screenshot({ path: OUT + '/p3-mobile.png', fullPage: false });
  errors.length ? fail('errori JS: ' + errors.join(' | ')) : ok('nessun errore JS');
  await b.close(); srv.close();
})().catch((e) => { console.error(e); srv.close(); process.exit(1); });
