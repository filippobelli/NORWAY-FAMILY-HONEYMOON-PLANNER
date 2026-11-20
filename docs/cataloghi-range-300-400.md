# Tutti i cataloghi nel range 300–400

Intervento del 20 novembre 2026, partenza da `da3661c` su main. Venti release additive; Norvegia e India già nel range sono conservate. Nessuna nuova dipendenza o migrazione dello schema.

| Nazione | Release | Prima | Ora |
|---|---|---:|---:|
| Austria | AT-3 | 187 | 320 |
| Cambogia | KH-2 | 101 | 313 |
| Croazia | HR-2 | 162 | 320 |
| Danimarca | DK-3 | 207 | 320 |
| Finlandia | FI-2 | 177 | 320 |
| Francia | FR-3 | 203 | 320 |
| Germania | DE-3 | 200 | 320 |
| Giappone | JP-3 | 213 | 320 |
| Grecia | GR-2 | 205 | 320 |
| India | IN-1 | 302 | 302 |
| Irlanda | IE-2 | 147 | 320 |
| Islanda | IS-2 | 127 | 318 |
| Norvegia | NO-5 | 358 | 358 |
| Paesi Bassi | NL-3 | 205 | 320 |
| Portogallo | PT-2 | 171 | 320 |
| Regno Unito | GB-2 | 273 | 320 |
| Slovenia | SI-3 | 140 | 320 |
| Spagna | ES-2 | 235 | 320 |
| Svezia | SE-3 | 210 | 320 |
| Thailandia | TH-2 | 156 | 320 |
| Turchia | TR-2 | 213 | 320 |
| Vietnam | VN-2 | 134 | 320 |

Totale nelle ultime versioni: **7.051 schede** (prima 4.326), **2.725 nuove schede** e **2.370 nuovi riferimenti fotografici con attribuzione**. I conteggi comprendono i punti logistici già presenti; alcune schede portuali norvegesi sono usate nella sezione Trasporti via mare. Scozia e India Nord/Sud mantengono le rispettive aree nel modello GB/IN.

## Contenuti e fonti

