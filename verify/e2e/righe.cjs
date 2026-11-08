// Viaggio per righe con un server Supabase FINTO, simulato nel browser: nessun account e nessun dato reale.
// Regole del server come public.sync_push / public.sync_pull (supabase/migrations/20261106000400_sincronizzazione.sql):
// lotto tutto-o-niente, rev per riga, seq per viaggio, registro degli invii, tombstone; i viaggi «documento» non
// ricevono timbri finché non passano a «righe».
// Uso: VITE_PASSAGGIO_RIGHE=pulsante npm run build && node verify/e2e/righe.cjs
// (il pulsante di conversione compare solo con quella variabile; con la build normale lo script controlla che manchi)
const { serve, launch, context, ok, fail, check, results } = require('./serve.cjs');
const srv = serve(4176);
const BASE = 'http://localhost:4176';

const TRIP = '7a7a7a7a-1111-4222-8333-444444444444';
const VERSION = 'v-principale';
const doc = {
  schemaVersion: 2, id: TRIP, title: 'Viaggio di prova', startDate: '2027-08-01', dateTentative: false,
  participants: { adults: 2, childrenAges: [8, 5] },
  stops: [{ id: 's1', kind: 'luogo', destinationId: 'oslo', name: 'Oslo', lat: 59.913, lng: 10.752, nights: 2, notes: '', weatherPlanB: '' }],
  legs: [], days: { 's1#1': { activities: [{ id: 'a1', title: 'Museo Fram', destinationId: 'fram', costStatus: 'da_verificare' }], notes: 'prova', planB: '' } },
  coastalOptions: [], flights: [], accommodations: [], budgetItems: [], favorites: ['oslo'],
  actuals: { stops: {}, activities: {} }, diary: [],
  settings: { nokPerEur: 10.4, nokRateNote: 'Norges Bank', nokRateDate: '2026-11-04', nokRateAuto: false, maxTravelMinPerDay: 240, showCatalogOnMap: true, car: { fuel: 'benzina', consumption: 7, priceAuto: false } },
  scenarios: [{ id: VERSION, name: 'Scenario principale', kind: 'altro', notes: '', updatedAt: '2026-11-01T00:00:00.000Z' }],
  activeScenarioId: VERSION, updatedAt: '2026-11-05T10:00:00.000Z', lastMutationId: '11111111-0000-4000-8000-000000000000',
};

// ---------- Server finto ----------
const KEYS = {
  trips: ['id'], trip_countries: ['trip_id', 'country_code'], trip_rates: ['trip_id', 'currency'], trip_versions: ['trip_id', 'id'],
  stops: ['trip_id', 'version_id', 'id'], stop_ideas: ['trip_id', 'version_id', 'stop_id', 'place_key'], legs: ['trip_id', 'version_id', 'id'],
  segments: ['trip_id', 'version_id', 'id'], days: ['trip_id', 'version_id', 'day_key'], activities: ['trip_id', 'version_id', 'id'],
  budget_items: ['trip_id', 'version_id', 'id'], flights: ['trip_id', 'version_id', 'id'], accommodations: ['trip_id', 'id'],
  coastal_options: ['trip_id', 'id'], favorites: ['trip_id', 'place_key'], diary_entries: ['trip_id', 'id'], diary_attachments: ['trip_id', 'id'],
  visit_states: ['trip_id', 'target_kind', 'target_id'], plan_log: ['trip_id', 'id'],
};
const ORDER = Object.keys(KEYS);
const SYSTEM = ['rev', 'seq', 'created_at', 'updated_at', 'updated_by', 'owner_id', 'data', 'last_mutation_id', 'device_id'];
const rows = new Map(); // chiave → { table, row }
const mutations = new Map();
let seq = 0;
let pushes = 0;
let docPosts = 0;
const imports = [];
let clock = 0;
const now = () => `2026-11-07T10:${String(clock++ % 60).padStart(2, '0')}:00.000000+00:00`;
const key = (t, r) => `${t}|${KEYS[t].map((k) => String(r[k])).join('|')}`;
rows.set(key('trips', { id: TRIP }), { table: 'trips', row: { id: TRIP, title: doc.title, data: doc, storage_format: 'documento', rev: 1, seq: 0, updated_at: now(), schema_version: 2 } });

