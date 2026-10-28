# Stato del progetto — 27 ottobre 2026

Ultimo audit: [AUDIT-2026-10-27.md](AUDIT-2026-10-27.md) (22 problemi, 18 risolti).

## Punto di partenza

Non esisteva un repository: il progetto è stato creato da zero con lo stack indicato in CLAUDE.md (React, TypeScript rigoroso, Vite, Leaflet, Supabase con RLS).
Differenze motivate rispetto allo stack di riferimento:

- **React Router** non usato: 7 sezioni gestite con routing via hash (`#/itinerario`, ...). Sostituibile quando serviranno URL più ricchi.
- **Leaflet** caricato da CDN invece che via npm, isolato in `src/services/map/leaflet.ts`.
- **Supabase** usato via REST (Auth + PostgREST) senza `@supabase/supabase-js`, in `src/services/storage/supabase.ts`.

## Confronto con gli obiettivi

| Obiettivo (CLAUDE.md §2) | Stato | Note |
|---|---|---|
| 1. Catalogo destinazioni | Parziale | 77 schede in 11 categorie; 67 coordinate verificate su OpenStreetMap con link. Schede a fisarmonica: 71 con foto Wikimedia Commons (autore e licenza letti al momento) e introduzione Wikipedia (CC BY-SA) caricata all'apertura; 6 senza foto (raumabanen, haukland, bodo-moskenes, aurora, midnight-sun, più una voce Wikidata senza immagine → segnaposto con icona). Durate, stagionalità e link ufficiali da verificare; mancano ~23 schede |
| 2. Mappa interattiva | Fatto | Da verificare a occhio sul PC (nel test automatico la CDN era bloccata) |
| 3. Selezione e riordino tappe | Fatto | Riordino con frecce (niente drag & drop) |
| 4. Itinerario giorno per giorno | Fatto | Giornate legate alle tappe (non al numero del giorno), carico giornaliero, proposte di alleggerimento con Annulla |
| 5. Distanze e tempi stradali | Fatto | Tempi teorici e realistici separati.  OSRM verificato dal vivo il 27/10/2026 (Bergen→Flåm 167 km, 2 h 51) |
| 6. Traghetti, treni, nave | Fatto (base) | Traghetti rilevati da OSRM (verificato: Linge–Eidsdal su Ålesund→Geiranger); orari e costi manuali |
| 7. Ricerca hytte | Parziale | OSM + link esterni. Nessuna API con prezzi/disponibilità |
| 8. Confronto Hurtigruten/Havila | Fatto (base) | Fatti e regole verificati; prezzi 2027 da inserire a mano |
| 9. Budget famiglia | Fatto | Stati per ogni voce, nessun doppio conteggio |
| 10. Salvataggio online | Fatto e verificato | 27/10/2026: account confermato, viaggio salvato nel cloud e associato al proprietario |

## Verifiche eseguite

- **TypeScript strict** (`strict`, `noUncheckedIndexedAccess`, `noUnused*`): nessun errore. Eseguito con tipi React semplificati perché npm non era raggiungibile; con `npm install` va rieseguito `npm run typecheck` con i tipi ufficiali.
- **Test**: 14/14 superati (giornate e date, riuso dei tratti al riordino, separazione km strada/traghetto, avvisi, rotta costiera e direzioni, budget con NOK e alternative escluse, costiera non contata due volte, parsing OSRM con traghetti, ricalcolo che conserva i dati manuali, import non valido, parsing Overpass, link di ricerca).
- **Build**: bundle di produzione generato con esbuild (305 KB, file unico). La build con Vite non è stata eseguita.
- **Test nel browser** (Chromium headless, 20 controlli superati): aggiunta e riordino tappe, calcolo tratti, giornate, costiera, hytte, budget (1.098 € atteso e ottenuto), persistenza dopo ricarica, nessuno scroll orizzontale a 390 px, errore del routing mostrato, mappa non disponibile gestita, nessun errore JavaScript.
- **Servizi reali** (dal PC di Filippo, 27/10/2026): OSRM risponde con CORS e riconosce i traghetti; CDN di Leaflet raggiungibile; Overpass in errore 502 e mirror in timeout → se Overpass non risponde entro 12 s la ricerca hytte passa a Nominatim (stessi dati OSM, elenco forse meno completo, indicato nella pagina); provata su Bergen: 16 strutture in 7 s.
- **ESLint**: configurato ma non eseguito (pacchetti non installabili qui).

