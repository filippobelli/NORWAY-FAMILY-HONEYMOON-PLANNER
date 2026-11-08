-- 20261106000400 · Sincronizzazione per riga.
-- - Ogni scrittura su una tabella del viaggio riceve rev (versione della riga) e seq (ordine di conferma nel viaggio).
-- - sync_push applica un lotto di modifiche in una transazione: tutto o niente, con controllo dei conflitti per riga.
-- - sync_pull restituisce le righe cambiate dopo un seq noto, comprese le cancellazioni (tombstone).
-- Sui viaggi esistenti (storage_format = 'documento') i trigger su public.trips non fanno nulla:
-- l'app attuale continua a salvare come oggi. Idempotente.

-- ---------- Timbro di sincronizzazione ----------

create or replace function private.sync_next_seq(p_trip uuid)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_seq bigint;
begin
  -- La riga del contatore resta bloccata fino al commit: le scritture dello stesso viaggio si mettono in fila,
  -- quindi seq cresce nell'ordine in cui le modifiche diventano visibili.
  insert into public.trip_sync_state as s (trip_id, seq) values (p_trip, 1)
  on conflict (trip_id) do update set seq = s.seq + 1
  returning s.seq into v_seq;
  return v_seq;
end $$;

create or replace function private.sync_stamp_child()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.seq := private.sync_next_seq(new.trip_id);
  if tg_op = 'INSERT' then
    new.rev := 1;
    new.created_at := now();
  else
    new.rev := old.rev + 1;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

-- Su trips il timbro vale solo per i viaggi nel formato a righe: i viaggi «documento» restano come oggi
create or replace function private.sync_stamp_trip()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.storage_format <> 'righe' then
    return new;
  end if;
  new.seq := private.sync_next_seq(new.id);
  if tg_op = 'INSERT' then
    new.rev := 1;
  elsif old.storage_format = 'righe' then
    new.rev := old.rev + 1;
  end if;
  new.updated_by := auth.uid();
  return new;
end $$;

-- Guardia su trips:
-- - il proprietario non cambia;
-- - un viaggio nel formato a righe non accetta più scritture del documento (app vecchia): nessuna sovrascrittura;
-- - il ritorno al formato documento solo con il permesso esplicito della procedura di ritorno indietro.
create or replace function private.trips_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Il proprietario del viaggio non si cambia' using errcode = '42501';
  end if;
  if coalesce(current_setting('nfhp.permetti_documento', true), '') = 'on' then
    return new;
  end if;
  if old.storage_format = 'righe' and new.data is distinct from old.data then
    raise exception 'Questo viaggio usa il nuovo formato: ricarica la pagina per aggiornare l''app. Nessun dato è stato modificato.'
      using errcode = 'P0001';
  end if;
  if old.storage_format = 'righe' and new.storage_format = 'documento' then
    raise exception 'Il ritorno al formato documento si fa solo con la procedura di ritorno indietro' using errcode = '42501';
  end if;
  return new;
end $$;

-- Pulizia del contatore quando un viaggio viene eliminato
create or replace function private.trips_after_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.trip_sync_state where trip_id = old.id;
  return old;
end $$;

revoke all on function private.sync_next_seq(uuid) from public, anon, authenticated;
revoke all on function private.sync_stamp_child() from public, anon, authenticated;
revoke all on function private.sync_stamp_trip() from public, anon, authenticated;
revoke all on function private.trips_guard() from public, anon, authenticated;
revoke all on function private.trips_after_delete() from public, anon, authenticated;

drop trigger if exists trips_guard on public.trips;
create trigger trips_guard before update on public.trips
for each row execute function private.trips_guard();

drop trigger if exists trips_sync_stamp on public.trips;
create trigger trips_sync_stamp before insert or update on public.trips
for each row execute function private.sync_stamp_trip();

drop trigger if exists trips_after_delete on public.trips;
create trigger trips_after_delete after delete on public.trips
for each row execute function private.trips_after_delete();

do $$
declare
  t text;
begin
  foreach t in array array['trip_countries', 'trip_rates', 'trip_versions', 'stops', 'stop_ideas', 'legs', 'segments', 'days',
    'activities', 'budget_items', 'flights', 'accommodations', 'coastal_options', 'favorites', 'diary_entries',
    'diary_attachments', 'visit_states', 'plan_log'] loop
    execute format('drop trigger if exists sync_stamp on public.%I', t);
    execute format('create trigger sync_stamp before insert or update on public.%I for each row execute function private.sync_stamp_child()', t);
  end loop;
