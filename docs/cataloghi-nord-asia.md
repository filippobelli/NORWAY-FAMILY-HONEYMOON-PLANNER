# Islanda, Finlandia, Regno Unito, Irlanda e Asia

Intervento del 19 novembre 2026, partenza da `ca01989` su main. Otto nuove nazioni ISO e tre aree richieste dall'utente: Scozia, India del Nord e India del Sud. Nessuna migrazione, nuova dipendenza o modifica ai viaggi.

| Nazione | Release | Schede | Aeroporti | Stazioni | Porti | Foto con attribuzione |
|---|---|---:|---:|---:|---:|---:|
| Islanda | IS-1 | 127 | 9 | 0 | 3 | 115 |
| Finlandia | FI-1 | 177 | 16 | 25 | 8 | 194 |
| Regno Unito | GB-1 | 273 | 26 | 31 | 15 | 304 |
| Irlanda | IE-1 | 147 | 6 | 20 | 6 | 152 |
| Thailandia | TH-1 | 156 | 24 | 18 | 3 | 162 |
| Cambogia | KH-1 | 101 | 3 | 6 | 2 | 95 |
| Vietnam | VN-1 | 134 | 17 | 14 | 3 | 132 |
| India | IN-1 | 302 | 34 | 45 | 5 | 304 |

Totale **1.417 schede e 1.458 riferimenti fotografici**. Musei comprende anche monumenti, templi e siti culturali: non è un conteggio dei soli musei. La copertura è editoriale e non completa; non sono stati importati elenchi senza controllo geografico. Le schede non risolvibili, prive di coordinate o ambigue sono escluse e registrate nell'audit.

## Aree e flussi

- Scozia: **122 schede**, incluse nel Regno Unito. Le altre 151 riguardano Inghilterra, Galles e Irlanda del Nord. Una sola nazione GB, valuta GBP e fuso Europe/London; nessun codice di nazione fittizio o duplicazione delle schede. Irlanda del Nord distinta dalla Repubblica d'Irlanda (IE).
- India del Nord: **150 schede**; Delhi/Uttar Pradesh, Rajasthan, Punjab/Haryana/Chandigarh, Uttarakhand, Himachal Pradesh e Ladakh.
- India del Sud: **152 schede**; Karnataka, Kerala, Tamil Nadu/Puducherry, Telangana/Andhra Pradesh e Goa. Questi sono raggruppamenti editoriali per il viaggio, non una classificazione amministrativa esaustiva; India centrale, orientale e nord-orientale non sono coperte da questa selezione. Una nazione IN, valuta INR, fuso Asia/Kolkata.
- La scelta della nazione spiega dove trovare le aree. Nel catalogo il filtro «Area di viaggio» si combina con ricerca, categoria e regione, conserva il contesto e si azzera con gli altri filtri.
- Nel configuratore «Area da pianificare» prepara aeroporti e regioni della sola area e limita anche le visite generate. I preferiti esterni rimangono salvati nel viaggio. Cambiare manualmente regioni/aeroporti o aggiungere una scelta esterna riapre il perimetro personalizzato. La proposta resta una bozza con il normale confronto e conferma prima dell'attivazione.
- Nessuna notte o visita implicita in un aeroporto, una stazione o un porto. In Islanda non sono state inventate stazioni ferroviarie.

## Provenienza e limiti

