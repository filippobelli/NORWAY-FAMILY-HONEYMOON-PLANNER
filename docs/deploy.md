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

## 5. NO-2 traghetti (2026-11-10)

Approvazione: Filippo, 2026-11-09 (`docs/piano-2026-11-09-trasporti-mare.md`, sezione «Approvazioni»). Revisione: «approvato con riserve», nessun bloccante (`docs/review.md`, ultime sezioni; la riserva 4 chiedeva proprio di applicare migrazione e seed v2). Ramo `feature/trasporti-mare`, commit `bc13f1f`. Strumenti: `apply_migration` e `execute_sql` del connettore MCP Supabase.

### Stato prima (2026-11-10, verso le 08:25 UTC)

- `catalog_releases`: solo NO-1, `pubblicata` dal 2026-11-07 14:55 UTC.
- Righe NO-1: regions 7, places 117, place_texts 117, place_sources 394, operators 2, voyages 24, route_ports 35, place_links 9. Totali: countries 1, place_keys 117, home_airports 20.
- `md5(catalog_bundle('NO-1')::text)` = `a969ac7df645261faf2d6b96b64e5b93`.
- `public.trips`: 1 riga, `storage_format = documento`, `md5(data::text)` = `06d3a4e95d9780da9280b82af5f23761` (riga intera: `de614116273990a1c8a815e7c6637477`).
  **Da sapere**: il valore annotato il 2026-11-07 era `f4f3130ae0402fdfb5c8d89c6dd3623d`. Il viaggio è stato salvato di nuovo il 2026-11-09 alle 11:02 UTC (`updated_at`), prima di questo lavoro e non da questo lavoro. Come riferimento per «viaggio intatto» è stato usato il valore del 2026-11-10.

### Passo 1 · Migrazione `traghetti`

- `apply_migration` con il contenuto esatto di `supabase/migrations/20261109000000_traghetti.sql`. Registrata come versione `20261110082650`, nome `traghetti`; `md5` del testo registrato = `md5` del file = `7962f87a5f617d3dfe3886152cc5fddd`.
- Il controllo finale della migrazione è passato. Verifiche dopo: 5 tabelle `ferry_*` con RLS attiva, 1 policy `catalogo_lettura` (SELECT, `authenticated`) e 1 guardia `catalog_guard` ciascuna; `anon` senza `select`, `authenticated` senza scrittura; `anon` senza `execute` su `catalog_bundle`.
- `catalog_bundle('NO-1')` invariato nel contenuto: senza le cinque chiavi `ferry_*` (vuote, come previsto) l'`md5` resta `a969ac7d…`.

### Passo 2 · Seed `supabase/seed/catalogo-norvegia-v2.sql`

- Prima del caricamento il seed è stato rigenerato in una cartella temporanea (`npx tsx scripts/seed-catalog.ts --country NO --version 2 --out …`): identico byte per byte al file del repository (`md5` `1ea2677e00ce781125618d4d1c8abc85`, 321.212 byte).
- Stesso metodo di NO-1: 24 blocchi di istruzioni complete, nell'ordine del file, ognuno avvolto nel controllo `do $c$ … md5(s) … execute s; end $c$;`. Tolti `begin;`/`commit;`; aperto il blocco `do $seed$` (la guardia «solo se NO-2 è in bozza» resta garantita dai trigger `catalog_guard`); `insert` grandi divise per righe in blocchi da al massimo 22 KB. Script di divisione nella cartella temporanea della sessione, fuori dal repository. Alcuni blocchi piccoli sono stati inviati nella stessa chiamata (05+06, 10+11, 13–16, 21+22), ognuno con il suo controllo.
- Tutti i 24 blocchi hanno superato il controllo `md5` al primo invio; nessuna interruzione, nessuna ripresa.

| # | Blocco | Righe |
|---|---|---|
| 01 | controllo prerequisiti (`do $pre$`), countries, NO-2 in bozza (`previous_release_id = NO-1`), place_keys, home_airports (tutti con `on conflict do nothing`) | solo la riga di NO-2 è nuova |
| 02 | regions | 7 |
| 03–04 | places | 67 + 50 |
| 05–06 | place_texts | 111 + 6 |
| 07–10 | place_sources | 102 + 112 + 109 + 71 |
| 11 | operators | 2 |
| 12–13 | voyages | 19 + 5 |
| 14 | route_ports | 35 |
| 15 | place_links | 9 |
| 16 | ferry_sources | 36 |
| 17–19 | ferry_routes | 21 + 20 + 17 |
| 20–21 | ferry_route_stops | 169 + 38 |
| 22 | ferry_route_places | 58 |
| 23 | ferry_fares | 91 |
| 24 | pubblicazione di NO-2 + controllo finale `do $check$` del seed, nella stessa transazione | — |

- Prima del blocco 24 una query ha confermato NO-2 in bozza con tutti i conteggi attesi (tabella sotto). Poi pubblicazione e controllo finale nella stessa transazione: controllo passato, NO-2 `pubblicata` il 2026-11-10 alle 08:48 UTC.