function syncPush({ p_trip_id: trip, p_mutation_id: mid, p_changes: changes, p_attempted: attempted = [], p_device_id: device }) {
  pushes++;
  const prev = mutations.get(mid);
  if (prev) return { ...prev, stato: 'gia_applicato' };
  const sorted = [...changes].sort((a, b) => ORDER.indexOf(a.table) - ORDER.indexOf(b.table));
  const conflitti = [];
  const prepared = sorted.map((c) => {
    const row = { ...c.row, ...(c.table === 'trips' ? { id: trip } : { trip_id: trip }) };
    for (const s of SYSTEM) delete row[s];
    const k = key(c.table, row);
    const cur = rows.get(k);
    const kk = Object.fromEntries(KEYS[c.table].map((x) => [x, row[x]]));
    if (!cur) { if (c.base_rev !== null && c.base_rev !== undefined) conflitti.push({ table: c.table, key: kk, tipo: 'assente', server: null }); }
    else if (c.base_rev !== cur.row.rev && !(cur.row.last_mutation_id && attempted.includes(cur.row.last_mutation_id))) conflitti.push({ table: c.table, key: kk, tipo: 'cambiata', server: cur.row });
    return { c, row, k, kk, cur };
  });
  if (conflitti.length) return { stato: 'conflitto', conflitti, seq };
  const righe = [];
  for (const { c, row, k, kk, cur } of prepared) {
    if (c.op === 'delete') {
      if (!cur) continue;
      cur.row = { ...cur.row, deleted_at: now(), rev: cur.row.rev + 1, seq: ++seq, last_mutation_id: mid, device_id: device };
      righe.push({ table: c.table, key: kk, rev: cur.row.rev });
      continue;
    }
    const merged = { ...(cur ? cur.row : {}), ...row };
    let rev = cur ? cur.row.rev + 1 : 1;
    let s;
    if (c.table === 'trips') {
      if (!cur) Object.assign(merged, { storage_format: 'righe', data: { schemaVersion: 3, formato: 'righe' } });
      if (merged.storage_format !== 'righe') { rev = cur ? cur.row.rev : 1; s = cur ? cur.row.seq : 0; }
      else if (cur && cur.row.storage_format !== 'righe') rev = cur.row.rev;
      merged.updated_at = now();
    }
    const next = { ...merged, deleted_at: null, rev, seq: s ?? ++seq, last_mutation_id: mid, device_id: device };
    rows.set(k, { table: c.table, row: next });
    righe.push({ table: c.table, key: kk, rev });
  }
  const result = { stato: 'applicato', righe, seq };
  mutations.set(mid, result);
  return result;
}
function syncPull({ p_trip_id: trip, p_since: since }) {
  const righe = {};
  for (const { table, row } of rows.values()) {
    const t = table === 'trips' ? row.id : row.trip_id;
    if (t !== trip || row.seq <= since) continue;
    const out = { ...row };
    if (table === 'trips') delete out.data;
    (righe[table] ??= []).push(out);
  }
  return { seq, righe };
}
/** Attende una condizione sul server finto (l'invio parte dopo un attimo) */
async function until(fn, ms = 10000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (fn()) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return fn();
}
const count = (t) => [...rows.values()].filter((e) => e.table === t && !e.row.deleted_at).length;
const tripRow = () => rows.get(key('trips', { id: TRIP })).row;

