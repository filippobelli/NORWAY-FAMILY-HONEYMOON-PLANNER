# Piano · Acquario di Tromsø in «Luoghi da visitare»

Data: 2026-11-04 · Capo progetto · Stato: **in attesa di Filippo**

## Obiettivo
Avere l'acquario di Tromsø nel catalogo «Luoghi da visitare» con le stesse informazioni degli altri luoghi.

## Verifica preliminare
- L'acquario di Tromsø **è già nel catalogo**: è **Polaria** (`src/data/destinations.ts`, riga 103, id `polaria`, categoria «Musei e attività per bambini»).
- Ha già le stesse caratteristiche degli altri: coordinate verificate su OpenStreetMap (`coordVerification.ts`, `tourism/aquarium`), sito ufficiale `polaria.no` (`officialSites.ts`), Wikidata e foto (`wiki.ts`, Q28888), idoneità bambini 3, durata 1–2 ore.
- Gli manca solo la parola «acquario» nel nome e nella descrizione: cercando «acquario» non si trova.
- Aggiungere una seconda scheda creerebbe un doppione.

## Proposta (se Filippo conferma che è Polaria)
| # | Agente | Cosa fa | Legge | Produce |
|---|---|---|---|---|
| 1 | sviluppatore | Su ramo `fix/acquario-tromso`: nome «Polaria – acquario artico», descrizione con «acquario» (es. «Acquario artico con foche barbate»), da segnare come le altre «da verificare» | `src/data/destinations.ts`, `CLAUDE.md` | codice + `docs/sviluppo.md` |
| 2 | revisore | Build, test, ricerca «acquario» nel catalogo, nessun doppione, id `polaria` invariato | piano, `docs/sviluppo.md`, diff | `docs/review.md` |

## Criteri di accettazione
- Cercando «acquario» o «Tromsø» nel catalogo compare Polaria.
- La scheda mostra coordinate verificate, sito ufficiale e foto con autore e licenza, come prima.
- L'id `polaria` non cambia: tappe e preferiti già salvati restano validi.
- Build e test verdi.

## Da non toccare
- `main` (si lavora sul ramo), dati salvati su Supabase, deploy.
- Nessun dato inventato: prezzi e orari restano assenti come per gli altri luoghi.

## Punti di approvazione
1. Filippo conferma che l'acquario che intende è Polaria (oppure indica un altro luogo).
2. Via al compito 1.
