// Giornate, proposte di alleggerimento con conferma, versioni del percorso (servizi esterni simulati).
// Uso: npm run build && node verify/e2e/planning.cjs [cartella-output]
const fs = require('fs');
const path = require('path');
const { serve, launch, context, ok, fail, check, results } = require('./serve.cjs');

const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'out'));
fs.mkdirSync(OUT, { recursive: true });
const PORT = 4183;

(async () => {
  const srv = serve(PORT);
  const b = await launch();
  const ctx = await context(b, { viewport: { width: 1300, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await ctx.route(/unpkg|openstreetmap\.org\/|openfreemap|arcgisonline|supabase\.co|open-meteo/, (r) => r.abort());
  // Percorso lungo finto Bergen → Geiranger che passa vicino a Flåm
  await ctx.route(/routing\.openstreetmap\.de/, (r) => {
    const way = [[5.32, 60.39], [6.42, 60.63], [7.11, 60.86], [7.0, 61.5], [7.2, 62.1]];
    const coords = [];
    for (let k = 0; k < way.length - 1; k++) for (let i = 0; i < 10; i++) coords.push([way[k][0] + ((way[k + 1][0] - way[k][0]) * i) / 10, way[k][1] + ((way[k + 1][1] - way[k][1]) * i) / 10]);
    r.fulfill({ contentType: 'application/json', body: JSON.stringify({ code: 'Ok', routes: [{ distance: 1, duration: 1, legs: [{ steps: [{ mode: 'driving', distance: 420000, duration: 27000, geometry: { coordinates: coords } }] }] }] }) });
  });
  await p.goto(`http://localhost:${PORT}/`);
  await p.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('nfhp.ui.mode', 'planning');
  });
  await p.goto(`http://localhost:${PORT}/#/pianifica`);
  const add = async (q) => {
    await p.fill('input[aria-label="Cerca località"]', q);
    await p.click('.suggestions button >> nth=0');
  };
  await add('Aeroporto Bergen');
  await add('Bergen');
  await add('Geiranger');
  check(/di passaggio/.test(await p.textContent('.ol-list > li:nth-child(1)')), 'aeroporto aggiunto senza notti');
  await p.click('.planner-toolbar button:has-text("Calcola tratti mancanti")');
  await p.waitForSelector('.toast:has-text("Calcolati")', { timeout: 15000 });

  await p.goto(`http://localhost:${PORT}/#/giornate`);
  await p.waitForSelector('.load-strip');
  check((await p.locator('.load-cell').count()) === 3, 'striscia del carico: 3 giornate');
  check((await p.locator('.load-eccessiva').count()) >= 1, 'giornata da 7 h 30 di guida segnalata come troppo carica');
  check((await p.locator('.day-transfer.is-oltre').count()) >= 1, 'trasferimento oltre il limite dichiarato nella giornata');
  const ins = p.locator('.load-proposals li', { hasText: 'Spezza il trasferimento' });
  check((await ins.count()) >= 1, 'proposta di tappa intermedia lungo il percorso');
  await p.screenshot({ path: OUT + '/p1-giornate.png', fullPage: true });
  const before = await p.locator('.day').count();
  await ins.first().locator('button').click();
  await p.waitForSelector('dialog[open]');
  check((await p.locator('.day').count()) === before, 'la proposta non cambia nulla prima della conferma');
  check((await p.locator('dialog[open] .impact').count()) === 1, 'prima di applicare si vede cosa cambia');
  await p.click('dialog[open] button:has-text("Applica")');
  await p.waitForTimeout(300);
  check((await p.locator('.day').count()) === before + 1, 'applicata dopo la conferma: +1 giorno');
  await p.click('.toast-action:has-text("Annulla")');
  await p.waitForTimeout(300);
  check((await p.locator('.day').count()) === before, '«Annulla» ripristina l\'itinerario');

  await p.goto(`http://localhost:${PORT}/#/scenari`);
  await p.waitForSelector('text=Nuova versione');
  await p.fill('#' + (await p.locator('label:has-text("Nome") >> nth=0').getAttribute('for')), 'Con nave');
  await p.selectOption('#' + (await p.locator('label:has-text("Tipo") >> nth=0').getAttribute('for')), 'auto_traghetti_costiera');
  await p.click('button:has-text("Crea la versione")');
  check((await p.locator('.scenario-card').count()) === 2, '2 versioni del percorso');
  check((await p.locator('.metric-table').count()) === 1, 'tabella di confronto visibile');
  check((await p.locator('.scenario-card', { hasText: 'Con nave' }).locator('text=Nessun tratto di navigazione costiera').count()) === 1, 'incoerenza tra tipo e contenuto segnalata');
  check(/Salvata, non attiva/.test(await p.locator('.scenario-card', { hasText: 'Con nave' }).textContent()), 'la versione nuova è salvata ma non attiva');
  await p.screenshot({ path: OUT + '/p2-scenari.png', fullPage: true });
  await p.setViewportSize({ width: 375, height: 812 });
  for (const v of ['scenari', 'giornate']) {
    await p.goto(`http://localhost:${PORT}/#/${v}`);
    await p.waitForTimeout(300);
    const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(o <= 0, `${v} a 375 px senza scorrimento orizzontale`, `${o}px`);
  }
  check(errors.length === 0, 'nessun errore JavaScript', errors.join(' | '));
  console.log(`\n${results.ok} OK, ${results.fail} FAIL`);
  await b.close();
  srv.close();
})().catch((e) => {
  console.error(e);
  fail(String(e));
  process.exit(1);
});
