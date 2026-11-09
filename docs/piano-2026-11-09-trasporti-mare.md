# Piano 2026-11-09 — Trasporti via mare: crociere e traghetti

**Obiettivo:** la sezione «Crociere» diventa «Trasporti via mare», con due parti: Crociere e Traghetti. I traghetti sono le tratte da A a B in giornata, con le tappe intermedie, la durata e la tariffa base, per capire dove si può usare meno l'auto.

## Decisioni di Filippo (2026-11-09)
1. **Zone:** fiordi e costa, in particolare Bergen e la costa a sud; Nordland con le Lofoten; Troms con Tromsø; il Finnmark fino a Capo Nord.
2. **Mezzi:** tutti: traghetti per auto (ferje), battelli veloci per passeggeri (hurtigbåt) e battelli turistici sui fiordi.
3. **Prezzi:** nel catalogo la tariffa base (adulto, bambino, auto). Quando una tratta entra nell'itinerario, l'app calcola il costo per 2 adulti, 2 bambini (8 e 5 anni) e, se la scegli, l'auto.
4. **Ambito:** solo tratte interne alla Norvegia; niente Danimarca, Germania o Svezia.

## Compiti
| # | Agente | Cosa fa | Legge | Produce |
|---|---|---|---|---|
| 1 | analista | Cerca chi gestisce le tratte nelle zone scelte: compagnie (Fjord1, Norled, Boreal, Torghatten e simili) ed enti regionali (Skyss, Kolumbus, Reis Nordland, Svipper, Snelandia e simili). Elenca le tratte con porti, tappe in ordine, durata, frequenza estiva, stagione, se porta l'auto, tariffa base con fonte e data. Valuta le alternative all'auto per tappe del viaggio (es. Bergen–Flåm via mare, Bodø–Lofoten, Tromsø–Harstad). | `docs/CONTESTO.md`, `src/data/coastalCatalog.ts`, `coastalPorts.ts`, `docs/architettura.md` | `docs/spec-trasporti-mare.md` + `docs/ricerca-traghetti.md` (tabella delle tratte con fonti) |
| 2 | ux-ui | Disegna «Trasporti via mare» con le due parti; ricerca e filtri per zona, mezzo e auto sì/no; scheda della tratta con tappe e durata; aggiunta al percorso come tratto separato (attesa, orario, costo per la famiglia); come il costo compare nel Budget. | spec, `src/ui/CoastalView.tsx`, `docs/design.md` | `docs/design-trasporti-mare.md` + mockup |
| 3 | architetto-dati | Tabelle del catalogo per tratte, tappe e tariffe, con fonte per ogni campo. Nuova versione del catalogo Norvegia (`NO-2`), con un modo per far passare il viaggio da `NO-1` a `NO-2` senza perdere nulla. Tipo di tratto «traghetto» collegato alla tratta del catalogo. Migrazione solo additiva. | spec, design, `docs/architettura.md`, `supabase/migrations/` | sezione in `docs/architettura.md` + migrazione + seed |
| 4 | sviluppatore | Rinomina e divide la sezione, carica le tratte dal catalogo, calcola il costo per la famiglia e l'auto, crea il tratto nel percorso, aggiunge i test. Ramo dedicato. | tutto il sopra | codice + test + script nel browser |
| 5 | revisore | Verifica dati, fonti, calcoli, assenza di dati inventati, comandi e script nel browser. | tutto | `docs/review.md` |

## Criteri di accettazione
- Ogni tratta ha una fonte e la data di lettura. Durata, tappe e prezzo sono segnati come confermati, da verificare o assenti; nessun valore è inventato.
- Una tariffa del 2026 è segnata come «tariffa di oggi, da verificare per il 2027» e non come prezzo certo.
- Il costo nel percorso è calcolato da adulto × 2, bambino × 2 (o gratis secondo l'età, se la fonte lo dice) e auto solo se scelta. Si vede da dove viene ogni parte del costo.
- Il traghetto nel percorso è un tratto a sé, con attesa, orario e costo. La distanza in linea d'aria non diventa mai distanza stradale.
- Le crociere attuali (Hurtigruten, Havila) funzionano come oggi, senza perdere i dati salvati.
- Il viaggio reale resta intatto; il passaggio a `NO-2` avviene solo quando lo chiedi tu.
- `npm run typecheck`, `npm test`, `npm run lint`, `npm run build` e gli script nel browser passano.

## Cosa non va toccato
- Il viaggio reale e i dati salvati (il formato resta documento, `VITE_PASSAGGIO_RIGHE` non si imposta).
- La versione `NO-1` del catalogo: è fissa, si aggiunge `NO-2`.
- Nessuna prenotazione o acquisto; nessuno scraping che violi i termini d'uso dei siti.

## Approvazioni
- 2026-11-09 — Filippo: «fai tutto, metti su main e pubblica… vai diretto senza fermarti». Valgono come approvazione di piano, spec, design, migrazione su `norway-planner`, pubblicazione di `NO-2` e merge su `main`. Ci si ferma solo per dubbi che richiedono la sua conferma.

## Punti di approvazione (previsti)
1. Questo piano.
2. Spec e ricerca delle tratte (compito 1).
3. Design (compito 2).
4. Prima della migrazione sul database `norway-planner` e della pubblicazione del catalogo `NO-2`.
5. Prima della pubblicazione su `main`.
