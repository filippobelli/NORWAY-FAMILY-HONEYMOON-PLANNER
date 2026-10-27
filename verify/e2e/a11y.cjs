// Controllo di base dell'accessibilità: campi senza etichetta, pulsanti senza nome, immagini senza alt.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const srv = http.createServer((q, r) => { r.setHeader('Content-Type', 'text/html; charset=utf-8'); r.end(fs.readFileSync(path.resolve(__dirname, '../../dist-local/index.html'))); }).listen(4177);
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const p = await b.newPage();
  await p.route(/unpkg|openstreetmap|arcgisonline|supabase\.co|routing/, (r) => r.abort());
  await p.goto('http://localhost:4177/#/itinerario'); await p.waitForSelector('text=Tappe');
  for (const q of ['Bergen', 'Flåm']) { await p.fill('input[aria-label="Cerca località"]', q); await p.click('.suggestions button >> nth=0'); }
  let problems = 0;
  for (const tab of ['itinerario', 'giornate', 'catalogo', 'crociere', 'hytte', 'budget', 'scenari', 'viaggio']) {
    await p.click(`a[href="#/${tab}"]`); await p.waitForTimeout(250);
    await p.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
    const issues = await p.evaluate(() => {
      const out = [];
      const named = (el) => (el.getAttribute('aria-label') || el.getAttribute('title') || (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.closest('label') || el.textContent.trim());
      document.querySelectorAll('input:not([type=hidden]):not([hidden]), select, textarea').forEach((el) => { if (!named(el) || (el.tagName === 'SELECT' && !(el.getAttribute('aria-label') || (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.closest('label')))) out.push(`${el.tagName.toLowerCase()} ${el.outerHTML.slice(0, 90)}`); });
      document.querySelectorAll('button, a[href]').forEach((el) => { if (!named(el)) out.push('senza nome: ' + el.outerHTML.slice(0, 90)); });
      return out;
    });
    problems += issues.length;
    console.log(`${tab}: ${issues.length} problemi`); issues.slice(0, 6).forEach((i) => console.log('   ', i));
  }
  process.exitCode = problems ? 1 : 0;
  await b.close(); srv.close();
})();