- Identificativi, coordinate e riferimenti strutturati: [Wikidata, CC0](https://www.wikidata.org/wiki/Wikidata:Licensing), tramite API e revisione quando disponibile. Controlli di entità, nazione, coordinate terrestri, ambito geografico e IATA degli aeroporti. Le zone sono editoriali; le coordinate dei porti non identificano il molo o il terminal da utilizzare.
- Foto: [Wikimedia Commons](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia), soltanto file con autore e licenza CC BY, CC BY-SA, CC0 o pubblico dominio controllati singolarmente. Attribuzioni visibili nella scheda. Sono riferimenti, nessuna foto copiata in Storage o nel pacchetto offline; dove manca una foto valida rimane il segnaposto.
- Descrizioni brevi originali in italiano, spesso limitate a categoria e zona di viaggio: non sono guide dettagliate. Nessun testo Wikipedia riutilizzato. Siti ufficiali P856 importati come riferimenti da verificare, senza dichiarare controllate tutte le pagine. Nessun orario, prezzo, disponibilità, durata, idoneità per bambini o accessibilità inventato.
- Contesto turistico consultato: [Islanda](https://www.visiticeland.com/), [Finlandia](https://www.visitfinland.com/en/), [Regno Unito](https://www.visitbritain.com/en), [Scozia](https://www.visitscotland.com/), [Irlanda](https://www.ireland.com/en-gb/), [Thailandia](https://www.tourismthailand.org/), [Ministero del Turismo della Cambogia](https://tourism.gov.kh/), [Vietnam](https://vietnam.travel/), [India](https://www.incredibleindia.gov.in/). Testi e media di questi siti non importati.
- Fonti ferroviarie: VR, National Rail per la Gran Bretagna, Translink per l'Irlanda del Nord, Irish Rail, State Railway of Thailand, Royal Railway Cambodia, Vietnam Railways e IRCTC. Le ultime due pagine non sono state raggiungibili durante la verifica (timeout/403): nessuna data fittizia di consultazione, l'interfaccia indica che vanno verificate. Link esterni con rete, nessuna tratta, tariffa, coincidenza o prenotazione dedotta dalla presenza della stazione.
- Valute e fusi nazionali nei metadati. Nessun cambio o prezzo carburante norvegese attribuito alle nuove nazioni. Verificati anche il mezzo fuso dell'India e l'UTC islandese negli export.

## Riproduzione e database

```sh
node scripts/harvest-international-v2.mjs --selection ./northern-asia-countries.mjs --snapshot northern-asia-v1 --new-countries --resume
npx tsx scripts/seed-catalog.ts --country GB --version 1
```

Selezione: `scripts/northern-asia-countries.mjs`; fotografia congelata e audit in `src/data/catalogs/northern-asia-v1*.json`; conversione condivisa in `scripts/build-northern-asia.ts`; otto SQL in `supabase/seed`. Non modificare una fotografia pubblicata: per correzioni preparare una nuova release.

Le otto release sono state caricate e verificate pubblicate su `norway-planner`. Per il caricamento è stato omesso il blocco opzionale `$purge$`: nessuna rimozione delle versioni precedenti e nessun aggiornamento ai viaggi. Le impronte dei due viaggi e dei cataloghi precedenti coincidono prima/dopo. Conteggi `places` e `catalog_bundle` corrispondenti per tutte le otto nazioni. **22 nazioni, 4.326 schede nelle ultime versioni**, database **29.488.819 byte** al controllo successivo al caricamento (circa 29,5 MB; misura del database, non quota di organizzazione o traffico).

Cataloghi scaricati e conservati in IndexedDB tramite il flusso esistente; i nuovi dati non sono incorporati nel bundle frontend. Consultazione locale senza rete, immagini e fonti esterne richiedono rete. Nessun nuovo servizio, chiave o costo obbligatorio.

## Verifica

- Typecheck, lint, build di produzione e **302 test** superati; resta l'avviso preesistente sul bundle sopra 500 kB.
- **547 controlli browser internazionali** superati: tutte le release, 21 nazioni estere insieme, filtri combinati, conteggi, porti, stazioni, aggiunta esplicita, Escape/focus, configuratore, offline e cinque viste a 375 px.
- **64 controlli aggiuntivi** sulle aree GB/IN sulla build finale, compresi filtri azzerati e nessuna modifica del viaggio scegliendo l'area.
- Regressioni: e2e 60, planning 16, attrazioni 30, accessibilità 36. Browser isolati con fixture, servizi esterni bloccati o simulati; nessun accesso ad account o viaggi reali. Ispezionata anche la schermata mobile dell'India.
- Test di compatibilità dei vecchi SQL, assenza di duplicati, fonti/licenze, separazione delle aree, proposte entro il perimetro, preferiti intatti, ripristino delle impostazioni, nodi logistici senza visite, serializzazione e fusi.
