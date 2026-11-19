# Cataloghi internazionali · prima selezione

Preparati il 19 novembre 2026 sul commit di partenza `0d4d734`. Le sei release sono state caricate e pubblicate sul database `norway-planner` dopo autorizzazione dell'utente alla scrittura. La release del frontend viene pubblicata con il push su main e il deploy automatico Vercel; il relativo esito va verificato sul commit. Nessuna modifica ai viaggi reali, nessuna nuova dipendenza e nessuna migrazione dello schema richiesta da questo intervento.

| Nazione | Release | Schede | Foto Commons | Valuta | Fuso principale |
|---|---|---:|---:|---|---|
| Germania | DE-1 | 30 | 27 | EUR | Europe/Berlin |
| Francia | FR-1 | 30 | 34 | EUR | Europe/Paris |
| Giappone | JP-1 | 30 | 37 | JPY | Asia/Tokyo |
| Paesi Bassi | NL-1 | 30 | 40 | EUR | Europe/Amsterdam |
| Danimarca | DK-1 | 30 | 31 | DKK | Europe/Copenhagen |
| Svezia | SE-1 | 30 | 34 | SEK | Europe/Stockholm |

Totale: 180 schede e 203 riferimenti fotografici. Ogni catalogo comprende tre aeroporti e una selezione di città, musei o luoghi culturali, parchi e natura. È una copertura iniziale, non un inventario nazionale completo. Francia metropolitana, Paesi Bassi europei, Danimarca senza Groenlandia e Fær Øer. Le zone sono raggruppamenti editoriali senza confini cartografici importati.

## Provenienza e limiti

- Coordinate terrestri, identificativi, IATA e riferimenti ai siti provengono da dichiarazioni Wikidata, con controllo di nazione e intervallo geografico. Dati strutturati [CC0](https://www.wikidata.org/wiki/Wikidata:Licensing). Data di acquisizione nel singolo record.
- Descrizioni brevi originali in italiano. Non sono stati importati testi di Wikipedia o degli enti turistici. Le informazioni editoriali restano `da_verificare`.
- Foto da Wikimedia Commons, con autore e licenza del singolo file registrati. Sono accettati CC BY, CC BY-SA, CC0 o pubblico dominio con metadati sufficienti. Vedi [regole di riuso](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia). Nessuna foto viene scaricata nel repository o nel pacchetto offline. I luoghi senza foto funzionano con segnaposto.
- I siti ufficiali importati da P856 sono riferimenti da verificare: non è dichiarato che le pagine operative siano state controllate individualmente. Gli enti turistici nazionali sono fonti di contesto.
- Nessun orario, prezzo, disponibilità, durata, idoneità familiare o accessibilità è dedotto dalla categoria. I valori assenti rimangono assenti e vengono mostrati come da verificare.
- Crociere, traghetti, treni e relativi prezzi non sono ancora catalogati per queste sei nazioni. Il configuratore segnala i parametri stradali non calibrati. La stima temporanea di capacità giornaliera non diventa una durata certa dell'attività.
- Il prezzo automatico del carburante norvegese non viene applicato ai tratti esteri. I costi mancanti richiedono inserimento manuale. I calendari usano il fuso della tappa o dell'aeroporto disponibile; l'arrivo di un volo tra fusi differenti viene omesso quando manca la data di arrivo.

## Pipeline riproducibile

1. `scripts/cataloghi-internazionali.mjs`: selezione editoriale e metadati delle nazioni.
2. `scripts/harvest-international.mjs`: acquisizione tramite API pubbliche, timeout, backoff e ripresa. Eseguire solo per preparare una nuova release; rispettare l'[etichetta API](https://www.mediawiki.org/wiki/API:Etiquette).
3. `src/data/catalogs/international-v1.json`: fotografia dei dati della prima release, congelata. Una release pubblicata non va rigenerata con dati diversi: preparare una nuova versione e mantenere questo file.
4. `scripts/build-international.ts`: converte nel formato esistente `CatalogSeed`, senza importare il JSON nel bundle frontend.
5. `npx tsx scripts/seed-catalog.ts --country DE --version 1`: genera il file SQL transazionale. Ripetere per FR, JP, NL, DK, SE. I sei file pronti sono `supabase/seed/catalogo-xx-v1.sql`.

Gli script usano chiavi globali prefissate per nazione e il modello già esistente di schede, attività e versioni. Il catalogo resta consultabile dal dispositivo dopo il download; le foto richiedono rete. Il viaggio sceglie le nazioni con il flusso esistente, senza sostituire automaticamente le sue tappe.

## Caricamento e verifica

Il collegamento `supabase-norway` è stato autorizzato alla scrittura e verificato con `transaction_read_only = off`. I sei SQL sono stati applicati in transazioni separate, omettendo il blocco opzionale di rimozione delle versioni precedenti e aggiornamento dei viaggi. Verificati sul database: sei release pubblicate, 30 schede per release, stessi conteggi fotografici della tabella, 30 schede per ciascun `catalog_bundle`. Le impronte dei cinque bundle norvegesi e dei due viaggi sono identiche prima e dopo il caricamento. Database dopo il caricamento: 19.879.603 byte (circa 19,9 MB), incremento di circa 0,49 MB. La pubblicazione del frontend segue il processo automatico Vercel dopo il push su main.

Il working tree originale contiene modifiche contemporanee di un altro processo per gli aggiornamenti dei cataloghi norvegesi: sono preservate ed escluse dalla release, preparata in un worktree separato sul branch codex/cataloghi-internazionali.

## Controlli eseguiti

- Typecheck e lint: superati.
- Suite automatica della release isolata: 284 test superati, incluso il calendario Giappone–Francia.
- Build di produzione: superata; resta l'avviso preesistente sulla dimensione del bundle.
- Browser, sei cataloghi singoli e sei nazioni insieme: 84 verifiche superate, catalogo offline, aeroporti, regioni, dati mancanti, assenza di errori JavaScript e cinque viste a 375 px. Servizi esterni bloccati; dati e viaggi sintetici locali.
- Regressioni browser: percorso completo 60, planning 16, attrazioni 30, accessibilità 36 verifiche superate su desktop e telefono.
- Screenshot del catalogo giapponese ispezionato: corretta un'indicazione ereditata che attribuiva a OpenStreetMap tutte le coordinate. Fonti e date sono ora riferite alle singole schede.
- Verificato il caricamento reale e la restituzione dei sei nuovi bundle dal database, senza modifiche ai viaggi né ai cataloghi norvegesi.
- Non verificati: sincronizzazione con un account reale, disponibilità attuale di ogni sito P856 e foto su rete esterna, pubblicazione Vercel.
