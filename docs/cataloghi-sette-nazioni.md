# Slovenia, Austria, Spagna, Portogallo, Croazia, Grecia e Turchia

Intervento del 19 novembre 2026, partenza da `f328d2b` su main. Aggiunte sette prime release usando il modello esistente, senza nuove dipendenze o migrazioni dello schema.

| Nazione | Release | Schede | Aeroporti | Stazioni | Porti | Riferimenti fotografici |
|---|---|---:|---:|---:|---:|---:|
| Slovenia | SI-2 | 140 | 3 | 18 | 1 | 127 |
| Austria | AT-2 | 187 | 6 | 28 | 0 | 190 |
| Spagna | ES-1 | 235 | 27 | 26 | 17 | 228 |
| Portogallo | PT-1 | 171 | 10 | 18 | 7 | 171 |
| Croazia | HR-1 | 162 | 9 | 8 | 5 | 156 |
| Grecia | GR-1 | 205 | 25 | 16 | 9 | 214 |
| Turchia | TR-1 | 213 | 25 | 23 | 11 | 219 |

Totale: **1.313 schede**, incluse 105 schede aeroportuali, 137 stazioni e 50 porti; **1.305 riferimenti fotografici**. La selezione comprende città, musei e luoghi culturali, parchi, natura, fauna e isole. La copertura è editoriale, non un censimento completo. L'Austria non ha porti marittimi; non ne sono stati inventati per raggiungere una quota. Un punto aeroportuale o ferroviario non garantisce voli o treni passeggeri attualmente attivi.

## Dati e fonti

