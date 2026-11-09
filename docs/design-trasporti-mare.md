---
type: design
created: 2026-11-09
piano: docs/piano-2026-11-09-trasporti-mare.md (compito 2)
spec: docs/spec-trasporti-mare.md
ricerca: docs/ricerca-traghetti.md, docs/ricerca-traghetti.json
stato: approvato in anticipo da Filippo (2026-11-09); i dubbi sono decisi qui con la soluzione più prudente (§13)
---

# Design · Trasporti via mare (crociere e traghetti)

La voce «Crociere» di Prenotazioni diventa **«Trasporti via mare»** con due parti: **Crociere** (identica a oggi) e **Traghetti** (catalogo delle tratte in giornata). Tre mockup in `docs/mockup/`:

| Mockup | Cosa mostra |
|---|---|
| `traghetti-elenco.html` | A elenco con filtri e suggerimento «alternativa all'auto»; B stati (nessun risultato, catalogo versione 1, caricamento, senza rete); telefono 375 px |
| `traghetti-scheda.html` | Scheda di Tromsø → Harstad (tappe, sottotratte, stato dei dati, fonti); telefono |
| `traghetti-aggiungi.html` | A aggiunta di Geiranger → Hellesylt con auto; B sottotratta Tromsø → Finnsnes senza auto; C costo non calcolabile; D tratto nel percorso; E riga nel Budget; telefono |

I numeri dei mockup vengono da `docs/ricerca-traghetti.json` (letto il 2026-11-09). Le tappe del viaggio usate negli esempi (Geiranger, Ålesund, Tromsø, Senja, Bergen, Flåm) sono **di esempio**: il percorso non è deciso. I km stradali sono segnaposto (`n km`).

## 0. Regole comuni

- **Componenti riusati**: `Modal` (`PlacementDialog.tsx`: focus al primo controllo, Esc, ritorno del focus), `.panel`/`.panel-head`, `.btn` (`-primary`, `-small`, `-ghost`), `.badge` + `.badge-tone-ok|info|warn`, `StatusBadge`, `.note-info`/`.note-warn`, `.filters`, `.chips-field`/`.chip`, `.cat-list`/`.cat-item`/`.cat-price` (catalogo crociere), `.stop-tabs` (schede con frecce, `PlannerView`), `.place-q`/`.place-opt`, `.place-preview`, `Field`, `MoneyInput`, `StatusSelect`, `Empty`, `.seg-chips`/`.seg-chip`, `.segment`, toast con «Annulla» (`useApply`), `.spinner`, `.link-btn`, `.more-fields`, `.table`.
- **Nessun colore nuovo**: solo i token di `:root` in `src/styles.css`. Il traghetto usa già `--m-traghetto` e il tratteggio `8 6` (`MODE_DASH`).
- **Classi nuove, poche**: `.ferry-stops` (elenco delle tappe con linea verticale), `.cost-lines` (tabella del conto), `.ferry-facts` (griglia `dl`, come `.stop-facts`). Tutte con token esistenti.
- **Stato sempre a parole** con simbolo (✓, !, —), mai solo colore.
- **Annunci**: conteggio risultati in `role="status"` (aggiornato a fine digitazione, 300 ms); errori in `role="alert"`.
- **Nessuna prenotazione**: nessun pulsante «Prenota» o «Compra»; solo link «Vai alla fonte ↗» in nuova scheda.
- **Importi**: in NOK come la fonte; sotto, «≈ N €» con il cambio delle Impostazioni (oggi 10,3885). Mai un importo inventato, mai zero al posto di «assente».

## 1. Struttura e navigazione

| Dove | Oggi | Dopo |
|---|---|---|
| Sotto-menù Prenotazioni (`App.tsx`) | Crociere | **Trasporti via mare** |
| `VIEW_PLACE.crociere` (`route.ts`) | Prenotazioni › Crociere | Prenotazioni › Trasporti via mare |
| Indirizzo | `#/crociere` | invariato `#/crociere` (Crociere); `#/crociere?parte=traghetti` (Traghetti); `#/crociere?parte=traghetti&tratta={id}` apre la scheda. Nuovo alias `mare` → `crociere`. I vecchi link funzionano. |
| Riepilogo Prenotazioni (`BookingsView`) | «Gestisci le crociere» | «Crociere e traghetti» |
| Avvisi in Itinerario (`ItineraryView` riga 545, riga 98) | «…nella sezione Crociere…» | «…in Prenotazioni › Trasporti via mare › Crociere…» |
| Origine nel Budget | «Da Crociere» | invariata per le crociere; i traghetti restano «Da Itinerario» (sono tratti del percorso) |

**Dentro la vista**: due schede in alto, stile `.stop-tabs`, `role="tablist"` con `aria-label="Trasporti via mare"`:
`Crociere` · `Traghetti (58)` — il numero è quello delle tratte del catalogo, senza filtri.
Si apre su **Crociere** (come oggi) salvo `parte=traghetti` nell'indirizzo. La scheda scelta aggiorna l'indirizzo (`replaceState`), così «indietro» del browser non cambia scheda.

## 2. Crociere

