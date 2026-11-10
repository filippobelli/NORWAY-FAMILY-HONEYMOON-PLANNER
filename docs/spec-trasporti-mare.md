# Spec — Trasporti via mare (crociere + traghetti)

Compito 1 del piano `docs/piano-2026-11-09-trasporti-mare.md`. Scritta dall'analista il 2026-11-09 sulla base di `docs/ricerca-traghetti.md` e `docs/ricerca-traghetti.json` (58 tratte). Nessun dato di questa spec è inventato: i numeri citati vengono dalla ricerca, con la loro fonte.

## 1. Obiettivo

La sezione «Crociere» diventa **«Trasporti via mare»** con due parti:
- **Crociere** — Hurtigruten e Havila, **esattamente come oggi** (catalogo `coastalCatalog.ts`, porti `coastalPorts.ts`, opzioni salvate nel viaggio).
- **Traghetti** — tratte da A a B in giornata (traghetti per auto, battelli veloci, battelli turistici sui fiordi), con tappe, durata e tariffa base, per capire dove si può usare meno l'auto.

## 2. Glossario

| Termine | Significato |
|---|---|
| **Tratta** | Riga del catalogo traghetti (`ferry_route`): operatore, mezzo, porti, tappe, durata, tariffa base, fonti. Non è legata a una data. |
| **Mezzo** | `ferje` (traghetto per auto, sistema AutoPASS), `hurtigbat` (battello veloce passeggeri), `turistico` (battello o traghetto turistico con tariffa propria). |
| **Tratto traghetto** | `Segment` del percorso con `mode: 'traghetto'` collegato a una tratta del catalogo. |
| **Tariffa base** | Prezzi pubblicati dalla fonte per adulto, bambino (con fascia d'età), gratuità sotto X anni, veicolo fino a 6 m (conducente incluso o no), con anno. |
| **Stato del dato** | `confermato` (letto sulla fonte primaria), `da_verificare` (fonte secondaria, anno mancante, conflitto, oppure tariffa di un anno diverso dal viaggio), `assente`. Usa i `DataStatus` esistenti. |

## 3. Casi d'uso

### UC1 — Sfogliare crociere e traghetti
- Due schede: **Crociere** (vista attuale, invariata) e **Traghetti**.
- Elenco traghetti raggruppato per **zona** (Vestland, Rogaland, Møre og Romsdal, Nordland, Troms, Finnmark) con: nome, mezzo, porti, durata, «porta l'auto sì/no», prezzo adulto o auto (se presente) con anno e stato.
- Stato vuoto: «Nessuna tratta per questi filtri». Catalogo non caricato (cloud non configurato o in errore): messaggio esplicito, nessun dato finto.

### UC2 — Filtrare
- Per **zona**, per **mezzo** (ferje / battello veloce / turistico), per **auto** (porta l'auto: sì / no / indifferente), testo libero su nome e porti.
- Filtro rapido **«Senza auto»** = tratte passeggeri utili come alternativa (hurtigbåt e turistici con `trasportaAuto=false`, più le ferje dove i passeggeri sono gratis).
- Opzionale: «vicino alle mie tappe» = tratte che hanno almeno un `destinationId` presente tra le tappe del viaggio (solo collegamento per id, **mai** per distanza in linea d'aria).

### UC3 — Scheda della tratta
- Intestazione: nome, operatore, mezzo, zona, strada (es. E39, Rv63), stagione.
- **Tappe in ordine** con i minuti dalla partenza (singolo valore o intervallo min–max), segnando le fermate «a richiesta», «solo discesa», «solo passaggio».
- **Durata totale**, con nota della fonte (es. «orario invernale 2026/27 Entur, estate da verificare»).
- **Frequenza estiva** se pubblicata; altrimenti «non pubblicata» + riferimento invernale.
- **Tariffa base**: adulto, bambino con fascia d'età, gratis sotto X, giovane se esiste, auto ≤6 m con «conducente incluso», pacchetti (auto + N persone), regole speciali (tetto bambino, sconto ritorno), anno, stato, link alla fonte, data di lettura.
- **Fonti** per campo e link «Vai alla fonte». Banner per le tariffe non dell'anno del viaggio: **«Tariffa 2026, da verificare per il 2027»**.
- Collegamenti alle schede del catalogo (`destinationId`) di partenza, arrivo e tappe.
- Nessun pulsante «Prenota»: solo link alla fonte. Nulla viene prenotato o acquistato.

### UC4 — Aggiungere una tratta al percorso
- Dalla scheda: «Aggiungi al percorso» → scelta del collegamento tra due tappe consecutive (`Leg`) → scelta di **porto di imbarco e di sbarco** tra le tappe della tratta (sottotratta, es. Tromsø → Finnsnes), **auto sì/no** (proposta: sì se la tratta porta l'auto e il viaggio ha un'auto, altrimenti no; l'utente decide).
- Si crea un **`Segment` a sé** `mode: 'traghetto'` con: `label`, `durationMin` (dalla tratta, o dalla sottotratta), `waitMin` (attesa/imbarco, **inserita dall'utente**; proposta iniziale vuota con suggerimento «arrivo al molo: vedi fonte», es. Rødne 30 min, Torghatten 45 min con prenotazione — sono regole della fonte, non stime), `departureTime` (inserito dall'utente, scelto tra le partenze pubblicate se esistono), `cost`, `costStatus`, `source`, `ferryRouteId` + `ferryBoardStop`/`ferryAlightStop` + `withCar`.
- Il tratto stradale prima e dopo resta calcolato dal routing; il traghetto **non** viene mai trasformato in distanza stradale e **non** si traccia la linea d'aria come strada (geometria: segmento tra i moli NSR se disponibili, disegnato come linea tratteggiata «via mare»; se mancano le coordinate, nessuna geometria).
- Se il routing OSRM ha già incluso un traghetto nel tratto stradale, l'app non lo rileva da sola: mostra solo l'avviso esistente; l'utente sceglie (nessuna modifica silenziosa).
- La tratta aggiunta può essere tolta o sostituita; i dati salvati del viaggio non vengono toccati altrove.

### UC5 — Costo per la famiglia (+ auto opzionale)
- Nel tratto e nel Budget (categoria esistente **«Traghetti»**) si vede il **totale** e **da dove viene ogni parte**: «2 × adulto 630 = 1260; bambino 8 anni 209; bambino 5 anni gratis (sotto 6) = 0; auto non scelta → **1469 NOK**, tariffa 2026 da verificare per il 2027».
- Regole al §4. Se manca un prezzo necessario (es. adulto assente su una hurtigbåt), il totale è **«non calcolabile»** con elenco di cosa manca, mai zero.

### UC6 — Fonti e stato
- Ogni campo mostra lo stato; la scheda mostra l'elenco fonti con data di lettura. Il riepilogo del catalogo indica quante tratte hanno prezzo confermato, da verificare, assente.

## 4. Regole di calcolo del costo

**Input:** tratta (o sottotratta), partecipanti (`Participants.adults`, `Participants.childrenAges`), `withCar`, data del tratto se nota, anno del viaggio.

1. **Età dei bambini.** Si usa l'età **alla data della traversata**. Il modello attuale ha solo `childrenAges` («età nel periodo del viaggio»: 8 e 5): si usano quelle. Se una soglia della tratta cade a ±1 anno dall'età indicata (es. soglia 6 e bambino di 5), la riga mostra l'avviso «controlla l'età alla data: soglia 6 anni». *Raccomandazione prudente:* **non** aggiungere date di nascita (dato personale non necessario).
2. **Categoria per persona.** Per ogni bambino: se `età < gratisSottoAnni` → 0; altrimenti se nella `fasciaBambino` → prezzo bambino; altrimenti adulto (o «giovane» se la tariffa ha la categoria e l'età rientra). Adulti: prezzo adulto (gli adulti della famiglia sono trattati come «adulto»; le categorie Svipper 30–66 / giovane 18–29 si applicano solo se l'utente lo indica — proposta: un'opzione «adulti sotto 30 anni» non serve per questo viaggio, non implementarla ora).
3. **Ferje (sistema AutoPASS).** Se la fonte dice che i passeggeri sono gratis: con auto → **solo prezzo veicolo ≤6 m (conducente incluso)**; senza auto → 0. Nessuno sconto AutoPASS/accordo applicato (si usa il prezzo pieno: un'auto a noleggio non ha accordo). Eccezioni esplicite della fonte (es. Andenes–Gryllefjord 2026: 100 NOK per adulto passeggero 30–66) si applicano **solo ai passeggeri oltre il conducente**.
   Se la fonte **non dice** se i passeggeri pagano (es. Møre og Romsdal): con auto si conta solo il veicolo, con avviso «da verificare»; senza auto il costo è **non calcolabile**, mai 0 (allineato al design DU9 il 2026-11-10).
4. **Auto solo se scelta.** `withCar=false` → nessun costo veicolo. Con auto e veicolo **«conducente incluso»** → il conducente **non** paga il biglietto adulto (es. Geiranger–Hellesylt: auto 810 + 1 adulto 420 + bambini). Se la fonte non dice se il conducente è incluso → stato `da_verificare` e calcolo con conducente incluso, con avviso.
5. **Pacchetti e biglietti famiglia.** Se la tratta ha un **pacchetto** (auto + N persone) o un **biglietto famiglia** compatibile con la composizione e le età, l'app calcola anche quello e **propone il più basso**, mostrando entrambi i conti. Esempi dalla ricerca: Lysefjord Rødne con auto 1990 (pacchetto) contro 2585 (per persona); Flåm–Gudvangen 1365 (famiglia) contro 1650; Bergen–Flåm 3107 (per persona con tetto 209 e 5enne gratis) contro 3299 (famiglia, valida per bambini 6–17).
6. **Regole speciali della tariffa**, solo se scritte nella fonte e salvate come dato strutturato: tetto per bambino con adulto pagante (Bergen–Flåm 209), sconto sul ritorno (Geiranger–Hellesylt −50%; Skyss −50% ritorno acquistato insieme), tariffa del sabato (Svipper). Per l'andata e ritorno il ritorno è un **secondo tratto** con il suo calcolo; lo sconto ritorno si applica solo se l'utente lo marca «acquistato con l'andata».
7. **Prenotazione facoltativa** (plassgaranti Torghatten: 65 adulto, 35 bambino, 130 auto ≤6 m) = voce separata, **non** inclusa per default; l'utente la attiva.
8. **Tariffa stagionale.** Se la tariffa ha periodi (Bergen–Flåm 18/5–31/8 alta), si usa il periodo della data del tratto; senza data → il periodo che contiene agosto, con avviso.
9. **Anno.** Se `tariffa.anno ≠ anno del viaggio` → `costStatus = 'da_verificare'` e testo **«Tariffa {anno}, da verificare per il {anno viaggio}»**. Mai «confermato» per una tariffa di un altro anno, anche se la fonte è primaria.
10. **Valuta.** Importi in NOK come da fonte; conversione in EUR solo in visualizzazione con il cambio delle impostazioni (`nokPerEur`), come il resto del Budget.
11. **Dati mancanti.** Un prezzo assente richiesto dalla composizione → totale «non calcolabile», `costStatus = 'assente'`, nessun importo in Budget (la voce compare con «prezzo da cercare»).
12. **Budget.** Un tratto traghetto confluisce nella categoria «Traghetti» con il suo stato; i passaggi con `coastalOptionId` (Hurtigruten/Havila) restano nella categoria «Hurtigruten/Havila» come oggi.

## 5. Dati del catalogo (indicazioni per l'architetto)

Struttura minima per tratta, già presente nel JSON di ricerca (`docs/ricerca-traghetti.json`):
- `id` stabile kebab-case (es. `bergen-flam-express`, `eidsdal-linge`), `nome`, `operatore`, `tipo`, `zona`, `regione` (valori di `Region` esistenti), `strada`, `trasportaAuto`, `stagione{testo,stato,fonte}`.
- `tappe[]` in ordine: `nome`, `minutiDaPartenza` (numero o [min,max]), `nsrId`, `lat`, `lng` (solo da NSR; assenti se non letti).
- `durataMinuti{valore,stato,nota,fonte}`, `frequenzaEstiva{testo,stato,fonte}`.
- `tariffa{anno, adulto, bambino, fasciaBambino, gratisSottoAnni, giovane…, auto{classe,nok,conducenteIncluso,anno,fonte,stato}, pacchettoAuto, famiglia2piu2, tratti[], regole[], stato, fonte, daVerificarePer2027}`.
- `destinazioni{partenza,arrivo,tappe[]}` = id di `destinations.ts` (es. `bergen`, `flam`, `geiranger`, `alesund`, `tromso`, `svolvaer`, `andenes`, `senja`, `reine`, `bodo-moskenes`, `lysefjord`, `naeroyfjord`).
- `fonti[]` con chiavi nel dizionario `fonti` (titolo, url, lettoIl).
- Per il seed: le sottotratte con prezzo (es. Tromsø–Finnsnes) sono in `tariffa.tratti`; i prezzi per coppia di fermate non elencati restano assenti.
- **Proposta prudente:** prezzi strutturati (numeri) solo dove `stato ∈ {confermato, da_verificare}`; i testi liberi (`nota`, `regole`) si mostrano così come sono, non si interpretano automaticamente salvo le regole elencate al §4 (tetto bambino, sconto ritorno, pacchetto, famiglia, sabato), che l'architetto trasforma in campi espliciti.

## 6. Cosa resta invariato

- **Crociere Hurtigruten/Havila**: catalogo, porti, `CoastalOption`, `coastalSelected`, `Segment.coastalOptionId`, calcoli e testi attuali. La sola modifica è il contenitore («Trasporti via mare» → scheda «Crociere»).
- Il **viaggio reale** e i dati salvati: nessuna migrazione forzata; i nuovi campi del `Segment` sono facoltativi. Il catalogo `NO-1` resta fisso; le tratte entrano in `NO-2` e il viaggio passa a `NO-2` solo su richiesta di Filippo.
- Routing stradale, regola «mai linea d'aria come strada», distinzione dei mezzi.

## 7. Dubbi e decisioni (Filippo ha approvato in anticipo: scelgo la proposta più prudente)

| # | Dubbio | Decisione |
|---|---|---|
| D1 | Il piano chiede «auto fino a 5 m»; il sistema norvegese ha la classe **«fino a 6 m»**. | Si usa **«fino a 6 m»** come pubblicato. Nessuna classe 5 m inventata. La scheda spiega che un'auto familiare normale vi rientra; con portapacchi/rimorchio l'utente sceglie una classe superiore (campo futuro, non ora). |
| D2 | Prezzi da aggregatore (fergeruter.info) per 8 tratte. | Inseriti ma **sempre `da_verificare`** con la fonte indicata come secondaria. |
| D3 | Tariffe 2026 vs viaggio 2027. | Sempre «Tariffa 2026, da verificare per il 2027», anche se lette sulla fonte primaria. Solo Bergen–Flåm ha prezzi 2027 → `confermato`. |
| D4 | Frequenze estive mancanti (Entur ha solo l'inverno). | Nessuna frequenza estiva dedotta dall'inverno: campo «non pubblicata» + riferimento invernale chiaramente etichettato. |
| D5 | Durate in conflitto (Geiranger–Hellesylt 65 vs 45 min). | Si mostra il valore dell'operatore (65) con stato `da_verificare` e la nota del conflitto. |
| D6 | Linee «gratis» che potrebbero tornare a pagamento (abolizione «gratis ferje» 2026; Nordland gratis solo fuori estate). | 0 NOK resta 0 solo se la fonte lo dice per la stagione del viaggio; per le linee Nordland «gratis fuori estate» il prezzo estivo è **assente** → costo «non calcolabile» con auto. |
| D7 | Età dei bambini alla data: il modello ha solo `childrenAges`. | Si usano le età indicate + avviso vicino alle soglie; nessuna data di nascita. |
| D8 | Attesa/imbarco. | Campo inserito dall'utente; l'app mostra solo le regole scritte dalla fonte (es. «al molo 45 min prima con prenotazione»). Nessuna attesa stimata. |
| D9 | Coordinate dei porti. | Solo NSR da Entur. Dove mancano, nessuna geometria via mare (il tratto resta senza linea sulla mappa, con etichetta). |
| D10 | Operatore Bergen–Sogn che cambia (Norled → Fjord1 dal 1/12/2026). | In catalogo l'operatore 2027 (Fjord1) con nota; i prezzi Norled senza anno non entrano nel seed. |
| D11 | Tratte senza alcun prezzo (17). | Entrano nel catalogo (utili per tappe e durate) con prezzo `assente`; filtro «solo con prezzo» disponibile. |
| D12 | Tratta turistica andata e ritorno (crociera Stavanger–Lysefjord). | Ammessa nel catalogo con `andataRitorno=true`; nel percorso si aggiunge come attività/escursione, **non** come tratto tra due tappe diverse (decisione UX da confermare con ux-ui). |
| D13 | Categorie adulto Svipper (30–66, giovane 18–29) e Snelandia (giovane 20–29). | Gli adulti della famiglia sono «adulto» pieno; nessuna richiesta di età degli adulti. |
| D14 | Rischio di dati obsoleti. | La scheda mostra «letto il 2026-11-09»; il catalogo `NO-2` deve poter essere aggiornato a inizio 2027 senza toccare i viaggi (versione nuova o aggiornamento additivo). |

## 8. Criteri di accettazione (dal piano, dettagliati)
- Ogni tratta ha almeno una fonte con data; durata, tappe e prezzo hanno stato `confermato` / `da_verificare` / `assente`.
- Le tariffe 2026 mostrano «tariffa di oggi, da verificare per il 2027».
- Esempi di test (dai dati della ricerca, 2 adulti + bambini 8 e 5):
  - Tromsø → Harstad senza auto, feriale = **1469 NOK** (630×2 + 209 + 0).
  - Geiranger → Hellesylt con auto = **1650 NOK** (810 + 420 + 210 + 210; pacchetto 1650 uguale).
  - Lauvvik → Lysebotn Rødne con auto = **1990 NOK** (pacchetto, contro 2585 per persona).
  - Bergen → Flåm agosto 2027 = **3107 NOK** (1449×2 + 209 + 0), con il biglietto famiglia 3299 mostrato come alternativa più cara.
  - Eidsdal → Linge con auto = **81 NOK** (passeggeri «da verificare»); senza auto = **non calcolabile** (aggiornato il 2026-11-10: la fonte non scrive la regola dei passeggeri per Møre og Romsdal, design DU9; nessuno zero inventato).
  - Bodø → Moskenes senza auto = **0**; con auto = **605** (+130 solo se si sceglie la prenotazione).
  - Tratta con prezzo adulto assente (es. Bodø → Svolvær) = «non calcolabile», nessun importo nel Budget.
- Il traghetto nel percorso è un `Segment` a sé con attesa, orario e costo; nessuna distanza stradale per il tratto via mare.
- Crociere attuali e dati salvati invariati.
