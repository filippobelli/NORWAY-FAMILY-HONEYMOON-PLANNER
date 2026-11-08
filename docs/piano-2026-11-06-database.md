---
type: piano
created: 2026-11-06
updated: 2026-11-06
stato: in attesa di approvazione (Approvazione 1, seconda versione)
---

# Piano · Tutti i dati nel database, catalogo per nazione

## Obiettivo
Il database Supabase contiene tutti i dati (viaggi, cataloghi delle nazioni, preferenze, allegati); sul dispositivo resta solo la copia per l'uso senza rete. All'inizio si sceglie la nazione e l'app carica il suo catalogo; se ne possono aggiungere altre (2, 3, 4…).

## Decisioni di Filippo (2026-11-06)
1. **Copia locale per l'offline**: resta. È l'unica cosa fuori dal database.
2. **Allegati del diario**: in Supabase Storage privato (piano gratuito, 1 GB), con copia locale finché non sono caricati.
3. **Catalogo**: una volta caricato nel viaggio resta quello. In futuro un tasto «Aggiorna» potrà rifare il giro delle fonti e proporre le novità, oppure rigenerare il catalogo e sostituire quello precedente. Ora si prepara solo il modello che lo rende possibile (versioni del catalogo); il tasto non si fa.
4. **Ambiente di prova**: progetto Supabase `norway-planner-prova` (ref `udsnhqokzqwzeebvsadf`, Francoforte), già esistente e attivo (controllato in sola lettura il 2026-11-06). La produzione `norway-planner` non si tocca.
5. **Nel database va praticamente tutto**: anche preferenze, valori del configuratore e contesto di lavoro (ultima vista, giornata e tappa scelte, messaggio di attivazione). Sul dispositivo restano solo copia offline, coda delle modifiche, cache temporanee (meteo, cambio, testi Wikipedia) e stato puramente visivo (scorrimento, pannello aperto).

## Situazione attuale (dal codice, 2026-11-06)
| Dato | Dove sta oggi |
|---|---|
| Viaggio intero | `localStorage` + `trips.data` JSONB, un unico blocco per viaggio |
| Catalogo (82 luoghi, schede attrazioni, porti, crociere, aeroporti, siti ufficiali, Wikidata) | file in `src/data/`, solo Norvegia |
| Preferenze, configuratore, modalità | `localStorage` |
| Contesto di lavoro (selezione, ultimo giorno, attivazione) | `sessionStorage` |
| Allegati del diario | IndexedDB, solo dispositivo |

Legati alla Norvegia nel codice: regioni fisse (`Region`), corona (`nokPerEur`), fuso `Europe/Oslo` nel calendario, Hurtigruten/Havila, aeroporti di casa italiani.

## Modello proposto
**Cataloghi, condivisi e versionati per nazione**
- `countries`: codice ISO, nome, valuta, fuso orario, lingua.
- `catalog_releases`: una versione del catalogo di una nazione (numero, data, note sulle fonti). La prima per la Norvegia nasce dai file attuali.
- `regions`, `places` (città, attrazioni, aeroporti, porti, aree) con chiave stabile tra le versioni (`place_key`), `place_sources` (fonte, data di verifica, licenza per campo), `operators` e `voyages` (navi, traghetti), testi per lingua.
- Lettura per gli utenti autenticati; scrittura solo tramite migrazioni o, in futuro, dal processo di aggiornamento.

**Viaggio, privato per utente**
- `trips` (titolo, date, partecipanti, impostazioni) e `trip_countries` (nazione + versione del catalogo caricata, ordine). Aggiungere una nazione = aggiungere una riga e scaricare il suo catalogo.
- `trip_versions` (versioni e Piano B), `stops`, `legs`, `segments`, `days`, `activities` (`place_key` vuoto = attività personale), `stop_ideas`, `accommodations`, `flights`, `coastal_options`, `budget_items`, `diary_entries`, `diary_attachments` (file in Storage), `visit_states`, `plan_log`.
- `trip_members` pronta per condividere il viaggio in futuro.
- `user_preferences` e `user_context` (modalità, configuratore, ultima vista, giornata e tappa scelte).
- Valuta e fuso orario vengono dalla nazione della tappa, non più fissi nel codice.

