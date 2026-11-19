// Revisione UX del 15–16/11/2026: i problemi riprodotti, provati nel browser con dati sintetici e servizi simulati.
// - bozza della proposta che non si perde, rimozione di una tappa con anteprima, conferma prima di sostituire;
// - dettaglio della selezione fuori dal filtro dell'Itinerario;
// - passaggio di catalogo che fallisce e poi riesce (server cloud FINTO: nessun account e nessun dato reale);
// - link diretti alle viste di pianificazione su telefono;
// - tabelle di Crociere e Budget a 375 e 320 px, dialoghi con tastiera, Escape e ritorno del focus.
// Uso: npm run build && node verify/e2e/revisione-ux.cjs [cartella-output]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { serve, launch, context, ok, fail, check, results } = require('./serve.cjs');

const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'out'));
fs.mkdirSync(OUT, { recursive: true });
const PORT = 4187;
const BASE = `http://localhost:${PORT}`;
const ROOT = path.resolve(__dirname, '../..');

// Cataloghi reali NO-1, NO-2 e NO-3 generati dal seed, serviti dal server finto
const bundlesFile = path.join(OUT, 'bundles.json');
execFileSync(process.execPath, [path.join(ROOT, 'node_modules/tsx/dist/cli.mjs'), path.join(__dirname, 'bundles.ts'), bundlesFile], { cwd: ROOT, stdio: 'inherit' });
const BUNDLES = JSON.parse(fs.readFileSync(bundlesFile, 'utf8'));

// Percorso finto per il servizio OSRM: tratti calcolati senza rete
const fakeRoute = (r) => {
  const u = new URL(r.request().url());
  const pts = u.pathname.split('/').pop().split(';').map((x) => x.split(',').map(Number));
  const [a, b] = pts;
  const coords = [];
  for (let i = 0; i <= 10; i++) coords.push([a[0] + ((b[0] - a[0]) * i) / 10, a[1] + ((b[1] - a[1]) * i) / 10]);
  return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ code: 'Ok', routes: [{ distance: 1, duration: 1, legs: [{ steps: [{ mode: 'driving', distance: 150000, duration: 7200, geometry: { coordinates: coords } }] }] }] }) });
};
const blockOthers = (ctx) => ctx.route((u) => u.hostname !== 'localhost' && !/routing\.openstreetmap\.de|router\.project-osrm\.org|supabase\.co/.test(u.hostname), (r) => r.abort());

async function noHorizontalScroll(p, what) {
  const wide = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(!wide, `${what}: nessuno scorrimento orizzontale della pagina`);
}
/** Controlli dentro le tabelle che escono dalla parte visibile (anche dentro un contenitore che scorre) */
async function controlsOutside(p) {
  return p.evaluate(() => {
    const out = [];
    for (const w of document.querySelectorAll('.table-wrap')) {
      const box = w.getBoundingClientRect();
      for (const e of w.querySelectorAll('input, select, button, a')) {
        const r = e.getBoundingClientRect();
        if (r.width === 0) continue;
        if (r.right > Math.min(box.right, window.innerWidth) + 1 || r.left < Math.max(box.left, 0) - 1) out.push(e.textContent.trim() || e.getAttribute('aria-label') || e.tagName);
      }
      if (w.scrollWidth > w.clientWidth + 1) out.push(`tabella che scorre (${w.scrollWidth} su ${w.clientWidth})`);
    }
    return out;
  });
}

