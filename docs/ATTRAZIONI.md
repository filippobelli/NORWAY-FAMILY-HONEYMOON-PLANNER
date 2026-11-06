# Attrazioni e cose da fare per tappa

Come funziona il modulo «Cosa fare» e come mantenere il catalogo. Ultimo aggiornamento: 6 novembre 2026.

## Concetti

| Concetto | Dove vive | Note |
|---|---|---|
| Tappa | `trip.stops[]` | dove si dorme |
| Scheda del luogo | `src/data/destinations.ts` (voce del catalogo) + `src/data/attractions.ts` (scheda verificata) | una sola volta, riusata da tutte le tappe |
| Idea salvata | `stop.ideas[]` (id delle schede) | nessun giorno, il programma non cambia |
| Attività pianificata | `trip.days[giorno].activities[]` con `destinationId` | collegata alla scheda; durata vuota = stima del catalogo |
| Attività personale | `trip.days[giorno].activities[]` senza `destinationId` | solo il testo dell'utente |

Regole (in `src/domain/thingsToDo.ts`, con test in `tests/cosafare.test.ts`):

- una scheda non è mai contemporaneamente idea e attività pianificata della stessa tappa: pianificarla la toglie dalle idee, toglierla dal giorno la rimette tra le idee;
- si pianifica solo nelle giornate in cui si dorme nella tappa; «Cambia giornata» sposta la stessa attività, senza copie;
- pianificare non vuol dire prenotare, verificare o visitare: la verifica dell'attività resta «da verificare» e lo stato di visita si segna in Oggi;
- `stop.ideas` è facoltativo: i viaggi salvati prima si leggono senza cambiamenti, nessuna migrazione (formato 2);
- le idee stanno nella tappa, quindi seguono le versioni del percorso; il confronto del Piano B dice quali idee restano fuori quando si toglie una tappa.

## Fonti per tipo di informazione

| Informazione | Fonte | Licenza |
|---|---|---|
| Nome, indirizzo, al coperto/all'aperto, prenotazione consigliata o no | sito ufficiale dell'attrazione, letto a mano | solo fatti, riscritti; nessun testo copiato |
| Coordinate delle schede nuove | Wikidata, proprietà P625 | CC0 |
| Coordinate delle voci precedenti | OpenStreetMap via Nominatim (`coordVerification.ts`) | ODbL: singoli punti con attribuzione e link all'oggetto |
| Descrizioni brevi | scritte per l'app sui fatti verificati | — |
| Durata indicativa, «adatto ai bambini» | valutazione editoriale dell'app, dichiarata come tale | — |
| Foto | Wikimedia Commons (immagine P18 di Wikidata) | mostrata solo dopo aver letto autore e licenza del file da Commons; altrimenti segnaposto |
| Orari e prezzi | **non riportati**: si dice solo se il sito li pubblica | da controllare sul sito per le date del viaggio |

Non usati: VisitOSLO (termini d'uso non leggibili il 06/11/2026, HTTP 403), Google Places (costi, chiave e limiti di memorizzazione: serve un'approvazione esplicita), scraping di siti, testi di Wikipedia nel catalogo (la scheda completa del catalogo li legge al momento con licenza e link, come prima).

## Schede verificate (06/11/2026)

Oslo: Museo Fram, Museo del Popolo Norvegese (Norsk Folkemuseum), Museo Kon-Tiki, MUNCH, Parco delle sculture di Vigeland, Museo norvegese della tecnica (Norsk Teknisk Museum), Museo dello sci di Holmenkollen, TusenFryd (fuori città, circa 20 km secondo il sito; stagionale, riapertura indicata per il 24/04/2027).

Restano da verificare per ogni visita: orari e date di agosto 2027, prezzi, eventuali prenotazioni obbligatorie in alta stagione, trasferimenti verso Holmenkollen, Kjelsås e TusenFryd.

Acquari: nessun acquario pubblico trovato a Oslo (ricerca su Wikidata, 06/11/2026). Gli acquari del catalogo (Bergen, Ålesund, Tromsø) compaiono nelle rispettive tappe come schede non ancora verificate.

Altre tappe: il pannello propone le voci del catalogo entro 30 km in linea d'aria, segnate «scheda non ancora verificata» finché non hanno una scheda in `attractions.ts`.

## Aggiungere o aggiornare una scheda

1. Aggiungi la voce in `src/data/destinations.ts` (categoria `musei`, `parchi`, `natura` o `fauna`) con una descrizione breve scritta da te.
2. Aggiungi il sito ufficiale in `src/data/officialSites.ts` dopo averlo aperto.
3. Aggiungi la scheda in `src/data/attractions.ts`: `base` (voce della città), zona, indirizzo dal sito, `setting` solo se evidente, nota sulla prenotazione con le parole del sito, `wikidata` e coordinate P625, fonti con `checkedAt`.
4. Per la foto aggiungi in `src/data/wiki.ts` l'elemento Wikidata e il nome del file P18: autore e licenza vengono letti da Commons prima di mostrarla.
5. Esegui `npm test`: il test `cosafare.test.ts` controlla fonti, date, coordinate e l'assenza di orari e prezzi nelle schede.

Per aggiornare una verifica cambia `checkedAt` (data di oggi) e i fatti cambiati; non lasciare date vecchie su dati riletti.
