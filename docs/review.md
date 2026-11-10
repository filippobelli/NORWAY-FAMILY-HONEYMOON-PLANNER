# Revisione · Tutti i dati nel database, catalogo per nazione

Data: 2026-11-07 → 2026-11-08 · Agente revisore/QA · Ramo `feature/database-multinazione` (HEAD `0f15cca`, modifiche non committate)
Riferimenti: `docs/piano-2026-11-06-database.md`, `docs/spec.md` §7, `docs/design.md`, `docs/architettura.md`, `docs/deploy.md`, `docs/sviluppo.md`.
Database: `norway-planner` (`zsbfcriekrguiugbqdhi`). Solo letture e prove dentro blocchi `do … raise exception` (tutto annullato). Nessun DDL, nessuna scrittura, codice dell'app non modificato.

## Esito finale (dopo la terza revisione, 2026-11-08): **APPROVATO CON RISERVE**, nessun bloccante

Senza `VITE_PASSAGGIO_RIGHE` nessun percorso dell'app crea o converte un viaggio nel formato a righe. Dettagli in fondo, «Seconda revisione» e «Terza revisione». Le sezioni 1–10 qui sotto sono la prima revisione (2026-11-07) e restano come registro.

## Esito della prima revisione: **APPROVATO CON RISERVE** (con il bloccante B1)

Il lavoro è solido: controlli verdi, sicurezza RLS e Storage verificata sul database vero, catalogo pubblicato identico ai file, conversione e `sync_push`/`sync_pull` corretti su una copia del viaggio reale. Il viaggio reale è intatto.

**Prima del merge su `main` serve una correzione (B1)**: il pulsante «Converti il viaggio al nuovo formato» converte il viaggio reale con un solo clic, senza conferma, e il ritorno al documento (§9.6) non esiste ancora. Dopo il merge il pulsante sarebbe in produzione.

## 1. Controlli eseguiti (esiti reali)

| Controllo | Esito |
|---|---|
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `npm test` | OK, 217/217 |
| `npm run build` | OK (avviso di Vite: blocco JS di 822 kB, oltre 500 kB) |
| `verify/e2e/e2e.cjs` | 60 OK, 0 FAIL |
| `verify/e2e/planning.cjs` | 16 OK, 0 FAIL |
| `verify/e2e/a11y.cjs` | 34 OK, 0 FAIL |
| `verify/e2e/cosafare.cjs` | 30 OK, 0 FAIL |
| `verify/e2e/righe.cjs` | 28 OK, 0 FAIL (7 invii `sync_push`) |
| `verify/e2e/sync.cjs` sul ramo, 3 volte | 1ª: 16 OK · 2ª e 3ª: 15 OK, **1 FAIL** («viaggio vuoto: nessun caricamento inutile», `db 1`) |
| `verify/e2e/sync.cjs` su `main` (worktree temporaneo, poi rimosso), 5 volte | 3 OK · **2 FAIL, stesso controllo** → difetto **preesistente** |

### FAIL intermittente di `sync.cjs`: causa reale
Ho strumentato una copia dello script (fuori dal repository) registrando le richieste.
- Il server finto intercetta solo `supabase.co`; **le richieste vere a `data.norges-bank.no` e `data.ssb.no` partono davvero** (`useAutoRates`, `src/state/autoRates.ts`, invariato rispetto a `main`).
- Quando la risposta arriva prima che lo stato diventi «Sincronizzato», il cambio (es. 10,526 del 2026-11-06) e il prezzo del carburante modificano il viaggio vuoto → il viaggio diventa «da inviare» → `POST` al cloud dopo 3 s → `db.size === 1`. Nella corsa fallita la `POST` è arrivata a 3,4 s con `settings.nokPerEur` aggiornato e 0 tappe; nelle corse riuscite il controllo avviene a ~0,5 s, prima della risposta.
- Il comportamento dell'app è voluto (un cambio aggiornato è una modifica da salvare). Il difetto è del test: non è ermetico e dipende dalla rete e dai tempi. Sul ramo capita più spesso perché all'accesso partono 5 richieste in più (`attachments_usage`, `user_context`, `catalog_bundle`, `user_devices`) a cui il server finto risponde 404, e lo stato «Sincronizzato» arriva un po' più tardi.
- Correzione consigliata (solo nel test): bloccare `data.norges-bank.no|data.ssb.no` nella `p.route` di `sync.cjs`, oppure impostare `nfhp.rates.checkedAt` nell'`addInitScript`.

## 2. Catalogo pubblicato e catalogo dei file

`catalog_bundle('NO-1')` letto come utente autenticato (proprietario del viaggio reale), in transazione annullata, e confrontato con `seedBundle(buildNorway())` (`npx tsx scripts/seed-catalog.ts --bundle`). Confronto per riga (md5 della forma testo `jsonb`, ordine indipendente):

| Parte | Righe DB / file | Esito |
|---|---|---|
| places | 117 / 117 | identiche byte per byte |
| place_texts | 117 / 117 | identiche |
| place_sources | 394 / 394 | identiche (fonti, date, licenze, metodi per campo) |
| voyages | 24 / 24 | identiche |
| route_ports | 35 / 35 | identiche |
| operators | 2 / 2 | identiche |
| place_links | 9 / 9 | identiche |
| regions | 7 / 7 | uguali **togliendo le chiavi `null`** dentro `sources` (il seed le toglie nei JSONB annidati, `seedBundle` no); idem `release.source_notes` |

