// «Trasporti via mare» nel browser: schede Crociere (invariata) e Traghetti, invito e passaggio esplicito a NO-2,
// elenco con ricerca e filtri, scheda della tratta, aggiunta al percorso con costo per la famiglia, tratto nel percorso,
// righe nel Budget, suggerimenti «alternativa all'auto», tastiera e 375 px.
// Build di produzione, servizi esterni simulati o bloccati (OSRM finto come in e2e.cjs). Nessuna prenotazione.
// Uso: npm run build && node verify/e2e/traghetti.cjs
const { serve, launch, context, ok, fail, check, results } = require('./serve.cjs');

const PORT = 4186;
const BASE = `http://localhost:${PORT}/`;

// Percorsi OSRM finti: linea retta, km = distanza in linea d'aria × 1,3 (solo per avere un tratto «su strada» nel test)
function osrm(url) {
  const m = /driving\/([\d.-]+),([\d.-]+);([\d.-]+),([\d.-]+)/.exec(url);
  const [lng1, lat1, lng2, lat2] = m.slice(1).map(Number);
  const km = Math.max(1, Math.hypot((lat2 - lat1) * 111, (lng2 - lng1) * 55));
  const pts = Array.from({ length: 10 }, (_, i) => [lng1 + ((lng2 - lng1) * i) / 9, lat1 + ((lat2 - lat1) * i) / 9]);
  const steps = [{ mode: 'driving', distance: km * 1300, duration: ((km * 1.3) / 55) * 3600, geometry: { coordinates: pts } }];
  return JSON.stringify({ code: 'Ok', routes: [{ distance: 1, duration: 1, legs: [{ steps }] }] });
}

const stored = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('nfhp.trip.v1') || '{}'));
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const legOf = (t, a, b) => {
  const id = (n) => t.stops.find((s) => s.name.startsWith(n))?.id;
  return t.legs.find((l) => l.fromStopId === id(a) && l.toStopId === id(b));
};

