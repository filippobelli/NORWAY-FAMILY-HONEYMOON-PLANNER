import assert from 'node:assert/strict';
import { test } from 'node:test';
import { attachmentProblem, markUploaded, notUploaded, storagePath, usageInfo } from '../src/domain/attachments';
import { createEmptyTrip } from '../src/domain/defaults';
import { fromRows, toRows } from '../src/domain/rows';
import type { Trip } from '../src/domain/types';
import type { AttachmentStorage } from '../src/services/storage/attachmentsCloud';
import { uploadPending } from '../src/services/storage/attachmentUploader';

function tripWith(): Trip {
  return {
    ...createEmptyTrip(),
    id: '00000000-0000-4000-8000-0000000000aa',
    diary: [
      { id: 'd1', createdAt: '2027-08-01T20:00:00Z', updatedAt: '2027-08-01T20:00:00Z', localDate: '2027-08-01', localTime: '22:00', tzOffsetMin: -120, text: 'x', attachments: [
        { id: 'a1', name: 'foto.jpg', type: 'image/jpeg', size: 1000, state: 'solo_dispositivo' },
        { id: 'a2', name: 'altro.pdf', type: 'application/pdf', size: 2000, state: 'solo_dispositivo' },
      ] },
      { id: 'd2', createdAt: '2027-08-02T20:00:00Z', updatedAt: '2027-08-02T20:00:00Z', localDate: '2027-08-02', localTime: '22:00', tzOffsetMin: -120, text: 'tolta', deletedAt: '2027-08-03T00:00:00Z', attachments: [{ id: 'a3', name: 'x.png', type: 'image/png', size: 5, state: 'solo_dispositivo' }] },
    ],
  };
}

/** Storage simulato: nessuna sovrascrittura, «già esistente» al secondo invio */
function fakeStorage() {
  const files = new Map<string, number>();
  let loseNext = false;
  let offline = false;
  const s: AttachmentStorage & { files: Map<string, number>; loseNext: () => void; setOffline: (v: boolean) => void } = {
    files,
    loseNext: () => void (loseNext = true),
    setOffline: (v) => void (offline = v),
    upload: async (path, blob) => {
      if (offline) throw new Error('Server cloud non raggiungibile');
      if (files.has(path)) return 'gia_presente';
      files.set(path, blob.size);
      if (loseNext) {
        loseNext = false;
        throw new Error('Risposta persa');
      }
      return 'caricato';
    },
    info: async (p) => (files.has(p) ? { size: files.get(p)! } : undefined),
    signedUrl: async (p) => `https://example.invalid/${p}`,
    remove: async (p) => void files.delete(p),
    usage: async () => ({ userBytes: [...files.values()].reduce((a, b) => a + b, 0), bucketBytes: 0, limitBytes: 1024 }),
  };
  return s;
}

test('Allegati: solo immagini e PDF fino a 10 MB, con i testi del design', () => {
  assert.equal(attachmentProblem({ name: 'a.jpg', type: 'image/jpeg', size: 10 * 1024 * 1024 }), undefined);
  assert.equal(attachmentProblem({ name: 'b.svg', type: 'image/svg+xml', size: 10 }), 'b.svg non allegato: sono ammessi solo immagini e PDF.');
  assert.equal(attachmentProblem({ name: 'c.pdf', type: 'application/pdf', size: 12.4 * 1024 * 1024 }), 'c.pdf non allegato: pesa 12,4 MB, il massimo è 10 MB.');
  assert.equal(storagePath('u', 't', 'a'), 'u/t/a');
  assert.deepEqual(usageInfo(820 * 1024 * 1024), { pct: 80, warn: true });
  assert.equal(usageInfo(100).warn, false);
});

