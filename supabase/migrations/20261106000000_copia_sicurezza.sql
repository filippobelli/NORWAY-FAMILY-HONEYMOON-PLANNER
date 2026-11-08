-- 20261106000000 · Copia di sicurezza della tabella trips, prima di qualsiasi altra migrazione.
-- Si applica su norway-planner (produzione, con i dati reali). Solo aggiunte: nessun drop, truncate o modifica
-- di public.trips, della colonna data, di auth o di private.allowed_emails.
-- Idempotente: se la copia esiste già non viene toccata (resta quella del primo passaggio).

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.trips_backup_20261106 as
  select t.*, now() as backup_at from public.trips t;

revoke all on table private.trips_backup_20261106 from public, anon, authenticated;

comment on table private.trips_backup_20261106 is
  'Copia di public.trips presa prima delle migrazioni del 2026-11-06 (database multinazione). Non modificare né cancellare fino alla chiusura della verifica.';

-- Controllo: la copia ha almeno tante righe quante ne aveva trips al momento della copia.
-- (Se trips ha ricevuto viaggi nuovi dopo la copia, la differenza è attesa e va solo segnalata.)
do $$
declare
  v_trips bigint;
  v_copia bigint;
begin
  select count(*) into v_trips from public.trips;
  select count(*) into v_copia from private.trips_backup_20261106;
  if v_copia = 0 and v_trips > 0 then
    raise exception 'Copia di sicurezza vuota ma trips contiene % righe: migrazione interrotta', v_trips;
  end if;
  raise notice 'trips: % righe; copia di sicurezza: % righe', v_trips, v_copia;
end $$;
