-- 20261106000200 · Viaggio per righe, preferenze e contesto per utente.
-- Su public.trips solo colonne NUOVE con valore predefinito (nessuna riscrittura dei dati, nessun drop):
-- la colonna data e i viaggi esistenti restano come sono. Idempotente.
-- Convenzioni:
-- - id delle entità dell'app come text (i documenti esistenti possono avere id non UUID, es. «…-cloud», «orfana-3»);
-- - date e ore scritte dall'app (createdAt, checkedAt, startDate…) come text: si ricostruiscono identiche;
-- - Money in due colonne (importo numeric + valuta ISO 4217);
-- - campi sconosciuti di ogni entità in extra (jsonb): non si perdono;
-- - colonne di sincronizzazione aggiunte a tutte le tabelle in fondo al file.

-- ---------- trips: colonne nuove ----------

alter table public.trips
  add column if not exists storage_format text not null default 'documento' check (storage_format in ('documento', 'righe')),
  add column if not exists start_date text,
  add column if not exists date_tentative boolean,
  add column if not exists participants jsonb,
  add column if not exists useful_info text,
  add column if not exists settings jsonb,
  add column if not exists active_version_id text,
  add column if not exists base_currency text not null default 'EUR' check (base_currency ~ '^[A-Z]{3}$'),
  add column if not exists app_updated_at text,
  add column if not exists imported_at timestamptz,
  add column if not exists rev bigint not null default 1,
  add column if not exists seq bigint not null default 0,
  add column if not exists updated_by uuid,
  add column if not exists deleted_at timestamptz,
  add column if not exists last_mutation_id uuid,
  add column if not exists device_id text,
  add column if not exists extra jsonb not null default '{}'::jsonb;

comment on column public.trips.storage_format is
  'documento = il viaggio vive in data (app attuale); righe = il viaggio vive nelle tabelle, data resta come copia.';

-- Contatore per viaggio: ordina le modifiche nell'ordine di conferma (vedi 20261106000400_sincronizzazione.sql)
create table if not exists public.trip_sync_state (
  trip_id uuid primary key,
  seq bigint not null default 0
);

-- ---------- Nazioni, cambi, versioni ----------