`adaptBundle` dà lo stesso risultato con e senza quelle chiavi `null`: **82 luoghi, 24 crociere, 35 porti, 29 siti ufficiali, 77 riferimenti Wikidata**, come i file. NO-1 è `pubblicata` (versione 1). Il bundle reale pesa 311 kB (l'architettura stimava ~200 kB).

## 3. Sicurezza

### Advisor
- **Security**: 7 avvisi «SECURITY DEFINER eseguibile da authenticated» (`is_trip_owner`, `can_read_trip`, `can_edit_trip`, `can_read_attachment`, `can_write_attachment`, `can_delete_attachment`, `attachments_usage`); 1 avviso Auth «protezione password compromesse disattivata» (preesistente).
- **Performance** (solo INFO/WARN): 15 chiavi esterne senza indice, 4 indici non ancora usati, tabella `private.trips_backup_20261106` senza chiave primaria, policy permissive multiple su `trips` (proprietario + membro).

**Valutazione delle 7 funzioni**: servono alle policy, hanno `search_path = ''`, `anon` non le esegue. Le sei funzioni di controllo restituiscono solo vero/falso sull'accesso di **chi chiama** (per un viaggio altrui: falso, provato). Non rivelano dati. `attachments_usage()` restituisce anche i byte totali del bucket di tutti gli utenti: fuga minima e voluta (spazio sul limite di 1 GB). Rischio basso, accettabile. Miglioramento possibile: spostarle in uno schema non esposto dall'API, così spariscono gli endpoint `/rpc/…`.

### RLS (letta dal catalogo di sistema)
Tutte le 37 tabelle di `public` hanno RLS attiva. `anon` non ha `select` né `insert` su nessuna tabella nuova. Su `trips` ha ancora i permessi di tabella preesistenti, ma nessuna policy, quindi vede 0 righe. `authenticated` non ha `delete` sulle tabelle del viaggio (si cancella con i tombstone) né scrittura sui cataloghi.

### Prove in transazione annullata
**Secondo utente fittizio** (`sub` = uuid inventato):

| Tentativo | Risultato |
|---|---|
| `select` su `trips` / `trip_sync_state` / `storage.objects` | 0 righe |
| `update` / `delete` del viaggio reale | 0 righe toccate |
| `insert` in `stops`, `trip_countries` con il viaggio reale | rifiutato da RLS |
| `sync_pull(viaggio reale)` | «Viaggio non accessibile» |
| `sync_push` senza riga `trips` | «Viaggio non accessibile» |
| `sync_push` con una riga `trips` (salta il primo controllo) | rifiutato: chiave duplicata su `trips_pkey`, nessuna scrittura |
| `insert` in `trip_members` (farsi editore), `trip_imports` | rifiutato da RLS |
| `user_context` di un altro utente | rifiutato da RLS |
| file nella cartella del proprietario / nella propria cartella con il viaggio altrui | rifiutato da RLS (`storage.objects`) |
| `can_read_trip` / `can_edit_trip` / `is_trip_owner` sul viaggio reale | falso |
| catalogo: `select places` | 117 righe (lettura consentita) |
| catalogo: `insert`/`update places`, `update catalog_releases` | «permission denied» |

**anon**: `trips` 0 righe, `update` 0 righe, `insert` rifiutato; «permission denied» su tutte le tabelle nuove e su `catalog_bundle`, `sync_pull`, `sync_push`, `attachments_usage`; Storage: 0 oggetti, caricamento rifiutato.

**Proprietario**: un salvataggio come quello dell'app di oggi (`PATCH` condizionato su `updated_at`) riesce (1 riga) e non tocca `rev`/`seq` né il contatore. Il cambio di proprietario è rifiutato. Dopo `storage_format = 'righe'` una scrittura di `data` riceve il messaggio «Questo viaggio usa il nuovo formato: ricarica la pagina…», e il ritorno a `documento` è rifiutato.

**Storage `diario-allegati`**: privato, 10 485 760 byte, 7 tipi MIME espliciti (niente SVG), policy solo `select`/`insert`/`delete` per `authenticated` (nessuna `update`: niente sovrascritture), 0 oggetti. Non provato con file veri attraverso l'API di Storage (limite di 10 MB, tipo SVG, «già esistente»).

## 4. Dati reali

- `public.trips`: 1 riga, `storage_format = 'documento'`, `md5(data::text) = 'f4f3130ae0402fdfb5c8d89c6dd3623d'` (invariato, controllato prima e dopo ogni prova). `data` coincide con `private.trips_backup_20261106` (0 differenze). Tabelle del viaggio, `sync_mutations`, `trip_imports`, `trip_sync_state`, `user_context`, `user_devices` vuote.
- **Coesistenza**: i trigger nuovi su `trips` non cambiano nulla per i viaggi «documento» (provato). L'app di oggi e la nuova build possono convivere finché nessuno converte.
- **Nessun percorso automatico di conversione**: `convertToRows` parte solo da `FormatPanel.tsx` (pulsanti «Converti…» e «Riprova») o dall'effetto in `cloudSync.tsx:588-595`, protetto da `VITE_PASSAGGIO_RIGHE === 'auto'`. `.env` (tracciato) e `.env.example` non lo impostano. Il caricamento degli allegati parte solo per i viaggi a righe. La nuova build, all'accesso, scrive in automatico solo `user_context` e `user_devices` (righe nuove dell'utente, non il viaggio).

## 5. `sync_push` / `sync_pull` su una copia del viaggio reale

Documento reale letto in sola lettura (trascrizione verificata: stesso md5 del database). Copia con id `aaaaaaaa-0000-4000-8000-00000000c0b1`, `prepareDocument` → `toRows` → `diffRows` (base vuota) → 43 righe in 1 lotto (trips 1, trip_countries 1, trip_rates 1, trip_versions 1, stops 1, days 11, activities 25, budget_items 2), 0 avvisi. Tutto dentro un blocco annullato, come proprietario:

| Passo | Esito |
|---|---|
| `sync_push` (id A) | `applicato`, 43 righe, seq 43; viaggio nuovo `righe` con `data` segnaposto `{"schemaVersion":3,"formato":"righe"}`, proprietario = chi chiama |
| di nuovo con id A | `gia_applicato` (nessuna seconda scrittura) |
| id nuovo, stessa base vecchia | `conflitto` su 43 righe (corretto) |
| id nuovo con A in `p_attempted` | `applicato` (la propria scrittura precedente non è un conflitto) |
| `sync_pull(copia, 0)` | 8 tabelle; ogni riga inviata ritrovata identica (43/43, contenimento `jsonb`) |
| Ricostruzione (`fromRows` sulle righe con le colonne di sistema del server) | identica al documento preparato; rispetto all'originale cambia solo `countries` (aggiunto da `ensureCountries`, come deciso in sviluppo §1–2) |
| Viaggio reale dopo le prove | md5 invariato, ancora `documento`; nessuna riga rimasta |

Nota: i giorni del viaggio reale puntano a tappe che non ci sono più (giornate «orfane», 11 giornate per 1 tappa). La conversione li conserva senza errori.

## 6. Criteri di accettazione

### Piano
| # | Criterio | Esito | Prova |
|---|---|---|---|
| 1 | Fuori dal DB solo copia offline, coda, cache, stato visivo | soddisfatto | chiavi in `src/`: tutte nella spec §2.3 o copie/metadati nuovi (`nfhp.device`, `nfhp.contesto.v1`, `nfhp.sync.formato.*`, IndexedDB `nfhp-dati`). `user_preferences` non usata (nessuna preferenza diversa da contesto e modalità) |
| 2 | Viaggio migrato identico | soddisfatto su copia | §5; il passaggio vero richiede l'approvazione di Filippo |
| 3 | Scelta della nazione, seconda nazione di prova | parziale | test `nazioni`/`catalogo` (nazione XT) e `righe.cjs` OK; i viaggi nuovi nascono «documento» e la riga `trip_countries` esiste solo dopo la conversione |
| 4 | Catalogo fisso nel viaggio | soddisfatto | test N+1; `trip_countries.release_id` con chiave esterna |
| 5 | Secondo dispositivo | parziale | viaggio e contesto: test con server finto; allegati non provati con lo Storage vero |
| 6 | Offline senza duplicati | soddisfatto (righe) / parziale (allegati) | test risposta persa e reinvio; prova reale §5 (`gia_applicato`) |
| 7 | RLS e Storage | soddisfatto | §3 (utente fittizio e anon sul database vero) |
| 8 | Fonti, date e licenze per campo | soddisfatto | 394 `place_sources` identiche ai file |
| 9 | Controlli e script | soddisfatto con riserva | tutto verde; `sync.cjs` intermittente, preesistente (§1) |

### Spec §7
| # | Esito | Nota |
|---|---|---|
| 1 | soddisfatto | come piano 1 |
| 2 | soddisfatto su copia | §5; seconda esecuzione senza righe nuove coperta da `passaggio-righe.test.ts` |
| 3 | parziale | come piano 3 |
| 4 | soddisfatto | nazione XT nei test, nessun `if` per nazione nell'adattatore |
| 5 | soddisfatto | test `nazioni` (aggiunta, rimozione con conferma) e `righe.cjs` |
| 6 | soddisfatto | test N+1 |
| 7 | parziale | server finto sì; prova su un secondo account vero non fatta |
| 8 | soddisfatto (righe) / parziale (allegati) | |
| 9 | soddisfatto | test UC9 |
| 10 | soddisfatto | prova con utente fittizio nei claims, non con due account veri |
| 11 | soddisfatto | §2 |
| 12 | parziale | `Europe/Oslo` tolto; restano `Region` e `CoastalOperator` come tipi fissi (`src/domain/types.ts:50`, `:158`), `ROAD_FACTOR`/`AVG_KMH`/`AIRPORT_RADIUS_KM` costanti, `settings.nokPerEur` come cambio NOK, `.ics` nel fuso della prima nazione |
| 13 | soddisfatto | test budget XTS |
| 14 | soddisfatto | `LogoutDialog` (`SyncDialogs.tsx:64-118`) con conferma per gli allegati non caricati |
| 15 | soddisfatto con riserva | §1 |

## 7. Problemi per gravità

### Bloccanti (prima del merge su `main`)
- **B1 · Conversione del viaggio reale con un solo clic, senza ritorno indietro** (`src/ui/FormatPanel.tsx:74`, `src/state/cloudSync.tsx:552`). Il pulsante parte senza conferma. Dopo la conversione l'app di oggi non salva più sugli altri dispositivi, e lo script di ritorno al documento (architettura §9.6, `downgradeToV2`) non c'è (sviluppo, «Cosa resta» 6). Con il merge il pulsante arriva in produzione, dove c'è il viaggio reale. Correzione: conferma esplicita con le conseguenze (altri dispositivi da aggiornare, backup consigliato) **e** pulsante nascosto finché Filippo non approva (es. visibile solo con `VITE_PASSAGGIO_RIGHE=manuale|auto`), oppure ritorno al documento scritto e provato.

### Importanti
- **I1** `verify/e2e/sync.cjs` non ermetico: FAIL intermittente preesistente (§1). Bloccare Norges Bank/SSB nel test.
- **I2** Allegati mai provati contro lo Storage vero: forma della risposta «già esistente», link firmati, `attachments_usage`. Inoltre «già esistente» vale come riuscito senza controllare la dimensione, come chiedeva l'architettura §6 (`src/services/storage/attachmentsCloud.ts:32`).
- **I3** Percorso del file con l'utente che carica (`session.userId`, `src/state/attachmentsSync.ts`, in `uploadPending`) invece del proprietario del viaggio, come chiede l'architettura §6. Oggi coincidono; con i membri (`trip_members`) il caricamento verrebbe rifiutato.
- **I4** Criterio 12 parziale (vedi sopra) e parti del design non fatte, elencate dallo sviluppatore: filtro e gruppi per nazione, «Cambi usati», carburante per nazione, nazione della tappa libera, schermata del primo accesso, riga «Allegati» in «I tuoi dati».
- **I5** `holdForOwner` non mette da parte l'archivio IndexedDB `nfhp-dati` al cambio utente (sviluppo, «Cosa resta» 5). Dati non visibili ad altri, ma la base resta sul dispositivo.
- **I6** Viaggi nuovi creati dalla nuova app nascono «documento»: va convertito anche ciascun viaggio nuovo (spec UC1 si aspetta `trip_countries` subito).

### Minori
- **M1** `sync_push` salta il controllo iniziale se il lotto contiene una riga `trips` (`20261106000400_sincronizzazione.sql`, `v_has_trip_row`). Su un viaggio altrui fallisce con «duplicate key», che però rivela che quell'id esiste (uuid non indovinabili: rischio trascurabile).
- **M2** 7 funzioni SECURITY DEFINER esposte via `/rpc` (§3); `attachments_usage` mostra il totale del bucket di tutti gli utenti.
- **M3** Advisor di performance: 15 chiavi esterne senza indice, policy permissive doppie su `trips`.
- **M4** Il seed toglie le chiavi `null` nei JSONB annidati, `seedBundle` no: i test usano una forma leggermente diversa dal bundle vero (risultato dell'adattatore uguale). Aggiungere un test con le chiavi `null` tolte.
- **M5** Ordine dei luoghi dal bundle per chiave: a parità di punteggio l'ordine di partenza del configuratore può cambiare (segnalato dallo sviluppatore).
- **M6** `docs/sviluppo.md` dice ancora NO-1 «in bozza»: ora è pubblicata (2026-11-07). Il bundle pesa 311 kB, non ~200.
- **M7** Blocco JS di 822 kB (avviso di Vite).
- **M8** `.env` è nel repository con URL e chiave pubblica (preesistente; la chiave anon è pubblica per natura, ma conviene `.env.local`).
- **M9** Auth: protezione dalle password compromesse disattivata (impostazione del progetto).
- ~~**M10** Processo: uso di `norway-planner` come banco di prova~~ — chiuso: approvato da Filippo il 2026-11-06.

## 8. Cosa deve correggere lo sviluppatore prima del merge
1. B1: conferma esplicita e pulsante «Converti» nascosto senza flag; in alternativa, ritorno al documento (§9.6) scritto e provato.
2. I1: rendere `sync.cjs` ermetico (bloccare `data.norges-bank.no` e `data.ssb.no`), così il controllo «viaggio vuoto» non dipende dalla rete.
3. Consigliati nello stesso giro: I2 (controllo della dimensione su «già esistente»), I3 (proprietario del viaggio nel percorso), M4, M6.

## 9. Cosa deve fare Filippo
1. ~~Confermare l'uso di `norway-planner` come banco di prova (M10)~~: approvato il 2026-11-06.
2. Prova con l'account reale **senza convertire**: build del ramo con `.env.local`, accesso, «Nazioni e cataloghi» = Norvegia versione 1 scaricata, catalogo con 82 luoghi, nessun avviso. Poi modificare una nota dall'app di oggi e verificare «Salvato nel cloud» (coesistenza).
3. Allegati: dopo la conversione, provare una foto < 10 MB, un file > 10 MB e un SVG (attesi: caricata, rifiutato, rifiutato).
4. **Approvazione separata del passaggio del viaggio reale** (punto 5 del piano), solo dopo B1. Prima: export del backup JSON e annotazione di `md5(data::text)` (oggi `f4f3130ae0402fdfb5c8d89c6dd3623d`). Aggiornare l'app su tutti i dispositivi prima di convertire. Dopo: `storage_format = 'righe'`, `trip_imports.status = 'verificata'`, md5 di `data` invariato.
5. Facoltativo: attivare la protezione dalle password compromesse in Auth (M9).

## 10. Note sulla revisione
- File scritto: solo `docs/review.md`. Nessun commit o push, nessun file dell'app modificato. Il worktree temporaneo di `main` (cartella dello scratchpad) è stato rimosso (`git worktree list`: solo il ramo).
- La copia del documento reale usata per §5 era nello scratchpad della sessione ed è stata cancellata a fine prova.
- Le prove con un «secondo utente» usano un uuid inventato nei claims. Non sostituiscono la prova con un secondo account vero (spec criterio 10).

---

# Seconda revisione (2026-11-08)

Secondo giro dello sviluppatore (`docs/sviluppo.md`, «Secondo giro»). Stessi vincoli della prima revisione: sul database solo letture e blocchi annullati, nessuna modifica al codice dell'app.

## Esito: **APPROVATO CON RISERVE**, nessun problema bloccante per il merge su `main`

B1 è chiuso. Il ritorno al documento funziona sul database vero (provato su una copia del viaggio reale con id diverso). `sync.cjs` ora è ermetico. Le riserve restano sotto «Importanti», più due punti nuovi (R2-1, R2-2), nessuno bloccante.

## Controlli

| Controllo | Esito |
|---|---|
| `npm run typecheck` / `npm run lint` | OK / OK |
| `npm test` | OK, 223/223 |
| `npm run build` | OK (avviso: blocco JS oltre 500 kB) |
| `e2e.cjs` · `planning.cjs` · `cosafare.cjs` | 60 · 16 · 30 OK, 0 FAIL |
| `sync.cjs` × 5 | **16 OK ogni volta**, 0 FAIL (richieste: POST 1, PATCH 3 ogni volta) |
| `righe.cjs`, build normale | 3 OK: viaggio aperto, **nessun pulsante di conversione**, nessuna conversione possibile; il resto dichiarato «SALTATO» |
| `righe.cjs`, build con `VITE_PASSAGGIO_RIGHE=pulsante` | 34 OK, 0 FAIL (8 invii `sync_push`); dopo, `dist/` ricostruita senza la variabile |
| `a11y.cjs` | intermittente: 34 OK in 2 esecuzioni su 4, 1–3 FAIL nelle altre («contrasto 1.00» sulle schede «Itinerario/Prenotazioni/Giornate/Budget» a 1440 px). **Preesistente**: su `main` (worktree temporaneo, poi rimosso) 3 esecuzioni su 5 con lo stesso FAIL. Il contrasto viene misurato mentre il colore della scheda sta ancora cambiando. Difetto del test, non dell'interfaccia |

## B1: chiuso
- `src/state/conversionMode.ts`: solo `pulsante` o `auto` attivano la conversione; vuoto o qualsiasi altro valore vale `nascosto`.
- `FormatPanel.tsx:19` non mostra il pannello se la modalità è `nascosto` (resta solo lo stato di un viaggio già convertito).
- `cloudSync.tsx:585`: anche `convertToRows` esce subito se la modalità è `nascosto` (la conversione si rifiuta senza la variabile, non solo il pulsante sparisce). Il passaggio automatico (`:622`) solo con `auto`.
- Conferma esplicita con conseguenze e backup: verificata da `righe.cjs` con la build `pulsante`.
- `.env` (tracciato) non imposta la variabile. **Da ricordare**: non impostarla nelle variabili di Vercel prima dell'approvazione.

## Ritorno al documento (§9.6): corretto e sicuro, con due osservazioni
**Riletto**: il passo 1 (`supabase/rollback/20261108_ritorno_documento_esporta.sql`) è una sola SELECT e comprende le righe cancellate. Il passo 2 (`scripts/ritorno-documento.ts`) usa `fromRows`, toglie `lastMutationId`, accetta solo viaggi «righe» con l'id giusto, protegge i dollar-quote. Lo SQL del passo 3, in una transazione:
- `set local nfhp.permetti_documento = 'on'`;
- controllo che il viaggio sia ancora «righe» e che `seq` sia uguale all'esportazione;
- `update` di `data`, `storage_format`, `schema_version`, `title`;
- controllo finale su `data`.

**Prova sul database** in un blocco annullato. Copia del viaggio reale con id `cccccccc-…c0b1`, documento verificato con lo stesso md5 del reale. Lo SQL del passo 3 è stato **generato dallo script vero** ed eseguito così com'è (solo `begin/commit` tolti, `set local` come `set_config(…, true)`):

| Passo | Esito |
|---|---|
| Conversione (43 righe) + modifiche dopo il passaggio (nota della tappa cambiata, voce di budget cancellata) | `applicato` / `applicato`, seq 45 |
| Scrittura di `data` senza permesso | rifiutata dalla guardia («Questo viaggio usa il nuovo formato…») |
| Passo 1 (SQL del repository, ruolo postgres) | formato `righe`, 8 tabelle, seq massimo 45; 28/28 righe invariate ritrovate identiche, nota nuova presente, voce cancellata come tombstone |
| Passo 3 con una scrittura avvenuta dopo l'esportazione | fermato: «Il viaggio è cambiato dopo l'esportazione (seq diverso da 45)»; nessuna modifica, permesso tornato vuoto |
| Passo 3 | 1 riga aggiornata, controllo finale superato, formato `documento`; `data` contiene la nota nuova e 1 sola voce di budget; md5 di `data` uguale al documento atteso calcolato in locale (`50b46028…`); le 25 attività restano nelle tabelle |
| Passo 3 ripetuto | fermato: «non è nel formato a righe» |
| Dopo il ritorno: salvataggio dell'app di oggi (aggiornamento di `data` come proprietario) | riuscito (1 riga) |
| Viaggio reale | md5 `f4f3130ae0402fdfb5c8d89c6dd3623d`, `documento`; dopo la prova nessuna riga rimasta (stops, sync_mutations, trip_sync_state, trip_imports a 0) |

L'app di oggi conserva i campi nuovi del documento (`countries`, …): `migrateDocument` su `main` copia il documento con `...d`.

**Osservazioni (non bloccanti)**
- **R2-1 (importante)** `sync_push` non controlla `storage_format`. Dopo il ritorno al documento, un dispositivo con la build nuova ancora «righe» può scrivere righe e riceve `applicato` (provato), ma quelle scritture non arrivano in `data` e l'app di oggi non le vede. Lo sviluppatore lo evita nel client (controllo del formato prima di ogni invio); manca una difesa sul server. Consiglio: in una migrazione futura, `sync_push` rifiuti i lotti su viaggi `documento`, salvo la creazione di un viaggio nuovo e la conversione in corso. Non serve prima del merge: oggi nessun viaggio è «righe».
- **Minore** Il passo 3 non prende il blocco del viaggio. Un `sync_push` confermato tra il controllo di `seq` e l'`update` sfuggirebbe al controllo (finestra di pochi millisecondi, procedura manuale). Consiglio: `perform pg_advisory_xact_lock(hashtextextended('nfhp.sync:' || id, 0))` all'inizio del blocco `$ritorno$`, come fa `sync_push`.

## Altri punti del secondo giro
| Punto | Esito |
|---|---|
| I1 `sync.cjs` ermetico | chiuso (5/5) |
| I2 «già esistente» con controllo della dimensione | chiuso nel codice (`attachmentsCloud.ts`, `object/info` o `HEAD`); non provato contro lo Storage vero |
| I3 percorso con il proprietario del viaggio | chiuso (`attachmentsSync.ts`: `owner_id` letto da `trips`) |
| I5 `nfhp-dati` al cambio utente | chiuso (`holdStore`/`restoreStore`) |
| I6 viaggi nuovi | cambiato: ora nascono «righe» con il cloud collegato (vedi R2-2) |
| Tappa 7 | in parte: nazione della tappa libera e nella testata, filtro «Nazione» e regioni dal catalogo, «Cambi usati» nel Budget; il resto in `sviluppo.md` «Cosa resta» 2 |

## R2-2 · «Nuovo viaggio vuoto» crea un viaggio a righe anche senza la variabile: **importante, non bloccante**
Che cosa succede (`SettingsView.tsx:177-179`): con il cloud collegato il viaggio nuovo viene segnato «righe» e il primo invio crea in `trips` una riga con `data` = `{"schemaVersion":3,"formato":"righe"}`.

Valutazione per l'app di oggi sugli altri dispositivi:
- **Il viaggio reale non è toccato**: id diverso, nessuna conversione; la guardia impedisce all'app di oggi di scrivere `data` sul viaggio nuovo.
- Un dispositivo con l'app di oggi che **ha già il viaggio reale** continua a lavorare come prima.
- Un dispositivo con l'app di oggi **vuoto** (primo accesso) apre il viaggio più recente del cloud, che sarebbe quello nuovo: `FutureSchemaError` («versione più recente»), nessuna sovrascrittura. L'utente deve scegliere il viaggio reale da «Viaggi salvati nel cloud»: è un fastidio, non una perdita di dati.
- La creazione di un viaggio a righe usa `sync_push` in produzione prima dell'approvazione del passaggio (punto 5 del piano), ma solo su un viaggio nuovo e vuoto.

Conclusione: non è bloccante per il merge, perché nessun dato esistente è a rischio. Consiglio però allo sviluppatore, per coerenza con B1, di legare anche questo comportamento alla variabile: con `nascosto` il viaggio nuovo nasce «documento», come sull'app di oggi. In alternativa Filippo deve sapere di non usare «Nuovo viaggio vuoto» finché tutti i dispositivi non hanno la nuova app.

## Cosa resta prima del merge
Nessun bloccante. Consigliati (non obbligatori): R2-2 legato alla variabile; blocco del viaggio nel passo 3; `a11y.cjs` che aspetti la fine della transizione prima di misurare il contrasto.

## Cosa deve fare Filippo
1. Non impostare `VITE_PASSAGGIO_RIGHE` né in `.env` né su Vercel finché non approva il passaggio del viaggio reale.
2. Finché c'è un dispositivo con l'app di oggi, non usare «Nuovo viaggio vuoto» (R2-2), a meno che lo sviluppatore non lo leghi alla variabile.
3. Prova con l'account reale senza convertire (catalogo NO-1, coesistenza con l'app di oggi), come nella prima revisione §9.
4. Approvazione separata del passaggio del viaggio reale: backup JSON, md5 annotato (`f4f3130ae0402fdfb5c8d89c6dd3623d`), nuova app su tutti i dispositivi, build con `VITE_PASSAGGIO_RIGHE=pulsante`. Tenere pronta la procedura di ritorno (`docs/sviluppo.md`, «Ritorno al documento»).
5. Dopo il passaggio: prova degli allegati (foto < 10 MB, file > 10 MB, SVG).

Note: file scritto solo `docs/review.md`; nessun commit. Il worktree temporaneo di `main` è stato rimosso e i file con la copia del viaggio reale nello scratchpad sono stati cancellati. `dist/` è ricostruita senza la variabile.

---

# Terza revisione (2026-11-08)

Terzo giro (`docs/sviluppo.md`, «Terzo giro»): su richiesta di Filippo, anche la creazione di viaggi nuovi nel formato a righe dipende da `VITE_PASSAGGIO_RIGHE` (`newTripInRows`). Stessi vincoli: database solo in lettura, codice dell'app non modificato.

## Esito: **APPROVATO CON RISERVE**, nessun bloccante. R2-2 chiuso.

## Senza la variabile nessun percorso crea o converte un viaggio a righe
Ho cercato in `src/` tutti i punti che segnano un viaggio come «righe» (`markRowsTrip`), inviano con `sync_push` (`pushRows`, `importTrip`, il trasporto `sync_push`) o creano viaggi:

| Punto | Comportamento senza variabile |
|---|---|
| `SettingsView.tsx:180` «Nuovo viaggio vuoto» | `newTripInRows(cloudOn)` è falso con `nascosto`: il viaggio nasce «documento» |
| `cloudSync.tsx:585` `convertToRows` (pulsante, «Riprova», `FormatPanel.tsx:69/102`) | esce subito con `nascosto`; il pannello non è mostrato (`FormatPanel.tsx:19`) |
| `cloudSync.tsx:622` passaggio automatico | solo con `auto` |
| `cloudSync.tsx:598` dopo `importTrip` | raggiungibile solo da `convertToRows` |
| `cloudSync.tsx:449`, `:489`, `:716` | seguono un viaggio che **nel cloud è già** «righe» (aperto da un altro dispositivo con la variabile); non creano né convertono |
| `pushRows` (`:377`, `:556`) | solo se il viaggio è già segnato «righe» |
| `sync_push` lato server, viaggio nuovo | chiamato solo da `pushRows`/`importTrip`, quindi mai senza variabile |

Nella `dist/` finale (build senza variabile) l'oggetto `import.meta.env` contiene solo `BASE_URL`, `DEV`, `MODE`, `PROD`, `SSR` e le due variabili Supabase. `VITE_PASSAGGIO_RIGHE` è assente, quindi la modalità vale `nascosto`.

Resta valido R2-1 (seconda revisione): `sync_push` lato server non controlla `storage_format`. Senza variabile l'app non lo chiama, quindi non c'è rischio pratico; resta un miglioramento per una migrazione futura.

## Controlli
| Controllo | Esito |
|---|---|
| `npm run typecheck` / `npm run lint` | OK / OK |
| `npm test` | OK, 224/224 (in più: `newTripInRows`) |
| `npm run build` | OK (avviso dimensione del blocco JS) |
| `e2e.cjs` · `planning.cjs` · `cosafare.cjs` · `a11y.cjs` · `sync.cjs` | 60 · 16 · 30 · 34 · 16 OK, 0 FAIL (`a11y` resta intermittente e preesistente, vedi seconda revisione; questa volta è passato) |
| `righe.cjs`, build normale | 8 OK, 0 FAIL: nessun pulsante, nessuna conversione; **viaggio nuovo salvato come documento con la nazione nel documento; nessun `sync_push`**; viaggio precedente intatto (il resto è «SALTATO» e lo dichiara) |
| `righe.cjs`, build `VITE_PASSAGGIO_RIGHE=pulsante` | 34 OK, 0 FAIL (8 invii `sync_push`) |
| `dist/` finale | ricostruita senza variabile (verificato nel bundle) |

## Viaggio reale
`public.trips`: 1 riga, 0 viaggi «righe», impronta `f4f3130ae0402fdfb5c8d89c6dd3623d`, formato `documento`; `stops`, `sync_mutations`, `trip_imports` vuote.

## Cosa resta
Nessun bloccante. Restano i consigli non obbligatori:
- R2-1: controllo di `storage_format` in `sync_push`, in una migrazione futura;
- blocco del viaggio nel passo 3 del ritorno;
- `a11y.cjs` che aspetti la fine della transizione;
- le riserve «Importanti» della prima revisione ancora aperte (allegati con lo Storage vero, parti del design, tipi `Region`/`CoastalOperator`).

Per Filippo valgono i passi della seconda revisione, tranne il punto 2 (non usare «Nuovo viaggio vuoto»): non serve più finché la variabile non è impostata.

# Revisione Trasporti via mare (2026-11-09)

Commit `28b773d` sul ramo `feature/trasporti-mare` (`git diff main...feature/trasporti-mare`, 39 file). Letti: piano, spec,
design, architettura §16, `ricerca-traghetti.md/.json`, `sviluppo.md` «Trasporti via mare». Nessun codice dell'app
modificato, nulla applicato al database, nessun commit.

## Esito: **NON APPROVATO** — un solo bloccante (B1), correzione piccola; corretto B1 l'esito diventa APPROVATO CON RISERVE.

## Problemi bloccanti

**B1 — Il costo salvato del traghetto non si aggiorna e non avvisa quando cambiano data o famiglia: Budget e
«Come è calcolato» mostrano due numeri diversi.**
- `src/domain/ferries.ts:765` scrive `seg.cost` una volta sola, all'«Applica»; `src/domain/budget.ts:212-221` usa quel valore.
- `src/ui/Ferries.tsx:811` ricalcola il conto (`segmentCost`, con la data del collegamento e i partecipanti di oggi) e
  `Ferries.tsx:820` mostra il totale salvato sopra la tabella ricalcolata, senza confronto né avviso.
- Scenario (le date del viaggio NON sono decise, CLAUDE.md): Tromsø → Harstad senza auto aggiunto quando il
  collegamento cade di mercoledì = 1469 NOK. Si sposta la partenza di un giorno e il collegamento cade di sabato: il
  Budget resta 1469, «Come è calcolato» dice 277 × 2 + 154 + 0 = 708. Succede lo stesso se cambia l'età di un bambino
  (soglia dei 6 anni), se cambia il numero di adulti, se si passa dall'alta alla bassa stagione (Bergen–Flåm 18/5–31/8)
  o se arriva una nuova versione del catalogo. Contraddice il criterio «si vede da dove viene ogni parte del costo» e
  porta nel Budget un importo sbagliato senza segnalarlo.
- Correzione minima: se `!seg.costByUser` e il totale ricalcolato è diverso da `seg.cost` (o cambia la calcolabilità),
  mostrare nel blocco del tratto e nel dettaglio del Budget «Il conto è cambiato: X → Y · Aggiorna» (stessa azione di
  `backToCalc`), senza aggiornare in silenzio i tratti «prenotato»/«pagato». Aggiungere un test di dominio sul caso del sabato.

## Riserve non bloccanti

1. **Cambio di opzioni su un tratto «prenotato/pagato»** (`ferries.ts:756-766`): lo stato resta «prenotato/pagato» ma
   l'importo viene ricalcolato con le nuove scelte (auto, imbarco). Meglio tenere anche l'importo, o chiedere conferma.
2. **Link alle fonti senza filtro** (`Ferries.tsx:408`): `href={s.url}` diretto, mentre il resto dell'app usa
   `externalHref` (`src/domain/lodging.ts:52`). Oggi non è sfruttabile (36 fonti tutte `https://`, il CHECK SQL accetta
   solo `^https?://`), ma il requisito è «solo https»: usare `externalHref` e restringere il CHECK di
   `ferry_sources.url` a `^https://`. `rel="noreferrer"` implica `noopener`: va bene. Nessun `dangerouslySetInnerHTML`;
   i testi delle fonti sono resi come testo. Il link inserito con «Ho trovato il prezzo» passa da `externalHref` (sicuro).
3. **Spec §8 diversa dal codice su Eidsdal → Linge senza auto**: la spec dice 0, il codice dice «non calcolabile»
   (la fonte non scrive la regola dei passeggeri, design DU9). La scelta del codice è la più prudente: allineare la spec.
4. **Ordine di pubblicazione**: l'app contiene già NO-2 nei file e senza collegamento al cloud si può passare a NO-2.
   Se poi si accede prima che NO-2 sia pubblicata sul server, il download della nazione fallisce. Applicare migrazione +
   seed v2 **prima** della pubblicazione su `main` (o insieme).
5. **`catalog_bundle('NO-1')`**: le chiavi esistenti restano identiche, ma il risultato ha 5 chiavi nuove `ferry_*` = `[]`.
   L'adattatore le tratta come facoltative (test) e le copie offline vecchie restano valide: nessun effetto pratico.
6. **Fonte Torghatten Bodø–Moskenes** (letta oggi): 605 per l'auto fino a 6 m, plassgaranti 65/35/130 e passeggeri
   gratis sono confermati; la pagina però non dice né l'anno dei prezzi né «conducente incluso». Nel catalogo risultano
   `2026` e `driverIncluded: true`: nessun effetto sul conto (passeggeri gratis; 2026 ≠ 2027 → «da verificare»), ma
   l'anno andrebbe annotato come dedotto.
7. Minori: `ferryCost` usa `2027` fisso se manca l'anno del viaggio (`ferries.ts:229`); la fascia d'età del biglietto
   famiglia è presa dalla prima voce «bambino» senza filtro di periodo o sottotratta (`ferries.ts:448`; oggi le età
   coincidono); una tariffa pubblicata solo nel verso B→A non vale mai per A→B (`ferries.ts:245`, scelta prudente);
   per Bergen–Flåm manca il senior fuori stagione (999), che non serve per questa famiglia.

## Verifiche fatte

**Dati** — `scripts/build-ferry-routes.ts` rieseguito in memoria su `docs/ricerca-traghetti.json`: tratte e fonti
**identiche** a `src/data/ferryRoutes.ts` (58 tratte, 36 fonti, tutte lette il 2026-11-09, tutte `https`). 200 fermate
con coordinate, **tutte con id NSR**. Tariffe: una sola del 2027 (Bergen–Flåm) «confermata»; tutte le altre (anno 2026,
2026/2027 o senza anno) risultano sempre «da verificare per il 2027» (`priceStatus`); 11 senza prezzo; nessuna voce
`fergeruter` confermata. Campione di 10 tratte letto per intero (Bergen–Flåm, Flåm–Gudvangen, Lauvvik–Lysebotn,
Geiranger–Hellesylt, Eidsdal–Linge, Bodø–Moskenes, Bodø–Svolvær, Andenes–Gryllefjord, Tromsø–Harstad con sottotratte).
Fonti primarie lette oggi:
- Fjord1 Bergen–Flåm 2027: adulto 1449 / 1349, bambino 6–17 719 / 649, 0–5 gratis, famiglia 3299 / 3099, alta
  stagione 18/5–31/8, tetto di 209 per bambino con adulto pagante, 08:00 → 13:40 = 5 h 40 → **tutto coincide**.
- Fjord1 Geiranger–Hellesylt 2026 (PDF): adulto 420, bambino 210, sotto i 4 anni gratis, auto fino a 6 m con conducente
  810, pacchetto auto + conducente + 4 persone 1650, ritorno −50% → **coincide**.
- Svipper linea 2 (PDF, dal 1/2/2026): Tromsø–Harstad 630 / giovane 377 / bambino 209, sabato 277 / 154,
  Tromsø–Finnsnes 295 / 98, Finnsnes–Harstad 381 / 126 → **coincide**.
- Torghatten 18-782 Bodø–Moskenes: vedi riserva 6.

**Calcoli** (`src/domain/ferries.ts`) — età del viaggio, con avviso a ±1 anno dalla soglia; gratis sotto l'età della
fonte; tetto bambino solo con adulto pagante; auto solo se scelta (`withCar=false` → nessuna voce veicolo); il
conducente incluso toglie un adulto, se la fonte non lo dice → incluso + da verificare; `gratis` = 0, `non_indicata`
senza auto = non calcolabile, con auto = solo l'auto + da verificare; pacchetto e famiglia calcolati a parte, vince il
più basso (a parità il conto per persona); prezzo mancante → nessun totale, mai 0, nel Budget «prezzo da cercare»;
anno ≠ viaggio → mai «confermato». Il tratto traghetto non ha `distanceKm`; la geometria esiste solo tra due moli con
coordinate NSR, disegnata come tratto via mare (nessuna strada); km del Budget non toccati. Gli esempi della spec
sono nei test (1469, 1650, 1990, 3107/3299, 1365, 81, 0/605/735, non calcolabili).

**Compatibilità** — i viaggi senza `countries` restano su NO-1 (`LEGACY_COUNTRY` invariato; `FILE_COUNTRY` = NO-2 non
si applica ai viaggi vecchi) e non vedono tratte; crociere invariate (`CoastalView` dentro `SeaView`, e2e «come
prima»); `upgradeCatalog` cambia solo `releaseId` della nazione, con conferma e «Annulla»; i campi nuovi del `Segment`
e `hiddenFerrySuggestions` finiscono in `extra` (test righe); senza `VITE_PASSAGGIO_RIGHE` nessun viaggio a righe
(`righe.cjs` con la build normale: documento, nessun `sync_push`).

**SQL** — migrazione solo additiva e idempotente (5 tabelle, `if not exists`, nessun DROP di dati), RLS su tutte,
`authenticated` in sola lettura sulle versioni pubblicate o ritirate, `anon` nulla (revoca + controlli finali),
guardie `catalog_child_guard` sulle 5 tabelle, coordinate ammesse solo con `nsr_id` + fonte (CHECK), `catalog_bundle`
con le chiavi di prima invariate. Rollback: si ferma se un viaggio usa NO-2, toglie solo NO-2 e le tabelle `ferry_*`,
ripristina `catalog_bundle` identico a `20261106000100`. Seed rigenerati: v1 e v2 **identici** ai file (a meno dei fine
riga CRLF); v2 controlla che ogni riga di NO-1 sia anche in NO-2 (`except`) e i conteggi.
Database `norway-planner` (solo lettura): solo `NO-1` pubblicata, tabelle `ferry_*` assenti, `trips` tutti in formato
`documento` e nessuno con `countries` → nulla applicato, il viaggio reale resta su NO-1.

**Sicurezza** — nessun segreto nel diff; per i link vedi la riserva 2.

## Comandi

| Comando | Esito |
|---|---|
| `npm run typecheck` / `npm run lint` | puliti |
| `npm test` | 255 / 255 |
| `npm run build` | ok |
| `traghetti.cjs` | 64 OK, 0 FAIL |
| `e2e.cjs` · `planning.cjs` · `cosafare.cjs` | 60 · 16 · 30 OK, 0 FAIL |
| `a11y.cjs` | 36 OK, 0 FAIL (anche `#/crociere?parte=traghetti`, 375 px) |
| `sync.cjs` | 16 OK, 0 FAIL |
| `righe.cjs` build normale / `VITE_PASSAGGIO_RIGHE=pulsante` | 8 OK / 34 OK, 0 FAIL |
| `dist/` finale | ricostruita senza variabili |

## UX (375 px, controllo a mano)
Scheda Traghetti con nota, riepilogo (1 · 46 · 11), ricerca e «Filtri» raccolti, nessuno scorrimento orizzontale; con
il viaggio su NO-1 un messaggio chiaro e «Vai a Nazioni e cataloghi»; dialogo di passaggio a NO-2 chiaro, con Annulla;
scheda Bergen → Flåm (durata, stagione e frequenza con stato, tappe, nessun «Prenota»); passo «Aggiungi al percorso»
con collegamento, imbarco e sbarco, auto disattivata se la tratta non porta veicoli, azioni fisse in basso. Nessun
errore JavaScript.
