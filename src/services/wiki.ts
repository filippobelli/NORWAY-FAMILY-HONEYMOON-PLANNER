import type { WikiRef } from '../data/wiki';

// Foto da Wikimedia Commons e testi da Wikipedia, letti al momento con le API pubbliche (CORS abilitato).
// Nulla viene copiato nel codice: si mostrano sempre autore, licenza e link alla fonte.

// Larghezze standard di Wikimedia (250, 330, 500, 960, 1280…): le miniature sono già pronte; con larghezze
// diverse il server le genera al momento e per le foto grandi può impiegare oltre 30 secondi (visto il 27/10/2026).
export function commonsImageUrl(file: string, width = 500): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

export function commonsFilePage(file: string): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`;
}

export interface ImageCredit {
  author: string;
  license: string;
  licenseUrl?: string;
  pageUrl: string;
}

export interface WikiIntro {
  text: string;
  lang: 'it' | 'en';
  url: string;
  title: string;
}

const TTL = 30 * 24 * 3600 * 1000;
const mem = new Map<string, unknown>();

function cacheGet<T>(key: string): T | undefined {
  if (mem.has(key)) return mem.get(key) as T;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    const { at, v } = JSON.parse(raw) as { at: number; v: T };
    if (Date.now() - at > TTL) return undefined;
    mem.set(key, v);
    return v;
  } catch {
    return undefined;
  }
}

function cacheSet<T>(key: string, v: T): void {
  mem.set(key, v);
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), v }));
  } catch {
    /* spazio esaurito o storage bloccato: resta la cache in memoria */
  }
}

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export async function fetchImageCredit(file: string, signal?: AbortSignal): Promise<ImageCredit> {
  const key = `nfhp.wiki.img.${file}`;
  const hit = cacheGet<ImageCredit>(key);
  if (hit) return hit;
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=extmetadata&titles=${encodeURIComponent(`File:${file}`)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Commons ${res.status}`);
  const j = (await res.json()) as { query?: { pages?: Record<string, { imageinfo?: { extmetadata?: Record<string, { value?: string }> }[] }> } };
  const page = Object.values(j.query?.pages ?? {})[0];
  const md = page?.imageinfo?.[0]?.extmetadata ?? {};
  const credit: ImageCredit = {
    author: stripHtml(md.Artist?.value ?? '') || 'autore non indicato',
    license: md.LicenseShortName?.value ?? 'licenza da verificare',
    licenseUrl: md.LicenseUrl?.value,
    pageUrl: commonsFilePage(file),
  };
  cacheSet(key, credit);
  return credit;
}

/** Riduce il testo a un numero massimo di caratteri, chiudendo su una frase intera. */
export function trimToSentences(text: string, max = 1100): string {
  const clean = text.replace(/\n{2,}/g, '\n').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'));
  return (end > 200 ? cut.slice(0, end + 1) : cut) + ' …';
}

async function intro(lang: 'it' | 'en', title: string, signal?: AbortSignal): Promise<WikiIntro | undefined> {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro=1&explaintext=1&redirects=1&titles=${encodeURIComponent(title)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
  const j = (await res.json()) as { query?: { pages?: Record<string, { extract?: string; title?: string; missing?: string }> } };
  const page = Object.values(j.query?.pages ?? {})[0];
  if (!page || page.missing !== undefined || !page.extract) return undefined;
  const t = page.title ?? title;
  return { text: trimToSentences(page.extract), lang, title: t, url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(t.replace(/ /g, '_'))}` };
}

/** Introduzione della voce Wikipedia: italiano se esiste, altrimenti inglese. */
export async function fetchWikiIntro(ref: WikiRef, signal?: AbortSignal): Promise<WikiIntro | undefined> {
  const key = `nfhp.wiki.intro.${ref.qid}`;
  const hit = cacheGet<WikiIntro | null>(key);
  if (hit !== undefined) return hit ?? undefined;
  let r: WikiIntro | undefined;
  if (ref.it) r = await intro('it', ref.it, signal);
  if (!r && ref.en) r = await intro('en', ref.en, signal);
  cacheSet(key, r ?? null);
  return r;
}
