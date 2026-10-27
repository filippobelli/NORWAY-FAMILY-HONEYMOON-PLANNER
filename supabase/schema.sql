-- Norway Family Honeymoon Planner — schema Supabase (Milestone 1)
-- Da eseguire una sola volta nello SQL Editor del progetto Supabase.
-- Il viaggio è salvato come documento JSONB versionato (schema_version) con policy RLS per utente.
-- La normalizzazione in tabelle separate (tappe, tratti, alloggi, spese) è prevista nella Milestone 6.

create table if not exists public.trips (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'Viaggio',
  schema_version integer not null default 1,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trips_owner_idx on public.trips (owner_id, updated_at desc);

create or replace function public.trips_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trips_touch on public.trips;
create trigger trips_touch before update on public.trips
for each row execute function public.trips_touch_updated_at();

alter table public.trips enable row level security;

drop policy if exists "trips_select_own" on public.trips;
create policy "trips_select_own" on public.trips for select to authenticated using (owner_id = auth.uid());

drop policy if exists "trips_insert_own" on public.trips;
create policy "trips_insert_own" on public.trips for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "trips_update_own" on public.trips;
create policy "trips_update_own" on public.trips for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "trips_delete_own" on public.trips;
create policy "trips_delete_own" on public.trips for delete to authenticated using (owner_id = auth.uid());
