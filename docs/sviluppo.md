# Sviluppo · Tutti i dati nel database, catalogo per nazione

Data: 2026-11-07, secondo giro 2026-11-08 (dopo `docs/review.md`), terzo giro 2026-11-08 · Agente sviluppatore · Ramo `feature/database-multinazione` (nessun commit: li fa Filippo)
Riferimenti: `docs/piano-2026-11-06-database.md`, `docs/spec.md`, `docs/design.md`, `docs/architettura.md` (vincolante).

Nessuna migrazione applicata e nessuno schema modificato. Sul progetto `norway-planner` (banco di prova approvato da
Filippo il 2026-11-06) solo letture e prove dentro blocchi annullati. La riga reale di `public.trips` non è stata
toccata (md5 di `data` invariato: `f4f3130ae0402fdfb5c8d89c6dd3623d`).

## Terzo giro (2026-11-08): viaggi nuovi legati alla stessa impostazione

Decisione di Filippo: anche la creazione di un viaggio nuovo nel formato a righe dipende da `VITE_PASSAGGIO_RIGHE`.
- `newTripInRows(cloudOn, mode)` (`src/state/conversionMode.ts`): vero solo con il cloud collegato **e** la variabile a
  `pulsante` o `auto`. «Nuovo viaggio vuoto» (Impostazioni, l'unico punto che crea un viaggio a righe) la usa.
- Senza la variabile ogni viaggio nuovo nasce nel formato documento di oggi, anche con il cloud collegato (salvataggio
  con il flusso di sempre, nessun `sync_push`). Con la variabile resta il comportamento del secondo giro.
- Test: `newTripInRows` (5 casi). `verify/e2e/righe.cjs`: con la build normale crea un viaggio nuovo e controlla che sia
  salvato come documento (POST di oggi, nessun `sync_push`, nazione nel documento, viaggio precedente intatto); con la
  build `VITE_PASSAGGIO_RIGHE=pulsante` controlla che nasca a righe con `trip_countries`.
- `README.md` e `.env.example` aggiornati.

Esiti: `typecheck` ok · `lint` ok · `npm test` 224/224 · `build` ok · `e2e.cjs` 60 OK · `planning.cjs` 16 OK ·
`sync.cjs` 16 OK per 5 volte · `a11y.cjs` 34 OK · `cosafare.cjs` 30 OK · `righe.cjs` 8 OK (build normale) e 34 OK
(build con `pulsante`). `dist/` finale ricostruita **senza** la variabile.

## Secondo giro (2026-11-08): correzioni della revisione

| Punto | Cosa è cambiato | Verifica |
|---|---|---|
| **B1** pulsante «Converti» | Nascosto per difetto: compare solo con `VITE_PASSAGGIO_RIGHE=pulsante` o `auto` (`src/state/conversionMode.ts`; ogni altro valore = nascosto); anche `convertToRows` si rifiuta senza la variabile. Il pulsante apre una conferma (`Modal`): l'app di oggi sugli altri dispositivi non potrà più salvare quel viaggio, il ritorno non è automatico, «Esporta un backup». Lo stato di un viaggio già convertito resta visibile. `.env.example` e `README.md` aggiornati | test `parseConversionMode`; `righe.cjs` con la build normale controlla che il pulsante manchi; con `VITE_PASSAGGIO_RIGHE=pulsante` controlla testo della conferma, backup proposto, nessuna conversione prima della conferma |
| **§9.6** ritorno al documento | Passo 1 `supabase/rollback/20261108_ritorno_documento_esporta.sql` (una SELECT: righe del viaggio in JSON, cancellate comprese). Passo 2 `scripts/ritorno-documento.ts` (ricostruisce `data` con `fromRows`, scrive lo SQL). Passo 3 lo SQL generato: una transazione con `set local nfhp.permetti_documento = 'on'`, controllo che il viaggio sia ancora «righe» e che `seq` non sia cambiato dall'esportazione, `update` di `data` e `storage_format = 'documento'`, controllo finale (data uguale al documento atteso) altrimenti annulla; le righe delle tabelle restano. L'app riconosce il ritorno: se il cloud dice «documento» toglie il segno «righe» e la base e continua col flusso del documento (controllo anche prima di ogni invio, così non scrive righe di nascosto) | `tests/ritorno.test.ts` (modifiche e cancellazioni fatte dopo il passaggio, protezioni). Sul DB, solo in blocchi annullati con una **copia** del viaggio reale (id `5e5e5e5e-…c0b1`, inserita e annullata): conversione, guardia che rifiuta `data` senza permesso, esportazione vera passata allo script, statement generati eseguiti → 1 riga aggiornata, controllo finale superato. Dopo: 1 viaggio, md5 invariato, 0 righe nelle tabelle |
| **I1** `sync.cjs` | Ogni rete esterna bloccata (passano solo `localhost` e il Supabase finto); stesso blocco in `righe.cjs` | 5 esecuzioni di fila: 16 OK ciascuna |
| **I2** «già esistente» | Vale come riuscito solo se la dimensione nello Storage (`object/info`, in alternativa `HEAD`) coincide con il file; altrimenti errore con «Riprova», nessuna sovrascrittura | test: dimensione diversa, uguale, non leggibile |
| **I3** percorso | `{owner_id}/{trip_id}/{id}` con il proprietario del viaggio (letto da `trips.owner_id`), non con chi carica | test |
| **I5** cambio utente | `holdStore`/`restoreStore` (`dataStore.ts`): la base per riga si mette da parte in `nfhp-dati` e torna al rientro; i cataloghi restano | test |
| **I6** viaggi nuovi | «Nuovo viaggio vuoto» con il cloud collegato crea il viaggio già nel formato a righe (primo `sync_push` = riga `trips` nuova); finché non è nel cloud non si legge. **Dal terzo giro solo con `VITE_PASSAGGIO_RIGHE=pulsante|auto`** | `righe.cjs`: viaggio nuovo «righe» con `trip_countries` NO, viaggio precedente intatto |
| Tappa 7 | Campo «Nazione» del luogo personalizzato e «Nazione della tappa» nei dettagli (solo con più nazioni); testata della tappa con la nazione (regione · nazione, luogo personalizzato · nazione, notte a bordo · nazione del porto d'imbarco); Catalogo con filtro «Nazione», regioni raggruppate per nazione e gruppi con versione e luoghi (solo con più nazioni; le regioni ora si leggono dal catalogo, non da un elenco fisso); Budget con «Cambi usati» (una riga per valuta; cambio mancante con numero di voci e «Inserisci il cambio») | test `ratesUsed`; controlli nel browser invariati |

NO-1 ora è **pubblicata** (2026-11-07, 117 luoghi compresi i porti): l'app scarica il catalogo dal DB invece di usare i file.

### Esiti del secondo giro (2026-11-08)
`npm run typecheck` ok · `npm run lint` ok · `npm test` 223/223 · `npm run build` ok (avviso sulla dimensione del blocco) ·
`e2e.cjs` 60 OK · `planning.cjs` 16 OK · `sync.cjs` 16 OK per 5 volte · `a11y.cjs` 34 OK · `cosafare.cjs` 30 OK ·
`righe.cjs` 3 OK con la build normale (pulsante assente; il resto è saltato e lo dice), 34 OK con `VITE_PASSAGGIO_RIGHE=pulsante`.

### Ritorno al documento: come si usa (per un viaggio)
1. SQL Editor: aprire `supabase/rollback/20261108_ritorno_documento_esporta.sql`, sostituire l'id `00000000-…` con quello del viaggio, eseguire, salvare il valore di `esportazione` in un file fuori dal repository (es. `ritorno.json`).
2. `npx tsx scripts/ritorno-documento.ts --in ritorno.json --out ritorno.sql` (nessuna rete, nessuna chiave).
3. Rileggere `ritorno.sql` ed eseguirlo nello SQL Editor. Se qualcuno ha scritto nel frattempo (seq diverso) o il controllo finale non passa, la transazione si annulla: rifare dal passo 1.
4. Dopo: l'app riconosce il formato «documento» e torna al salvataggio di prima; le righe restano nelle tabelle. Per togliere tutto lo schema nuovo: `supabase/rollback/20261106_annulla_database_multinazione.sql`.

## Primo giro (2026-11-07)

## Tappe completate

| # | Tappa | Stato |
|---|---|---|
| 1 | Conversione documento `Trip` ↔ righe | fatta e testata (anche su una copia in sola lettura del viaggio reale, fuori dal repository) |
| 2 | Catalogo da `catalog_bundle`, copia offline, adattatore verso le strutture di oggi | fatta e testata (bundle generato dal seed; NO-1 nel database è ancora in bozza) |
| 3 | Sincronizzazione per riga (coda, `sync_push` a lotti, `sync_pull`, conflitti per riga) | fatta, testata con server simulato e nel browser |
| 4 | Passaggio documento → righe (`trip_imports`, verifica, `storage_format = 'righe'`) | fatto, testato; parte solo con il pulsante o con `VITE_PASSAGGIO_RIGHE=auto` |
| 5 | Preferenze, contesto di lavoro e modalità per dispositivo nel DB | fatta (copia locale per l'offline), testata la parte pura |
| 6 | Allegati del diario nello Storage `diario-allegati` | fatta, testata la parte pura; non provata contro lo Storage vero |
| 7 | Nazioni: scelta, «Nazioni del viaggio», versione del catalogo, valuta e fuso dalla nazione | fatta in parte (vedi «Cosa resta») |

## Decisioni

1. **Documento `Trip` in formato 2, campi nuovi facoltativi** invece di `schemaVersion: 3`. Il «v3» dell'architettura
   (§3) è reso così: `countries?: TripCountry[]`, `rates?: Record<valuta, CurrencyRate>`, `stop.countryCode?`, stato
   allegato `nel_cloud` con `storagePath`/`uploadedAt`. Il cambio NOK resta in `settings.nokPerEur` (lo usano dominio,
   aggiornamento automatico e app di oggi) e nelle righe diventa `trip_rates` con valuta NOK; le altre valute vanno in
   `trip.rates`. Motivo: nessun salto di formato sui dispositivi con l'app di oggi e nessuna riscrittura del dominio.
   `downgradeToV2` non serve: il documento ricostruito dalle righe è già leggibile dall'app di oggi.
2. **Viaggi senza `countries`** (tutti quelli esistenti): valgono Norvegia, catalogo `NO-1` (`tripCountries`,
   `src/domain/countries.ts`). `ensureCountries` rende esplicita la nazione solo al passaggio alle righe.
3. **Fedeltà della conversione** (`src/domain/rows.ts`): campi sconosciuti in `extra`; in `extra.__nfhp` i metadati
   per ricostruire identico ciò che le colonne non distinguono (campo assente, `null`, valore fuori elenco o di tipo
   sbagliato, doppioni che violerebbero una chiave, testo originale delle date `timestamptz`). Un valore non valido
   non blocca il passaggio: la colonna riceve un valore ammesso, l'originale resta nei metadati e la conversione lo
   elenca (`warnings` → `trip_imports.unresolved`). Restano errori bloccanti solo identificativi ripetuti di tappe,
   tratti, voci di budget, voli e versioni del percorso.
4. **Catalogo**: le viste continuano a importare `src/data/*`; `src/catalog/registry.ts` ne sostituisce il contenuto
   sul posto con il catalogo delle nazioni del viaggio (`installCatalog`) e le viste si ridisegnano. All'avvio restano
   i dati dei file (identici a NO-1, che ne è generato): se il download non riesce (es. versione ancora in bozza,
   nessuna rete) l'app resta usabile. `src/data/*` resta come riserva (D1) e sorgente del seed.
5. **Sincronizzazione per riga solo per i viaggi «righe»** (`nfhp.sync.formato.<id>` sul dispositivo, `storage_format`
   nel cloud). I viaggi «documento» continuano con il motore di oggi, invariato.
6. **Lotti con identificativo proprio**, annotato in `attempted` prima dell'invio e mai riusato per contenuti diversi.
   La base (`nfhp-dati`/`base`) avanza solo con `sync_pull` per il `seq` e con le revisioni confermate per le righe.
7. **Unione per riga**: righe diverse cambiate sui due lati non sono un conflitto (il server le accetta);
   stessa riga diversa → conflitto «Tappa Oslo: notti 3 / notti 5»; ordine delle tappe → una scelta; percorso
   incoerente → un'unica scelta «Percorso, date e scenari»; diario → entrambe le versioni; cambi → il più recente;
   impostazioni → per chiave. Il dialogo dei conflitti è quello di oggi.
8. **Passaggio**: sul dispositivo, con lo stesso `toRows`; mai automatico senza `VITE_PASSAGGIO_RIGHE=auto`. Prima
   invia le modifiche in coda col flusso di oggi; verifica l'uguaglianza leggendo le righe dal cloud; se `data` è
   cambiato nel frattempo ricomincia; solo alla fine `storage_format = 'righe'`. `data` non si tocca mai.
9. **Contesto di lavoro**: `src/state/workContext.ts` (copia `nfhp.contesto.v1`), upsert su `user_context`, ultima
   scrittura vince; le chiavi vecchie in sessionStorage/`nfhp.configurator.v1` si copiano una volta. Modalità: copia
   `nfhp.ui.mode` + upsert su `user_devices` con `nfhp.device`. Stato visivo (mappa/filtro/scorrimento del
   Pianificatore, `nfhp.autoRoute`) resta in sessionStorage. `user_preferences` non è usata: oggi non ci sono
   preferenze per utente diverse da contesto e modalità.
10. **Allegati**: caricamento solo per i viaggi «righe» (lo Storage accetta il file solo se la riga dell'allegato è
    nel cloud) e a viaggio sincronizzato; «già esistente» vale come riuscito; la copia locale resta come cache;
    il file nel cloud si cancella solo dopo la conferma dell'eliminazione della voce.
11. **Valuta e fuso**: `rateFor`/`toEur` per valuta; importo senza cambio escluso dal totale ed elencato tra i costi
    non quantificati («Cena: 300 XTS, cambio da inserire»). Calendario `.ics` nel fuso della prima nazione: per i fusi
    CET/CEST (riconosciuti dagli scarti di gennaio e luglio, nessun nome fisso) VTIMEZONE come prima, per gli altri
    orari in UTC. Meteo con `timezone=auto` (fuso del luogo).
12. **Viaggio nuovo da Impostazioni**: titolo «Nuovo viaggio» e nessuna nazione → scelta della nazione in Panoramica.
    `createEmptyTrip()` resta com'era (viaggio vuoto all'avvio e dopo l'uscita): niente scelta forzata lì.
13. **Nessuna dipendenza nuova.**

## File cambiati

Nuovi:
- `src/domain/rows.ts` (conversione), `src/domain/rowMerge.ts` (differenze, lotti, unione per riga),
  `src/domain/countries.ts`, `src/domain/attachments.ts`
- `src/catalog/adapter.ts`, `src/catalog/registry.ts`, `src/services/catalog/catalogService.ts`, `src/data/country.ts`
- `src/services/storage/dataStore.ts` (IndexedDB `nfhp-dati`), `rowSync.ts`, `importRows.ts`, `device.ts`,
  `attachmentsCloud.ts`, `attachmentUploader.ts`
- `src/state/catalog.tsx`, `workContext.ts`, `userSync.ts`, `attachmentsSync.ts`
- `src/ui/Countries.tsx`, `FormatPanel.tsx`, `AttachmentsPanel.tsx`
- test: `tests/righe.test.ts`, `catalogo.test.ts`, `sincronizzazione-righe.test.ts`, `passaggio-righe.test.ts`,
  `contesto.test.ts`, `allegati.test.ts`, `nazioni.test.ts`, supporto `tests/fakeSync.ts`, `tests/fixtures.ts`
- browser: `verify/e2e/righe.cjs`

Modificati: `src/domain/types.ts` (campi facoltativi), `budget.ts`/`coastal.ts`/`lodging.ts` (valute),
`configurator.ts` (costanti del catalogo esportate e sostituibili), `exportFormats.ts` (fuso), `openMeteo.ts`,
`supabase.ts` (`restJson`, `rpc`, `upsertRow`, Storage, `storage_format`), `syncEngine.ts` (contesto tra i dati da
mettere da parte/togliere), `cloudSync.tsx` (motore per righe, passaggio, contesto), `uiContext.ts`, `App.tsx`,
viste (`OverviewView`, `SettingsView`, `CatalogView`, `ConfiguratorView`, `PlannerView`, `TravelView`, `RatesPanel`,
`ExportsPanel`, `SyncDialogs`, `SyncStatus`, `common.tsx`), `styles.css`, `scripts/seed-catalog.ts` (`seedBundle`,
opzione `--bundle`, nazione da `src/data/country.ts`), `README.md`, `.env.example` (`VITE_PASSAGGIO_RIGHE`).

## Test ed esiti reali (2026-11-07)

| Controllo | Esito |
|---|---|
| `npm run typecheck` | ok |
| `npm run lint` | ok |
| `npm test` | 217 test, 217 ok (nuovi: righe 7, catalogo 5, sincronizzazione per riga 9, passaggio 6, contesto 4, allegati 3, nazioni 3) |
| `npm run build` | ok (avviso di Vite sulla dimensione del blocco > 500 kB) |
| `node verify/e2e/e2e.cjs` | 60 OK, 0 FAIL |
| `node verify/e2e/planning.cjs` | 16 OK, 0 FAIL |
| `node verify/e2e/sync.cjs` | 16 OK, 0 FAIL (viaggio «documento»: comportamento di oggi invariato) |
| `node verify/e2e/a11y.cjs` | 34 OK, 0 FAIL |
| `node verify/e2e/cosafare.cjs` | 30 OK, 0 FAIL |
| `node verify/e2e/righe.cjs` (nuovo) | 28 OK, 0 FAIL: conversione verificata, `data` intatto, invio per righe, modifica di un altro dispositivo, conflitto «Tappa Oslo», nessun doppione dopo la ricarica, nazione aggiunta e tolta, scelta della nazione per un viaggio nuovo, 375 px |

Cosa provano i test unitari, in breve: ricostruzione identica di un documento con tutti i campi (tre versioni del
percorso, piano vecchio senza voli, diario con copia «-cloud» e allegati ripetuti, campi sconosciuti a ogni livello),
dei formati storici e del viaggio vuoto; catalogo dal bundle di NO-1 uguale ai file (82 luoghi, fonti delle coordinate,
siti ufficiali, Wikidata, 24 crociere, porti, contee, basi, collegamenti in treno); seconda nazione di prova (XTS) che
si somma senza codice per nazione; versione del viaggio fissa con N+1 disponibile; risposta persa → nessun doppione;
lotto con conflitto → nessuna scrittura; offline → coda e invio unico; tutti i casi UC9; passaggio ripetibile, ripreso
dopo un'interruzione, rifatto se l'app vecchia salva nel frattempo, fermo su un documento più recente; limiti degli
allegati e caricamento unico; valuta senza cambio esclusa ed elencata; `.ics` CET e non CET.

### Prove sul database (sola lettura o annullate)
- Lettura: `catalog_releases` (NO-1 in **bozza**, 0 luoghi il 2026-11-06), un solo viaggio in `trips`
  (`storage_format = 'documento'`).
- Copia del documento reale letta in sola lettura e convertita in locale (file nello scratchpad, non nel
  repository): ricostruzione identica, nessun avviso.
- Blocco `do … raise exception` (tutto annullato): `sync_push` con le righe generate da `toRows` (28 righe, 19
  tabelle) → `applicato`; stesso identificativo → `gia_applicato`; `sync_pull(…, 0)` restituisce tutte le tabelle;
  `uploaded_at` torna in un altro formato (gestito dai metadati). Dopo: `trips` 1, `stops` 0, `sync_mutations` 0.

## Cosa resta (aggiornato al secondo giro)

1. **Catalogo**: confrontare il bundle vero di NO-1 (ora pubblicata) con `seedBundle(buildNorway())` e aggiungere un
   test con le chiavi `null` tolte come nel seed (review M4). Ordine dei luoghi dal bundle per chiave: a parità di
   punteggio l'ordine di partenza del configuratore può cambiare (M5).
2. **Nazioni, parti del design non fatte**: chip «Nazione», gruppi e «oltre il confine» in «Cosa fare»; regioni
   raggruppate per nazione nel configuratore; valuta proposta dalla nazione della tappa nelle voci di spesa (oggi il
   menù offre EUR e le valute delle nazioni, la proposta resta EUR); prezzo del carburante per nazione (resta
   `settings.car.priceNok`); parametri del configuratore per nazione (`ROAD_FACTOR`, `AVG_KMH`, `AIRPORT_RADIUS_KM`
   restano costanti tarate sulla Norvegia; sono nel bundle ma non ancora letti); aeroporti di casa da `home_airports`;
   `Region` e `CoastalOperator` ancora tipi fissi in `types.ts` (a runtime accettano qualsiasi nome); fuso per singolo
   evento del calendario (oggi quello della prima nazione); toast «catalogo versione N scaricato» e barra del download.
3. **Allegati**: non provati contro lo Storage vero (`attachments_usage`, link firmati, forma di «già esistente» e di
   `object/info`); riga «Allegati» in `DataStatusCard` (Altro › I tuoi dati) non fatta; l'eliminazione della voce usa
   `window.confirm` (con il testo del design).
4. **Primo accesso** (design §7): niente schermata «Preparo questo dispositivo» e niente «Accedi per iniziare»; il
   comportamento resta quello di oggi (apre il viaggio dell'ultimo contesto, altrimenti il più recente).
5. **Ritorno al documento dall'app**: c'è solo la procedura manuale in tre passi (SQL Editor + script).
6. Altri punti minori della revisione non toccati: M1–M3 (database), M7 (dimensione del blocco JS), M8 (`.env` nel
   repository), M9 (protezione password), M10 (approvazione già data da Filippo il 2026-11-06).

## Rischi

- **Prima esecuzione vera di `sync_push` su un viaggio reale**: provata solo in transazione annullata con dati di
  prova; il passaggio del viaggio reale va fatto dopo l'approvazione separata (punto 5 del piano), con export prima.
- **Due app insieme**: dopo il passaggio, un dispositivo con l'app di oggi non salva più (messaggio della guardia);
  le sue modifiche restano nella sua coda locale. Aprire la nuova app su tutti i dispositivi prima di convertire.
- **Pulsante «Converti»**: dal secondo giro compare solo con `VITE_PASSAGGIO_RIGHE=pulsante|auto` e chiede conferma.
  Non impostare la variabile nell'anteprima o in produzione prima dell'approvazione del passaggio del viaggio reale.
- **Viaggi nuovi a righe** (solo con la variabile, dal terzo giro): l'app di oggi su altri dispositivi li vede come
  «versione più recente» e non li apre.
- **Dimensione dei lotti**: 1000 righe / ~900 KB per lotto; limite reale del corpo REST da verificare (§13
  dell'architettura). Le geometrie dei segmenti sono le righe più pesanti.
- **Orologi**: il contesto di lavoro confronta `updated_at` del server con quello ricevuto; una scrittura molto
  ravvicinata da due dispositivi tiene l'ultima arrivata (scelta dell'architettura).

## Come provare con un account reale (passi per Filippo)

Prerequisiti: migrazioni già applicate su `norway-planner`; catalogo NO-1 pubblicato (fatto il 2026-11-07); nessuna
password nei file.

1. Esporta un backup del viaggio dall'app di oggi (Impostazioni › Backup su file) e, dal pannello Supabase,
   `select id, updated_at, md5(data::text) from public.trips;` (annota i valori).
2. Dal ramo: `npm install`, `.env.local` con `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (chiave pubblica),
   **senza** `VITE_PASSAGGIO_RIGHE`; `npm run build && npm run preview` (oppure l'anteprima Vercel del ramo).
3. Accedi con il tuo account dalla pagina Impostazioni. Controlla: Impostazioni › «Nazioni e cataloghi» mostra
   «Norvegia · sul dispositivo» con versione 1; Catalogo dei luoghi inizia con «Catalogo Norvegia versione 1».
4. **Solo dopo l'approvazione del passaggio**: build con `VITE_PASSAGGIO_RIGHE=pulsante`, poi Impostazioni ›
   «Aggiorno il formato dei dati» › **Converti il viaggio al nuovo formato** › leggere la conferma › «Esporta un
   backup» › «Converti il viaggio». Atteso: «✓ nuovo formato»; eventuali riferimenti non trovati elencati. Nel pannello Supabase:
   `select storage_format from trips;` = `righe`; `select status, unresolved from trip_imports;` = `verificata`;
   `md5(data::text)` uguale al valore annotato.
5. Modifica una nota di una tappa: lo stato torna «Sincronizzato»; `select notes, rev from stops;` mostra la modifica.
6. Secondo dispositivo (o finestra anonima) con la stessa build: accedi; si apre lo stesso viaggio; cambia la stessa
   tappa in modo diverso sui due → conflitto «Tappa …» con scelta.
7. Modalità viaggio › Diario: aggiungi una foto (< 10 MB) a una voce: dopo l'invio compare «✓ nel cloud»; sull'altro
   dispositivo «Apri» la scarica. Impostazioni › «Allegati del diario» mostra lo spazio usato.
8. Ritorno indietro se qualcosa non va: procedura «Ritorno al documento» (sezione del secondo giro, tre passi); dopo,
   l'app di oggi torna a salvare il viaggio.

## Trasporti via mare (2026-11-09)

Ramo `feature/trasporti-mare` (da `main`). Riferimenti: `docs/piano-2026-11-09-trasporti-mare.md`, `docs/spec-trasporti-mare.md`,
`docs/design-trasporti-mare.md` (+ mockup), `docs/architettura.md` §16. **Nulla applicato al database**, nessun push,
nessuna variabile d'ambiente impostata; il viaggio reale non è stato toccato.

### Cosa è stato fatto
- **Menù e indirizzi**: la voce «Crociere» di Prenotazioni diventa «Trasporti via mare» (`src/ui/SeaView.tsx`) con due
  schede (`role=tablist`, frecce/Home/Fine): Crociere = `CoastalView` invariata; Traghetti = `#/crociere?parte=traghetti`
  (la scheda scelta aggiorna l'indirizzo con `replaceState`), `&tratta={id}` apre la scheda, alias `#/mare`. Testi
  aggiornati in `VIEW_PLACE`, Riepilogo Prenotazioni («Crociere e traghetti») e avvisi dell'Itinerario.
- **Catalogo**: `adaptFerries` in `src/catalog/adapter.ts` ricostruisce `FerryRoute` dalle righe `ferry_*` (chiavi
  facoltative: NO-1 e copie offline vecchie danno zero tratte, nessun errore); `AppCatalog.ferryRoutes/ferrySources/
  ferryRelease`. Il registro sostituisce `FERRY_ROUTES`/`FERRY_SOURCES` come le crociere e tiene la versione di ogni
  tratta. `FILE_COUNTRY` = `NO-2`, versione 2 (il seed di NO-1 resta identico: rigenerato e confrontato).
- **Dominio** `src/domain/ferries.ts` (puro): `ferryCost` (età del viaggio con avviso a ±1 anno dalla soglia, gratis sotto
  età, tetto bambino, conducente incluso nel veicolo, passeggeri gratis/a pagamento/non indicata, auto solo se scelta,
  pacchetto auto e biglietto famiglia con scelta del più basso — a parità il conto per persona —, tariffa del sabato e
  periodi della fonte, sottotratte solo con prezzo pubblicato, sconto ritorno e prenotazione facoltativa solo se scelti,
  prezzo mancante = non calcolabile, anno tariffa ≠ anno del viaggio = da verificare); testi dello stato (tre soli);
  ricerca senza accenti, filtri, zone, gruppi; `tripFerryRoutes` (solo la versione del catalogo del viaggio);
  `ferrySuggestions` (solo battelli veloci/turistici, entrambe le tappe collegate per id, collegamento in auto,
  nascondibili e reversibili); `ferrySegment`/`applyFerry`/`insertRoadParts` (tratto a sé, nessun km, durata della
  tratta, attesa e orario dell'utente, linea solo tra moli NSR; strada lasciata, sostituita o ricalcolata fino ai moli).
  `upgradeCatalog` e `releaseVersion` in `src/domain/countries.ts`.
- **UI Traghetti** (`src/ui/SeaView.tsx`, `src/ui/Ferries.tsx`): nota, riepilogo (1 prezzo 2027 · 46 da verificare · 11
  assenti), suggerimenti «Alternative all'auto», ricerca + zona + auto + mezzo + «Solo con prezzo» + «Collegate alle mie
  tappe», conteggio in `role=status` (300 ms), stati (versione 1, caricamento, errore, senza rete, nessun risultato);
  dialogo a passi scheda → aggiungi (tappe, durata, regola tariffaria, tabella delle tariffe, fonti con data, «Vai alla
  fonte ↗», nessun «Prenota»; collegamento, imbarco/sbarco, auto, strada, partenze pubblicate come chip, attesa, opzioni,
  anteprima del costo con «Si usa», «Ho trovato il prezzo», anteprima del collegamento). Telefono: filtri in «Filtri»,
  pulsanti ≥ 44 px, azioni fisse in basso, conto a due colonne.
- **Percorso**: chip «· con auto · 1650 NOK · dal catalogo traghetti», riga «C'è anche un battello… Vedi», blocco «Costo per
  la famiglia» con «Come è calcolato», «Cambia imbarco, auto e opzioni», «Scheda della tratta»; costo modificato a mano =
  `costByUser` con «Torna al calcolo».
- **Budget**: voce «Traghetto A → B · con/senza auto» (categoria Traghetti, origine Itinerario) con dettaglio e «Apri nel
  percorso»; senza prezzo «Traghetto …: prezzo da cercare» tra i costi senza importo, mai zero.
- **Impostazioni › Nazioni e cataloghi**: con il viaggio su NO-1 messaggio e pulsante «Passa a NO-2» con conferma
  (`UpgradeDialog`, Annulla nel toast). L'offerta viene dall'elenco del server; senza elenco (non collegati) e con il
  catalogo dei file in uso si propone la versione contenuta nell'app.

### Verifiche (2026-11-09)
- `npm run typecheck`, `npm run lint`: puliti. `npm test`: 255 test, 0 falliti (29 nuovi in `tests/traghetti-costi.test.ts`,
  `tests/traghetti-catalogo.test.ts`, `tests/traghetti-percorso.test.ts`: esempi della spec 1469, 1650, 1990, 3107/3299,
  1365, 81 / non calcolabile, 0/605/735, prezzi assenti; adattatore ≡ file; upgrade senza perdite; righe del viaggio).
- `npm run build`: ok. Script nel browser, tutti senza FAIL: `traghetti.cjs` (nuovo) 64 OK · `e2e.cjs` 60 OK ·
  `planning.cjs` 16 OK · `cosafare.cjs` 30 OK · `a11y.cjs` 36 OK (ora anche `#/crociere?parte=traghetti`) · `sync.cjs` tutti OK ·
  `righe.cjs` 8 OK con la build normale e 34 OK con la build `VITE_PASSAGGIO_RIGHE=pulsante` (variabile solo per quel
  comando); poi `dist` ricostruita senza variabile.
- Seed: `npx tsx scripts/seed-catalog.ts` (NO-1) identico a prima; `--version 2` identico a `catalogo-norvegia-v2.sql`.

### Limiti e rischi
- «Ricalcola la strada fino all'imbarco» usa il servizio di percorsi dopo «Applica»; un successivo «Ricalcola strada» del
  collegamento ricalcola A → B intero (comportamento di sempre con i traghetti manuali, avviso dei tempi sommati).
- Nessuna corrispondenza tra fermate e luoghi lungo la tratta (es. Finnsnes ↔ Senja): l'imbarco/sbarco proposto è la
  tratta intera, l'utente sceglie la sottotratta.
- La crociera andata e ritorno (Stavanger–Lysefjord) rimanda alle Giornate, senza creare l'attività da sola.
- Senza collegamento al cloud il passaggio a NO-2 si basa sui file dell'app: se NO-2 non fosse pubblicata sul server, il
  download fallirebbe con il messaggio d'errore della nazione (il piano prevede la pubblicazione di NO-2).

### Correzioni dopo la revisione (2026-11-10, `docs/review.md` «Revisione Trasporti via mare»)
- **B1 — costo salvato che invecchia**: `costDrift`/`refreshCost`/`isLockedCost` (`src/domain/ferries.ts`). Se data del
  collegamento, età, partecipanti o catalogo cambiano il conto, il tratto (e la voce del Budget) mostra «Il conto è
  cambiato: X → Y · Aggiorna»; si aggiorna solo con il clic. Tratti «prenotato»/«pagato»: l'importo non cambia mai da
  solo, «Aggiorna…» chiede una seconda conferma e lo stato resta quello dell'utente; nel dialogo «Cambia imbarco, auto
  e opzioni» un cambio d'importo su un tratto prenotato/pagato richiede la casella di conferma. Test: Tromsø → Harstad
  mercoledì 1469 → sabato 708 (e bambino 5 → 6 anni: 1678), prenotato bloccato, costo a mano senza avviso.
- **Link delle fonti**: solo `https` (`externalHref` + controllo `https://`); CHECK di `ferry_sources.url` ristretto a
  `^https://` nella migrazione (non applicata); `scripts/build-ferry-routes.ts` rifiuta url non https (dati invariati,
  seed v2 rigenerato identico).
- **Spec allineata**: Eidsdal → Linge senza auto = non calcolabile (regola 3 e §8).
- **Anno**: senza data si usa agosto dell'anno del viaggio; senza anno il periodo della tariffa non si sceglie e il conto
  è «da verificare» (niente più 2027 fisso).
- **Biglietto famiglia**: la fascia d'età viene dalla voce bambino dello stesso periodo/tratto.
- Riserve 4–7 restanti (ordine di pubblicazione, chiavi `ferry_*` vuote in NO-1, anno Torghatten dedotto, tariffe solo
  B→A, senior fuori stagione) non toccate: sono note per il capo progetto o senza effetto sul conto.
- Verifiche rifatte: vedi sotto.
- Esiti 2026-11-10: typecheck e lint puliti; `npm test` 257/257; build ok; `traghetti.cjs` 64 OK (aggiunta un'attesa di
  un fotogramma dopo la freccia sulle schede: una volta era fallito per il tempo del focus, poi 2 esecuzioni su 2 pulite)
  · `e2e` 60 · `planning` 16 · `cosafare` 30 · `a11y` 36 · `sync` 16 · `righe` 8 (build normale) e 34
  (`VITE_PASSAGGIO_RIGHE=pulsante`, solo per quel comando), tutti 0 FAIL; `dist` ricostruita senza variabile.