end $$;

-- ---------- Tabelle sincronizzabili e loro chiavi ----------

create or replace function public.sync_table_keys(p_table text)
returns text[] language sql immutable set search_path = '' as $$
  select case p_table
    when 'trips' then array['id']
    when 'trip_countries' then array['trip_id', 'country_code']
    when 'trip_rates' then array['trip_id', 'currency']
    when 'trip_versions' then array['trip_id', 'id']
    when 'stops' then array['trip_id', 'version_id', 'id']
    when 'stop_ideas' then array['trip_id', 'version_id', 'stop_id', 'place_key']
    when 'legs' then array['trip_id', 'version_id', 'id']
    when 'segments' then array['trip_id', 'version_id', 'id']
    when 'days' then array['trip_id', 'version_id', 'day_key']
    when 'activities' then array['trip_id', 'version_id', 'id']
    when 'budget_items' then array['trip_id', 'version_id', 'id']
    when 'flights' then array['trip_id', 'version_id', 'id']
    when 'accommodations' then array['trip_id', 'id']
    when 'coastal_options' then array['trip_id', 'id']
    when 'favorites' then array['trip_id', 'place_key']
    when 'diary_entries' then array['trip_id', 'id']
    when 'diary_attachments' then array['trip_id', 'id']
    when 'visit_states' then array['trip_id', 'target_kind', 'target_id']
    when 'plan_log' then array['trip_id', 'id']
  end
$$;

-- Ordine di applicazione: prima i genitori (chiavi esterne)
create or replace function public.sync_table_order()
returns text[] language sql immutable set search_path = '' as $$
  select array['trips', 'trip_countries', 'trip_rates', 'trip_versions', 'stops', 'stop_ideas', 'legs', 'segments', 'days',
    'activities', 'budget_items', 'flights', 'accommodations', 'coastal_options', 'favorites', 'diary_entries',
    'diary_attachments', 'visit_states', 'plan_log']
$$;

-- ---------- Invio di un lotto ----------
-- p_changes: [{ "table": "stops", "op": "upsert" | "delete", "base_rev": 3 | null, "row": { ...colonne... } }]
--   base_rev = rev della riga come la conosceva il dispositivo (null = riga nuova).
-- p_attempted: identificativi degli invii già tentati da questo dispositivo: una riga scritta da uno di loro
--   (risposta persa) non è un conflitto.
-- Risultato: { "stato": "applicato" | "gia_applicato" | "conflitto", "seq": n, "righe": [...], "conflitti": [...] }
-- security invoker: le policy RLS valgono per ogni lettura e scrittura.