(async () => {
  const srv = serve(PORT);
  const b = await launch();
  const ctx = await context(b, { viewport: { width: 1440, height: 900 } });
  await ctx.route(/supabase\.co/, (r) => r.abort());
  await ctx.route(/unpkg\.com|tiles\.openfreemap|openstreetmap\.org\/|arcgisonline|tile\.|open-meteo|wikimedia|wikipedia|wikidata|overpass|nominatim/, (r) => r.abort());
  await ctx.route(/routing\.openstreetmap\.de/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: osrm(r.request().url()) }));
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text()) && errors.push(m.text()));
  await p.addInitScript(() => {
    if (!sessionStorage.getItem('e2e-init')) {
      localStorage.clear();
      localStorage.setItem('nfhp.ui.mode', 'planning');
      sessionStorage.setItem('e2e-init', '1');
    }
  });

  // 1. Percorso di prova (tappe di esempio, il viaggio reale non è deciso) e strada calcolata (OSRM finto)
  await p.goto(BASE + '#/pianifica');
  for (const q of ['Bergen', 'Flåm', 'Geiranger', 'Ålesund']) {
    await p.fill('input[aria-label="Cerca località"]', q);
    await p.click('.suggestions button >> nth=0');
  }
  await p.click('.plan-status .next-step a.btn-primary');
  await p.waitForSelector('.toast:has-text("Calcolati 3 tratti")', { timeout: 20000 }).then(() => ok('strada calcolata nei 3 collegamenti (OSRM finto)')).catch(() => fail('calcolo dei tratti'));
  const start = await stored(p);
  check(!start.countries || start.countries[0].releaseId === 'NO-1', 'viaggio nuovo sul catalogo NO-1', JSON.stringify(start.countries));

  // 2. Menù e indirizzi: «Trasporti via mare», Crociere invariata, alias #/mare
  await p.goto(BASE + '#/crociere');
  check((await p.locator('nav a:has-text("Trasporti via mare"), nav button:has-text("Trasporti via mare")').count()) >= 1, 'voce di menù «Trasporti via mare»');
  check((await p.getAttribute('[role=tab]#mare-crociere', 'aria-selected')) === 'true', 'si apre sulla scheda Crociere');
  check((await p.locator('h2:has-text("Hurtigruten")').count()) === 1 && (await p.locator('h2:has-text("Havila")').count()) === 1 && (await p.locator('h2:has-text("Confronto")').count()) === 1, 'Crociere: Hurtigruten, Havila e confronto come prima');
  await p.goto(BASE + '#/mare');
  check((await p.locator('[role=tablist][aria-label="Trasporti via mare"]').count()) === 1, 'alias #/mare apre Trasporti via mare');
  await p.goto(BASE + '#/costiera');
  check((await p.locator('h2:has-text("Hurtigruten")').count()) === 1, 'vecchio indirizzo #/costiera funziona');

  // 3. Viaggio su NO-1: invito ad aggiornare, nessuna tratta, nessun dato finto
  await p.goto(BASE + '#/crociere');
  await p.click('[role=tab]#mare-traghetti');
  check(/parte=traghetti/.test(p.url()), 'la scheda scelta aggiorna l\'indirizzo');
  const invite = await p.textContent('#mare-pannello');
  check(/catalogo Norvegia versione 2/.test(invite) && /non cambia da solo/.test(invite), 'catalogo versione 1: invito a passare alla versione 2', invite.slice(0, 160));
  check((await p.locator('.ferry-item').count()) === 0, 'su NO-1 nessuna tratta mostrata');
  // Tastiera sulle schede: freccia sinistra torna a Crociere
  await p.focus('[role=tab]#mare-traghetti');
  await p.keyboard.press('ArrowLeft');
  await p.waitForTimeout(150); // il focus si sposta al fotogramma successivo
  check((await p.getAttribute('[role=tab]#mare-crociere', 'aria-selected')) === 'true' && (await p.evaluate(() => document.activeElement?.id)) === 'mare-crociere', 'schede: frecce della tastiera');
  await p.keyboard.press('End');
  check((await p.getAttribute('[role=tab]#mare-traghetti', 'aria-selected')) === 'true', 'schede: Fine porta all\'ultima');

  // 4. Passaggio a NO-2 da Impostazioni › Nazioni e cataloghi, con conferma
  await p.click('a:has-text("Vai a Nazioni e cataloghi")');
  await p.waitForSelector('#nazioni button:has-text("Passa a NO-2")');
  ok('Impostazioni: «Passa a NO-2» nel riquadro Nazioni e cataloghi');
  await p.click('#nazioni button:has-text("Passa a NO-2")');
  await p.waitForSelector('dialog[open]');
  check(/Tappe, notti, idee, preferiti/.test(await p.textContent('dialog[open]')), 'conferma: spiega che nulla si perde');
  await p.keyboard.press('Escape');
  const afterEsc = await stored(p);
  check(JSON.stringify(afterEsc.countries) === JSON.stringify(start.countries), 'Esc: il viaggio resta su NO-1');
  await p.click('#nazioni button:has-text("Passa a NO-2")');
  await p.click('dialog[open] button.btn-primary:has-text("Passa a NO-2")');
  await p.waitForTimeout(400);
  const up = await stored(p);
  check(up.countries?.[0]?.releaseId === 'NO-2', 'viaggio passato a NO-2', JSON.stringify(up.countries));
  check(JSON.stringify(up.stops) === JSON.stringify(afterEsc.stops) && JSON.stringify(up.legs) === JSON.stringify(afterEsc.legs) && JSON.stringify(up.days) === JSON.stringify(afterEsc.days), 'tappe, collegamenti e giornate invariati');
  check((await p.locator('#nazioni button:has-text("Passa a NO-2")').count()) === 0, 'dopo il passaggio nessun invito');

  // 5. Elenco dei traghetti: conteggio, riepilogo, ricerca e filtri combinabili, stato vuoto
  await p.goto(BASE + '#/crociere?parte=traghetti');
  await p.waitForSelector('.ferry-item');
  check((await p.textContent('[role=tab]#mare-traghetti')).includes('Traghetti (58)'), 'scheda «Traghetti (58)»');
  const count = async () => (await p.textContent('.ferries [role=status]')).trim();
  check(/^58 tratte su 58/.test(await count()), 'conteggio iniziale 58 su 58', await count());
  check(/prezzo 2027: 1 · tariffa da verificare: 46 · prezzo assente: 11/.test(await p.textContent('.ferries')), 'riepilogo: 1 prezzo 2027, 46 da verificare, 11 assenti');
  check(/L'app non prenota nulla/.test(await p.textContent('.ferries .note-info')), 'nota: l\'app non prenota nulla');
  check((await p.locator('.ferries button:has-text("Prenota"), .ferries a:has-text("Prenota")').count()) === 0, 'nessun pulsante «Prenota»');
  await p.fill('input[aria-label="Cerca nei traghetti"]', 'flam');
  await p.waitForTimeout(500);
  const flam = await p.locator('.ferry-item').count();
  check(flam >= 2 && (await count()).startsWith(`${flam} tratte su 58`), 'ricerca senza accenti («flam» trova Flåm) con conteggio', `${flam} · ${await count()}`);
  await p.fill('input[aria-label="Cerca nei traghetti"]', '');
  await p.selectOption('.ferry-filters select >> nth=0', 'Troms');
  await p.locator('.ferry-filters label.chip:has-text("Battello veloce")').click();
  await p.locator('.ferry-filters label.check:has-text("Solo con prezzo") input').check();
  await p.waitForTimeout(450);
  const combo = await p.locator('.ferry-item').count();
  const comboText = await p.locator('.ferry-item').allTextContents();
  check(combo > 0 && (await count()).startsWith(`${combo} tratte`) && comboText.every((t) => /Battello veloce/.test(t)), 'filtri combinati (zona + mezzo + prezzo) e conteggio coerente', `${combo} · ${await count()}`);
  await p.click('.ferry-filters button:has-text("Azzera filtri")');
  await p.waitForTimeout(450);
  check(/^58 tratte su 58/.test(await count()), '«Azzera filtri» riporta tutte le tratte');
  await p.fill('input[aria-label="Cerca nei traghetti"]', 'zzzz nessuna');
  await p.waitForTimeout(500);
  check((await p.locator('.empty:has-text("Nessuna tratta per questi filtri")').count()) === 1, 'stato vuoto: «Nessuna tratta per questi filtri»');
  await p.fill('input[aria-label="Cerca nei traghetti"]', '');
  await p.waitForTimeout(450);

  // 6. Suggerimenti «alternativa all'auto»: solo battelli, solo per id del catalogo, nessun cambio automatico
  const sugg = await p.textContent('.ferry-suggest');
  check(/Alternative all'auto nel tuo percorso/.test(sugg) && /Bergen/.test(sugg) && /Flåm/.test(sugg), 'suggerimento Bergen → Flåm in battello');
  check(!/Eidsdal/.test(sugg), 'un traghetto per auto non è mai suggerito come alternativa');

  // 7. Scheda della tratta: tappe, durata, regola tariffaria, stato del prezzo, fonti con data
  await p.fill('input[aria-label="Cerca nei traghetti"]', 'hellesylt');
  await p.waitForTimeout(450);
  const opener = p.locator('.ferry-item h4 button').first();
  await opener.click();
  await p.waitForSelector('dialog[open] .ferry-sheet');
  const sheet = await p.textContent('dialog[open]');
  check(/Tappe in ordine/.test(sheet) && /Hellesylt/.test(sheet) && /1 h 05/.test(sheet), 'scheda: tappe e durata');
  check(/Paga l'auto \(conducente incluso\) e ogni passeggero/.test(sheet), 'scheda: regola tariffaria in una frase');
  check(/Tariffa 2026, da verificare per il 2027/.test(sheet), 'scheda: tariffa 2026 da verificare per il 2027');
  check(/letto il 09\/11\/2026/.test(sheet) && (await p.locator('dialog[open] a[target=_blank]:has-text("Vai alla fonte")').count()) >= 1, 'scheda: fonti con data e link esterno');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  check((await p.locator('dialog[open]').count()) === 0 && (await p.evaluate(() => document.activeElement?.closest('h4') !== null)), 'Esc chiude la scheda e il focus torna alla tratta');

  // 8. Aggiungi al percorso: Geiranger → Hellesylt con auto, anteprima del costo 1650 NOK
  await p.locator('.ferry-item button:has-text("Aggiungi al percorso")').first().click();
  await p.waitForSelector('dialog[open] .ferry-add');
  const legSel = await p.$eval('dialog[open] .ferry-add select', (s) => s.options[s.selectedIndex].textContent);
  check(/Geiranger → 4 Ålesund/.test(legSel), 'collegamento proposto: quello che parte dal porto della tratta', legSel);
  check(await p.isChecked('dialog[open] input[type=radio] >> nth=0'), 'proposto «Con l\'auto» (collegamento in auto)');
  const preview = await p.textContent('dialog[open] .place-preview');
  check(/Si usa: 1650 NOK/.test(preview) && /Auto fino a 6 m/.test(preview) && /conducente è già nell'auto/.test(preview), 'anteprima del costo: 1650 NOK con il dettaglio', preview.slice(0, 200));
  check(/soglia 4 anni/.test(preview), 'avviso età vicino alla soglia');
  const before8 = await stored(p);
  check(JSON.stringify(before8.legs) === JSON.stringify(up.legs), 'nulla cambia prima di «Applica al percorso»');
  await p.click('dialog[open] .chips-field button.chip:has-text("10:00")');
  await p.fill('dialog[open] label:has-text("Attesa e imbarco") + input, dialog[open] input[type=number] >> nth=0', '30');
  await p.locator('dialog[open] label.place-opt:has-text("Lascia la strada")').click();
  await p.click('dialog[open] button:has-text("Applica al percorso")');
  await p.waitForSelector('.toast:has-text("Traghetto aggiunto")');
  ok('toast «Traghetto aggiunto» con Annulla');
  await p.waitForTimeout(700);
  const t8 = await stored(p);
  const gLeg = legOf(t8, 'Geiranger', 'Ålesund');
  const gSeg = gLeg.segments.find((s) => s.ferryRouteId === 'geiranger-hellesylt');
  check(gSeg && gSeg.mode === 'traghetto' && gSeg.withCar === true && gSeg.cost?.amount === 1650 && gSeg.cost?.currency === 'NOK', 'tratto traghetto salvato: con auto, 1650 NOK', JSON.stringify(gSeg));
  check(gSeg && gSeg.distanceKm === undefined && gSeg.departureTime === '10:00' && gSeg.waitMin === 30 && gSeg.durationMin === 65, 'segmento a sé: nessun km, orario e attesa dell\'utente, durata della tratta');
  check(gLeg.segments.some((s) => s.mode === 'strada'), '«Lascia la strada»: la strada resta');
  check(JSON.stringify(t8.stops) === JSON.stringify(up.stops), 'tappe e notti invariate');

  // 9. Dal suggerimento: Bergen → Flåm senza auto, il battello sostituisce la strada (3107 NOK, prezzo 2027)
  await p.fill('input[aria-label="Cerca nei traghetti"]', '');
  await p.waitForTimeout(400);
  await p.locator('.ferry-suggest li', { hasText: 'Bergen' }).locator('button:has-text("Valuta nel percorso")').first().click();
  await p.waitForSelector('dialog[open] .ferry-add');
  check(await p.isChecked('dialog[open] label.place-opt:has-text("Senza auto") input'), 'dal suggerimento: «Senza auto» proposto');
  check(await p.isChecked('dialog[open] label.place-opt:has-text("sostituisce la strada") input'), 'dal suggerimento: «Il traghetto sostituisce la strada» proposto');
  const bf = await p.textContent('dialog[open] .place-preview');
  check(/Si usa: 3107 NOK/.test(bf) && /Biglietto famiglia.*3299/.test(bf) && /Prezzo 2027 confermato sulla fonte/.test(bf), 'Bergen → Flåm: 3107 NOK, famiglia 3299 come alternativa, prezzo 2027 confermato');
  await p.click('dialog[open] button:has-text("Applica al percorso")');
  await p.waitForTimeout(700);
  const t9 = await stored(p);
  const bLeg = legOf(t9, 'Bergen', 'Flåm');
  check(bLeg.segments.length === 1 && bLeg.segments[0].ferryRouteId === 'bergen-flam-express' && bLeg.segments[0].costStatus === 'confermato', 'collegamento Bergen → Flåm: solo il battello');
  check((await p.locator('.ferry-suggest li', { hasText: 'Bergen' }).count()) === 0, 'suggerimento sparito: il collegamento non è più in auto');

  // 10. Costo non calcolabile: Eidsdal → Linge senza auto (regola dei passeggeri non scritta) = nessun importo
  await p.fill('input[aria-label="Cerca nei traghetti"]', 'eidsdal');
  await p.waitForTimeout(450);
  await p.locator('.ferry-item button:has-text("Aggiungi al percorso")').first().click();
  await p.waitForSelector('dialog[open] .ferry-add');
  await p.locator('dialog[open] label.place-opt:has-text("Senza auto") input').check();
  check(/Costo non calcolabile/.test(await p.textContent('dialog[open] .place-preview')), 'Eidsdal → Linge senza auto: «Costo non calcolabile», mai 0');
  await p.locator('dialog[open] label.place-opt:has-text("Con l\'auto a bordo") input').check();
  check(/Si usa: 81 NOK/.test(await p.textContent('dialog[open] .place-preview')), 'Eidsdal → Linge con auto: 81 NOK');
  await p.locator('dialog[open] label.place-opt:has-text("Senza auto") input').check();
  await p.click('dialog[open] button:has-text("Applica al percorso")');
  await p.waitForTimeout(700);
  const t10 = await stored(p);
  const eSeg = t10.legs.flatMap((l) => l.segments).find((s) => s.ferryRouteId === 'eidsdal-linge');
  check(eSeg && eSeg.cost === undefined, 'tratto senza costo: nessun importo salvato');

  // 11. Nel percorso: chip con costo e origine «dal catalogo traghetti», dettaglio «Come è calcolato»
  await p.goto(BASE + `#/pianifica?sel=leg:${gLeg.id}`);
  await p.waitForSelector('.ol-detail .leg');
  const chip = await p.textContent('.ol-detail .seg-chips');
  check(/con auto · 1650 NOK/.test(chip) && /dal catalogo traghetti/.test(chip), 'chip del collegamento: con auto, 1650 NOK, dal catalogo traghetti', chip);
  await p.evaluate(() => document.querySelectorAll('.ol-detail details.leg-details').forEach((d) => (d.open = true)));
  const fseg = p.locator('.ol-detail .ferry-seg:visible').first();
  check(/Costo per la famiglia/.test(await fseg.textContent()), 'dettaglio tratto: costo per la famiglia');
  await fseg.locator('summary:has-text("Come è calcolato")').click();
  check(/Tariffa 2026, da verificare per il 2027/.test(await fseg.textContent()), 'dettaglio: stato del prezzo');

  // 12. Budget: categoria Traghetti, origine Itinerario, prezzo da cercare tra i costi senza importo
  await p.goto(BASE + '#/budget');
  const row = p.locator('tr', { hasText: 'Traghetto Geiranger' }).first();
  const rowText = await row.textContent();
  check(/Traghetti/.test(rowText) && /Da Itinerario/.test(rowText) && /· con auto/.test(rowText) && /1650 NOK/.test(rowText), 'Budget: riga Traghetti, Da Itinerario, 1650 NOK', rowText.slice(0, 200));
  check(/Traghetto Eidsdal.*prezzo da cercare/.test(await p.textContent('main, .app')), 'Budget: «prezzo da cercare», nessuno zero');

  // 13. Ricaricando, tutto resta; la scheda Crociere funziona come prima
  await p.reload();
  await p.goto(BASE + '#/crociere');
  check((await p.locator('h2:has-text("Hurtigruten")').count()) === 1, 'dopo il ricaricamento Crociere invariata');
  const t13 = await stored(p);
  check(t13.legs.flatMap((l) => l.segments).filter((s) => s.ferryRouteId).length === 3, 'tre tratti traghetto salvati');

  // 14. 375 px: nessuno scorrimento orizzontale, scheda a tutto schermo, pulsanti alti almeno 44 px
  await p.setViewportSize({ width: 375, height: 812 });
  await p.goto(BASE + '#/crociere?parte=traghetti');
  await p.waitForSelector('.ferry-item');
  check((await overflow(p)) <= 0, '375 px: nessuno scorrimento orizzontale');
  check((await p.locator('.ferries details.ferry-more summary:has-text("Filtri")').count()) === 1, '375 px: filtri raccolti in «Filtri»');
  const small = await p.$$eval('.ferry-item-actions .btn', (els) => els.filter((e) => e.offsetParent && e.getBoundingClientRect().height < 44).length);
  check(small === 0, '375 px: pulsanti delle tratte alti almeno 44 px', String(small));
  await p.locator('.ferry-item h4 button').first().click();
  await p.waitForSelector('dialog[open] .ferry-sheet');
  const dlg = await p.evaluate(() => {
    const d = document.querySelector('dialog[open]');
    const r = d.getBoundingClientRect();
    return { w: Math.round(r.width), vw: document.documentElement.clientWidth, left: Math.round(r.left), right: Math.round(r.right), wide: [...d.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > r.right + 1).length };
  });
  check(dlg.left >= 0 && dlg.right <= dlg.vw && dlg.w >= dlg.vw - 40 && dlg.wide === 0, '375 px: scheda quasi a tutto schermo, nessun contenuto tagliato', JSON.stringify(dlg));
  await p.keyboard.press('Escape');

  check(errors.length === 0, 'nessun errore JavaScript', errors.join(' | '));
  console.log(`\n${results.ok} OK, ${results.fail} FAIL`);
  await b.close();
  srv.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
