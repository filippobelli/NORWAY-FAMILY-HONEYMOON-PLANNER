# Deploy sul progetto Supabase norway-planner

Registro di ciò che è stato applicato al database del progetto `norway-planner` (project_id `zsbfcriekrguiugbqdhi`). Date in formato AAAA-MM-GG.

## 1. Migrazioni dello schema (2026-11-06)

Applicate dal capo progetto il 2026-11-06, nell'ordine di `docs/architettura.md` §12.2:

1. `20261106000000_copia_sicurezza.sql`
2. `20261106000100_catalogo.sql`
3. `20261106000200_viaggio.sql`
4. `20261106000300_rls.sql`
5. `20261106000400_sincronizzazione.sql`
6. `20261106000500_storage.sql` (storage degli allegati)

Il caricamento del catalogo non ha riapplicato né modificato lo schema.

## 2. Seed del catalogo Norvegia, versione NO-1 (2026-11-06 → 2026-11-07)

File: `supabase/seed/catalogo-norvegia-v1.sql` (circa 198 KB, generato da `scripts/seed-catalog.ts`).
Strumento: `execute_sql` del connettore MCP Supabase. Ogni chiamata è una transazione separata.

### Come è stato diviso

Il file intero non entra in una chiamata, quindi è stato diviso in 19 blocchi di istruzioni complete, nello stesso ordine del file. Nessuna istruzione è stata tagliata a metà.

- Tolti `begin;` / `commit;` del file: ogni chiamata ha già la sua transazione.
- Il blocco `do $seed$ … end $seed$` (righe 161–888) è stato aperto: le sue `insert` sono state eseguite come istruzioni normali. La sua guardia («scrivi solo se NO-1 è in bozza») resta garantita dai trigger dello schema, che accettano righe solo con la versione in bozza.
- Le `insert` grandi sono state divise per righe in più `insert` da circa 15 KB.
- Ogni blocco è stato racchiuso in un controllo di integrità: `do $c$ declare s text := $q$…$q$; begin if md5(s) <> '<md5 calcolato in locale>' then raise exception …; end if; execute s; end $c$;`. Se il testo arrivato al database non coincide byte per byte con quello del file, il blocco si ferma senza scrivere niente. Tutti i 19 blocchi hanno superato il controllo.

| # | Blocco | Righe |
|---|---|---|
| 01 | countries, catalog_releases (NO-1 in bozza), place_keys, home_airports (con `on conflict do nothing`) | 1 + 1 + 117 + 20 |
| 02–03 | regions | 6 + 1 |
| 04–06 | places | 48 + 49 + 20 |
| 07–08 | place_texts | 64 + 53 |
| 09–14 | place_sources | 71 + 71 + 79 + 75 + 75 + 23 |
| 15 | operators | 2 |
| 16–17 | voyages | 14 + 10 |
| 18 | route_ports | 35 |
| 19 | place_links | 9 |

Lo script che ha prodotto i blocchi stava nella cartella temporanea della sessione, fuori dal repository.

### Interruzione e ripresa

Il 2026-11-06 il lavoro si è fermato dopo il blocco 11 per il limite di utilizzo. Il 2026-11-07, prima di riprendere, una query ha confermato lo stato: NO-1 in bozza; countries 1, place_keys 117, home_airports 20, regions 7, places 117, place_texts 117, place_sources 221 (= blocchi 09–11); nessuna riga per `atlanterhavsparken`, che è il primo luogo del blocco 12; operators, voyages, route_ports e place_links a 0. Il lavoro è ripreso dal blocco 12, senza righe doppie.

### Pubblicazione

Dopo l'ultimo inserimento, il passaggio di NO-1 a `pubblicata` e il blocco di controllo finale del seed (`do $check$`, copiato dal file) sono stati eseguiti nella stessa transazione. Se il controllo fosse fallito, anche la pubblicazione sarebbe stata annullata. Il controllo è passato: NO-1 pubblicata il 2026-11-07 alle 14:55 UTC.

## 3. Esiti dei controlli (2026-11-07)

Conteggi con `release_id = 'NO-1'`:

| Tabella | Righe | Attese |
|---|---|---|
| regions | 7 | 7 |
| places | 117 | 117 |
| place_texts | 117 | 117 |
| place_sources | 394 | 394 |
| operators | 2 | 2 |
| voyages | 24 | 24 |
| route_ports | 35 | 35 |
| place_links | 9 | 9 |
| countries (totale) | 1 | 1 |
| place_keys (totale) | 117 | 117 |
| home_airports (totale) | 20 | 20 |

Il blocco di controllo del seed ha verificato anche: 35 porti, 72 luoghi con coordinate verificate, 29 con sito ufficiale, 77 con Wikidata, 8 con luogo base, nessuna chiave di un'altra nazione e nessun luogo senza testo in italiano.

Campione di luoghi con testi e fonti:

- `oslo`: città, coordinate verificate, testo italiano presente, 3 fonti (OpenStreetMap, Wikidata Q585, testi redazionali).
- `munch`: museo, sito https://www.munch.no/, testo italiano presente, 6 fonti.
- `tusenfryd`: parco, sito https://www.tusenfryd.no/, testo italiano presente con note stagionali e «fuori città», 8 fonti.

Viaggi intatti: `public.trips` ha ancora 1 riga, con `md5(data::text) = 'f4f3130ae0402fdfb5c8d89c6dd3623d'` (lo stesso valore di prima del caricamento).

Accesso:

- Come utente autenticato, il proprietario del viaggio, in una transazione poi annullata: `jsonb_array_length(public.catalog_bundle('NO-1')->'places')` = 117. La lettura diretta di `places` restituisce 117 righe.
- Come `anon`: `select` su `places` rifiutato con il messaggio «permission denied for table places». `anon` non ha il permesso di `select` su nessuna tabella del catalogo, né di `execute` su `catalog_bundle`. Su `trips`, `anon` vede 0 righe.

## 4. Problemi trovati

- Nessun errore di dati o di schema durante il caricamento.
- L'unico problema è stata l'interruzione per il limite di utilizzo tra i blocchi 11 e 12, descritta sopra. La versione è rimasta in bozza, quindi invisibile all'app, fino alla pubblicazione finale.
- Da sapere: lo SQL Editor esegue il file intero in una sola volta, mentre `execute_sql` richiede la divisione in blocchi. Per i prossimi seed conviene riusare lo stesso metodo: blocchi verificati con md5 e pubblicazione insieme al controllo, nella stessa transazione.
