// Retakes every screenshot used by the manuals (manual/img/*.jpg).
// Usage: node tools/screenshots.js     (then: node tools/manual-pdfs.js)
const { chromium } = require('playwright');
const path = require('path');
const { start, blockFonts } = require('./server');
const OUT = path.join(__dirname, '..', 'manual', 'img') + path.sep;
const seed = {
  example: { id:'example', userId:'example', name:'Example investor', createdAt:'2024-04-01T05:00:00.000Z', updatedAt:'2026-04-05T05:00:00.000Z', startYear:2024,
    params:{ selfLump:100000, selfMonthly:10000, selfInclude:true, selfStepUpOn:true, selfStepUp:10, selfStepUpMode:'pct', selfStepUpAmt:1000, selfStepUpStop:10, selfAddStop:10, selfAddStopMonths:0, coreAlloc:70, coreRet:15, satRet:25, horizon:30, spouseInclude:false, spouseLump:0, spouseMonthly:0, spouseStepUpOn:true, spouseStepUp:10, spouseStepUpMode:'pct', spouseStepUpAmt:1000, spouseStepUpStop:10, spouseAddStop:10, spouseAddStopMonths:0 },
    goal:{ target:100000000, years:20, assumedReturn:null },
    actualsHistory:{ 1:{ invested:120000, coreValue:168000, satValue:84000, recordedAt:'2025-04-03T05:00:00.000Z' }, 2:{ invested:132000, coreValue:286000, satValue:131000, recordedAt:'2026-04-05T05:00:00.000Z' } } }
};
(async () => {
  const srv = await start();
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.25 });
  await blockFonts(ctx);
  await ctx.addInitScript((s) => { try { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('compounding_calculator_user_profiles_v6', JSON.stringify(s)); s.sekhar = JSON.parse(JSON.stringify(s.example)); Object.assign(s.sekhar, {id:'sekhar', userId:'sekhar', name:'Sekhar', actualsHistory:{}}); localStorage.setItem('compounding_calculator_user_profiles_v6', JSON.stringify(s)); localStorage.setItem('compounding_calculator_active_profile_v5','sekhar'); sessionStorage.setItem('seeded','1'); } } catch(e){} }, seed);
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(srv.url + 'index.html'); await p.waitForTimeout(900);
  await p.waitForTimeout(300);
  const shot = async (name, opts={}) => { await p.waitForTimeout(350); await p.screenshot({ path: OUT + name + '.jpg', type:'jpeg', quality: 84, ...opts }); };
  const tab = async (t) => { await p.click(`button[data-tab="${t}"]`); await p.waitForTimeout(500); };
  p.on('dialog', d => d.accept());
  // 1 core overview
  await shot('core-overview');
  const c = await p.$('#growthChart'); const bb = await c.boundingBox();
  await p.mouse.move(bb.x + bb.width * 0.88, bb.y + bb.height * 0.4); await p.waitForTimeout(300);
  await shot('core-chart-tooltip', { clip: { x: bb.x - 20, y: bb.y - 70, width: bb.width + 40, height: bb.height + 90 } });
  await p.mouse.move(5, 5);
  const hd = await p.$('.app-header'); const hb = await hd.boundingBox(); await shot('header', { clip: { x: 0, y: 0, width: 1440, height: hb.y + hb.height + 62 } });
  // plan
  await tab('tab-plan'); await shot('plan-goal');
  await p.evaluate(()=>{document.getElementById('tab-plan').scrollTop=560}); await shot('plan-lower');
  await p.click('#schedule-details summary'); await p.waitForTimeout(400);
  const sd = await p.$('#schedule-details'); await sd.scrollIntoViewIfNeeded(); const sdb = await sd.boundingBox();
  await shot('plan-schedule', { clip: { x: sdb.x, y: Math.max(0, sdb.y), width: sdb.width, height: Math.min(sdb.height, 560) } });
  await p.click('#schedule-details summary'); await p.evaluate(()=>{document.getElementById('tab-plan').scrollTop=0});
  // youngster
  await tab('tab-youngsters'); await shot('youngster');
  await p.evaluate(()=>{document.getElementById('tab-youngsters').scrollTop=99999}); await shot('youngster-lower'); await p.evaluate(()=>{document.getElementById('tab-youngsters').scrollTop=0});
  // modals
  await tab('tab-core');
  await p.click('#btn-new-profile'); await shot('modal-new-user'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.click('#btn-manage-profiles'); await shot('modal-users'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.click('#btn-about'); await shot('modal-about'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  // help viewer
  await p.click('#btn-help'); await p.waitForTimeout(1200);
  await shot('help'); await p.click('[data-close="modal-help"]'); await p.waitForTimeout(300);
  // inflation
  await tab('tab-core'); await p.click('#btn-real-view'); await p.waitForTimeout(400); await shot('real-core'); await p.click('#btn-real-off'); await p.waitForTimeout(300);
  await tab('tab-plan'); await p.click('label.switch:has(#inp-goal-inflation)'); await p.waitForTimeout(400);
  await p.evaluate(() => { const t = document.getElementById('toast-container'); if (t) t.innerHTML = ''; });
  await shot('goal-inflation'); await p.click('label.switch:has(#inp-goal-inflation)'); await p.waitForTimeout(300); await tab('tab-core');
  // presets
  await p.evaluate(() => { const t = document.getElementById('toast-container'); if (t) t.innerHTML = ''; });
  await p.click('#btn-presets'); await p.waitForTimeout(300); await shot('presets-menu');
  await p.click('.preset-item[data-preset="tenx"]'); await p.waitForTimeout(500);
  await p.evaluate(() => { const t = document.getElementById('toast-container'); if (t) t.innerHTML = ''; });
  await shot('preset-note');
  await p.click('#btn-preset-close'); await p.click('#btn-reset-page'); await p.waitForTimeout(400);
  await p.evaluate(() => { const t = document.getElementById('toast-container'); if (t) t.innerHTML = ''; });
  // light
  await p.click('#theme-toggle-btn'); await shot('core-light'); await p.click('#theme-toggle-btn');
  // review with example user
  await tab('tab-actuals'); await p.selectOption('#profile-select','example'); await p.waitForTimeout(700); await p.evaluate(()=>{const t=document.getElementById('toast-container'); if(t) t.innerHTML='';});
  await shot('review'); await p.evaluate(()=>{document.getElementById('tab-actuals').scrollTop=99999}); await shot('review-lower');
  await p.selectOption('#profile-select','sekhar'); await p.waitForTimeout(600); await tab('tab-core');
  // spouse last
  await p.click('#tab-btn-spouse'); await p.click('label.switch:has(#inp-spouse-include)');
  await p.fill('#inp-spouse-lump', '50000'); await p.fill('#inp-spouse-monthly', '5000'); await p.dispatchEvent('#inp-spouse-monthly','input'); await p.waitForTimeout(400);
  await shot('core-spouse');
  const kp = await p.evaluate(() => ({ irr: document.querySelector('#kpi-irr')?.textContent, w: document.querySelector('#kpi-weighted-rate')?.textContent }));
  console.log(JSON.stringify(kp), errs, await p.evaluate(()=>document.title));
  await b.close(); srv.close();
})();