## Database (27/10/2026)

- Progetto Supabase `norway-planner` (ref `zsbfcriekrguiugbqdhi`, eu-central-1, piano Free) creato con autorizzazione di Filippo.
- Migrazione `create_trips` applicata: tabella `trips`, trigger `updated_at`, 4 policy RLS per proprietario.
- Verifiche dal PC di Filippo: lettura anonima → lista vuota; scrittura anonima → rifiutata dalla RLS (401); endpoint di login attivo; registrazione aperta con conferma email obbligatoria.
- Registrazioni chiuse: un trigger su `auth.users` accetta solo le email in `private.allowed_emails` (oggi solo l'account di Filippo). Verificato: registrazione di un indirizzo estraneo rifiutata. Pulsante "Registrati" rimosso dall'app.
- Prova reale: 1 account con email confermata, 1 viaggio salvato con proprietario corretto.
- Advisor di sicurezza Supabase: nessun problema. Prestazioni: solo "indice non ancora usato" (normale su tabella vuota).

## Salvataggio automatico (27/10/2026)

- Ogni modifica: salvata subito sul dispositivo e nel cloud dopo ~2,5 s, con aggiornamento condizionato (`updated_at` atteso) che impedisce di sovrascrivere modifiche fatte altrove.
- All'apertura, al ritorno in primo piano e al ritorno della rete: scarica le modifiche degli altri dispositivi se qui non ci sono modifiche pendenti; altrimenti mostra la scelta "Tieni questa versione / Usa la versione del cloud".
- Offline: le modifiche restano segnate come da inviare (anche dopo chiusura) e partono alla prima occasione; nuovo tentativo ogni 30 s.
- Dispositivo nuovo con viaggio vuoto: apre automaticamente il viaggio più recente del cloud.
- Verificato con test nel browser su server simulato (13 controlli: primo invio, salvataggio automatico, download da altro dispositivo, conflitto senza sovrascrittura, scelta della versione, offline e invio dopo ricarica).
- Mappa: aprendo il file con doppio clic OSM blocca i tile (nessun Referer) e CARTO ora richiede una chiave; in quel caso si usa Esri World Topo, altrimenti OSM. Verificato dal PC di Filippo.

## Limiti noti

1. Catalogo e coordinate non verificati: non usarli come dati definitivi.
2. I tempi OSRM sono teorici (senza soste, lavori, code ai traghetti).
3. Le notti a bordo hanno una posizione indicativa sulla mappa.
4. Il cloud salva il viaggio come documento JSON unico (tabelle normalizzate previste in M6).
5. Ricerca hytte senza prezzi né disponibilità: vanno verificati sul sito del fornitore.
6. Le date sono provvisorie (1 agosto 2027) finché non vengono decise.

## Configurazioni ancora necessarie

- Impostare in Supabase (Authentication → URL Configuration) l'indirizzo definitivo dell'app quando sarà pubblicata, così il link di conferma email non punta a localhost.
- Eventuale chiave di un provider di routing con limiti più alti, se OSRM pubblico non basta.
- Repository GitHub per versionare il codice.

## Pubblicazione (27/10/2026)

- Vercel, team "CaramiaHub", progetto `norvegia-2027` collegato al repository: ogni push su `main` pubblica in automatico.
- Prima build reale riuscita: `tsc` con i tipi React ufficiali senza errori, `vite build` 368 KB JS (117 KB gzip).
- Prova sul sito pubblicato dal PC di Filippo: mappa OpenStreetMap caricata, calcolo reale Bergen→Ålesund 419 km con 2 traghetti, Ålesund→Geiranger 105 km con 1 traghetto.
- Protezione Vercel attiva su tutti gli indirizzi *.vercel.app: serve il login Vercel per aprire l'app.

## Confronto scenari

Sezione Scenari: auto e hytte, auto con traghetti e navigazione, misto con treni; confronto di durata, costi, km, trasferimenti, notti, cambi di alloggio e dati da verificare.

## Prossime milestone

1. **Catalogo (M2)**: portare a ~100 schede, verificare coordinate e periodi su fonti ufficiali (visitnorway.com, siti delle attrazioni), aggiungere link ufficiali e data di verifica (foto e testi liberi già presenti).
2. **Itinerario (M3–M4)**: drag & drop, notti a bordo agganciate ai porti, orari traghetti principali (es. Bodø–Moskenes, Hellesylt–Geiranger), controllo stagionalità delle strade di montagna.
3. **Costiera e hytte (M5)**: piano di navigazione 2027 appena pubblicato (Havila prenotabile ~6 mesi prima), auto a bordo, preventivi reali.
4. **Persistenza (M6)**: tabelle normalizzate, salvataggio cloud automatico, accesso condiviso per entrambi i genitori.
5. **Verifica finale (M7)**: test su smartphone reali, deploy (es. Vercel) solo dopo autorizzazione.

- Sezione "Costiera" rinominata "Crociere" (il vecchio indirizzo #/costiera continua a funzionare). Le foto delle hytte (anteprima dal sito) sono state provate e poi tolte su richiesta: davano soprattutto loghi o nulla.

## 27/10/2026 sera — configuratore, budget, cambio e carburante

- **Configuratore** (nuova sezione): giorni, primo giorno, aeroporti di arrivo e ripartenza, tipo di viaggio (auto e hytte / con navigazione costiera / misto con treni), ritmo (3, 2 o 1 notte minima per tappa), ore massime di guida, regioni, destinazioni da includere (preferiti), esclusione delle attività poco adatte ai piccoli. Propone basi per dormire (17 località del catalogo), visite in giornata entro ~75 km, notti distribuite, tappe intermedie per i tratti lunghi, notti a bordo per i tratti costieri lunghi (scenario con nave) e treni Oslo–Bergen/Flåm (scenario misto). Crea sempre uno **scenario nuovo** e lo rende attivo (quello precedente resta in Scenari), poi calcola i tratti con OSRM. Distanze usate per l'ordine: stime (linea d'aria × 1,7, 52 km/h, tarate su Bergen–Ålesund: 419 km e 8 h 37 calcolati). Nessun prezzo o orario inventato; navi e treni restano «da verificare». Provato dal vivo: 18 giorni da Bergen, 7 tratti calcolati in circa 7 s.
- **Budget**: tetto complessivo e per categoria (barra rossa e importo superato); stime da parametri dell'utente (alloggio a notte, pasti al giorno, attività al giorno, noleggio al giorno, % imprevisti) che compaiono come «Stimato» solo dove mancano dati reali.
- **Cambio EUR/NOK**: aggiornato in automatico all'apertura (al massimo ogni 6 ore) da Norges Bank, riserva BCE via Frankfurter; si può fissare a mano. Valore del 27/10/2026: 10,3885 (il vecchio valore iniziale 11,8 era una stima errata).
- **Carburante**: tipo (benzina, diesel, elettrica), consumo e prezzo. Per benzina e diesel il prezzo è la media nazionale mensile di Statistics Norway (tabella 09654), aggiornata in automatico; per l'elettrica il prezzo per kWh si inserisce a mano. Ultimo dato al 27/10/2026: settembre 2026, benzina 26,18 NOK/l, diesel 27,52 NOK/l (agosto: 19,42 e 21,48: aumento forte, dato ufficiale SSB).
- **Mappa dell'itinerario** più alta (quasi tutto lo schermo), adatta alla forma della Norvegia.
- **Foto delle hytte** tolte su richiesta.

## 27/10/2026 — siti ufficiali e mezzi a scelta libera

- **Siti ufficiali** (`src/data/officialSites.ts`): 24 attrazioni (tutti i musei e gli acquari, i parchi, Flåmsbana e Raumabanen, le strade turistiche nazionali, Trolltunga, Vøringsfossen, Lofoten). Fonte: Wikidata P856 e, dove mancava, il sito del gestore (Vy, Norway's Best, Museum Nord) o dell'ente (Nasjonale turistveger, Visit Norway). Ogni link aperto il 27/10/2026 con risposta 200 e titolo coerente. Esclusi i siti dei comuni. Il link compare nella scheda del catalogo, nelle attività delle Giornate e nella proposta del configuratore. Ancora senza link ufficiale verificato: Preikestolen, Dalsnibba, ghiacciai, Saltstraumen, safari delle balene, Capo Nord, Bergensbanen.
- **Configuratore, mezzi a scelta libera**: auto (con i traghetti locali), nave costiera, treno, autobus, volo interno, in qualsiasi combinazione. Treno solo dove c'è una linea tra due località base (Bergensbanen, Flåmsbana, Dovrebanen, Rørosbanen, Sørlandsbanen); volo per i tratti oltre il doppio del massimo di guida tra due aeroporti del catalogo entro ~110 km; senza auto i tratti restano «mezzi pubblici da verificare». Tutti i segmenti non stradali sono «da verificare».
- **Mappa delle regioni nel configuratore**: confini delle 15 contee (Kartverket, API kommuneinfo, scaricati il 27/10/2026 e semplificati) raggruppati nelle 7 regioni dell'app; clic sulla mappa o nell'elenco per sceglierle; per ogni regione: contee, numero di mete, località dove dormire, mete per bambini; aeroporti scelti con ✈. Test: tutte le 67 destinazioni con posizione verificata cadono nella regione giusta.


## 28/10/2026 — redesign UX, fase 1 (branch `feature/ux-dashboard-planner`, non pubblicato)

- **Panoramica** (nuova sezione iniziale, `#/panoramica`): periodo e durata, notti assegnate, stato dei 6 passaggi (tappe, collegamenti, alloggi scelti, alloggi prenotati, budget, date), prossime azioni ordinate per priorità, budget diviso in certo / stimato / da verificare con i costi non quantificati, tratti da calcolare, traversate da verificare, alloggi per tappa, giornate impegnative. Tutto derivato dal viaggio (`src/domain/overview.ts`, testato); se un dato manca compare «Da definire».
- **Navigazione** raggruppata (Viaggio · Pianifica · Logistica · Decidi · Impostazioni); «Hytte» si chiama ora «Alloggi» (stesso indirizzo `#/hytte`). Su smartphone la barra sta in basso e la voce attiva resta visibile.
- **Itinerario**: date di arrivo e partenza e stato dell'alloggio su ogni tappa; componenti del tratto separate (strada, traghetto, nave…) con km, durata, «calcolato» o «inserito a mano» e orario da verificare; il filo tra le tappe è tratteggiato se il tratto non è calcolato. Clic sul numero della tappa → la mappa la centra; clic sul segnaposto → la scheda si evidenzia.
- **Giornate**: riga del pernottamento con alloggio e stato; per le giornate piene o troppo cariche l'elenco dei fattori (trasferimento oltre soglia, numero di attività, cambio di alloggio, tratti non calcolati, traversate da verificare, attività senza durata). Nessuna modifica applicata da sola.
- **Budget**: indicatore «Costi non quantificati» (un prezzo mancante non è zero).
- Verifiche: typecheck ok, 52/52 test, build ok, prova nel browser a 1360 e 390 px (10 sezioni, nessuno scroll orizzontale, nessun errore in console). Lint: 2 errori già presenti su `main` in `ConfiguratorView.tsx` (non toccato). Test Playwright di `verify/e2e` non eseguiti (Playwright non installato; `build-local.mjs` usa un percorso dell'ambiente originale).

## 28/10/2026 — redesign UX, fase 2 (stesso branch, commit `0e18d2e`, non pubblicato)

- **Tratti**: ogni collegamento indica le due tappe numerate, il giorno, l'origine del dato (✓ calcolato con OSRM, ✎ inserito a mano, misto, ❔ da calcolare), guida e traversate separate. Il totale teorico e quello realistico compaiono solo se tutti i segmenti hanno la durata; altrimenti «totale non calcolabile» con il numero di segmenti mancanti (`legSummary` in `src/domain/itinerary.ts`). Treni, bus e aerei con stato non confermato sono «orario da verificare» come traghetti e navi.
- **Mappa**: i tooltip dei tratti indicano le tappe collegate e se il tracciato è calcolato; i tratti della tappa selezionata sono più spessi; la scheda selezionata dice «◉ sulla mappa» (non solo colore). Bus e aereo in legenda solo se presenti.
- **Giornate**: riquadro «Perché è piena / troppo carica / richiede attenzione» con un suggerimento di verifica o riduzione per ogni fattore e le proposte della giornata (applicate solo con «Applica», annullabili). Soglie usate: `maxTravelMinPerDay` del viaggio (predefinita 4 h) e metà del tempo attivo per le visite, documentate in `loadFactors`.
- **Panoramica**: «Prossimo passo» in evidenza; periodo «ipotizzato» o «✓ date confermate»; due colonne (azioni, alloggi, giornate | budget, trasferimenti e orari da verificare).
- Verifiche: typecheck ok, 57/57 test, build ok, lint con i soli 2 errori preesistenti di `ConfiguratorView.tsx`; browser a 1360 e 390 px (nessuno scroll orizzontale, focus da tastiera visibile). Playwright non installato: `verify/e2e` non eseguiti.

## 28/10/2026 — redesign UX, fase 3: scenari, alloggi, budget, decisioni (stesso branch, commit `0e18d2e`, non pubblicato)

- **Scenari**: ogni scheda mostra durata, notti, cambi di alloggio, km, trasferimenti, traghetti/costiera/treni, costo delle voci quantificate («parziale» o «completo»), costo al giorno solo se il totale non è parziale, costi senza importo, osservazioni per la famiglia (fatti misurati, nessun punteggio) e cosa serve per completare il confronto. Livello di completezza: vuoto, insufficiente, parziale, completo. Nella tabella «✓ migliore» compare solo se la riga è confrontabile (`comparability` in `src/domain/scenarios.ts`): km e tempi richiedono tutti i tratti calcolati, i costi richiedono totali non parziali, il costo totale anche la stessa durata. Su smartphone la tabella lascia il posto alle schede. Confrontare non modifica l'itinerario attivo.
- **Alloggi**: nuovo «Confronto per tappa» (`src/domain/lodging.ts`): per ogni tappa con notti le sistemazioni candidate, con totale soggiorno (stesse regole del budget), prezzo per notte e valuta, stato del prezzo, differenza rispetto alla scelta, posti rispetto alla famiglia, distanza in linea d'aria, fonte e data, informazioni mancanti. Stato della decisione derivato dai campi esistenti (nessun campo nuovo): da verificare (individuata), valutata (disponibile/opzionata), scelta non prenotata, prenotata; «da cercare» se la tappa non ha candidate. «Scegli per questa tappa» solo su clic, con Annulla; nessuna scelta automatica e nessun ordinamento per prezzo.
- **Budget**: «Totale parziale (voci con importo)» quando mancano importi o categorie; stimato e da verificare separati; costi senza importo; media giornaliera segnata come parziale; riferimento del cambio NOK/EUR. Possibili doppi conteggi (`budgetOverlaps`): categoria con voci manuali e importi derivati da altre sezioni → solo avviso, nessun importo corretto.
- **Panoramica**: 7 decisioni in ordine indicativo (periodo, tappe e notti, trasporti, alloggi, costi, orari e disponibilità, prenotazioni) con «Dipende da» non bloccante; nuove azioni: verifica disponibilità degli alloggi scelti ma non verificati; alloggi prenotati con date ancora provvisorie. Azioni ordinate per priorità mantenendo l'ordine logico.
- Verifiche: typecheck ok, 65/65 test, build ok, lint con i soli 2 errori preesistenti di `ConfiguratorView.tsx`; browser a 1360 e 390 px su tutte le sezioni (nessuno scroll orizzontale). Playwright non installato: `verify/e2e` non eseguiti.
- Limiti: il modello non ha campi per «capienza adulti/bambini», «data di verifica del prezzo» distinta dalla fonte o per segnare che un costo manuale include un segmento: per questo i doppi conteggi sono solo segnalati. Le osservazioni per la famiglia non pesano comfort o qualità.

## 28/10/2026 — audit integrato fasi 1–3 (stesso branch, dopo `0e18d2e`, non pubblicato)

- Corretto: treni, bus e aerei con orario non confermato ora contano come «da verificare» anche nell'avviso dell'Itinerario e negli scenari (prima solo traghetti e navi; schede, giornate e panoramica li contavano già).
- Corretto: un tratto con un segmento senza durata rende «parziali» km e tempi dello scenario, blocca il «✓ migliore» sulle righe dei tempi e lascia «Trasporti calcolati» in corso nella panoramica.
- Corretto: la capienza totale non viene più presentata come idoneità confermata («4 posti indicati per 4 persone · letti da verificare»); la configurazione dei letti mancante è segnalata; un alloggio senza il campo `beds` (backup vecchio) non manda in errore la sezione.
- Corretto: le stime «alloggio a notte» e «attività al giorno» si sommano anche a voci manuali della stessa categoria (comportamento preesistente): ora l'avviso sui doppi conteggi le include. Nessun importo modificato.
- Errore Leaflet `_leaflet_pos`: non riprodotto (selezione + uscita dopo 0–600 ms, ingresso/uscita durante l'inquadratura iniziale, giri rapidi su tutte le sezioni a 390 e 1360 px). Nessuna modifica alla mappa.
- Verifiche: 69/69 test, typecheck e build ok; lint con i soli 2 errori di `ConfiguratorView.tsx`, già presenti in `019d433`. E2E non eseguibili qui (Playwright assente, `build-local.mjs` usa un percorso Linux).

## 28/10/2026 — fase 4: budget, alloggi, scenari (branch `feature/fase-4-budget-alloggi-scenari`, non pubblicato)

- **Budget**: una voce da 0 € (es. attività gratuita) è un dato valido e la categoria non risulta più «senza voci»; la media giornaliera non compare come «0 €» quando non c'è alcun importo; nella tabella per categoria «non quantificata» (nessuna voce né stima), natura degli importi (certo, stimato, da verificare, misto) e «+ N senza importo» per i costi noti ma non prezzati (`missingByCategory` in `computeBudget`). Le tappe con notti senza alloggio scelto sono un costo sconosciuto della categoria alloggi, salvo stima per notte o voci manuali di alloggio. Riferimento del cambio: data e fonte salvate, oppure «data del cambio non indicata» / «fonte non indicata».
- **Alloggi**: servizi (cucina, bagno, parcheggio) e politica di cancellazione nel confronto per tappa e nelle schede, con «non noto» anche per record senza quei campi.
- **Scenari**: trasferimenti (tratti e giornate con spostamento) con le stesse regole per tutti, senza «migliore»; «Apri per modificare» spiega cosa cambia (data, tappe con alloggio scelto, tratti, giornate, voci di budget, navi incluse) e cosa resta condiviso.
- Verifiche: 73/73 test (i 4 nuovi falliscono sul codice precedente), typecheck e build ok, lint con i 2 errori preesistenti di `ConfiguratorView.tsx`; browser a 1360 e 390 px con dati sintetici in localhost, poi rimossi; aprire le sezioni non modifica il viaggio salvato.

### Fase 4 — lacune residue (stesso branch, non pubblicato)

- **Panoramica**: una sola azione per le tappe senza alloggio, che distingue la scelta (pulsante «Cerca hytte») dal costo («Costo da quantificare», pulsante verso il budget). Se c'è una stima per notte lo dice; se ci sono voci manuali di alloggio chiede di controllare che le coprano. L'azione «costi senza prezzo» conta solo gli altri costi, senza ripetere quelle tappe. Il budget espone `unchosenLodging` e `unchosenLodgingCoverage` (stima, voci_manuali, nessuna).
- **Budget per stato**: `categoryBreakdown` suddivide ogni categoria in certo, stimato e da verificare partendo dalle stesse righe del totale (somma dei subtotali = totale di categoria, somma delle categorie = totale complessivo). Un gruppo compare se ha almeno una voce, anche da 0 €; i costi senza importo restano a parte e senza stato.
- **Link degli alloggi**: aperti solo se `http`/`https` (`externalHref`); indirizzi senza schema o con altri schemi (es. `javascript:`) compaiono come «link non valido» con il testo salvato, che non viene modificato.
- **Backup**: test automatico di `exportTripFile` con dati sintetici (JSON valido, nome file, reimportazione senza perdite).
- **Sincronizzazione**: verifica statica: `src/state`, `src/services/storage`, `types.ts`, `defaults.ts` e `supabase/` non sono stati modificati in nessuna fase. Nessun test contro il cloud.
- Verifiche: 83/83 test, typecheck e build ok, lint con i 2 errori preesistenti; browser a 1360 e 390 px con dati sintetici in localhost, poi rimossi.

## 28/10/2026 — catalogo crociere 1–5 giorni (branch `feature/catalogo-crociere`, non pubblicato)

- **Catalogo** (`src/data/coastalCatalog.ts`): 24 proposte lette il 28/10/2026 sui siti ufficiali in versione tedesca, che espone i prezzi in euro.
  - **Havila**: 11 proposte da 2 a 5 giorni, tutte in pensione completa, con i prezzi minimi a persona per partenze di **agosto 2027** (calcolati dal sito su 2 ospiti; cabina interna e vista mare) e il programma porto per porto.
  - **Hurtigruten**: 13 proposte da 2 a 5 giorni (il sito UK in sterline ne mostra 5). Il «prezzo da» vale per partenze di novembre 2026 o gennaio 2027; le partenze di giugno e agosto 2027 cercate sul sito risultavano «senza partenze» (non ancora in vendita). Nessun prezzo estivo viene ricavato da questi valori.
  - Riassunti e punti salienti in italiano scritti per l'app; porti, durate, pasti e prezzi come pubblicati, con link alla pagina ufficiale.
- **«+ Nuova opzione»** apre il catalogo dell'operatore (filtro per durata 2–5 giorni) con «Scegli questa proposta» oppure «Inserisci a mano». L'opzione si apre precompilata da rivedere: direzione, porti, notti a bordo, pasti, fonte e note con programma e note estive. Per Havila il prezzo è una **stima** = persone × prezzo minimo a persona (stato «stimato»); per Hurtigruten il prezzo resta vuoto («da verificare»). La data, la durata in ore e gli orari non sono pubblicati e restano da inserire.
- **Nel viaggio**: l'opzione salvata mostra la proposta e il programma nel confronto; collegata a un tratto, la nave compare nell'itinerario e il costo nel budget (navigazione costiera).
- Modello: nuovo campo facoltativo `catalogId` nell'opzione costiera (compatibile con i dati e i backup esistenti).
- Verifiche: 88/88 test, typecheck e build ok, lint con i 2 errori preesistenti; browser a 1360 e 390 px con dati sintetici in localhost, poi rimossi.
- Da sapere: i prezzi cambiano nel tempo; Havila apre le prenotazioni circa 6 mesi prima e Hurtigruten non ha ancora l'estate 2027. Ricontrollare prima di decidere.