create table if not exists public.trip_countries (
  trip_id uuid not null references public.trips (id) on delete cascade,
  country_code text not null references public.countries (code),
  release_id text not null,
  position integer not null default 0,
  -- Carburante per nazione (prezzo nella valuta indicata; aggiornamento automatico solo dove c'è una fonte ufficiale)
  fuel_price numeric check (fuel_price is null or fuel_price >= 0),
  fuel_currency text check (fuel_currency ~ '^[A-Z]{3}$'),
  fuel_auto boolean,
  fuel_period text,
  fuel_source text,
  fuel_fetched_at text,
  primary key (trip_id, country_code),
  foreign key (release_id, country_code) references public.catalog_releases (release_id, country_code)
);

create index if not exists trip_countries_release_idx on public.trip_countries (release_id);

create table if not exists public.trip_rates (
  trip_id uuid not null references public.trips (id) on delete cascade,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  per_eur numeric check (per_eur is null or per_eur > 0),    -- unità di valuta per 1 EUR
  rate_date text,
  note text not null default '',
  source text,
  auto boolean not null default true,
  fetched_at text,
  primary key (trip_id, currency)
);

-- Versioni del percorso (Scenario). Il piano della versione attiva è nelle righe con version_id = trips.active_version_id;
-- start_date e coastal_selected valgono solo per le versioni non attive (per l'attiva: trips.start_date e coastal_options.selected).
create table if not exists public.trip_versions (
  trip_id uuid not null references public.trips (id) on delete cascade,
  id text not null,
  position integer not null default 0,
  name text not null default '',
  kind text not null default 'altro' check (kind in ('auto_hytte', 'auto_traghetti_costiera', 'misto_treni', 'altro')),
  notes text not null default '',
  app_updated_at text,
  start_date text,
  coastal_selected text[],
  plan_has_flights boolean,           -- PlanSnapshot.flights presente (assente = restano i voli attuali)
  primary key (trip_id, id)
);

-- ---------- Piano (per versione) ----------

create table if not exists public.stops (
  trip_id uuid not null,
  version_id text not null,
  id text not null,
  position integer not null default 0,
  kind text not null default 'luogo' check (kind in ('luogo', 'a_bordo')),
  place_key text,                     -- Stop.destinationId (nessuna FK: il viaggio sopravvive al catalogo)
  country_code text references public.countries (code),
  name text not null default '',
  lat double precision,
  lng double precision,
  nights integer not null default 0,
  accommodation_id text,
  notes text not null default '',
  weather_plan_b text not null default '',
  placed_from text,
  primary key (trip_id, version_id, id),
  foreign key (trip_id, version_id) references public.trip_versions (trip_id, id) on delete cascade
);

create table if not exists public.stop_ideas (
  trip_id uuid not null,
  version_id text not null,
  stop_id text not null,
  place_key text not null,
  position integer not null default 0,
  primary key (trip_id, version_id, stop_id, place_key),
  foreign key (trip_id, version_id, stop_id) references public.stops (trip_id, version_id, id) on delete cascade
);

create table if not exists public.legs (
  trip_id uuid not null,
  version_id text not null,
  id text not null,
  position integer not null default 0,
  from_stop_id text not null,
  to_stop_id text not null,
  calculated_at text,
  routing_error text,
  primary key (trip_id, version_id, id),
  foreign key (trip_id, version_id) references public.trip_versions (trip_id, id) on delete cascade
);

create table if not exists public.segments (
  trip_id uuid not null,
  version_id text not null,
  id text not null,
  leg_id text not null,
  position integer not null default 0,
  mode text not null check (mode in ('strada', 'traghetto', 'costiera', 'treno', 'bus', 'aereo', 'non_calcolato')),
  label text not null default '',
  distance_km double precision,
  duration_min double precision,
  wait_min double precision,
  departure_time text,
  cost_amount numeric,
  cost_currency text check (cost_currency ~ '^[A-Z]{3}$'),
  cost_status text not null default 'da_verificare' check (cost_status in ('confermato', 'stimato', 'da_verificare', 'prenotato', 'pagato')),
  source jsonb,
  status text not null default 'da_verificare' check (status in ('confermato', 'stimato', 'da_verificare', 'prenotato', 'pagato')),
  coastal_option_id text,
  flight_id text,
  geometry jsonb,                     -- [[lat, lng], ...]: si legge sempre intera, resta JSONB
  note text,
  verification jsonb,
  verification_state text generated always as (verification ->> 'state') stored,
  primary key (trip_id, version_id, id),
  foreign key (trip_id, version_id, leg_id) references public.legs (trip_id, version_id, id) on delete cascade,
  check ((cost_amount is null) = (cost_currency is null))
);

create table if not exists public.days (
  trip_id uuid not null,
  version_id text not null,
  day_key text not null,              -- «{stopId}#{notte}», «partenza», «orfana-N»
  notes text not null default '',
  plan_b text not null default '',
  primary key (trip_id, version_id, day_key),
  foreign key (trip_id, version_id) references public.trip_versions (trip_id, id) on delete cascade
);

create table if not exists public.activities (
  trip_id uuid not null,
  version_id text not null,
  id text not null,
  day_key text not null,
  position integer not null default 0,
  title text not null default '',
  place_key text,                     -- vuoto = attività personale
  duration_min double precision,
  cost_amount numeric,
  cost_currency text check (cost_currency ~ '^[A-Z]{3}$'),
  cost_status text not null default 'da_verificare' check (cost_status in ('confermato', 'stimato', 'da_verificare', 'prenotato', 'pagato')),
  verification jsonb,
  verification_state text generated always as (verification ->> 'state') stored,
  primary key (trip_id, version_id, id),
  foreign key (trip_id, version_id, day_key) references public.days (trip_id, version_id, day_key) on delete cascade,
  check ((cost_amount is null) = (cost_currency is null))
);

create index if not exists activities_place_idx on public.activities (trip_id, place_key) where place_key is not null;

create table if not exists public.budget_items (
  trip_id uuid not null,
  version_id text not null,
  id text not null,
  position integer not null default 0,
  category text not null check (category in ('voli', 'bagagli_transfer', 'noleggio_auto', 'carburante_pedaggi', 'traghetti',
    'costiera', 'treni_bus', 'alloggi', 'pasti', 'attrazioni', 'extra_imprevisti')),
  label text not null default '',
  amount numeric not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'da_verificare' check (status in ('confermato', 'stimato', 'da_verificare', 'prenotato', 'pagato')),
  source jsonb,
  notes text not null default '',
  primary key (trip_id, version_id, id),
  foreign key (trip_id, version_id) references public.trip_versions (trip_id, id) on delete cascade
);

create table if not exists public.flights (
  trip_id uuid not null,
  version_id text not null,
  id text not null,
  position integer not null default 0,
  direction text not null check (direction in ('andata', 'ritorno', 'interno')),
  from_airport text not null default '',
  to_airport text not null default '',
  date text,
  departure_time text,
  arrival_time text,
  airline text not null default '',
  flight_number text not null default '',
  stops_count integer,
  baggage text not null default '',
  price_amount numeric,
  price_currency text check (price_currency ~ '^[A-Z]{3}$'),
  price_status text not null default 'da_verificare' check (price_status in ('confermato', 'stimato', 'da_verificare', 'prenotato', 'pagato')),
  selected boolean not null default false,
  source jsonb,
  notes text not null default '',
  kept_issues text[],
  verification jsonb,
  verification_state text generated always as (verification ->> 'state') stored,
  primary key (trip_id, version_id, id),
  foreign key (trip_id, version_id) references public.trip_versions (trip_id, id) on delete cascade,
  check ((price_amount is null) = (price_currency is null))
);

-- ---------- Elementi condivisi tra le versioni ----------

create table if not exists public.accommodations (
  trip_id uuid not null references public.trips (id) on delete cascade,
  id text not null,
  position integer not null default 0,
  name text not null default '',
  type text not null default 'altro' check (type in ('hytte', 'hytte_campeggio', 'hotel', 'appartamento', 'altro')),
  locality text not null default '',
  lat double precision,
  lng double precision,
  url text,
  price_per_night_amount numeric,
  price_per_night_currency text check (price_per_night_currency ~ '^[A-Z]{3}$'),
  price_status text not null default 'da_verificare' check (price_status in ('confermato', 'stimato', 'da_verificare', 'prenotato', 'pagato')),
  cleaning_fee_amount numeric,
  cleaning_fee_currency text check (cleaning_fee_currency ~ '^[A-Z]{3}$'),
  linen_fee_amount numeric,
  linen_fee_currency text check (linen_fee_currency ~ '^[A-Z]{3}$'),
  capacity integer,
  beds text not null default '',
  bathroom text not null default 'non_noto' check (bathroom in ('privato', 'condiviso', 'non_noto')),
  kitchen text not null default 'non_noto' check (kitchen in ('si', 'no', 'non_noto')),
  parking text not null default 'non_noto' check (parking in ('si', 'no', 'non_noto')),
  cancellation text not null default '',
  status text not null default 'individuata' check (status in ('individuata', 'disponibile', 'opzionata', 'prenotata', 'annullata')),
  stop_id text,
  source jsonb,
  notes text not null default '',
  verification jsonb,
  verification_state text generated always as (verification ->> 'state') stored,
  address text,
  phone text,
  primary key (trip_id, id)
);

create table if not exists public.coastal_options (
  trip_id uuid not null references public.trips (id) on delete cascade,
  id text not null,
  position integer not null default 0,
  operator text not null,                 -- nome dell'operatore (operators.name)
  direction text not null check (direction in ('nord', 'sud')),
  from_port text not null default '',
  to_port text not null default '',
  date text,
  departure_time text,
  arrival_time text,
  duration_hours double precision,
  nights_onboard integer not null default 0,
  cabin text not null default '',
  with_car boolean not null default false,
  meals text not null default 'da_definire' check (meals in ('nessuno', 'mezza_pensione', 'pensione_completa', 'a_la_carte', 'da_definire')),
  price_amount numeric,
  price_currency text check (price_currency ~ '^[A-Z]{3}$'),
  price_status text not null default 'da_verificare' check (price_status in ('confermato', 'stimato', 'da_verificare', 'prenotato', 'pagato')),
  extras_amount numeric,
  extras_currency text check (extras_currency ~ '^[A-Z]{3}$'),
  child_rules text not null default '',
  change_policy text not null default '',
  notes text not null default '',
  source jsonb,
  verification jsonb,
  verification_state text generated always as (verification ->> 'state') stored,
  selected boolean not null default false,   -- scelta della versione attiva
  catalog_id text,                           -- voyages.voyage_key
  primary key (trip_id, id)
);

create table if not exists public.favorites (
  trip_id uuid not null references public.trips (id) on delete cascade,
  place_key text not null,
  position integer not null default 0,
  primary key (trip_id, place_key)
);

-- ---------- Fuori dal piano: diario, stati di visita, registro ----------

create table if not exists public.diary_entries (
  trip_id uuid not null references public.trips (id) on delete cascade,
  id text not null,
  position integer not null default 0,
  app_created_at text not null,
  app_updated_at text,
  local_date text,
  local_time text,
  tz_offset_min integer,
  text text not null default '',
  day_date text,
  stop_id text,
  stop_name text,
  app_deleted_at text,                    -- DiaryEntry.deletedAt (voce eliminata dall'utente, resta per l'unione)
  primary key (trip_id, id)
);

create table if not exists public.diary_attachments (
  trip_id uuid not null,
  id text not null,                       -- nome del file nello Storage: niente doppioni nei reinvii
  entry_id text not null,
  position integer not null default 0,
  name text not null default '',
  mime_type text not null default '',
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  state text not null default 'solo_dispositivo' check (state in ('solo_dispositivo', 'errore', 'nel_cloud')),
  error text,
  storage_path text,                      -- {owner_id}/{trip_id}/{id} dopo il caricamento confermato
  uploaded_at timestamptz,
  primary key (trip_id, id),
  foreign key (trip_id, entry_id) references public.diary_entries (trip_id, id) on delete cascade,
  check (storage_path is null or size_bytes <= 10485760),
  check (storage_path is null or mime_type = 'application/pdf' or mime_type like 'image/%')
);

create table if not exists public.visit_states (
  trip_id uuid not null references public.trips (id) on delete cascade,
  target_kind text not null check (target_kind in ('tappa', 'attivita')),
  target_id text not null,
  state text not null,
  at text,
  primary key (trip_id, target_kind, target_id),
  check ((target_kind = 'tappa' and state in ('in_corso', 'visitata', 'saltata'))
      or (target_kind = 'attivita' and state in ('fatta', 'saltata')))
);

create table if not exists public.plan_log (
  trip_id uuid not null references public.trips (id) on delete cascade,
  id text not null,
  position integer not null default 0,
  at text,
  label text not null default '',
  from_version text,
  to_version text,
  primary key (trip_id, id)
);

-- ---------- Condivisione (predisposta, non attiva) ----------

create table if not exists public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'lettore' check (role in ('lettore', 'editore')),
  invited_by uuid default auth.uid(),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (trip_id, user_id)
);

create index if not exists trip_members_user_idx on public.trip_members (user_id);

-- ---------- Registro degli invii (niente doppioni con i reinvii) ----------

create table if not exists public.sync_mutations (
  trip_id uuid not null references public.trips (id) on delete cascade,
  mutation_id uuid not null,
  user_id uuid not null default auth.uid(),
  device_id text,
  applied_at timestamptz not null default now(),
  result jsonb not null,
  primary key (trip_id, mutation_id)
);

create index if not exists sync_mutations_applied_idx on public.sync_mutations (applied_at);

-- ---------- Passaggio dal documento alle righe ----------

create table if not exists public.trip_imports (
  trip_id uuid primary key references public.trips (id) on delete cascade,
  owner_id uuid not null default auth.uid(),
  status text not null default 'in_corso' check (status in ('in_corso', 'verificata', 'fallita', 'annullata')),
  source_updated_at timestamptz,
  source_schema_version integer,
  source_sha256 text,
  app_version text,
  row_counts jsonb not null default '{}'::jsonb,
  unresolved jsonb not null default '[]'::jsonb,   -- riferimenti al catalogo non trovati: elencati, mai scartati
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  verified_at timestamptz
);

-- ---------- Preferenze, contesto e dispositivi ----------

create table if not exists public.user_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_context (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  last_trip_id uuid references public.trips (id) on delete set null,
  last_planning text,                 -- nfhp.ui.lastPlanning
  travel_context jsonb,               -- nfhp.ui.travel
  activation_notice jsonb,            -- nfhp.ui.activation
  planner_selection jsonb,            -- nfhp.planner.ui → sel
  configurator jsonb,                 -- nfhp.configurator.v1
  device_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_devices (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  device_id text not null check (length(device_id) between 8 and 64),
  label text not null default '',
  mode text check (mode in ('planning', 'travel')),   -- null = automatica dalla larghezza dello schermo
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, device_id)
);

do $$
declare
  t text;
begin
  foreach t in array array['user_preferences', 'user_context', 'user_devices'] loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.trips_touch_updated_at()', t);
  end loop;
end $$;

-- ---------- Colonne di sincronizzazione su tutte le tabelle del viaggio ----------

do $$
declare
  t text;
begin
  foreach t in array array['trip_countries', 'trip_rates', 'trip_versions', 'stops', 'stop_ideas', 'legs', 'segments', 'days',
    'activities', 'budget_items', 'flights', 'accommodations', 'coastal_options', 'favorites', 'diary_entries',
    'diary_attachments', 'visit_states', 'plan_log'] loop
    execute format($f$alter table public.%I
      add column if not exists rev bigint not null default 1,
      add column if not exists seq bigint not null default 0,
      add column if not exists created_at timestamptz not null default now(),
      add column if not exists updated_at timestamptz not null default now(),
      add column if not exists updated_by uuid,
      add column if not exists deleted_at timestamptz,
      add column if not exists last_mutation_id uuid,
      add column if not exists device_id text,
      add column if not exists extra jsonb not null default '{}'::jsonb$f$, t);
    execute format('create index if not exists %I on public.%I (trip_id, seq)', t || '_seq_idx', t);
  end loop;
end $$;
