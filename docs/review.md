# Revisione · Acquario di Tromsø (Polaria)

Data: 2026-11-04 · Agente revisore/QA · Ramo: `fix/acquario-tromso` (HEAD `d2333e6` = `main`, modifiche non ancora committate)
Piano: `docs/piano-2026-11-04-acquario-tromso.md` · Sviluppo: `docs/sviluppo.md`

## Esito: **APPROVATO**

Unica modifica al codice: `src/data/destinations.ts:103` (nome e descrizione di Polaria). Nessun bloccante.

## Criteri di accettazione

| Criterio | Esito | Prova |
|---|---|---|
| Cercando «acquario» compare Polaria | ✅ | Script con la stessa logica di `src/ui/CatalogView.tsx:26-29` (nome + nome locale + descrizione, minuscolo, `includes`): «acquario» → bergen, alesund, bergen-aquarium, atlanterhavsparken, **polaria** (anche con «Acquario») |
| Cercando «Tromsø» compare Polaria | ✅ | «Tromsø»/«tromsø» → tromso, **polaria**, tos |
| Nessun doppione | ✅ | Una sola scheda `polaria` su 77; nessun id duplicato; nessun'altra scheda con le stesse coordinate né entro ~500 m; unica altra scheda «acquario» nel nome è `bergen-aquarium` (Fiordi occidentali) |
| Id `polaria` invariato | ✅ | `git diff`: cambiano solo il 2° (nome) e il 10° campo (descrizione) del seed |
| Coordinate verificate collegate | ✅ | Scheda calcolata: `coordsStatus: "verificate"`, 69.64368 / 18.9499, fonte OSM `way/97567917` (`coordVerification.ts:73`) |
| Sito ufficiale collegato | ✅ | `officialUrl: https://polaria.no/` (`officialSites.ts:29`) |
| Foto/Wikidata collegate | ✅ (dato) | `wiki.ts:67` → Q28888, immagine «Polaria 01.JPG», legata all'id. Autore e licenza arrivano a runtime da Commons: da guardare a schermo (vedi sotto) |
| Nessun file fuori ambito | ✅ | `git status`: ` M src/data/destinations.ts`, `?? docs/piano-…md`, `?? docs/sviluppo.md` (più questo `docs/review.md`) |
| Nessun dato inventato | ✅ | Nessun prezzo/orario; `reliability: "da_verificare"`; «Tromsø» era già nel campo accesso e «acquario» corrisponde a `tourism/aquarium` di OSM |
| Controllo tipi | ✅ | vedi comandi |
| Test | ✅ | 141/141 |
| Build Vite | ⏳ | Non eseguibile su Linux (manca Rollup Linux): la fa Filippo su Windows. Non è un errore del lavoro |

## Bloccanti
Nessuno.

## Da migliorare (non bloccanti)
1. **Lint preesistente** — `src/ui/ConfiguratorView.tsx:97:26` e `:97:41`: `_m` e `_s` assegnati e non usati (`@typescript-eslint/no-unused-vars`). File identico a `main`, non toccato. `eslint src/data/destinations.ts` da solo: 0 problemi.
2. **Tappe già salvate**: `stopFromDestination` (`src/ui/ItineraryView.tsx:38`) copia il nome nella tappa. Le tappe di Polaria già create continuano a chiamarsi «Polaria» (l'id resta valido, nulla si rompe); solo le nuove avranno «Polaria – acquario artico».
3. **Ricerca senza «ø»**: «tromso» (scritto senza ø) non trova nulla, neanche la città. Limite generale del filtro, fuori ambito: eventuale compito futuro (normalizzare ø/å/æ).
4. **Cartella `undefined/`** nella radice del repo (7 screenshot del 28/10, già tracciati): non legata a questo lavoro, valutare se spostarla.
5. In `docs/sviluppo.md` il passo `git add` non include `docs/piano-…md` e `docs/review.md`: decidere se committarli.

## Comandi eseguiti (VM Linux, nessuna modifica a `node_modules`)
`ESBUILD_BINARY_PATH=/opt/cowork-node-tools/node_modules/@esbuild/linux-x64/bin/esbuild` (esbuild Linux 0.28.2, stessa versione del repo), `TMPDIR=$HOME/tmp`. Script usa-e-getta in `$HOME/qa/`, fuori dal repo.

| Comando | Esito |
|---|---|
| `git branch --show-current` | `fix/acquario-tromso` |
| `git status --short` / `git diff` | 1 file di codice, 1 riga cambiata |
| `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` | OK (exit 0) |
| `node node_modules/tsx/dist/cli.mjs --test tests/*.test.ts` | 141 pass, 0 fail |
| `node node_modules/eslint/bin/eslint.js .` | 2 errori preesistenti in `ConfiguratorView.tsx:97` |
| `$HOME/qa/cerca.ts`, `$HOME/qa/c2.ts` (filtro catalogo + doppioni) | come in tabella criteri |
| `npm run build` | non eseguito (Rollup Linux assente) |

## Cosa deve controllare Filippo a mano
1. Su Windows, nella cartella del progetto, eseguire `npm run build` e verificare che finisca senza errori.
2. Eseguire `npm run dev` e aprire «Luoghi da visitare».
3. Scrivere «acquario» nella ricerca: deve comparire «Polaria – acquario artico».
4. Scrivere «Tromsø»: deve comparire anche Polaria.
5. Aprire la scheda: controllare coordinate «verificate», link a polaria.no, foto con autore e licenza.
6. Se hai già una tappa Polaria nel viaggio, verificare che si apra ancora correttamente.
7. Poi commit e push come indicato in `docs/sviluppo.md`.
