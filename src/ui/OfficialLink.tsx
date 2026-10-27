import { OFFICIAL_KIND_LABEL, OFFICIAL_SITES } from '../data/officialSites';

/** Link al sito ufficiale (o del gestore / ente turistico) di una destinazione del catalogo. */
export function OfficialLink({ id, compact = false }: { id: string; compact?: boolean }) {
  const s = OFFICIAL_SITES[id];
  if (!s) return null;
  let host = '';
  try {
    host = new URL(s.url).hostname.replace(/^www\./, '');
  } catch {
    host = s.url;
  }
  return (
    <a className="official-link" href={s.url} target="_blank" rel="noreferrer" title={`${OFFICIAL_KIND_LABEL[s.kind]}: ${s.url}`}>
      {compact ? '🔗' : `${OFFICIAL_KIND_LABEL[s.kind]} · ${host}`} ↗
    </a>
  );
}
