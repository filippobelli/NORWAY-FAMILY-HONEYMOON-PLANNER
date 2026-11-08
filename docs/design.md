---
type: design
created: 2026-11-06
piano: docs/piano-2026-11-06-database.md
spec: docs/spec.md (approvata 2026-11-06, D1–D5 decise come proposte)
stato: in attesa di approvazione (punto 3 del piano)
---

# Design · Nazioni, catalogo per versione, allegati nel cloud

Solo gli otto punti richiesti. Nessun'altra modifica alla grafica. Mockup in `docs/mockup/`.

## 0. Regole comuni

- **Componenti riusati**: `Modal` (`PlacementDialog.tsx`: focus al primo controllo, Esc, ritorno del focus), `.panel`/`.panel-head`, `.btn` (`-primary`, `-small`, `-ghost`, `.danger`), `.badge-tone-ok|info|warn`, `.note-info`/`.note-warn`, `.chip`/`.chips-field`, `.place-q`/`.place-opt`, `.place-preview` e `RoutePreview`, `BookingConfirm` (`PlanBDialog.tsx`), `Field`, toast con «Annulla» (`useApply`), `.spinner`, `.t-card`, `.diary-files`, `DataStatusCard`, `OfflineInfo`.
- **Nessun colore nuovo**: solo i token di `:root` in `src/styles.css`.
- **Stati sempre a parole**, con simbolo (✓, !, rotella), mai solo colore.
- **Annunci**: avanzamento e successo in `role="status"` (cortese); errori in `role="alert"`. Una frase per evento, nessun annuncio per percentuale.
- **Senza rete**: «Riprova» non compare (come i banner di `App.tsx`); il testo dice che si riparte da soli al ritorno della rete.
- **Telefono 375 px**: niente scorrimento orizzontale; pulsanti principali a tutta larghezza; dialoghi con margine 12 px (regola di `.place-dialog`).
- **Valori nei mockup**: `AAAA-MM-GG` = data di pubblicazione della versione, non ancora decisa. «82 luoghi» = voci attuali di `src/data/destinations.ts`; nell'app il numero si legge dal catalogo. «Nazione di prova» e la valuta XTS (codice ISO riservato alle prove) servono solo a mostrare il caso con più nazioni.
- **Con una sola nazione nel viaggio** filtri, intestazioni e scelte di nazione non compaiono: l'interfaccia resta quella di oggi, salvo la riga «Nazioni» e la versione del catalogo.

## 1. Scelta della nazione all'inizio di un viaggio nuovo

Mockup: `docs/mockup/nazione-scelta.html`.

**Dove**: Panoramica (`OverviewView`), viaggio senza tappe e senza nazioni. Prende il posto di `ov-start` «Da dove vuoi cominciare?» finché il primo catalogo non è sul dispositivo. Un viaggio migrato (Norvegia, versione 1) non lo vede mai. Si arriva da «Nuovo viaggio vuoto» (Impostazioni) o dal primo accesso senza viaggi nel cloud (§7).

**Componenti**: sezione `ov-start`; `fieldset` con schede radio (stile di `ov-start-card`, scelta con bordo `--blu` come `is-recommended`); `.btn-primary`; `.panel` con `.spinner` e `<progress>`; `.note-warn`; `.note-info`.

**Cosa mostra ogni nazione**: nome; «Catalogo versione N · pubblicato il AAAA-MM-GG»; «N luoghi · valuta XXX». Dati da `countries` e `catalog_releases` (ultima versione pubblicata).

**Comportamento**:
1. Elenco in caricamento: «Carico le nazioni disponibili…».
2. Una sola nazione: già selezionata. Più nazioni: nessuna selezionata, pulsante «Scegli una nazione» disabilitato.
3. Pulsante: «Continua con {nazione}». Crea la riga in `trip_countries` e avvia il download.
4. Download: rotella, testo, barra solo se la dimensione è nota. La nazione è già nel viaggio: chiudendo, il download riparte alla prossima apertura.
5. Fatto: messaggio `note-info` e poi le due schede di oggi (testi invariati). Il focus va al titolo «Da dove vuoi cominciare?» (`tabIndex=-1`, regola già in CSS). Sotto il titolo del viaggio compare la riga «Nazioni» (§3).
6. Errore: `note-warn` con motivo, «Riprova» e, se ci sono altre nazioni, «Scegli un'altra nazione» (toglie la riga, nulla la usa).
7. Senza rete prima dell'elenco: messaggio, nessun pulsante; si riparte da soli. Senza rete durante il download: «Download interrotto…», ripartenza automatica.
8. Cambiare nazione a viaggio vuoto: da «Gestisci le nazioni» (§2), senza conferma perché nulla la usa.

