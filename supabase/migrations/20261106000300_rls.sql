-- 20261106000300 · Accesso: proprietario e membri del viaggio, cataloghi in sola lettura, nessun accesso anon.
-- Su public.trips le policy esistenti (trips_*_own) NON si toccano: si AGGIUNGONO policy per i membri.
-- Le policy permissive si sommano (OR): il proprietario vede e modifica esattamente quello che vedeva prima.
-- Idempotente: ogni policy nuova si ricrea con drop policy if exists sul proprio nome (solo nomi nuovi).

-- ---------- Funzioni di controllo (security definer, search_path vuoto, come lo schema attuale) ----------

create or replace function public.is_trip_owner(p_trip uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.trips t where t.id = p_trip and t.owner_id = (select auth.uid()));
$$;

create or replace function public.can_read_trip(p_trip uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.trips t where t.id = p_trip and t.owner_id = (select auth.uid()))
      or exists (select 1 from public.trip_members m
                 where m.trip_id = p_trip and m.user_id = (select auth.uid()) and m.accepted_at is not null);
$$;

create or replace function public.can_edit_trip(p_trip uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.trips t where t.id = p_trip and t.owner_id = (select auth.uid()))
      or exists (select 1 from public.trip_members m
                 where m.trip_id = p_trip and m.user_id = (select auth.uid()) and m.accepted_at is not null and m.role = 'editore');
$$;

revoke all on function public.is_trip_owner(uuid) from public, anon;
revoke all on function public.can_read_trip(uuid) from public, anon;
revoke all on function public.can_edit_trip(uuid) from public, anon;
grant execute on function public.is_trip_owner(uuid) to authenticated;
grant execute on function public.can_read_trip(uuid) to authenticated;
grant execute on function public.can_edit_trip(uuid) to authenticated;

revoke all on function public.catalog_bundle(text) from public, anon;
grant execute on function public.catalog_bundle(text) to authenticated;

-- ---------- trips: policy aggiuntive per i membri ----------

drop policy if exists "trips_select_member" on public.trips;
create policy "trips_select_member" on public.trips for select to authenticated
  using (public.can_read_trip(id));

drop policy if exists "trips_update_member" on public.trips;
create policy "trips_update_member" on public.trips for update to authenticated
  using (public.can_edit_trip(id)) with check (public.can_edit_trip(id));

-- ---------- Cataloghi: sola lettura per authenticated ----------

do $$
declare
  t text;
