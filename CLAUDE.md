# CLAUDE.md — Norway Family Honeymoon Planner

Le istruzioni complete del progetto sono in `docs/CONTESTO.md` (copia del documento "Viaggio in Norvegia 2027.md" del Project claude.ai). Leggilo prima di modificare il codice.

## Regole essenziali

- Viaggio di famiglia in Norvegia, agosto 2027, 15–20 giorni, 2 adulti + 2 bambini (8 e 5 anni). Tappe, voli, auto, date e prenotazioni NON sono decisi.
- Non inventare coordinate, prezzi, orari, disponibilità o collegamenti. Distinguere sempre: confermato, stimato, da verificare, prenotato, pagato.
- Mai la distanza in linea d'aria come distanza stradale. Traghetti come segmenti separati (attesa, orario, costo).
- Non effettuare prenotazioni o acquisti; non modificare servizi cloud o di produzione senza autorizzazione; niente segreti nel repo.
- Modifiche progressive e non distruttive; non sovrascrivere dati dell'utente.
- Prima di consegnare: `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`.

## Stato

Vedi `docs/STATO.md` (verifiche, limiti, configurazioni mancanti, prossime milestone).

## Architettura

- `src/domain` logica pura testata; `src/services` provider sostituibili (routing OSRM, mappa Leaflet da CDN, Overpass, Supabase REST); `src/ui` schermate; `src/state` stato + salvataggio locale.
- Il viaggio è un documento `Trip` versionato (`schemaVersion`), salvato in localStorage, file JSON o tabella `trips` su Supabase (RLS per utente).