Contenuto **identico** a `CoastalView` di oggi (Hurtigruten, Havila, nota, catalogo, confronto). Cambia solo il contenitore: diventa il pannello della scheda «Crociere». Nessun testo, campo o calcolo modificato.

## 3. Traghetti · elenco

Mockup: `traghetti-elenco.html` (A).

**Ordine dall'alto**:
1. `note-info` breve: «Tratte in giornata (traghetti per auto, battelli veloci, battelli turistici) lette sulle fonti ufficiali il 09/11/2026. Quasi tutte le tariffe sono del 2026: da verificare per il 2027. L'app non prenota nulla.»
2. Riga di riepilogo, `muted small`: «58 tratte · prezzo 2027: 1 · tariffa 2026 da verificare: 46 · prezzo assente: 11». I numeri si calcolano dal catalogo (§13 DU4); quelli del mockup vengono dalla tabella §4 della ricerca (le 46 comprendono 6 tratte che hanno solo la regola «passeggeri gratis» senza prezzo del veicolo: per il filtro «Solo con prezzo» le tratte con almeno un importo sono 41).
3. **Suggerimenti «alternativa all'auto»** (§9), solo se ce ne sono.
4. **Filtri** (`.filters`):
   - `input type="search"` «Cerca tratta, porto o tappa» (`aria-label="Cerca nei traghetti"`): nome, porti, tappe intermedie, operatore; senza accenti obbligatori («flam» trova «Flåm», «tromso» trova «Tromsø»).
   - `select` «Zona»: Tutte le zone · Vestland · Rogaland · Møre og Romsdal · Nordland · Troms · Finnmark. Andenes–Gryllefjord (Nordland/Troms) esce con Nordland **e** con Troms.
   - `select` «Auto»: Con o senza auto · Porta l'auto · Solo passeggeri.
   - `chips-field` «Mezzo» (checkbox, più scelte): Traghetto per auto · Battello veloce · Battello turistico. Nessun chip acceso = tutti.
   - `label.check` «Solo con prezzo» (almeno un importo usabile: adulto, bambino o auto).
   - `label.check` «Collegate alle mie tappe» (almeno una tappa del viaggio tra i luoghi collegati alla tratta: partenza, arrivo e `destinazioni.tappe`, **solo per id del catalogo**, mai per distanza). Si dice «collegata», non «tocca»: un luogo collegato può essere vicino al molo e non un porto (es. Eidsdal–Linge è collegata a Geiranger). Disabilitato con `title` «Nessuna tappa nel viaggio» se il percorso è vuoto.
   - I filtri si combinano (E). `link-btn` «Azzera filtri» visibile solo con almeno un filtro attivo.
5. **Conteggio** `role="status"`: «12 tratte su 58». Con «Collegate alle mie tappe»: «11 tratte su 58 collegate alle tue tappe».
6. **Elenco raggruppato per zona** (`h3` della zona + «n tratte» a destra, come i gruppi del catalogo). Dentro la zona: prima le tratte collegate alle tappe del viaggio, poi ordine alfabetico.

**Scheda della tratta in elenco** (`li.cat-item`, griglia di oggi: testo a sinistra, prezzo e azioni a destra):
- `h4` con `button.link-btn` (apre la scheda): «Bergen → Flåm».
- Riga: `badge` del mezzo («Battello veloce») · operatore · strada se c'è («Rv63»).
- Riga: «5 h 40 · 11 fermate intermedie · non porta l'auto» oppure «13 min · diretta · porta l'auto».
- Riga stagione, solo se nota: «1/4–31/10/2027». Se assente non si scrive nulla (la scheda dirà «non pubblicata»).
- Se collegata alle tappe: `badge-tone-ok` «✓ collegata a Bergen, Flåm».
- Se andata e ritorno (crociera Stavanger–Lysefjord): `badge` «andata e ritorno».
- A destra il **prezzo in una riga** secondo la regola della tratta:
  - battello: «Adulto 1449 · bambino 719 NOK»;
  - traghetto per auto: «Auto fino a 6 m 81 NOK · passeggeri gratis» (o «passeggeri: da verificare» se la fonte non lo dice);
  - nessun prezzo: «Prezzo non pubblicato».
- Sotto, il **badge di stato del prezzo** (uno solo, §4.4): «✓ Prezzo 2027» / «! Tariffa 2026 · da verificare per il 2027» / «— Prezzo assente». Fonte secondaria: in più «fonte secondaria».
- Pulsanti: «Scheda» (`.btn-small`) e «Aggiungi al percorso» (`.btn-small.btn-primary`). Per la crociera andata e ritorno: «Aggiungi come escursione» (§5.7).

