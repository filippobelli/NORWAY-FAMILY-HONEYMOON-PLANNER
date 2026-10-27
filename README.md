# Norway Family Honeymoon Planner

Pianificatore del viaggio di famiglia in Norvegia (agosto 2027, 2 adulti + 2 bambini di 8 e 5 anni).
Contesto e regole del progetto: [CLAUDE.md](CLAUDE.md). Stato di avanzamento e limiti: [docs/STATO.md](docs/STATO.md).

## Cosa fa (versione 0.1 — Milestone 1)

- **Itinerario**: tappe dal catalogo, luoghi personalizzati o notti a bordo; notti per tappa; riordino; avvisi su durata (15–20 giorni), giornate pesanti, cambi di alloggio troppo frequenti, tratti non calcolati.
- **Collegamenti reali**: calcolo stradale con OSRM (dati OpenStreetMap). I traghetti sul percorso vengono riconosciuti e separati dalla strada; attese, orari e costi restano da inserire. Tratti manuali per traghetto, treno, bus, aereo e nave costiera.
- **Mappa** (Leaflet + OpenStreetMap): tappe numerate, tratti colorati per mezzo, catalogo cliccabile. I collegamenti non calcolati sono linee tratteggiate sottili, mai presentate come distanze.
- **Giornate**: calendario generato dalle notti, trasferimenti del giorno, attività, note, piano B per il maltempo, suggerimenti nei dintorni.
- **Navigazione costiera**: fatti verificati su Hurtigruten e Havila (27/10/2026), 34 porti della rotta, confronto di opzioni con prezzo, stato, cabina, pasti, note per la famiglia; collegamento ai tratti e al budget.
- **Hytte**: ricerca strutture vicine su OpenStreetMap, link precompilati a Google Maps / Booking / Airbnb con date e bambini, scheda completa della sistemazione, stato (individuata → prenotata), alternative per tappa.
- **Budget**: voci manuali + voci derivate da hytte, costiera, traghetti, carburante e attività; totale, media giornaliera, suddivisione per categoria e per stato (confermato, stimato, da verificare, prenotato, pagato); conversione NOK→EUR.
- **Salvataggio**: automatico nel browser; backup JSON; cloud Supabase opzionale con login e controllo dei conflitti.

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

## Attivare il salvataggio cloud (Supabase)

Facoltativo: senza questi passaggi l'app lavora in modalità locale e lo dichiara nell'intestazione.

1. Crea un account e un nuovo progetto su https://supabase.com (piano gratuito).
2. Nel progetto apri **SQL Editor**, incolla il contenuto di `supabase/schema.sql` ed esegui.
3. Apri **Project Settings → API** e copia **Project URL** e **anon public key**.
4. Copia `.env.example` in `.env.local` e incolla i due valori (oppure inseriscili nella sezione Salvataggio dell'app).
5. Riavvia `npm run dev`.
6. Nella sezione **Salvataggio** clicca **Registrati**, poi conferma l'email se Supabase la richiede, poi **Accedi**.
7. Clicca **Salva nel cloud**. Il salvataggio è confermato solo quando il server restituisce la data di aggiornamento.

Non usare mai la `service_role` key nel frontend.

## Servizi esterni

| Servizio | Uso | Note |
|---|---|---|
| routing.openstreetmap.de (OSRM, FOSSGIS) | Distanze e tempi stradali, traghetti | Max 1 richiesta/s, nessun uso massivo, attribuzione obbligatoria |
| tile.openstreetmap.org | Sfondo mappa | Attribuzione OSM |
| unpkg.com (Leaflet 1.9.4) | Libreria mappa | Caricata al primo uso |
| overpass-api.de + 2 mirror | Hytte e campeggi vicini | Servizio pubblico spesso sovraccarico |
| Supabase | Login e salvataggio cloud | Facoltativo |

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
