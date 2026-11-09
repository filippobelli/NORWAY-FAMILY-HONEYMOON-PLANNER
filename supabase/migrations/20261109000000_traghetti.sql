-- 20261109000000 · Trasporti via mare: tratte traghetto nel catalogo (versione NO-2 e successive).
-- Progetto: docs/architettura.md, sezione «Trasporti via mare (NO-2)». Piano: docs/piano-2026-11-09-trasporti-mare.md.
--
-- Solo aggiunte, idempotente (rieseguibile): 5 tabelle nuove del catalogo, guardie di immutabilità, RLS come le altre
-- tabelle del catalogo, catalog_bundle esteso con le chiavi ferry_*. Nessun DROP di dati, nessuna modifica a trips,
-- alle tabelle del viaggio, ad auth o a private.allowed_emails. La versione NO-1 (pubblicata) non cambia: per lei
-- catalog_bundle restituisce le chiavi nuove come elenchi vuoti.
-- I dati (versione NO-2) arrivano dal seed supabase/seed/catalogo-norvegia-v2.sql, da applicare DOPO questa migrazione.
-- Ritorno indietro: supabase/rollback/20261109_annulla_traghetti.sql.
-- Nello SQL Editor racchiudere in begin; … commit; (come le migrazioni del 2026-11-06).

-- ---------- Fonti (dizionario per versione): URL e data di lettura ----------

create table if not exists public.ferry_sources (
  release_id text not null references public.catalog_releases (release_id) on delete cascade,
  source_key text not null check (source_key ~ '^[a-z0-9][a-z0-9-]*$'),
  position integer not null default 0,
  title text not null,
  url text not null check (url ~ '^https?://'),
  checked_at date not null,
  primary key (release_id, source_key)
);

-- ---------- Tratte ----------
-- Una riga per tratta. route_key stabile tra le versioni (es. 'bergen-flam-express'): il viaggio lo conserva nel
-- tratto (Segment.ferry.routeKey) senza chiave esterna, come place_key.
-- Ogni campo con stato ha la sua fonte (*_source_key → ferry_sources): «fonti per campo».

