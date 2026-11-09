# Ricerca traghetti Norvegia → Norvegia (compito 1, analista)

Letto il **2026-11-09**. Dati strutturati in `docs/ricerca-traghetti.json` (58 tratte, fonte per campo). Escluse le crociere Hurtigruten/Havila (già in `coastalCatalog.ts`) e le linee estere.

## 1. Metodo

1. **Chi gestisce cosa.** Elenco ufficiale delle linee via mare da **Entur** (registro nazionale degli orari, API pubblica Journey Planner v3, identificata con `ET-Client-Name`; dati aperti). Per ogni linea: ente (Skyss, Kolumbus, FRAM, Reis Nordland, Svipper, Snelandia), operatore, fermate in ordine, tempi tra le fermate, numero di corse per giorno campione.
2. **Coordinate.** Solo quelle dei moli del **Nasjonalt stoppestedsregister (NSR)** lette da Entur (campo `nsrId` + `lat/lng`). Nessuna coordinata stimata. Dove la fermata non è nel registro (es. «Forsand/Oanes», Stavanger Strandkaien per Rødne) la coordinata è assente.
3. **Prezzi.** Dalle pagine o dai PDF delle compagnie/enti (Fjord1, Torghatten, Rødne, Svipper, Snelandia, Visit Geiranger, Skyss, Reis Nordland). Dove la fonte primaria non era leggibile ho usato **fergeruter.info** (aggregatore) e ho segnato il prezzo «da verificare».
4. **Solo lettura** di pagine e PDF pubblici; nessun login, nessuna prenotazione. Due siti hanno rifiutato le richieste (norwaysbest.com: HTTP 429; driftsmeldinger.norled.no: connessione chiusa): non ho insistito.

### Limiti del metodo
- **Gli orari su Entur sono invernali** (validi da nov 2026 a mar/apr 2027). Le durate sono di solito le stesse d'estate, ma **frequenze e linee estive no**: nel JSON la frequenza invernale è solo un riferimento, con stato «assente» per l'estate. Le linee solo estive (Andenes–Gryllefjord, crociere turistiche) non hanno dati Entur.
- Le pagine Fjord1 mostrano le partenze «da adesso in poi» (pomeriggio del 9/11/2026): la frequenza letta lì è parziale.
- Nessuna tariffa 2027 è pubblicata, **tranne Bergen–Flåm** (Fjord1 ha già prezzi e orario estivo 2027). Tutte le altre sono «tariffa 2026, da verificare per il 2027».

## 2. Fonti consultate (principali)

| Fonte | Cosa dà | URL |
|---|---|---|
| Entur Journey Planner v3 + NSR | linee, fermate, tempi, coordinate dei moli | https://api.entur.io/journey-planner/v3/graphql |
| Fjord1 – pagine tratta | prezzi veicolo per lunghezza «as of 09.Nov 2026», durata | https://www.fjord1.no/eng/routes |
| Fjord1 – Geiranger–Hellesylt 2026 (PDF) | prezzi passeggeri/auto, orario 2026 | https://res.cloudinary.com/fjord1-asa/image/upload/v1780050779/Prices_and_timetable_Geiranger_Hellesylt_idmirtr7nk.pdf |
| Fjord1 – Bergen–Flåm prezzi 2027 | adulto/bambino/famiglia 2027 | https://www.fjord1.no/eng/routes/Vestland/bergen-balestrand-sogndal?from=NSR%3AQuay%3A51969&to=NSR%3AQuay%3A59727 |
| Fjord1 – orario estivo 2027 Bergen–Sogn–Flåm (PDF) | fermate e orari 1/4–31/10/2027 | https://res.cloudinary.com/fjord1-asa/image/upload/v1791530064/Timetable_Bergen_Sogn_Fl%C3%A5m_Bergen_ihw4g6w3jt.pdf |
| Fjord1 – Express boats | Fjord1 subentra a Norled dal 1/12/2026 | https://www.fjord1.no/eng/about-fjord1/our-operating-segments/express-boats |
| Torghatten – 18-782, 18-703, 1018 | Bodø–Moskenes/Værøy/Røst, Bognes–Lødingen, Halhjem–Sandvikvåg | https://www.torghatten.no/our-routes/18-782 |
| Skyss – ferry / fares Vestland | passeggeri gratis sui traghetti, età bambini | https://www.skyss.no/en/tickets-and-prices/prices/ferry/ |
| Reis Nordland – ferge / priser | passeggeri gratis, veicoli gratis fuori estate su 20 linee, età bambini | https://reisnordland.no/ferge |
| Svipper – tabelle prezzi PDF | Tromsø–Harstad, Tromsø–Skjervøy, Andenes–Gryllefjord, Botnhamn–Brensholmen | https://svipper.no/menu/tickets/express-boat-fares/ |
| Snelandia – hurtigbåtpriser | prezzi battelli Finnmark dal 1/2/2026; traghetti gratis | https://snelandia.no/billetter/hurtigbat/priser/ |
| Rødne – Lysefjord e Hardangerfjordekspressen (PDF) | prezzi 2026 | https://rodne.no/?p=9946 |
| Visit Geiranger – Ålesund–Geiranger 2026/2027 (PDF) | orari e prezzi | https://www.geirangerfjord.no/upload/pdf/2026/2025%202026%20Alesund%20TIMETABLE.pdf |
| Visit Bergen – Flåm–Gudvangen | prezzi e orari 2026 (scheda ente turistico) | https://en.visitbergen.com/things-to-do/fjord-cruise-between-flam-and-gudvangen-p8399913 |
| fergeruter.info | prezzi 2026 per tratta (solo dove la fonte primaria mancava) | https://www.fergeruter.info/ |
| Regjeringen – Statsbudsjettet 2026 | proseguono le tariffe dimezzate; abolita la «gratis ferje» con possibili reintroduzioni locali | https://www.regjeringen.no/no/aktuelt/vidareforer-reduserte-ferjetakstar-avviklar-ordninga-for-gratis-ferje/id3124679/ (risposta 403 al fetch: letta solo la sintesi nei risultati di ricerca) |

