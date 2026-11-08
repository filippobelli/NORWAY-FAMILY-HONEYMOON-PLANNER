-- Ritorno indietro delle migrazioni 20261106000100 … 20261106000500 (database multinazione).
-- Rimuove SOLO gli oggetti nuovi. Non tocca: le righe di public.trips, la colonna data, le colonne e le policy
-- originali di trips (trips_*_own, trips_touch), auth, private.allowed_emails, la copia private.trips_backup_20261106.
-- Da eseguire nello SQL Editor come postgres, dopo l'approvazione di Filippo. Tutto in una transazione.
--
-- Prerequisito: nessun viaggio nel formato a righe. Se ce ne sono, prima si esegue la procedura «ritorno al documento»
-- (docs/architettura.md §12.6): ricostruisce data dalle righe e rimette storage_format = 'documento'.
-- Senza questo passo i dati scritti dopo il passaggio vivrebbero solo nelle tabelle che qui si cancellano.

begin;

do $$
declare
  v_n bigint;
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trips' and column_name = 'storage_format') then
    execute 'select count(*) from public.trips where storage_format = ''righe''' into v_n;
    if v_n > 0 then
      raise exception 'Ci sono % viaggi nel formato a righe: eseguire prima il ritorno al documento. Nulla è stato rimosso.', v_n;
    end if;
  end if;
end $$;

-- ---------- Storage ----------
drop policy if exists "diario_allegati_lettura" on storage.objects;
drop policy if exists "diario_allegati_caricamento" on storage.objects;
drop policy if exists "diario_allegati_cancellazione" on storage.objects;

-- Il bucket si toglie solo se vuoto. Se Storage non permette la cancellazione via SQL, va tolto dal pannello
-- (Storage → diario-allegati → elimina) dopo aver scaricato i file da conservare.
do $$
begin
  if exists (select 1 from storage.objects where bucket_id = 'diario-allegati') then
    raise notice 'Il bucket diario-allegati contiene file: non viene rimosso. Scaricare i file e toglierlo dal pannello.';
  else
    begin
      delete from storage.buckets where id = 'diario-allegati';
    exception when others then
      raise notice 'Bucket diario-allegati non rimosso via SQL (%): toglierlo dal pannello.', sqlerrm;
    end;
  end if;
end $$;

drop function if exists public.attachments_usage();
drop function if exists public.can_delete_attachment(text);
drop function if exists public.can_write_attachment(text);
drop function if exists public.can_read_attachment(text);
drop function if exists public.attachment_path_trip(text);

-- ---------- Trigger e policy aggiunti su trips ----------
drop trigger if exists trips_guard on public.trips;
drop trigger if exists trips_sync_stamp on public.trips;
drop trigger if exists trips_after_delete on public.trips;
drop policy if exists "trips_select_member" on public.trips;
drop policy if exists "trips_update_member" on public.trips;

-- ---------- Sincronizzazione ----------
drop function if exists public.sync_pull(uuid, bigint);
drop function if exists public.sync_push(uuid, uuid, jsonb, uuid[], text);
drop function if exists public.sync_table_order();
drop function if exists public.sync_table_keys(text);
drop function if exists private.sync_cleanup(integer);

-- ---------- Tabelle nuove del viaggio e dell'utente (prima le figlie) ----------
drop table if exists public.user_devices;
drop table if exists public.user_context;
drop table if exists public.user_preferences;
drop table if exists public.trip_imports;
drop table if exists public.sync_mutations;
drop table if exists public.trip_members;
drop table if exists public.plan_log;
drop table if exists public.visit_states;
drop table if exists public.diary_attachments;
drop table if exists public.diary_entries;
drop table if exists public.favorites;
drop table if exists public.coastal_options;
drop table if exists public.accommodations;
drop table if exists public.flights;
drop table if exists public.budget_items;
drop table if exists public.activities;
drop table if exists public.days;
drop table if exists public.segments;
drop table if exists public.legs;
drop table if exists public.stop_ideas;
drop table if exists public.stops;
drop table if exists public.trip_versions;
drop table if exists public.trip_rates;
drop table if exists public.trip_countries;
drop table if exists public.trip_sync_state;

drop function if exists private.user_context_check();
drop function if exists private.trips_after_delete();
drop function if exists private.trips_guard();
drop function if exists private.sync_stamp_trip();
drop function if exists private.sync_stamp_child();
drop function if exists private.sync_next_seq(uuid);

drop function if exists public.can_edit_trip(uuid);
drop function if exists public.can_read_trip(uuid);
drop function if exists public.is_trip_owner(uuid);

-- ---------- Catalogo ----------
drop function if exists public.catalog_bundle(text);
drop table if exists public.place_links;
drop table if exists public.route_ports;
drop table if exists public.voyages;
drop table if exists public.operators;
drop table if exists public.place_sources;
drop table if exists public.place_texts;
drop table if exists public.places;
drop table if exists public.regions;
drop table if exists public.place_keys;
drop table if exists public.catalog_releases;
drop table if exists public.countries;
drop table if exists public.home_airports;
drop function if exists private.catalog_child_guard();
drop function if exists private.catalog_release_guard();

-- ---------- Colonne nuove di trips ----------
-- Contengono solo valori scritti dalle migrazioni o dalla nuova app (data non si tocca).
-- Rimozione solo del catalogo di sistema: nessuna riscrittura della tabella.
alter table public.trips
  drop column if exists storage_format,
  drop column if exists start_date,
  drop column if exists date_tentative,
  drop column if exists participants,
  drop column if exists useful_info,
  drop column if exists settings,
  drop column if exists active_version_id,
  drop column if exists base_currency,
  drop column if exists app_updated_at,
  drop column if exists imported_at,
  drop column if exists rev,
  drop column if exists seq,
  drop column if exists updated_by,
  drop column if exists deleted_at,
  drop column if exists last_mutation_id,
  drop column if exists device_id,
  drop column if exists extra;

-- Controllo finale: i viaggi sono quelli della copia di sicurezza (o di più, se creati dopo), con lo stesso data
do $$
declare
  v_diversi bigint;
begin
  select count(*) into v_diversi
  from private.trips_backup_20261106 b
  join public.trips t on t.id = b.id
  where t.data is distinct from b.data and t.updated_at <= b.backup_at;
  if v_diversi > 0 then
    raise exception '% viaggi hanno data diverso dalla copia senza modifiche successive: controllare prima di confermare', v_diversi;
  end if;
end $$;

commit;