**Testo di conferma «Nuovo viaggio vuoto»** (Impostazioni): «Creare un nuovo viaggio? Quello attuale resta nel cloud e lo riapri da «Viaggi salvati nel cloud».»

**Desktop**: schede in griglia `auto-fit, minmax(240px, 1fr)`. **375 px**: una colonna, pulsante a tutta larghezza.

**Accessibilità**: `fieldset` con `legend` nascosta «Nazioni disponibili»; radio nativi dentro le etichette (tutto il testo della scheda è l'etichetta); stato del download in `role="status"`; `<progress aria-label="Download del catalogo della {nazione}">`; errore `role="alert"`; focus al titolo successivo a fine download.

## 2. «Aggiungi nazione» e rimozione (D3)

Mockup: `docs/mockup/nazione-aggiungi.html` (A, B).

**Dove**: dialogo `Modal` «Nazioni del viaggio», aperto da «Gestisci le nazioni» (Panoramica, riga «Nazioni») e dal riquadro «Nazioni e cataloghi» delle Impostazioni.

**Contenuto del dialogo**:
- Elenco ordinato delle nazioni del viaggio (ordine di aggiunta; la prima è la proposta per le tappe libere, D4). Per riga: nome, badge di stato («sul dispositivo», «in download», «da scaricare»), riga «Catalogo versione N · pubblicato il … · N luoghi · valuta …», pulsante «Togli» (`.btn-small.danger`, `aria-label="Togli {nazione} dal viaggio"`).
- L'ultima nazione: niente pulsante, testo «È l'unica nazione del viaggio: non si può togliere.»
- Sezione «Aggiungi nazione»: `fieldset.place-q` con `place-opt` radio delle nazioni non ancora nel viaggio, pulsante «Aggiungi e scarica il catalogo». Nessuna disponibile: riquadro `.empty` «Non ci sono altre nazioni con un catalogo pubblicato.»
- Nota: «Il catalogo di ogni nazione resta nella versione caricata: non cambia da solo.»

**Aggiunta**: la riga compare subito con «in download»; a download riuscito, toast «{nazione} aggiunta al viaggio: catalogo versione N scaricato» con «Annulla» (solo finché nessun elemento la usa). Errore: badge «da scaricare», motivo e «Riprova» nella riga.

**Rimozione**: «Togli» sostituisce il contenuto del dialogo (stesso `Modal`, titolo «Togliere {nazione} dal viaggio?»).
- Nulla la usa: «Nessun elemento del viaggio usa questa nazione. Il suo catalogo viene tolto dal viaggio e da questo dispositivo.» Pulsanti «Togli la nazione» / «Annulla».
- Qualcosa la usa: elenco con conteggi e nomi delle tappe (tappe, idee, preferiti, attività pianificate, opzioni di crociera, voli con aeroporti della nazione); `RoutePreview` «Come diventa il percorso» con la frase di oggi sulle attività da ricollocare; testo su idee, preferiti, voli e crociere (vedi dubbio 1); `BookingConfirm` se le tappe tolte hanno elementi prenotati, pagati o già vissuti. Pulsanti «Togli la nazione e {n} tappe» (disabilitato finché la conferma serve e manca) / «Annulla» (torna all'elenco).
- Dopo: toast «{nazione} tolta dal viaggio» con «Annulla» che ripristina nazione e tappe (stesso meccanismo di `useApply` / `restorePlanOnly`).

**375 px**: dialogo a tutta larghezza meno 12 px; pulsanti vanno a capo (`row wrap`).

**Accessibilità**: focus iniziale sul primo controllo (comportamento di `Modal`); al passaggio a «Togliere…?» il focus va al titolo del dialogo; tornando con «Annulla» va al pulsante «Togli» della riga; badge con testo; stato del download in `role="status"` nella riga.

## 3. Dove si vedono nazioni e versione del catalogo

Mockup: `docs/mockup/nazione-aggiungi.html` (C).

| Dove | Cosa | Componente |
|---|---|---|
| Panoramica, sotto «Modifica date e partecipanti» | «Nazioni: Norvegia (catalogo versione 1) · Gestisci le nazioni». Con più nazioni solo i nomi: «Nazioni: Norvegia, Nazione di prova · Gestisci le nazioni» | `p.ov-sub` + `.link-btn` |
| Impostazioni, nuovo riquadro dopo «Preferenze» | «Nazioni e cataloghi»: per nazione versione, data, luoghi, valuta, fuso, badge «sul dispositivo» / «da scaricare»; pulsante «Gestisci le nazioni»; nota sul catalogo fisso | `.panel` + `.panel-head` + elenco |
| Catalogo dei luoghi, nota iniziale | «Catalogo Norvegia versione 1 (AAAA-MM-GG), 82 luoghi.» prima del testo di oggi. Con più nazioni: «Due cataloghi: …» | `.note-info` |
| Dialogo «Nazioni del viaggio» | come §2 | `Modal` |

**Versione più recente disponibile (segnaposto)**: solo in Impostazioni e nel dialogo, sotto la riga della nazione: badge `badge-tone-info` «versione N+1 disponibile» e testo «È uscita la versione N+1 del catalogo (AAAA-MM-GG). Il viaggio resta sulla versione N: l'aggiornamento arriverà con una prossima versione dell'app.» Nessun pulsante. Non in Panoramica, per non distrarre.

**375 px**: righe impilate (nome sopra, dati sotto, badge a capo). **Accessibilità**: elenco `ul`; il badge fa parte del testo della riga.

## 4. Nazione di una tappa fuori catalogo (D4)

Mockup: `docs/mockup/nazione-aggiungi.html` (D).

**Modulo «Luogo personalizzato»** (`StopPicker`, griglia `custom-place grid-3`):
- Più nazioni: quarto campo `Field` «Nazione» (`select` con le nazioni del viaggio, preselezionata la prima), nota «Serve per valuta e fuso orario della tappa.»
- Una nazione: testo fisso «Nazione: Norvegia», nessun campo.

**Testata della tappa** (`StopCard`, riga sotto il nome), solo con più nazioni:
- Tappa del catalogo: «{regione} · {nazione}».
- Luogo personalizzato: «Luogo personalizzato · {nazione}».
- Notte a bordo: «Pernottamento in nave · {nazione} (porto d'imbarco)»; senza porto: «Pernottamento in nave · nazione dal porto d'imbarco: scegli il porto».

**Dettagli della tappa** (blocco `details` di `StopCard`), solo luogo personalizzato e più nazioni: `Field` «Nazione della tappa», nota «Decide valuta proposta e fuso orario di questa tappa.» Tappa del catalogo e notte a bordo: non modificabile.

**375 px**: nel modulo latitudine e longitudine affiancate, nome e nazione a tutta larghezza. **Accessibilità**: `label` collegata, nota con `aria-describedby`.

## 5. Catalogo con più nazioni e budget con più valute

Mockup: `docs/mockup/catalogo-nazioni.html`.

**Catalogo completo** (`CatalogView`):
- Filtro `select` «Nazione» (`aria-label="Nazione"`) primo dopo la ricerca: «Tutte le nazioni» + nazioni del viaggio.
- Regioni con `optgroup` per nazione; scelta una nazione, solo le sue regioni (spec §5.4).
- Conteggio: «{n} risultati · Norvegia 82, Nazione di prova {n}».
- Con «Tutte le nazioni»: gruppi con intestazione `h3` «{nazione}» e a destra «catalogo versione N · N luoghi», nell'ordine del viaggio. Schede invariate; sottotitolo «{categoria} · {regione}».
- Una sola nazione: nessun filtro né gruppo.

**Pannello «Cosa fare»** (`AttractionsDrawer`): solo se i luoghi vicini alla tappa sono di più nazioni:
- `chips-field` «Nazione» con un chip per nazione, tutti attivi all'inizio.
- Conteggio in `role="status"`: «{n} luoghi ({n} in Norvegia, {n} in Nazione di prova)».
- Risultati raggruppati con `h4` «In {nazione}»; luogo di una nazione diversa da quella della tappa: «· oltre il confine» dopo la distanza in linea d'aria (testo di oggi invariato).
- «Azzera ricerca e filtri» azzera anche i chip della nazione.

**Budget** (`BudgetView`, `RatesPanel`):
- Totali, tetti e stime in euro come oggi. Frase nuova sopra i cambi: «Totali in euro, la valuta del viaggio.»
- Al posto della riga unica sul cambio NOK, un elenco «Cambi usati», una riga per valuta: «Importi in {valuta} convertiti a {cambio} {valuta} per 1 € ({fonte}, cambio del AAAA-MM-GG).» Valuta senza cambio: «Importi in {valuta}: cambio mancante. {n} voci non convertibili, escluse dal totale.» con link «Inserisci il cambio» (porta a Impostazioni › Cambio e carburante).
- Poi il testo di oggi: «Gli importi restano salvati nella valuta originale.»
- «Costi non ancora quantificati (esclusi dal totale)»: anche «{voce}: {importo} {valuta}, cambio da inserire».
- Voce di spesa (`.money`): menù valuta con EUR e le valute delle nazioni del viaggio; proposta quella della nazione della tappa o dell'elemento. Senza cambio, nota sotto l'importo: «Senza cambio: non entra nei totali.»
- Impostazioni › Cambio e carburante: un campo per valuta, «Cambio {valuta} per 1 EUR». Senza fonte automatica: «Nessuna fonte automatica per questa valuta: inseriscilo a mano.» Carburante di una nazione senza fonte: «Carburante in {nazione}: prezzo da inserire a mano. Non si usa il prezzo norvegese.»

**375 px**: filtri del catalogo su due colonne (ricerca e regione a tutta larghezza); pannello «Cosa fare» a tutto schermo come oggi. **Accessibilità**: conteggi in `role="status"`; chip con `focus-within` già in CSS; gruppi con titoli veri (`h3`/`h4`) per la navigazione per titoli.

Il configuratore (regioni raggruppate per nazione, spec §5.4) segue lo stesso schema `optgroup`/gruppi; il dettaglio resta allo sviluppatore.

## 6. Allegati del diario nel cloud (D5)

Mockup: `docs/mockup/allegati.html`.

**Modulo nuova voce** (`DiaryComposer`):
- `input type="file" multiple accept="image/*,application/pdf"`.
- Nota del campo: «Immagini o PDF, al massimo 10 MB per file. Si salvano subito qui e poi nel cloud.» (sostituisce «Restano solo su questo dispositivo»).
- Alla scelta: elenco dei file con dimensione. File rifiutati, in `role="alert"`, uno per riga: «{file} non allegato: sono ammessi solo immagini e PDF.» / «{file} non allegato: pesa {n} MB, il massimo è 10 MB.» I file validi restano.
- Toast dopo il salvataggio: «Voce salvata su questo dispositivo: gli allegati si caricano nel cloud». Errore di salvataggio locale: testo di oggi.

**Stato di ogni allegato** (`Attachment`, riga di `.diary-files`):

| Stato | Testo | Azione |
|---|---|---|
| Solo qui, in coda | badge info «solo su questo dispositivo» + «Si carica al ritorno della rete.» | — |
| In caricamento | rotella + «Caricamento nel cloud…» | — |
| Caricato | badge ok «✓ nel cloud» | anteprima o link come oggi |
| Errore di caricamento | «⚠ Caricamento non riuscito» + «{motivo}. Il file resta su questo dispositivo.» | «Riprova» (`.btn-small`) |
| Errore di salvataggio locale | testo di oggi «non salvato» | «Riprova» o «allega di nuovo il file» (oggi) |
| Altro dispositivo, nel cloud, non in cache | badge ok «✓ nel cloud» + «Si scarica quando lo apri, poi resta qui.» | «Apri» |
| Altro dispositivo, non ancora caricato | badge warn «non ancora caricato» + «È solo sul dispositivo che lo ha aggiunto: si caricherà da lì.» con nome e dimensione | — |
| Altro dispositivo, senza rete e non in cache | «Senza rete: non disponibile su questo dispositivo.» | — |

**Eliminazione voce** (oggi `window.confirm`): «Eliminare questa voce del diario? Vengono eliminati anche i suoi {n} allegati, da questo dispositivo e dal cloud.» Nel mockup è mostrata come `Modal` con «Elimina voce e allegati» / «Annulla»; va bene anche il `confirm` con lo stesso testo.

**Spazio usato**:
- Impostazioni, nuovo riquadro «Allegati del diario» dopo «Cosa funziona senza rete»: «Spazio usato nel cloud: {n} MB su 1 GB ({p}%)», `<meter>`, «Da caricare da questo dispositivo: {n} file, {n} MB. Ammessi immagini e PDF fino a 10 MB per file.»
- Oltre l'80% (819 MB su 1024): `note-warn` `role="alert"` (una volta per sessione) «Spazio quasi esaurito. Quando è pieno, i nuovi allegati non si caricano e restano su questo dispositivo.»
- Modalità viaggio › Altro, `DataStatusCard`: riga «Allegati: {n} MB su 1 GB · {n} da caricare»; oltre l'80% `note-warn` «Spazio per gli allegati quasi esaurito ({p}%).»

**Testi da aggiornare**:
- `OfflineInfo`: «Allegati del diario, che restano solo su questo dispositivo» → «Allegati del diario: si salvano qui e si caricano nel cloud al ritorno della rete».
- `LogoutDialog`: «Gli allegati del diario stanno solo sul dispositivo: uscendo vengono eliminati anche loro.» → solo se ci sono allegati non caricati: «{n} allegati ({n} MB) non sono ancora nel cloud: uscendo andrebbero persi. Il backup su file non li contiene: aspetta che si carichino.» + elenco dei nomi + casella «Ho capito: gli allegati non caricati vengono eliminati da questo dispositivo.» (stesso schema della casella attuale per le modifiche non inviate). Il backup JSON (`exportTripFile`) non contiene i file: il testo lo dice.

**375 px**: righe dell'allegato vanno a capo; «Riprova» sotto il testo. **Accessibilità**: un solo annuncio a fine invio («{n} allegati caricati nel cloud») in `role="status"`; ogni errore in `role="alert"`; `<meter>` con etichetta collegata; immagini con `alt` = nome del file (oggi).

## 7. Primo accesso da un dispositivo nuovo, migrazione, uso senza cloud (D1)

Mockup: `docs/mockup/primo-accesso.html`.

**Dove**: al posto del contenuto della Panoramica (o di «Oggi» in modalità viaggio); barra di navigazione e `SyncBadge` restano. Componente: `.panel` con elenco di passi (✓ fatto, rotella in corso, ○ da fare, ! errore).

**Senza accesso, nessuna copia sul dispositivo** (versione pubblicata, D1): «Accedi per iniziare» / «I viaggi sono salvati nel cloud: accedi per crearne uno o ritrovare il tuo.» Campi e pulsante uguali a `CloudPanel` («Email», «Password», «Accedi», «Accesso riservato agli account autorizzati.»). Senza rete: campi disabilitati e «Senza rete non è possibile accedere. Su questo dispositivo non c'è ancora nessun viaggio: torna qui quando c'è connessione.» Con una copia offline dello stesso utente la schermata non compare: si apre il viaggio, stato di oggi «Salvato qui · cloud non collegato».

**Preparazione** (spec §3, UC8): «Preparo questo dispositivo» / «Scarico i tuoi dati dal cloud e li tengo qui anche per l'uso senza rete.» Passi: «Preferenze e contesto di lavoro», «Viaggio «{titolo}»», «Catalogo {nazione}, versione N» (uno per nazione), «Allegati: si scaricano quando li apri». A fine: si apre la vista dell'ultimo contesto, toast «Viaggio pronto anche senza rete su questo dispositivo». Nessun viaggio nel cloud: §1.
- Errore: «Non sono riuscito a scaricare il viaggio. {motivo}» con «Riprova» e «Esci».
- Senza rete: «Il viaggio non è ancora su questo dispositivo e manca la rete. Riprovo da solo quando torna la connessione.»

**Viaggio solo locale al primo accesso**: toast «Questo viaggio era solo su questo dispositivo: lo carico nel cloud», poi i passi.

**Aggiornamento del formato** (UC5 punto 5, primo avvio con la nuova versione): «Aggiorno il formato dei dati» / «Prima invio le modifiche fatte qui, poi converto il viaggio. Nessun dato viene tolto: la copia precedente resta su questo dispositivo.» Passi: «Invio delle modifiche in attesa», «Conversione del viaggio al nuovo formato», «Catalogo Norvegia, versione 1».
- Coda presente e senza rete: «Ci sono modifiche fatte qui non ancora nel cloud. La conversione aspetta la rete per non perderle. Intanto puoi usare il viaggio: le modifiche restano in coda.» (come resta usabile il viaggio lo decide l'architetto-dati).
- Errore: «Conversione non riuscita: il viaggio resta com'era su questo dispositivo. {motivo}» con «Riprova» e «Esporta un backup».

**Senza cloud** (D1, solo sviluppo e test): fascia `note-info` in cima a ogni vista «Modalità di prova: catalogo di prova da file, i dati restano solo in questo browser.» Nella versione pubblicata il riquadro «Salvataggio cloud · non configurato» non compare (configurazione da `.env`).

**375 px**: pannello a tutta larghezza, pulsanti a capo. **Accessibilità**: elenco dei passi con `aria-live="polite"` (si annuncia solo il passo concluso, con testo nascosto «: fatto»); errore `role="alert"`; a fine preparazione il focus va al titolo della vista aperta.

## 8. Modalità pianificazione/viaggio per utente e dispositivo (D2)

**Dove**: Impostazioni › Preferenze, campo esistente «Modalità su questo dispositivo». Etichetta e opzioni invariate. Nota: «Non dipende da date o posizione» → «Salvata per il tuo account su questo dispositivo: gli altri dispositivi hanno la loro.» Dispositivo nuovo: «Automatica (dalla larghezza dello schermo)», come oggi. Nessun'altra modifica. Mockup in `primo-accesso.html` (D).

## 9. Tabella dei testi nuovi

`{…}` = valore variabile. «Sostituisce» indica un testo di oggi che cambia.

| # | Dove | Tipo | Testo |
|---|---|---|---|
| 1 | Panoramica, viaggio vuoto | titolo | In quale nazione viaggiate? |
| 1 | Panoramica | testo | Scegli la prima nazione: l'app scarica il suo catalogo dei luoghi e lo tiene anche senza rete. Altre nazioni si aggiungono dopo. |
| 1 | Panoramica | legenda nascosta | Nazioni disponibili |
| 1 | Scheda nazione | testo | Catalogo versione {N} · pubblicato il {AAAA-MM-GG} |
| 1 | Scheda nazione | testo | {n} luoghi · valuta {XXX} |
| 1 | Panoramica | bottone | Continua con {nazione} |
| 1 | Panoramica | bottone disabilitato | Scegli una nazione |
| 1 | Panoramica | nota | Il catalogo resta quello di questa versione per tutto il viaggio, anche se in seguito ne esce una nuova. |
| 1 | Panoramica | stato | Carico le nazioni disponibili… |
| 1 | Panoramica | stato | Scarico il catalogo della {nazione} (versione {N})… |
| 1 | Panoramica | nota | La nazione è già salvata nel viaggio: se chiudi la pagina, il download riparte alla prossima apertura. |
| 1 | Panoramica | etichetta barra | Download del catalogo della {nazione} |
| 1 | Panoramica | stato | Catalogo della {nazione} scaricato: versione {N}, {n} luoghi. |
| 1 | Panoramica | errore | Il catalogo della {nazione} non è stato scaricato. {motivo} |
| 1 | Panoramica | errore | La nazione resta scelta nel viaggio. Puoi riprovare subito. |
| 1 | Panoramica | bottone | Riprova |
| 1 | Panoramica | bottone | Scegli un'altra nazione |
| 1 | Panoramica | stato | Senza rete non posso mostrare le nazioni disponibili. |
| 1 | Panoramica | stato | Riprovo da solo quando torna la connessione. |
| 1 | Panoramica | errore | Download interrotto: manca la rete. |
| 1 | Panoramica | stato | Il catalogo della {nazione} riparte da solo al ritorno della connessione. |
| 1 | Panoramica, titolo predefinito | titolo | Nuovo viaggio (vedi dubbio 3) |
| 1 | Impostazioni, «Nuovo viaggio vuoto» | conferma (sostituisce) | Creare un nuovo viaggio? Quello attuale resta nel cloud e lo riapri da «Viaggi salvati nel cloud». |
| 2 | Dialogo | titolo | Nazioni del viaggio |
| 2 | Dialogo | etichetta elenco | Nazioni nel viaggio |
| 2 | Dialogo | badge | sul dispositivo / in download / da scaricare |
| 2 | Dialogo | bottone | Togli |
| 2 | Dialogo | etichetta | Togli {nazione} dal viaggio |
| 2 | Dialogo | testo | È l'unica nazione del viaggio: non si può togliere. |
| 2 | Dialogo | sottotitolo / legenda | Aggiungi nazione |
| 2 | Dialogo | bottone | Aggiungi e scarica il catalogo |
| 2 | Dialogo | vuoto | Non ci sono altre nazioni con un catalogo pubblicato. |
| 2 | Dialogo | nota | Il catalogo di ogni nazione resta nella versione caricata: non cambia da solo. |
| 2 | Dialogo, riga | stato | Scarico il catalogo… |
| 2 | Toast | conferma | {nazione} aggiunta al viaggio: catalogo versione {N} scaricato |
| 2 | Toast | bottone | Annulla |
| 2 | Rimozione | titolo | Togliere {nazione} dal viaggio? |
| 2 | Rimozione | testo | Nessun elemento del viaggio usa questa nazione. Il suo catalogo viene tolto dal viaggio e da questo dispositivo. |
| 2 | Rimozione | testo | Questi elementi del viaggio usano la {nazione}: |
| 2 | Rimozione | voci | {n} tappe: {nome} ({n} notti), … · {n} idee e {n} preferiti del suo catalogo · {n} attività pianificate · {n} opzioni di crociera · {n} voli con aeroporto in questa nazione |
| 2 | Rimozione | testo | Idee e preferiti di questa nazione restano salvati ma non si vedono finché non la aggiungi di nuovo. Voli e crociere restano in Prenotazioni: controllali tu. |
| 2 | Rimozione | bottone | Togli la nazione |
| 2 | Rimozione | bottone | Togli la nazione e {n} tappe |
| 2 | Rimozione | bottone | Annulla |
| 2 | Toast | conferma | {nazione} tolta dal viaggio |
| 3 | Panoramica | testo | Nazioni: {nazione} (catalogo versione {N}) · Nazioni: {nazione}, {nazione} |
| 3 | Panoramica | link | Gestisci le nazioni |
| 3 | Impostazioni | titolo | Nazioni e cataloghi |
| 3 | Impostazioni | bottone | Gestisci le nazioni |
| 3 | Impostazioni | testo | Catalogo versione {N} · pubblicato il {AAAA-MM-GG} · {n} luoghi · valuta {XXX} · fuso {IANA} |
| 3 | Impostazioni | nota | Il catalogo caricato nel viaggio non cambia da solo: resta questa versione anche se ne esce una più recente. |
| 3 | Impostazioni, dialogo | badge | versione {N+1} disponibile |
| 3 | Impostazioni, dialogo | testo | È uscita la versione {N+1} del catalogo ({AAAA-MM-GG}). Il viaggio resta sulla versione {N}: l'aggiornamento arriverà con una prossima versione dell'app. |
| 3 | Catalogo | nota (prefisso) | Catalogo {nazione} versione {N} ({AAAA-MM-GG}), {n} luoghi. |
| 3 | Catalogo | nota (più nazioni) | Due cataloghi: {nazione} versione {N} ({data}), {nazione} versione {N} ({data}). |
| 4 | Luogo personalizzato | etichetta | Nazione |
| 4 | Luogo personalizzato | nota | Serve per valuta e fuso orario della tappa. |
| 4 | Luogo personalizzato | testo | Nazione: {nazione} |
| 4 | Testata tappa | testo | {regione} · {nazione} / Luogo personalizzato · {nazione} |
| 4 | Testata tappa | testo | Pernottamento in nave · {nazione} (porto d'imbarco) |
| 4 | Testata tappa | testo | Pernottamento in nave · nazione dal porto d'imbarco: scegli il porto |
| 4 | Dettagli tappa | etichetta | Nazione della tappa |
| 4 | Dettagli tappa | nota | Decide valuta proposta e fuso orario di questa tappa. |
| 5 | Catalogo | etichetta filtro | Nazione |
| 5 | Catalogo | opzione | Tutte le nazioni |
| 5 | Catalogo | stato | {n} risultati · {nazione} {n}, {nazione} {n} |
| 5 | Catalogo | intestazione gruppo | {nazione} · catalogo versione {N} · {n} luoghi |
| 5 | Cosa fare | legenda | Nazione |
| 5 | Cosa fare | stato | {n} luoghi ({n} in {nazione}, {n} in {nazione}) |
| 5 | Cosa fare | intestazione | In {nazione} |
| 5 | Cosa fare | testo | oltre il confine |
| 5 | Budget | testo | Totali in euro, la valuta del viaggio. |
| 5 | Budget | etichetta elenco | Cambi usati |
| 5 | Budget | testo (sostituisce la riga NOK) | Importi in {valuta} convertiti a {cambio} {valuta} per 1 € ({fonte}, cambio del {AAAA-MM-GG}). |
| 5 | Budget | avviso | Importi in {valuta}: cambio mancante. {n} voci non convertibili, escluse dal totale. |
| 5 | Budget | link | Inserisci il cambio |
| 5 | Budget, costi esclusi | voce | {voce}: {importo} {valuta}, cambio da inserire |
| 5 | Voce di spesa | nota | Senza cambio: non entra nei totali. |
| 5 | Cambio e carburante | etichetta | Cambio {valuta} per 1 EUR |
| 5 | Cambio e carburante | nota | Nessuna fonte automatica per questa valuta: inseriscilo a mano. |
| 5 | Cambio e carburante | testo | Carburante in {nazione}: prezzo da inserire a mano. Non si usa il prezzo norvegese. |
| 6 | Diario | nota del campo (sostituisce) | Immagini o PDF, al massimo 10 MB per file. Si salvano subito qui e poi nel cloud. |
| 6 | Diario | etichetta elenco | File scelti |
| 6 | Diario | errore | {file} non allegato: sono ammessi solo immagini e PDF. |
| 6 | Diario | errore | {file} non allegato: pesa {n} MB, il massimo è 10 MB. |
| 6 | Toast | conferma (sostituisce) | Voce salvata su questo dispositivo: gli allegati si caricano nel cloud |
| 6 | Allegato | badge | solo su questo dispositivo / ✓ nel cloud / non ancora caricato |
| 6 | Allegato | stato | Si carica al ritorno della rete. |
| 6 | Allegato | stato | Caricamento nel cloud… |
| 6 | Allegato | errore | ⚠ Caricamento non riuscito · {motivo}. Il file resta su questo dispositivo. |
| 6 | Allegato | bottone | Riprova |
| 6 | Allegato | stato | Si scarica quando lo apri, poi resta qui. |
| 6 | Allegato | bottone | Apri |
| 6 | Allegato | stato | È solo sul dispositivo che lo ha aggiunto: si caricherà da lì. |
| 6 | Allegato | stato | Senza rete: non disponibile su questo dispositivo. |
| 6 | Diario | annuncio | {n} allegati caricati nel cloud |
| 6 | Eliminazione | conferma (sostituisce) | Eliminare questa voce del diario? Vengono eliminati anche i suoi {n} allegati, da questo dispositivo e dal cloud. |
| 6 | Eliminazione | bottone | Elimina voce e allegati |
| 6 | Impostazioni | titolo | Allegati del diario |
| 6 | Impostazioni | testo | Spazio usato nel cloud: {n} MB su 1 GB ({p}%) |
| 6 | Impostazioni | testo | Da caricare da questo dispositivo: {n} file, {n} MB. Ammessi immagini e PDF fino a 10 MB per file. |
| 6 | Impostazioni | avviso | Spazio quasi esaurito. Quando è pieno, i nuovi allegati non si caricano e restano su questo dispositivo. |
| 6 | Altro › I tuoi dati | testo | Allegati: {n} MB su 1 GB · {n} da caricare |
| 6 | Altro › I tuoi dati | avviso | Spazio per gli allegati quasi esaurito ({p}%). |
| 6 | OfflineInfo | voce (sostituisce) | Allegati del diario: si salvano qui e si caricano nel cloud al ritorno della rete |
| 6 | Esci dall'account | avviso (sostituisce) | {n} allegati ({n} MB) non sono ancora nel cloud: uscendo andrebbero persi. Il backup su file non li contiene: aspetta che si carichino. |
| 6 | Esci dall'account | casella | Ho capito: gli allegati non caricati vengono eliminati da questo dispositivo. |
| 7 | Primo accesso | titolo | Accedi per iniziare |
| 7 | Primo accesso | testo | I viaggi sono salvati nel cloud: accedi per crearne uno o ritrovare il tuo. |
| 7 | Primo accesso | stato | Senza rete non è possibile accedere. Su questo dispositivo non c'è ancora nessun viaggio: torna qui quando c'è connessione. |
| 7 | Preparazione | titolo | Preparo questo dispositivo |
| 7 | Preparazione | testo | Scarico i tuoi dati dal cloud e li tengo qui anche per l'uso senza rete. |
| 7 | Preparazione | passi | Preferenze e contesto di lavoro · Viaggio «{titolo}» · Catalogo {nazione}, versione {N} · Allegati: si scaricano quando li apri |
| 7 | Preparazione | testo nascosto | : fatto |
| 7 | Preparazione | toast | Viaggio pronto anche senza rete su questo dispositivo |
| 7 | Preparazione | errore | Non sono riuscito a scaricare il viaggio. {motivo} |
| 7 | Preparazione | bottoni | Riprova · Esci |
| 7 | Preparazione | stato | Il viaggio non è ancora su questo dispositivo e manca la rete. Riprovo da solo quando torna la connessione. |
| 7 | Primo accesso | toast | Questo viaggio era solo su questo dispositivo: lo carico nel cloud |
| 7 | Formato | titolo | Aggiorno il formato dei dati |
| 7 | Formato | testo | Prima invio le modifiche fatte qui, poi converto il viaggio. Nessun dato viene tolto: la copia precedente resta su questo dispositivo. |
| 7 | Formato | passi | Invio delle modifiche in attesa · Conversione del viaggio al nuovo formato · Catalogo {nazione}, versione {N} |
| 7 | Formato | stato | Ci sono modifiche fatte qui non ancora nel cloud. La conversione aspetta la rete per non perderle. Intanto puoi usare il viaggio: le modifiche restano in coda. |
| 7 | Formato | errore | Conversione non riuscita: il viaggio resta com'era su questo dispositivo. {motivo} |
| 7 | Formato | bottoni | Riprova · Esporta un backup |
| 7 | Tutte le viste (sviluppo) | fascia | Modalità di prova: catalogo di prova da file, i dati restano solo in questo browser. |
| 8 | Impostazioni › Preferenze | nota (sostituisce) | Salvata per il tuo account su questo dispositivo: gli altri dispositivi hanno la loro. |

## 10. Dubbi per Filippo

**Risposte (2026-11-06): Filippo ha approvato il design e le tre proposte qui sotto così come sono scritte.**

1. **Idee, preferiti, voli e crociere quando si toglie una nazione.** La spec (UC3, D3) dice cosa fare delle tappe, non del resto. Proposta: idee e preferiti restano salvati e nascosti (ricompaiono se la nazione torna); attività pianificate seguono la regola delle tappe tolte (da ricollocare); voli e crociere restano in Prenotazioni, senza modifiche. Nulla si cancella.
2. **Che cosa conta lo «spazio usato».** Il limite di 1 GB è del progetto Supabase, non del singolo utente. Proposta: mostrare la somma degli allegati dell'utente su 1 GB (oggi c'è un solo account di famiglia); se in futuro gli account saranno più di uno, l'architetto-dati fornisce il totale del bucket.
3. **Titolo predefinito di un viaggio nuovo.** Oggi `defaults.ts` e la testata usano «Norvegia, agosto 2027» / «Norvegia 2027». Proposta: viaggio nuovo con titolo «Nuovo viaggio», poi «{nazione} {anno}» quando l'utente inserisce la data; i viaggi esistenti restano invariati.