Le pagine tariffarie nazionali di Statens vegvesen (riksregulativ 2024, AutoPASS 2025) risultavano **non raggiungibili (404)** il 9/11/2026: la tabella nazionale per zona non è stata letta direttamente.

## 3. Regole tariffarie trovate

### Traghetti per auto (ferje)
- **Si paga il veicolo, il conducente è incluso, i passeggeri viaggiano gratis.** Confermato da: Skyss (Vestland: «You only pay for the vehicle and the driver, while passengers travel for free»), Fjord1 Rogaland («People travel for free on all connections», «Driver is always included»), Reis Nordland («Passasjerer reiser gratis»), Torghatten 18-782, Svipper 181 («Personer og sykler: Gratis»), Snelandia («Ferge i Finnmark er gratis»). Per **Møre og Romsdal** le pagine Fjord1 non lo dicono: da verificare.
- **Classi per lunghezza del veicolo** (sistema AutoPASS nazionale): fino a 6 m, 6,01–8, 8,01–10, 10,01–12,5, 12,51–14,5, 14,51–17,5, 17,51–19,5, 19,51–22, oltre 22 m, più moto. **Non esiste una classe 5 m**: un'auto familiare rientra in «fino a 6 m»; con portapacchi/rimorchio conta la lunghezza totale.
- **Zone tariffarie.** Fjord1 indica la «FerryConnectionRate zone» di ogni tratta; lo stesso numero di zona dà lo stesso prezzo (zona 1 = 0 NOK, zona 3 = 63, zona 6 = 81, zona 7 = 88, zona 10 = 104, zona 11 = 110, al 9/11/2026). È l'indizio del regolativo nazionale, ma la tabella ufficiale per zona non è stata letta.
- **Sconti:** AutoPASS-brikke −10%; brikke + accordo prepagato privato −50% (aziende −40%); auto elettriche fino a 6 m −30% circa (Skyss) — non rilevanti per un'auto a noleggio senza accordo: **usare il prezzo pieno**.
- **Linee gratuite per i veicoli**: Sæbø–Lekneset, Festøya–Hundeidvika (Fjord1, 0 NOK); in Nordland 20 linee di contea sono gratis per i veicoli **fuori dall'estate** (Reis Nordland non indica le date dell'estate né la tariffa estiva). Il governo ha proposto per il 2026 di abolire la «gratis ferje» e le contee possono reintrodurre un pagamento: **lo stato «gratis» va riverificato per agosto 2027**.
- **Eccezioni passeggeri:** Andenes–Gryllefjord nel 2026 ha provato un biglietto di 100 NOK per adulti 30–66 anni (bambini, giovani e senior gratis). Le tratte turistiche (Geiranger–Hellesylt, Lysefjord Rødne) **non** seguono il sistema AutoPASS: passeggeri a pagamento e auto molto più cara (810 e 1290 NOK).
- **Prenotazione:** Bodø–Moskenes/Værøy/Røst sono le uniche linee di contea Nordland prenotabili (plassgaranti facoltativa: 65 adulto, 35 bambino, 130 auto ≤6 m, in aggiunta).

