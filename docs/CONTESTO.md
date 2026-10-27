# Contesto del progetto — Viaggio in Norvegia 2027

Copia del documento di progetto "Viaggio in Norvegia 2027.md" (Project claude.ai, 27/10/2026). In caso di differenze vale la versione nel Project.

## 1. Contesto del progetto

Progettare, organizzare e gestire il viaggio di famiglia in Norvegia previsto per agosto 2027. Itinerario realistico di 15–20 giorni con attenzione a: fiordi e paesaggi naturali; navigazione costiera con Hurtigruten e/o Havila; traghetti necessari per collegare le tappe; pernottamenti in hytte immerse nella natura; esperienze adatte a due adulti e due bambini (8 e 5 anni nel periodo del viaggio); equilibrio tra spostamenti, visite, attività per bambini e riposo. Trasformare le idee in un piano realizzabile, con tappe, distanze, tempi, costi stimati, sistemazioni e collegamenti verificabili.

## 2. Obiettivi principali

1. Esplorare le principali destinazioni attraverso un catalogo organizzato.
2. Visualizzare le destinazioni su una mappa interattiva.
3. Selezionare, aggiungere, rimuovere e riordinare le tappe.
4. Costruire un itinerario giorno per giorno.
5. Calcolare distanze stradali e tempi di percorrenza effettivi.
6. Integrare traghetti, navigazione costiera, treni e altri mezzi.
7. Cercare e confrontare sistemazioni di tipo hytte.
8. Valutare Hurtigruten e Havila per percorso, date, durata, porti di imbarco/sbarco e costi.
9. Stimare il budget complessivo per quattro persone.
10. Salvare il progetto online e riprenderlo da dispositivi diversi.

Pianificazione manuale e suggerimenti automatici, con l'utente sempre in controllo delle decisioni.

## 3. Profilo del viaggio

Agosto 2027 · 15–20 giorni · 2 adulti e 2 bambini · partenza dall'Italia (aeroporto e voli da definire) · trasporto da valutare (auto a noleggio, traghetti, treni, navigazione costiera) · hytte e alloggi nella natura · stile panoramico e naturalistico · budget e itinerario da definire. Tappe, voli, noleggio, date e prenotazioni non sono decisi e devono restare modificabili.

## 4. Priorità dell'itinerario

1. Fiordi più spettacolari. 2. Un tratto significativo di navigazione costiera. 3. Sequenza geografica sensata, senza deviazioni inutili. 4. Alternare paesaggi, villaggi, escursioni semplici, attività per bambini e giornate leggere. 5. Hytte in posizioni strategiche. 6. Limitare i cambi di alloggio. 7. Considerare stagionalità, orari dei traghetti e disponibilità reale. 8. Alternativa per le tappe dipendenti dal meteo. La qualità conta più del numero di tappe.

## 5. Navigazione costiera

Componente autonoma. Per ogni alternativa: itinerari e porti, date e orari, durata dei tratti, cabine, prezzi per 2 adulti e 2 bambini, regole per i bambini, pasti, modifica e cancellazione, costi aggiuntivi, collegamenti con auto/treni/bus/traghetti, imbarco e sbarco in porti diversi. Confrontare sul valore per la famiglia, non solo sul prezzo. Non presumere che tariffe e orari di agosto 2027 siano pubblicati; distinguere dati confermati, stime e dati da verificare.

## 6. Hytte e pernottamenti

Per ogni sistemazione: nome e località, coordinate, link ufficiale o di prenotazione, prezzo per notte e totale, capienza e letti, bagno, cucina, parcheggio, distanze, cancellazione, disponibilità per le date se verificabile, costi di pulizia/biancheria/extra. Distinguere sempre sistemazione individuata da disponibile o prenotata. Non sacrificare la praticità all'estetica.

## 7. Catalogo delle destinazioni

