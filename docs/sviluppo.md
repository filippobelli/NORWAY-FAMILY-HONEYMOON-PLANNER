# Sviluppo · Acquario di Tromsø (Polaria)

Data: 2026-11-04 · Agente sviluppatore · Piano: `docs/piano-2026-11-04-acquario-tromso.md`

## Ramo
`fix/acquario-tromso` (creato da `main`, nessun commit fatto).

## File cambiati
- `src/data/destinations.ts` — nome e descrizione di Polaria contengono «acquario», così la ricerca del catalogo la trova; descrizione con «Tromsø» perché la trovi anche quella ricerca. Id `polaria`, coordinate, categoria, punteggi, durata e accesso invariati; nessun `localName` aggiunto (non c'era).

## Righe cambiate (`git diff`)
```diff
-  ['polaria', 'Polaria', 'musei', 'Troms e Finnmark', 69.643, 18.949, 3, 'facile', [1, 2], 'Centro artico con foche barbate.', 'Tromsø.'],
+  ['polaria', 'Polaria – acquario artico', 'musei', 'Troms e Finnmark', 69.643, 18.949, 3, 'facile', [1, 2], 'Acquario artico di Tromsø con foche barbate.', 'Tromsø.'],
```

## Controlli
- Nessun test confronta il nome «Polaria» (`grep -rn "Polaria" src tests`: solo dati di coordinate, sito ufficiale e Wikidata, legati all'id).
- La ricerca del catalogo (`src/ui/CatalogView.tsx`, riga 27) cerca in nome, nome locale e descrizione.
- `node_modules` è installato per Windows: test e lint sono stati eseguiti dalla VM Linux con `ESBUILD_BINARY_PATH` puntato a un esbuild Linux della stessa versione (0.28.2), senza toccare `node_modules`.

| Comando | Esito |
|---|---|
| `npm run typecheck` | OK |
| `npm test` | OK, 141/141 |
| `npm run lint` | 2 errori **preesistenti** in `src/ui/ConfiguratorView.tsx` riga 97 (`_m`, `_s` non usati); file non toccato |
| `npm run build` | non eseguibile dalla VM (manca il binario Linux di Rollup); il controllo TypeScript della build è OK. Da eseguire su Windows |
| ricerca «acquario» (filtro del catalogo) | trova `polaria` (più Bergen, Ålesund, Acquario di Bergen, Atlanterhavsparken) |
| ricerca «Tromsø» | trova `tromso`, `tos` e `polaria` |

## Da segnalare
- Descrizione portata a «Acquario artico di Tromsø con foche barbate.» su approvazione del capo progetto, perché la ricerca «Tromsø» trovi Polaria (Tromsø era già nel campo accesso della scheda: nessun dato nuovo).
- Errori di lint in `ConfiguratorView.tsx` già presenti su `main`.

## Cosa deve fare Filippo
1. Aprire il terminale nella cartella del progetto su Windows.
2. Eseguire `npm run build` e controllare che finisca senza errori.
3. Eseguire `git add src/data/destinations.ts docs/sviluppo.md`.
4. Eseguire `git commit -m "Polaria: nome e descrizione con «acquario»"`.
5. Eseguire `git push -u origin fix/acquario-tromso`.
