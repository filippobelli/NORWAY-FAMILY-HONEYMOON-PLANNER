// Ritorno al documento per UN viaggio (docs/architettura.md §9.6), passo 2 di 3.
//
//   npx tsx scripts/ritorno-documento.ts --in ritorno.json --out ritorno.sql
//
// Legge l'esportazione del passo 1 (supabase/rollback/20261108_ritorno_documento_esporta.sql), ricostruisce il
// documento del viaggio dalle righe con lo stesso codice dell'app (fromRows, che scarta le righe cancellate) e scrive
// lo SQL del passo 3. Nessuna chiamata di rete, nessuna chiave: legge un file e ne scrive un altro.
//
// Lo SQL generato, in una sola transazione:
// - con `set local nfhp.permetti_documento = 'on'` (permesso della guardia trips_guard) riscrive `data` con il documento
//   ricostruito, comprese le modifiche fatte dopo il passaggio, e riporta storage_format a 'documento';
// - aggiorna solo se il viaggio è ancora 'righe' e se nessuno ha scritto righe dopo l'esportazione (seq invariato);
// - controlla alla fine che `data` sia esattamente il documento atteso, altrimenti annulla tutto.
// Le righe delle tabelle restano (non si cancella nulla): lo script di annullamento generale
// (supabase/rollback/20261106_annulla_database_multinazione.sql) si può eseguire dopo, se serve.
// Il documento resta in formato 2 con i campi facoltativi nuovi (countries, rates…): l'app di oggi li conserva.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromRows, type TripRows } from '../src/domain/rows';
import type { Trip } from '../src/domain/types';

export interface Export {
  trip_id: string;
  storage_format?: string | null;
  righe: TripRows;
}

/** Documento del viaggio dalle righe esportate */
export function documentFromExport(e: Export): Trip {
  if (!e || typeof e.trip_id !== 'string' || !e.righe) throw new Error('Esportazione non valida: manca trip_id o righe');
  if (e.storage_format !== 'righe') throw new Error(`Il viaggio è nel formato «${String(e.storage_format)}»: il ritorno serve solo ai viaggi «righe»`);
  const trip = fromRows(e.righe);
  if (trip.id !== e.trip_id) throw new Error('La riga del viaggio non corrisponde all\'id esportato');
  // lastMutationId apparteneva al vecchio motore: non serve
  const doc = { ...trip } as Trip & { lastMutationId?: string };
  delete doc.lastMutationId;
  return doc;
}

/** Seq massimo delle righe esportate: se nel frattempo qualcuno scrive, lo SQL si ferma */
export function maxSeq(e: Export): number {
  let m = 0;
  for (const list of Object.values(e.righe)) for (const r of list ?? []) m = Math.max(m, Number((r as { seq?: unknown }).seq ?? 0));
  return m;
}

function dollar(text: string): string {
  let tag = 'doc';
  for (let i = 0; text.includes(`$${tag}$`); i++) tag = `doc${i}`;
  return `$${tag}$${text}$${tag}$`;
}

export function rollbackSql(e: Export, doc: Trip): string {
  const id = e.trip_id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Id del viaggio non valido');
  const json = dollar(JSON.stringify(doc));
  const seq = maxSeq(e);
  return [
    `-- Ritorno al documento del viaggio ${id} (generato da scripts/ritorno-documento.ts). Passo 3 di 3.`,
    '-- Rileggere prima di eseguire. Tutto in una transazione: se un controllo fallisce non cambia nulla.',
    'begin;',
    "set local nfhp.permetti_documento = 'on';",
    `do $ritorno$`,
    'begin',
    `  if not exists (select 1 from public.trips where id = '${id}' and storage_format = 'righe') then`,
    `    raise exception 'Il viaggio ${id} non è nel formato a righe: niente da fare';`,
    '  end if;',
    `  if coalesce((select seq from public.trip_sync_state where trip_id = '${id}'), 0) <> ${seq} then`,
    `    raise exception 'Il viaggio è cambiato dopo l''esportazione (seq diverso da ${seq}): rifare il passo 1';`,
    '  end if;',
    'end $ritorno$;',
    `update public.trips set data = ${json}::jsonb, storage_format = 'documento', schema_version = ${Number(doc.schemaVersion) || 2}, title = ${dollar(doc.title ?? '')}`,
    `  where id = '${id}' and storage_format = 'righe';`,
    `do $controllo$`,
    'begin',
    `  if not exists (select 1 from public.trips where id = '${id}' and storage_format = 'documento' and data = ${json}::jsonb) then`,
    `    raise exception 'Controllo finale non superato: documento diverso da quello atteso';`,
    '  end if;',
    `  raise notice 'Viaggio ${id} tornato al formato documento';`,
    'end $controllo$;',
    'commit;',
    '',
  ].join('\n');
}

function main(): void {
  const args = process.argv.slice(2);
  const opt = (n: string) => {
    const i = args.indexOf(n);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const input = opt('--in');
  const out = opt('--out');
  if (!input || !out) throw new Error('Uso: npx tsx scripts/ritorno-documento.ts --in esportazione.json --out ritorno.sql');
  const raw = JSON.parse(readFileSync(resolve(input), 'utf8')) as Export | { esportazione: Export } | { esportazione: Export }[];
  const e = Array.isArray(raw) ? raw[0]!.esportazione : 'esportazione' in raw ? raw.esportazione : raw;
  const doc = documentFromExport(e);
  writeFileSync(resolve(out), rollbackSql(e, doc), 'utf8');
  console.log(`Scritto ${out}: «${doc.title}», ${doc.stops.length} tappe, ${doc.diary?.length ?? 0} voci di diario.`);
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();