Circa 100 destinazioni ed esperienze come base di esplorazione, non come itinerario obbligatorio. Categorie: città e villaggi; fiordi e navigazione; cascate, ghiacciai e parchi; strade panoramiche e belvedere; isole e villaggi costieri; treni e trasporti; fauna; musei e attività per bambini; parchi divertimento; esperienze stagionali. Per ogni scheda: identificativo stabile, nome e nome locale, descrizione, coordinate, categoria e regione, durata, difficoltà e idoneità per bambini, accessibilità, stagionalità, costi indicativi e link ufficiali, fonti e data di verifica, immagine con credito/licenza, stato di attendibilità. Indicare le informazioni non verificate; non inventare coordinate, prezzi, disponibilità, orari o collegamenti.

## 8. Mappa e trasferimenti

Distinguere: strada, traghetto, nave costiera, treno, bus/trasporto pubblico, aereo, collegamento non calcolato. Mai la distanza in linea d'aria come distanza stradale. Per ogni collegamento: distanza, durata, mezzo, fonte, data di verifica. Traghetti come segmenti specifici con attese, orari e costi separati. Non sommare tempi incompatibili o sovrapposti.

## 9. Pianificazione giornaliera

Giornate modificabili con data, partenza e arrivo, alloggio, attrazioni, trasferimenti, traghetti, pasti e pause, costi, note, alternative per il maltempo. Evitare giornate troppo cariche. L'app può suggerire ma non deve modificare silenziosamente le scelte dell'utente.

## 10. Budget

Progressivo e trasparente. Categorie: voli; bagagli e transfer; noleggio auto e assicurazioni; carburante, pedaggi e parcheggi; traghetti; Hurtigruten/Havila; treni e bus; hytte e sistemazioni; alimentari e pasti; attrazioni; extra e imprevisti. Per ogni voce: confermato, stimato, da verificare, prenotato o pagato. Totale e media giornaliera. Mai stime presentate come prezzi ufficiali.

## 11. Architettura tecnica

Riferimento in assenza di un'architettura esistente: React, TypeScript rigoroso, Vite, React Router, Leaflet/React-Leaflet, provider di routing sostituibile, Supabase con PostgreSQL e Row Level Security. Servizi separati per mappe, routing, sistemazioni, trasporti e fonti. Niente chiavi segrete nel frontend o nel repository.

## 12. Salvataggio e dati

Entità distinte per viaggi, partecipanti, destinazioni, tappe, giornate e attività, tratti, sistemazioni, preventivi e spese, preferiti e note, fonti e verifiche. Salvataggio cloud confermato solo da esito positivo del backend. Se il cloud non è configurato, dichiarare la modalità locale. Non cancellare o sovrascrivere dati senza autorizzazione esplicita.

## 13. Regole operative per Claude Code

Prima: leggere questo file e le istruzioni del repository; analizzare struttura e dipendenze; identificare cosa funziona e cosa manca; piano per milestone; modifiche progressive e non distruttive.
Durante: implementare davvero; non simulare integrazioni senza dirlo; nessun pulsante che non fa ciò che dichiara; non dichiarare collegato un servizio non verificato; niente prenotazioni o acquisti; non toccare produzione, cloud o servizi a pagamento senza autorizzazione; nessun segreto esposto; UX chiara, moderna e responsive; gestire errori, caricamenti, assenza di risultati e servizi in errore; eseguire test, TypeScript, lint e build; documentare configurazioni, limiti e attività mancanti.

## 14. Milestone

1. Analisi e fondamenta. 2. Catalogo. 3. Mappa e trasporti. 4. Itinerario. 5. Navigazione costiera e hytte. 6. Budget e persistenza. 7. Verifica finale. L'ordine si può adattare.

## 15. Criteri di successo

Catalogo di destinazioni reali; itinerario di 15–20 giorni; tappe e collegamenti sulla mappa; distinzione tra strada, traghetto, treno e navigazione; confronto costiero su informazioni verificabili; pernottamenti in hytte; budget trasparente; salvataggio cloud se configurato; uso da computer e smartphone; distinzione chiara tra dati confermati, stime e dati da verificare.

**Principio guida:** uno strumento utile per decisioni reali, non una demo con informazioni apparentemente complete ma non verificate.
