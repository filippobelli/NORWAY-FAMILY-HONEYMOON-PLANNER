-- 20261110000100 · Foto e consigli dei luoghi nel catalogo (versione NO-3 e successive).
-- Piano: docs/piano-2026-11-10-catalogo-nord.md.
--
-- Solo aggiunte, idempotente (rieseguibile): 2 tabelle nuove del catalogo, guardie di immutabilità, RLS come le altre
-- tabelle del catalogo, catalog_bundle esteso con le chiavi place_photos e place_tips. Nessun DROP, nessuna modifica a
-- trips, alle tabelle del viaggio, ad auth o a private.allowed_emails. Le versioni NO-1 e NO-2 (pubblicate) non
-- cambiano: per loro catalog_bundle restituisce le chiavi nuove come elenchi vuoti.
-- I dati (versione NO-3) arrivano dal seed supabase/seed/catalogo-norvegia-v3.sql, da applicare DOPO questa migrazione.
-- Ritorno indietro: supabase/rollback/20261110_annulla_foto_consigli.sql.

-- ---------- Foto: solo file di Wikimedia Commons con licenza libera, autore e licenza letti alla data indicata ----------
-- places.commons_image resta la foto principale (immagine P18 di Wikidata); qui stanno fino a 3 foto per luogo,
-- in ordine, con i crediti già pronti (l'app non deve chiederli a Commons a ogni apertura).

create table if not exists public.place_photos (
  release_id text not null,
  place_key text not null,
  position integer not null check (position >= 0),
  commons_file text not null check (commons_file <> ''),
  author text not null check (author <> ''),
  license text not null check (license <> ''),
  license_url text check (license_url is null or license_url ~ '^https?://'),
  checked_at date not null,
  primary key (release_id, place_key, position),
  foreign key (release_id, place_key) references public.places (release_id, place_key) on delete cascade
);

-- ---------- Consigli: una riga per consiglio, sempre con la fonte e la data di lettura ----------

create table if not exists public.place_tips (
  release_id text not null,
  place_key text not null,
  lang text not null check (lang ~ '^[a-z]{2,3}(-[A-Za-z0-9]+)*$'),
  position integer not null check (position >= 0),
  body text not null check (body <> ''),
  source_label text not null check (source_label <> ''),
  source_url text not null check (source_url ~ '^https://'),
  checked_at date not null,
  primary key (release_id, place_key, lang, position),
  foreign key (release_id, place_key) references public.places (release_id, place_key) on delete cascade
);

-- ---------- Guardie: una versione pubblicata non cambia ----------

do $$
declare
  t text;
begin
  foreach t in array array['place_photos', 'place_tips'] loop
    execute format('drop trigger if exists catalog_guard on public.%I', t);
    execute format('create trigger catalog_guard before insert or update or delete on public.%I for each row execute function private.catalog_child_guard()', t);
  end loop;
end $$;

-- ---------- Accesso: sola lettura per authenticated, bozze invisibili, nulla per anon ----------

do $$
declare
  t text;
begin
  foreach t in array array['place_photos', 'place_tips'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('revoke insert, update, delete, truncate, references, trigger on table public.%I from authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format('drop policy if exists catalogo_lettura on public.%I', t);
    execute format($p$create policy catalogo_lettura on public.%I for select to authenticated
      using (release_id in (select r.release_id from public.catalog_releases r where r.status in ('pubblicata', 'ritirata')))$p$, t);
  end loop;
end $$;

-- ---------- Catalogo completo di una versione: stesse chiavi di prima + place_photos e place_tips ----------

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
    'ferry_fares', coalesce((select jsonb_agg(to_jsonb(x) order by x.route_key collate "C", x.position) from public.ferry_fares x where x.release_id = p_release_id), '[]'::jsonb),
    'place_photos', coalesce((select jsonb_agg(to_jsonb(x) order by x.place_key collate "C", x.position) from public.place_photos x where x.release_id = p_release_id), '[]'::jsonb),
    'place_tips', coalesce((select jsonb_agg(to_jsonb(x) order by x.place_key collate "C", x.lang, x.position) from public.place_tips x where x.release_id = p_release_id), '[]'::jsonb)
  )
$$;

revoke all on function public.catalog_bundle(text) from public, anon;
grant execute on function public.catalog_bundle(text) to authenticated;

-- ---------- Controllo finale ----------

do $$
declare
  v_n bigint;
begin
  select count(*) into v_n from pg_tables where schemaname = 'public' and tablename in ('place_photos', 'place_tips') and rowsecurity;
  if v_n <> 2 then raise exception 'Tabelle di foto e consigli senza RLS: % su 2', v_n; end if;
  select count(*) into v_n from pg_trigger where tgname = 'catalog_guard' and not tgisinternal
    and tgrelid in ('public.place_photos'::regclass, 'public.place_tips'::regclass);
  if v_n <> 2 then raise exception 'Guardie di immutabilità mancanti: % su 2', v_n; end if;
  if has_table_privilege('anon', 'public.place_photos', 'select') or has_table_privilege('anon', 'public.place_tips', 'select') then
    raise exception 'anon non deve leggere foto e consigli';
  end if;
  if has_function_privilege('anon', 'public.catalog_bundle(text)', 'execute') then raise exception 'anon non deve eseguire catalog_bundle'; end if;
  -- Le versioni già pubblicate restano com'erano: nessuna foto o consiglio
  if exists (select 1 from public.place_photos where release_id in ('NO-1', 'NO-2')) or exists (select 1 from public.place_tips where release_id in ('NO-1', 'NO-2')) then
    raise exception 'NO-1 e NO-2 non devono avere foto o consigli';
  end if;
end $$;
