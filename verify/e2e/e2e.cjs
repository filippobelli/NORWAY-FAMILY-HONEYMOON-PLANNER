// Percorso completo nel browser sulla build di produzione (dist/), con servizi esterni simulati.
// Copre i criteri di rilascio: verifica ≠ prenotazione, prossimo passo coerente, tempi non verificabili, ricerca alloggi
// unica, errori di mappa e percorsi, bozze non applicate, esportazioni, pacchetto offline, tastiera e 375 px.
// Uso: npm run build && node verify/e2e/e2e.cjs [cartella-output]
const fs = require('fs');
const path = require('path');
const { serve, launch, context, ok, fail, check, results } = require('./serve.cjs');

const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'out'));
fs.mkdirSync(OUT, { recursive: true });
const PORT = 4181;
const BASE = `http://localhost:${PORT}/`;

// Percorsi OSRM finti: linea retta con 40 punti; oltre 80 km un traghetto a metà strada
function osrm(url, mode) {
  if (mode === 'errore') return { status: 503, body: '{}' };
  const m = /driving\/([\d.-]+),([\d.-]+);([\d.-]+),([\d.-]+)/.exec(url);
  const [lng1, lat1, lng2, lat2] = m.slice(1).map(Number);
  const km = Math.hypot((lat2 - lat1) * 111, (lng2 - lng1) * 55);
  const pts = (a, b) => Array.from({ length: 20 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / 19, a[1] + ((b[1] - a[1]) * i) / 19]);
  const mid = [(lng1 + lng2) / 2, (lat1 + lat2) / 2];
  const drive = (a, b, d) => ({ mode: 'driving', distance: d * 1000, duration: (d / 55) * 3600, geometry: { coordinates: pts(a, b) } });
  const steps =
    km > 80
      ? [drive([lng1, lat1], mid, km * 0.65), { mode: 'ferry', distance: 6000, duration: 1500, name: 'Test ferje', geometry: { coordinates: [mid, mid] } }, drive(mid, [lng2, lat2], km * 0.65)]
      : [drive([lng1, lat1], [lng2, lat2], km * 1.3)];
  return { status: 200, body: JSON.stringify({ code: 'Ok', routes: [{ distance: 1, duration: 1, legs: [{ steps }] }] }) };
}

const stored = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('nfhp.trip.v1') || '{}'));
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

