// Migrazioni del documento Trip: additive, versionate e idempotenti. I campi sconosciuti non si toccano.

export const CURRENT_SCHEMA = 2;

/** Documento scritto da una versione più recente dell'app: non si legge e soprattutto non si sovrascrive. */
export class FutureSchemaError extends Error {
  constructor(public readonly version: number) {
    super(`Questo viaggio è stato salvato da una versione più recente dell'app (formato ${version}). Ricarica la pagina per aggiornarla: nessun dato è stato modificato.`);
    this.name = 'FutureSchemaError';
  }
}

type Doc = Record<string, unknown>;

/** Da 1 a 2: stato effettivo e diario. Sono fuori dal piano, quindi nessun dato esistente cambia. */
function v1to2(d: Doc): Doc {
  return { ...d, schemaVersion: 2, actuals: d.actuals ?? { stops: {}, activities: {} }, diary: d.diary ?? [] };
}

const STEPS: Record<number, (d: Doc) => Doc> = { 1: v1to2 };

export function migrateDocument(raw: unknown): Doc {
  if (!raw || typeof raw !== 'object') throw new Error('Documento non valido');
  let doc = raw as Doc;
  const v = doc.schemaVersion;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) throw new Error('Versione del documento non supportata');
  if (v > CURRENT_SCHEMA) throw new FutureSchemaError(v);
  for (let i = v; i < CURRENT_SCHEMA; i++) doc = STEPS[i]!(doc);
  return doc;
}
