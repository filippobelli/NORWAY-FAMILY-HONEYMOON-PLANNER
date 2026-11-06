import type { TripSummary } from './tripSummary';

// Generatore PDF minimo, senza dipendenze: testo su pagine A4 con i font standard Helvetica (WinAnsiEncoding).
// Le lettere accentate italiane e norvegesi (à è é ì ò ù å ø æ) sono nella codifica; i simboli che non ci sono
// vengono sostituiti con un equivalente leggibile (→ diventa ->), mai omessi in silenzio.

const W = 595.28;
const H = 841.89;
const M = 50;

/** Larghezze Helvetica (unità /1000) per i caratteri stampabili ASCII 32–126, dalle metriche standard Adobe. */
const HELV = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278,
  500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278,
  556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];
const charWidth = (code: number, bold: boolean) => {
  const base = code >= 32 && code <= 126 ? HELV[code - 32]! : 600;
  return bold ? base * 1.08 : base;
};

const SPECIAL: Record<string, number> = { '€': 0x80, '‚': 0x82, '„': 0x84, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '™': 0x99 };
const REPLACE: Record<string, string> = { '→': '->', '←': '<-', '↗': '', '✓': 'v', '×': 'x', '≈': '~', '·': '·' };

/** Testo → byte WinAnsi. */
export function winAnsi(text: string): number[] {
  const out: number[] = [];
  for (const raw of text.normalize('NFC')) {
    const ch = REPLACE[raw] ?? raw;
    for (const c of ch) {
      const code = c.codePointAt(0)!;
      if (SPECIAL[c] !== undefined) out.push(SPECIAL[c]!);
      else if (code === 9) out.push(32);
      else if ((code >= 32 && code <= 126) || (code >= 0xa0 && code <= 0xff)) out.push(code);
      else out.push(63); // «?» per i caratteri non rappresentabili
    }
  }
  return out;
}

function widthOf(bytes: number[], size: number, bold: boolean): number {
  return (bytes.reduce((s, b) => s + charWidth(b, bold), 0) / 1000) * size;
}

/** Spezza un testo in righe che stanno nella larghezza data. */
export function wrap(text: string, size: number, bold: boolean, max = W - 2 * M): number[][] {
  const words = text.split(/\s+/).filter(Boolean).map(winAnsi);
  const lines: number[][] = [];
  let cur: number[] = [];
  const space = [32];
  for (let w of words) {
    // Parola più lunga della riga (es. un link): si spezza a forza
    while (widthOf(w, size, bold) > max) {
      let k = w.length;
      while (k > 1 && widthOf(w.slice(0, k), size, bold) > max) k--;
      if (cur.length) lines.push(cur);
      lines.push(w.slice(0, k));
      cur = [];
      w = w.slice(k);
    }
    const next = cur.length ? [...cur, ...space, ...w] : w;
    if (widthOf(next, size, bold) > max && cur.length) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur.length) lines.push(cur);
  return lines.length ? lines : [[]];
}

const pdfString = (bytes: number[]) =>
  '(' +
  bytes
    .map((b) => (b === 40 || b === 41 || b === 92 ? `\\${String.fromCharCode(b)}` : b < 32 || b > 126 ? `\\${b.toString(8).padStart(3, '0')}` : String.fromCharCode(b)))
    .join('') +
  ')';

interface Line {
  bytes: number[];
  size: number;
  bold: boolean;
  indent: number;
  before: number;
}

function layout(sum: TripSummary): Line[] {
  const out: Line[] = [];
  const add = (text: string, size: number, bold: boolean, before: number, indent = 0) => {
    wrap(text, size, bold, W - 2 * M - indent).forEach((b, i) => out.push({ bytes: b, size, bold, indent, before: i === 0 ? before : 0 }));
  };
  add(sum.title, 20, true, 0);
  add(sum.subtitle, 10, false, 6);
  add(`Creato il ${new Date(sum.generatedAt).toLocaleString('it-IT')}. Contiene solo i dati inseriti nel viaggio.`, 9, false, 4);
  for (const sec of sum.sections) {
    add(sec.heading, 14, true, 18);
    if (sec.items.length === 0) add(sec.empty ?? 'Nessun dato.', 10, false, 4);
    for (const it of sec.items) {
      add(it.title, 11, true, 8);
      for (const l of it.lines) add(`• ${l}`, 10, false, 2, 10);
    }
  }
  return out;
}

/** PDF del riepilogo del viaggio, pronto da salvare. */
export function summaryToPdf(sum: TripSummary): Uint8Array {
  const lines = layout(sum);
  const pages: string[] = [];
  let ops: string[] = [];
  let y = H - M;
  const flush = () => {
    pages.push(ops.join('\n'));
    ops = [];
    y = H - M;
  };
  for (const l of lines) {
    const lead = l.size * 1.3;
    if (y - l.before - lead < M) flush();
    y -= l.before + lead;
    ops.push(`BT /${l.bold ? 'F2' : 'F1'} ${l.size} Tf 0 0.125 0.357 rg ${(M + l.indent).toFixed(2)} ${y.toFixed(2)} Td ${pdfString(l.bytes)} Tj ET`);
  }
  if (ops.length || pages.length === 0) flush();
  // Numero di pagina in fondo
  pages.forEach((p, i) => {
    const label = winAnsi(`${sum.title} · pagina ${i + 1} di ${pages.length}`);
    pages[i] = `${p}\nBT /F1 8 Tf 0.29 0.33 0.41 rg ${M} 28 Td ${pdfString(label)} Tj ET`;
  });

  const objs: string[] = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  const kids: number[] = [];
  pages.forEach((content, i) => {
    const pageId = 5 + i * 2;
    const contId = pageId + 1;
    kids.push(pageId);
    objs[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contId} 0 R >>`;
    objs[contId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });
  objs[2] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;
  objs[objs.length] = `<< /Title ${pdfString(winAnsi(sum.title))} /Producer (Norway Family Honeymoon Planner) >>`;
  const infoId = objs.length - 1;

  // Tutto il contenuto è ASCII (i byte oltre 127 sono scritti in ottale): lunghezze e offset coincidono con i caratteri
  let out = '%PDF-1.4\n%âãÏÓ\n'.replace(/[\u0080-ÿ]/g, (c) => c);
  const header = out;
  const offsets: number[] = [];
  let body = '';
  for (let i = 1; i < objs.length; i++) {
    offsets[i] = header.length + body.length;
    body += `${i} 0 obj\n${objs[i]}\nendobj\n`;
  }
  out = header + body;
  const xrefAt = out.length;
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objs.length; i++) out += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  // Ogni carattere è un byte (latin-1): così gli offset restano esatti
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
  return bytes;
}