(async () => {
  const srv = serve(PORT);
  const browser = await launch();
  const ctx = await context(browser, { viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  let routing = 'ok';
  let osrmCalls = 0;
  await ctx.route(/supabase\.co/, (r) => r.abort());
  await ctx.route(/unpkg\.com|tiles\.openfreemap|openstreetmap\.org\/|arcgisonline|tile\./, (r) => r.abort());
  await ctx.route(/open-meteo/, (r) => r.abort());
  await ctx.route(/routing\.openstreetmap\.de/, (r) => {
    osrmCalls++;
    const res = osrm(r.request().url(), routing);
    return r.fulfill({ status: res.status, contentType: 'application/json', body: res.body });
  });
  await ctx.route(/overpass|nominatim/, (r) =>
    r.fulfill({ contentType: 'application/json', body: JSON.stringify({ elements: [{ type: 'node', id: 11, lat: 62.1, lon: 7.2, tags: { tourism: 'chalet', name: 'Test Hytte Fjord', website: 'https://example.org' } }] }) }),
  );
  await p.addInitScript(() => {
    if (!sessionStorage.getItem('e2e-init')) {
      localStorage.clear();
      localStorage.setItem('nfhp.ui.mode', 'planning');
      sessionStorage.setItem('e2e-init', '1');
    }
  });

  // 1. Viaggio vuoto: un'azione iniziale consigliata e un'alternativa distinta
  await p.goto(BASE + '#/panoramica');
  await p.waitForSelector('.ov-start');
  check((await p.locator('.ov-start-card.is-recommended a.btn-primary').count()) === 1 && (await p.locator('.ov-start-card:not(.is-recommended) a.btn').count()) === 1, 'viaggio vuoto: proposta consigliata e costruzione manuale distinte');

  // 2. Costruzione manuale e tempi non verificabili prima del calcolo
  await p.goto(BASE + '#/pianifica');
  const add = async (q) => {
    await p.fill('input[aria-label="Cerca località"]', q);
    await p.click('.suggestions button >> nth=0');
  };
  for (const q of ['Bergen', 'Flåm', 'Geiranger', 'Ålesund']) await add(q);
  await p.click('.segmented button:has-text("Giorni")');
  const tl = await p.textContent('.timeline');
  check(/non verificabile/.test(tl) && !/entro il limite/i.test(tl), 'giornate con tratti non calcolati: «non verificabile», mai «entro il limite»');
  const step1 = await p.textContent('.plan-status .next-step-text');
  check(/Calcola 3 collegamenti/.test(step1), 'prossimo passo: calcolare i tratti', step1);

  // 3. Calcolo dal prossimo passo: stato visibile, nessuno spinner che resta
  await p.click('.plan-status .next-step a.btn-primary');
  await p.waitForSelector('.toast:has-text("Calcolati 3 tratti")', { timeout: 20000 }).then(() => ok('calcolo dei tratti dal prossimo passo')).catch(() => fail('calcolo dei tratti'));
  await p.waitForTimeout(300);
  check((await p.locator('.plan-status .spinner').count()) === 0, 'nessun indicatore di calcolo rimasto acceso');
  check(osrmCalls === 3, '3 richieste al servizio di percorsi', String(osrmCalls));

  // 4. Stesso prossimo passo in Itinerario, Panoramica e Prenotazioni
  const read = async () => ({ text: (await p.textContent('.next-step-text'))?.trim(), href: await p.getAttribute('.next-step a.btn-primary', 'href') });
  const inPlanner = await read();
  await p.goto(BASE + '#/panoramica');
  const inOverview = await read();
  await p.goto(BASE + '#/prenotazioni');
  const inBookings = await read();
  check(inPlanner.text === inOverview.text && inOverview.text === inBookings.text && inPlanner.href === inBookings.href, 'prossimo passo identico in tre schermate', `${inPlanner.text} | ${inOverview.text} | ${inBookings.text}`);
  check((await p.locator('.next-step').count()) === 1, 'una sola scheda di prossimo passo in Prenotazioni');

  // 5. Verifica ≠ prenotazione: il traghetto verificato resta «Non prenotato»
  const ferryRow = p.locator('.bk-row', { hasText: 'Traghetto Test ferje' }).first();
  check(/Non prenotato/.test(await ferryRow.textContent()) && /da verificare/i.test(await ferryRow.textContent()), 'traghetto: non prenotato, orario da verificare');
  await ferryRow.locator('a.btn').click();
  await p.waitForSelector('.ol-detail .verification');
  await p.locator('.ol-detail .verification summary').first().click();
  await p.locator('.ol-detail .verification button:has-text("Verificata oggi")').first().click();
  await p.goto(BASE + '#/prenotazioni');
  const ferryAfter = await p.locator('.bk-row', { hasText: 'Traghetto Test ferje' }).first().textContent();
  check(/Non prenotato/.test(ferryAfter) && /Orario: verificata/.test(ferryAfter) && !/Prenotato\b(?!,)/.test(ferryAfter.replace('Non prenotato', '')), 'orario verificato: mostrato come verifica, non come prenotazione', ferryAfter);

  // 6. Ricerca alloggi contestuale: un solo pannello già impostato sulla tappa
  await p.click('.bk-row a[aria-label="Cerca: Geiranger"]');
  await p.waitForSelector('dialog.drawer[open] .search-summary');
  const summary = await p.textContent('dialog.drawer .search-summary');
  check(/Geiranger/.test(summary) && /2 adulti e 2 bambini/.test(summary) && /raggio 15 km/.test(summary) && /dal /.test(summary), 'ricerca alloggi precompilata: tappa, date, persone, raggio', summary);
  check((await p.locator('#hytte-search').count()) === 0, 'nessun secondo modulo di ricerca nella pagina');
  await p.click('dialog.drawer button:has-text("Cerca entro")');
  await p.waitForSelector('dialog.drawer .osm-results li');
  check(/Sono ricerche: non confermano la disponibilità/.test(await p.textContent('dialog.drawer')), 'ricerche esterne dichiarate come non prenotazioni');
  await p.keyboard.press('Escape');
  check((await p.locator('dialog[open]').count()) === 0, 'Esc chiude il pannello di ricerca');

  // 7. Mappa: caricamento, errore, Riprova; elenco utilizzabile
  await p.goto(BASE + '#/pianifica');
  await p.click('.segmented button:has-text("Mappa")');
  await p.waitForSelector('.map-error', { timeout: 20000 });
  check((await p.locator('.map-error button:has-text("Riprova")').count()) === 1, 'mappa non disponibile: messaggio e «Riprova»');
  await p.click('.map-error button:has-text("Riprova")');
  await p.waitForSelector('.map-overlay', { timeout: 3000 });
  await p.waitForSelector('.map-error', { timeout: 20000 }).then(() => ok('Riprova rifà il caricamento e torna all\'errore senza restare bloccata')).catch(() => fail('Riprova mappa'));
  await p.click('.ol-item.ol-stop:has-text("Flåm")');
  check((await p.locator('.ol-detail').count()) === 1, 'senza mappa elenco e dettagli restano utilizzabili');

  // 8. Errore del servizio di percorsi: messaggio, stima dichiarata, nessuno spinner
  routing = 'errore';
  await p.click('.ol-item.ol-leg >> nth=1');
  await p.click('.ol-detail button:has-text("Ricalcola strada")');
  await p.waitForSelector('.ol-detail [role=alert]:has-text("Calcolo non riuscito")', { timeout: 10000 }).then(() => ok('errore di calcolo mostrato nel tratto')).catch(() => fail('errore di calcolo'));
  check((await p.locator('.ol-detail [role=status]:has-text("Calcolo del percorso in corso")').count()) === 0, 'dopo l\'errore il calcolo non resta «in corso»');
  routing = 'ok';

  // 9. Limite superato: bozza di tappa intermedia, nulla cambia fino alla conferma
  await p.goto(BASE + '#/impostazioni');
  await p.fill('#' + (await p.locator('label:has-text("Soglia trasferimenti")').getAttribute('for')), '90');
  await p.waitForTimeout(600);
  await p.goto(BASE + '#/pianifica');
  const over = await p.textContent('.plan-status .next-step-text');
  check(/superano il limite|supera il limite/.test(over), 'prossimo passo: trasferimenti oltre il limite', over);
  await p.click('.plan-status .next-step a.btn-primary');
  await p.waitForSelector('.ol-detail .leg');
  const before = JSON.stringify((await stored(p)).stops);
  const opener = p.locator('.ol-detail button:has-text("Cerca una tappa intermedia")');
  await opener.click();
  await p.waitForSelector('dialog[open]');
  check(await p.evaluate(() => document.querySelector('dialog[open]').contains(document.activeElement)), 'dialogo: il focus entra nel dialogo');
  await p.waitForTimeout(800);
  check(JSON.stringify((await stored(p)).stops) === before, 'bozza della tappa intermedia: il viaggio non cambia prima della conferma');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  check((await p.locator('dialog[open]').count()) === 0, 'Esc chiude il dialogo');
  check(await p.evaluate(() => document.activeElement?.textContent?.includes('Cerca una tappa intermedia')), 'chiuso il dialogo il focus torna al pulsante che lo ha aperto');

  // 10. Piano B: bozza, poi annulla
  await p.click('.versions summary');
  await p.click('.versions-menu button:has-text("Prepara un piano B")');
  await p.locator('dialog[open] .planb-stops li >> nth=1').locator('button:has-text("Salta")').click();
  check(JSON.stringify((await stored(p)).stops) === before, 'piano B: la bozza non modifica il viaggio');
  await p.click('dialog[open] button.btn-ghost:has-text("Annulla")');

  // 11. Proposta automatica: revisione, conferma esplicita, attivazione
  await p.goto(BASE + '#/configuratore');
  await p.click('button:has-text("Crea la proposta da controllare")');
  await p.waitForSelector('.proposal-review');
  await p.waitForFunction(() => !/Calcolo dei percorsi stradali/.test(document.querySelector('.proposal-review [role=status]')?.textContent || ''), null, { timeout: 30000 });
  check(JSON.stringify((await stored(p)).stops) === before, 'proposta in revisione: il viaggio attivo non cambia');
  check(/Calcolato/.test(await p.textContent('.review-legend')) && /Stima di massima/.test(await p.textContent('.review-legend')), 'revisione: legenda calcolato / stimato / da verificare');
  await p.click('button:has-text("Attiva questo itinerario")');
  await p.waitForSelector('dialog[open]');
  await p.keyboard.press('Escape');
  check(JSON.stringify((await stored(p)).stops) === before, 'conferma annullata: nulla cambia');
  await p.click('button:has-text("Attiva questo itinerario")');
  const confirm = p.locator('dialog[open] button:has-text("Sì, attiva")');
  if (await confirm.isDisabled()) await p.locator('dialog[open] .impact-confirm input').check();
  await confirm.click();
  await p.waitForSelector('.plan-status.is-activated');
  check(/conservata tra le/.test(await p.textContent('.plan-status')), 'dopo l\'attivazione: la versione precedente è conservata');

  // 12. Esportazioni con dati locali
  await p.goto(BASE + '#/impostazioni?sezione=esporta');
  const save = async (label, name) => {
    const [d] = await Promise.all([p.waitForEvent('download'), p.click(`#esporta button:has-text("${label}")`)]);
    const file = path.join(OUT, name);
    await d.saveAs(file);
    return fs.readFileSync(file);
  };
  const pdf = await save('Scarica il PDF', 'viaggio.pdf');
  check(pdf.subarray(0, 8).toString('latin1') === '%PDF-1.4' && pdf.toString('latin1').trimEnd().endsWith('%%EOF'), 'PDF generato', `${pdf.length} byte`);
  const ics = (await save('Scarica il calendario', 'viaggio.ics')).toString('utf8');
  check(ics.startsWith('BEGIN:VCALENDAR') && /BEGIN:VEVENT/.test(ics) && /Ålesund|Geiranger/.test(ics), 'calendario .ics generato con accenti', `${(ics.match(/BEGIN:VEVENT/g) || []).length} eventi`);
  const gpx = (await save('Scarica GPX', 'viaggio.gpx')).toString('utf8');
  check(/<gpx version="1.1"/.test(gpx) && (gpx.match(/<wpt /g) || []).length >= 4 && /<trkpt/.test(gpx), 'GPX con tappe e tracciati');
  const kml = (await save('Scarica KML', 'viaggio.kml')).toString('utf8');
  check(/<kml/.test(kml) && /<Placemark>/.test(kml), 'KML con le tappe');
  const html = (await save('Scarica il pacchetto offline', 'pacchetto-offline.html')).toString('utf8');
  check(/Pacchetto offline creato il/.test(html) && /Giornate/.test(html) && !/<script/i.test(html), 'pacchetto offline autonomo, senza script');

  // 13. Tastiera: ogni elemento raggiunto con Tab ha il focus visibile
  await p.goto(BASE + '#/pianifica');
  await p.click('body');
  const invisible = [];
  for (let i = 0; i < 40; i++) {
    await p.keyboard.press('Tab');
    const r = await p.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      return { name: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40), visible: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 };
    });
    if (r && !r.visible) invisible.push(r.name);
  }
  check(invisible.length === 0, 'tastiera: focus visibile su 40 tabulazioni', invisible.join(', '));
  // Schede della tappa con le frecce
  await p.click('.ol-item.ol-stop:has-text("Bergen")');
  await p.focus('.stop-tabs [role=tab][aria-selected=true]');
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(150);
  check(await p.evaluate(() => document.activeElement?.getAttribute('aria-selected') === 'true' && document.activeElement?.textContent?.startsWith('Cosa fare')), 'schede della tappa: le frecce cambiano scheda e focus');

  // 14. 375 px in pianificazione: niente overflow, barra in basso leggibile, «Altro»
  await p.setViewportSize({ width: 375, height: 812 });
  for (const v of ['panoramica', 'pianifica', 'prenotazioni', 'hytte', 'voli', 'crociere', 'giornate', 'budget', 'configuratore', 'catalogo', 'scenari', 'impostazioni']) {
    await p.goto(BASE + '#/' + v);
    await p.waitForTimeout(350);
    const o = await overflow(p);
    check(o <= 0, `375 px: ${v} senza scorrimento orizzontale`, `${o}px`);
  }
  const labels = await p.$$eval('.tabs a:visible .tab-label, .tab-more .tab-label', (els) => els.filter((e) => e.offsetParent).map((e) => parseFloat(getComputedStyle(e).fontSize)));
  check(labels.length === 5 && labels.every((s) => s >= 12), 'barra in basso: 5 voci con etichette di almeno 12 px', labels.join(','));
  const heights = await p.$$eval('.tabs > a, .tab-more > summary', (els) => els.filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect().height));
  check(heights.every((h) => h >= 44), 'barra in basso: controlli alti almeno 44 px', heights.map(Math.round).join(','));
  await p.click('.tab-more summary');
  check(await p.isVisible('.tab-more-menu a:has-text("Budget")'), '«Altro» apre Budget, Modalità viaggio e Impostazioni');
  await p.keyboard.press('Escape');

  // 15. Modalità viaggio a 375 px, anche senza rete
  await p.click('.tab-more summary');
  await p.click('.tab-more-menu a:has-text("Modalità viaggio")');
  for (const v of ['t/oggi', 't/itinerario', 't/mappa', 't/diario', 't/altro']) {
    await p.goto(BASE + '#/' + v);
    await p.waitForTimeout(300);
    const o = await overflow(p);
    check(o <= 0, `modalità viaggio: ${v} senza scorrimento orizzontale`, `${o}px`);
  }
  await ctx.setOffline(true);
  await p.goto(BASE + '#/t/oggi').catch(() => undefined);
  await p.evaluate(() => window.dispatchEvent(new Event('offline')));
  await p.waitForTimeout(300);
  check(await p.isVisible('.travel-offline'), 'senza rete: avviso con ciò che funziona e ciò che no');
  check(/(solo negli ultimi 16 giorni|Serve la rete|già passata)/.test((await p.textContent('.weather')) || ''), 'meteo: nessuna previsione inventata fuori intervallo o senza rete');
  await p.goto(BASE + '#/t/altro').catch(() => undefined);
  check(await p.isVisible('.exports button:has-text("Scarica il pacchetto offline")'), 'pacchetto offline disponibile in modalità viaggio');
  await ctx.setOffline(false);
  await p.screenshot({ path: path.join(OUT, 'mobile-altro.png') });

  const real = errors.filter((e) => !/Failed to load resource|ERR_|net::|unpkg|openfreemap|Libreria mappa|Impossibile scaricare/.test(e));
  check(real.length === 0, 'nessun errore JavaScript in console', real.join(' | '));
  console.log(`\n${results.ok} OK, ${results.fail} FAIL · file in ${OUT}`);
  await browser.close();
  srv.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