test('Allegati: caricati una volta sola anche con risposta persa; file di un altro dispositivo non si caricano da qui', async () => {
  const t = tripWith();
  assert.deepEqual(notUploaded(t).map((x) => x.attachment.id), ['a1', 'a2'], 'le voci eliminate non contano');
  const st = fakeStorage();
  const blobs = new Map([['a1', new Blob(['x'.repeat(1000)])]]);
  st.loseNext();
  const first = await uploadPending(t, 'u', st, async (id) => blobs.get(id));
  assert.deepEqual(first.uploaded, []);
  assert.match(first.errors.a1!, /persa/);
  assert.deepEqual(first.elsewhere, ['a2']);
  const again = await uploadPending(t, 'u', st, async (id) => blobs.get(id));
  assert.equal(again.uploaded.length, 1, '«già esistente» vale come riuscito');
  assert.equal(st.files.size, 1, 'un solo file nello Storage');
  const done = markUploaded(t, 'a1', again.uploaded[0]!.path, again.uploaded[0]!.at);
  const a1 = done.diary![0]!.attachments![0]!;
  assert.equal(a1.state, 'nel_cloud');
  assert.equal(a1.storagePath, `u/${t.id}/a1`);
  assert.deepEqual(notUploaded(done).map((x) => x.attachment.id), ['a2']);
  assert.equal(markUploaded(done, 'a1', 'x', 'y'), done, 'nessun cambiamento se già caricato');
  // Metadati nelle righe: lo stato «nel_cloud» e il percorso tornano identici
  const back = fromRows(JSON.parse(JSON.stringify(toRows({ ...done, countries: [{ code: 'NO', releaseId: 'NO-1' }] }).rows)));
  assert.deepEqual(back.diary![0]!.attachments![0], a1);
});

test('Allegati: senza rete ci si ferma e si riprova dopo, senza perdere la copia locale', async () => {
  const t = tripWith();
  const st = fakeStorage();
  st.setOffline(true);
  const blobs = new Map([['a1', new Blob(['a'])], ['a2', new Blob(['b'])]]);
  const states: string[] = [];
  const r = await uploadPending(t, 'u', st, async (id) => blobs.get(id), (id, s) => states.push(`${id}:${s ?? 'ok'}`));
  assert.equal(Object.keys(r.errors).length, 1, 'al primo errore di rete si aspetta il ritorno della connessione');
  assert.deepEqual(states, ['a1:in_caricamento', 'a1:errore']);
  st.setOffline(false);
  const ok = await uploadPending(t, 'u', st, async (id) => blobs.get(id));
  assert.equal(ok.uploaded.length, 2);
  assert.equal(blobs.size, 2, 'la copia sul dispositivo resta come cache');
});

test('Allegati: percorso con il proprietario del viaggio; «già esistente» vale solo se la dimensione coincide', async () => {
  const t = tripWith();
  const st = fakeStorage();
  const blobs = new Map([['a1', new Blob(['x'.repeat(1000)])], ['a2', new Blob(['y'.repeat(2000)])]]);
  // Un file con lo stesso nome ma dimensione diversa è già nel cloud (es. caricamento interrotto o file sbagliato)
  st.files.set(`proprietario/${t.id}/a2`, 5);
  const r = await uploadPending(t, 'proprietario', st, async (id) => blobs.get(id));
  assert.deepEqual(r.uploaded.map((u) => u.path), [`proprietario/${t.id}/a1`], 'il percorso usa il proprietario passato, non chi carica');
  assert.match(r.errors.a2!, /dimensione diversa \(5 byte invece di 2000\)/);
  assert.equal(st.files.get(`proprietario/${t.id}/a2`), 5, 'nessuna sovrascrittura');
  // Stesso file (risposta persa): già presente con la stessa dimensione → riuscito
  st.files.set(`proprietario/${t.id}/a2`, 2000);
  const again = await uploadPending(t, 'proprietario', st, async (id) => blobs.get(id));
  assert.ok(again.uploaded.some((u) => u.id === 'a2'));
  // Dimensione non leggibile: errore, si riprova
  const blind = { ...fakeStorage(), info: async () => undefined };
  blind.files.set(`p/${t.id}/a1`, 1000);
  const b = await uploadPending(t, 'p', blind, async (id) => blobs.get(id));
  assert.match(b.errors.a1!, /non se ne può leggere la dimensione/);
});
