# Piano 2026-11-10 — Catalogo del nord, foto e scheda del luogo nell'itinerario

**Obiettivo:** il catalogo copre bene la zona nord (Bodø, Lofoten, Vesterålen, Senja, Tromsø e dintorni); ogni luogo ha fino a 3 foto e, dove una fonte ufficiale li dà, dei consigli; nell'itinerario ogni tappa mostra la sua scheda.

## Decisioni di Filippo (2026-11-10)
1. Ampliare molto il catalogo; mettere nel catalogo anche i luoghi che ha inserito a mano, con foto e descrizione.
2. Nell'itinerario: scheda descrittiva del luogo, 2 o 3 foto, consigli.
3. «Prima tutto il nord»: un solo passaggio di catalogo (`NO-3`) per tutta la zona, invece di partire dai soli 13 luoghi suoi.

## Zona («nord»)
Bodø e Salten, Lofoten, Vesterålen e Harstad, Narvik, Senja, Tromsø con Kvaløya e Lyngen. Helgeland e Finnmark restano per un passaggio successivo.

## Come
| # | Cosa | Produce |
|---|---|---|
| 1 | Raccolta dei dati di base: elemento Wikidata scelto per nome **e** distanza, coordinate (Wikidata P625 o OpenStreetMap), voci di Wikipedia, sito ufficiale, fino a 3 foto di Commons con autore e licenza | `scripts/harvest-places.mjs` → `docs/ricerca-luoghi-nord.json` |
| 2 | Schede in italiano scritte per l'app a partire dalle voci lette; consigli solo da fonti ufficiali, con fonte e data | `src/data/placesNord.ts` |
| 3 | Database: tabelle nuove `place_photos` e `place_tips` (solo aggiunte), `catalog_bundle` con due chiavi in più; `NO-1` e `NO-2` restano identiche | migrazione + rollback + `supabase/seed/catalogo-norvegia-v3.sql` |
| 4 | Catalogo `NO-3` = tutto `NO-2` + luoghi nuovi + foto + consigli | `buildNorwayV3()` in `scripts/seed-catalog.ts` |
| 5 | Itinerario: scheda del luogo sulla tappa (foto, descrizione, come arrivare, consigli, sito ufficiale); proposta «Collega alla scheda» per le tappe messe a mano vicino a un luogo del catalogo | `src/ui/PlaceCard.tsx`, `ItineraryView.tsx` |
| 6 | Test, lint, build, prove nel browser | — |

## Criteri di accettazione
- Nessuna coordinata inventata: ogni punto viene da Wikidata o OpenStreetMap, con fonte e data. Un luogo senza riscontro non entra nel catalogo.
- Le descrizioni sono segnate «da verificare» (scritte per l'app da voci di Wikipedia), come le schede esistenti.
- Solo foto di Wikimedia Commons con licenza libera; autore e licenza sempre mostrati.
- Un consiglio compare solo se ha una fonte ufficiale e una data di lettura; altrimenti il campo resta vuoto.
- Nessun prezzo, orario o disponibilità nelle schede nuove.
- `NO-2` contenuta identica in `NO-3`; il viaggio passa a `NO-3` solo quando lo chiede Filippo, da Impostazioni › Nazioni e cataloghi.
- Il collegamento di una tappa a una scheda lo conferma Filippo: l'app propone, non cambia il viaggio da sola.
- `npm run typecheck`, `npm test`, `npm run lint`, `npm run build` e gli script nel browser passano.

## Cosa non va toccato
- Il viaggio reale e i dati salvati. `VITE_PASSAGGIO_RIGHE` non si imposta.
- Le versioni `NO-1` e `NO-2` del catalogo.
- Nessuna prenotazione o acquisto.

## Punti di approvazione
1. Prima della migrazione su `norway-planner` e della pubblicazione di `NO-3`.