- Selezione in `scripts/additional-countries.mjs`: titoli per identificare le entità, nomi italiani dove utili, zone editoriali e brevi testi originali. Nessun testo Wikipedia importato nel database.
- Coordinate, identificativi, IATA e riferimenti P856 tramite API Wikidata. Controllo di coordinate terrestri, ambito geografico e dichiarazioni di nazione, quando presenti. Dati strutturati [CC0](https://www.wikidata.org/wiki/Wikidata:Licensing).
- Corrispondenze ambigue escluse: la ricerca ammette solo etichette o alias esatti; le entità senza coordinate affidabili non diventano schede. Esclusioni e duplicati documentati in `src/data/catalogs/additional-countries-v1-audit.json`.
- Foto da Commons, con autore e licenza verificati per file: CC BY, CC BY-SA, CC0 o pubblico dominio con metadati sufficienti. [Regole di riuso](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia). Nessuna immagine scaricata nel repository o nel pacchetto offline.
- Enti turistici nazionali consultati per il contesto. `croatia.hr` ha restituito HTTP 429: il riferimento è conservato come istituzionale non verificato, senza data fittizia di controllo della pagina.
- I siti delle singole strutture importati da Wikidata sono riferimenti da verificare, non pagine dichiarate controllate singolarmente. Nessun prezzo, orario, disponibilità, durata, idoneità familiare o accessibilità inventato.
- Porti: coordinate dell'area portuale, non del molo o terminal da usare. Stazioni: nessuna tratta o coincidenza dedotta dalla loro presenza.
- Collegamenti alle fonti ferroviarie nazionali: SŽ, ÖBB, Renfe, CP, HŽPP, Hellenic Train e TCDD Taşımacılık. HŽPP non è stato raggiungibile durante la verifica; l'interfaccia lo dichiara. Le ricerche esterne richiedono rete e non equivalgono a biglietti prenotati.

## Pipeline e compatibilità

La procedura già esistente di acquisizione è parametrizzata, mantenendo invariato il comportamento dei sei cataloghi precedenti:

```sh
node scripts/harvest-international-v2.mjs --selection ./additional-countries.mjs --snapshot additional-countries-v1 --new-countries --resume
npx tsx scripts/seed-catalog.ts --country SI --version 2
```

Versioni attuali: SI e AT versione 2; ES, PT, HR, GR e TR versione 1. La fotografia `additional-countries-v1.json` va mantenuta congelata dopo la pubblicazione: per modificare una release pubblicata preparare una nuova versione. Il frontend non incorpora i cataloghi nel bundle: li scarica dal database e conserva la copia locale per l'offline. Le foto richiedono rete.

Nella verifica editoriale finale sono state corrette due attribuzioni di zona: il monastero francescano di Kostanjevica presso Nova Gorica (distinto da quello di Kostanjevica na Krki) e Familypark nel Burgenland. Le correzioni sono in SI-2 e AT-2, con chiavi corrette dichiarate, fonte ufficiale e test di invarianza delle altre schede. SI-1 e AT-1 restano riproducibili senza riscrivere dati pubblicati. Fonti: [monastero](https://www.samostan-kostanjevica.si/en/about-monastery), [Familypark](https://www.familypark.at/en/contact/).

`scripts/build-additional-countries.ts` riusa la conversione comune di `scripts/build-international.ts`. I seed precedenti producono gli stessi dati; i test ignorano soltanto la differenza LF/CRLF del checkout Windows. Nessuna modifica automatica a tappe, date, notti o attività dei viaggi.

Spagna: penisola, Baleari e Canarie. Portogallo: continente, Madeira e Azzorre. Il calendario usa i fusi insulari IANA tramite `src/domain/geographicTimezone.ts`, sulla base di nazione e coordinate dell'arcipelago. Non è un servizio mondiale di geocodifica dei fusi; senza coordinate conserva il fuso nazionale. Fonte: [IANA zone1970.tab](https://data.iana.org/time-zones/tzdb/zone1970.tab), pubblico dominio. Turchia: TRY ed Europe/Istanbul, senza applicare automaticamente il cambio o il prezzo del carburante norvegese.

## Controlli eseguiti

- Typecheck, lint e build di produzione superati; resta l'avviso esistente sulla dimensione del bundle.
- **296 test automatici** superati: vecchi cataloghi invariati, correzioni dichiarate, provenienza, IATA, chiavi univoche, punti logistici senza notti implicite, configuratore, serializzazione multinazione/TRY e calendario di Canarie, Madeira e Azzorre.
- **376 controlli browser internazionali** superati: release precedenti, sette nuove nazioni, SI-2/AT-2 e tredici nazioni estere insieme, cataloghi dalla copia locale, ricerca e filtri, porti, fonti ferroviarie, conferme, Escape/focus, cinque viste a 375 px, offline e assenza di errori JavaScript.
- Regressioni: e2e 60, planning 16, attrazioni 30, accessibilità 36. Totale: **518 controlli browser** superati. Dati e viaggi sintetici, servizi esterni bloccati o simulati.
- Screenshot mobile della Spagna ispezionato; nessun overflow rilevato.

## Database e pubblicazione

Caricati sul progetto `norway-planner`, in nove transazioni distinte, i file `supabase/seed/catalogo-{si,at,es,pt,hr,gr,tr}-v1.sql` e le due correzioni `catalogo-si-v2.sql` e `catalogo-at-v2.sql`. È stato omesso il blocco opzionale di eliminazione delle vecchie release: nessuna rimozione e nessuna migrazione dei viaggi.

Verificati sul database: le ultime release pubblicate delle sette nazioni, conteggi delle schede e delle foto della tabella e stesso numero di schede restituito da ciascun `catalog_bundle`. Le impronte dei due viaggi e dei cataloghi già presenti sono identiche prima e dopo il caricamento e le correzioni. Database dopo: 25.679.539 byte, circa **25,7 MB**; prima: 22.140.595 byte.

Il push su main avvia la pubblicazione automatica Vercel. L'esito va verificato sul commit. Non sono state usate sessioni utente reali per le prove; la visualizzazione dei nuovi cataloghi con l'account personale non è dichiarata verificata.
