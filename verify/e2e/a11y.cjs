// Accessibilità di base su tutte le viste, a 1440 e a 375 px: campi senza etichetta, controlli senza nome,
// immagini senza alt, controlli troppo piccoli sul telefono, contrasto dei testi principali (WCAG AA).
// Uso: npm run build && node verify/e2e/a11y.cjs
const { serve, launch, context, check, results } = require('./serve.cjs');

const PORT = 4182;
const VIEWS = ['panoramica', 'pianifica', 'configuratore', 'catalogo', 'scenari', 'prenotazioni', 'voli', 'crociere', 'hytte', 'giornate', 'budget', 'impostazioni', 't/oggi', 't/itinerario', 't/mappa', 't/diario', 't/altro'];

(async () => {
  const srv = serve(PORT);
  const b = await launch();
  for (const [w, h] of [
    [1440, 900],
    [375, 812],
  ]) {
    const ctx = await context(b, { viewport: { width: w, height: h } });
    await ctx.route(/unpkg|openstreetmap|openfreemap|arcgisonline|supabase\.co|routing|open-meteo/, (r) => r.abort());
    const p = await ctx.newPage();
    await p.goto(`http://localhost:${PORT}/`);
    await p.evaluate(() => localStorage.setItem('nfhp.ui.mode', 'planning'));
    await p.goto(`http://localhost:${PORT}/#/pianifica`);
    for (const q of ['Bergen', 'Flåm']) {
      await p.fill('input[aria-label="Cerca località"]', q);
      await p.click('.suggestions button >> nth=0');
    }
    for (const v of VIEWS) {
      await p.goto(`http://localhost:${PORT}/#/${v}`);
      await p.waitForTimeout(300);
      await p.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
      const issues = await p.evaluate((narrow) => {
        const out = [];
        const label = (el) => el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || el.closest('label');
        const named = (el) => label(el) || el.getAttribute('title') || el.textContent.trim();
        const visible = (el) => el.offsetParent !== null || getComputedStyle(el).position === 'fixed';
        document.querySelectorAll('input:not([type=hidden]), select, textarea').forEach((el) => visible(el) && !label(el) && out.push(`campo senza etichetta: ${el.outerHTML.slice(0, 80)}`));
        document.querySelectorAll('button, a[href], summary').forEach((el) => visible(el) && !named(el) && out.push(`controllo senza nome: ${el.outerHTML.slice(0, 80)}`));
        document.querySelectorAll('img').forEach((el) => !el.hasAttribute('alt') && out.push(`immagine senza alt: ${el.src.slice(0, 60)}`));
        // Contrasto: testo e sfondo effettivo
        const rgb = (c) => (c.match(/[\d.]+/g) || []).map(Number);
        const lum = ([r, g, b]) => [r, g, b].map((v) => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
        // Sfondo effettivo: i colori semitrasparenti si sommano sopra quelli sottostanti. Sopra una foto si considera
        // il caso peggiore, una foto bianca (le immagini non hanno un colore noto)
        const bg = (el) => {
          const layers = [];
          for (let e = el; e; e = e.parentElement) {
            const c = rgb(getComputedStyle(e).backgroundColor);
            if (c.length >= 3 && (c[3] === undefined || c[3] > 0)) {
              layers.push(c);
              if (c[3] === undefined || c[3] >= 1) break;
            }
          }
          let out = [255, 255, 255];
          for (const c of layers.reverse()) {
            const a = c[3] ?? 1;
            out = out.map((v, i) => c[i] * a + v * (1 - a));
          }
          return out;
        };
        let low = 0;
        document.querySelectorAll('p, span, a, button, li, dt, dd, label, h1, h2, h3, strong, small').forEach((el) => {
          if (!visible(el) || !el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
          const s = getComputedStyle(el);
          const ratio = (Math.max(lum(rgb(s.color)), lum(bg(el))) + 0.05) / (Math.min(lum(rgb(s.color)), lum(bg(el))) + 0.05);
          const large = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.6 && Number(s.fontWeight) >= 700);
          if (ratio < (large ? 3 : 4.5) && !el.closest('[disabled], .leaflet-container')) {
            low++;
            if (low <= 3) out.push(`contrasto ${ratio.toFixed(2)}: «${el.textContent.trim().slice(0, 40)}»`);
          }
        });
        if (narrow) {
          document.querySelectorAll('button, a.btn, .tabs a, .tab-more summary, .travel-bar a').forEach((el) => {
            if (!visible(el) || el.closest('.link-btn, .chip-x')) return;
            const r = el.getBoundingClientRect();
            if (r.height < 24 || r.width < 24) out.push(`controllo piccolo ${Math.round(r.width)}×${Math.round(r.height)}: ${(el.getAttribute('aria-label') || el.textContent).trim().slice(0, 30)}`);
          });
          if (document.documentElement.scrollWidth > document.documentElement.clientWidth) out.push(`scorrimento orizzontale ${document.documentElement.scrollWidth - document.documentElement.clientWidth}px`);
        }
        return out;
      }, w < 500);
      check(issues.length === 0, `${w}px ${v}: nessun problema`, issues.slice(0, 5).join(' | '));
    }
    await ctx.close();
  }
  console.log(`\n${results.ok} OK, ${results.fail} FAIL`);
  await b.close();
  srv.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
