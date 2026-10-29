// Rebuilds manual/Compounding-Calculator-User-Manual.pdf and ...-Design-Manual.pdf from the HTML manuals.
// Usage: node tools/manual-pdfs.js
const { chromium } = require('playwright');
const path = require('path');
const { start, blockFonts, ROOT } = require('./server');
const jobs = [['user-manual', 'Compounding-Calculator-User-Manual.pdf', 'User manual'], ['design-manual', 'Compounding-Calculator-Design-Manual.pdf', 'Design manual']];
(async () => {
  const srv = await start();
  const b = await chromium.launch();
  for (const [page, out, label] of jobs) {
    const p = await b.newPage();
    await blockFonts(p);
    await p.goto(`${srv.url}manual/${page}.html?theme=light`);
    const version = await p.evaluate(() => (document.querySelector('.cover-meta strong') || {}).textContent || '');
    await p.evaluate(async () => { await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))); });
    await p.emulateMedia({ media: 'print' });
    const footer = `<div style="width:100%;font-family:'IBM Plex Sans',Inter,sans-serif;font-size:7.5pt;color:#6B7A90;padding:0 15mm;display:flex;justify-content:space-between"><span>Compounding Calculator v${version} · ${label}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
    await p.pdf({ path: path.join(ROOT, 'manual', out), preferCSSPageSize: true, printBackground: true, displayHeaderFooter: true, headerTemplate: '<div></div>', footerTemplate: footer, tagged: true, outline: true });
    console.log('Wrote manual/' + out);
    await p.close();
  }
  await b.close(); srv.close();
})();
