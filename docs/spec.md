---
type: spec
created: 2026-11-06
piano: docs/piano-2026-11-06-database.md
stato: in attesa di approvazione (punto 2 del piano)
---

# Specifica · Tutti i dati nel database, catalogo per nazione

## 1. Obiettivo e glossario

**Obiettivo**: Supabase contiene tutti i dati; sul dispositivo restano solo copia offline, coda delle modifiche, cache temporanee e stato visivo; ogni viaggio carica il catalogo delle sue nazioni in una versione fissa.

| Termine | Significato | Oggi nel codice |
|---|---|---|
| Nazione | Paese del viaggio: codice ISO, nome, valuta, fuso orario, lingua | implicita (solo Norvegia) |
| Catalogo | Dati di riferimento di una nazione: regioni, luoghi, schede, aeroporti, porti, operatori, crociere, fonti | `src/data/*.ts` |
| Versione del catalogo | Rilascio numerato e datato del catalogo di una nazione, con note sulle fonti. Non cambia dopo la pubblicazione | non esiste |
| Luogo / scheda | Voce del catalogo con chiave stabile tra versioni (`place_key`). La scheda verificata è il dettaglio editoriale di un luogo | `Destination` + `ATTRACTION_INFO` |
| Tappa | Dove si dorme (`kind: 'luogo'`) o notte a bordo (`'a_bordo'`) | `Stop` |
| Idea | Luogo che interessa in una tappa, senza giorno | `stop.ideas[]` |
| Attività pianificata | Attività di un giorno collegata a un luogo | `Activity` con `destinationId` |
| Attività personale | Attività di un giorno con solo il testo dell'utente | `Activity` senza `destinationId` |
| Versione del percorso | Scenario salvato o Piano B: tappe, tratti, giornate, budget, crociere scelte, voli | `Scenario`, `PlanSnapshot` |
| Copia offline | Ultima copia sul dispositivo di viaggio, cataloghi caricati, preferenze, contesto e allegati non caricati | `nfhp.trip.v1` (solo viaggio) |
| Coda delle modifiche | Modifiche fatte qui e non ancora confermate dal cloud | `nfhp.sync.pending.<id>` (una per viaggio) |

## 2. Inventario dei dati

Legenda destinazione: **DB** = tabella Supabase; **Storage** = Supabase Storage privato; **Dispositivo** = resta solo locale. I nomi delle tabelle sono quelli del piano; lo schema esatto lo fissa l'architetto-dati.

### 2.1 Documento del viaggio (`Trip`, `src/domain/types.ts`)

Oggi: tutto in `localStorage['nfhp.trip.v1']` e in `trips.data` (JSONB), un blocco unico.

| Dato (campo) | Dove deve andare | Perché |
|---|---|---|
| `id`, `title`, `startDate`, `dateTentative`, `participants`, `usefulInfo`, `updatedAt`, `schemaVersion` | DB `trips` | dati del viaggio |
| Nazioni del viaggio e versione del catalogo caricata (nuovo) | DB `trip_countries` (nazione, versione, ordine) | multinazione, catalogo fisso |
| `stops[]` (anche `placedFrom`, `notes`, `weatherPlanB`, `accommodationId`) | DB `stops` | una riga per tappa: sincronizzazione per riga |
| `stops[].ideas[]` | DB `stop_ideas` | idee per tappa, seguono le versioni del percorso |
| `legs[]` | DB `legs` | tratti |
| `legs[].segments[]` (anche `geometry`, `verification`) | DB `segments` | traghetti come segmenti separati |
| `days{}` (`notes`, `planB`) | DB `days` | giornate legate alle tappe |
| `days{}.activities[]` | DB `activities` (`place_key` vuoto = attività personale) | attività pianificate e personali |
| `coastalOptions[]` (anche `catalogId`) | DB `coastal_options` | opzioni di crociera |
| `flights[]` | DB `flights` | voli |
| `accommodations[]` | DB `accommodations` | alloggi |
| `budgetItems[]` | DB `budget_items` | voci di budget |
| `favorites[]` | DB (tabella da definire: il piano non la elenca) | preferiti; oggi si uniscono tra dispositivi (`merge.ts`) |
| `actuals.stops`, `actuals.activities` | DB `visit_states` | stati di visita |
| `diary[]` (testo, date, `tzOffsetMin`, `deletedAt`) | DB `diary_entries` | diario |
| `diary[].attachments[]` (nome, tipo, dimensione, stato) | DB `diary_attachments` | metadati degli allegati |
| `planLog[]` | DB `plan_log` | registro delle versioni applicate |
| `scenarios[]`, `activeScenarioId` | DB `trip_versions` | versioni del percorso e Piano B |
| `settings` (limite giornaliero, ipotesi, auto, tetti e stime di budget, `showCatalogOnMap`, `homeAirports`, `recheckAfterDays`) | DB `trips` (impostazioni del viaggio) | valgono per il viaggio, non per il dispositivo |
| `settings.nokPerEur`, `nokRateNote`, `nokRateDate`, `nokRateAuto` | DB, cambio per valuta del viaggio (vedi §5.1) | oggi solo NOK |
| `lastMutationId` | sostituito dall'identificativo per modifica in coda (metadato di sincronizzazione) | sincronizzazione per riga |
| Colonna `trips.data` | DB, resta come copia di sicurezza | decisione del piano, fino alla verifica in produzione |

