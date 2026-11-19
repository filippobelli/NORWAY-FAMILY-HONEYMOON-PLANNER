-- 20261119000000 · Le versioni superate del catalogo si cancellano.
-- Regola del 19/11/2026: quando esce una versione nuova di una nazione, i viaggi ci passano da soli (l'app lo fa a
-- viaggio allineato) e le versioni precedenti vengono cancellate. È sicuro perché ogni versione contiene tutti i luoghi
-- della precedente con le stesse chiavi (controllo finale di ogni seed).
-- Idempotente. Non tocca public.trips (JSON dei viaggi: li aggiorna l'app), auth né private.allowed_emails.

-- La versione precedente resta scritta come storia, senza vincolo: la riga a cui puntava può non esistere più
alter table public.catalog_releases drop constraint if exists catalog_releases_previous_release_id_fkey;

-- Cancella le versioni di una nazione più vecchie dell'ultima pubblicata. Prima porta all'ultima le nazioni dei viaggi
-- salvati a righe (trip_countries) che usano una versione da cancellare. Restituisce il numero di versioni cancellate.
create or replace function private.purge_superseded_releases(p_country text)
returns integer language plpgsql set search_path = '' as $$
declare
  v_latest public.catalog_releases%rowtype;
  v_n integer;
  t text;
begin
  select * into v_latest from public.catalog_releases r
   where r.country_code = p_country and r.status = 'pubblicata'
   order by r.version desc limit 1;
  if v_latest.release_id is null then
    return 0;
  end if;
  perform set_config('nfhp.catalogo_admin', 'on', true);
  update public.trip_countries tc set release_id = v_latest.release_id
   where tc.country_code = p_country and tc.release_id <> v_latest.release_id;
  -- Prima le tabelle figlie, nell'ordine dei vincoli (non tutti sono a cascata: crociere e tratte puntano ai luoghi)
  foreach t in array array['ferry_fares', 'ferry_route_stops', 'ferry_route_places', 'ferry_routes', 'ferry_sources', 'voyages', 'operators',
    'route_ports', 'place_links', 'place_photos', 'place_tips', 'place_sources', 'place_texts', 'places', 'regions'] loop
    if to_regclass('public.' || t) is not null then
      execute format('delete from public.%I x using public.catalog_releases r where x.release_id = r.release_id and r.country_code = $1 and r.version < $2', t)
        using p_country, v_latest.version;
    end if;
  end loop;
  delete from public.catalog_releases r
   where r.country_code = p_country and r.version < v_latest.version;
  get diagnostics v_n = row_count;
  perform set_config('nfhp.catalogo_admin', '', true);
  raise notice 'Catalogo %: in uso %, versioni precedenti cancellate: %', p_country, v_latest.release_id, v_n;
  return v_n;
end $$;

revoke all on function private.purge_superseded_releases(text) from public, anon, authenticated;