begin
  foreach t in array array['countries', 'catalog_releases', 'place_keys', 'regions', 'places', 'place_texts', 'place_sources',
    'operators', 'voyages', 'route_ports', 'place_links', 'home_airports'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('revoke insert, update, delete, truncate, references, trigger on table public.%I from authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format('drop policy if exists catalogo_lettura on public.%I', t);
  end loop;
end $$;

create policy catalogo_lettura on public.countries for select to authenticated using (true);
create policy catalogo_lettura on public.place_keys for select to authenticated using (true);
create policy catalogo_lettura on public.home_airports for select to authenticated using (true);
-- Le bozze non si vedono dall'app
create policy catalogo_lettura on public.catalog_releases for select to authenticated using (status in ('pubblicata', 'ritirata'));

do $$
declare
  t text;
begin
  foreach t in array array['regions', 'places', 'place_texts', 'place_sources', 'operators', 'voyages', 'route_ports', 'place_links'] loop
    execute format($p$create policy catalogo_lettura on public.%I for select to authenticated
      using (release_id in (select r.release_id from public.catalog_releases r where r.status in ('pubblicata', 'ritirata')))$p$, t);
  end loop;
end $$;

-- ---------- Tabelle del viaggio: lettura per chi può leggere, scrittura per chi può modificare ----------
-- Niente DELETE: le cancellazioni sono tombstone (deleted_at). Le righe spariscono solo con il viaggio (cascade).

do $$
declare
  t text;
begin
  foreach t in array array['trip_countries', 'trip_rates', 'trip_versions', 'stops', 'stop_ideas', 'legs', 'segments', 'days',
    'activities', 'budget_items', 'flights', 'accommodations', 'coastal_options', 'favorites', 'diary_entries',
    'diary_attachments', 'visit_states', 'plan_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('revoke delete, truncate, references, trigger on table public.%I from authenticated', t);
    execute format('grant select, insert, update on table public.%I to authenticated', t);
    execute format('drop policy if exists viaggio_lettura on public.%I', t);
    execute format('drop policy if exists viaggio_inserimento on public.%I', t);
    execute format('drop policy if exists viaggio_modifica on public.%I', t);
    execute format('create policy viaggio_lettura on public.%I for select to authenticated using (public.can_read_trip(trip_id))', t);
    execute format('create policy viaggio_inserimento on public.%I for insert to authenticated with check (public.can_edit_trip(trip_id))', t);
    execute format('create policy viaggio_modifica on public.%I for update to authenticated using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id))', t);
  end loop;
end $$;

-- Contatore: solo lettura; lo scrive il trigger di sincronizzazione (security definer)
alter table public.trip_sync_state enable row level security;
revoke all on table public.trip_sync_state from anon;
revoke insert, update, delete, truncate, references, trigger on table public.trip_sync_state from authenticated;
grant select on table public.trip_sync_state to authenticated;
drop policy if exists viaggio_lettura on public.trip_sync_state;
create policy viaggio_lettura on public.trip_sync_state for select to authenticated using (public.can_read_trip(trip_id));

-- Registro degli invii
alter table public.sync_mutations enable row level security;
revoke all on table public.sync_mutations from anon;
revoke update, delete, truncate, references, trigger on table public.sync_mutations from authenticated;
grant select, insert on table public.sync_mutations to authenticated;
drop policy if exists invii_lettura on public.sync_mutations;
drop policy if exists invii_inserimento on public.sync_mutations;
create policy invii_lettura on public.sync_mutations for select to authenticated using (public.can_read_trip(trip_id));
create policy invii_inserimento on public.sync_mutations for insert to authenticated
  with check (public.can_edit_trip(trip_id) and user_id = (select auth.uid()));

-- Passaggio dal documento: solo il proprietario
alter table public.trip_imports enable row level security;
revoke all on table public.trip_imports from anon;
revoke delete, truncate, references, trigger on table public.trip_imports from authenticated;
grant select, insert, update on table public.trip_imports to authenticated;
drop policy if exists passaggio_proprietario on public.trip_imports;
create policy passaggio_proprietario on public.trip_imports for all to authenticated
  using (public.is_trip_owner(trip_id) and owner_id = (select auth.uid()))
  with check (public.is_trip_owner(trip_id) and owner_id = (select auth.uid()));

-- Membri: li vede il membro stesso e il proprietario; li gestisce solo il proprietario (condivisione non ancora attiva)
alter table public.trip_members enable row level security;
revoke all on table public.trip_members from anon;
revoke truncate, references, trigger on table public.trip_members from authenticated;
grant select, insert, update, delete on table public.trip_members to authenticated;
drop policy if exists membri_lettura on public.trip_members;
drop policy if exists membri_inserimento on public.trip_members;
drop policy if exists membri_modifica on public.trip_members;
drop policy if exists membri_cancellazione on public.trip_members;
create policy membri_lettura on public.trip_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_trip_owner(trip_id));
create policy membri_inserimento on public.trip_members for insert to authenticated
  with check (public.is_trip_owner(trip_id) and user_id <> (select auth.uid()));
create policy membri_modifica on public.trip_members for update to authenticated
  using (public.is_trip_owner(trip_id)) with check (public.is_trip_owner(trip_id));
create policy membri_cancellazione on public.trip_members for delete to authenticated
  using (public.is_trip_owner(trip_id));

-- Preferenze, contesto e dispositivi: solo l'utente stesso
do $$
declare
  t text;
begin
  foreach t in array array['user_preferences', 'user_context', 'user_devices'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('revoke truncate, references, trigger on table public.%I from authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('drop policy if exists utente_proprio on public.%I', t);
    execute format('create policy utente_proprio on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- user_context.last_trip_id: solo un viaggio leggibile
create or replace function private.user_context_check()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.last_trip_id is not null and not public.can_read_trip(new.last_trip_id) then
    new.last_trip_id := null;
  end if;
  return new;
end $$;
revoke all on function private.user_context_check() from public, anon, authenticated;
drop trigger if exists user_context_check on public.user_context;
create trigger user_context_check before insert or update on public.user_context
for each row execute function private.user_context_check();
