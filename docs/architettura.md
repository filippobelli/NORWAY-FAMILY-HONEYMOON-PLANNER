---
type: architettura
created: 2026-11-06
piano: docs/piano-2026-11-06-database.md
spec: docs/spec.md (approvata, D1–D5)
design: docs/design.md (approvato, dubbi §10 risolti)
stato: in attesa di approvazione (punto 4 del piano: prima di applicare le migrazioni)
---

# Architettura dati · Tutti i dati nel database, catalogo per nazione

Documento dell'architetto-dati. Nessuna migrazione è stata applicata. Nessuna chiamata a Supabase.

**Cambio del 2026-11-06**: il progetto di prova `norway-planner-prova` non è più utilizzabile. Le migrazioni si provano su **`norway-planner`**, che contiene i dati reali. Per questo:
- ogni migrazione è **solo additiva** e idempotente: nessun drop, truncate o modifica distruttiva su `trips`, sulla colonna `data`, su `auth` o su `private.allowed_emails`;
- la prima migrazione copia `trips` in `private.trips_backup_20261106`;
- i trigger nuovi su `trips` non fanno nulla sui viaggi nel formato attuale: l'app di oggi continua a funzionare uguale;
- il ritorno indietro è uno script separato che toglie solo gli oggetti nuovi (§12).

## File prodotti

| File | Cosa fa |
|---|---|
| `supabase/migrations/20261106000000_copia_sicurezza.sql` | Copia di `trips` in `private.trips_backup_20261106` (se non esiste) |
| `supabase/migrations/20261106000100_catalogo.sql` | Nazioni, versioni del catalogo, luoghi, testi, fonti, operatori, crociere, porti, collegamenti; guardie di immutabilità; `catalog_bundle()` |
| `supabase/migrations/20261106000200_viaggio.sql` | Colonne nuove su `trips`; tabelle del viaggio, di preferenze, contesto e dispositivi; colonne di sincronizzazione |
| `supabase/migrations/20261106000300_rls.sql` | Funzioni di accesso, policy aggiuntive su `trips`, RLS e permessi di tutte le tabelle nuove |
| `supabase/migrations/20261106000400_sincronizzazione.sql` | Timbri `rev`/`seq`, guardia su `trips`, `sync_push`, `sync_pull` |
| `supabase/migrations/20261106000500_storage.sql` | Bucket privato `diario-allegati` con limiti, policy, spazio usato |
| `supabase/rollback/20261106_annulla_database_multinazione.sql` | Ritorno indietro: toglie solo gli oggetti nuovi |
| `scripts/seed-catalog.ts` | Genera il seed di una nazione dai file dell'app (modello per le nazioni nuove) |
| `supabase/seed/catalogo-norvegia-v1.sql` | Seed generato: Norvegia, versione 1 |

## 1. Decisioni principali

