-- 20261106000100 · Catalogo delle nazioni, versionato.
-- Solo oggetti nuovi: non tocca public.trips, auth né private.allowed_emails. Idempotente.
-- Lettura per gli utenti autenticati (policy in 20261106000300_rls.sql); scrittura solo da migrazioni e seed.
-- Una versione pubblicata non cambia: i trigger di guardia rifiutano modifiche e cancellazioni.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------- Nazioni ----------

create table if not exists public.countries (
  code text primary key check (code ~ '^[A-Z]{2}$'),          -- ISO 3166-1 alfa-2
  name text not null,                                         -- nome in italiano
  names jsonb not null default '{}'::jsonb,                   -- altri nomi per lingua: {"en": "Norway"}
  currency text not null check (currency ~ '^[A-Z]{3}$'),     -- ISO 4217
  timezone text not null,                                     -- IANA, uno solo per nazione
  language text not null check (language ~ '^[a-z]{2,3}(-[A-Za-z0-9]+)*$'), -- BCP 47
  created_at timestamptz not null default now()
);

-- ---------- Versioni del catalogo ----------

create table if not exists public.catalog_releases (
  release_id text primary key check (release_id ~ '^[A-Z]{2}-[1-9][0-9]*$'),
  country_code text not null references public.countries (code),
  version integer not null check (version > 0),
  status text not null default 'bozza' check (status in ('bozza', 'pubblicata', 'ritirata')),
  data_checked_until date,                 -- data della verifica più recente nelle fonti
  published_at timestamptz,
  notes text not null default '',
  source_notes jsonb not null default '[]'::jsonb,
  -- Parametri di stima del configuratore per la nazione (non sono dati verificati)
  road_factor numeric check (road_factor is null or road_factor >= 1),
  avg_kmh numeric check (avg_kmh is null or avg_kmh > 0),
  road_calibrated boolean not null default false,
  road_note text not null default '',
  airport_radius_km numeric check (airport_radius_km is null or airport_radius_km > 0),
  previous_release_id text references public.catalog_releases (release_id),
  created_at timestamptz not null default now(),
  unique (country_code, version),
  unique (release_id, country_code),
  check (release_id = country_code || '-' || version::text),
  check (status = 'bozza' or published_at is not null)
);

create index if not exists catalog_releases_country_idx on public.catalog_releases (country_code, status, version desc);

-- ---------- Chiavi stabili dei luoghi ----------
-- Una chiave appartiene a una sola nazione e vale per tutte le sue versioni.
-- Norvegia: chiavi storiche dei file (es. 'oslo'). Nazioni nuove: prefisso ISO minuscolo (es. 'se-stoccolma').

create table if not exists public.place_keys (
  place_key text primary key check (place_key ~ '^[a-z0-9][a-z0-9-]*$'),
  country_code text not null references public.countries (code),
  created_at timestamptz not null default now()
);

-- ---------- Regioni ----------

create table if not exists public.regions (
  release_id text not null references public.catalog_releases (release_id) on delete cascade,
  region_key text not null check (region_key ~ '^[a-z0-9][a-z0-9-]*$'),
  position integer not null default 0,
  name text not null,                                      -- italiano
  texts jsonb not null default '{}'::jsonb,                -- altre lingue
  areas jsonb not null default '[]'::jsonb,                -- [{code, name, rings: [[[lat, lng], ...]]}]
  sources jsonb not null default '[]'::jsonb,              -- [{label, url, checkedAt, license}]
  primary key (release_id, region_key)
);

-- ---------- Luoghi (città, attrazioni, aeroporti, porti, aree) ----------