**Uso senza rete e sincronizzazione**
- Copia locale del viaggio, dei cataloghi delle sue nazioni e degli allegati non ancora caricati.
- Sincronizzazione per riga, non per documento intero; i conflitti restano visibili e li sceglie l'utente.

**Passaggio senza perdite**
- Script ripetibile: dal JSONB attuale alle tabelle, con test di confronto su una copia esportata.
- La colonna `data` resta come copia di sicurezza finché la verifica in produzione non è chiusa.

## Compiti
| # | Agente | Cosa fa | Produce |
|---|---|---|---|
| 1 | analista | Elenco di tutti i dati e di dove vanno; cosa resta sul dispositivo e perché; casi d'uso: scelta della prima nazione, aggiunta di altre, catalogo fisso nel viaggio, uso offline, allegati, aggiornamento futuro del catalogo | `docs/spec.md` |
| 2 | ux-ui | Scelta della nazione all'inizio, «Aggiungi nazione», versione del catalogo visibile, stato di caricamento/offline e degli allegati | `docs/design.md` + mockup |
| 3 | architetto-dati | Schema, RLS, Storage, migrazioni numerate in `supabase/migrations/`, seed Norvegia (versione 1), sincronizzazione per riga, migrazione dal JSONB con ritorno indietro | `docs/architettura.md`, file SQL |
| 4 | sviluppatore | Livello dati nuovo, copia offline, coda per riga, caricamento allegati, scelta e aggiunta delle nazioni, valuta e fuso dalla nazione, rimozione dei dati fissi dal codice, ramo `feature/database-multinazione` | codice e test sul ramo |
| 5 | revisore | Criteri, test, migrazione su copia, sicurezza RLS e Storage | `docs/review.md` |
| 6 | deploy-ops | Migrazioni e prove su `norway-planner-prova` e su un'anteprima Vercel, mai in produzione | `docs/deploy.md` |

## Criteri di accettazione
1. Fuori dal database restano solo copia offline, coda delle modifiche, cache temporanee e stato visivo: elenco nella spec.
2. Il viaggio attuale migrato è identico all'originale (test di confronto).
3. Nuovo viaggio: si sceglie la nazione e si carica il suo catalogo; si aggiunge una seconda nazione (di prova, solo nei test) e il suo catalogo si somma al primo senza modifiche al codice.
4. Il catalogo caricato nel viaggio non cambia se nel database arriva una versione nuova; il viaggio indica quale versione usa.
5. Su un secondo dispositivo si ritrovano viaggio, preferenze, contesto di lavoro e allegati.
6. Senza rete la modalità viaggio funziona; modifiche e allegati fatti offline arrivano nel cloud al ritorno della rete, senza duplicati.
7. RLS e Storage: nessun utente legge o modifica viaggi e file di altri; cataloghi in sola lettura.
8. Fonti, date di verifica e licenze del catalogo restano per campo.
9. Typecheck, lint, test, build e script nel browser passano.

## Cosa non va toccato
- Progetto Supabase di produzione `norway-planner` e dati reali del viaggio, fino all'approvazione specifica.
- `main` e il deploy Vercel di produzione.
- Le chiavi: mai nel repository o nei documenti.

## Punti di approvazione
1. **Ora**: questo piano.
2. Dopo `docs/spec.md`.
3. Dopo `docs/design.md`.
4. Prima di applicare migrazioni o creare il bucket su `norway-planner-prova`, e prima di toccare variabili d'ambiente.
5. Separatamente, prima della migrazione in produzione.

## Fuori da questo lavoro
- Il tasto «Aggiorna catalogo» e il processo che rifà il giro delle fonti: solo predisposto dal modello delle versioni.
- Cataloghi di nazioni diverse dalla Norvegia: il modello li ospita, i dati si raccoglieranno dopo.