### 2.2 Catalogo (`src/data/*`, costanti di dominio)

Oggi: nel bundle dell'app, solo Norvegia. Destinazione: DB, prima versione della Norvegia generata da questi file.

| Dato | File oggi | Dove deve andare | Note |
|---|---|---|---|
| Luoghi (città, attrazioni, aeroporti, aree): 82 voci in `SEEDS` | `destinations.ts` | DB `places` | `id` attuale = `place_key` |
| Correzioni di regione (`REGION_FIX`) | `destinations.ts` | DB `places` (già applicate nel seed) | |
| Coordinate verificate OSM (67) | `coordVerification.ts` | DB `place_sources` (fonte, data, licenza ODbL per campo) | |
| Schede verificate (`ATTRACTION_INFO`, Oslo, 2026-11-06) | `attractions.ts` | DB `places` + `place_sources` | Wikidata P625 CC0 |
| Siti ufficiali (29) | `officialSites.ts` | DB `place_sources` | tipo e via (Wikidata / verifica manuale) |
| Riferimenti Wikidata/Wikipedia/Commons (77) | `wiki.ts` | DB (campo del luogo) | testi e foto restano letti al momento |
| Regioni (`Region`, 7 valori fissi) e confini delle contee | `types.ts`, `regionShapes.ts` | DB `regions` | Kartverket, 2026-10-27 |
| Etichette delle categorie (`CATEGORY_LABEL`) | `destinations.ts` | codice | testo d'interfaccia, uguale per tutte le nazioni |
| Porti della rotta costiera (35) | `coastalPorts.ts` | DB `places` (porti) | coordinate approssimative, da dichiarare |
| Fonti e fatti degli operatori (`COASTAL_SOURCES`, `COASTAL_FACTS`) | `coastalPorts.ts` | DB `operators` + `place_sources` | |
| Proposte di crociera (24: Havila 11, Hurtigruten 13) | `coastalCatalog.ts` | DB `voyages` | prezzi e date come pubblicati il 2026-10-28 |
| Operatori costieri (`CoastalOperator` = Hurtigruten \| Havila) | `types.ts` | DB `operators` | tipo fisso da togliere |
| Basi per dormire (`BASE_IDS`, 17), non visitabili (`NOT_VISITS`), linee ferroviarie (`RAIL`) | `configurator.ts` | DB (attributi dei luoghi e collegamenti della nazione) | oggi regole norvegesi nel codice |
| Fattore strada 1,7 e 52 km/h (`ROAD_FACTOR`, `AVG_KMH`) | `configurator.ts` | DB `countries` (parametro di stima per nazione) | tarati su Bergen–Ålesund |
| Aeroporti italiani di partenza (`ITALIAN_AIRPORTS`) e predefiniti BRI, FCO | `flightAdvisor.ts` | DB (dato di riferimento, letto come i cataloghi) | la scelta dell'utente è `settings.homeAirports` |
| Valori iniziali del viaggio (titolo «Norvegia, agosto 2027», 2027-08-01, 2+2 con 8 e 5 anni, cambio 10,3885) | `defaults.ts` | nuovo viaggio: dalla nazione scelta e dall'utente; viaggi esistenti: invariati | |

### 2.3 Chiavi di storage del browser

Tutte le chiavi trovate in `src/` (2026-11-06).

