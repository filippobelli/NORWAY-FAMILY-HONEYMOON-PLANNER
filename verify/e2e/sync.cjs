// Sincronizzazione con un server Supabase FINTO, interamente simulato nel browser: nessun account e nessun dato reale.
// Uso: npm run build && node verify/e2e/sync.cjs
const { serve, launch, context, ok, fail } = require('./serve.cjs');
const srv = serve(4175);
// Server Supabase finto
const db = new Map(); let clock = 1000; const ts = () => `2026-10-27T12:${String(clock++ % 60).padStart(2,'0')}:00.000000+00:00`;
let patchCount = 0, postCount = 0;
(async () => {
  const b = await launch(); const ctx = await context(b, { viewport: { width: 1300, height: 900 } }); const p = await ctx.newPage();
  await p.addInitScript(() => { if (!sessionStorage.getItem('e2e')) { localStorage.clear(); localStorage.setItem('nfhp.ui.mode', 'planning'); sessionStorage.setItem('e2e', '1'); } });
  p.on('pageerror', (e) => fail('pageerror ' + e.message));
  // Test ermetico: ogni rete esterna è bloccata (cambio Norges Bank/BCE, carburante SSB, meteo, mappe, Wikipedia…);
  // passano solo la pagina locale e il Supabase finto qui sotto
  await p.route((u) => u.hostname !== 'localhost' && !u.hostname.endsWith('supabase.co'), (r) => r.abort());
  await p.route(/supabase\.co\//, async (r) => {
    const req = r.request(); const u = new URL(req.url()); const m = req.method();
    const json = (status, body) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (u.pathname === '/auth/v1/token') return json(200, { access_token: 'tok', refresh_token: 'ref', expires_in: 3600, user: { id: 'u1', email: 'f@x.it' } });
    if (u.pathname !== '/rest/v1/trips') return json(404, {});
    const idEq = u.searchParams.get('id')?.replace('eq.', '');
    if (m === 'GET') {
      if (u.searchParams.get('select') === 'data,updated_at') { const row = db.get(idEq); return json(200, row ? [{ data: row.data, updated_at: row.updated_at }] : []); }
      const rows = [...db.values()].filter((x) => !idEq || x.id === idEq).map((x) => ({ id: x.id, title: x.title, updated_at: x.updated_at }));
      return json(200, rows);
    }
    const body = JSON.parse(req.postData());
    if (m === 'POST') { postCount++; if (db.has(body.id)) return json(409, { message: 'duplicate' }); const row = { ...body, updated_at: ts() }; db.set(body.id, row); return json(201, [{ updated_at: row.updated_at }]); }
    if (m === 'PATCH') { patchCount++; const row = db.get(idEq); const cond = u.searchParams.get('updated_at')?.replace('eq.', '');
      if (!row || row.updated_at !== cond) return json(200, []); Object.assign(row, body, { updated_at: ts() }); return json(200, [{ updated_at: row.updated_at }]); }
    return json(405, {});
  });
  const label = () => p.textContent('.save-state');
  await p.goto('http://localhost:4175/#/viaggio'); await p.waitForSelector('text=Backup su file');
  /cloud non collegato/.test(await label()) ? ok('prima dell\'accesso: ' + await label()) : fail('label ' + await label());
  await p.fill('input[type=email]', 'f@x.it'); await p.fill('input[type=password]', 'segreta123'); await p.click('button[type=submit]');
  await p.waitForFunction(() => /Sincronizzato/.test(document.querySelector('.save-state').textContent), null, { timeout: 8000 }).then(() => ok('dopo accesso: viaggio caricato nel cloud')).catch(async () => fail('dopo accesso ' + await label()));
  // Un viaggio vuoto non si carica: nulla da salvare finché non c'è una modifica
  db.size === 0 ? ok('viaggio vuoto: nessun caricamento inutile') : fail('db ' + db.size);

  // Modifica → salvataggio automatico
  await p.goto('http://localhost:4175/#/pianifica');
  await p.fill('input[aria-label="Cerca località"]', 'Bergen'); await p.click('.suggestions button >> nth=0');
  await p.waitForTimeout(500); /invio al cloud/.test(await label()) ? ok('in attesa: ' + await label()) : fail('attesa ' + await label());
  await p.waitForFunction(() => /Sincronizzato/.test(document.querySelector('.save-state').textContent), null, { timeout: 8000 });
  db.size === 1 ? ok('1 viaggio nel cloud dopo la prima modifica (POST)') : fail('db ' + db.size);
  const id = [...db.keys()][0];
  db.get(id).data.stops.length === 1 ? ok('modifica salvata in automatico (PATCH condizionato)') : fail('stops ' + db.get(id).data.stops.length);

  // Modifica da un altro dispositivo → ritorno in primo piano
  const other = JSON.parse(JSON.stringify(db.get(id).data)); other.stops.push({ ...other.stops[0], id: 'altro', name: 'Ålesund' });
  Object.assign(db.get(id), { data: other, updated_at: ts() });
  await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForSelector('text=Ålesund', { timeout: 5000 }).then(() => ok('modifiche dell\'altro dispositivo scaricate')).catch(() => fail('pull'));

  // Conflitto: lo stesso dato (il piano) cambia nel cloud e qui prima della sincronizzazione.
  // Modifiche indipendenti (es. solo il titolo) si uniscono da sole e non sono un conflitto.
  const other2 = JSON.parse(JSON.stringify(db.get(id).data)); other2.title = 'Titolo da altro device'; other2.stops[0].nights = 5;
  Object.assign(db.get(id), { data: other2, updated_at: ts() });
  const morePlus = async () => { if (!(await p.locator('.ol-detail [aria-label="Una notte in più"]').count())) await p.click('.ol-item.ol-stop >> nth=0'); await p.click('.ol-detail [aria-label="Una notte in più"]'); };
  await morePlus();
  await p.waitForSelector('.conflict', { timeout: 8000 }).then(() => ok('conflitto rilevato, nessuna sovrascrittura')).catch(() => fail('conflitto'));
  db.get(id).data.stops[0].nights === 5 ? ok('cloud non sovrascritto') : fail('sovrascritto!');
  await p.click('.conflict button:has-text("Confronta e scegli")');
  await p.click('dialog[open] button:has-text("Tutto da questo dispositivo")');
  await p.click('dialog[open] button:has-text("Applica le scelte")');
  await p.waitForFunction(() => /Sincronizzato/.test(document.querySelector('.save-state').textContent), null, { timeout: 8000 }).then(() => ok('scelta «questo dispositivo» salvata')).catch(async () => fail('keep ' + await label()));
  db.get(id).data.stops[0].nights === 2 ? ok('cloud aggiornato con la versione locale') : fail('nights');

  // Offline
  await p.route(/supabase\.co\/rest\//, (r) => r.abort());
  await morePlus();
  await p.waitForFunction(() => /Senza rete|Cloud non raggiunto/.test(document.querySelector('.save-state').textContent), null, { timeout: 8000 }).then(() => ok('offline segnalato, dati locali salvi')).catch(async () => fail('offline ' + await label()));
  // Ricarica: sessione e dirty persistono → al ritorno online salva
  await p.unroute(/supabase\.co\/rest\//);
  await p.reload(); await p.waitForFunction(() => /Sincronizzato/.test(document.querySelector('.save-state').textContent), null, { timeout: 10000 }).then(() => ok('dopo ricarica: modifiche pendenti inviate')).catch(async () => fail('reload ' + await label()));
  db.get(id).data.stops[0].nights === 3 ? ok('modifica fatta offline arrivata nel cloud') : fail('offline nights ' + db.get(id).data.stops[0].nights);
  // Logout e nuovo accesso dopo una modifica fatta altrove: deve scaricarla, senza falso conflitto
  await p.goto('http://localhost:4175/#/impostazioni'); await p.click('button.link-btn:has-text("esci")');
  const confirmOut = p.locator('dialog[open] button:has-text("Esci")').last();
  if (await confirmOut.isDisabled()) await p.locator('dialog[open] input[type=checkbox]').first().check();
  await confirmOut.click();
  const other3 = JSON.parse(JSON.stringify(db.get(id).data)); other3.title = 'Rinominato altrove';
  Object.assign(db.get(id), { data: other3, updated_at: ts() });
  await p.fill('input[type=email]', 'f@x.it'); await p.fill('input[type=password]', 'segreta123'); await p.click('button[type=submit]');
  await p.waitForFunction(() => /Rinominato altrove/.test(document.querySelector('.brand h1').textContent), null, { timeout: 8000 })
    .then(() => ok('nuovo accesso: modifiche altrove scaricate senza falso conflitto')).catch(async () => fail('relogin: ' + (await p.locator('.conflict').count() ? 'conflitto falso' : await label())));
  (await p.locator('.conflict').count()) === 0 ? ok('nessun banner di conflitto') : fail('banner conflitto presente');
  console.log('richieste: POST', postCount, 'PATCH', patchCount);
  await b.close(); srv.close();
})().catch((e) => { console.error(e); srv.close(); process.exit(1); });
