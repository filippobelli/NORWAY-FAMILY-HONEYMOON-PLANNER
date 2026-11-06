// «Cosa fare» per tappa: esplorare, salvare tra le idee, pianificare con conferma, attività personale,
// coerenza con Giornate e Oggi, tastiera e 375 px. Build di produzione, rete esterna bloccata (nessuna foto: segnaposto).
// Uso: npm run build && node verify/e2e/cosafare.cjs
const { serve, launch, context, check, results } = require('./serve.cjs');

const PORT = 4184;
const BASE = `http://localhost:${PORT}/`;

(async () => {
  const srv = serve(PORT);
  const b = await launch();
  const ctx = await context(b, { viewport: { width: 1440, height: 900 } });
  await ctx.route(/supabase|unpkg|openfreemap|openstreetmap|routing|open-meteo|wikimedia|wikipedia|wikidata/, (r) => r.abort());
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  const trip = () => p.evaluate(() => JSON.parse(localStorage.getItem('nfhp.trip.v1') || '{}'));
  await p.goto(BASE);
  await p.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('nfhp.ui.mode', 'planning');
  });
  await p.goto(BASE + '#/pianifica');
  await p.fill('input[aria-label="Cerca località"]', 'Oslo');
  await p.click('.suggestions button:has-text("Oslo") >> nth=0');
  await p.click('.ol-detail [aria-label="Una notte in più"]');
  await p.click('.ol-detail [aria-label="Una notte in più"]');
  await p.waitForTimeout(500);

  // 1. Dalla tappa: due azioni distinte
  await p.click('.stop-tabs [role=tab]:has-text("Cosa fare")');
  check(await p.isVisible('h3:has-text("Cosa fare a Oslo")'), 'sezione «Cosa fare a Oslo» nella tappa');
  check((await p.locator('.things-actions button').count()) === 2, 'due azioni distinte: catalogo e attività personale');

  // 2. Catalogo contestuale con la tappa visibile
  const opener = p.locator('button:has-text("Esplora musei e attrazioni")');
  await opener.click();
  await p.waitForSelector('dialog[open].things-drawer');
  check(/Cosa fare a Oslo/.test(await p.textContent('dialog[open] h2')), 'il pannello mantiene la tappa');
  const total = await p.locator('.things-results > li').count();
  check(total >= 8, 'luoghi di Oslo nel catalogo', String(total));
  const count = async () => Number((await p.textContent('.things-count [role=status]')).match(/\d+/)[0]);
  check((await count()) === total, 'conteggio uguale agli elementi mostrati');
  await p.fill('dialog[open] input[type=search]', 'heyerdahl');
  check((await count()) === 1 && (await p.locator('.things-results > li').count()) === 1, 'ricerca nella descrizione');
  await p.click('dialog[open] button:has-text("Azzera ricerca e filtri")');
  await p.click('dialog[open] label.chip:has-text("Solo in città")');
  check(!(await p.isVisible('.things-results h3:has-text("TusenFryd")')), '«Solo in città» esclude TusenFryd');
  await p.click('dialog[open] label.chip:has-text("Musei")');
  const shown = await p.locator('.things-results > li').count();
  check((await count()) === shown && shown > 0, 'filtri combinati con conteggio corretto', String(shown));
  await p.click('dialog[open] button:has-text("Azzera ricerca e filtri")');
  check((await count()) === total, 'azzerare riporta tutti i risultati');
  check(/Fuori città/.test(await p.locator('.attr', { hasText: 'TusenFryd' }).textContent()), 'TusenFryd distinto come fuori città');
  check(/Nessuna foto con licenza verificata|Foto in caricamento/.test((await p.locator('.attr', { hasText: 'MUNCH' }).locator('button:has-text("Dettagli")').click().then(() => p.locator('.attr', { hasText: 'MUNCH' }).textContent()))), 'senza licenza letta niente foto: segnaposto');
  check(/Sito ufficiale/.test(await p.locator('.attr', { hasText: 'MUNCH' }).textContent()), 'dettagli: sito ufficiale e fonti');

  // 3. Salva tra le idee: il programma non cambia
  const before = JSON.stringify((await trip()).days);
  await p.locator('.attr', { hasText: 'Museo Fram' }).locator('button:has-text("Salva tra le idee")').click();
  await p.waitForTimeout(500);
  const t1 = await trip();
  check(JSON.stringify(t1.days) === before && t1.stops[0].ideas?.includes('fram'), 'idea salvata, giornate invariate');
  check(/Salvata tra le idee/.test(await p.locator('.attr', { hasText: 'Museo Fram' }).textContent()), 'stato «salvata tra le idee» con testo');

  // 4. Pianifica: scelta del giorno e conferma esplicita
  const fram = p.locator('.attr', { hasText: 'Museo Fram' });
  await fram.locator('button:has-text("Pianifica nella giornata")').click();
  check(JSON.stringify((await trip()).days) === before, 'aprire la pianificazione non cambia nulla');
  await fram.locator('.attr-plan input[type=radio] >> nth=1').check();
  check(/Carico del giorno 2/.test(await fram.locator('.attr-plan').textContent()), 'prima della conferma: carico e dati da verificare');
  await fram.locator('button:has-text("Conferma: pianifica nel giorno 2")').click();
  await p.waitForTimeout(500);
  const t2 = await trip();
  const day2 = Object.values(t2.days).flatMap((d) => d.activities).find((a) => a.destinationId === 'fram');
  check(Boolean(day2) && !t2.stops[0].ideas.includes('fram'), 'attività collegata alla scheda, non più tra le idee');
  check(/Pianificata: giorno 2/.test(await fram.textContent()) && (await fram.locator('button:has-text("Cambia giornata")').count()) === 1 && (await fram.locator('button:has-text("Rimuovi dal giorno")').count()) === 1, 'già pianificata: giorno, «Cambia giornata», «Rimuovi dal giorno»');

  // 5. Tastiera: Esc chiude e il focus torna al pulsante
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  check((await p.locator('dialog[open]').count()) === 0, 'Esc chiude il catalogo');
  check(await p.evaluate(() => document.activeElement?.textContent?.includes('Esplora musei e attrazioni')), 'il focus torna a «Esplora musei e attrazioni»');
  check(/1 visita pianificata/.test(await p.textContent('.things')), 'riepilogo della tappa aggiornato');

  // 6. Attività personale, distinta dal catalogo
  await p.click('button:has-text("Aggiungi un\'attività personale")');
  await p.fill('input[placeholder="Es. pomeriggio di riposo"]', 'Cena con amici');
  await p.click('.things-personal button:has-text("Aggiungi al giorno")');
  await p.waitForTimeout(400);
  const personal = Object.values((await trip()).days).flatMap((d) => d.activities).find((a) => a.title === 'Cena con amici');
  check(personal && !personal.destinationId, 'attività personale senza scheda né fonte');

  // 7. Giornate: le due attività distinte, rimozione che riporta tra le idee
  await p.goto(BASE + '#/giornate');
  const kinds = await p.$$eval('.activity-kind', (els) => els.map((e) => e.textContent));
  check(kinds.includes('Dal catalogo') && kinds.includes('Personale'), 'Giornate: «Dal catalogo» e «Personale»', kinds.join(','));
  check((await p.locator('.activity-place button:has-text("Scheda del luogo")').count()) === 1, 'Giornate: collegamento alla scheda del luogo');
  check((await p.locator('.chip:has-text("+ ")').count()) === 0, 'niente chip «+ luogo» senza spiegazione');

  // 8. Oggi: la visita con scheda e indicazioni
  await p.goto(BASE + '#/t/oggi?tappa=' + (await trip()).stops[0].id);
  await p.click('.today-nav [aria-label="Giorno successivo"]');
  check(/Museo Fram/.test(await p.textContent('.today')) && (await p.locator('.today .activity-place a:has-text("Indicazioni")').count()) === 1, 'Oggi: visita con scheda e indicazioni');
  await p.goto(BASE + '#/giornate');
  await p.locator('.activity:has(.is-catalog) [aria-label^="Rimuovi"]').click();
  await p.waitForTimeout(400);
  const t3 = await trip();
  check(t3.stops[0].ideas.includes('fram') && !Object.values(t3.days).flatMap((d) => d.activities).some((a) => a.destinationId === 'fram'), 'tolta dal giorno: torna tra le idee, la scheda resta');

  // 9. 375 px: catalogo a tutto schermo, nessun overflow, controlli raggiungibili
  await p.setViewportSize({ width: 375, height: 812 });
  await p.goto(BASE + '#/pianifica');
  await p.click('.ol-item.ol-stop >> nth=0');
  await p.click('.stop-tabs [role=tab]:has-text("Cosa fare")');
  await p.click('button:has-text("Esplora musei e attrazioni")');
  await p.waitForSelector('dialog[open].things-drawer');
  const dlg = await p.evaluate(() => {
    const d = document.querySelector('dialog[open]');
    const r = d.getBoundingClientRect();
    const wide = [...d.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > r.right + 1).length;
    return { w: Math.round(r.width), vw: innerWidth, wide };
  });
  check(dlg.w === dlg.vw && dlg.wide === 0, '375 px: pannello a tutto schermo senza contenuti tagliati', JSON.stringify(dlg));
  const small = await p.$$eval('dialog[open] button, dialog[open] label.chip', (els) => els.filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect().height).filter((h) => h < 30).length);
  check(small === 0, '375 px: controlli alti almeno 30 px', String(small));
  await p.keyboard.press('Escape');

  check(errors.length === 0, 'nessun errore JavaScript', errors.join(' | '));
  console.log(`\n${results.ok} OK, ${results.fail} FAIL`);
  await b.close();
  srv.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