| Chiave | Archivio | File | Contenuto | Dove deve andare | Perché |
|---|---|---|---|---|---|
| `nfhp.trip.v1` | localStorage | `services/storage/local.ts` | viaggio intero | Dispositivo (copia offline) + DB | fonte di verità nel DB, copia per l'offline |
| `nfhp.trip.v1.backup` | localStorage | `local.ts` | versione precedente del viaggio | Dispositivo | rete di sicurezza locale |
| `nfhp.trip.v1.illeggibile` | localStorage | `local.ts` | documento non leggibile, intatto | Dispositivo | nessuna perdita di dati |
| `nfhp.sync.pending.<id>` | localStorage | `syncEngine.ts` | modifica in coda | Dispositivo (coda) | va inviata; diventa coda per riga |
| `nfhp.sync.base.<id>` | localStorage | `syncEngine.ts` | ultima copia confermata dal cloud | Dispositivo | unione a tre vie |
| `nfhp.cloud.lastSync.<id>` | localStorage | `syncEngine.ts` | `updated_at` noto | Dispositivo | salvataggio condizionato |
| `nfhp.cloud.dirty.<id>` | localStorage | `syncEngine.ts` | segno della versione precedente dell'app | Dispositivo, solo lettura e conversione | compatibilità |
| `nfhp.sync.copia.<id>` | localStorage | `state/cloudSync.tsx` | copia prima di risolvere un conflitto | Dispositivo | rete di sicurezza |
| `nfhp.owner` | localStorage | `syncEngine.ts` | utente proprietario dei dati locali | Dispositivo | separazione tra utenti |
| `nfhp.hold.<utente>` | localStorage | `syncEngine.ts` | dati messi da parte per un altro utente | Dispositivo | modifiche non inviate non si perdono |
| `nfhp.cloud.config` | localStorage | `services/storage/supabase.ts` | URL e chiave pubblica inseriti a mano | Dispositivo | serve prima di raggiungere il DB |
| `nfhp.cloud.session` | localStorage | `supabase.ts` | token di accesso | Dispositivo | autenticazione, mai nel DB applicativo |
| `nfhp.configurator.v1` | localStorage | `ui/ConfiguratorView.tsx` | valori del configuratore | DB `user_context` | decisione 5 |
| `nfhp.ui.mode` | localStorage | `state/mode.ts`, `ui/SettingsView.tsx` | modalità pianificazione/viaggio | DB `user_context` (vedi domanda D2) | decisione 5; oggi è per dispositivo |
| `nfhp.rates.checkedAt` | localStorage | `state/autoRates.ts` | ultimo controllo di cambio e carburante | Dispositivo (cache) | serve solo a non ripetere richieste entro 6 ore |
| `nfhp.wiki.img.<file>` | localStorage | `services/wiki.ts` | autore e licenza delle foto (30 giorni) | Dispositivo (cache) | decisione 5; si rigenera |
| `nfhp.wiki.intro.<qid>` | localStorage | `services/wiki.ts` | introduzione Wikipedia (30 giorni) | Dispositivo (cache) | decisione 5; si rigenera |
| `nfhp.ui.activation` | sessionStorage | `state/uiContext.ts` | messaggio di attivazione della proposta | DB `user_context` | decisione 5 |
| `nfhp.ui.lastPlanning` | sessionStorage | `uiContext.ts` | ultima vista di pianificazione | DB `user_context` | decisione 5 |
| `nfhp.ui.travel` | sessionStorage | `uiContext.ts` | giornata e tappa scelte in modalità viaggio | DB `user_context` | decisione 5 |
| `nfhp.planner.ui` → `sel` | sessionStorage | `ui/PlannerView.tsx` | elemento scelto nel Pianificatore | DB `user_context` | contesto di lavoro |
| `nfhp.planner.ui` → `center`, `filter`, `scroll` | sessionStorage | `PlannerView.tsx` | mappa/giorni, filtro, scorrimento | Dispositivo | stato visivo |
| `nfhp.autoRoute` | sessionStorage | `ConfiguratorView.tsx`, `PlacementDialog.tsx`, `PlannerView.tsx` | segnale «calcola i tratti» letto una volta | Dispositivo | segnale di un attimo, non è un dato |
| `nfhp.weather.v1` | sessionStorage | `services/weather/openMeteo.ts` | previsioni (3 ore) | Dispositivo (cache) | decisione 5 |
| `nfhp-allegati` / `files` | IndexedDB | `services/storage/blobs.ts` | file degli allegati | Storage privato; locale finché non caricati | decisione 2 |
| `nfhp-app-v2` | Cache Storage | `public/sw.js` | file dell'app e Leaflet | Dispositivo | apertura senza rete |
| `mem` (wiki), `failedFiles` (allegati) | memoria | `wiki.ts`, `ui/TravelView.tsx` | cache e file da ritentare | Dispositivo, finché la pagina è aperta | temporanei |

