-- Ritorno al documento (docs/architettura.md §9.6), passo 1 di 3: esporta le righe di UN viaggio in JSON.
-- NON modifica nulla: è una sola SELECT. Da eseguire nello SQL Editor del progetto (ruolo postgres).
--
-- Come si usa (procedura completa in docs/sviluppo.md, «Ritorno al documento»):
-- 1. Sostituire l'id qui sotto (una sola volta) con quello del viaggio.
-- 2. Eseguire e salvare il valore della colonna «esportazione» in un file, es. ritorno.json (fuori dal repository).
-- 3. npx tsx scripts/ritorno-documento.ts --in ritorno.json --out ritorno.sql
--    → ricostruisce `data` dalle righe con lo stesso codice dell'app (fromRows) e scrive lo SQL del passo 3.
-- 4. Rileggere ritorno.sql ed eseguirlo nello SQL Editor (transazione unica, con controllo finale).
--
-- Formato: { "trip_id": …, "storage_format": …, "righe": { "<tabella>": [righe…] } } con tutte le colonne,
-- comprese le cancellate (tombstone, deleted_at valorizzato): le scarta lo script.

with p as (select '00000000-0000-0000-0000-000000000000'::uuid as id)
select jsonb_build_object(
  'trip_id', p.id,
  'storage_format', (select t.storage_format from public.trips t where t.id = p.id),
  'righe', jsonb_build_object(
    'trips', coalesce((select jsonb_agg(to_jsonb(t) - 'data') from public.trips t where t.id = p.id), '[]'::jsonb),
    'trip_countries', coalesce((select jsonb_agg(to_jsonb(x)) from public.trip_countries x where x.trip_id = p.id), '[]'::jsonb),
    'trip_rates', coalesce((select jsonb_agg(to_jsonb(x)) from public.trip_rates x where x.trip_id = p.id), '[]'::jsonb),
    'trip_versions', coalesce((select jsonb_agg(to_jsonb(x)) from public.trip_versions x where x.trip_id = p.id), '[]'::jsonb),
    'stops', coalesce((select jsonb_agg(to_jsonb(x)) from public.stops x where x.trip_id = p.id), '[]'::jsonb),
    'stop_ideas', coalesce((select jsonb_agg(to_jsonb(x)) from public.stop_ideas x where x.trip_id = p.id), '[]'::jsonb),
    'legs', coalesce((select jsonb_agg(to_jsonb(x)) from public.legs x where x.trip_id = p.id), '[]'::jsonb),
    'segments', coalesce((select jsonb_agg(to_jsonb(x)) from public.segments x where x.trip_id = p.id), '[]'::jsonb),
    'days', coalesce((select jsonb_agg(to_jsonb(x)) from public.days x where x.trip_id = p.id), '[]'::jsonb),
    'activities', coalesce((select jsonb_agg(to_jsonb(x)) from public.activities x where x.trip_id = p.id), '[]'::jsonb),
    'budget_items', coalesce((select jsonb_agg(to_jsonb(x)) from public.budget_items x where x.trip_id = p.id), '[]'::jsonb),
    'flights', coalesce((select jsonb_agg(to_jsonb(x)) from public.flights x where x.trip_id = p.id), '[]'::jsonb),
    'accommodations', coalesce((select jsonb_agg(to_jsonb(x)) from public.accommodations x where x.trip_id = p.id), '[]'::jsonb),
    'coastal_options', coalesce((select jsonb_agg(to_jsonb(x)) from public.coastal_options x where x.trip_id = p.id), '[]'::jsonb),
    'favorites', coalesce((select jsonb_agg(to_jsonb(x)) from public.favorites x where x.trip_id = p.id), '[]'::jsonb),
    'diary_entries', coalesce((select jsonb_agg(to_jsonb(x)) from public.diary_entries x where x.trip_id = p.id), '[]'::jsonb),
    'diary_attachments', coalesce((select jsonb_agg(to_jsonb(x)) from public.diary_attachments x where x.trip_id = p.id), '[]'::jsonb),
    'visit_states', coalesce((select jsonb_agg(to_jsonb(x)) from public.visit_states x where x.trip_id = p.id), '[]'::jsonb),
    'plan_log', coalesce((select jsonb_agg(to_jsonb(x)) from public.plan_log x where x.trip_id = p.id), '[]'::jsonb)
  )
) as esportazione
from p;