create table if not exists public.places (
  release_id text not null references public.catalog_releases (release_id) on delete cascade,
  place_key text not null references public.place_keys (place_key),
  category text not null check (category in (
    'citta', 'fiordi', 'natura', 'strade', 'isole', 'treni', 'fauna', 'musei', 'parchi', 'stagionali', 'aeroporti', 'porti')),
  region_key text,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  coords_status text not null check (coords_status in ('approssimative', 'verificate')),
  local_name text,
  visit_hours_min numeric,
  visit_hours_max numeric,
  difficulty text check (difficulty in ('facile', 'media', 'impegnativa')),
  kid_score smallint check (kid_score between 1 and 3),
  reliability text not null default 'da_verificare' check (reliability in ('da_verificare', 'verificato')),
  is_base boolean not null default false,       -- adatto come base per dormire (configuratore)
  day_visit boolean not null default true,      -- visitabile in un giorno preciso (no fenomeni, aree estese)
  iata text check (iata ~ '^[A-Z]{3}$'),
  official_url text,
  official_kind text check (official_kind in ('attrazione', 'gestore', 'ente')),
  official_via text,
  wikidata_qid text check (wikidata_qid ~ '^Q[0-9]+$'),
  wiki_it text,
  wiki_en text,
  commons_image text,
  -- Scheda verificata (attrazioni)
  base_place_key text,
  address text,
  setting text check (setting in ('al_coperto', 'all_aperto', 'misto')),
  booking_advice text check (booking_advice in ('consigliata', 'non_indicata')),
  booking_url text,
  hours_published boolean,
  details_wikidata_qid text check (details_wikidata_qid ~ '^Q[0-9]+$'),
  details_checked_at date,
  primary key (release_id, place_key),
  foreign key (release_id, region_key) references public.regions (release_id, region_key),
  check (visit_hours_min is null or visit_hours_max is null or visit_hours_min <= visit_hours_max)
);

create index if not exists places_key_idx on public.places (place_key);
create index if not exists places_category_idx on public.places (release_id, category);
create index if not exists places_region_idx on public.places (release_id, region_key);

-- Testi per lingua: l'italiano è richiesto per pubblicare (controllo nel seed)
create table if not exists public.place_texts (
  release_id text not null,
  place_key text not null,
  lang text not null check (lang ~ '^[a-z]{2,3}(-[A-Za-z0-9]+)*$'),
  name text not null,
  description text not null default '',
  access text not null default '',
  season text not null default '',
  august_note text,
  area text,
  booking_note text,
  seasonal_note text,
  outside_note text,
  primary key (release_id, place_key, lang),
  foreign key (release_id, place_key) references public.places (release_id, place_key) on delete cascade
);

-- Fonti per campo: fonte, data di verifica, licenza
create table if not exists public.place_sources (
  release_id text not null,
  place_key text not null,
  field text not null check (field in ('coordinate', 'scheda', 'sito_ufficiale', 'wikidata', 'testi', 'generale')),
  position integer not null default 0,
  label text not null,
  url text,
  checked_at date,
  license text,
  method text,
  note text,
  primary key (release_id, place_key, field, position),
  foreign key (release_id, place_key) references public.places (release_id, place_key) on delete cascade
);

-- ---------- Operatori, crociere, rotte e collegamenti ----------

create table if not exists public.operators (
  release_id text not null references public.catalog_releases (release_id) on delete cascade,
  operator_key text not null check (operator_key ~ '^[a-z0-9][a-z0-9-]*$'),
  position integer not null default 0,
  name text not null,                      -- come nei viaggi salvati (CoastalOption.operator)
  kind text not null check (kind in ('nave_costiera', 'traghetto', 'treno', 'bus', 'altro')),
  url text,
  sources jsonb not null default '[]'::jsonb,
  texts jsonb not null default '{}'::jsonb check (texts ? 'it'),   -- {"it": {"facts": [...]}}
  primary key (release_id, operator_key),
  unique (release_id, name)
);

create table if not exists public.voyages (
  release_id text not null,
  voyage_key text not null,                 -- id attuale (CoastalOption.catalogId)
  position integer not null default 0,
  operator_key text not null,
  direction text not null check (direction in ('nord', 'sud')),
  from_port text not null,
  to_port text not null,
  from_place_key text,
  to_place_key text,
  round_trip boolean not null default false,
  days integer not null check (days > 0),
  port_calls integer,
  meals text not null check (meals in ('nessuno', 'mezza_pensione', 'pensione_completa', 'a_la_carte', 'da_definire')),
  price_currency text not null default 'EUR' check (price_currency ~ '^[A-Z]{3}$'),
  prices jsonb not null default '[]'::jsonb,              -- [{cabin, perPerson}] come pubblicati
  price_valid_for text not null default '',
  summer_price boolean not null default false,
  url text not null,
  checked_at date not null,
  texts jsonb not null default '{}'::jsonb check (texts ? 'it'),
  primary key (release_id, voyage_key),
  foreign key (release_id, operator_key) references public.operators (release_id, operator_key) on delete cascade,
  foreign key (release_id, from_place_key) references public.places (release_id, place_key),
  foreign key (release_id, to_place_key) references public.places (release_id, place_key)
);