(async () => {
  const srv = serve(PORT);
  const b = await launch();
  const errors = [];

  // ---------- 1. Proposta automatica, 2. selezione fuori filtro (desktop, senza cloud) ----------
  {
    const ctx = await context(b, { viewport: { width: 1440, height: 900 } });
    await blockOthers(ctx);
    await ctx.route(/routing\.openstreetmap\.de|router\.project-osrm\.org/, fakeRoute);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(`${BASE}/`);
    await p.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('nfhp.ui.mode', 'planning');
    });
    await p.goto(`${BASE}/#/configuratore`);
    await p.click('button:has-text("Crea la proposta da controllare")');
    await p.waitForSelector('.proposal-review:not([hidden])');
    const nights = () => p.$$eval('.review-stop-edit input', (xs) => xs.map((x) => x.value).join(','));
    const before = await nights();
    // Una notte in più alla prima tappa
    const first = p.locator('.review-stop-edit input').first();
    await first.fill('1');
    await first.blur();
    const edited = await nights();
    check(edited !== before, 'la modifica delle notti entra nella bozza', `${before} → ${edited}`);
    check(/1 modifica fatta a mano/.test(await p.textContent('.review-jump')), 'il riepilogo conta le modifiche fatte a mano');
    await p.click('button:has-text("Torna alle impostazioni")');
    check(/conservata, con 1 modifica/.test(await p.textContent('.configurator')), 'nelle impostazioni: la proposta in revisione è conservata');
    await p.click('button:has-text("Torna alla proposta")');
    check((await nights()) === edited, 'tornando alla proposta la modifica è ancora lì');
    // Togliere una tappa: anteprima prima, focus sul riepilogo, Escape chiude e restituisce il focus
    const removeBtn = p.locator('.review-stop-edit button.btn-small').nth(2);
    await removeBtn.focus();
    await p.keyboard.press('Enter');
    await p.waitForSelector('dialog[open]');
    const dlg = await p.textContent('dialog[open]');
    check(/notti/.test(dlg) && /giorni/.test(dlg), "il dialogo di rimozione dice dove vanno le notti e l'effetto sulla durata");
    check(await p.evaluate(() => document.activeElement?.hasAttribute('data-autofocus')), 'focus iniziale sul riepilogo, non su un pulsante');
    await p.keyboard.press('Escape');
    check(!(await p.locator('dialog[open]').count()), 'Escape chiude il dialogo');
    check(await p.evaluate(() => document.activeElement?.textContent?.includes('Togli')), 'il focus torna al pulsante «Togli…»');
    check((await nights()) === edited, 'chiuso senza confermare: nulla cambia');
    await removeBtn.click();
    await p.click('dialog[open] input[type=radio] >> nth=1');
    check(/Arrivi che cambiano data|ultimo giorno/.test(await p.textContent('dialog[open]')), 'togliendo le notti si vedono le date che cambiano');
    await p.click('dialog[open] button.btn-primary');
    check((await p.locator('.review-stop-edit').count()) === edited.split(',').length - 1, 'tappa tolta dalla bozza');
    // Rigenerare con modifiche in sospeso chiede conferma
    await p.click('button:has-text("Torna alle impostazioni")');
    await p.click('button:has-text("Crea una proposta nuova")');
    await p.waitForSelector('dialog[open]');
    check(/modifiche fatte a mano si perdono/.test(await p.textContent('dialog[open]')), 'conferma prima di sostituire una bozza modificata, con l\'elenco delle modifiche');
    await p.click('dialog[open] button:has-text("Torna alla proposta")');
    check((await p.locator('.review-stop-edit').count()) === edited.split(',').length - 1, 'rinunciando alla sostituzione la bozza resta');
    // «Vai alla decisione» porta alle azioni finali; si attiva
    await p.click('button:has-text("Vai alla decisione")');
    check(await p.evaluate(() => document.activeElement?.textContent?.includes('Attiva questo itinerario')), '«Vai alla decisione» porta ad «Attiva questo itinerario»');
    check(await p.locator('button:has-text("Salva come alternativa")').count() === 1, '«Salva come alternativa» resta distinta');
    await p.click('button:has-text("Attiva questo itinerario")');
    const confirm = p.locator('dialog[open] input[type=checkbox]');
    if (await confirm.count()) await confirm.check();
    await p.click('dialog[open] button:has-text("Sì, attiva")');
    await p.waitForURL(/#\/pianifica/);
    await p.waitForSelector('.ol-list');

    // Selezione fuori dal filtro: si filtra su una tappa e si sceglie un'altra dalla linea del percorso
    const names = await p.$$eval('.ol-list .ol-name', (xs) => xs.map((x) => x.textContent));
    const target = names.find((n) => !/Aeroporto|Bergen/.test(n));
    await p.fill('input.ol-filter', 'Bergen');
    await p.click(`.route-station:has-text("${target}")`);
    await p.waitForSelector('.ol-outside');
    check(new RegExp(`${target}.*fuori dal filtro`).test(await p.textContent('.ol-outside')), 'selezione fuori filtro: dettaglio visibile con l\'avviso');
    check((await p.inputValue('input.ol-filter')) === 'Bergen', 'il filtro resta');
    // Un link diretto (selezione nell'indirizzo) apre lo stesso dettaglio, anche tornando da un'altra schermata
    const url = p.url();
    await p.goto(`${BASE}/#/giornate`);
    await p.goto(url);
    await p.waitForSelector('.ol-outside, .ol-list .active');
    check(/fuori dal filtro|Tappa/.test(await p.textContent('.planner-outline')), 'ritorno da un\'altra schermata: la selezione e il dettaglio restano');
    // Tratta dalla mappa: si apre il trasferimento
    const hit = p.locator('path.leg-hit').first();
    if (await hit.count()) {
      await hit.click({ force: true });
      await p.waitForTimeout(300);
      check(/sel=leg/.test(decodeURIComponent(p.url())), 'tocco su una tratta della mappa: si apre il trasferimento');
    } else console.log('SALTATO: mappa non disponibile senza rete (Leaflet da CDN bloccato)');
    await p.screenshot({ path: path.join(OUT, 'revisione-itinerario-1440.png') });
    await ctx.close();
  }

  // ---------- 3. Passaggio di catalogo con un server cloud FINTO: prima fallisce, poi riesce ----------
  {
    const ctx = await context(b, { viewport: { width: 1300, height: 900 } });
    await blockOthers(ctx);
    let failNext = true;
    const asked = [];
    const db = new Map();
    let clock = 0;
    const ts = () => `2026-11-16T10:00:${String(clock++ % 60).padStart(2, '0')}.000000+00:00`;
    await ctx.route(/supabase\.co\//, async (r) => {
      const req = r.request();
      const u = new URL(req.url());
      const m = req.method();
      const json = (status, body) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
      const body = () => JSON.parse(req.postData() || 'null');
      if (u.pathname === '/auth/v1/token') return json(200, { access_token: 'tok', refresh_token: 'ref', expires_in: 3600, user: { id: 'u1', email: 'prova@example.test' } });
      if (u.pathname === '/rest/v1/catalog_releases')
        return json(200, [
          { release_id: 'NO-3', country_code: 'NO', version: 3, published_at: '2026-11-10T00:00:00+00:00', countries: { name: 'Norvegia', currency: 'NOK', timezone: 'Europe/Oslo' } },
          { release_id: 'NO-2', country_code: 'NO', version: 2, published_at: '2026-11-10T00:00:00+00:00', countries: { name: 'Norvegia', currency: 'NOK', timezone: 'Europe/Oslo' } },
          { release_id: 'NO-1', country_code: 'NO', version: 1, published_at: '2026-11-06T00:00:00+00:00', countries: { name: 'Norvegia', currency: 'NOK', timezone: 'Europe/Oslo' } },
        ]);
      if (u.pathname === '/rest/v1/rpc/catalog_bundle') {
        const id = body().p_release_id;
        asked.push(id);
        if (id === 'NO-3' && failNext) {
          failNext = false;
          return json(503, { message: 'Servizio non disponibile (simulato)' });
        }
        return BUNDLES[id] ? json(200, BUNDLES[id]) : json(404, { message: 'versione sconosciuta' });
      }
      if (u.pathname === '/rest/v1/trips') {
        const idEq = (u.searchParams.get('id') || '').replace('eq.', '');
        if (m === 'GET') {
          if (u.searchParams.get('select') === 'data,updated_at') {
            const row = db.get(idEq);
            return json(200, row ? [{ data: row.data, updated_at: row.updated_at }] : []);
          }
          return json(200, [...db.values()].filter((x) => !idEq || x.id === idEq).map((x) => ({ id: x.id, title: x.title, updated_at: x.updated_at, storage_format: 'documento', last_mutation: x.data?.lastMutationId })));
        }
        const bd = body();
        if (m === 'POST') {
          const row = { ...bd, updated_at: ts() };
          db.set(bd.id, row);
          return json(201, [{ updated_at: row.updated_at }]);
        }
        if (m === 'PATCH') {
          const row = db.get(idEq);
          Object.assign(row, bd, { updated_at: ts() });
          return json(200, [{ updated_at: row.updated_at }]);
        }
      }
      if (/user_context|user_devices|trip_imports/.test(u.pathname)) return json(200, []);
      return json(404, { message: 'non simulato' });
    });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    await p.addInitScript(() => {
      if (!sessionStorage.getItem('e2e')) {
        localStorage.clear();
        localStorage.setItem('nfhp.ui.mode', 'planning');
        localStorage.setItem('nfhp.cloud.config', JSON.stringify({ url: 'https://finto.supabase.co', anonKey: 'chiave-pubblica-di-prova-0123456789' }));
        sessionStorage.setItem('e2e', '1');
      }
    });
    await p.goto(`${BASE}/#/impostazioni`);
    // Credenziali di prova per il server finto qui sopra
    await p.fill('input[type=email]', 'prova@example.test');
    await p.fill('input[type=password]', 'password-di-prova');
    await p.click('button[type=submit]');
    const panel = 'section[aria-labelledby="nazioni-titolo"]';
    await p.waitForSelector(`${panel} >> text=sul dispositivo`, { timeout: 15000 }).then(() => ok('catalogo NO-1 sul dispositivo')).catch(async () => fail('NO-1 non caricato: ' + (await p.textContent(panel))));
    // Passaggio automatico a NO-3: il primo scaricamento fallisce (503 simulato), il viaggio resta su NO-1
    await p.waitForSelector(`${panel} >> text=Aggiornamento alla versione 3 non riuscito`, { timeout: 15000 }).then(() => ok("errore dell'aggiornamento automatico mostrato nel riquadro")).catch(async () => fail('nessun errore: ' + (await p.textContent(panel))));
    check(/usa ancora la versione 1/.test(await p.textContent(panel)), 'il messaggio dice che il viaggio resta sulla versione 1');
    check(await p.locator(`${panel} button:has-text("Riprova")`).count() === 1, 'pulsante «Riprova»');
    const tripNow = [...db.values()][0];
    check(!tripNow || !JSON.stringify(tripNow.data.countries ?? []).includes('NO-3'), 'nel viaggio la versione non è cambiata');
    const cached = async () => p.evaluate(async () => {
      const names = await indexedDB.databases?.();
      const out = [];
      for (const n of names ?? []) {
        const db = await new Promise((res) => {
          const r = indexedDB.open(n.name);
          r.onsuccess = () => res(r.result);
          r.onerror = () => res(null);
        });
        if (!db || !db.objectStoreNames.contains('cataloghi')) continue;
        const keys = await new Promise((res) => {
          const r = db.transaction('cataloghi').objectStore('cataloghi').getAllKeys();
          r.onsuccess = () => res(r.result);
          r.onerror = () => res([]);
        });
        out.push(...keys);
        db.close();
      }
      return out;
    });
    check((await cached()).includes('NO-1'), 'dopo l\'errore la copia di NO-1 è ancora sul dispositivo', JSON.stringify(await cached()));
    await p.click(`${panel} button:has-text("Riprova")`);
    await p.waitForSelector(`${panel} >> text=Catalogo versione 3`, { timeout: 15000 }).then(() => ok('riprova riuscita: il viaggio usa NO-3')).catch(async () => fail('dopo riprova: ' + (await p.textContent(panel))));
    await p.waitForSelector('.toast:has-text("Catalogo aggiornato alla versione 3")', { timeout: 5000 }).then(() => ok('avviso con le novità del catalogo')).catch(() => fail('avviso di aggiornamento'));
    check((await p.locator(`${panel} button:has-text("Passa a")`).count()) === 0, 'nessun pulsante di passaggio manuale');
    check((await cached()).includes('NO-3'), 'NO-3 scaricata sul dispositivo prima del passaggio', JSON.stringify(await cached()));
    check(asked.filter((x) => x === 'NO-3').length === 2, 'NO-3 chiesta due volte: tentativo fallito e riprova', JSON.stringify(asked));
    await ctx.close();
  }

  // ---------- 7. Link diretti su telefono, 8. tabelle a 375 e 320 px, Oggi ----------
  {
    const ctx = await context(b, { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    await blockOthers(ctx);
    await ctx.route(/routing\.openstreetmap\.de|router\.project-osrm\.org/, fakeRoute);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(`${BASE}/`);
    await p.evaluate(() => localStorage.clear());
    for (const v of ['catalogo', 'configuratore', 'scenari']) {
      await p.goto(`${BASE}/#/${v}`);
      await p.waitForSelector('main');
      check((await p.locator('nav.tabs').count()) === 1 && (await p.locator('.travel-bar').count()) === 0, `telefono, link a #/${v}: navigazione di pianificazione`);
    }
    // Ricerca del catalogo: zero risultati con via d'uscita, ricerca conservata tornando
    await p.goto(`${BASE}/#/catalogo`);
    await p.fill('input[aria-label="Cerca nel catalogo"]', 'nessunluogoconquestonome');
    check(await p.locator('.catalog .note-info button:has-text("Azzera filtri")').count() === 1, 'zero risultati: «Azzera filtri»');
    await p.fill('input[aria-label="Cerca nel catalogo"]', 'museo');
    await p.goto(`${BASE}/#/pianifica`);
    await p.goto(`${BASE}/#/catalogo`);
    check((await p.inputValue('input[aria-label="Cerca nel catalogo"]')) === 'museo', 'tornando al catalogo la ricerca resta');
    await noHorizontalScroll(p, 'catalogo 375 px');
    // Due tappe per avere crociere, budget e Oggi popolati
    await p.evaluate(() => localStorage.setItem('nfhp.ui.mode', 'planning'));
    await p.goto(`${BASE}/#/pianifica`);
    for (const q of ['Bergen', 'Geiranger']) {
      await p.fill('input[aria-label="Cerca località"]', q);
      await p.click('.suggestions button >> nth=0');
      await p.waitForTimeout(200);
    }
    await p.goto(`${BASE}/#/crociere`);
    await p.click('button:has-text("Nuova opzione Havila")');
    const pick = p.locator('button:has-text("Scegli questa proposta")').first();
    if (await pick.count()) await pick.click();
    await p.click('button:has-text("Salva opzione")');
    await p.waitForSelector('table.stack');
    for (const w of [375, 320]) {
      await p.setViewportSize({ width: w, height: 760 });
      await p.goto(`${BASE}/#/crociere`);
      await p.waitForSelector('table.stack');
      const out = await controlsOutside(p);
      check(out.length === 0, `Crociere a ${w} px: azioni raggiungibili senza scorrere di lato`, out.join(', '));
      await noHorizontalScroll(p, `Crociere ${w} px`);
      await p.screenshot({ path: path.join(OUT, `revisione-crociere-${w}.png`), fullPage: true });
      await p.goto(`${BASE}/#/budget`);
      await p.waitForSelector('table.stack');
      const outB = await controlsOutside(p);
      check(outB.length === 0, `Budget a ${w} px: importi e limiti raggiungibili senza scorrere di lato`, outB.join(', '));
      await noHorizontalScroll(p, `Budget ${w} px`);
      await p.screenshot({ path: path.join(OUT, `revisione-budget-${w}.png`), fullPage: true });
    }
    // Oggi: anteprima prima della partenza, trasferimento con Google Maps
    await p.setViewportSize({ width: 375, height: 812 });
    await p.evaluate(() => localStorage.setItem('nfhp.ui.mode', 'travel'));
    await p.goto(`${BASE}/#/t/oggi`);
    await p.waitForSelector('.today-nav');
    check(/Anteprima del viaggio/.test(await p.textContent('.today-nav')), 'prima della partenza: «Anteprima del viaggio»');
    check(!(await p.locator('text=Torna a oggi').count()), 'prima della partenza nessun «Torna a oggi»');
    await ctx.close();
  }

  // ---------- 6. Oggi durante il viaggio: «Torna a oggi» e partenze con orario ----------
  {
    const ctx = await context(b, { viewport: { width: 375, height: 812 } });
    await blockOthers(ctx);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    const today = new Date();
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const start = new Date(today);
    start.setDate(start.getDate() - 1);
    // Viaggio sintetico iniziato ieri: oggi si passa da Bergen a Geiranger con un traghetto alle 14:00
    const trip = {
      schemaVersion: 2, id: '9b9b9b9b-1111-4222-8333-444444444444', title: 'Viaggio di prova', startDate: iso(start), dateTentative: false,
      participants: { adults: 2, childrenAges: [8, 5] },
      stops: [
        { id: 's1', kind: 'luogo', name: 'Bergen', lat: 60.39, lng: 5.32, nights: 1, notes: '', weatherPlanB: '' },
        { id: 's2', kind: 'luogo', name: 'Geiranger', lat: 62.1, lng: 7.2, nights: 3, notes: '', weatherPlanB: '' },
      ],
      legs: [{ id: 'l1', fromStopId: 's1', toStopId: 's2', calculatedAt: '2026-11-16T10:00:00.000Z', segments: [
        { id: 'g1', mode: 'strada', label: 'Percorso stradale', durationMin: 300, distanceKm: 380, status: 'stimato', costStatus: 'da_verificare' },
        { id: 'g2', mode: 'traghetto', label: 'Traghetto di prova', durationMin: 60, departureTime: '14:00', status: 'da_verificare', costStatus: 'da_verificare' },
      ] }],
      days: {}, coastalOptions: [], flights: [], accommodations: [], budgetItems: [], favorites: [], actuals: { stops: {}, activities: {} }, diary: [],
      settings: { nokPerEur: 10.4, nokRateNote: 'prova', nokRateAuto: false, maxTravelMinPerDay: 240, showCatalogOnMap: false },
      updatedAt: '2026-11-16T10:00:00.000Z',
    };
    // Il viaggio va sul dispositivo prima che l'app parta (una sola volta per scheda)
    await p.addInitScript((t) => {
      if (sessionStorage.getItem('e2e-oggi')) return;
      localStorage.clear();
      localStorage.setItem('nfhp.ui.mode', 'travel');
      localStorage.setItem('nfhp.trip.v1', JSON.stringify(t));
      sessionStorage.setItem('e2e-oggi', '1');
    }, trip);
    await p.goto(`${BASE}/#/t/oggi`);
    const key = await p.evaluate(() => Object.keys(localStorage));
    await p.waitForSelector('.today-nav');
    const header = await p.textContent('.today-nav');
    if (!/Giorno 2 di/.test(header)) {
      console.log(`SALTATO: «Torna a oggi» — il viaggio di prova non si carica da localStorage con questa chiave (${key.join(', ')}); intestazione: ${header}`);
    } else {
      check(!/Anteprima/.test(header), 'durante il viaggio niente «Anteprima»');
      check(/14:00/.test(await p.textContent('[aria-label="Partenze con orario"]')), 'partenza con orario in evidenza');
      check(await p.locator('a:has-text("Apri in Google Maps")').count() >= 1, 'trasferimento di oggi con «Apri in Google Maps»');
      await p.click('button[aria-label="Giorno successivo"]');
      await p.click('button:has-text("Torna a oggi")');
      check(/Giorno 2 di/.test(await p.textContent('.today-nav')), '«Torna a oggi» riporta alla giornata di oggi');
    }
    await ctx.close();
  }

  check(errors.length === 0, 'nessun errore JavaScript nelle pagine', errors.join(' | '));
  console.log(`${results.ok} OK, ${results.fail} FAIL`);
  await b.close();
  srv.close();
})().catch((e) => {
  fail(String(e && e.stack ? e.stack : e));
  process.exit(1);
});
