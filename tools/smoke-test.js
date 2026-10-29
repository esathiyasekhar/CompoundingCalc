// Smoke test: engine test page, every page and preset, Help anchors, versions, phone width.
// Usage: node tools/smoke-test.js      (needs: npm install, npx playwright install chromium)
const { chromium } = require('playwright');
const { start, blockFonts } = require('./server');
(async () => {
  const srv = await start();
  const b = await chromium.launch();
  const fails = [];
  const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) fails.push(msg); };
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await blockFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());

  await p.goto(srv.url + 'test_runner.html'); await p.waitForTimeout(1500);
  check(/ALL 8 TEST SUITES PASSED/.test(await p.textContent('body')), 'engine test suites');

  await p.goto(srv.url + 'index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800);
  const v = await p.evaluate(() => ({ meta: document.querySelector('meta[name="app-version"]').content, labels: [...document.querySelectorAll('[data-app="version"]')].map(e => e.textContent), title: document.title }));
  check(v.labels.every(x => x === v.meta) && v.title.endsWith(v.meta), `version ${v.meta} everywhere`);
  check(await p.textContent('#kpi-total-corpus') === '₹22.91 Cr', 'standard plan corpus ₹22.91 Cr');
  check(await p.textContent('#kpi-irr') === '20.51%', 'standard plan IRR 20.51%');

  for (const [tab, anchor] of [['tab-core', 'core'], ['tab-plan', 'goal'], ['tab-actuals', 'review'], ['tab-youngsters', 'youngster']]) {
    await p.click(`button[data-tab="${tab}"]`); await p.waitForTimeout(200);
    await p.click('#btn-help'); await p.waitForTimeout(1200);
    const top = await p.frameLocator('#manual-frame').locator('#' + anchor).evaluate(e => Math.round(e.getBoundingClientRect().top));
    check(top < 40, `Help opens at #${anchor}`);
    await p.click('[data-close="modal-help"]');
  }

  await p.click('button[data-tab="tab-core"]'); await p.click('#btn-real-view'); await p.waitForTimeout(300);
  check(await p.textContent('#kpi-total-corpus') === '₹3.99 Cr', 'INF_ADJ ON at 6%: ₹3.99 Cr');
  await p.click('#btn-real-view');

  await p.click('#btn-presets');
  const ids = await p.$$eval('.preset-item', els => els.map(e => e.getAttribute('data-preset')));
  await p.keyboard.press('Escape');
  for (const id of ids) {
    await p.click('#btn-presets'); await p.click(`.preset-item[data-preset="${id}"]`); await p.waitForTimeout(250);
  }
  check(ids.length >= 20, `${ids.length} presets ran`);
  await p.click('#btn-preset-close');

  const q = await b.newPage({ viewport: { width: 400, height: 860 } });
  await blockFonts(q);
  await q.goto(srv.url + 'index.html'); await q.waitForTimeout(600);
  for (const tab of ['tab-core', 'tab-plan', 'tab-actuals', 'tab-youngsters']) {
    await q.click(`button[data-tab="${tab}"]`); await q.waitForTimeout(250);
    check(await q.evaluate(() => document.documentElement.scrollWidth) <= 400, `no sideways scroll at 400 px on ${tab}`);
  }
  check(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join('; ') : ''));
  await b.close(); srv.close();
  console.log(fails.length ? `\n${fails.length} check(s) failed` : '\nAll checks passed');
  process.exit(fails.length ? 1 : 0);
})();
