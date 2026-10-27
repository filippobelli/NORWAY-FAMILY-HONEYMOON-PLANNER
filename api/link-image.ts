// Funzione Vercel: anteprima fotografica di un link (come fanno WhatsApp o Slack).
// Legge la pagina indicata lato server (il browser non può, per via del CORS), cerca l'immagine che il sito
// stesso dichiara per le anteprime (og:image / twitter:image) e reindirizza il browser lì.
// Non salva né copia immagini: la foto resta sul sito di origine, che l'app cita con un link.
//
// Uso: <img src="/api/link-image?url=https://ut.no/hytte/...">

const MAX_BYTES = 600_000;
const TIMEOUT_MS = 6000;

function isPublicHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return false;
  if (/^\[.*\]$/.test(h) || h.includes(':')) return false; // niente indirizzi IPv6 letterali
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10 || a === 127 || a === 0 || a >= 224) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
  }
  return h.includes('.');
}

export function parseSafeUrl(raw: string | null): URL | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (u.username || u.password) return null;
    return isPublicHost(u.hostname) ? u : null;
  } catch {
    return null;
  }
}

/** Trova l'immagine di anteprima dichiarata dalla pagina. */
export function findPreviewImage(html: string, base: URL): string | null {
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  const wanted = ['og:image:secure_url', 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src', 'image', 'thumbnail'];
  const found: Record<string, string> = {};
  for (const tag of metas) {
    const key = tag.match(/\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    const content = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1];
    if (key && content && wanted.includes(key) && !found[key]) found[key] = content;
  }
  // <link rel="image_src" href="..."> (vecchio standard, ancora usato da alcuni siti)
  const linkSrc = (html.match(/<link\b[^>]*rel\s*=\s*["']image_src["'][^>]*>/i)?.[0] ?? '').match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
  if (linkSrc) found.image_src = linkSrc;
  for (const k of [...wanted, 'image_src']) {
    const v = found[k];
    if (!v) continue;
    try {
      const u = new URL(v.replace(/&amp;/g, '&'), base);
      // Molti siti piccoli dichiarano il loro logo come immagine di anteprima: non è una foto della struttura
      if (/logo|favicon|icon|placeholder/i.test(u.pathname)) continue;
      if (u.protocol === 'https:' || u.protocol === 'http:') return u.toString();
    } catch {
      /* valore non valido: si prova il successivo */
    }
  }
  return null;
}

async function readLimited(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    size += value.length;
    // L'anteprima sta nell'<head>: appena finisce non serve leggere il resto
    if (new TextDecoder().decode(value).includes('</head>')) break;
  }
  await reader.cancel().catch(() => undefined);
  const all = new Uint8Array(size);
  let off = 0;
  for (const c of chunks) {
    all.set(c, off);
    off += c.length;
  }
  return new TextDecoder().decode(all);
}

export async function GET(request: Request): Promise<Response> {
  const target = parseSafeUrl(new URL(request.url).searchParams.get('url'));
  if (!target) return new Response('Indirizzo non valido', { status: 400 });

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    let url = target;
    let res: Response | undefined;
    // Segue al massimo 3 reindirizzamenti, ricontrollando ogni volta che l'indirizzo sia pubblico
    for (let i = 0; i < 4; i++) {
      res = await fetch(url, {
        redirect: 'manual',
        signal: ac.signal,
        // Molti siti (visitnorway.com, Booking) rifiutano gli agenti "sconosciuti": ci si presenta come un browser
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
          accept: 'text/html,application/xhtml+xml',
          'accept-language': 'nb,en;q=0.8,it;q=0.6',
        },
      });
      const loc = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && loc) {
        const next = parseSafeUrl(new URL(loc, url).toString());
        if (!next) return new Response('Reindirizzamento non consentito', { status: 400 });
        url = next;
        continue;
      }
      break;
    }
    if (!res || !res.ok) return new Response('Pagina non disponibile', { status: 404, headers: { 'cache-control': 'public, s-maxage=3600' } });
    if (!(res.headers.get('content-type') ?? '').includes('html')) return new Response('Non è una pagina web', { status: 404 });
    const image = findPreviewImage(await readLimited(res), url);
    if (!image) return new Response('Nessuna immagine di anteprima', { status: 404, headers: { 'cache-control': 'public, s-maxage=86400' } });
    return new Response(null, { status: 302, headers: { location: image, 'cache-control': 'public, max-age=86400, s-maxage=604800' } });
  } catch {
    return new Response('Sito non raggiungibile', { status: 404, headers: { 'cache-control': 'public, s-maxage=600' } });
  } finally {
    clearTimeout(timer);
  }
}