**Stati** (mockup B):
| Stato | Cosa si vede |
|---|---|
| Caricamento | `.spinner` + «Carico le tratte…» in `role="status"`. |
| Viaggio sul catalogo versione 1 | `note-info`: «Le tratte dei traghetti sono nel catalogo Norvegia versione 2. Il viaggio usa la versione 1 e non cambia da solo.» Pulsante «Vai a Nazioni e cataloghi» (Impostazioni). Nessun elenco, nessun dato finto. |
| Senza rete e catalogo non sul dispositivo | «Senza rete: le tratte si caricano da sole al ritorno della connessione.» Nessun «Riprova». |
| Errore | `role="alert"`: «Non riesco a leggere il catalogo dei traghetti: {motivo}.» + «Riprova». |
| Nessun risultato | `Empty` «Nessuna tratta per questi filtri» + testo «Prova a togliere un filtro o a cercare un porto vicino.» + `btn` «Azzera filtri». Se è attivo «Collegate alle mie tappe»: «Nessuna tratta collegata alle tue tappe. Le tratte si collegano alle tappe solo se sono nel catalogo dei luoghi.» |

## 4. Scheda della tratta

Mockup: `traghetti-scheda.html`. È un `Modal` (stesso componente dei dialoghi di oggi), titolo = nome breve della tratta. Su telefono occupa lo schermo meno 12 px.

