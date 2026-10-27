# Norway Family Honeymoon Planner

Pianificatore del viaggio di famiglia in Norvegia (agosto 2027, 2 adulti + 2 bambini di 8 e 5 anni).
Contesto e regole del progetto: [CLAUDE.md](CLAUDE.md). Stato di avanzamento e limiti: [docs/STATO.md](docs/STATO.md).

## Cosa fa (versione 0.1 — Milestone 1)

- **Itinerario**: tappe dal catalogo, luoghi personalizzati o notti a bordo; notti per tappa; riordino; avvisi su durata (15–20 giorni), giornate pesanti, cambi di alloggio troppo frequenti, tratti non calcolati.
- **Collegamenti reali**: calcolo stradale con OSRM (dati OpenStreetMap). I traghetti sul percorso vengono riconosciuti e separati dalla strada; attese, orari e costi restano da inserire. Tratti manuali per traghetto, treno, bus, aereo e nave costiera.
- **Mappa** (Leaflet + OpenStreetMap): tappe numerate, tratti colorati per mezzo, catalogo cliccabile. I collegamenti non calcolati sono linee tratteggiate sottili, mai presentate come distanze.
- **Giornate**: calendario generato dalle notti, trasferimenti teorici e realistici, carico di ogni giornata per la famiglia, proposte per alleggerire (mai applicate da sole), attività, note, piano B, suggerimenti nei dintorni.
- **Scenari**: itinerari alternativi (auto e hytte, auto con traghetti e navigazione, misto con treni) confrontati su durata, costi, km, trasferimenti, cambi di alloggio e dati da verificare.
- **Navigazione costiera**: fatti verificati su Hurtigruten e Havila (27/10/2026), 34 porti della rotta, confronto di opzioni con prezzo, stato, cabina, pasti, note per la famiglia; collegamento ai tratti e al budget.
- **Hytte**: ricerca strutture vicine su OpenStreetMap, link precompilati a Google Maps / Booking / Airbnb con date e bambini, scheda completa della sistemazione, stato (individuata → prenotata), alternative per tappa.
- **Budget**: voci manuali + voci derivate da hytte, costiera, traghetti, carburante e attività; totale, media giornaliera, suddivisione per categoria e per stato (confermato, stimato, da verificare, prenotato, pagato); conversione NOK→EUR.
- **Salvataggio**: automatico sul dispositivo e nel cloud Supabase (dopo l'accesso), con gestione dei conflitti tra dispositivi e invio delle modifiche fatte offline; backup JSON.

L'app non effettua prenotazioni o acquisti e non inventa prezzi, orari o disponibilità.

## Avvio in locale

Serve Node.js 20 o superiore.

1. Apri un terminale nella cartella del progetto.
2. Esegui `npm install`.
3. Esegui `npm run dev`.
4. Apri l'indirizzo mostrato (di solito http://localhost:5173).

Altri comandi:

| Comando | Cosa fa |
|---|---|
| `npm run typecheck` | Controllo TypeScript rigoroso |
| `npm test` | Test della logica (giornate, tratti, budget, rotta costiera, routing) |
| `npm run lint` | ESLint |
| `npm run build` | Controllo tipi + build di produzione in `dist/` |
| `node verify/build-local.mjs` | Anteprima in un solo file HTML (`dist-local/index.html`) |
| `node verify/e2e/e2e.cjs` · `sync.cjs` · `planning.cjs` · `a11y.cjs` | Test nel browser sull'anteprima (richiedono `npm i -D playwright` e `npx playwright install chromium`) |

## Salvataggio cloud (Supabase)

Già configurato: progetto `norway-planner` (Francoforte, piano Free), tabella `trips` con RLS, valori pubblici in `.env`.

Le registrazioni sono chiuse: possono accedere solo gli indirizzi presenti in `private.allowed_emails`.

1. Avvia l'app con `npm run dev`.
2. Apri la sezione **Salvataggio**, inserisci email e password e clicca **Accedi** (una volta per dispositivo).
3. Da quel momento il salvataggio è automatico: ogni modifica arriva nel cloud dopo circa 3 secondi. L'intestazione mostra "Salvato nel cloud · ora".
4. Su un altro dispositivo basta accedere: il viaggio si apre da solo e si aggiorna quando torni nell'app.
5. Se lo stesso viaggio viene modificato su due dispositivi prima della sincronizzazione, compare un avviso e scegli quale versione tenere: nessuna sovrascrittura silenziosa.

Per autorizzare un'altra persona:

1. In Supabase apri **SQL Editor** → **New query**.
2. Esegui `insert into private.allowed_emails (email) values ('indirizzo@esempio.it');` con l'indirizzo in minuscolo.
3. In **Authentication** → **Users** clicca **Add user** → **Send invitation** con lo stesso indirizzo.

Per usare un altro progetto Supabase: esegui `supabase/schema.sql` nello SQL Editor e sostituisci i valori in `.env`. Mai inserire la secret/service_role key.

## Servizi esterni

| Servizio | Uso | Note |
|---|---|---|
| routing.openstreetmap.de (OSRM, FOSSGIS) | Distanze e tempi stradali, traghetti | Max 1 richiesta/s, nessun uso massivo, attribuzione obbligatoria |
| tile.openstreetmap.org | Sfondo mappa (app servita via http/https) | Attribuzione OSM |
| server.arcgisonline.com (Esri World Topo) | Sfondo mappa quando si apre il file HTML con doppio clic | OSM e CARTO bloccano le richieste senza Referer |
| unpkg.com (Leaflet 1.9.4) | Libreria mappa | Caricata al primo uso |
| overpass-api.de + 2 mirror | Hytte e campeggi vicini | Servizio pubblico spesso sovraccarico |
| Supabase (progetto `norway-planner`) | Login e salvataggio cloud | Email di conferma obbligatoria alla registrazione |

Ogni servizio è isolato in `src/services/` e si può sostituire senza toccare le schermate.

## Struttura

```
src/
  domain/      modello dati e logica pura (giornate, tratti, budget, costiera)
  data/        catalogo destinazioni e porti costieri
  services/    routing, mappa, ricerca alloggi, salvataggio locale e cloud
  state/       stato del viaggio e salvataggio automatico
  ui/          schermate
supabase/      schema SQL con Row Level Security
tests/         test (node:test via tsx)
verify/        strumenti usati per verificare il codice senza accesso a npm (non servono a te)
```