### Passo 3 · Esiti dei controlli

| Tabella | NO-1 | NO-2 | Atteso NO-2 (file) |
|---|---|---|---|
| regions | 7 | 7 | 7 |
| places | 117 | 117 | 117 |
| place_texts | 117 | 117 | 117 |
| place_sources | 394 | 394 | 394 |
| operators | 2 | 2 | 2 |
| voyages | 24 | 24 | 24 |
| route_ports | 35 | 35 | 35 |
| place_links | 9 | 9 | 9 |
| ferry_sources | 0 | 36 | 36 |
| ferry_routes | 0 | 58 | 58 |
| ferry_route_stops | 0 | 207 | 207 (200 con coordinate NSR) |
| ferry_route_places | 0 | 58 | 58 |
| ferry_fares | 0 | 91 | 91 (84 con importo) |

Totali invariati: countries 1, place_keys 117, home_airports 20. Il controllo del seed ha verificato anche che ogni riga di NO-1 è identica in NO-2 (stesse chiavi e valori), nessuna tratta senza tappe, nessun luogo senza testo italiano.

- **NO-2**: `pubblicata`, `previous_release_id = NO-1`.
- **NO-1 identica a prima**: stato e data di pubblicazione invariati; `catalog_bundle('NO-1')` senza le chiavi `ferry_*` = `a969ac7d…` come prima; le chiavi `ferry_*` di NO-1 sono elenchi vuoti.
- **Bundle NO-2 contro lo script**: `scripts/seed-catalog.ts --version 2 --bundle` (in cartella temporanea), confronto per chiave dell'`md5` del JSON in forma canonica `jsonb`. Identiche 12 chiavi su 15, tra cui tutte le cinque `ferry_*`, `places`, `place_texts`, `place_sources`, `voyages`. Le altre tre differiscono solo nella forma, non nei dati: `country` ha in più `created_at` (data del server); `release` ha `created_at` e il `published_at` reale (lo script mette una data fissa); `regions.sources` e `release.source_notes` nello script hanno le chiavi assenti scritte come `null`, nel database sono omesse. Tolti questi campi e i `null`, anche `country`, `release` e `regions` coincidono.
- **Accesso** (transazioni annullate): come `authenticated` con l'identità del proprietario del viaggio, lette 58 tratte NO-2 e 91 tariffe; `catalog_bundle('NO-2')` con 58 tratte e 117 luoghi; NO-1 con 0 tratte. Come `anon`: «permission denied for table ferry_routes»; nessun `select` su nessuna tabella `ferry_*`, nessun `execute` su `catalog_bundle`.
- **Guardia**: un `update` su una riga di NO-2 viene rifiutato con «La versione NO-2 del catalogo è pubblicata: i suoi dati non cambiano».
- **Viaggio intatto**: `trips` 1 riga, `storage_format = documento`, `md5(data::text)` = `06d3a4e95d9780da9280b82af5f23761` prima e dopo (riga intera `de614116…` prima e dopo). Nessuna tabella del viaggio toccata.

### Passo 4 · Advisor

- **Security**: nessuna segnalazione nuova sulle tabelle `ferry_*`. Restano quelle già note (funzioni `SECURITY DEFINER` eseguibili da `authenticated`, come `can_read_trip` e `is_trip_owner`, usate dalle policy; protezione dalle password trapelate disattivata in Auth).
- **Performance**: 6 segnalazioni nuove «unindexed_foreign_keys» sulle chiavi esterne verso `ferry_sources` (`ferry_routes` ×4, `ferry_route_stops`, `ferry_fares`). Corrette con la migrazione aggiuntiva `supabase/migrations/20261110000000_traghetti_indici_fk.sql` (solo `create index if not exists`), registrata come `20261110085051 traghetti_indici_fk`; `md5` del testo registrato = `md5` del file = `a6018ebba5af24f70e1b31abb50042c4`. Dopo: le 6 segnalazioni sono sparite; i 6 indici nuovi compaiono come «unused_index» (INFO), normale per indici appena creati su tabelle piccole. Le altre segnalazioni (chiavi esterne non indicizzate su tabelle del viaggio e del catalogo NO-1, policy permissive multiple su `trips`, tabella di copia senza chiave primaria) c'erano già e non sono state toccate.

### Problemi trovati

- Nessun errore di dati o di schema; nessun blocco respinto dal controllo `md5`.
- `md5` del viaggio diverso da quello annotato il 2026-11-07: spiegato dal salvataggio del 2026-11-09 alle 11:02 UTC (vedi sopra). Durante questo lavoro non è cambiato.
- Supabase registra le migrazioni con la data di applicazione (`20261110082650`, `20261110085051`), diversa dal nome dei file (`20261109000000`, `20261110000000`): è il comportamento di `apply_migration`.
- Il bundle generato dallo script scrive le chiavi assenti dei JSON di fonte come `null`; il database conserva il JSON del seed senza quelle chiavi. Nessun effetto sui dati; da tenere presente se in futuro si confrontano i bundle byte per byte.