## 3. Cosa resta sul dispositivo

| Cosa | Motivo |
|---|---|
| Copia offline: viaggio aperto, cataloghi delle sue nazioni nella versione caricata, preferenze e contesto | la modalità viaggio funziona senza rete |
| Coda delle modifiche (per riga) e metadati di sincronizzazione (base, `updated_at` noto, tentativi) | nessuna modifica persa; nessun duplicato |
| Allegati non ancora caricati | decisione 2 |
| Copie di sicurezza (`backup`, `illeggibile`, `sync.copia`) e dati messi da parte per utente (`hold`) | nessuna perdita di dati |
| Configurazione del cloud e sessione | servono prima di raggiungere il DB |
| Cache: meteo, cambio (`rates.checkedAt`), Wikipedia/Commons, allegati scaricati da un altro dispositivo, file dell'app | si rigenerano dalla rete |
| Stato visivo: scorrimento, pannello mostrato, filtro, segnale `autoRoute` | non è un dato |

Regole:
- Ciò che resta sul dispositivo si può cancellare senza perdere dati, tranne coda e allegati non caricati: l'app li segnala prima di cancellarli.
- I cataloghi nella copia offline sono solo quelli delle nazioni dei viaggi presenti sul dispositivo.

**Primo accesso su un dispositivo nuovo**:
1. L'utente accede.
2. L'app scarica preferenze e contesto di lavoro.
3. Apre il viaggio dell'ultimo contesto; se manca, il più recente (come oggi in `cloudSync.tsx`).
4. Scarica il viaggio e i cataloghi delle sue nazioni nelle versioni indicate in `trip_countries`.
5. Gli allegati si scaricano quando si aprono, poi restano in cache.
6. Fino al termine dei passi 2–4 l'app mostra il caricamento; senza rete dice che il viaggio non è ancora su questo dispositivo.

## 4. Casi d'uso

### UC1 · Nuovo viaggio con scelta della nazione
1. L'utente sceglie «Nuovo viaggio».
2. L'app mostra le nazioni con un catalogo pubblicato (oggi: Norvegia).
3. L'utente sceglie la nazione.
4. L'app crea il viaggio e la riga in `trip_countries` con l'ultima versione pubblicata del catalogo.
5. Scarica il catalogo e lo mette nella copia offline.

Risultato: viaggio vuoto con nazione, versione del catalogo visibile, valuta e fuso della nazione. Nessun valore norvegese fisso se la nazione è un'altra. Titolo, date e partecipanti da inserire (nessuna data inventata; se proposta, «provvisoria» come oggi con `dateTentative`).

### UC2 · Aggiunta di altre nazioni (seconda, terza…)
1. Dal viaggio l'utente sceglie «Aggiungi nazione».
2. L'app elenca le nazioni non ancora nel viaggio.
3. L'utente ne sceglie una.
4. L'app aggiunge una riga in `trip_countries` (ultima versione pubblicata, ordine successivo) e scarica il catalogo.
5. Si ripete per la terza e le successive.

Risultato: catalogo, mappa, ricerca dei luoghi, aeroporti e operatori mostrano i dati di tutte le nazioni, ognuna con la sua versione. Nessuna modifica al codice per una nazione nuova (verificato con una nazione di prova solo nei test). Tappe e attività esistenti non cambiano.

### UC3 · Rimozione di una nazione
1. L'utente sceglie «Togli nazione».
2. L'app conta cosa usa quella nazione: tappe, idee, attività pianificate, preferiti, opzioni di crociera, voli con aeroporti di quella nazione.
3. Se non c'è nulla: chiede conferma e toglie la riga di `trip_countries`.
4. Se c'è qualcosa: mostra l'elenco e propone (vedi D3) di togliere anche le tappe della nazione con le regole di oggi per l'eliminazione delle tappe (attività e note restano senza giornata), oppure di annullare. Conferma aggiuntiva se tocca elementi prenotati o pagati, come nel Piano B.
5. Si può annullare.

Risultato: nessun dato tolto senza conferma. Le tappe conservano nome e coordinate anche senza catalogo (oggi `Stop` li copia). L'ultima nazione del viaggio non si può togliere.

### UC4 · Catalogo fisso quando nel DB arriva una versione nuova
1. Nel DB si pubblica la versione N+1 del catalogo di una nazione.
2. Il viaggio che usa la versione N si apre.

