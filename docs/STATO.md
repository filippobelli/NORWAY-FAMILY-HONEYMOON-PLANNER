# Stato del progetto — 27 ottobre 2026

## Punto di partenza

Non esisteva un repository: il progetto è stato creato da zero con lo stack indicato in CLAUDE.md (React, TypeScript rigoroso, Vite, Leaflet, Supabase con RLS).
Differenze motivate rispetto allo stack di riferimento:

- **React Router** non usato: 7 sezioni gestite con routing via hash (`#/itinerario`, ...). Sostituibile quando serviranno URL più ricchi.
- **Leaflet** caricato da CDN invece che via npm, isolato in `src/services/map/leaflet.ts`.
- **Supabase** usato via REST (Auth + PostgREST) senza `@supabase/supabase-js`, in `src/services/storage/supabase.ts`.

## Confronto con gli obiettivi

| Obiettivo (CLAUDE.md §2) | Stato | Note |
|---|---|---|
| 1. Catalogo destinazioni | Parziale | 72 schede in 11 categorie, tutte "da verificare" con coordinate approssimative. Mancano fonti, link ufficiali, immagini e ~30 schede |
| 2. Mappa interattiva | Fatto | Da verificare a occhio sul PC (nel test automatico la CDN era bloccata) |
| 3. Selezione e riordino tappe | Fatto | Riordino con frecce (niente drag & drop) |
| 4. Itinerario giorno per giorno | Fatto | Giornate generate dalle notti, attività, note, piano B |
| 5. Distanze e tempi stradali | Fatto | OSRM verificato dal vivo il 27/10/2026 (Bergen→Flåm 167 km, 2 h 51) |
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
- **Servizi reali** (dal PC di Filippo, 27/10/2026): OSRM risponde con CORS e riconosce i traghetti; CDN di Leaflet raggiungibile; Overpass in errore 502 e mirror in timeout → aggiunto passaggio automatico ai mirror e messaggio che rimanda ai link esterni.
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

## Prossime milestone

1. **Catalogo (M2)**: portare a ~100 schede, verificare coordinate e periodi su fonti ufficiali (visitnorway.com, siti delle attrazioni), aggiungere link, immagini con licenza, data di verifica.
2. **Itinerario (M3–M4)**: drag & drop, notti a bordo agganciate ai porti, orari traghetti principali (es. Bodø–Moskenes, Hellesylt–Geiranger), controllo stagionalità delle strade di montagna.
3. **Costiera e hytte (M5)**: piano di navigazione 2027 appena pubblicato (Havila prenotabile ~6 mesi prima), auto a bordo, preventivi reali.
4. **Persistenza (M6)**: tabelle normalizzate, salvataggio cloud automatico, accesso condiviso per entrambi i genitori.
5. **Verifica finale (M7)**: test su smartphone reali, deploy (es. Vercel) solo dopo autorizzazione.