1. **Il viaggio vive per righe**, una tabella per ogni entità che si modifica da sola o si interroga; JSONB solo per valori che si leggono e scrivono sempre interi (§3).
2. **Versioni del percorso come righe con `version_id`**: tappe, tratti, segmenti, giornate, attività, voci di budget e voli hanno la versione nella chiave. Cambiare versione attiva = cambiare `trips.active_version_id`, non copiare blocchi.
3. **Concorrenza per riga con `rev`** (versione della riga, +1 a ogni scrittura) e **ordine con `seq`** (contatore per viaggio, assegnato sotto blocco: segue l'ordine di conferma). Niente confronto di orari.
4. **Un'unica RPC di scrittura, `sync_push`**: lotto tutto-o-niente, conflitti per riga, identificativo dell'invio registrato in `sync_mutations` (un reinvio non scrive due volte). Lettura con `sync_pull` dopo un `seq` noto.
5. **Cancellazioni come tombstone** (`deleted_at`): nessun DELETE dal client, nessuna eliminazione silenziosa.
6. **Catalogo versionato e immutabile**: `catalog_releases` per nazione; dopo la pubblicazione i trigger rifiutano modifiche. Il viaggio fissa la versione in `trip_countries.release_id`.
7. **Nessuna chiave esterna dal viaggio al catalogo**: `place_key` resta testo. Il viaggio sopravvive a qualsiasi catalogo e un riferimento mancante si elenca, non blocca.
8. **Coesistenza con l'app attuale**: `trips.storage_format` = `documento` (oggi) o `righe` (dopo il passaggio). La colonna `data` resta come copia; su un viaggio a righe le scritture del documento sono rifiutate con un messaggio chiaro.

## 2. Catalogo (sola lettura, versionato)

| Tabella | Chiave | Contenuto | Perché così |
|---|---|---|---|
| `countries` | `code` (ISO 3166 alfa-2) | nome, altri nomi, valuta ISO 4217, fuso IANA, lingua BCP 47 | valuta, fuso e lingua vengono dalla nazione (spec §5) |
| `catalog_releases` | `release_id` = `{code}-{versione}` (es. `NO-1`) | stato `bozza`/`pubblicata`/`ritirata`, data delle fonti, note, parametri di stima (fattore strada, km/h, raggio aeroporti), versione precedente | chiave leggibile e deterministica: seed ripetibile; parametri per versione perché possono cambiare con i dati |
| `place_keys` | `place_key` | nazione della chiave | una chiave appartiene a una sola nazione in tutte le versioni: unicità globale senza prefissi obbligatori per la Norvegia |
| `regions` | (`release_id`, `region_key`) | nome, testi, confini (`areas` JSONB), fonti | i confini servono solo alla mappa e si leggono interi |
| `places` | (`release_id`, `place_key`) | categoria, regione, coordinate e stato, durata, difficoltà, idoneità bambini, base per dormire, visita in giornata, IATA, sito ufficiale, Wikidata/Wikipedia/Commons, scheda verificata | tutto in colonne: filtri del catalogo e del configuratore interrogabili |
| `place_texts` | (`release_id`, `place_key`, `lang`) | nome, descrizione, accesso, stagione, avviso di agosto, quartiere, note di prenotazione, stagionalità, fuori città | testi per lingua; `it` obbligatorio per pubblicare (controllo nel seed) |
| `place_sources` | (`release_id`, `place_key`, `field`, `position`) | fonte, URL, data di verifica, licenza, metodo, nota | fonti **per campo** (`coordinate`, `scheda`, `sito_ufficiale`, `wikidata`, `testi`) come chiede il criterio 8 |
| `operators` | (`release_id`, `operator_key`) | nome (come nei viaggi), tipo, fonti, fatti per lingua | pochi, letti interi: fonti e testi in JSONB |
| `voyages` | (`release_id`, `voyage_key`) | operatore, direzione, porti (nome e chiave), giorni, scali, pasti, prezzi pubblicati (JSONB), periodo del prezzo, prezzo estivo sì/no, URL, data | `voyage_key` = id attuale (`CoastalOption.catalogId`) |
| `route_ports` | (`release_id`, `route_key`, `seq`) | porti in ordine, solo verso nord, stagionale | la rotta costiera come dato, non come costante |
| `place_links` | (`release_id`, `kind`, `from`, `to`) | treni (oggi `RAIL`), etichetta, nota, fonti | coppia non ordinata scritta una volta (ordine per byte) |
| `home_airports` | `iata` | aeroporti di partenza da casa, ordine dei predefiniti | dato globale, non di una nazione |

**Porti**: luoghi con `category = 'porti'`, chiave `porto-{nome}` (es. `porto-bodo`), coordinate dichiarate approssimative. La categoria nuova va esclusa dal catalogo visibile (sviluppatore).

**Immutabilità**: `catalog_release_guard` permette su una versione pubblicata solo il ritiro e le note; `catalog_child_guard` rifiuta inserimenti, modifiche e cancellazioni nelle versioni non in bozza. Eccezione di manutenzione: `set local nfhp.catalogo_admin = 'on'` (solo da SQL Editor, da documentare se usata). Una versione usata da un viaggio non si cancella: chiave esterna da `trip_countries`.

**Download**: `catalog_bundle(release_id)` restituisce tutta la versione in un JSON (circa 200 KB per la Norvegia, stima dal seed), da mettere nella copia offline.

## 3. Viaggio: tabelle e decisioni tabella / JSONB

Regola: **tabella propria** se l'entità si modifica da sola (quindi può essere in conflitto da sola) o si interroga; **JSONB nella riga del genitore** se è un valore che si legge e si scrive sempre intero e nessuno lo cerca dentro.

| Documento (`Trip`) | Dove | Decisione e motivo |
|---|---|---|
| `id`, `title`, `startDate`, `dateTentative`, `usefulInfo`, `updatedAt`, `schemaVersion` | `trips` (colonne) | dati del viaggio; `updatedAt` dell'app in `app_updated_at` (testo, si ricostruisce identico) |
| `participants` | `trips.participants` JSONB | piccolo, sempre intero, eventuali campi in più restano |
| `settings` | `trips.settings` JSONB | ~20 chiavi lette insieme; l'unione per chiave di `merge.ts` resta uguale. Cambio e carburante escono da qui (righe sotto) |
| `settings.nokPerEur`, `nokRateNote`, `nokRateDate`, `nokRateAuto` | `trip_rates` (una riga per valuta) | multivaluta; regola «vince il più recente» per riga |
| `settings.car.priceNok`, `pricePeriod`, `priceSource`, `priceAuto` | `trip_countries.fuel_*` | prezzo e valuta per nazione (spec §5.1). Tipo e consumo restano in `settings.car` |
| nazioni del viaggio (nuovo) | `trip_countries` | versione del catalogo fissata, ordine |
| `scenarios[]`, `activeScenarioId` | `trip_versions` + `trips.active_version_id` | metadati della versione; il piano è nelle righe con `version_id` |
| `stops[]` | `stops` | `country_code` nuovo (D4); `position` per l'ordine |
| `stops[].ideas[]` | `stop_ideas` | idee per tappa, seguono la versione |
| `legs[]` | `legs` | |
| `legs[].segments[]` | `segments` | traghetti come segmenti separati con attesa, orario, costo |
| `segments[].geometry` | `segments.geometry` JSONB | migliaia di punti letti sempre interi per la mappa; nessuna ricerca dentro |
| `verification`, `source` (ovunque) | JSONB nella riga + colonna generata `verification_state` | si scrivono interi; lo stato resta interrogabile (es. «quante cose da verificare») senza doppioni da sincronizzare |
| `days{}` | `days` (chiave `day_key` = «{stopId}#{notte}») | |
| `days{}.activities[]` | `activities` | `place_key` vuoto = attività personale |
| `budgetItems[]` | `budget_items` | |
| `flights[]` | `flights` | per versione (sono in `PlanSnapshot`) |
| `accommodations[]`, `coastalOptions[]` | `accommodations`, `coastal_options` | condivisi tra le versioni (come oggi) |
| `coastalOptions[].selected` (versione attiva) / `PlanSnapshot.coastalSelected` (altre) | `coastal_options.selected` / `trip_versions.coastal_selected` | stesso significato di oggi |
| `favorites[]` | `favorites` | |
| `actuals.stops`, `actuals.activities` | `visit_states` | fuori dal piano, per elemento |
| `diary[]` | `diary_entries` | `deletedAt` dell'app in `app_deleted_at` (diverso dal tombstone) |
| `diary[].attachments[]` | `diary_attachments` | metadati; il file è nello Storage |
| `planLog[]` | `plan_log` | |
| `lastMutationId` | non più nel documento | sostituito da `last_mutation_id` per riga e da `sync_mutations` |
| campi sconosciuti | `extra` JSONB di ogni riga (e di `trips`) | nessuna perdita, compatibilità con versioni future |

Altre tabelle: `trip_sync_state` (contatore), `trip_members` (predisposta), `sync_mutations` (registro invii), `trip_imports` (passaggio dal documento), `user_preferences`, `user_context`, `user_devices`.

**Convenzioni**:
- **Id dell'app come `text`**: i documenti esistenti possono avere id non UUID («…-cloud» dell'unione del diario, «orfana-N»). `trips.id` resta `uuid`.
- **Date e ore scritte dall'app come `text`** (`startDate`, `createdAt`, `checkedAt`, `at`…): con `timestamptz` cambierebbe il formato e il confronto di uguaglianza fallirebbe. Le colonne di sistema (`updated_at`, `deleted_at`) sono `timestamptz`.
- **Money** in `*_amount numeric` + `*_currency text` (ISO 4217, entrambi presenti o entrambi assenti).
- **Ordine** con `position` per ogni elenco del documento.
- **Chiavi**: piano per versione `(trip_id, version_id, id)` perché `snapshotPlan` copia le tappe con gli stessi id; elementi condivisi `(trip_id, id)`; `favorites (trip_id, place_key)`; `visit_states (trip_id, target_kind, target_id)`.
- **Chiavi esterne solo strutturali** (riga → viaggio, piano → versione, segmento → tratto, attività → giornata, allegato → voce, idea → tappa) con `on delete cascade`. I riferimenti trasversali (`leg.from_stop_id`, `stop.accommodation_id`, `segment.flight_id`, `place_key`) restano liberi come nel documento di oggi: un'incoerenza vecchia non blocca il passaggio.
- **Vincoli** sui valori enumerati dei tipi TypeScript (stati, categorie, modi). Se un documento reale ha un valore fuori elenco, il passaggio di quel viaggio si ferma e lo elenca (§9).

**Viaggio v3 (per lo sviluppatore)**: `schemaVersion: 3` aggiunge `countries[]` (codice, versione, ordine, carburante), `rates{}` per valuta, `stop.countryCode`, stato allegato `nel_cloud`; `v2to3` sposta `nokPerEur`… in `rates.NOK` e il prezzo dell'auto in `countries[NO].fuel`. Serve anche `downgradeToV2()` per il ritorno indietro (§9.6).

## 4. Colonne di sincronizzazione

Su ogni tabella del viaggio (aggiunte dal ciclo in fondo a `..._viaggio.sql`):

| Colonna | Chi la scrive | Uso |
|---|---|---|
| `rev bigint` | trigger (1 all'inserimento, +1 a ogni modifica) | versione della riga: base del controllo dei conflitti |
| `seq bigint` | trigger, dal contatore del viaggio | «cosa è cambiato dopo»: `sync_pull(trip, seq)` |
| `created_at`, `updated_at` | trigger | informazione, mai per i conflitti |
| `updated_by uuid` | trigger (`auth.uid()`) | chi ha scritto |
| `deleted_at timestamptz` | `sync_push` con `op: delete` | tombstone |
| `last_mutation_id uuid` | `sync_push` | riconoscere la propria scrittura se la risposta si è persa |
| `device_id text` | `sync_push` | da quale dispositivo |
| `extra jsonb` | client | campi sconosciuti |

Indice `(trip_id, seq)` su ogni tabella per la lettura delle modifiche.

**Perché `seq` è affidabile**: il trigger incrementa `trip_sync_state.seq` con `insert … on conflict do update`; la riga del contatore resta bloccata fino al commit. Le scritture dello stesso viaggio si mettono quindi in fila e `seq` cresce nell'ordine in cui diventano visibili: chi legge «dopo 120» non perde una riga con `seq` 119 confermata in ritardo. Il costo (una scrittura alla volta per viaggio) è irrilevante per una famiglia.

Su `trips` il timbro vale solo con `storage_format = 'righe'`: sui viaggi di oggi il trigger esce subito.

## 5. Accesso (RLS)

- **Funzioni** `is_trip_owner`, `can_read_trip`, `can_edit_trip`: `security definer`, `search_path = ''`, `stable`, come lo schema attuale. Leggono `trips` e `trip_members` senza ricorsione delle policy. Membro = `accepted_at` valorizzato; modifica solo con ruolo `editore`.
- **`trips`**: le policy esistenti `trips_*_own` non si toccano. Si **aggiungono** `trips_select_member` e `trips_update_member` (si sommano in OR: per il proprietario nulla cambia; oggi nessun membro esiste). La guardia `trips_guard` impedisce il cambio di proprietario.
- **Tabelle del viaggio**: `select` con `can_read_trip(trip_id)`, `insert`/`update` con `can_edit_trip(trip_id)`; **nessun DELETE** (tombstone; le righe spariscono solo con il viaggio, a cascata).
- **Cataloghi**: `select` per `authenticated`; versioni in bozza invisibili; insert/update/delete/truncate revocati.
- **`trip_members`**: lo vedono il membro e il proprietario; lo gestisce solo il proprietario (condivisione non attiva).
- **`user_preferences`, `user_context`, `user_devices`**: solo `user_id = auth.uid()`. `user_context.last_trip_id` si azzera se punta a un viaggio non leggibile.
- **`anon`**: revocato tutto su ogni tabella nuova e sulle funzioni nuove. I permessi esistenti di `trips` non si toccano (nessuna policy per `anon`: non legge nulla già oggi).
- **`sync_push`/`sync_pull`**: `security invoker`, quindi ogni lettura e scrittura passa dalle policy. Solo il timbro e il contatore sono `security definer`.

## 6. Storage degli allegati

- Bucket **privato** `diario-allegati`, `file_size_limit` 10 485 760 byte (10 MB), tipi ammessi `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/heic`, `image/heif`, `application/pdf`. Limiti applicati dal server di Storage (impostazioni del bucket). Elenco esplicito invece di `image/*`: esclude SVG (può contenere script) e non dipende dal supporto dei caratteri jolly (da verificare). L'app deve controllare lo stesso elenco prima di salvare (design §6).
- Percorso **`{owner_id}/{trip_id}/{attachment_id}`**: `owner_id` è il proprietario del viaggio anche quando carica un membro, così i file di un viaggio stanno insieme e lo spazio si conta per account.
- **Policy** su `storage.objects`: lettura con `can_read_attachment`; caricamento con `can_write_attachment`, che richiede la riga `diary_attachments` già sincronizzata e non cancellata; cancellazione con `can_delete_attachment`. **Nessuna policy UPDATE**: un file non si sovrascrive.
- **Niente doppioni**: il nome è l'id dell'allegato. Un reinvio dopo una risposta persa riceve «già esistente»: l'app lo tratta come riuscito se la dimensione coincide, poi scrive `storage_path`, `uploaded_at`, `state = 'nel_cloud'` con `sync_push`.
- **Ordine**: voce e metadati con `sync_push` → caricamento del file → conferma nei metadati. La copia locale (IndexedDB `nfhp-allegati`) resta fino alla conferma.
- **Lettura**: link firmati temporanei (`createSignedUrl` dell'API Storage), mai URL pubblici; il file scaricato resta in cache sul dispositivo.
- **Spazio usato**: `attachments_usage()` restituisce byte dell'utente, byte del bucket e 1 GB (decisione 2 del piano, dubbio §10.2 del design).
- **Cancellazione di una voce**: tombstone della voce e degli allegati con `sync_push`; il file si elimina dallo Storage solo dopo la conferma dell'utente (design §6).

## 7. Sincronizzazione per riga

### 7.1 Sul dispositivo
- **Base**: copia delle righe come le ha confermate il cloud, con `rev` (IndexedDB `nfhp-dati`, archivio `base`).
- **Modifiche da inviare**: non si salva un secondo documento. Si calcola `diff(toRows(documento attuale), base)` per chiave di riga. Il segno `nfhp.sync.pending.<id>` resta in localStorage con `mutationId` e `attempted` (come oggi): è sincrono e sopravvive alla chiusura.
- Ogni modifica dell'utente: salvataggio locale del documento, nuovo `mutationId` nel segno (oggi `enqueue`).

### 7.2 Invio (consigliata la RPC)
`sync_push(p_trip_id, p_mutation_id, p_changes, p_attempted, p_device_id)` invece dell'upsert PostgREST tabella per tabella, perché:
- una sola transazione per lotto: o tutto o niente, il percorso non resta a metà;
- controllo dei conflitti e scrittura sotto lo stesso blocco (`pg_advisory_xact_lock` per viaggio);
- registro dell'invio nella stessa transazione.

Lotto: `[{table, op: 'upsert'|'delete', base_rev, row}]`, al massimo 1000 righe; l'app divide anche per dimensione (le geometrie pesano: soglia consigliata 1 MB per lotto, da verificare con i limiti del server). Righe ordinate per tabella (prima i genitori). Le colonne di sistema e `data` inviate dal client vengono ignorate.

Risposte:
- `applicato`: nuovi `rev` per ogni riga, nuovo `seq`. L'app aggiorna la base.
- `gia_applicato`: lo stesso `p_mutation_id` era già arrivato (risposta persa). Nessuna scrittura; si aggiorna la base con le stesse revisioni.
- `conflitto`: nessuna scrittura. Per ogni riga in conflitto: tipo (`cambiata` o `assente`) e riga del server.

### 7.3 Passi contro i doppioni nei reinvii
1. Prima di inviare, `p_mutation_id` entra in `attempted` (localStorage), come oggi.
2. Stesso `p_mutation_id` già in `sync_mutations` → `gia_applicato`.
3. Modifica successiva con un nuovo id: una riga già scritta da un invio precedente ha `rev` diverso dalla base, ma `last_mutation_id ∈ p_attempted` → non è un conflitto, si scrive.
4. Righe nuove con chiave scelta dal client (id dell'app): un reinvio non crea una seconda riga, al massimo trova la sua.
5. File: nome = id dell'allegato, nessuna sovrascrittura.

### 7.4 Lettura
`sync_pull(p_trip_id, p_since)` restituisce `{seq, righe: {tabella: [...]}}` con tutte le righe cambiate dopo `p_since`, tombstone compresi (funzione `stable`: seq e righe dalla stessa istantanea). Si chiama all'apertura, al ritorno in primo piano, al ritorno della rete e ogni 30 s (come oggi), prima dell'invio.

### 7.5 Conflitti: cosa resta uguale
Unione a tre vie **per riga** (base, qui, cloud):
- riga cambiata solo da una parte → vince quella parte, senza domande;
- uguale sui due lati → nessun conflitto;
- cambiata in modo diverso sui due lati → conflitto con etichetta della riga («Tappa Flåm: 2 notti qui, 3 nel cloud»);
- cancellata da una parte e modificata dall'altra → conflitto (mai cancellazione silenziosa).

Regole speciali, come oggi in `merge.ts`:
- **Ordine delle tappe**: le `position` delle tappe di una versione si confrontano come elenco unico → una sola scelta «Ordine delle tappe».
- **Coerenza del percorso**: dopo l'unione automatica si rieseguono `syncLegs` e i controlli di dominio; se il percorso non torna, i cambi di quella versione diventano un unico conflitto «Percorso, date e scenari» (il gruppo di oggi).
- **Diario**: voci nuove si sommano; stessa voce modificata in due modi → si tengono entrambe (`{id}-cloud`, regola attuale).
- **Stati di visita**: per elemento (già righe).
- **Impostazioni**: per chiave dentro `settings`; cambio (`trip_rates`) e carburante (`trip_countries.fuel_*`): vince quello con `fetched_at` più recente, senza conflitto (oggi `AUTO_SETTINGS`).
- **Preferiti**: righe. Una rimozione da una parte senza modifiche dall'altra ora si applica (oggi l'unione la annullava).
- Dialogo di scelta invariato (`qui` / `cloud` per voce); copia locale prima di applicare le scelte (`nfhp.sync.copia.<id>`). Dopo la scelta: base = righe del server viste, nuovo invio con le scelte.

`mergeTrips`/`resolveConflicts` restano per i documenti (file JSON, viaggio solo locale) e come rete di sicurezza; la versione per righe va in un modulo nuovo di dominio, testato con gli stessi casi.

### 7.6 Preferenze, contesto, dispositivi
Upsert PostgREST diretto (`on_conflict=user_id` o `user_id,device_id`), ultima scrittura vince: sono dati di lavoro, un conflitto non ha senso. La modalità pianificazione/viaggio è per utente e dispositivo (`user_devices.mode`, D2; `device_id` generato e salvato in localStorage).

## 8. Copia offline

| Cosa | Dove | Formato |
|---|---|---|
| Viaggio aperto | localStorage `nfhp.trip.v1` (come oggi) + backup | documento `Trip` v3 ricostruito dalle righe: il dominio non cambia |
| Base del cloud (righe con `rev`) e `seq` noto | IndexedDB `nfhp-dati`, archivi `base` e `meta` | righe JSON per chiave |
| Segno delle modifiche (`mutationId`, `attempted`) | localStorage `nfhp.sync.pending.<id>` | come oggi |
| Cataloghi delle nazioni del viaggio | IndexedDB `nfhp-dati`, archivio `cataloghi`, chiave `release_id` | risultato di `catalog_bundle` |
| Preferenze, contesto, modalità | localStorage (copia) | ultima versione letta |
| Allegati non caricati / in cache | IndexedDB `nfhp-allegati` (esistente) | Blob per id |

IndexedDB per base e cataloghi: localStorage ha spazio limitato (alcuni MB, dipende dal browser) e ospita già viaggio e backup con le geometrie. Se IndexedDB manca, la base non c'è e i conflitti si risolvono a mano (comportamento di oggi). Al cambio utente, `holdForOwner` deve includere anche le chiavi di IndexedDB per quell'utente (spec UC11).

## 9. Passaggio dal JSONB attuale

### 9.1 Dove si esegue
**Sul dispositivo, al primo avvio della nuova app** (consigliato): lo stesso codice `toRows` usato dalla sincronizzazione, testato; nessun codice di conversione duplicato in SQL. In alternativa, lo stesso codice come script Node (`npx tsx`) con la chiave di servizio, eseguito da deploy-ops su una copia esportata o sul server (la chiave non va nel repository).

### 9.2 Algoritmo (per viaggio, idempotente)
1. Se il dispositivo ha modifiche in coda (`nfhp.sync.pending`), le invia **con il flusso di oggi** (documento intero). Senza rete: la conversione aspetta e il viaggio resta usabile in locale con la coda (design §7).
2. Legge `trips` (`data`, `updated_at`, `storage_format`). Se `storage_format = 'righe'`: già fatto, si passa al punto 9.
3. Se `schemaVersion` del documento è più recente dell'app: si ferma (regola di `migrations.ts`).
4. `normalizeTrip` → `v2to3` (nazione NO, versione `NO-1`, cambio NOK, carburante).
5. Registra `trip_imports` (`in_corso`, `source_updated_at`, hash SHA-256 di `data`).
6. `toRows(doc)`; elenca i riferimenti al catalogo non trovati in `NO-1` (`destinationId`, `ideas`, `favorites`, `catalogId`) in `trip_imports.unresolved`, senza scartarli.
7. Legge le righe già presenti (`sync_pull(trip, 0)`: vuoto al primo giro, piene se un tentativo precedente si è fermato) e invia le righe con `sync_push` in lotti con `op: upsert`, `base_rev` = `rev` della riga già presente (nullo se assente) e `p_attempted` con gli id dei lotti già inviati. Una ripetizione non crea doppioni: le chiavi sono quelle del documento e una riga scritta da un lotto di questa conversione non è un conflitto. Righe presenti che il documento non ha più: `op: delete`. La riga `trips` si invia con `storage_format = 'documento'`.
8. **Verifica**: `sync_pull(trip, 0)` → `fromRows` → `canonical(...)` uguale a `canonical(v2to3(normalizeTrip(data)))`. Se diverso: `trip_imports.status = 'fallita'` con le differenze, il viaggio resta `documento`, nulla si cancella.
9. Ultimo lotto: riga `trips` con `storage_format = 'righe'`, `imported_at`; `trip_imports.status = 'verificata'`. Da qui l'app attuale non può più scrivere `data` (messaggio chiaro).
10. Sul dispositivo: base = righe lette; il documento locale resta come copia di sicurezza (`nfhp.trip.v1.backup`).

Controllo di concorrenza: se tra il punto 2 e il 9 `trips.updated_at` cambia (un dispositivo con l'app vecchia ha salvato), il punto 9 si annulla e si ricomincia dal 2 (si riscrivono le stesse chiavi, con `p_attempted`).

### 9.3 Uguaglianza
`canonical` ordina le chiavi degli oggetti e tratta come uguali solo «elenco facoltativo assente» ed «elenco vuoto» dove il significato è lo stesso (`ideas`, `attachments`, `keptIssues`, `diary`, `planLog`). `PlanSnapshot.flights` assente e vuoto hanno significato diverso: si conserva con `trip_versions.plan_has_flights`. Tutto il resto deve essere identico, campi sconosciuti compresi (`extra`). Test su una copia esportata di `trips.data` prima di toccare il cloud (spec UC5, criterio 2), poi sul viaggio vero.

### 9.4 La colonna `data`
Resta com'era al passaggio (copia), più la copia completa in `private.trips_backup_20261106`. Non si aggiorna a ogni modifica (raddoppierebbe il traffico e riporterebbe l'invio del documento intero). Un viaggio nuovo creato dalla nuova app ha in `data` un segnaposto `{"schemaVersion": 3, "formato": "righe"}`: l'app vecchia lo rifiuta come «versione più recente» senza sovrascrivere.

### 9.5 Rischi della coesistenza
Un dispositivo con l'app vecchia vede il viaggio com'era al passaggio e non può più salvarlo («ricarica la pagina per aggiornare l'app»): le sue modifiche restano nella sua coda locale, non si perdono. Prima del passaggio conviene aprire la nuova app su tutti i dispositivi (il service worker aggiorna l'app all'apertura).

### 9.6 Ritorno al documento (per un viaggio)
Script con la nuova app (o `npx tsx`): `sync_pull` → `fromRows` → `downgradeToV2` → in una transazione `set local nfhp.permetti_documento = 'on'; update trips set data = …, storage_format = 'documento' where id = …`. Il documento contiene anche le modifiche fatte dopo il passaggio. Poi si può eseguire lo script di ritorno indietro (§12.6). Se le righe fossero illeggibili, resta `data` del passaggio e la copia privata; le modifiche successive sono anche nella copia locale del dispositivo.

## 10. Cataloghi

- **Da file a versione**: `scripts/seed-catalog.ts` legge i dati della nazione, produce un SQL che crea la versione in bozza, ne scrive il contenuto, la pubblica e controlla i conteggi. Il file è deterministico e idempotente.
- **Il viaggio la fissa**: `trip_countries.release_id`. L'app scarica `catalog_bundle(release_id)` e non guarda le versioni più recenti, se non per mostrare «versione N+1 disponibile» (design §3): `select max(version) from catalog_releases where country_code = … and status = 'pubblicata'`.
- **Nazione nuova con soli dati**: funzione `buildXx()` nello script, chiavi con prefisso ISO (`se-…`), seed generato e applicato. Nessuna modifica di schema o di codice (criterio 4).
- **Predisposizione per «Aggiorna»**: le chiavi `place_key` sono stabili tra versioni, quindi il confronto N ↔ N+1 è un join per chiave (`places`, `place_texts`, `place_sources`, `voyages` per `voyage_key`). L'aggiornamento futuro sarà: proporre le differenze, poi una scrittura di `trip_countries.release_id` con `sync_push` (conflitto normale se un altro dispositivo l'ha cambiata). `previous_release_id` registra la discendenza.
- **Ritiro**: `status = 'ritirata'` nasconde la versione ai viaggi nuovi; i viaggi che la usano continuano a leggerla.

## 11. Multinazione

- **Valuta**: dalla nazione (`countries.currency`). Valuta proposta per un importo = nazione della tappa o dell'elemento (`stops.country_code`; voli e crociere: nazione del porto o aeroporto di partenza).
- **Budget**: totali, tetti e stime in `trips.base_currency` (EUR). Conversione: `importo / trip_rates.per_eur` per valuta; EUR vale 1. Valuta senza cambio → «non convertibile», esclusa dal totale ed elencata, mai zero (criterio 13). Oggi `toEur` divide per `nokPerEur`: diventa la ricerca del cambio per valuta.
- **Fonte automatica del cambio**: Norges Bank per NOK (come oggi). Per le altre valute la riserva già usata dall'app (BCE via Frankfurter) copre le valute pubblicate dalla BCE: elenco da verificare per ogni nazione nuova; altrimenti cambio a mano (design §5).
- **Fuso**: `countries.timezone` della nazione dove avviene la cosa; voli e tratti tra nazioni: partenza e arrivo nei rispettivi fusi, durate in minuti. Il `.ics` ha oggi le regole CET/CEST scritte a mano: per altri fusi servono le loro regole `VTIMEZONE` (da decidere: generarle o scrivere gli orari in UTC).
- **Lingua**: `countries.language` per il nome locale e le ricerche esterne; testi del catalogo da `place_texts` in italiano, poi nome locale con avviso.
- **Regioni e parametri**: per versione del catalogo; il configuratore legge `road_factor`, `avg_kmh`, `road_calibrated` (stima «non tarata» se falso), `is_base`, `day_visit`, `place_links`.

## 12. Applicazione su norway-planner

Sempre dopo l'approvazione di Filippo (punto 4 del piano). Esegue deploy-ops dallo SQL Editor del progetto, un file alla volta, nell'ordine. Nessuna chiave in chat o nei documenti.

### 12.1 Prima
1. Esportare `trips` dal pannello (CSV o `select id, owner_id, updated_at, data from public.trips`) e tenerlo fuori dal repository. Esportare anche il backup JSON dall'app.
2. Annotare i valori di controllo:
   ```sql
   select count(*) from public.trips;
   select id, updated_at, md5(data::text) from public.trips order by id;
   select policyname from pg_policies where schemaname = 'public' and tablename = 'trips' order by 1;
   select tgname from pg_trigger where tgrelid = 'public.trips'::regclass and not tgisinternal order by 1;
   select count(*) from private.allowed_emails;
   ```
3. Chiedere di non modificare il viaggio dall'app durante l'applicazione (pochi minuti).

### 12.2 Ordine
1. `20261106000000_copia_sicurezza.sql`
2. `20261106000100_catalogo.sql`
3. `20261106000200_viaggio.sql`
4. `20261106000300_rls.sql`
5. `20261106000400_sincronizzazione.sql`
6. `20261106000500_storage.sql`
7. `supabase/seed/catalogo-norvegia-v1.sql`

Ogni migrazione è senza `begin`/`commit`: nello SQL Editor racchiuderla in `begin; … commit;` (se un comando fallisce, nulla resta a metà; da verificare il comportamento dell'editor con più comandi). Il seed ha già la sua transazione. Con la CLI (`supabase db push`) i file vanno bene così, ma la produzione non ha una cronologia di migrazioni della CLI: preferire l'editor.

### 12.3 Dopo ogni file
- Nessun errore; per la copia: `select count(*) from private.trips_backup_20261106;` = numero annotato.
- Dopo `..._viaggio.sql`: `select count(*) from public.trips where storage_format <> 'documento';` = 0.
- Dopo il seed: messaggio «Catalogo NO-1 pubblicato e controllato: 117 luoghi, 24 crociere, 35 porti in rotta».

### 12.4 Viaggi intatti
```sql
-- data invariato rispetto alla copia (0 righe attese)
select t.id from public.trips t join private.trips_backup_20261106 b on b.id = t.id
where t.data is distinct from b.data or t.updated_at is distinct from b.updated_at;
-- stessi md5 annotati prima
select id, updated_at, md5(data::text) from public.trips order by id;
-- policy e trigger originali ancora presenti (trips_*_own, trips_touch, block_unlisted_signup su auth.users)
select policyname from pg_policies where schemaname = 'public' and tablename = 'trips' order by 1;
select tgname from pg_trigger where tgrelid = 'auth.users'::regclass and tgname = 'block_unlisted_signup';
select count(*) from private.allowed_emails;
```
Poi, dall'**app attuale** (non ancora aggiornata): aprire il viaggio, cambiare una nota, verificare «Salvato nel cloud», ricaricare su un secondo dispositivo. È la prova che i trigger nuovi non disturbano il salvataggio di oggi. Annullare la nota.

### 12.5 Controlli di sicurezza
- Con un account diverso dal proprietario (se disponibile; altrimenti con la sola chiave pubblica, cioè `anon`): `select` su `trips`, `stops`, `catalog_releases` → nessuna riga per `anon`; cataloghi leggibili solo da `authenticated`.
- `insert into public.places …` da `authenticated` → rifiutato.
- Storage: caricamento con un percorso di un altro utente → rifiutato; file di 11 MB o `image/svg+xml` → rifiutato.

### 12.6 Annullare
- **Prima del passaggio di qualsiasi viaggio alle righe**: eseguire `supabase/rollback/20261106_annulla_database_multinazione.sql`. Toglie policy e trigger aggiunti, funzioni, tabelle nuove, policy di Storage, il bucket se vuoto e le colonne nuove di `trips`. Non tocca righe e `data` di `trips`, le policy `trips_*_own`, `auth`, `private.allowed_emails`, la copia privata. Si rifiuta se un viaggio è nel formato a righe; alla fine controlla che `data` coincida con la copia.
- **Dopo il passaggio**: prima il ritorno al documento per ogni viaggio (§9.6), poi lo script.
- **Caso estremo** (data corrotto): ripristino di `data` dalla copia `private.trips_backup_20261106` per l'id interessato, in transazione, con `set local nfhp.permetti_documento = 'on'` se il viaggio è a righe. Solo con approvazione esplicita.
- La copia privata si cancella solo dopo la chiusura della verifica, con approvazione separata.

## 13. Limiti del piano gratuito Supabase

Non verificati in questa fase (nessuna chiamata di rete consentita). Da controllare sulla documentazione ufficiale prima dell'applicazione, annotando URL e data:

| Limite | Valore | Stato | Dove verificare |
|---|---|---|---|
| Spazio Storage | 1 GB | dal piano (decisione 2), da verificare | https://supabase.com/pricing |
| Spazio del database | da verificare | da verificare | https://supabase.com/pricing , https://supabase.com/docs/guides/platform/database-size |
| Dimensione massima di un file caricato | da verificare (deve essere ≥ 10 MB) | da verificare | https://supabase.com/docs/guides/storage/uploads/file-limits |
| Traffico in uscita (egress) | da verificare | da verificare | https://supabase.com/pricing |
| Sospensione per inattività | da verificare | da verificare | https://supabase.com/pricing |
| Dimensione massima del corpo di una richiesta REST/RPC | da verificare (decide la soglia dei lotti) | da verificare | https://supabase.com/docs/guides/api |
| Tipi con carattere jolly (`image/*`) in `allowed_mime_types` | non usato (elenco esplicito) | da verificare | https://supabase.com/docs/guides/storage/buckets/fundamentals |

Stima d'uso: catalogo Norvegia ~0,2 MB; un viaggio qualche MB al massimo (geometrie). Il limite che conta è lo spazio degli allegati.

## 14. Ordine di lavoro consigliato (sviluppatore)

| # | Tappa | Criterio di verifica |
|---|---|---|
| 1 | Tipo `Trip` v3, `v2to3`, `downgradeToV2`, `canonical` | test: `downgradeToV2(v2to3(d))` ≡ `d` per i viaggi di prova e per una copia esportata |
| 2 | `toRows` / `fromRows` per tutte le tabelle (§3) | test: `fromRows(toRows(d))` ≡ `d`, campi sconosciuti compresi; versioni non attive; `plan_has_flights` |
| 3 | Catalogo da `catalog_bundle` (adattatore che produce le strutture di oggi: `Destination`, porti, crociere) | test: con il bundle di `NO-1` il catalogo dell'app è uguale ai file attuali (82 luoghi, stesse fonti) |
| 4 | Server simulato (`verify/e2e/sync.cjs`) con `sync_push`/`sync_pull` e regole del §7 | test: risposta persa e ripetizione → una sola riga; lotto con conflitto → nessuna scrittura |
| 5 | Motore per righe: diff, invio a lotti, unione a tre vie per riga, dialogo dei conflitti | test UC9: tutti i casi; copia locale prima della scelta |
| 6 | Copia offline in IndexedDB (base, cataloghi) e `holdForOwner` esteso | test: senza rete la modalità viaggio funziona; cambio utente senza perdite |
| 7 | Passaggio dal documento (§9) | test su copia esportata: uguaglianza; seconda esecuzione senza righe nuove; riferimenti mancanti elencati |
| 8 | Allegati nello Storage | test: file caricato una volta sola con reinvii; limiti 10 MB e tipi; avviso all'uscita |
| 9 | Nazioni: scelta, aggiunta, rimozione (design §1–§4); valuta e fuso dalla nazione; rimozione di `Region`, `nokPerEur`, `Europe/Oslo` fissi | test con nazione di prova solo nei test (valuta XTS); ricerca nel codice (criterio 12) |
| 10 | Preferenze, contesto, modalità per dispositivo | test: secondo dispositivo ritrova contesto; modalità indipendente |
| 11 | Applicazione su norway-planner (deploy-ops, §12), poi passaggio del viaggio reale | §12.3–12.5; uguaglianza del viaggio reale |
| 12 | `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`, `verify/e2e/*.cjs` | tutto verde |

## 15. Rischi e punti da verificare

1. **Produzione come banco di prova**: ogni errore delle migrazioni avviene vicino ai dati reali. Mitigazioni: solo aggiunte, copia privata, transazione per file, controlli §12, app attuale provata subito dopo. Le funzioni SQL non sono state eseguite su un Postgres (nessuno disponibile qui): la prima esecuzione è un collaudo; conviene un Postgres locale (`supabase start`, se Docker disponibile) prima della produzione.
2. **Trigger nuovi su `trips`**: `trips_guard` e `trips_sync_stamp` girano anche sui salvataggi dell'app attuale. Escono subito per i viaggi «documento», ma un errore in essi bloccherebbe i salvataggi: verificare subito con l'app attuale (§12.4). Ritorno indietro: lo script li toglie per primi.
3. **Policy su `storage.objects` e inserimento in `storage.buckets` da SQL**: pratica comune, ma da verificare i permessi del ruolo `postgres` sul progetto; la rimozione del bucket via SQL potrebbe essere vietata (si fa dal pannello).
4. **Valori fuori elenco** nei documenti reali (enumerazioni, id duplicati in `ideas`/`favorites`, id di segmenti ripetuti in una versione): bloccano il passaggio di quel viaggio. Prova obbligatoria sulla copia esportata prima.
5. **`NOT_VISITS` copiato nello script** (costante non esportata in `configurator.ts`) e date di `wiki.ts`/`regionShapes.ts` prese dai commenti: tenere allineati finché il codice non legge dal catalogo.
6. **Licenza dei confini Kartverket** non indicata nei file: da verificare. Siti ufficiali: solo link, nessun contenuto copiato.
7. **App vecchia su un dispositivo dopo il passaggio**: vede il viaggio fermo e non salva (messaggio chiaro, coda locale conservata).
8. **Dimensione dei lotti**: limite del corpo delle richieste da verificare (§13); le geometrie dei segmenti possono essere grandi.
9. **Limiti del piano gratuito**: tutti da verificare (§13).
10. **`attachments_usage`** legge `storage.objects.metadata->>'size'`: campo da verificare sulla versione di Storage del progetto.

## 16. Trasporti via mare (NO-2)

Aggiunta del 2026-11-09 (architetto-dati). Piano `docs/piano-2026-11-09-trasporti-mare.md`, spec `docs/spec-trasporti-mare.md`, design `docs/design-trasporti-mare.md` (§13 DU9, DU13, DU15; §14), dati `docs/ricerca-traghetti.json` (58 tratte, letto il 2026-11-09). **Nulla è applicato al database**: la migrazione la applica il capo progetto dopo la revisione.

### 16.1 File

| File | Cosa fa |
|---|---|
| `supabase/migrations/20261109000000_traghetti.sql` | 5 tabelle `ferry_*`, guardie di immutabilità, RLS, `catalog_bundle` esteso. Solo aggiunte, idempotente |
| `supabase/rollback/20261109_annulla_traghetti.sql` | Toglie le versioni con traghetti (NO-2), le tabelle `ferry_*`, rimette `catalog_bundle` di prima. Si ferma se un viaggio usa NO-2 |
| `supabase/seed/catalogo-norvegia-v2.sql` | Seed generato: NO-2 = tutto NO-1 + 58 tratte, `previous_release_id = 'NO-1'` |
| `src/data/ferryTypes.ts` | Tipi del catalogo traghetti (scritti a mano) |
| `src/data/ferryRoutes.ts` | Dati: `FERRY_ROUTES` (58), `FERRY_SOURCES` (36), `FERRY_CHECKED_AT`. **Generato** da `scripts/build-ferry-routes.ts` |
| `scripts/build-ferry-routes.ts` | JSON della ricerca → `ferryRoutes.ts` (deterministico, controlli: fonti esistenti, coordinate solo con id NSR, regioni note) |
| `scripts/seed-catalog.ts` | Nuovo `buildNorwayV2()`, opzione `--version 2`, `ferryRows()`/`ferryBundle()` (stesse righe per SQL e bundle) |
| `src/domain/types.ts` | Campi facoltativi del `Segment` traghetto e `Trip.hiddenFerrySuggestions` (§16.4) |

Comandi: `npx tsx scripts/build-ferry-routes.ts` (se cambia la ricerca), poi `npx tsx scripts/seed-catalog.ts --version 2` (SQL) o `--version 2 --bundle` (JSON per `verify/e2e`). `npx tsx scripts/seed-catalog.ts` senza opzioni produce ancora NO-1, **identico byte per byte** al file pubblicato.

### 16.2 Tabelle del catalogo

Tutte con `release_id` nella chiave, come le altre tabelle del catalogo; stessa guardia `catalog_child_guard` (una versione pubblicata non cambia), stessa policy `catalogo_lettura` (select per `authenticated` solo su versioni pubblicate o ritirate; `anon`: nulla; insert/update/delete/truncate revocati).

| Tabella | Chiave | Contenuto | Perché così |
|---|---|---|---|
| `ferry_sources` | (`release_id`, `source_key`) | titolo, URL, data di lettura | dizionario: ogni campo con stato punta qui (`*_source_key`, chiave esterna composta); URL e data una volta sola |
| `ferry_routes` | (`release_id`, `route_key`) | nome, operatore (testo), mezzo `ferje`/`hurtigbat`/`turistico`, zona, regione (FK `regions`), strada, porta l'auto, andata e ritorno, porti; **durata** min/max + stato + nota + fonte; **stagione** e **frequenza estiva** (testo + stato + fonte + anno); **tariffa comune**: stato, anno (+ etichetta «2026/2027»), valida dal, periodo, fonte, nota, «da verificare per l'anno del viaggio», **regola passeggeri** `gratis`/`a_pagamento`/`non_indicata`, gratis sotto X anni, fascia bambino/adulto (testo), tetto bambino, sconto ritorno %, regole della fonte (testi), fonti, note, linea Entur (JSONB) | colonne per ciò che si filtra (mezzo, auto, regione, stato del prezzo); JSONB solo per elenchi di testi letti interi |
| `ferry_route_stops` | (`release_id`, `route_key`, `seq`) | tappe in ordine: nome, minuti dalla partenza (min/max), tipo `fermata`/`a_richiesta`/`solo_discesa`/`solo_passaggio`/`senza_sbarco`, id NSR, lat/lng, fonte delle coordinate | **coordinate solo con id NSR e fonte** (vincolo `check`); nessuna coordinata stimata (spec D9) |
| `ferry_route_places` | (`release_id`, `route_key`, `role`, `place_key`) | luoghi del catalogo collegati: `partenza`, `arrivo`, `lungo` | collegamento per chiave (FK `places`), mai per distanza; indice per «tratte vicine alle mie tappe» |
| `ferry_fares` | (`release_id`, `route_key`, `position`) | una voce per riga: categoria (`adulto`, `bambino`, `giovane`, `senior`, `famiglia`, `veicolo`, `pacchetto_veicolo`, `prenotazione_*`), andata / andata e ritorno, importo + valuta (NOK), fascia d'età (min/max + testo), classe veicolo `fino_6m`, conducente incluso (sì/no/null = non detto), passeggeri/adulti/bambini compresi, sottotratta (da/a), sabato, periodo, facoltativa, anno, stato, fonte, nota | le tariffe sono eterogenee (58 tratte, 91 voci): una riga per voce evita decine di colonne vuote. `check`: importo nullo ⇔ stato `assente` |

**Operatori**: restano testo in `ferry_routes.operator_name` e **non** entrano in `operators`: l'adattatore trasforma ogni riga di `operators` in fatti e fonti delle crociere (`COASTAL_FACTS`/`COASTAL_SOURCES`, per nome); 30 operatori traghetto li sporcherebbero, e i nomi della ricerca contengono cambi di gestione («Fjord1 dal 1/12/2026…»).

**Stato del dato nel catalogo**: `confermato` / `da_verificare` / `assente` solo nelle tabelle `ferry_*` (stato della fonte). **Non** è un nuovo `DataStatus` del viaggio (design DU13): nel tratto, prezzo mancante = `cost` assente + «prezzo da cercare».

**Regole strutturate** (spec §4.6), ognuna dal testo della ricerca, che lo script cita e controlla: Bergen–Flåm tetto bambino 209 e tariffe fuori dal 18/5–31/8 (1349 / 649 / 3099); Geiranger–Hellesylt sconto ritorno 50% e pacchetto = conducente + 4; Lysefjord pacchetto 5 persone (conducente nel conteggio non chiaro → `driver_included` nullo, stato `da_verificare`); Andenes–Gryllefjord adulto 100 NOK solo 30–66 anni e solo oltre il conducente; Aurland «solo discesa». Le altre regole restano testi mostrati così come sono.

**Allineamenti con il design**: regola passeggeri esplicita, così Eidsdal–Linge e le linee di Møre og Romsdal (`non_indicata`) senza auto danno «non calcolabile», non 0 (DU9; la spec diceva 0). Stavanger–Lysefjord ha `round_trip = true`: l'app la offre come escursione nelle Giornate, non come tratto (DU15). Prenotazione Torghatten: voci `optional = true`, non sommate per default.

### 16.3 Versione NO-2 e passaggio del viaggio

- **NO-2 = tutto NO-1 + traghetti**: `buildNorwayV2()` usa gli stessi file e le stesse chiavi di NO-1 (nessun luogo nuovo: i porti dei traghetti sono fermate della tratta, non luoghi). Il seed si ferma se NO-1 non è pubblicata e, alla fine, controlla per ogni tabella di NO-1 che **ogni riga di NO-1 sia identica in NO-2** (tranne `release_id`): se i file sono cambiati dopo NO-1, il seed fallisce e serve una scelta esplicita. `previous_release_id = 'NO-1'`.
- **Il viaggio resta su NO-1** finché l'utente non sceglie «Passa a NO-2» (Impostazioni › Nazioni e cataloghi). Su NO-1 la parte Traghetti mostra solo l'invito ad aggiornare, nessuna tratta. Funzione di dominio da scrivere (sviluppatore), pura:
  ```ts
  /** Cambia la versione del catalogo di una nazione. Nulla si perde: la nuova contiene la vecchia (stesse chiavi). */
  export function upgradeCatalog(t: Trip, code: string, releaseId: string): Trip
  // = { ...t, countries: tripCountries(t).map(c => c.code === code ? { ...c, releaseId } : c) }
  ```
  Nessun altro campo cambia (tappe, idee, preferiti, attività restano: le `place_key` esistono anche in NO-2). Nel viaggio a righe è una modifica di `trip_countries.release_id` con `sync_push` (conflitto normale se un altro dispositivo l'ha cambiata). Il ritorno a NO-1 è la stessa funzione: i tratti traghetto restano (dati salvati nel tratto), solo la scheda della tratta non si apre finché il catalogo non la contiene.
- **Catalogo da file (senza cloud)**: contiene i traghetti (`src/data/ferryRoutes.ts`, importato dal registro come gli altri file). Il file corrisponde a NO-2: per lo sviluppatore, `FILE_COUNTRY` passa a `releaseId: 'NO-2', version: 2` (il seed prende da lì solo nazione, valuta, fuso, lingua: NO-1 non cambia). La regola «niente traghetti su NO-1» vale anche senza cloud (si guarda la versione della nazione nel viaggio, non la fonte del catalogo).
- **Adattatore (sviluppatore)**: `AppCatalog.ferryRoutes: FerryRoute[]` e `ferrySources`; `adaptBundle` ricostruisce `FerryRoute` dalle righe `ferry_*` (inverso di `ferryRows` in `scripts/seed-catalog.ts`). Le chiavi `ferry_*` vanno lette come **facoltative** (`[]` se mancano): le copie offline di NO-1 scaricate prima della migrazione non le hanno, e `checkBundle` non deve rifiutarle. Test consigliato: `adaptBundle(seedBundle(buildNorwayV2())).ferryRoutes` ≡ `FERRY_ROUTES` (canonico) e il test esistente su NO-1 invariato. Il registro sostituisce `FERRY_ROUTES` come fa con `COASTAL_CATALOG`.

### 16.4 Dati del viaggio: nessuna tabella nuova, nessuna colonna nuova

Il tratto traghetto è un `Segment` con `mode: 'traghetto'` e i campi facoltativi del design §14 (già in `src/domain/types.ts`): `ferryRouteId` (= `route_key`), `ferryReleaseId`, `ferryBoardStop` / `ferryAlightStop` (`seq` delle fermate), `withCar`, `ferryReturnBought`, `ferryBookingAdded`, `costByUser`; più `waitMin`, `departureTime`, `cost`, `costStatus`, `source` già esistenti. Il viaggio ha `hiddenFerrySuggestions`.

**Decisione: nel viaggio a righe questi campi vanno in `segments.extra` (e `trips.extra`), non in colonne nuove.** Motivi:
1. il viaggio reale resta nel formato documento (`VITE_PASSAGGIO_RIGHE` non si imposta): oggi i campi viaggiano nel JSON di `trips.data` senza alcuna modifica di schema;
2. `toRows`/`fromRows` mettono già ogni campo sconosciuto in `extra` e lo ricostruiscono identico (uguaglianza canonica, §9.3): nessun codice di conversione nuovo, nessun rischio per il passaggio;
3. nessuno interroga i segmenti per tratta lato server; il conto si calcola sul dispositivo dal catalogo.
Se un giorno servisse cercarli: colonna additiva `ferry_route_id text generated always as (extra ->> 'ferryRouteId') stored` + indice, senza toccare i dati.

Nessun riferimento con chiave esterna dal viaggio al catalogo (come `place_key`, §1.7): una tratta tolta in una versione futura si elenca come «non trovata», non blocca.

### 16.5 Applicazione (capo progetto, dopo la revisione)

1. SQL Editor di `norway-planner`: `begin;` + `20261109000000_traghetti.sql` + `commit;`. Controllo interno: RLS e guardie su 5 tabelle, `anon` senza accesso, NO-1 senza tratte.
2. `supabase/seed/catalogo-norvegia-v2.sql` (ha la sua transazione). Messaggio atteso: «Catalogo NO-2 pubblicato e controllato: 117 luoghi, 24 crociere, 35 porti in rotta, 58 tratte traghetto».
3. Verifiche: `select jsonb_array_length(public.catalog_bundle('NO-2')->'ferry_routes')` = 58 (da `authenticated`); `catalog_bundle('NO-1')` uguale a prima nelle chiavi vecchie e `ferry_*` vuoti; `select count(*) from public.trips` e md5 di `data` invariati (§12.4).
4. Annullare: `supabase/rollback/20261109_annulla_traghetti.sql` (si ferma se un viaggio usa NO-2).

**Prova eseguita (2026-11-09)**, su Postgres in memoria (PGlite 0.2.17, ruoli `anon`/`authenticated` simulati, nessun dato reale): migrazione del catalogo 2026-11-06 + seed NO-1 → migrazione traghetti (due volte) → bundle NO-1 identico nelle chiavi vecchie → seed NO-2 (due volte) → 117 luoghi, 58 tratte, 207 tappe, 91 voci di tariffa, 58 collegamenti a luoghi, 36 fonti → modifica di NO-2 e scrittura in NO-1 rifiutate dalle guardie → rollback → bundle NO-1 identico a prima della migrazione → migrazione e seed di nuovo. Il bundle NO-2 dal database coincide (canonico) con `seedBundle(buildNorwayV2())` per tutte le tabelle `ferry_*` e quelle ereditate. Non provato: policy RLS con utenti reali di Supabase e Postgres 17 del progetto.

### 16.6 Rischi

1. **Tariffe 2026 per un viaggio 2027**: tutte `fare_verify_for_trip_year = true`; solo Bergen–Flåm ha prezzi 2027. Un aggiornamento a inizio 2027 = versione NO-3 (le pubblicate non cambiano), stesso schema.
2. **Linee «gratis»** (Nordland fuori estate, Finnmark, zona 1) e prezzi da fergeruter.info (`da_verificare`): possono cambiare per agosto 2027.
3. **NO-2 deve contenere NO-1**: se `src/data` cambia prima del seed NO-2, il controllo finale fallisce (voluto). Rigenerare NO-1 oggi dà lo stesso file pubblicato.
4. **Copie offline di NO-1 senza chiavi `ferry_*`**: l'adattatore deve accettarle (§16.3).
5. **Operatore Bergen–Sogn** (Norled → Fjord1 dal 1/12/2026) e durate in conflitto (Geiranger–Hellesylt 65 vs 45): restano testo e stato `da_verificare`, nessuna scelta automatica.
6. **Nomi Entur con caratteri rovinati** nella ricerca (es. «TromsÃ¸»): ricodificati dallo script (stessa stringa, non dati nuovi).
7. **Gratuità passeggeri in Møre og Romsdal** non scritta: «non calcolabile» senza auto finché una fonte non la conferma (DU9).

## 17. Luoghi del nord, foto e consigli (NO-3)

Aggiunta del 2026-11-10. Piano `docs/piano-2026-11-10-catalogo-nord.md`, dati `docs/ricerca-luoghi-nord.json` (84 candidati, letti il 2026-11-10). **Nulla è applicato al database** finché Filippo non dà l'ok.

### 17.1 File

| File | Cosa fa |
|---|---|
| `scripts/harvest-places.mjs` | Raccolta: elemento Wikidata scelto per nome e distanza da un punto indicativo (mai salvato), coordinate P625, riscontro OpenStreetMap (Nominatim), voci di Wikipedia, sito ufficiale P856, fino a 3 foto di Commons con autore e licenza. `--resume`, `--only chiave,…`, `--existing` (foto dei luoghi già in catalogo) |
| `scripts/build-nord.mjs` | JSON della ricerca → `src/data/nordFonti.ts` (**generato**), con il filtro delle foto (niente scansioni d'archivio, niente file senza autore) |
| `src/data/nordSchede.ts` | Schede scritte a mano (nome, categoria, descrizione, come arrivare, stagione, note) e `NORD_CONSIGLI`: consigli solo da pagine ufficiali, con indirizzo e data |
| `src/data/placesNord.ts` | Unisce i due file sopra. Usato solo da `buildNorwayV3()`: i file dell'app (`DESTINATIONS`, `WIKI`…) restano quelli di NO-1/NO-2 |
| `src/data/placeExtras.ts` | `PLACE_PHOTOS` e `PLACE_TIPS`: vuoti con i file (NO-2), riempiti dal registro quando arriva NO-3 |
| `supabase/migrations/20261110000100_foto_consigli.sql` | Tabelle `place_photos` e `place_tips`, guardie, RLS, `catalog_bundle` con due chiavi in più. Solo aggiunte, idempotente |
| `supabase/rollback/20261110_annulla_foto_consigli.sql` | Toglie NO-3 e le due tabelle, rimette `catalog_bundle` di prima. Si ferma se un viaggio usa NO-3 |
| `supabase/seed/catalogo-norvegia-v3.sql` | Seed generato: NO-3 = tutto NO-2 + 83 luoghi + foto + consigli, `previous_release_id = 'NO-2'` |
| `src/domain/placeMatch.ts` | Proposta «Collega alla scheda» per le tappe messe a mano |
| `src/ui/PlaceCard.tsx` | Scheda del luogo dentro la tappa e proposta di collegamento |

Comandi: `node scripts/harvest-places.mjs --resume` (se cambia l'elenco dei candidati), `node scripts/build-nord.mjs`, poi `npx tsx scripts/seed-catalog.ts --version 3` (SQL) o `--version 3 --bundle` (JSON). I seed di NO-1 e NO-2 rigenerati restano identici byte per byte.

### 17.2 Tabelle

Stesse regole delle altre tabelle del catalogo: `release_id` nella chiave, guardia `catalog_child_guard`, policy `catalogo_lettura`, nulla per `anon`.

| Tabella | Chiave | Contenuto |
|---|---|---|
| `place_photos` | `(release_id, place_key, position)` | File di Wikimedia Commons, autore, licenza, indirizzo della licenza, data di lettura. Al massimo 3 per luogo. `places.commons_image` resta la foto principale |
| `place_tips` | `(release_id, place_key, lang, position)` | Testo del consiglio, nome e indirizzo `https` della fonte, data di lettura |

`catalog_bundle` aggiunge `place_photos` e `place_tips`; per NO-1 e NO-2 sono elenchi vuoti. L'adattatore le tratta come facoltative (copie offline vecchie).

### 17.3 Regole dei dati

- Coordinate: solo Wikidata P625 o OpenStreetMap, con fonte e data in `place_sources` (`coordinate`). `coords_status = 'verificate'`.
- Quando l'elemento Wikidata trovato è un'altra cosa vicina (la chiesa del villaggio, il faro dell'isola), la scheda lo dichiara (`entity: false`): niente voce di Wikipedia né sito ufficiale suoi.
- Testi: scritti per l'app dalle voci lette e da conoscenza generale, `reliability = 'da_verificare'`. Nessun prezzo, orario o disponibilità.
- Consigli: 28, tutti dalle pagine delle strade turistiche nazionali (Statens vegvesen), lette il 2026-11-10. Servizi e aperture valgono alla data di lettura.
- Il seed di NO-3 controlla che tutte le righe di NO-2 (luoghi, testi, fonti, crociere, traghetti) siano presenti e identiche.

### 17.4 Nell'app

- I file dell'app valgono ancora come NO-2: senza cloud non ci sono i luoghi nuovi. Con il viaggio su NO-3 il registro installa luoghi, foto e consigli.
- `StopCard` mostra «Scheda del luogo» (foto con autore e licenza, descrizione, come arrivare, stagione, consigli con fonte e data, sito ufficiale, Wikipedia). Senza foto nel catalogo usa la foto principale con i crediti letti da Commons, come prima.
- Tappa senza scheda: se nel catalogo c'è un luogo con lo stesso nome entro 8 km, o un luogo entro 1 km, compare «Collega alla scheda». La distanza è in linea d'aria e serve solo a riconoscere il luogo. Il collegamento imposta `destinationId` e lo fa solo l'utente.