Risultato: il viaggio continua a usare la versione N, anche su altri dispositivi e offline. Il viaggio indica quale versione usa. Nessun aggiornamento automatico. Il tasto «Aggiorna» è fuori ambito; il modello deve permettere in futuro di confrontare N e N+1 per `place_key` e di sostituire la versione. Le versioni usate da almeno un viaggio non si cancellano.

### UC5 · Viaggio norvegese esistente migrato
1. Lo script legge `trips.data` di ogni viaggio (prima su una copia esportata, poi sull'ambiente di prova).
2. Crea le righe nelle tabelle del viaggio e `trip_countries` = Norvegia, versione 1.
3. Collega `destinationId`, `ideas`, `favorites`, `catalogId` ai `place_key` della versione 1 (oggi gli `id` dei file).
4. Il test di confronto ricostruisce il documento dalle tabelle e lo confronta con l'originale.
5. Sul dispositivo, al primo avvio con la nuova versione dell'app, la copia locale con modifiche in coda viene prima inviata o unita, poi convertita.

Risultato: documento ricostruito identico all'originale (campi sconosciuti compresi). `trips.data` resta. Lo script si può rieseguire senza duplicare righe. Un riferimento che non trova il luogo viene elencato, non scartato. Un documento con `schemaVersion` più recente non si tocca (regola attuale di `migrations.ts`).

### UC6 · Uso offline e ritorno della rete
1. Senza rete l'utente apre l'app: si apre dalla copia offline (service worker per i file).
2. Modifica tappe, segna visite, scrive nel diario.
3. Ogni modifica si salva subito sul dispositivo e entra in coda, riga per riga, con un identificativo unico.
4. Torna la rete: l'app invia la coda (all'apertura, al ritorno in primo piano, al ritorno della rete e ogni 30 s, come oggi).

Risultato: modalità viaggio pienamente usabile; lo stato indica «da inviare». Al ritorno della rete le modifiche arrivano nel cloud una sola volta: una risposta persa non produce duplicati. Restano non disponibili senza rete: calcolo dei tratti, meteo, ricerca alloggi, mappe non già scaricate (come oggi).

### UC7 · Allegati del diario offline e online
1. L'utente aggiunge una foto a una voce del diario.
2. Il file si salva sul dispositivo; la voce indica «solo su questo dispositivo».
3. Con rete il file si carica nello Storage privato, nella cartella dell'utente e del viaggio.
4. A caricamento confermato lo stato diventa «nel cloud».
5. Senza rete il caricamento resta in coda e riparte da solo; un errore si mostra con «Riprova».