- Priorità a musei e luoghi culturali, castelli, siti archeologici, parchi, fauna, giardini botanici, cascate, grotte e isole. Musei è una categoria di cultura: comprende anche edifici religiosi e monumenti, non soltanto istituti museali.
- Ricerca strutturata su [Wikidata](https://www.wikidata.org/wiki/Wikidata:Licensing), dati CC0. Identità stabile, classificazione P31/P279, nazione P17, coordinate terrestri P625 e controllo dell'ambito geografico. Esclusi elementi senza coordinate, duplicati di identificativo, disambigue e schede con chiusura/cessazione dichiarata. Questi controlli non equivalgono a una verifica delle condizioni di visita attuali.
- La selezione iniziale privilegia elementi con almeno due collegamenti Wikimedia. Per completare la Cambogia è ammesso un solo collegamento, conservando gli stessi controlli su identità, categoria, paese e coordinate. Le soglie, le richieste non disponibili e gli scarti sono nell'audit. [Ottimizzazione delle query](https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service/query_optimization): filtro geografico prima dei percorsi di classe, due interrogazioni contemporanee al massimo, cache e ripresa.
- Foto da [Wikimedia Commons](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia), controllando autore e licenza di ogni file. Soltanto CC BY, CC BY-SA, CC0 o pubblico dominio; niente media scaricati nel repository o in Storage. Attribuzioni raggiungibili dalla scheda, segnaposto se manca una foto valida. Le foto richiedono rete.
- Descrizioni brevi originali in italiano, basate su tipologia e località nominata dalla fonte; nessun testo Wikipedia copiato. Fonte e data conservate. Siti P856 importati come riferimenti da verificare, senza dichiararne controllate tutte le pagine. Nessuna durata, tariffa, disponibilità, apertura, accessibilità o idoneità per bambini inventata.
- Le coordinate identificano il luogo nella fonte: non necessariamente ingresso, parcheggio, accesso visitabile o terminal. Il catalogo geografico non conferma un servizio di trasporto né una prenotazione.

## Geografia e controllo editoriale

Le nuove schede vengono agganciate a una zona attraverso la catena amministrativa P131 verso una località già catalogata oppure una suddivisione nominata mappata esplicitamente. Non si usano distanze in linea d'aria per dedurre appartenenze amministrative. Corrispondenze ambigue restano nell'area nazionale.

**774 nuove schede** restano nel gruppo «Altre località · nazione», soprattutto dove le gerarchie non consentono di ricondurle alle zone editoriali esistenti. Coordinate e descrizione della località restano disponibili per mappa e ricerca contestuale. La collocazione editoriale più dettagliata è un miglioramento futuro; non si è inventata per raggiungere la quota.

Nel Regno Unito si verifica anche la nazione costitutiva, mantenendo riconoscibile la Scozia. Gli omonimi nuovi in città diverse sono disambiguati con la località. Escluse due schede rappresentanti l'intera Islanda come isola/nazione: il conteggio finale è 318. I sette villaggi aggiunti in Cambogia non diventano basi automatiche di pernottamento; servizi e alloggi rimangono da verificare.

## Pipeline e riproduzione

```sh
npx tsx scripts/catalog-range-baseline.ts
node scripts/catalog-range-research.mjs
# Soltanto per completare le nazioni meno documentate:
node scripts/catalog-range-research.mjs --single-source
node scripts/catalog-range-geography.mjs
npx tsx scripts/seed-catalog.ts --country DE --version 3
```

La ricerca e la rifinitura sono strumenti di preparazione, da non rieseguire per riscrivere una release pubblicata. `src/data/catalogs/catalog-range-v1.json` e il relativo audit sono ora congelati; per correzioni o ampliamenti successivi creare una nuova fotografia/release. I dati di ricerca e la cache temporanea sono in `verify/e2e/out/`, ignorati da Git. La cache conserva solo i campi necessari; scritture atomiche con tentativi limitati su errori transitori di Windows.

`scripts/build-catalog-range.ts` compone ogni release con tutte le schede, le regioni, le fonti e le foto precedenti identiche e le sole aggiunte. `scripts/catalog-range-regions.mjs` contiene i raggruppamenti espliciti delle suddivisioni. `scripts/build-international.ts` gestisce le nuove evidenze facoltative mantenendo identico l'output dei vecchi cataloghi. I venti SQL completi sono in `supabase/seed`.

## Verifica e caricamento

- **307 test** superati: 22 cataloghi nel range, vecchie schede/fonti/foto immutate, chiavi e identificativi univoci, SQL riproducibili, dati mancanti onesti, compatibilità dei backup e del passaggio di versione, perimetro Scozia/India e proposte senza applicazione automatica.
- Typecheck, lint e build di produzione superati. Resta l'avviso preesistente sul bundle sopra 500 kB; i nuovi cataloghi non sono incorporati nel JavaScript dell'app.
- **405 controlli browser** sui venti cataloghi nuovi e un viaggio con quattro nazioni: caricamento dalla copia locale, filtri, conteggi, stazioni e porti, conferme, tastiera/Escape/focus, configuratore, offline e cinque viste a 375 px. Ispezionata anche la schermata mobile cambogiana.
- Regressioni: e2e 60, planning 16, attrazioni 30, accessibilità 36. Totale **547 controlli browser**, con fixture e servizi esterni bloccati o simulati; nessun accesso ad account reali nei test.
- Caricate e verificate pubblicate le venti nuove release su `norway-planner`, omettendo il blocco opzionale `$purge$`: nessuna cancellazione di versioni o modifica ai viaggi. Le impronte aggregate dei due viaggi e di tutti i cataloghi precedenti coincidono prima e dopo.
- Conteggi SQL e `catalog_bundle` corrispondenti per tutte le 22 nazioni: minimo 302, massimo 358, totale 7.051. Verificate anche le 2.725 nuove schede e le 2.370 nuove foto. Database dopo il caricamento: **46.552.755 byte**, circa 46,6 MB, incluse le versioni conservate; non è una misura delle quote dell'intera organizzazione.

L'app usa il normale aggiornamento del catalogo all'ultima versione quando è connessa. Tappe, notti, giornate, attività, note e prenotazioni non vengono aggiunte dal caricamento. La copia locale segue il flusso offline esistente. Nessuna chiave, configurazione o servizio a pagamento nuovo.
