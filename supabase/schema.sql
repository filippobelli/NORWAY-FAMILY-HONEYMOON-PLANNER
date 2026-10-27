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
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trips_touch on public.trips;
create trigger trips_touch before update on public.trips
for each row execute function public.trips_touch_updated_at();

alter table public.trips enable row level security;

drop policy if exists "trips_select_own" on public.trips;
create policy "trips_select_own" on public.trips for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "trips_insert_own" on public.trips;
create policy "trips_insert_own" on public.trips for insert to authenticated with check (owner_id = (select auth.uid()));

drop policy if exists "trips_update_own" on public.trips;
create policy "trips_update_own" on public.trips for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists "trips_delete_own" on public.trips;
create policy "trips_delete_own" on public.trips for delete to authenticated using (owner_id = (select auth.uid()));

-- Registrazioni limitate agli indirizzi autorizzati (applicata il 27/10/2026).
-- Per autorizzare un nuovo indirizzo: insert into private.allowed_emails (email) values ('nome@esempio.it');
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.allowed_emails (
  email text primary key,
  added_at timestamptz not null default now()
);

insert into private.allowed_emails (email)
select lower(email) from auth.users where email is not null
on conflict do nothing;

create or replace function private.block_unlisted_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email is null or not exists (
    select 1 from private.allowed_emails a where a.email = lower(new.email)
  ) then
    raise exception 'Registrazione non consentita';
  end if;
  return new;
end $$;

revoke all on function private.block_unlisted_signup() from public, anon, authenticated;

drop trigger if exists block_unlisted_signup on auth.users;
create trigger block_unlisted_signup before insert on auth.users
for each row execute function private.block_unlisted_signup();
