-- 20261110000000 · Indici sulle chiavi esterne delle tabelle dei traghetti verso ferry_sources.
-- Segnalati dal Performance Advisor di Supabase (unindexed_foreign_keys) dopo 20261109000000_traghetti.sql.
-- Solo aggiunte, idempotente (if not exists): nessun dato cambia, nessuna modifica a trips o alle tabelle del viaggio.
-- Ritorno indietro: supabase/rollback/20261109_annulla_traghetti.sql toglie le tabelle ferry_* e con esse questi indici.

create index if not exists ferry_routes_duration_source_idx on public.ferry_routes (release_id, duration_source_key);
create index if not exists ferry_routes_season_source_idx on public.ferry_routes (release_id, season_source_key);
create index if not exists ferry_routes_frequency_source_idx on public.ferry_routes (release_id, frequency_source_key);
create index if not exists ferry_routes_fare_source_idx on public.ferry_routes (release_id, fare_source_key);
create index if not exists ferry_route_stops_coords_source_idx on public.ferry_route_stops (release_id, coords_source_key);
create index if not exists ferry_fares_source_idx on public.ferry_fares (release_id, source_key);