(async () => {
  const b = await launch();
  const ctx = await context(b, { viewport: { width: 1300, height: 900 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    if (!sessionStorage.getItem('e2e')) {
      localStorage.clear();
      localStorage.setItem('nfhp.ui.mode', 'planning');
      localStorage.setItem('nfhp.cloud.config', JSON.stringify({ url: 'https://finto.supabase.co', anonKey: 'chiave-pubblica-di-prova-0123456789' }));
      sessionStorage.setItem('e2e', '1');
    }
  });
  p.on('pageerror', (e) => fail('pageerror ' + e.message));
  // Test ermetico: ogni rete esterna è bloccata (cambio Norges Bank/BCE, carburante SSB, meteo, mappe, Wikipedia…);
  // passano solo la pagina locale e il Supabase finto qui sotto
  await p.route((u) => u.hostname !== 'localhost' && !u.hostname.endsWith('supabase.co'), (r) => r.abort());
  await p.route(/supabase\.co\//, async (r) => {
    const req = r.request(); const u = new URL(req.url()); const m = req.method();
    const json = (status, body) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    const body = () => { try { return JSON.parse(req.postData() || 'null'); } catch { return null; } };
    if (u.pathname === '/auth/v1/token') return json(200, { access_token: 'tok', refresh_token: 'ref', expires_in: 3600, user: { id: 'u1', email: 'f@x.it' } });
    if (u.pathname === '/rest/v1/rpc/sync_push') return json(200, syncPush(body()));
    if (u.pathname === '/rest/v1/rpc/sync_pull') return json(200, syncPull(body()));
    if (u.pathname === '/rest/v1/trip_imports') { imports.push(body()); return json(201, null); }
    if (u.pathname === '/rest/v1/user_context' || u.pathname === '/rest/v1/user_devices') return json(200, []);
    if (u.pathname === '/rest/v1/catalog_releases') return json(200, [
      { release_id: 'NO-1', country_code: 'NO', version: 1, published_at: '2026-11-06T00:00:00+00:00', countries: { name: 'Norvegia', currency: 'NOK', timezone: 'Europe/Oslo' } },
      { release_id: 'XT-1', country_code: 'XT', version: 1, published_at: '2026-11-06T00:00:00+00:00', countries: { name: 'Nazione di prova', currency: 'XTS', timezone: 'Europe/Stockholm' } },
    ]);
    if (u.pathname === '/rest/v1/trips') {
      const sel = u.searchParams.get('select') || '';
      const idEq = (u.searchParams.get('id') || '').replace('eq.', '');
      const list = [...rows.values()].filter((e) => e.table === 'trips' && (!idEq || e.row.id === idEq)).map((e) => e.row);
      if (m === 'GET') {
        if (sel === 'data,updated_at') return json(200, list.map((x) => ({ data: x.data, updated_at: x.updated_at })));
        if (sel.includes('last_mutation')) return json(200, list.map((x) => ({ id: x.id, title: x.title, updated_at: x.updated_at, storage_format: x.storage_format, last_mutation: x.data?.lastMutationId })));
        if (sel.startsWith('data,storage_format,rev')) return json(200, list.map((x) => { const o = {}; for (const c of sel.split(',')) o[c] = x[c] ?? null; o.extra = x.extra ?? {}; return o; }));
        return json(200, list.map((x) => ({ id: x.id, title: x.title, updated_at: x.updated_at, storage_format: x.storage_format })));
      }
      if (m === 'POST') {
        // App di oggi: viaggio nuovo salvato come documento
        const bd = body();
        if (rows.has(key('trips', { id: bd.id }))) return json(409, { message: 'duplicate' });
        const row = { id: bd.id, title: bd.title, data: bd.data, schema_version: bd.schema_version, storage_format: 'documento', rev: 1, seq: 0, updated_at: now() };
        rows.set(key('trips', { id: bd.id }), { table: 'trips', row });
        docPosts++;
        return json(201, [{ updated_at: row.updated_at }]);
      }
      if (m === 'PATCH') {
        // App di oggi: salvataggio del documento, rifiutato sui viaggi a righe (come trips_guard)
        const row = list[0];
        if (row?.storage_format === 'righe') return json(400, { message: 'Questo viaggio usa il nuovo formato' });
        const bd = body(); Object.assign(row, { data: bd.data, title: bd.title, updated_at: now() });
        return json(200, [{ updated_at: row.updated_at }]);
      }
      return json(405, {});
    }
    return json(404, { message: 'non simulato' });
  });

  const label = () => p.textContent('.save-state');
  const synced = (ms = 10000) => p.waitForFunction(() => /Sincronizzato/.test(document.querySelector('.save-state')?.textContent ?? ''), null, { timeout: ms });

  // 1. Accesso: il viaggio (formato documento) arriva dal cloud
  await p.goto(`${BASE}/#/impostazioni`);
  await p.fill('input[type=email]', 'f@x.it'); await p.fill('input[type=password]', 'segreta123'); await p.click('button[type=submit]');
  await p.waitForFunction(() => /Viaggio di prova/.test(document.querySelector('.brand h1')?.textContent ?? ''), null, { timeout: 10000 })
    .then(() => ok('viaggio del cloud aperto (formato documento)')).catch(async () => fail('apertura: ' + await label()));

  // 2. Conversione al formato a righe, con conferma esplicita
  const convert = p.locator('button:has-text("Converti il viaggio al nuovo formato")');
  if (!(await convert.count())) {
    ok('build senza VITE_PASSAGGIO_RIGHE: nessun pulsante di conversione (review B1)');
    check(tripRow().storage_format === 'documento', 'nessuna conversione possibile');
    // Viaggio nuovo senza la variabile: formato documento di sempre, anche con il cloud collegato (terzo giro)
    p.on('dialog', (d) => void d.accept());
    const pushesBefore = pushes;
    await p.click('button:has-text("Nuovo viaggio vuoto")');
    await p.waitForSelector('text=In quale nazione viaggiate?', { timeout: 8000 }).then(() => ok('viaggio nuovo: scelta della nazione')).catch(() => fail('scelta nazione assente'));
    await p.click('label.ov-start-card:has-text("Norvegia")');
    await p.click('button:has-text("Continua con Norvegia")');
    const others = () => [...rows.values()].filter((e) => e.table === 'trips' && e.row.id !== TRIP).map((e) => e.row);
    check(await until(() => others().length === 1), 'viaggio nuovo salvato nel cloud', String(others().length));
    check(others()[0]?.storage_format === 'documento' && others()[0]?.data?.countries?.[0]?.code === 'NO', 'viaggio nuovo nel formato documento, con la nazione nel documento', JSON.stringify(others().map((x) => x.storage_format)));
    check(pushes === pushesBefore && docPosts === 1, 'nessun sync_push: salvataggio del documento di oggi', `sync_push ${pushes - pushesBefore}, POST ${docPosts}`);
    check(JSON.stringify(tripRow().data) === JSON.stringify(doc), "il viaggio precedente resta nel cloud com'era (data)");
    console.log('SALTATO: conversione, sincronizzazione per riga e nazioni vogliono la build con VITE_PASSAGGIO_RIGHE=pulsante');
    console.log(`${results.ok} OK, ${results.fail} FAIL`);
    await b.close(); srv.close(); return;
  }
  await convert.click();
  await p.waitForSelector('dialog[open] >> text=Convertire il viaggio al nuovo formato?');
  const warn = await p.textContent('dialog[open]');
  check(/non potrà più salvare/.test(warn) && /ritorno automatico/.test(warn), 'la conferma spiega le conseguenze');
  check(await p.locator('dialog[open] button:has-text("Esporta un backup")').count() === 1, 'backup proposto nella conferma');
  check(tripRow().storage_format === 'documento', 'nessuna conversione prima della conferma');
  await p.click('dialog[open] button:has-text("Converti il viaggio")');
  await p.waitForSelector('text=✓ nuovo formato', { timeout: 15000 }).then(() => ok('conversione completata e verificata')).catch(async () => fail('conversione: ' + (await p.textContent('#formato-titolo')) + ' ' + (await p.locator('[role=alert]').allTextContents()).join(' | ')));
  check(tripRow().storage_format === 'righe', 'formato «righe» nel cloud');
  check(JSON.stringify(tripRow().data) === JSON.stringify(doc), 'la colonna data resta com\'era');
  check(count('stops') === 1 && count('activities') === 1 && count('favorites') === 1 && count('trip_countries') === 1, 'righe create', JSON.stringify({ stops: count('stops'), act: count('activities') }));
  check(imports.some((x) => x.status === 'verificata'), 'trip_imports: verificata');
  const pushesAfterImport = pushes;

  // 3. Modifica qui → invio per righe
  await p.goto(`${BASE}/#/pianifica`);
  await p.fill('input[aria-label="Cerca località"]', 'Bergen'); await p.click('.suggestions button >> nth=0');
  await synced().then(() => ok('modifica inviata per righe')).catch(async () => fail('invio: ' + await label()));
  check(count('stops') === 2, 'tappa nuova nel cloud', String(count('stops')));
  check(pushes > pushesAfterImport, 'invio con sync_push');

  // 4. Modifica da un altro dispositivo (titolo) → ritorno in primo piano
  const tr = tripRow(); Object.assign(tr, { title: 'Titolo da altro dispositivo', rev: tr.rev + 1, seq: ++seq, last_mutation_id: 'altro' });
  await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForFunction(() => /Titolo da altro dispositivo/.test(document.querySelector('.brand h1')?.textContent ?? ''), null, { timeout: 10000 })
    .then(() => ok('modifica dell\'altro dispositivo ricevuta con sync_pull')).catch(async () => fail('pull: ' + await label()));

  // 5. Stessa tappa cambiata sui due lati → conflitto per riga
  for (const e of rows.values()) if (e.table === 'stops' && e.row.id === 's1') Object.assign(e.row, { nights: 5, rev: e.row.rev + 1, seq: ++seq, last_mutation_id: 'altro' });
  await p.goto(`${BASE}/#/pianifica`);
  // La tappa Oslo (quella cambiata nel cloud), non quella aggiunta prima
  await p.click('.ol-item.ol-stop:has-text("Oslo")');
  await p.waitForSelector('.ol-detail [aria-label="Una notte in più"]');
  const heading = await p.locator('.ol-detail').first().textContent();
  if (!/Oslo/.test(heading ?? '')) fail(`dettaglio aperto su un'altra tappa: ${(heading ?? '').slice(0, 60)}`);
  await p.click('.ol-detail [aria-label="Una notte in più"]');
  await p.waitForSelector('.conflict', { timeout: 10000 }).then(() => ok('conflitto sulla stessa tappa: nessuna sovrascrittura')).catch(async () => fail('conflitto: ' + await label()));
  const s1 = () => [...rows.values()].find((e) => e.table === 'stops' && e.row.id === 's1').row;
  check(s1().nights === 5, 'cloud non sovrascritto prima della scelta');
  await p.click('.conflict button:has-text("Confronta e scegli")');
  const items = await p.locator('dialog[open] li, dialog[open] fieldset').allTextContents();
  check(items.some((t) => /Tappa Oslo/.test(t)), 'conflitto mostrato per riga («Tappa Oslo»)', items.join(' | ').slice(0, 200));
  await p.click('dialog[open] button:has-text("Tutto da questo dispositivo")');
  await p.click('dialog[open] button:has-text("Applica le scelte")');
  await synced().then(() => ok('scelta «questo dispositivo» inviata')).catch(async () => fail('dopo scelta: ' + await label()));
  check(s1().nights === 3, 'cloud aggiornato con la scelta', String(s1().nights));

  // 6. Ricarica: nessun doppione, niente da inviare
  const before = pushes;
  const stopsBefore = count('stops');
  await p.reload();
  await synced().then(() => ok('dopo la ricarica: sincronizzato')).catch(async () => fail('ricarica: ' + await label()));
  check(count('stops') === stopsBefore, 'nessun doppione dopo la ricarica');
  check(pushes === before, 'nessun invio inutile dopo la ricarica', `${pushes - before} invii`);

  // 7. Nazioni del viaggio: riquadro, dialogo, aggiunta e rimozione con conferma
  await p.goto(`${BASE}/#/impostazioni`);
  await p.waitForSelector('#nazioni-titolo');
  check(/Norvegia|NO/.test(await p.textContent('section[aria-labelledby="nazioni-titolo"]')), 'riquadro «Nazioni e cataloghi» con la Norvegia');
  await p.click('section[aria-labelledby="nazioni-titolo"] button:has-text("Gestisci le nazioni")');
  await p.waitForSelector('dialog[open] >> text=Nazioni del viaggio');
  check(await p.locator('dialog[open] >> text=unica nazione del viaggio').count() === 1, "l'unica nazione non si può togliere");
  await p.waitForSelector('dialog[open] label:has-text("Nazione di prova")', { timeout: 8000 }).then(() => ok('nazioni disponibili elencate')).catch(() => fail('nazioni disponibili'));
  await p.click('dialog[open] label:has-text("Nazione di prova")');
  await p.click('dialog[open] button:has-text("Aggiungi e scarica il catalogo")');
  check(await until(() => count('trip_countries') === 2), 'seconda nazione nel cloud (trip_countries)', String(count('trip_countries')));
  await p.click('dialog[open] button[aria-label="Togli Nazione di prova dal viaggio"], dialog[open] button[aria-label="Togli XT dal viaggio"]');
  await p.waitForSelector('dialog[open] >> text=Nessun elemento del viaggio usa questa nazione');
  await p.click('dialog[open] button:has-text("Togli la nazione")');
  check(await until(() => count('trip_countries') === 1), 'nel cloud resta una nazione (cancellazione come tombstone)', String(count('trip_countries')));

  // 8. Viaggio nuovo: prima si sceglie la nazione
  p.on('dialog', (d) => void d.accept());
  await p.goto(`${BASE}/#/impostazioni`);
  await p.click('button:has-text("Nuovo viaggio vuoto")');
  await p.waitForSelector('text=In quale nazione viaggiate?', { timeout: 8000 }).then(() => ok('viaggio nuovo: scelta della nazione')).catch(() => fail('scelta nazione assente'));
  check(await p.locator('button:has-text("Scegli una nazione")').isDisabled(), 'più nazioni: nessuna scelta predefinita');
  await p.click('label.ov-start-card:has-text("Norvegia")');
  await p.click('button:has-text("Continua con Norvegia")');
  await p.waitForSelector('text=Da dove vuoi cominciare?', { timeout: 8000 }).then(() => ok('dopo la scelta: le due schede di sempre')).catch(() => fail('dopo la scelta'));
  check(/Nazioni: Norvegia/.test(await p.textContent('.ov-sub >> nth=1').catch(() => '') ?? ''), 'riga «Nazioni» nella Panoramica');
  // Con il cloud collegato il viaggio nuovo nasce nel formato a righe, con la sua nazione
  const fresh = () => [...rows.values()].filter((e) => e.table === 'trips' && e.row.id !== TRIP).map((e) => e.row);
  check(await until(() => fresh().length === 1 && fresh()[0].storage_format === 'righe'), 'viaggio nuovo creato nel formato a righe', JSON.stringify(fresh().map((x) => x.storage_format)));
  check(await until(() => [...rows.values()].some((e) => e.table === 'trip_countries' && e.row.trip_id === fresh()[0]?.id && e.row.country_code === 'NO')), 'nazione del viaggio nuovo nel cloud (trip_countries)');
  check(JSON.stringify(tripRow().data) === JSON.stringify(doc), "il viaggio precedente resta nel cloud com'era (data)");
  await p.setViewportSize({ width: 375, height: 800 });
  await p.goto(`${BASE}/#/impostazioni`);
  const wide = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(!wide, 'Impostazioni a 375 px senza scorrimento orizzontale');

  console.log(`${results.ok} OK, ${results.fail} FAIL · invii sync_push: ${pushes}`);
  await b.close(); srv.close();
})().catch((e) => { console.error(e); srv.close(); process.exit(1); });
