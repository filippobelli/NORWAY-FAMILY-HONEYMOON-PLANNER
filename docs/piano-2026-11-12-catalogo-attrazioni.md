# Piano 2026-11-12 — musei, parchi e attrazioni (catalogo NO-4)

**Obiettivo**: aggiungere al catalogo molti più musei, parchi e attrazioni, in tutta la Norvegia, con le foto.

**Richiesta di Filippo (12/11/2026)**: «cercale, caricale, pubblicale senza chiedere nient'altro a meno che tu non abbia dubbi».

## Scelte

- **Tutta la Norvegia**, non una zona sola: le tappe del viaggio non sono decise, e fuori dal nord il catalogo aveva pochissimi musei e parchi.
- **Una versione nuova, NO-4**: contiene tutta NO-3 (stesse righe, foto e consigli compresi) più i luoghi nuovi. NO-1, NO-2 e NO-3 non cambiano. Il viaggio passa a NO-4 solo quando lo decide chi lo usa (Impostazioni › Nazioni e cataloghi).
- **Stessa catena di NO-3**: candidati → `scripts/harvest-places.mjs --set attrazioni` → `docs/ricerca-luoghi-attrazioni.json` → `scripts/build-nord.mjs attrazioni` → `src/data/attrazioniFonti.ts` + schede a mano in `src/data/attrazioniSchede.ts` → `buildNorwayV4()` → `supabase/seed/catalogo-norvegia-v4.sql`.
- **Nessuna migrazione**: le tabelle sono quelle di NO-3.
- **Foto anche per i luoghi che non ne avevano** (quelli di NO-1/NO-2 fuori dal nord), dallo stesso elemento Wikidata già abbinato.
- **Nessun consiglio nuovo**: i consigli vengono solo da pagine ufficiali lette una per una; in questo giro non sono state lette.

## Regole dei dati (invariate)

- Coordinate solo da Wikidata (P625) o OpenStreetMap (Nominatim), con la fonte; il punto indicativo dei candidati serve solo a scegliere fra omonimi e non viene salvato.
- Foto solo da Wikimedia Commons, licenza libera, con autore e licenza; escluse foto d'archivio, carte e riproduzioni.
- Testi scritti per l'app, «da verificare»; niente prezzi, orari o disponibilità. Idoneità per i bambini, difficoltà e durata sono stime.
- Chiusure note (per esempio il museo delle navi vichinghe, in riapertura nel 2027) sono scritte nella scheda come cosa da verificare.

## Criteri di accettazione

1. NO-4 contiene tutte le righe di NO-3 (test e controllo nel database).
2. Ogni luogo nuovo ha coordinate con fonte e cade nella sua regione (test con riquadri per regione).
3. Seed di NO-1, NO-2 e NO-3 rigenerati identici.
4. typecheck, test, lint, build.
5. Nel database: NO-4 pubblicata, impronte per tabella uguali a quelle del seed locale, NO-1/NO-2/NO-3 e i viaggi non toccati.

## Cosa non va toccato

Dati dei viaggi, versioni già pubblicate, `src/data/nordFonti.ts` (è il dato di NO-3: non si rigenera).