create table if not exists public.route_ports (
  release_id text not null,
  route_key text not null check (route_key ~ '^[a-z0-9][a-z0-9-]*$'),
  seq integer not null,
  place_key text not null,
  northbound_only boolean not null default false,
  seasonal boolean not null default false,
  primary key (release_id, route_key, seq),
  unique (release_id, route_key, place_key),
  foreign key (release_id, place_key) references public.places (release_id, place_key) on delete cascade
);

create table if not exists public.place_links (
  release_id text not null,
  kind text not null check (kind in ('treno', 'traghetto', 'bus', 'volo')),
  from_place_key text not null,
  to_place_key text not null,
  label text not null,
  note text not null default '',
  sources jsonb not null default '[]'::jsonb,
  primary key (release_id, kind, from_place_key, to_place_key),
  check (from_place_key collate "C" < to_place_key collate "C"),   -- coppia non ordinata, scritta una sola volta (ordine per byte)
  foreign key (release_id, from_place_key) references public.places (release_id, place_key) on delete cascade,
  foreign key (release_id, to_place_key) references public.places (release_id, place_key) on delete cascade
);

-- Aeroporti di partenza da casa (non legati a una nazione del catalogo)
create table if not exists public.home_airports (
  iata text primary key check (iata ~ '^[A-Z]{3}$'),
  name text not null,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  position integer not null default 0,
  default_rank smallint                         -- ordine tra i predefiniti; null = non predefinito
);

-- ---------- Guardie: una versione pubblicata non cambia ----------
-- Eccezione solo per manutenzione esplicita: set local nfhp.catalogo_admin = 'on';

create or replace function private.catalog_release_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if coalesce(current_setting('nfhp.catalogo_admin', true), '') = 'on' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op = 'DELETE' then
    if old.status <> 'bozza' then
      raise exception 'La versione % del catalogo è pubblicata: non si cancella', old.release_id;
    end if;
    return old;
  end if;
  if old.status = 'bozza' then
    return new;
  end if;
  if (to_jsonb(new) - array['status', 'notes']) is distinct from (to_jsonb(old) - array['status', 'notes'])
     or not (new.status = old.status or (old.status = 'pubblicata' and new.status = 'ritirata')) then
    raise exception 'La versione % del catalogo è pubblicata: si può solo ritirare. Per cambiare i dati crea una versione nuova.', old.release_id;
  end if;
  return new;
end $$;

create or replace function private.catalog_child_guard()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_status text;
begin
  if coalesce(current_setting('nfhp.catalogo_admin', true), '') = 'on' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op in ('UPDATE', 'DELETE') then
    select r.status into v_status from public.catalog_releases r where r.release_id = old.release_id;
    -- v_status nullo: la versione (bozza) è in cancellazione e le righe seguono a cascata
    if v_status is not null and v_status <> 'bozza' then
      raise exception 'La versione % del catalogo è pubblicata: i suoi dati non cambiano', old.release_id;
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  select r.status into v_status from public.catalog_releases r where r.release_id = new.release_id;
  if v_status is distinct from 'bozza' then
    raise exception 'Si possono aggiungere dati solo a una versione in bozza (%: %)', new.release_id, coalesce(v_status, 'assente');
  end if;
  return new;
end $$;

revoke all on function private.catalog_release_guard() from public, anon, authenticated;
revoke all on function private.catalog_child_guard() from public, anon, authenticated;

drop trigger if exists catalog_release_guard on public.catalog_releases;
create trigger catalog_release_guard before update or delete on public.catalog_releases
for each row execute function private.catalog_release_guard();

do $$
declare
  t text;
begin
  foreach t in array array['regions', 'places', 'place_texts', 'place_sources', 'operators', 'voyages', 'route_ports', 'place_links'] loop
    execute format('drop trigger if exists catalog_guard on public.%I', t);
    execute format('create trigger catalog_guard before insert or update or delete on public.%I for each row execute function private.catalog_child_guard()', t);
  end loop;
end $$;

-- ---------- Catalogo completo di una versione, in una sola richiesta (download per l'uso offline) ----------

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
