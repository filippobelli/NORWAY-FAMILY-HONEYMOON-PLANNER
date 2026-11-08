-- 20261106000500 · Allegati del diario in Supabase Storage (bucket privato).
-- Percorso dei file: {owner_id}/{trip_id}/{attachment_id}
--   owner_id = proprietario del viaggio (anche quando carica un membro: i file di un viaggio stanno insieme);
--   attachment_id = diary_attachments.id: un reinvio dello stesso file non crea doppioni.
-- Limiti applicati dal server di Storage: 10 MB per file, solo immagini comuni e PDF.
-- Nessuna policy UPDATE: un file caricato non si sovrascrive (un reinvio riceve «già esistente» e va trattato come riuscito).
-- Solo aggiunte: bucket nuovo e policy nuove su storage.objects. Idempotente.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'diario-allegati',
  'diario-allegati',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Viaggio indicato dal percorso; null se il percorso non ha la forma attesa
create or replace function public.attachment_path_trip(p_name text)
returns uuid language sql immutable set search_path = '' as $$
  select case
    when p_name ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/[A-Za-z0-9._-]{1,128}$'
    then pg_catalog.split_part(p_name, '/', 2)::uuid
  end
$$;

create or replace function public.can_read_attachment(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trips t
    where t.id = public.attachment_path_trip(p_name)
      and t.owner_id::text = pg_catalog.split_part(p_name, '/', 1)
      and public.can_read_trip(t.id)
  );
$$;

-- Caricamento: serve la riga dei metadati, già sincronizzata e non cancellata
create or replace function public.can_write_attachment(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trips t
    join public.diary_attachments a on a.trip_id = t.id and a.id = pg_catalog.split_part(p_name, '/', 3)
    where t.id = public.attachment_path_trip(p_name)
      and t.owner_id::text = pg_catalog.split_part(p_name, '/', 1)
      and a.deleted_at is null
      and public.can_edit_trip(t.id)
  );
$$;

create or replace function public.can_delete_attachment(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trips t
    where t.id = public.attachment_path_trip(p_name)
      and t.owner_id::text = pg_catalog.split_part(p_name, '/', 1)
      and public.can_edit_trip(t.id)
  );
$$;

-- Spazio usato: dell'utente (cartella propria) e dell'intero bucket, sul limite del piano (1 GB, decisione del piano)
create or replace function public.attachments_usage()
returns table (user_bytes bigint, bucket_bytes bigint, limit_bytes bigint)
language sql stable security definer set search_path = '' as $$
  select
    coalesce(sum((o.metadata ->> 'size')::bigint) filter (where pg_catalog.split_part(o.name, '/', 1) = (select auth.uid())::text), 0)::bigint,
    coalesce(sum((o.metadata ->> 'size')::bigint), 0)::bigint,
    1073741824::bigint
  from storage.objects o
  where o.bucket_id = 'diario-allegati';
$$;

revoke all on function public.attachment_path_trip(text) from public, anon;
revoke all on function public.can_read_attachment(text) from public, anon;
revoke all on function public.can_write_attachment(text) from public, anon;
revoke all on function public.can_delete_attachment(text) from public, anon;
revoke all on function public.attachments_usage() from public, anon;
grant execute on function public.attachment_path_trip(text) to authenticated;
grant execute on function public.can_read_attachment(text) to authenticated;
grant execute on function public.can_write_attachment(text) to authenticated;
grant execute on function public.can_delete_attachment(text) to authenticated;
grant execute on function public.attachments_usage() to authenticated;

drop policy if exists "diario_allegati_lettura" on storage.objects;
create policy "diario_allegati_lettura" on storage.objects for select to authenticated
  using (bucket_id = 'diario-allegati' and public.can_read_attachment(name));

drop policy if exists "diario_allegati_caricamento" on storage.objects;
create policy "diario_allegati_caricamento" on storage.objects for insert to authenticated
  with check (bucket_id = 'diario-allegati' and public.can_write_attachment(name));

drop policy if exists "diario_allegati_cancellazione" on storage.objects;
create policy "diario_allegati_cancellazione" on storage.objects for delete to authenticated
  using (bucket_id = 'diario-allegati' and public.can_delete_attachment(name));