create table if not exists public.ferry_routes (
  release_id text not null references public.catalog_releases (release_id) on delete cascade,
  route_key text not null check (route_key ~ '^[a-z0-9][a-z0-9-]*$'),
  position integer not null default 0,
  name text not null,                                   -- italiano
  operator_name text not null,                          -- come scritto dalla ricerca (con eventuale cambio di operatore)
  mode text not null check (mode in ('ferje', 'hurtigbat', 'turistico')),
  zone text not null,                                   -- es. «Vestland – Sognefjord»
  region_key text not null,
  road text,                                            -- es. E39, Rv63
  carries_car boolean not null,
  round_trip boolean not null default false,            -- parte e torna allo stesso porto (escursione)
  from_name text not null,
  to_name text not null,
  -- Durata totale in minuti: min = max per un valore singolo
  duration_min integer check (duration_min is null or duration_min > 0),
  duration_max integer,
  duration_status text not null check (duration_status in ('confermato', 'da_verificare', 'assente')),
  duration_note text,
  duration_source_key text,
  -- Stagione e frequenza estiva come testi della fonte (mai frequenze estive dedotte dall'inverno)
  season_text text not null default '',
  season_status text not null check (season_status in ('confermato', 'da_verificare', 'assente')),
  season_source_key text,
  frequency_text text not null default '',
  frequency_status text not null check (frequency_status in ('confermato', 'da_verificare', 'assente')),
  frequency_source_key text,
  frequency_year integer,
  -- Tariffa: dati comuni a tutte le voci (le voci sono in ferry_fares)
  currency text not null default 'NOK' check (currency ~ '^[A-Z]{3}$'),
  fare_status text not null check (fare_status in ('confermato', 'da_verificare', 'assente')),
  fare_year integer check (fare_year is null or fare_year between 2000 and 2100),
  fare_year_label text,                                 -- es. «2026/2027» quando la fonte non indica un solo anno
  fare_valid_from date,
  fare_period text,
  fare_source_key text,
  fare_note text,
  fare_verify_for_trip_year boolean not null default true,  -- «tariffa {anno}, da verificare per il {anno del viaggio}»
  -- Regola passeggeri scritta dalla fonte; 'non_indicata' = senza auto il costo è «non calcolabile», mai 0 (design DU9)
  passenger_rule text not null default 'non_indicata' check (passenger_rule in ('gratis', 'a_pagamento', 'non_indicata')),
  passengers_text text,
  free_under_age smallint check (free_under_age is null or free_under_age between 0 and 30),
  child_age_text text,
  adult_age_text text,
  child_cap_amount numeric check (child_cap_amount is null or child_cap_amount >= 0),       -- tetto per bambino con adulto pagante
  return_discount_pct numeric check (return_discount_pct is null or return_discount_pct between 0 and 100),
  fare_rules jsonb not null default '[]'::jsonb check (jsonb_typeof(fare_rules) = 'array'),   -- testi della fonte, mostrati così come sono
  fare_general_rules text,
  source_keys jsonb not null default '[]'::jsonb check (jsonb_typeof(source_keys) = 'array'),
  notes jsonb not null default '[]'::jsonb check (jsonb_typeof(notes) = 'array'),
  entur_line jsonb check (entur_line is null or jsonb_typeof(entur_line) = 'object'),
  checked_at date not null,
  primary key (release_id, route_key),
  foreign key (release_id, region_key) references public.regions (release_id, region_key),
  foreign key (release_id, duration_source_key) references public.ferry_sources (release_id, source_key),
  foreign key (release_id, season_source_key) references public.ferry_sources (release_id, source_key),
  foreign key (release_id, frequency_source_key) references public.ferry_sources (release_id, source_key),
  foreign key (release_id, fare_source_key) references public.ferry_sources (release_id, source_key),
  check ((duration_min is null) = (duration_max is null)),
  check (duration_min is null or duration_min <= duration_max),
  check (duration_min is not null or duration_status = 'assente')
);

create index if not exists ferry_routes_region_idx on public.ferry_routes (release_id, region_key);

-- ---------- Tappe in ordine ----------
-- Coordinate SOLO dal registro nazionale NSR (Entur): se ci sono, ci sono anche l'id NSR e la fonte.

create table if not exists public.ferry_route_stops (
  release_id text not null,
  route_key text not null,
  seq integer not null check (seq > 0),
  name text not null,
  minutes_min integer check (minutes_min is null or minutes_min >= 0),    -- minuti dalla partenza
  minutes_max integer,
  call_type text not null default 'fermata' check (call_type in ('fermata', 'a_richiesta', 'solo_discesa', 'solo_passaggio', 'senza_sbarco')),
  nsr_id text check (nsr_id ~ '^NSR:(StopPlace|Quay):[0-9]+$'),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  coords_source_key text,
  primary key (release_id, route_key, seq),
  foreign key (release_id, route_key) references public.ferry_routes (release_id, route_key) on delete cascade,
  foreign key (release_id, coords_source_key) references public.ferry_sources (release_id, source_key),
  check ((minutes_min is null) = (minutes_max is null)),
  check (minutes_min is null or minutes_min <= minutes_max),
  check ((lat is null) = (lng is null)),
  check (lat is null or (nsr_id is not null and coords_source_key is not null))
);

-- ---------- Luoghi del catalogo collegati (solo per chiave, mai per distanza) ----------

create table if not exists public.ferry_route_places (
  release_id text not null,
  route_key text not null,
  role text not null check (role in ('partenza', 'arrivo', 'lungo')),
  position integer not null default 0,
  place_key text not null,
  primary key (release_id, route_key, role, place_key),
  unique (release_id, route_key, position),
  foreign key (release_id, route_key) references public.ferry_routes (release_id, route_key) on delete cascade,
  foreign key (release_id, place_key) references public.places (release_id, place_key) on delete cascade
);

create index if not exists ferry_route_places_place_idx on public.ferry_route_places (release_id, place_key);

-- ---------- Voci di tariffa ----------
-- Una riga per voce pubblicata: adulto, bambino (con fascia d'età), giovane, senior, famiglia, veicolo fino a 6 m
-- (conducente incluso sì/no/non indicato), pacchetto veicolo + passeggeri, prenotazione facoltativa; andata o
-- andata e ritorno; sottotratta; sabato; periodo. amount null = voce nota ma importo non pubblicato (stato «assente»).

create table if not exists public.ferry_fares (
  release_id text not null,
  route_key text not null,
  position integer not null,
  category text not null check (category in ('adulto', 'bambino', 'giovane', 'senior', 'famiglia', 'veicolo', 'pacchetto_veicolo',
    'prenotazione_adulto', 'prenotazione_bambino', 'prenotazione_veicolo')),
  trip_kind text not null default 'andata' check (trip_kind in ('andata', 'andata_ritorno')),
  amount numeric check (amount is null or amount >= 0),
  currency text not null default 'NOK' check (currency ~ '^[A-Z]{3}$'),
  age_min smallint check (age_min is null or age_min between 0 and 120),
  age_max smallint check (age_max is null or age_max between 0 and 120),
  age_text text,
  vehicle_class text check (vehicle_class in ('fino_6m')),   -- classi norvegesi per lunghezza: «fino a 6 m» (non 5 m)
  driver_included boolean,
  passengers_included smallint check (passengers_included is null or passengers_included >= 0),
  adults_included smallint check (adults_included is null or adults_included >= 0),
  children_included smallint check (children_included is null or children_included >= 0),
  from_stop text,
  to_stop text,
  day_type text check (day_type in ('sabato')),
  period text,
  optional boolean not null default false,              -- es. prenotazione/plassgaranti: non inclusa per default
  fare_year integer check (fare_year is null or fare_year between 2000 and 2100),
  status text not null check (status in ('confermato', 'da_verificare', 'assente')),
  source_key text,
  note text,
  primary key (release_id, route_key, position),
  foreign key (release_id, route_key) references public.ferry_routes (release_id, route_key) on delete cascade,
  foreign key (release_id, source_key) references public.ferry_sources (release_id, source_key),
  check ((amount is null) = (status = 'assente')),
  check (age_min is null or age_max is null or age_min <= age_max),
  check ((from_stop is null) = (to_stop is null))
);

-- ---------- Guardie: una versione pubblicata non cambia (stessa funzione delle altre tabelle del catalogo) ----------

do $$
declare
  t text;
begin
  foreach t in array array['ferry_sources', 'ferry_routes', 'ferry_route_stops', 'ferry_route_places', 'ferry_fares'] loop
    execute format('drop trigger if exists catalog_guard on public.%I', t);
    execute format('create trigger catalog_guard before insert or update or delete on public.%I for each row execute function private.catalog_child_guard()', t);
  end loop;
end $$;

-- ---------- Accesso: sola lettura per authenticated, bozze invisibili, nulla per anon ----------

do $$
declare
  t text;
begin
  foreach t in array array['ferry_sources', 'ferry_routes', 'ferry_route_stops', 'ferry_route_places', 'ferry_fares'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('revoke insert, update, delete, truncate, references, trigger on table public.%I from authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format('drop policy if exists catalogo_lettura on public.%I', t);
    execute format($p$create policy catalogo_lettura on public.%I for select to authenticated
      using (release_id in (select r.release_id from public.catalog_releases r where r.status in ('pubblicata', 'ritirata')))$p$, t);
  end loop;
end $$;

-- ---------- Catalogo completo di una versione: stesse chiavi di prima + ferry_* ----------
-- Chiavi per byte (collate "C") nell'ordine: lo stesso ordine del seed (scripts/seed-catalog.ts, ferryBundle).

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
    'place_links', coalesce((select jsonb_agg(to_jsonb(x) order by x.kind, x.from_place_key, x.to_place_key) from public.place_links x where x.release_id = p_release_id), '[]'::jsonb),
    'ferry_sources', coalesce((select jsonb_agg(to_jsonb(x) order by x.position) from public.ferry_sources x where x.release_id = p_release_id), '[]'::jsonb),
    'ferry_routes', coalesce((select jsonb_agg(to_jsonb(x) order by x.position) from public.ferry_routes x where x.release_id = p_release_id), '[]'::jsonb),
    'ferry_route_stops', coalesce((select jsonb_agg(to_jsonb(x) order by x.route_key collate "C", x.seq) from public.ferry_route_stops x where x.release_id = p_release_id), '[]'::jsonb),
    'ferry_route_places', coalesce((select jsonb_agg(to_jsonb(x) order by x.route_key collate "C", x.position) from public.ferry_route_places x where x.release_id = p_release_id), '[]'::jsonb),
    'ferry_fares', coalesce((select jsonb_agg(to_jsonb(x) order by x.route_key collate "C", x.position) from public.ferry_fares x where x.release_id = p_release_id), '[]'::jsonb)
  )
$$;

revoke all on function public.catalog_bundle(text) from public, anon;
grant execute on function public.catalog_bundle(text) to authenticated;

-- ---------- Controllo finale ----------

do $$
declare
  v_n bigint;
begin
  select count(*) into v_n from pg_tables where schemaname = 'public'
    and tablename in ('ferry_sources', 'ferry_routes', 'ferry_route_stops', 'ferry_route_places', 'ferry_fares') and rowsecurity;
  if v_n <> 5 then raise exception 'Tabelle dei traghetti senza RLS: % su 5', v_n; end if;
  select count(*) into v_n from pg_trigger where tgname = 'catalog_guard' and not tgisinternal
    and tgrelid in ('public.ferry_sources'::regclass, 'public.ferry_routes'::regclass, 'public.ferry_route_stops'::regclass,
                    'public.ferry_route_places'::regclass, 'public.ferry_fares'::regclass);
  if v_n <> 5 then raise exception 'Guardie di immutabilità mancanti sulle tabelle dei traghetti: % su 5', v_n; end if;
  if has_table_privilege('anon', 'public.ferry_routes', 'select') then raise exception 'anon non deve leggere ferry_routes'; end if;
  if has_function_privilege('anon', 'public.catalog_bundle(text)', 'execute') then raise exception 'anon non deve eseguire catalog_bundle'; end if;
  -- NO-1 resta com'era: nessuna riga dei traghetti in versioni senza traghetti già pubblicate
  if (public.catalog_bundle('NO-1') -> 'ferry_routes') is distinct from '[]'::jsonb and exists (select 1 from public.catalog_releases where release_id = 'NO-1') then
    raise exception 'NO-1 non deve avere tratte traghetto';
  end if;
end $$;