**Ordine**:
1. **Titolo** `h2` «Tromsø → Harstad» e sotto «Battello veloce linea 2 · Norled (per Svipper) · Troms».
2. **Note di contesto** (dalla fonte, così come scritte): es. «Finnsnes è la porta di Senja.» Cambio operatore: «Fjord1 dal 1/12/2026 (fino al 30/11/2026 Norled).»
3. **Fatti** (`dl.ferry-facts`, due colonne; su telefono una):
   - *Durata totale*: «3 h» + stato «✓ confermato · orario invernale 2026/27, d'estate da verificare». Conflitto: «1 h 05 · ! da verificare: la fonte Fjord1 dice circa 65 min, Entur 45 min».
   - *Porta l'auto*: «No, solo passeggeri» / «Sì, fino a 6 m (un'auto familiare rientra; con portapacchi o rimorchio conta la lunghezza totale)».
   - *Stagione*: testo della fonte + stato. Assente: «non pubblicata».
   - *Frequenza in estate*: testo della fonte se confermata (es. orari Geiranger 2026, con l'anno). Altrimenti «Non pubblicata. Riferimento invernale: 4 corse al giorno (mercoledì 18/11/2026).» — il riferimento invernale è etichettato come tale, mai presentato come estivo.
4. **Tappe in ordine** (`ol.ferry-stops`): una riga per fermata con nome e tempo dalla partenza: «Partenza», «dopo 1 h 15», «dopo 1 h 50–2 h» (intervallo), «orario non indicato». Etichette: «a richiesta», «solo discesa», «solo passaggio, senza fermata». La fermata collegata a un luogo del catalogo ha accanto «→ Senja» (`link-btn`, apre il luogo). In fondo: «Durata totale 3 h».
5. **Tariffa base** (`section` con `h3` «Tariffa base · 2026»):
   - Badge di stato (§4.4) in alto, con la frase lunga: «Tariffa 2026, da verificare per il 2027».
   - **Regola** in una frase chiara, prima dei numeri:
     - traghetto per auto con passeggeri gratis: «Paga solo il veicolo, conducente incluso. I passeggeri viaggiano gratis.»
     - turistico con auto: «Paga l'auto (conducente incluso) e ogni passeggero.»
     - battello: «Paga ogni passeggero. Bambini 6–17 anni; sotto i 6 anni gratis.»
     - regola non scritta dalla fonte: «La fonte non dice se i passeggeri pagano: da verificare.»
   - Tabella `.cost-lines` (adulto, bambino con fascia, gratis sotto X, giovane se c'è, auto ≤6 m, pacchetto, biglietto famiglia, sottotratte, sabato). Valore assente = «—» con «non pubblicato».
   - Regole speciali della fonte, in elenco: tetto bambino, sconto ritorno, prenotazione facoltativa, periodi di alta stagione.
   - Nota della fonte così com'è (es. «Fasce d'età lette sulla pagina tariffe bus…»).
6. **Fonti** (`ul.links`): titolo, «letto il 09/11/2026», link «Vai alla fonte ↗» (`target=_blank`, `rel=noreferrer`). Fonte secondaria: «fonte secondaria: aggregatore».
7. **Azioni** in fondo (fisse in basso su telefono): «Aggiungi al percorso» (`btn-primary`) e «Chiudi» (`btn-ghost`). Se la tratta è già nel percorso: riga `badge-tone-ok` «✓ Nel percorso: Tromsø → Senja, giorno 9» con `link-btn` «Apri nel percorso»; il pulsante resta (es. per il ritorno).

### 4.4 Stato del prezzo: tre testi soltanto

| Dato | Badge breve (elenco) | Frase (scheda e conto) | Tono |
|---|---|---|---|
| Tariffa dell'anno del viaggio, letta sulla fonte primaria | ✓ Prezzo 2027 | Prezzo 2027 confermato sulla fonte | `badge-tone-ok` |
| Tariffa di un altro anno, o fonte secondaria, o conflitto | ! Tariffa 2026 · da verificare per il 2027 | Tariffa 2026, da verificare per il 2027 | `badge-tone-warn` |
| Nessun prezzo | — Prezzo assente | Prezzo non pubblicato dalla fonte | `badge` neutro |

Così il «confermato» della ricerca (letto sulla fonte) non viene mai scambiato per «valido per il viaggio»: è la regola 9 della spec resa visibile.

## 5. Aggiungi al percorso

Mockup: `traghetti-aggiungi.html` (A, B, C). Il contenuto del `Modal` della scheda cambia (stesso dialogo, come «Togliere la nazione?» in `Countries`): titolo «Aggiungi al percorso: Geiranger → Hellesylt», link «← Torna alla scheda». Si arriva anche direttamente dal pulsante dell'elenco.

### 5.1 Campi, in ordine

1. **Tra quali tappe** (`Field` + `select`, obbligatorio): «Collegamento del percorso». Opzioni = collegamenti tra tappe consecutive, «3 Geiranger → 4 Ålesund · giorno 6». In cima, in un `optgroup` «Collegati a questa tratta», quelli con almeno una tappa collegata alla tratta (per id); poi «Altri collegamenti». Preselezionato: il primo collegamento con entrambe le tappe collegate alla tratta, poi con una sola; altrimenti nessuno («Scegli un collegamento»).
   - Percorso con meno di due tappe: `note-warn` «Servono almeno due tappe nel percorso. Aggiungile in Itinerario e torna qui.» + link «Vai all'Itinerario». Nessun altro campo.
   - **Non si creano tappe nuove dai porti** (§13 DU6): il traghetto entra sempre in un collegamento esistente. Se serve una tappa nuova (es. dormire a Hellesylt), si aggiunge in Itinerario.
2. **Imbarco e sbarco** (due `select` affiancati, solo se la tratta ha tappe intermedie o se l'utente vuole il verso opposto): elencano tutte le fermate in ordine. Preselezionati partenza e arrivo della tratta, oppure le fermate collegate alle tappe del collegamento (es. Tromsø → Finnsnes per il collegamento Tromsø → Senja). Si può scegliere il verso opposto (Hellesylt → Geiranger): nota «Verso opposto: durata presa dall'orario dell'andata, da verificare». Imbarco = sbarco: errore «Imbarco e sbarco devono essere diversi.» Fermate «solo passaggio» non selezionabili; «solo discesa» solo come sbarco.
   Sotto: «Tratto scelto: Tromsø → Finnsnes · 1 h 15 · 1 fermata in meno di 4».
3. **Con l'auto?** (`fieldset.place-q`, radio):
   - «Con l'auto a bordo» · «Senza auto (solo passeggeri)».
   - Tratta che non porta veicoli: «Con l'auto» disabilitato con il motivo «Questa tratta non porta veicoli».
   - Proposta: **con l'auto** se la tratta porta veicoli **e** il collegamento scelto ha già un tratto su strada; altrimenti senza. Riga `hint`: «Proposto perché questo collegamento è in auto.»
4. **La strada del collegamento** (`fieldset.place-q`, solo se il collegamento ha già tratti su strada):
   - «Ricalcola la strada fino all'imbarco e dallo sbarco» — richiede le coordinate dei due moli (registro NSR). Senza coordinate: disabilitato, «Mancano le coordinate del molo di {porto}: non posso calcolare la strada fino al molo».
   - «Il traghetto sostituisce la strada» — solo **senza auto** e quando imbarco e sbarco sono collegati alle due tappe; nota «L'auto non fa questo collegamento: decidi tu dove resta (riconsegna o ritorno).»
   - «Lascia la strada com'è» — con avviso «Strada e traghetto insieme: i tempi si sommano, controlla il collegamento.»
   - Proposta: la prima opzione disponibile in quest'ordine. Nessuna è applicata finché non si preme «Applica».
5. **Orario e attesa** (`grid-2`):
   - «Partenza» `input type="time"`, facoltativo. Se la fonte ha partenze pubblicate, sotto: «Partenze pubblicate (2026): 10:00 · 11:30 · …» come `button.chip` che riempiono il campo; più «orari 2026, da verificare per il 2027». Senza orari: «La fonte non pubblica gli orari estivi: inseriscilo quando lo trovi.»
   - «Attesa e imbarco (min)» `NumberInput`, facoltativo. Suggerimento solo se scritto dalla fonte: «La fonte chiede di essere al molo 45 min prima con prenotazione.» Altrimenti: «La fonte non indica quando presentarsi.» Campo vuoto: nel percorso vale l'ipotesi di Impostazioni (oggi 30 min), mostrata come «attesa ipotizzata» come succede già oggi.
6. **Opzioni della tariffa** (`label.check`, solo se la tratta le ha; spente di partenza):
   - «È il ritorno di un biglietto comprato con l'andata (−50%)» — se la fonte ha lo sconto ritorno.
   - «Aggiungi la prenotazione del posto (facoltativa): auto 130, adulto 65, bambino 35 NOK» — Bodø–Moskenes e simili.

### 5.2 Anteprima del costo per la famiglia

`section.place-preview` «Costo per la famiglia», sempre visibile e aggiornata a ogni scelta. Famiglia = `trip.participants` (2 adulti; bambini 8 e 5 anni). Contenuto:

1. Tabella `.cost-lines` (`<table>` con `caption` nascosta «Dettaglio del costo»): una riga per voce, colonne «Voce», «Regola», «NOK».
   - Auto fino a 6 m, conducente incluso — 810
   - Adulto (passeggero; il conducente è già nell'auto) — 420
   - Bambino 8 anni — tariffa bambino — 210
   - Bambino 5 anni — gratis solo sotto i 4 anni — 210 · `!` «Controlla l'età il giorno della traversata: soglia 4 anni»
   - (traghetto per auto) Passeggeri — gratis per regola della tratta — 0
   - (senza auto) Auto — non scelta — non conteggiata
2. **Totale per persona**, poi le alternative della fonte con il loro conto: «Pacchetto auto + 4 persone: 1650». Riga in grassetto «Si usa: 1650 NOK (≈ 159 €)» con il motivo: «il più basso» / «stesso importo del pacchetto» / «il biglietto famiglia vale solo per bambini 6–17: non si applica». A parità vince il conto per persona (più leggibile).
3. **Stato**: frase di §4.4 + «Fonte: {titolo}, letto il 09/11/2026».
4. **Non calcolabile** (mockup C): nessun totale, al suo posto `note-warn` «Costo non calcolabile: mancano i prezzi adulto e bambino.» Le righe mancanti mostrano «— prezzo assente». Sotto: «Nel Budget il traghetto comparirà tra i costi da cercare, senza importo.» e `details.more-fields` «Ho trovato il prezzo» con `MoneyInput` «Prezzo totale per la famiglia», `StatusSelect`, `input type=url` «Link alla fonte». Un prezzo inserito qui vale per questo tratto e si legge «inserito da te».

### 5.3 Anteprima del percorso

Sotto il costo, `place-preview` «Come diventa il collegamento» (stessa grafica di `RoutePreview`, ma per i tratti del collegamento, non per le notti):
«Geiranger → Ålesund · prima: Strada n km, 2 traghetti calcolati · dopo: Geiranger → Hellesylt 1 h 05 · Strada Hellesylt → Ålesund da ricalcolare». Le notti e le tappe non cambiano mai con questa azione: lo si scrive («Tappe e notti invariate.»).

### 5.4 Pulsanti

«Applica al percorso» (`btn-primary`, disabilitato finché manca il collegamento o imbarco/sbarco non validi; il motivo è scritto accanto) · «Annulla» (`btn-ghost`).
Dopo: il dialogo si chiude, toast «Traghetto aggiunto: Geiranger → Hellesylt nel collegamento Geiranger → Ålesund» con «Annulla» (ripristina il collegamento com'era) e link «Apri nel percorso». Se si è scelto «Ricalcola la strada», il calcolo parte subito e lo stato è quello di oggi («Calcolo del percorso in corso…» nel collegamento).

### 5.5 Già nel percorso
La tratta può entrare più volte (andata, ritorno). Se il collegamento scelto ha già **la stessa tratta con lo stesso verso**: `note-warn` «Questo collegamento ha già Geiranger → Hellesylt. Aggiungerla di nuovo conta il costo due volte.» Il pulsante resta attivo.

### 5.6 Tratto calcolato da OSRM con un traghetto
Se il collegamento ha già un traghetto rilevato dal calcolo stradale, l'app non lo riconosce come questa tratta: mostra l'avviso esistente «Traghetto calcolato e traghetto manuale insieme: probabile doppio conteggio» anche nell'anteprima. Nessuna modifica silenziosa.

### 5.7 Crociera turistica andata e ritorno (D12 della spec)
Non va tra due tappe: il pulsante è «Aggiungi come escursione» e apre il flusso esistente delle visite pianificate di Giornate (tappa = quella collegata alla tratta, es. Stavanger), con titolo, durata «3 h – 3 h 30, da verificare» e prezzo assente. Nessun tratto nel percorso.

## 6. Come si legge il conto (testi)

Forma fissa di ogni riga: **Voce · regola · importo**. Esempi dalla spec (2 adulti, bambini 8 e 5):

| Tratta | Righe |
|---|---|
| Tromsø → Harstad, senza auto | Adulto × 2: 630 × 2 = 1260 · Bambino 8 anni: 209 · Bambino 5 anni: gratis sotto i 6 anni = 0 · **1469 NOK** · Tariffa 2026, da verificare per il 2027 |
| Tromsø → Harstad, sabato | stesso schema con «tariffa del sabato» (si applica se il giorno del collegamento è sabato; senza data: tariffa feriale con nota «se viaggi di sabato: 708 NOK») |
| Geiranger → Hellesylt, con auto | Auto ≤6 m con conducente: 810 · Adulto: 420 · Bambini: 210 + 210 · per persona 1650 · pacchetto 1650 · **1650 NOK** |
| Lauvvik → Lysebotn, con auto | per persona 2585 · pacchetto auto + 5 persone 1990 · **1990 NOK** (il più basso) |
| Bergen → Flåm | Adulto × 2: 2898 · Bambino 8 anni: max 209 con adulto pagante · Bambino 5 anni: gratis sotto i 6 · per persona 3107 · famiglia 3299 · **3107 NOK** · Prezzo 2027 confermato sulla fonte |
| Eidsdal → Linge | con auto: Auto ≤6 m con conducente 81 · Passeggeri: da verificare per Møre og Romsdal · **81 NOK** · senza auto: **0 NOK** solo se la fonte dice passeggeri gratis, altrimenti «non calcolabile» |
| Bodø → Moskenes | senza auto **0 NOK** · con auto **605 NOK** · con prenotazione (se spuntata) + 130 |
| Bodø → Svolvær (battello) | Adulto — prezzo assente · Bambini — prezzo assente · **Non calcolabile** |

Nota per Eidsdal–Linge: la ricerca dice che per Møre og Romsdal la gratuità dei passeggeri non è scritta. Con auto il costo è calcolabile (conducente incluso; passeggeri «da verificare» con avviso); senza auto il totale è «non calcolabile» finché la fonte non conferma. È più prudente della spec (che dà 0) e va allineato con l'architetto (§13 DU9).

## 7. Nel percorso (Itinerario)

Mockup: `traghetti-aggiungi.html` (D).

- **Chip del collegamento** (`.seg-chip.seg-traghetto`, oggi già esistente): «(icona nave) Geiranger → Hellesylt · 1 h 05 + attesa 30 min · ore 10:00 · orario da verificare» e, nuovo, «· con auto · 1650 NOK» oppure «· prezzo da cercare». Etichetta a destra: «dal catalogo traghetti» (al posto di «inserito a mano»).
- **Totali del collegamento**: invariati nella logica («n km su strada · guida … · 1 traghetto · traversate 1 h 05 · totale teorico …»). Il tratto via mare **non ha km** e non entra nei km su strada.
- **Dettaglio tratti** (`SegmentEditor`): intestazione «(icona nave) Geiranger → Hellesylt · Fjord1 · battello turistico», poi i campi di oggi (partenza, attesa, durata, stato, verifica) e un blocco nuovo «Costo per la famiglia» con la riga riassuntiva e `details` «Come è calcolato» (la stessa tabella di §5.2). Pulsanti: «Cambia imbarco, auto e opzioni» (riapre il dialogo §5 precompilato), «Scheda della tratta». Modificare a mano il costo: nota «Costo inserito da te: il calcolo del catalogo non si usa più» + `link-btn` «Torna al calcolo».
- **Mappa**: linea tratteggiata `--m-traghetto` tra i due moli, solo con coordinate NSR; etichetta «via mare». Senza coordinate: nessuna linea, il tratto resta nell'elenco con «senza linea sulla mappa: mancano le coordinate del molo».
- **Togliere**: il pulsante «Rimuovi tratto» di oggi; toast «Traghetto tolto dal collegamento» con «Annulla». La strada non torna da sola com'era: il collegamento mostra «Ricalcola strada».
- Oggi / Modalità viaggio: il traghetto compare già tra i trasporti con l'orario; nessuna modifica oltre all'etichetta.

## 8. Nel Budget

Mockup: `traghetti-aggiungi.html` (E).

- Categoria esistente **«Traghetti»** (le crociere restano in «Hurtigruten/Havila»).
- Riga della tabella voci: **Voce** «Traghetto Geiranger → Hellesylt · con auto» · **Categoria** Traghetti · **Origine** «Da Itinerario» · **Stato** «Da verificare» · **Importo** «1.650 NOK» e sotto «≈ 159 €». Sotto la voce, `small muted`: «Tariffa 2026, da verificare per il 2027 · 2 adulti, bambini 8 e 5» e `details` «Dettaglio» con la tabella di §5.2. Link «Apri nel percorso».
- Stato della riga: `da_verificare` per ogni tariffa di un anno diverso dal viaggio; `confermato` solo per un prezzo dell'anno del viaggio; `prenotato`/`pagato` solo se l'utente li imposta (come oggi).
- **Non calcolabile**: nessun importo, nessuno zero. La voce va in «Costi non ancora quantificati (esclusi dal totale)» come «Traghetto Bodø → Svolvær: prezzo da cercare (mancano adulto e bambino)» e nel riquadro «Cosa manca». Il KPI «costi senza importo» la conta.
- Traghetto senza auto e con passeggeri gratis: voce presente con «0 NOK · passeggeri gratis per regola della tratta», così si vede che non è un dimenticanza.

## 9. Suggerimento «alternativa all'auto»

Mockup: `traghetti-elenco.html` (A, riquadro in alto) e (D in `traghetti-aggiungi.html`, riga nel collegamento).

**Quando**, tutte e tre insieme:
1. la tratta è un **battello veloce o turistico** (un traghetto per auto è parte della strada, non un'alternativa: es. Eidsdal–Linge, collegata a Geiranger, non va mai suggerita);
2. le **due tappe consecutive** di un collegamento sono entrambe tra i luoghi collegati alla tratta (partenza, arrivo o tappe, per id del catalogo; anche nel verso opposto, con durata «da verificare»);
3. quel collegamento oggi ha un tratto su strada.

Nessun confronto per distanza o in linea d'aria.

**Dove**:
1. In cima a Traghetti, `.panel` «Alternative all'auto nel tuo percorso» (al massimo 3, poi «Mostra tutte (n)»). Ogni voce: «Bergen → Flåm in auto oggi: n km, guida n h. In battello: 5 h 40, 1 corsa al giorno (Bergen 08:00). Adulto 1449 · bambino 719 NOK.» + riga prudente «Senza auto su questo collegamento: l'auto va riconsegnata o riportata. Decidi tu.» Pulsanti: «Scheda», «Valuta nel percorso» (apre §5 con quel collegamento, «Senza auto» e «Il traghetto sostituisce la strada» preselezionati; niente cambia finché non si preme «Applica»), «Non mi interessa».
2. Nel collegamento in Itinerario, una riga `muted small` sotto i totali: «C'è anche un battello: Bergen → Flåm, 5 h 40 · Vedi» (link alla scheda). Nessun pulsante che applica.

**«Non mi interessa»**: nasconde quel suggerimento per quel collegamento (salvato nel viaggio, reversibile con «Mostra i suggerimenti nascosti (1)» in fondo al riquadro). Nessun suggerimento è mai applicato in automatico.

**Testo del titolo del riquadro**: «Alternative all'auto nel tuo percorso». Sottotitolo: «Tratte via mare che collegano due tue tappe oggi in auto. Sono solo proposte: il percorso cambia solo se lo scegli tu.»

## 10. Telefono (375 px)

- Schede «Crociere / Traghetti» a tutta larghezza, metà ciascuna.
- Ricerca sempre visibile; gli altri filtri in `details.more-fields` «Filtri · 2 attivi» (chiuso di partenza; il numero dice quanti filtri sono accesi).
- Tratte una sotto l'altra: `.cat-item` passa già a una colonna; pulsanti a tutta larghezza, altezza ≥ 44 px (niente `btn-small` su telefono per le azioni principali).
- Scheda e aggiunta: `Modal` a tutto schermo meno 12 px; azioni fisse in basso (`position: sticky; bottom: 0` con fondo `--surface`); imbarco e sbarco uno sotto l'altro; la tabella del conto resta a due colonne (voce + regola in una cella, importo a destra), niente scorrimento orizzontale.
- Le partenze pubblicate (chip) vanno a capo.

## 11. Accessibilità

- **Schede**: `role="tablist"`/`tab`/`tabpanel`, frecce sinistra/destra, Home/Fine (stesso codice di `PlannerView` riga 738).
- **Filtri**: ogni campo con etichetta (visibile o `aria-label`); chip del mezzo = checkbox native dentro `label.chip` (focus visibile con `:focus-within`, già in CSS); stato «acceso» anche a parole per i lettori (`aria-checked` nativo).
- **Conteggio** in `role="status"`, aggiornato una volta a fine digitazione.
- **Elenco**: `ul` con `li` per tratta, titoli `h3` (zona) e `h4` (tratta) per la navigazione per titoli. Il nome della tratta è un pulsante con testo «Bergen → Flåm»; i pulsanti «Scheda» e «Aggiungi al percorso» hanno `aria-label` completo («Aggiungi al percorso: Bergen → Flåm»).
- **Freccia →** nei nomi: letta come «verso» con `<span class="sr">verso</span>` nascosto e `aria-hidden` sul simbolo.
- **Tappe**: `ol`; i tempi a parole («dopo 1 h 15»), la linea verticale è decorativa.
- **Conto**: vera `table` con `caption` (nascosta) e intestazioni `th scope`; «non calcolabile» è testo, non colore.
- **Stati** sempre con simbolo e parola (✓ / ! / —).
- **Dialogo**: focus al primo controllo all'apertura; al passaggio scheda → aggiunta il focus va al titolo `h2` (`tabIndex=-1`); «← Torna alla scheda» riporta il focus al pulsante «Aggiungi al percorso»; Esc chiude e restituisce il focus all'elemento che l'ha aperto.
- **Campi disabilitati** (es. «Con l'auto») hanno il motivo accanto, collegato con `aria-describedby`.
- **Contrasto**: testi su `--surface` con `--blu`/`--secondario` (circa 15:1 e 7,8:1); badge di avviso `--rosso-testo` su `--rosso-tenue` come oggi; bordi dei controlli `--linea-forte` (≥ 3:1).
- **Movimento**: nessuna animazione nuova; lo spinner rispetta `prefers-reduced-motion` come oggi.
- **Link esterni**: «Vai alla fonte ↗» con testo «(si apre in una nuova scheda)» per i lettori.

## 12. Testi (riferimento rapido)

| Contesto | Testo |
|---|---|
| Menù | Trasporti via mare |
| Schede | Crociere · Traghetti (58) |
| Nota iniziale | Tratte in giornata lette sulle fonti ufficiali il 09/11/2026. Quasi tutte le tariffe sono del 2026: da verificare per il 2027. L'app non prenota nulla. |
| Ricerca | Cerca tratta, porto o tappa |
| Filtri | Zona · Auto · Mezzo · Solo con prezzo · Collegate alle mie tappe · Azzera filtri |
| Mezzi | Traghetto per auto · Battello veloce · Battello turistico |
| Conteggio | {n} tratte su {tot} |
| Vuoto | Nessuna tratta per questi filtri |
| Regola ferje | Paga solo il veicolo, conducente incluso. I passeggeri viaggiano gratis. |
| Anno | Tariffa 2026, da verificare per il 2027 |
| Assente | Prezzo non pubblicato dalla fonte |
| Frequenza | Non pubblicata. Riferimento invernale: … |
| Età | Controlla l'età il giorno della traversata: soglia {n} anni |
| Non calcolabile | Costo non calcolabile: mancano {voci}. |
| Pulsanti | Scheda · Aggiungi al percorso · Applica al percorso · Annulla · ← Torna alla scheda · Vai alla fonte ↗ |
| Toast | Traghetto aggiunto: {tratta} nel collegamento {A} → {B} |
| Suggerimento | Alternative all'auto nel tuo percorso · Valuta nel percorso · Non mi interessa |

## 13. Decisioni (con motivazione)

| # | Decisione | Perché |
|---|---|---|
| DU1 | La voce resta `#/crociere`; la parte si sceglie con `?parte=traghetti`. Alias `mare`. | Nessun link salvato si rompe; nessun nuovo id di vista da migrare. |
| DU2 | Due **schede interne** (`stop-tabs`), non due voci di menù. Si apre su Crociere. | Il piano chiede una sezione con due parti; chi usava «Crociere» la ritrova uguale. |
| DU3 | Scheda e aggiunta nello **stesso `Modal`**, a passi. | Poche schermate; stesso schema dei dialoghi esistenti (crociera, nazioni); si torna indietro senza perdere il contesto. |
| DU4 | Un solo badge di stato del prezzo con tre testi (§4.4). | Separa «letto sulla fonte» da «valido per il 2027»: evita che una tariffa 2026 sembri certa. |
| DU5 | Filtro «Auto» a tre valori al posto del filtro rapido «Senza auto» della spec. | Più chiaro e combinabile; «alternativa all'auto» ha già il suo riquadro (§9). |
| DU6 | Il traghetto entra solo in un **collegamento esistente**; non si creano tappe dai porti. | Creare tappe cambia notti e giornate: è una scelta da Itinerario, non da un catalogo. |
| DU7 | Con o senza auto: proposta, mai obbligata; «con auto» proposto solo se il collegamento è già in auto. | Il viaggio non ha un campo «abbiamo l'auto»; il collegamento in auto è l'unico segnale certo. |
| DU8 | La strada esistente non cambia senza scelta esplicita nel dialogo, con anteprima e «Annulla». | Regola «nessuna modifica silenziosa»; i tempi doppi sono avvisati. |
| DU9 | Eidsdal–Linge senza auto (e ogni traghetto di Møre og Romsdal senza regola passeggeri scritta): «non calcolabile», non 0. | La ricerca dice che la gratuità lì non è scritta; uno zero sarebbe un dato inventato. Da allineare con l'architetto (la spec indica 0). |
| DU10 | Attesa vuota = ipotesi di Impostazioni (30 min), mostrata come «ipotizzata». Nessuna stima per tratta. | Comportamento già esistente; nessun valore nuovo inventato. |
| DU11 | Età: si usano le età del viaggio; avviso se a ±1 anno da una soglia. Nessuna data di nascita. | Spec D7; dato personale non necessario. |
| DU12 | A parità tra conto per persona e pacchetto vince il conto per persona; sempre mostrati entrambi. | Si vede da dove viene ogni parte. |
| DU13 | «Assente» non diventa un nuovo `DataStatus`: tratto senza `cost` + testo «prezzo da cercare». | `DataStatus` non ha «assente» e i viaggi salvati non devono cambiare; il Budget gestisce già i costi senza importo. |
| DU14 | Suggerimenti: solo battelli veloci o turistici, solo per id del catalogo, solo su collegamenti già in auto, nascondibili e reversibili. | Prudenza: proposta, mai cambio automatico; niente linea d'aria; un traghetto per auto non sostituisce l'auto. |
| DU15 | Crociera turistica andata e ritorno = escursione nelle Giornate. | Non collega due tappe diverse (spec D12). |
| DU16 | Nessun pulsante di acquisto; prenotazione facoltativa solo come costo spuntabile. | Regola del progetto: nulla viene prenotato o comprato. |

## 14. Cosa serve a dati e sviluppo (solo indicazioni UX)

- `Segment` (facoltativi, additivi): `ferryRouteId`, `ferryBoardStop`, `ferryAlightStop` (indici o nomi delle fermate), `withCar`, `ferryReturnBought` (sconto ritorno), `ferryBookingAdded` (prenotazione facoltativa), `costByUser` (costo inserito a mano: il calcolo non si usa). Il dettaglio del conto **si calcola**, non si salva.
- Viaggio: elenco dei suggerimenti nascosti (`hiddenFerrySuggestions: {legId, ferryRouteId}[]`).
- Catalogo: per ogni fermata i flag «a richiesta», «solo discesa», «solo passaggio»; partenze pubblicate con anno; regola passeggeri esplicita (`gratis` / `a pagamento` / `non indicata`); regole tariffarie strutturate di spec §4.6.
- Budget: testo «prezzo da cercare» al posto di «Costo traghetto mancante» (`budget.ts` riga 206).