### Battelli veloci (hurtigbåt) – età dei bambini
| Ente | Bambino | Gratis | Altro | Fonte |
|---|---|---|---|---|
| Skyss (Vestland) | 6–17, circa metà prezzo | sotto 6 | ritorno a metà prezzo se acquistato con l'andata (linee oltre la fascia minima) | skyss-fares |
| Fjord1 Bergen–Flåm 2027 | 6–17 (719 alta stagione) | 0–5 | bambino con adulto pagante max 209 NOK; famiglia 2+2 3299; max 4 bambini | f1-flam-prices |
| Rødne Hardangerfjordekspressen | 6–17 (50%) | non indicato | — | rodne-hfe |
| Reis Nordland | 6–15 | sotto 6 | prezzi per tratta solo nell'app Reis | reis-priser |
| Svipper (Troms) | 6–17 | sotto 6 | adulto 30–66, giovane 18–29 (lette sulla pagina bus) | svipper-bus |
| Snelandia (Finnmark) | 4–19 | «sotto 4» solo su alcune righe | giovane 20–29 | snelandia-hb |

### Battelli turistici
| Tratta | Bambino | Gratis | Auto |
|---|---|---|---|
| Geiranger–Hellesylt (Fjord1 2026) | 210 (età non indicata) | sotto 4 | 810 con conducente; pacchetto auto + 4 persone 1650 |
| Lysefjord Rødne (2026) | 4–15: 350 | 0–3 | 1290 con conducente; pacchetto auto + 5 persone 1990 |
| Flåm–Gudvangen Lustrabåtane (2026, Visit Bergen) | 4–15: 275 | sotto 4 | non trasporta auto; famiglia 2+2 1365 |
| Ålesund–Geiranger (2026/27) | non indicato nel PDF | — | no |

**Per la famiglia (bambini 8 e 5 ad agosto 2027):** il bambino di 5 anni è **gratis** con Skyss, Fjord1 Bergen–Flåm, Reis Nordland e Svipper (soglia 6), ma **paga** con le tariffe turistiche (Geiranger–Hellesylt soglia 4, Lysefjord 4, Flåm–Gudvangen 4) e con Snelandia (4–19). L'età va calcolata alla data della traversata, non all'inizio del viaggio (vedi spec).

## 4. Tabella delle tratte per zona

Legenda stato prezzo: **confermato** = letto sulla fonte primaria; **da verificare** = fonte secondaria, anno non indicato o dati in conflitto; **assente** = non trovato. Tutti i prezzi 2026 sono «tariffa di oggi, da verificare per il 2027». Durate: orario invernale Entur salvo diversa fonte (vedi JSON). «Destinazioni» = id di `src/data/destinations.ts`.

### Vestland (16)

