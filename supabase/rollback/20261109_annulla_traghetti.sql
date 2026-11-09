-- Ritorno indietro della migrazione 20261109000000_traghetti.sql (e del seed catalogo-norvegia-v2.sql).
-- Toglie SOLO ciò che hanno aggiunto: le versioni del catalogo con traghetti (NO-2), le 5 tabelle ferry_*, e
-- rimette catalog_bundle com'era in 20261106000100_catalogo.sql. Non tocca: NO-1, trips e la colonna data, le tabelle
-- del viaggio, auth, private.allowed_emails.
-- Da eseguire nello SQL Editor come postgres, dopo l'approvazione di Filippo. Tutto in una transazione.
--
-- Prerequisito: nessun viaggio usa una versione con traghetti. Se un viaggio è passato a NO-2, prima lo si riporta
-- a NO-1 dall'app (i tratti traghetto restano nel viaggio con i loro dati; senza catalogo NO-2 la scheda della tratta
-- non si apre). Lo script lo controlla e si ferma senza togliere nulla.

begin;

do $$
declare
  v_n bigint := 0;
  v_m bigint := 0;
begin
  if to_regclass('public.ferry_routes') is null then
    raise notice 'Tabelle dei traghetti assenti: niente da togliere oltre a catalog_bundle';
    return;
  end if;
  -- Viaggi a righe (tabella trip_countries)
  if to_regclass('public.trip_countries') is not null then
    select count(*) into v_n from public.trip_countries tc
    where tc.release_id in (select release_id from public.ferry_routes union select release_id from public.ferry_sources);
  end if;
  -- Viaggi nel formato documento (trips.data -> countries[].releaseId)
  if to_regclass('public.trips') is not null then
    select count(*) into v_m from public.trips t,
      jsonb_array_elements(case when jsonb_typeof(t.data -> 'countries') = 'array' then t.data -> 'countries' else '[]'::jsonb end) c
    where c ->> 'releaseId' in (select release_id from public.ferry_routes union select release_id from public.ferry_sources);
  end if;
  if v_n + v_m > 0 then
    raise exception 'Ci sono viaggi che usano una versione con traghetti (righe: %, documenti: %): riportarli prima a NO-1. Nulla è stato rimosso.', v_n, v_m;
  end if;
end $$;

-- Versioni con traghetti (NO-2): si tolgono con tutto il loro contenuto (a cascata). Le guardie di immutabilità
-- lo vieterebbero: eccezione di manutenzione esplicita, valida solo in questa transazione.
set local nfhp.catalogo_admin = 'on';

do $$
declare
  v_ids text[];
begin
  if to_regclass('public.ferry_routes') is null then return; end if;
  select coalesce(array_agg(distinct release_id), '{}') into v_ids
  from (select release_id from public.ferry_routes union select release_id from public.ferry_sources) x;
  if cardinality(v_ids) > 0 then
    raise notice 'Tolgo le versioni del catalogo con traghetti: %', v_ids;
    -- In ordine, dai figli ai genitori: non si dipende dall'ordine dei controlli delle chiavi esterne a cascata
    delete from public.ferry_fares where release_id = any (v_ids);
    delete from public.ferry_route_places where release_id = any (v_ids);
    delete from public.ferry_route_stops where release_id = any (v_ids);
    delete from public.ferry_routes where release_id = any (v_ids);
    delete from public.ferry_sources where release_id = any (v_ids);
    delete from public.place_links where release_id = any (v_ids);
    delete from public.route_ports where release_id = any (v_ids);
    delete from public.voyages where release_id = any (v_ids);
    delete from public.operators where release_id = any (v_ids);
    delete from public.place_sources where release_id = any (v_ids);
    delete from public.place_texts where release_id = any (v_ids);
    delete from public.places where release_id = any (v_ids);
    delete from public.regions where release_id = any (v_ids);
    -- Una versione successiva che indica queste come precedenti blocca la cancellazione (chiave esterna): ci si ferma
    delete from public.catalog_releases where release_id = any (v_ids);
  end if;
end $$;

-- catalog_bundle com'era in 20261106000100_catalogo.sql
create or replace function public.catalog_bundle(p_release_id text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'release', (select to_jsonb(r) from public.catalog_releases r where r.release_id = p_release_id),
    'country', (select to_jsonb(c) from public.countries c join public.catalog_releases r on r.country_code = c.code where r.release_id = p_release_id),
    'regions', coalesce((select jsonb_agg(to_jsonb(x) order by x.position) from public.regions x where x.release_id = p_release_id), '[]'::jsonb),
    'places', coalesce((select jsonb_agg(to_jsonb(x) order by x.place_key) from public.places x where x.release_id = p_release_id), '[]'::jsonb),
    'place_texts', coalesce((select jsonb_agg(to_jsonb(x) order by x.place_key, x.lang) from public.place_texts x where x.release_id = p_release_id), '[]'::jsonb),
    'place_sources', coalesce((select jsonb_agg(to_jsonb(x) order by x.place_key, x.field, x.position) from public.place_sources x where x.release_id = p_release_id), '[]'::jsonb),
    'operators', coalesce((select jsonb_agg(to_jsonb(x) order by x.position) from public.operators x where x.release_id = p_release_id), '[]'::jsonb),
    'voyages', coalesce((select jsonb_agg(to_jsonb(x) order by x.position) from public.voyages x where x.release_id = p_release_id), '[]'::jsonb),
    'route_ports', coalesce((select jsonb_agg(to_jsonb(x) order by x.route_key, x.seq) from public.route_ports x where x.release_id = p_release_id), '[]'::jsonb),
    'place_links', coalesce((select jsonb_agg(to_jsonb(x) order by x.kind, x.from_place_key, x.to_place_key) from public.place_links x where x.release_id = p_release_id), '[]'::jsonb)
  )
$$;

revoke all on function public.catalog_bundle(text) from public, anon;
grant execute on function public.catalog_bundle(text) to authenticated;

drop table if exists public.ferry_fares;
drop table if exists public.ferry_route_places;
drop table if exists public.ferry_route_stops;
drop table if exists public.ferry_routes;
drop table if exists public.ferry_sources;

-- Controllo: NO-1 intatta e leggibile, nessuna chiave ferry_* nel bundle
do $$
begin
  if exists (select 1 from public.catalog_releases where release_id = 'NO-1') then
    if not exists (select 1 from public.catalog_releases where release_id = 'NO-1' and status = 'pubblicata') then
      raise exception 'NO-1 non è più pubblicata';
    end if;
    if jsonb_array_length(public.catalog_bundle('NO-1') -> 'places') = 0 then
      raise exception 'NO-1 senza luoghi';
    end if;
  end if;
  if public.catalog_bundle('NO-1') ? 'ferry_routes' then
    raise exception 'catalog_bundle contiene ancora le chiavi dei traghetti';
  end if;
end $$;

commit;