create or replace function public.sync_push(
  p_trip_id uuid,
  p_mutation_id uuid,
  p_changes jsonb,
  p_attempted uuid[] default '{}',
  p_device_id text default null
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_prev jsonb;
  v_change jsonb;
  v_table text;
  v_keys text[];
  v_row jsonb;
  v_op text;
  v_base bigint;
  v_cur_rev bigint;
  v_cur_mut uuid;
  v_cur_row jsonb;
  v_where text;
  v_cols text;
  v_new_rev bigint;
  v_key jsonb;
  v_conflicts jsonb := '[]'::jsonb;
  v_applied jsonb := '[]'::jsonb;
  v_result jsonb;
  v_pass integer;
  v_has_trip_row boolean;
begin
  if (select auth.uid()) is null then
    raise exception 'Accesso richiesto' using errcode = '42501';
  end if;
  if p_changes is null or jsonb_typeof(p_changes) <> 'array' then
    raise exception 'Formato del lotto non valido' using errcode = '22023';
  end if;
  if jsonb_array_length(p_changes) > 1000 then
    raise exception 'Lotto troppo grande (massimo 1000 righe): dividerlo' using errcode = '22023';
  end if;

  v_has_trip_row := exists (select 1 from jsonb_array_elements(p_changes) c where c.value ->> 'table' = 'trips');
  if not public.can_edit_trip(p_trip_id) and not v_has_trip_row then
    raise exception 'Viaggio non accessibile' using errcode = '42501';
  end if;

  -- Un solo invio alla volta per viaggio: controllo e scrittura non si intrecciano
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('nfhp.sync:' || p_trip_id::text, 0));

  -- Invio già applicato (risposta persa): stesso risultato, nessuna seconda scrittura
  select m.result into v_prev from public.sync_mutations m where m.trip_id = p_trip_id and m.mutation_id = p_mutation_id;
  if v_prev is not null then
    return v_prev || jsonb_build_object('stato', 'gia_applicato');
  end if;

  -- Passo 1: controllo di tutte le righe. Passo 2: scrittura, solo se non ci sono conflitti.
  for v_pass in 1..2 loop
    if v_pass = 2 and jsonb_array_length(v_conflicts) > 0 then
      return jsonb_build_object('stato', 'conflitto', 'conflitti', v_conflicts,
        'seq', (select s.seq from public.trip_sync_state s where s.trip_id = p_trip_id));
    end if;

    for v_change in
      select c.value from jsonb_array_elements(p_changes) with ordinality as c(value, n)
      order by pg_catalog.array_position(public.sync_table_order(), c.value ->> 'table'), c.n
    loop
      v_table := v_change ->> 'table';
      v_keys := public.sync_table_keys(v_table);
      if v_keys is null then
        raise exception 'Tabella non sincronizzabile: %', coalesce(v_table, '(assente)') using errcode = '22023';
      end if;
      v_op := coalesce(v_change ->> 'op', 'upsert');
      if v_op not in ('upsert', 'delete') then
        raise exception 'Operazione non valida: %', v_op using errcode = '22023';
      end if;
      v_base := (v_change ->> 'base_rev')::bigint;
      v_row := coalesce(v_change -> 'row', '{}'::jsonb);
      if jsonb_typeof(v_row) <> 'object' then
        raise exception 'Riga non valida in %', v_table using errcode = '22023';
      end if;

      -- Il viaggio è sempre quello del lotto; le colonne di sistema le scrivono i trigger
      if v_table = 'trips' then
        v_row := v_row || jsonb_build_object('id', p_trip_id);
      else
        v_row := v_row || jsonb_build_object('trip_id', p_trip_id);
      end if;
      v_row := v_row - array['rev', 'seq', 'created_at', 'updated_at', 'updated_by', 'owner_id', 'data', 'last_mutation_id', 'device_id'];
      if exists (select 1 from unnest(v_keys) k where v_row ->> k is null) then
        raise exception 'Chiave incompleta in %', v_table using errcode = '22023';
      end if;
      v_key := (select jsonb_object_agg(k, v_row -> k) from unnest(v_keys) k);
      v_where := (select string_agg(format('t.%1$I = r.%1$I', k), ' and ') from unnest(v_keys) k);

      execute format('select t.rev, t.last_mutation_id, to_jsonb(t) - ''data'' from public.%1$I t, jsonb_populate_record(null::public.%1$I, $1) r where %2$s',
        v_table, v_where)
        into v_cur_rev, v_cur_mut, v_cur_row using v_row;

      if v_pass = 1 then
        if v_cur_rev is null then
          if v_base is not null then
            -- La riga nota non c'è più nel cloud: si decide sul dispositivo
            v_conflicts := v_conflicts || jsonb_build_object('table', v_table, 'key', v_key, 'tipo', 'assente', 'server', null);
          end if;
        elsif v_base is distinct from v_cur_rev and not (v_cur_mut is not null and v_cur_mut = any (p_attempted)) then
          v_conflicts := v_conflicts || jsonb_build_object('table', v_table, 'key', v_key, 'tipo', 'cambiata', 'server', v_cur_row);
        end if;
        continue;
      end if;

      -- Passo 2: scrittura
      v_row := v_row || jsonb_build_object('last_mutation_id', p_mutation_id, 'device_id', p_device_id);
      if v_op = 'delete' then
        if v_cur_rev is null then
          continue;                         -- niente da cancellare
        end if;
        v_row := (select jsonb_object_agg(k, v_row -> k) from unnest(v_keys) k)
          || jsonb_build_object('deleted_at', now(), 'last_mutation_id', p_mutation_id, 'device_id', p_device_id);
      end if;

      if v_cur_rev is null then
        if v_table = 'trips' then
          -- Viaggio nuovo: documento segnaposto (l'app vecchia lo rifiuta come «versione più recente») e formato a righe
          v_row := jsonb_build_object('data', jsonb_build_object('schemaVersion', 3, 'formato', 'righe'), 'storage_format', 'righe') || v_row;
        end if;
        select string_agg(quote_ident(a.attname), ', ' order by a.attnum) into v_cols
        from pg_catalog.pg_attribute a
        where a.attrelid = pg_catalog.to_regclass('public.' || quote_ident(v_table))
          and a.attnum > 0 and not a.attisdropped and a.attgenerated not in ('s', 'v')
          and v_row ? a.attname::text;
        execute format('insert into public.%1$I (%2$s) select %2$s from jsonb_populate_record(null::public.%1$I, $1) returning rev',
          v_table, v_cols)
          into v_new_rev using v_row;
      else
        select string_agg(quote_ident(a.attname), ', ' order by a.attnum) into v_cols
        from pg_catalog.pg_attribute a
        where a.attrelid = pg_catalog.to_regclass('public.' || quote_ident(v_table))
          and a.attnum > 0 and not a.attisdropped and a.attgenerated not in ('s', 'v')
          and v_row ? a.attname::text
          and not (a.attname::text = any (v_keys));
        execute format('update public.%1$I t set (%2$s) = (select %2$s from jsonb_populate_record(null::public.%1$I, $1)) from jsonb_populate_record(null::public.%1$I, $1) r where %3$s returning t.rev',
          v_table, v_cols, v_where)
          into v_new_rev using v_row;
        if v_new_rev is null then
          raise exception 'Scrittura rifiutata su % (permessi)', v_table using errcode = '42501';
        end if;
      end if;
      v_applied := v_applied || jsonb_build_object('table', v_table, 'key', v_key, 'rev', v_new_rev);
    end loop;
  end loop;

  v_result := jsonb_build_object('stato', 'applicato', 'righe', v_applied,
    'seq', (select s.seq from public.trip_sync_state s where s.trip_id = p_trip_id));
  insert into public.sync_mutations (trip_id, mutation_id, user_id, device_id, result)
  values (p_trip_id, p_mutation_id, (select auth.uid()), p_device_id, v_result);
  return v_result;
end $$;

-- ---------- Lettura delle modifiche ----------
-- STABLE: tutte le letture vedono la stessa istantanea, quindi seq e righe sono coerenti.

create or replace function public.sync_pull(p_trip_id uuid, p_since bigint default 0)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_t text;
  v_rows jsonb;
  v_out jsonb := '{}'::jsonb;
  v_seq bigint;
begin
  if not public.can_read_trip(p_trip_id) then
    raise exception 'Viaggio non accessibile' using errcode = '42501';
  end if;
  select s.seq into v_seq from public.trip_sync_state s where s.trip_id = p_trip_id;
  foreach v_t in array public.sync_table_order() loop
    if v_t = 'trips' then
      select coalesce(jsonb_agg(to_jsonb(t) - 'data'), '[]'::jsonb) into v_rows
      from public.trips t where t.id = p_trip_id and t.seq > p_since;
    else
      execute format('select coalesce(jsonb_agg(to_jsonb(t) order by t.seq), ''[]''::jsonb) from public.%I t where t.trip_id = $1 and t.seq > $2', v_t)
        into v_rows using p_trip_id, p_since;
    end if;
    if jsonb_array_length(v_rows) > 0 then
      v_out := v_out || jsonb_build_object(v_t, v_rows);
    end if;
  end loop;
  return jsonb_build_object('seq', coalesce(v_seq, 0), 'righe', v_out);
end $$;

-- ---------- Manutenzione: registro degli invii più vecchio di 90 giorni ----------
-- Da lanciare a mano (o con pg_cron, se attivato): select private.sync_cleanup();

create or replace function private.sync_cleanup(p_days integer default 90)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_n bigint;
begin
  delete from public.sync_mutations where applied_at < now() - make_interval(days => p_days);
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke all on function private.sync_cleanup(integer) from public, anon, authenticated;

revoke all on function public.sync_table_keys(text) from public, anon;
revoke all on function public.sync_table_order() from public, anon;
revoke all on function public.sync_push(uuid, uuid, jsonb, uuid[], text) from public, anon;
revoke all on function public.sync_pull(uuid, bigint) from public, anon;
grant execute on function public.sync_table_keys(text) to authenticated;
grant execute on function public.sync_table_order() to authenticated;
grant execute on function public.sync_push(uuid, uuid, jsonb, uuid[], text) to authenticated;
grant execute on function public.sync_pull(uuid, bigint) to authenticated;