| id | Tratta | Operatore | Mezzo | Tappe intermedie | Durata | Auto | Adulto / bambino (NOK) | Auto ≤6 m (NOK) | Anno | Stato prezzo | Destinazioni |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `bergen-flam-express` | Bergen (Strandkaiterminalen) → Flåm kai | Fjord1 (dal 1/12/2026; fino al 30/11/2026 Norled) | hurtigbåt | Lygra (a richiesta), Vardetangen kai, Skjerjehamn (a richiesta), Sollibotn kai, Rysjeda… | 340 min | no | 1449 / 719 | — | 2027 | confermato | bergen, flam, balestrand, sognefjord, naeroyfjord, aurlandsfjord |
| `bergen-sogndal-express` | Bergen (Strandkaiterminalen) → Sogndal kai | Fjord1 dal 1/12/2026 (Entur indica ancora Norled per la linea 890) | hurtigbåt | Lygra kai, Mjømna kai, Skjerjehamn kai, Sollibotn kai, Rysjedalsvika kai, Lavik kai, No… | 285–290 min | no | — | — | — | assente | bergen, balestrand, sognefjord |
| `bergen-nordfjord-express` | Bergen (Strandkaiterminalen) → Selje kai | Fjord1 dal 1/12/2026 (Entur indica Norled, linea 190) | hurtigbåt | Lygra kai, Vardetangen kai, Skjerjehamn kai, Sollibotn kai, Krakhella kai, Askvoll kai,… | 300–310 min | no | — | — | — | assente | bergen |
| `bergen-rosendal-express` | Bergen (Strandkaiterminalen) → Rosendal båtkai | Rødne (L. Rødne & Sønner) | hurtigbåt | Flesland båtkai, Os båtkai, Malkenes båtkai | 115 min | no | 581 / 291 | — | 2026 | confermato | bergen |
| `flam-gudvangen` | Flåm kai → Gudvangen ferjekai | Lustrabåtane / GlacierTour AS (altra offerta: Norway's Best / The Fjords, dati non letti) | turistico | — | 120 min | no | 550 / 275 | — | 2026 | da verificare | flam, aurlandsfjord, naeroyfjord |
| `halhjem-sandvikvag` | Halhjem ferjekai → Sandvikvåg ferjekai | Torghatten | ferje (auto) | — | 45 min | sì | passeggeri gratis | 176 | 2026 | da verificare | — |
| `halhjem-vage` | Halhjem ferjekai → Våge ferjekai | Fjord1 | ferje (auto) | — | 35 min | sì | passeggeri gratis | 129 | 2026 | confermato | — |
| `lavik-oppedal` | Oppedal ferjekai → Lavik ferjekai | Fjord1 | ferje (auto) | — | 20–25 min | sì | passeggeri gratis | 81 | 2026 | confermato | sognefjord |
| `anda-lote` | Anda ferjekai → Lote ferjekai | Fjord1 | ferje (auto) | — | 11 min | sì | passeggeri gratis | 63 | 2026 | confermato | — |
| `leirvag-slovag` | Leirvågen ferjekai → Sløvågen ferjekai | Fjord1 | ferje (auto) | — | 20 min | sì | passeggeri gratis | 88 | 2026 | confermato | — |
| `mannheller-fodnes` | Fodnes ferjekai → Mannheller ferjekai | Norled | ferje (auto) | — | 15 min | sì | passeggeri gratis | 69 | 2026 | da verificare | sognefjord |
| `vangsnes-hella-dragsvik` | Vangsnes ferjekai → Dragsvik ferjekai | Norled | ferje (auto) | Hella ferjekai | 30–40 min | sì | passeggeri gratis | 81 | 2026 | da verificare | sognefjord, balestrand |
| `solvorn-ornes` | Solvorn ferjekai → Ornes ferjekai | Lustrabåtane | ferje (auto) | — | 20 min | sì | — | — | — | assente | sognefjord |
| `jondal-torvikbygd` | Tørvikbygd ferjekai → Jondal ferjekai | Fjord1 | ferje (auto) | — | 20 min | sì | passeggeri gratis | 88 | 2026 | confermato | hardangerfjord |
| `utne-kvanndal` | Kvanndal ferjekai → Utne ferjekai | Boreal | ferje (auto) | — | 20 min | sì | passeggeri gratis | 88 | 2026 | da verificare | hardangerfjord |
| `kinsarvik-utne` | Kinsarvik ferjekai → Utne ferjekai | Boreal | ferje (auto) | — | 28 min | sì | passeggeri gratis | 0 | 2026 | da verificare | hardangerfjord |

### Rogaland (5)

| id | Tratta | Operatore | Mezzo | Tappe intermedie | Durata | Auto | Adulto / bambino (NOK) | Auto ≤6 m (NOK) | Anno | Stato prezzo | Destinazioni |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `mortavika-arsvagen` | Arsvågen ferjekai → Mortavika ferjekai | Fjord1 | ferje (auto) | — | 24–28 min | sì | passeggeri gratis | 178 | 2026 | confermato | — |
| `lysefjord-turistferje` | Lauvvik (da settembre 2026 anche Oanes al posto di Forsand) → Lysebotn | Rødne | turistico | Forsand / Oanes, Songesand ferjekai, Flørli ferjekai | 150 min | sì | 595 / 350 | 1290 | 2026 | confermato | lysefjord |
| `lauvvik-lysebotn-kolumbus` | Lauvvik ferjekai → Lysebotn ferjekai | Rødne Trafikk per Kolumbus | ferje (auto) | Forsand ferjekai, Revså hurtigbåtkai, Bratteli hurtigbåtkai, Bakken hurtigbåtkai, Songe… | 90 min | sì | — | — | — | assente | lysefjord |
| `stavanger-lysefjord-cruise` | Stavanger (Strandkaien) → Stavanger (Strandkaien) | Rødne | turistico | Lysefjord (sotto Preikestolen, senza sbarco indicato) | 180–210 min | no | — | — | — | assente | stavanger, lysefjord, preikestolen |
| `hjelmeland-nesvik` | Hjelmeland ferjekai → Nesvik ferjekai | Norled | ferje (auto) | — | 12–13 min | sì | — | — | — | assente | — |

### Møre og Romsdal (13)

| id | Tratta | Operatore | Mezzo | Tappe intermedie | Durata | Auto | Adulto / bambino (NOK) | Auto ≤6 m (NOK) | Anno | Stato prezzo | Destinazioni |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `geiranger-hellesylt` | Geiranger ferjekai → Hellesylt ferjekai | Fjord1 | turistico | — | 65 min | sì | 420 / 210 | 810 | 2026 | confermato | geiranger, geirangerfjord, sju-sostrene |
| `alesund-geiranger` | Ålesund (Skutvika / Nedre Strandgate 53) → Geiranger hurtigbåtkai | Geiranger Fjordservice (Visit Geiranger) | turistico | Stranda hurtigbåtkai | 180 min | no | 1124 / — | — | 2026/2027 | confermato | alesund, geiranger, geirangerfjord |
| `eidsdal-linge` | Eidsdal ferjekai → Linge ferjekai | Fjord1 | ferje (auto) | — | 13 min | sì | passeggeri gratis | 81 | 2026 | confermato | geiranger, trollstigen |
| `stranda-liabygda` | Stranda ferjekai → Liabygda ferjekai | Fjord1 | ferje (auto) | — | 13 min | sì | passeggeri gratis | 81 | 2026 | confermato | — |
| `magerholm-sykkylven` | Magerholm ferjekai → Sykkylven ferjekai | Fjord1 | ferje (auto) | — | 15 min | sì | passeggeri gratis | 88 | 2026 | confermato | — |
| `hareid-sulesund` | Hareid ferjekai → Sulesund ferjekai | Fjord1 | ferje (auto) | — | 23 min | sì | passeggeri gratis | 110 | 2026 | confermato | alesund, runde |
| `solsnes-afarnes` | Sølsnes ferjekai → Åfarnes ferjekai | Fjord1 | ferje (auto) | — | 15 min | sì | passeggeri gratis | 88 | 2026 | confermato | — |
| `halsa-kanestraum` | Halsa ferjekai → Kanestraum ferjekai | Fjord1 | ferje (auto) | — | 20 min | sì | passeggeri gratis | 81 | 2026 | confermato | — |
| `saebo-leknes` | Sæbø ferjekai → Lekneset ferjekai | Fjord1 | ferje (auto) | — | 13 min | sì | — | 0 | 2026 | confermato | hjorundfjord |
| `festoya-hundeidvika` | Festøya ferjekai → Hundeidvik ferjekai | Fjord1 | ferje (auto) | — | 20–25 min | sì | — | 0 | 2026 | confermato | — |
| `festoya-solavagen` | Festøya ferjekai → Solavågen ferjekai | Norled | ferje (auto) | — | 20 min | sì | passeggeri gratis | 75 | 2026 | da verificare | alesund |
| `molde-vestnes` | Molde ferjekai → Furneset ferjekai | Boreal Sjø | ferje (auto) | — | 33–36 min | sì | passeggeri gratis | 116 | 2026 | da verificare | — |
| `alesund-hareid-express` | Ålesund hurtigbåtkai Skateflukaia → Hareid hurtigbåtkai | Boreal Sjø (per FRAM) | hurtigbåt | Valderøya hurtigbåtkai | 28–30 min | no | — | — | — | assente | alesund |

### Nordland (14)

| id | Tratta | Operatore | Mezzo | Tappe intermedie | Durata | Auto | Adulto / bambino (NOK) | Auto ≤6 m (NOK) | Anno | Stato prezzo | Destinazioni |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `bodo-moskenes` | Bodø ferjekai → Moskenes ferjekai | Torghatten Nord | ferje (auto) | — | 195 min | sì | passeggeri gratis | 605 | 2026 | confermato | bodo-moskenes, lofoten |
| `bodo-vaeroy-rost` | Bodø ferjekai → Bodø ferjekai | Torghatten Nord | ferje (auto) | Røst ferjekai, Værøy ferjekai | 510–525 min | sì | passeggeri gratis | 605 | 2026 | da verificare | lofoten |
| `bodo-svolvaer-express` | Bodø hurtigbåtkai → Svolvær hurtigbåtkai | Boreal Sjø (per Reis Nordland) | hurtigbåt | Helnessund hurtigbåtkai, Nordskot hurtigbåtkai, Holkestad hurtigbåtkai, Bogøy hurtigbåt… | 205 min | no | — | — | — | assente | svolvaer, lofoten |
| `bodo-sandnessjoen-express` | Bodø hurtigbåtkai → Sandnessjøen hurtigbåtkai | Boreal Sjø (per Reis Nordland) | hurtigbåt | Sørarnøy hurtigbåtkai, Støtt hurtigbåtkai, Ørnes hurtigbåtkai, Grønnøy hurtigbåtkai, Bo… | 305 min | no | — | — | — | assente | — |
| `skutvik-svolvaer` | Skutvik ferjekai → Svolvær ferjekai | Torghatten Nord | ferje (auto) | Skrova ferjekai | — | sì | passeggeri gratis | — | — | da verificare | svolvaer, lofoten |
| `bognes-lodingen` | Bognes ferjekai → Lødingen ferjekai | Torghatten Nord | ferje (auto) | — | 60 min | sì | passeggeri gratis | 187 | 2026 | da verificare | lofoten |
| `bognes-skarberget` | Bognes ferjekai → Skarberget ferjekai | Fjord1 | ferje (auto) | — | 25 min | sì | passeggeri gratis | 104 | 2026 | confermato | — |
| `fiskebol-melbu` | Fiskebøl ferjekai → Melbu ferjekai | Torghatten Nord | ferje (auto) | — | 25 min | sì | passeggeri gratis | 116 | 2026 | da verificare | lofoten |
| `festvag-misten` | Festvåg ferjekai → Misten ferjekai | Torghatten Nord | ferje (auto) | — | 10 min | sì | passeggeri gratis | — | — | da verificare | — |
| `kilboghamn-jektvik` | Kilboghamn ferjekai → Jektvik ferjekai | Torghatten Nord | ferje (auto) | Sørfjorden ferjekai | 65 min | sì | passeggeri gratis | — | — | da verificare | — |
| `foroy-agskardet` | Forøy ferjekai → Ågskardet ferjekai | Torghatten Nord | ferje (auto) | — | 10 min | sì | passeggeri gratis | — | — | da verificare | — |
| `tjotta-forvik` | Tjøtta ferjekai → Forvik ferjekai | Boreal Sjø | ferje (auto) | Mindland ferjekai, Tro ferjekai, Stokkasjøen ferjekai, Vågsodden ferjekai | 55–70 min | sì | passeggeri gratis | — | — | da verificare | — |
| `nesna-levang` | Nesna ferjekai → Levang ferjekai | Torghatten Nord | ferje (auto) | — | 25–30 min | sì | passeggeri gratis | — | — | da verificare | — |
| `reine-vindstad` | Reine hurtigbåtkai → Vindstad hurtigbåtkai | Charter i Nord (per Reis Nordland) | hurtigbåt | Rostad hurtigbåtkai, Kirkefjord hurtigbåtkai | 40 min | no | — | — | — | assente | reine, lofoten |

### Nordland/Troms (1)

| id | Tratta | Operatore | Mezzo | Tappe intermedie | Durata | Auto | Adulto / bambino (NOK) | Auto ≤6 m (NOK) | Anno | Stato prezzo | Destinazioni |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `andenes-gryllefjord` | Andenes ferjekai → Gryllefjord ferjekai | Torghatten Nord (per Svipper/Troms) | ferje (auto) | — | — | sì | 100 / 0 | 925 | 2026 | confermato | andenes, senja |

### Troms (5)

| id | Tratta | Operatore | Mezzo | Tappe intermedie | Durata | Auto | Adulto / bambino (NOK) | Auto ≤6 m (NOK) | Anno | Stato prezzo | Destinazioni |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `tromso-harstad-express` | Tromsø Prostneset → Harstad hurtigbåtkai | Norled (per Svipper) | hurtigbåt | Finnsnes kai, Brøstadbotn hurtigbåtkai, Engenes kai | 180 min | no | 630 / 209 | — | 2026 | confermato | tromso, senja |
| `tromso-skjervoy-express` | Tromsø Prostneset hurtigbåtkai → Skjervøy kai | Norled (per Svipper) | hurtigbåt | Finnkroken hurtigbåtkai, Vannvåg kai, Nord-Lenangen, Arnøyhamn kai, Nikkeby | 170 min | no | 424 / 142 | — | 2026 | confermato | tromso |
| `botnhamn-brensholmen` | Botnhamn ferjekai → Brensholmen ferjekai | Torghatten Nord (per Svipper) | ferje (auto) | — | 35 min | sì | passeggeri gratis | 247 | 2026 | confermato | senja |
| `breivikeidet-svensby` | Breivikeidet ferjekai → Svensby ferjekai | Norled (per Svipper) | ferje (auto) | — | 20 min | sì | — | — | — | assente | — |
| `lyngseidet-olderdalen` | Lyngseidet ferjekai → Olderdalen ferjekai | Norled (per Svipper) | ferje (auto) | — | 40 min | sì | passeggeri gratis | 152 | 2026 | da verificare | — |

### Finnmark (4)

| id | Tratta | Operatore | Mezzo | Tappe intermedie | Durata | Auto | Adulto / bambino (NOK) | Auto ≤6 m (NOK) | Anno | Stato prezzo | Destinazioni |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `hammerfest-alta-express` | Hammerfest havn → Alta hurtigbåtterminal | Boreal Sjø (per Snelandia) | hurtigbåt | — | 95 min | no | 420 / 263 | — | 2026 | confermato | — |
| `hammerfest-havoysund-express` | Hammerfest havn → Havøysund kai | Boreal Sjø (per Snelandia) | hurtigbåt | Gunnarnes kai, Ingøy kai | 150–160 min | no | 327 / 204 | — | 2026 | confermato | — |
| `hammerfest-hasvik-oksfjord-express` | Hammerfest havn → Øksfjord hurtigbåtkai | Boreal Sjø (per Snelandia) | hurtigbåt | Kårhamn kai, Hasvik kai | 135–145 min | no | Hammerfest–Hasvik: 327 / 204 | — | 2026 | confermato | — |
| `oksfjord-hasvik` | Øksfjord ferjekai → Hasvik kai | Boreal Sjø (per Snelandia) | ferje (auto) | — | 75 min | sì | passeggeri gratis | 0 | 2026 | da verificare | — |

## 5. Esempi di costo per la famiglia (2 adulti, bambini 8 e 5)

Solo aritmetica sui prezzi della tabella; nessuna stima. Tariffe 2026 salvo Bergen–Flåm (2027).

| Tratta | Senza auto | Con auto ≤6 m | Note |
|---|---|---|---|
| Bergen → Flåm (18/5–31/8/2027) | 2×1449 + 209 (8 anni, tetto con adulto pagante) + 0 (5 anni) = **3107** | non trasporta auto | Il biglietto famiglia 2+2 costa 3299 ma vale per bambini 6–17: per noi conviene il calcolo per persona. |
| Flåm → Gudvangen | biglietto famiglia **1365** (per persona: 2×550 + 2×275 = 1650) | non trasporta auto | Il 5enne paga (gratis solo sotto 4). |
| Geiranger → Hellesylt | 2×420 + 2×210 = **1260** | pacchetto **1650** (= 810 + 420 + 210 + 210) | Ritorno −50%. |
| Lauvvik → Lysebotn (Rødne) | 2×595 + 2×350 = **1890** | pacchetto **1990** (auto + 5 persone) contro 1290 + 595 + 350 + 350 = 2585 | Il pacchetto conviene. |
| Bodø → Moskenes | **0** (passeggeri gratis) | **605** (+130 facoltativi di plassgaranti per l'auto) | Regole di registrazione dei passeggeri con auto da verificare. |
| Tromsø → Harstad | 2×630 + 209 + 0 = **1469** (sabato 2×277 + 154 = **708**) | no | Il 5enne gratis (sotto 6). |
| Hammerfest → Alta | 2×420 + 2×263 = **1366** | no | Snelandia: bambino 4–19, il 5enne paga. |
| Traghetto ferje tipico (es. Eidsdal–Linge) | 0 | **81** | Si paga solo il veicolo con il conducente. |

## 6. Cosa non è stato trovato o resta incerto

1. **Tariffe 2027**: pubblicate solo per Bergen–Flåm. Tutto il resto è 2026.
2. **Orari e frequenze estive**: Entur ha solo l'orario invernale; trovati orari estivi solo per Bergen–Flåm 2027, Geiranger–Hellesylt 2026, Ålesund–Geiranger 2026/27, Flåm–Gudvangen 2026 (Visit Bergen).
3. **Tabella nazionale Statens vegvesen** (riksregulativ/AutoPASS per zona): PDF non raggiungibili (404); prezzi ferje presi tratta per tratta.
4. **Prezzi non pubblicati**: battelli Reis Nordland (Bodø–Svolvær, Bodø–Sandnessjøen, Reinefjorden: solo nell'app), Bergen–Sogndal e Bergen–Nordfjord (Fjord1, pagina senza prezzi), Kolumbus Lauvvik–Lysebotn, crociera Rødne Stavanger–Lysefjord, Ålesund–Hareid, Solvorn–Ornes, Hjelmeland–Nesvik, Breivikeidet–Svensby; **tariffe estive per i veicoli** delle 20 linee Nordland gratuite fuori stagione (Skutvik–Svolvær, Kilboghamn–Jektvik, Forøy–Ågskardet, Tjøtta–Forvik, Festvåg–Misten) e Nesna–Levang.
5. **Siti non letti**: Norway's Best / The Fjords (Flåm–Gudvangen elettrico, HTTP 429); Norled crociere Hardanger Norheimsund–Eidfjord–Ulvik (404 / connessione chiusa) → **tratta Hardanger turistica non inserita**.
6. **Conflitti tra fonti**:
   - Geiranger–Hellesylt: Fjord1 «circa 65 min», Entur 45 min (operatore «Vestlandske», dati di ottobre 2026).
   - Bergen–Sogn/Nordfjord: Entur indica ancora Norled; Fjord1 subentra dal 1/12/2026. Prezzi Norled (1295 adulto) senza anno: superati dai prezzi Fjord1 2027.
   - Lysefjord: Kolumbus parla di rotte 561/563, Entur di 560; stagione Rødne 27, 29 o 30 settembre a seconda della pagina.
   - Halhjem–Sandvikvåg, Bognes–Lødingen, Bodø–Moskenes: la pagina Torghatten non indica l'anno del listino.
7. **Durate assenti**: Skutvik–Svolvær (in inverno Entur ha solo Skrova–Svolvær, 30 min), Andenes–Gryllefjord (linea solo estiva).
8. **Età dei bambini Svipper** lette sulla pagina tariffe bus; per i battelli da confermare.
9. **Capo Nord / Honningsvåg**: nessun battello pubblico Snelandia raggiunge Honningsvåg; via mare ci sono solo Hurtigruten/Havila (già nel catalogo). Il Finnmark costiero va fatto in auto, con la nave costiera o in aereo.
10. **Gratuità a rischio**: il bilancio 2026 abolisce la «gratis ferje» statale; le linee oggi a 0 NOK possono tornare a pagamento.

## 7. Alternative all'auto per zona

| Zona | Cosa permette di lasciare l'auto | Valutazione per la famiglia |
|---|---|---|
| **Bergen → Sognefjord → Flåm** | Battello Fjord1 ogni giorno 1/4–31/10/2027, Bergen 08:00 → Flåm 13:40, passa nel Nærøyfjord (senza fermata) e ferma a Balestrand, Vik, Leikanger. | **La migliore alternativa trovata**: un giorno di trasferimento che è anche escursione. Con il treno di Flåm e la ferrovia Bergen–Oslo forma un anello senza auto. 5h40 a bordo con bambini: pause e cibo da prevedere (pacchetto colazione Fjord1 «in arrivo»). Se si noleggia l'auto a Bergen, l'auto resta a Bergen: combinazione da valutare. |
| **Flåm ↔ Gudvangen** | Crociera di circa 2 ore, 4 partenze d'estate. | Ottima come escursione, ma **non porta l'auto**: chi guida deve tornare a Flåm (bus Gudvangen–Flåm non verificato). |
| **Sognefjord in auto** | Mannheller–Fodnes (Rv5), Vangsnes–Dragsvik (Rv13), Lavik–Oppedal (E39): 15–40 min, 69–81 NOK. | Non sostituiscono l'auto ma sono tratti obbligati: vanno messi nel percorso con attesa e costo. |
| **Hardanger** | Jondal–Tørvikbygd, Utne–Kvanndal, Kinsarvik–Utne (20–28 min). Battello Bergen–Rosendal (1h55, 581 NOK adulto). | Il battello turistico Norheimsund–Eidfjord–Ulvik **non è stato verificato**. Hardanger resta zona da auto. |
| **Geiranger / Ålesund** | Ålesund → Geiranger ogni giorno 15/5–settembre (3 h, 1124 NOK adulto sola andata). Geiranger–Hellesylt (65 min, 6–7 partenze). | Con base ad Ålesund si può vedere il Geirangerfjord **senza guidare** (andata e ritorno in giornata: 08:30–18:30). In auto, Geiranger–Hellesylt sostituisce un tratto di strada di montagna ed è già una crociera; Eidsdal–Linge è obbligato sulla strada per Trollstigen. |
| **Lysefjord / Stavanger** | Traghetto turistico Rødne Lauvvik → Lysebotn con auto (2,5 h, 15/5–fine settembre); crociera Stavanger → Lysefjord a/r 3–3,5 h. | La crociera da Stavanger è un'escursione senza auto (prezzo da verificare). Il traghetto Rødne trasforma un trasferimento in crociera, ma costa 1990 NOK con pacchetto auto. |
| **Bodø → Lofoten** | Bodø–Moskenes 3h15, **passeggeri gratis**; battello Bodø → Svolvær 3h25 (via Skutvik, Skrova). | Arrivare alle Lofoten a piedi è facile e gratuito; **muoversi** sulle Lofoten senza auto non è stato verificato (bus non nel perimetro). Con l'auto: 605 NOK e prenotazione consigliata. |
| **Vesterålen → Senja → Tromsø** | Andenes–Gryllefjord (solo estate, auto 925), Botnhamn–Brensholmen (auto 247). | Scorciatoie estive per un percorso costiero in auto; non tolgono l'auto. |
| **Tromsø ↔ Harstad / Finnsnes** | Battello veloce linea 2, 3 h, 4 corse/giorno in inverno; prenotazione del posto obbligatoria dal 2026. | Buona alternativa al volo o all'auto tra Tromsø e Harstad/Evenes; Finnsnes per Senja. |
| **Finnmark** | Hammerfest–Alta (1h35), Hammerfest–Havøysund (2h30–2h40). | Utile solo se si dorme a Hammerfest/Alta; **nessun collegamento pubblico per Capo Nord**: per Honningsvåg restano auto, aereo o Hurtigruten/Havila. |

## 8. Prossimi passi suggeriti
- A febbraio–marzo 2027 riverificare tutti i prezzi (le compagnie aggiornano a inizio anno) e gli orari estivi (Entur pubblica l'orario estivo di solito qualche mese prima).
- Chiedere a Reis Nordland/Torghatten le tariffe estive per i veicoli sulle linee Lofoten.
- Rileggere Norway's Best e Norled quando i siti rispondono.