Risultato: nessun file perso; nessun file caricato due volte (identificativo dell'allegato come nome nello Storage). La copia locale resta almeno fino alla conferma del caricamento. Eliminare una voce del diario elimina il file dallo Storage solo dopo la conferma dell'utente. Gli allegati salvati prima (stato `solo_dispositivo`) si caricano dal dispositivo che li ha.

### UC8 · Secondo dispositivo
1. L'utente accede da un altro dispositivo.
2. Segue i passi del §3 «Primo accesso».

Risultato: si ritrovano viaggio, nazioni e versioni del catalogo, preferenze, contesto di lavoro (ultima vista, giornata e tappa, messaggio di attivazione, configuratore) e allegati caricati. Gli allegati ancora solo sul primo dispositivo compaiono come «non ancora caricati», con nome e dimensione.

### UC9 · Conflitto tra due dispositivi
1. Due dispositivi modificano lo stesso viaggio, almeno uno offline.
2. Al ritorno della rete il secondo invio trova righe cambiate dopo la sua base.

Risultato:
- Righe diverse cambiate sui due lati: unione automatica, con avviso di cosa è stato unito.
- Stessa riga cambiata in modo diverso: conflitto visibile, per singola riga (es. «tappa Flåm: notti 2 qui, 3 nel cloud»); sceglie l'utente.
- Ordine delle tappe cambiato sui due lati: una scelta unica.
- Riga eliminata da un lato e modificata dall'altro: conflitto, nessuna eliminazione silenziosa.
- Diario: voci nuove si sommano; stessa voce modificata in due modi: si tengono entrambe (regola attuale).
- Stati di visita: per elemento (regola attuale).
- Impostazioni aggiornate in automatico (cambio, carburante): vince la più recente, nessun conflitto (regola attuale `AUTO_SETTINGS`).
- Prima di applicare le scelte si salva una copia locale (come `nfhp.sync.copia`). Nulla si sovrascrive senza scelta.

### UC10 · Utente senza cloud configurato
Oggi: senza `VITE_SUPABASE_*` e senza `nfhp.cloud.config` lo stato è «non configurato» e tutto vive in `localStorage`, con catalogo nel bundle.

Con il catalogo nel DB questa modalità non può più caricare cataloghi. Proposta (da decidere, D1):
1. La versione pubblicata richiede accesso: crea viaggi solo dopo il login.
2. Un viaggio già presente solo sul dispositivo viene caricato nel cloud al primo accesso (comportamento attuale: «viaggio non ancora nel cloud: lo carica»).
3. Senza accesso e senza rete si apre la copia offline già presente, in sola consultazione e modifica locale con coda.
4. Sviluppo e test usano un catalogo di prova da file (lo stesso seed delle migrazioni) e il server Supabase simulato già usato da `verify/e2e/sync.cjs`.

Risultato: nessun viaggio esistente perso; l'app dichiara sempre se i dati sono solo sul dispositivo.

### UC11 · Uscita e cambio utente
1. L'utente sceglie «Esci».
2. Se ci sono modifiche in coda o allegati non caricati, l'app li elenca e propone di attendere l'invio o esportare un backup.
3. Confermato, toglie dal dispositivo viaggio, coda, contesto e allegati (come oggi `purgeTripData` e `clearBlobs`).
4. Se accede un altro utente senza uscita, i dati del precedente vengono messi da parte (`nfhp.hold.<utente>`) e tornano al suo rientro.

Risultato: nessun dato di un utente visibile a un altro; nessun allegato non caricato cancellato senza avviso (oggi `clearBlobs` li toglie: è il cambiamento richiesto).

## 5. Regole funzionali multinazione

### 5.1 Valuta e budget
Oggi (codice):
- `Currency` = `'EUR' | 'NOK'`; `toEur` (`domain/coastal.ts`) divide gli importi NOK per `settings.nokPerEur`.
- Totali, tetti (`budgetCap`, `budgetCapByCategory`), stime e media giornaliera in EUR (`formatEur`).
- Cambio aggiornato da Norges Bank, riserva BCE via Frankfurter, al massimo ogni 6 ore; si può fissare a mano.
- Prezzo del carburante in NOK (`car.priceNok`) da SSB, solo benzina e diesel; elettrica a mano.

Regole:
- La valuta di un importo è un codice ISO 4217 qualsiasi; NOK ed EUR restano validi.
- La valuta proposta per un nuovo importo è quella della nazione della tappa o dell'elemento; l'utente la può cambiare.
- Budget, tetti e stime restano in EUR (valuta del viaggio).
- Il viaggio tiene un cambio per ogni valuta usata, con valore, data, fonte e «automatico/a mano»; le regole di oggi valgono per ogni valuta.
- Un importo in una valuta senza cambio è «costo senza importo convertibile», mai zero.
- Fonte automatica per valute diverse da NOK: da scegliere dall'architetto; senza fonte verificata il cambio si inserisce a mano.
- Carburante: prezzo e valuta per nazione; aggiornamento automatico solo dove c'è una fonte ufficiale (oggi SSB per la Norvegia), altrove a mano. Un tratto in una nazione senza prezzo non usa il prezzo norvegese.
- Viaggi esistenti: `nokPerEur` e i campi collegati diventano il cambio NOK del viaggio, con stessi valori e date.

### 5.2 Fuso orario
Oggi: `Europe/Oslo` fisso nel calendario `.ics` (`domain/exportFormats.ts`, con regole CET/CEST scritte) e nella richiesta meteo (`openMeteo.ts`); il diario salva `tzOffsetMin` di chi scrive.

Regole:
- Ogni nazione ha un fuso (IANA). Orari di tappe, attività, traghetti e crociere si leggono nel fuso della nazione dove avvengono.
- Voli e tratti tra nazioni: partenza nel fuso di partenza, arrivo nel fuso di arrivo; le durate restano in minuti.
- `.ics`: un `TZID` per ogni fuso usato. Meteo: fuso della nazione della tappa.
- Nazioni con più fusi: fuori ambito; la nazione ne ha uno solo.

### 5.3 Lingua dei testi
Oggi: interfaccia e testi del catalogo in italiano scritti per l'app; `localName` per il nome locale; Wikipedia in it, poi en; mappa con `name:it`, poi nome locale.

Regole:
- Interfaccia in italiano (invariato).
- Testi del catalogo per lingua; l'italiano è richiesto per pubblicare una versione. Manca una traduzione: si mostra il nome locale con l'avviso.
- La lingua della nazione serve al nome locale e alle ricerche esterne; non cambia la lingua dell'interfaccia.

### 5.4 Regioni
Oggi: `Region` con 7 valori fissi; confini delle 15 contee raggruppati in `REGION_COUNTIES`; il configuratore filtra per regione.

Regole: regioni e confini per nazione e per versione del catalogo; nel configuratore e nel catalogo le regioni si raggruppano per nazione; un luogo appartiene a una sola regione della sua nazione.

### 5.5 Operatori di trasporto
Oggi: `CoastalOperator` = Hurtigruten | Havila; porti Bergen–Kirkenes, fatti, fonti e 24 proposte nei file; treni `RAIL` nel configuratore.

Regole:
- Operatori, porti, proposte e collegamenti ferroviari sono dati del catalogo della nazione.
- Una crociera esistente conserva `operator` e `catalogId` e si collega all'operatore e alla proposta della versione 1.
- Se una nazione non ha navi o treni nel catalogo, il configuratore non li propone e lo dice.
- Prezzi e orari restano quelli pubblicati e datati; nessun prezzo ricavato da un'altra nazione o stagione.

### 5.6 Aeroporti
Oggi: aeroporti come luoghi `aeroporti` del catalogo; raggio 110 km in linea d'aria per voli interni (`AIRPORT_RADIUS_KM`); partenza dall'Italia BRI, poi FCO.

Regole: aeroporti di arrivo e ripartenza scelti tra quelli di tutte le nazioni del viaggio; partenza da casa invariata (`homeAirports`); la regola dei voli interni vale anche tra nazioni diverse, sempre «da verificare».

### 5.7 Percorsi tra nazioni diverse
- Un tratto tra tappe di nazioni diverse è un tratto normale, calcolato con lo stesso provider (OSRM), e indica il passaggio di confine.
- Traghetti internazionali come segmenti separati con attesa, orario e costo.
- Se il calcolo fallisce vale la regola attuale: stima in linea d'aria dichiarata, mai nei totali.
- Stime del configuratore (fattore 1,7 e 52 km/h, tarati sulla Norvegia): parametro per nazione; per le altre nazioni la stima è dichiarata «non tarata».
- Il configuratore propone basi e visite solo nelle nazioni del viaggio.

### 5.8 Nazione di una tappa
- Tappa da un luogo del catalogo: nazione del luogo.
- Tappa senza luogo del catalogo o notte a bordo: vedi D4.

## 6. Requisiti non funzionali

| Area | Requisito |
|---|---|
| Piano gratuito Supabase | Storage privato entro 1 GB (dal piano). Gli altri limiti del piano gratuito (spazio DB, traffico, inattività) li verifica l'architetto-dati sulla documentazione ufficiale e li riporta in `docs/architettura.md`. L'app mostra lo spazio usato dagli allegati |
| Ambiente | Prove solo su `norway-planner-prova`; produzione `norway-planner` e `main` intoccati (piano) |
| Privacy | RLS per utente su tutte le tabelle del viaggio, preferenze e contesto; `trip_members` predisposta, non attiva. Cataloghi: lettura per utenti autenticati, scrittura solo da migrazioni. Allegati in bucket privato, accesso solo del proprietario, link temporanei. Nessun dato personale nell'URL. Meteo con coordinate arrotondate (regola attuale) |
| Segreti | Solo URL e chiave pubblica nel frontend; nessuna chiave nel repository o nei documenti |
| Compatibilità | Si leggono i viaggi in formato 1 e 2, i backup JSON esportati e i campi facoltativi di oggi (`ideas`, `verification`, `flights`, `catalogId`…). Esportazione e importazione del file JSON restano. Un documento più recente dell'app non si sovrascrive |
| Nessuna perdita | Migrazione ripetibile e idempotente, test di confronto, `trips.data` conservata, ritorno indietro documentato. Coda e allegati non caricati sopravvivono a chiusura, aggiornamento dell'app e cambio utente |
| Offline | Modalità viaggio completa senza rete con i cataloghi caricati; spazio locale sufficiente per viaggio e cataloghi: la scelta dell'archivio (localStorage o IndexedDB) è dell'architetto |
| Attendibilità | Fonti, date di verifica e licenze per campo; stati confermato / stimato / da verificare / prenotato / pagato invariati |
| Accessibilità e telefono | Le nuove schermate seguono le regole attuali (390 px senza scorrimento orizzontale, focus, contrasto) |

## 7. Criteri di accettazione

| # | Criterio | Come si verifica |
|---|---|---|
| 1 | Fuori dal DB restano solo le voci «Dispositivo» del §2.3 | ricerca di `localStorage`, `sessionStorage`, `indexedDB` in `src/`: ogni uso è nell'elenco |
| 2 | Il viaggio migrato è identico all'originale | test: documento ricostruito dalle tabelle uguale a `trips.data` su una copia esportata; seconda esecuzione senza righe nuove |
| 3 | Nuovo viaggio con scelta della nazione e catalogo caricato | test e browser: UC1 |
| 4 | Seconda nazione di prova: il catalogo si somma senza modifiche al codice | test con nazione fittizia solo nei test: luoghi di entrambe nel catalogo, nessun `if` per nazione |
| 5 | Terza nazione e rimozione con conferma | test: UC2 e UC3, nessun dato tolto senza conferma |
| 6 | Il catalogo del viaggio non cambia con una versione nuova; il viaggio indica la versione | test: pubblicata N+1, il viaggio resta su N anche dopo ricarica e su un altro dispositivo |
| 7 | Secondo dispositivo: viaggio, preferenze, contesto e allegati | test con server simulato e prova su `norway-planner-prova`: UC8 |
| 8 | Offline: modifiche e allegati arrivano al ritorno della rete senza duplicati | test con risposta persa e ripetizione: una sola riga e un solo file |
| 9 | Conflitti per riga visibili, nessuna sovrascrittura | test: UC9, tutti i casi elencati |
| 10 | RLS e Storage: nessun utente legge o modifica viaggi e file di altri; cataloghi in sola lettura | prova con due account di prova su `norway-planner-prova` |
| 11 | Fonti, date di verifica e licenze per campo | test: ogni luogo della versione 1 ha le stesse fonti di oggi |
| 12 | Valuta e fuso dalla nazione; nessun `Europe/Oslo`, `nokPerEur` o `Region` fisso nel codice (salvo lettura dei viaggi vecchi) | ricerca nel codice e test di budget con due valute |
| 13 | Budget con valuta senza cambio: «non convertibile», mai zero | test |
| 14 | Uscita con coda o allegati non caricati: avviso prima di cancellare | test: UC11 |
| 15 | Typecheck, lint, test, build e script nel browser passano | `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `verify/e2e/*.cjs` aggiornati |

## 8. Fuori ambito
- Tasto «Aggiorna catalogo» e processo che rifà il giro delle fonti (solo il modello delle versioni).
- Cataloghi reali di nazioni diverse dalla Norvegia (solo una nazione di prova nei test).
- Condivisione del viaggio con altri utenti (`trip_members` solo predisposta).
- Migrazione in produzione (approvazione separata).
- Nazioni con più fusi orari; traduzione dell'interfaccia.
- Mappe offline; nuove fonti di prezzi, orari o disponibilità.

## 9. Domande aperte per Filippo

**Risposte (2026-11-06): Filippo ha approvato tutte le proposte consigliate D1–D5 così come sono scritte qui sotto.**

| # | Domanda | Proposta consigliata |
|---|---|---|
| D1 | Senza cloud configurato o senza accesso, cosa resta della modalità locale? | Nella versione pubblicata serve l'accesso per creare viaggi; i viaggi solo locali si caricano al primo accesso; la copia offline resta usabile senza rete; modalità senza cloud solo per sviluppo e test con catalogo di prova |
| D2 | La modalità pianificazione/viaggio va nel DB per utente o resta una scelta per dispositivo? | Nel DB, ma per utente e dispositivo (identificativo locale del dispositivo); su un dispositivo nuovo segue la larghezza dello schermo come oggi |
| D3 | Togliendo una nazione con tappe, cosa fare delle tappe? | Chiedere conferma con l'elenco; togliere le tappe con le regole di oggi (attività e note restano senza giornata, si può annullare); mai la rimozione silenziosa |
| D4 | Nazione delle tappe senza luogo del catalogo e delle notti a bordo? | Tappa libera: la sceglie l'utente tra le nazioni del viaggio (proposta: la prima); notte a bordo: nazione del porto d'imbarco della crociera |
| D5 | Limiti per gli allegati, dato lo spazio di 1 GB? | Immagini e PDF, al massimo 10 MB per file, spazio usato visibile, avviso oltre l'80% |
