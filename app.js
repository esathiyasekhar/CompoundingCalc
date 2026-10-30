/**
 * Interactive Application Controller for Compounding Calculator
 * Wires UI, Reactive Computations, Native Canvas Visualizations, and Exports
 */

document.addEventListener('DOMContentLoaded', function () {
  const CE = window.CompoundingEngine;
  if (!CE) {
    console.error('CompoundingEngine not found!');
    return;
  }

  // --- State ---
  let state = {
    isLogScale: false,
    activeTab: 'tab-core',
    doublingTabDirty: false,
    goalReturnTouched: false,
    inflation: (() => { try { const v = parseFloat(localStorage.getItem('compounding_calculator_inflation')); return isNaN(v) ? 6 : v; } catch (e) { return 6; } })(),
    realView: (() => { try { return localStorage.getItem('compounding_calculator_real_view') === '1'; } catch (e) { return false; } })(),
    reviewPending: {},
    soloRows: null,
    isDirty: false,
    actualsHistory: {}, // { yr: { coreReturn: 0.25, satReturn: 0.35 } }
    hoverYear: null,
    lastResult: null,
    growthChartCanvas: document.getElementById('growthChart'),
    spouseChartCanvas: null
  };

  // --- DOM Elements Cache ---
  const els = {
    // Inputs
    coreAlloc: document.getElementById('inp-core-alloc'),
    dispCoreAlloc: document.getElementById('disp-core-alloc'),
    labelCoreSplit: document.getElementById('label-core-split'),
    labelSatSplit: document.getElementById('label-sat-split'),
    barCoreSegment: document.getElementById('bar-core-segment'),
    barSatSegment: document.getElementById('bar-sat-segment'),

    coreRet: document.getElementById('inp-core-ret'),
    dispCoreRet: document.getElementById('disp-core-ret'),
    satRet: document.getElementById('inp-sat-ret'),
    dispSatRet: document.getElementById('disp-sat-ret'),

    horizon: document.getElementById('inp-horizon'),
    dispHorizon: document.getElementById('disp-horizon'),
    kpiHorizonYr: document.getElementById('kpi-horizon-yr'),

    selfLump: document.getElementById('inp-self-lump'),
    selfMonthly: document.getElementById('inp-self-monthly'),
    selfInclude: document.getElementById('inp-self-include'),
    selfAdditionsContainer: document.getElementById('self-additions-container'),
    selfStepUp: document.getElementById('inp-self-stepup'),
    dispSelfStepUp: document.getElementById('disp-self-stepup'),
    selfStepUpStop: document.getElementById('inp-self-stepup-stop'),
    selfAddStop: document.getElementById('inp-self-add-stop'),

    spouseInclude: document.getElementById('inp-spouse-include'),
    spouseContainer: document.getElementById('spouse-inputs-container'),
    spouseLump: document.getElementById('inp-spouse-lump'),
    spouseMonthly: document.getElementById('inp-spouse-monthly'),
    spouseStepUp: document.getElementById('inp-spouse-stepup'),
    dispSpouseStepUp: document.getElementById('disp-spouse-stepup'),
    spouseStepUpStop: document.getElementById('inp-spouse-stepup-stop'),
    spouseAddStop: document.getElementById('inp-spouse-add-stop'),

    // Contributions Tabbed Panel
    tabBtnSelf: document.getElementById('tab-btn-self'),
    tabBtnSpouse: document.getElementById('tab-btn-spouse'),
    paneSelf: document.getElementById('pane-self'),
    paneSpouse: document.getElementById('pane-spouse'),
    chipSelfVal: document.getElementById('chip-self-val'),
    chipSpouseVal: document.getElementById('chip-spouse-val'),

    // Doubling Tab
    inpDoublingCoreRet: document.getElementById('inp-doubling-core-ret'),
    dispDoublingCoreRet: document.getElementById('disp-doubling-core-ret'),
    inpDoublingSatRet: document.getElementById('inp-doubling-sat-ret'),
    dispDoublingSatRet: document.getElementById('disp-doubling-sat-ret'),
    inpDoublingSplit: document.getElementById('inp-doubling-split'),
    dispDoublingSplit: document.getElementById('disp-doubling-split'),
    inpDoublingLump: document.getElementById('inp-doubling-lump'),
    btnDoublingSyncFrom: document.getElementById('btn-doubling-sync-from'),
    btnDoublingApplyTo: document.getElementById('btn-doubling-apply-to'),
    doublingKpiIrr: document.getElementById('doubling-kpi-irr'),
    doublingKpiTime: document.getElementById('doubling-kpi-time'),
    doublingKpiTimeSub: document.getElementById('doubling-kpi-time-sub'),
    doublingKpiRule72: document.getElementById('doubling-kpi-rule72'),
    doublingKpiMultiplier: document.getElementById('doubling-kpi-multiplier'),
    doublingKpi30yrVal: document.getElementById('doubling-kpi-30yr-val'),
    doublingKpiCount: document.getElementById('doubling-kpi-count'),
    doublingSensitivityTbody: document.getElementById('doubling-sensitivity-tbody'),

    // KPIs
    kpiTotalCorpus: document.getElementById('kpi-total-corpus'),
    kpiTotalCorpusExact: document.getElementById('kpi-total-corpus-exact'),
    kpiMultipleBadge: document.getElementById('kpi-multiple-badge'),
    kpiTotalInvested: document.getElementById('kpi-total-invested'),
    kpiInvestedExact: document.getElementById('kpi-invested-exact'),
    kpiWealthGain: document.getElementById('kpi-wealth-gain'),
    kpiWealthGainPill: document.getElementById('kpi-wealth-gain-pill'),
    kpiIrr: document.getElementById('kpi-irr'),
    kpiWeightedRate: document.getElementById('kpi-weighted-rate'),
    kpiDoublingTime: document.getElementById('kpi-doubling-time'),
    kpiNext2x: document.getElementById('kpi-next-2x'),

    kpiCoreCorpus: document.getElementById('kpi-core-corpus'),
    kpiCoreSub: document.getElementById('kpi-core-sub'),
    kpiSatCorpus: document.getElementById('kpi-sat-corpus'),
    kpiSatSub: document.getElementById('kpi-sat-sub'),

    dispInitialSum: document.getElementById('disp-initial-sum'),
    summaryMilestonesTbody: document.getElementById('summary-milestones-tbody'),
    fullScheduleTbody: document.getElementById('full-schedule-tbody'),

    // Goal Tab
    goalTarget: document.getElementById('inp-goal-target'),
    goalYears: document.getElementById('inp-goal-years'),
    goalTimeToHit: document.getElementById('goal-time-to-hit'),
    goalTimeSub: document.getElementById('goal-time-sub'),
    goalRequiredSIP: document.getElementById('goal-required-sip'),
    goalRequiredRate: document.getElementById('goal-required-rate'),

    // Youngster Tab Controls & Displays
    inpYoungsterAge: document.getElementById('inp-youngster-age'),
    dispYoungsterAge: document.getElementById('disp-youngster-age'),
    dispYoungsterHorizon: document.getElementById('disp-youngster-horizon'),
    inpYoungsterMonthly: document.getElementById('inp-youngster-monthly'),
    inpYoungsterLump: document.getElementById('inp-youngster-lump'),
    goalInflation: document.getElementById('inp-goal-inflation'),
    inpInflation: document.getElementById('inp-inflation'),
    inpYoungsterHz: document.getElementById('inp-youngster-hz'),
    inpYoungsterStepUpEnable: document.getElementById('inp-youngster-stepup-enable'),
    inpYoungsterStepUpPct: document.getElementById('inp-youngster-stepup-pct'),
    dispYoungsterStepUp: document.getElementById('disp-youngster-stepup'),
    inpYoungsterStepUpStop: document.getElementById('inp-youngster-stepup-stop'),
    dispYoungsterStepUpStop: document.getElementById('disp-youngster-stepup-stop'),
    groupYoungsterStepUpStop: document.getElementById('group-youngster-stepup-stop'),
    inpYoungsterAddStop: document.getElementById('inp-youngster-add-stop'),
    dispYoungsterAddStop: document.getElementById('disp-youngster-add-stop'),
    inpYoungsterAlloc: document.getElementById('inp-youngster-alloc'),
    inpYoungsterCoreRet: document.getElementById('inp-youngster-core-ret'),
    inpYoungsterSatRet: document.getElementById('inp-youngster-sat-ret'),

    // Youngster KPIs
    ykpiCorpus50: document.getElementById('ykpi-corpus-50'),
    ykpiCorpus50Exact: document.getElementById('ykpi-corpus-50-exact'),
    ykpiMult50: document.getElementById('ykpi-mult-50'),
    ykpiCorpus60: document.getElementById('ykpi-corpus-60'),
    ykpiCorpus60Exact: document.getElementById('ykpi-corpus-60-exact'),
    ykpiMult60: document.getElementById('ykpi-mult-60'),
    ykpiCorpus: document.getElementById('ykpi-corpus'),
    ykpiCorpusExact: document.getElementById('ykpi-corpus-exact'),
    ykpiMult70: document.getElementById('ykpi-mult-70'),
    ykpiInvested: document.getElementById('ykpi-invested'),
    ykpiInvestedSub: document.getElementById('ykpi-invested-sub'),
    ykpiGain: document.getElementById('ykpi-gain'),
    ykpiGainShare: document.getElementById('ykpi-gain-share'),
    ykpiMultiple: document.getElementById('ykpi-multiple'),
    ykpiMultipleSub: document.getElementById('ykpi-multiple-sub'),
    ykpiDelay5: document.getElementById('ykpi-delay-5'),
    ykpiDelay5Loss: document.getElementById('ykpi-delay-5-loss'),

    // Youngster Comparison & Milestones
    youngsterCards: document.getElementById('youngster-comparison-cards'),
    dispDelayCurrentAge: document.getElementById('disp-delay-current-age'),
    dispTimelineStartAge: document.getElementById('disp-timeline-start-age'),
    youngsterTimelineTbody: document.getElementById('youngster-timeline-tbody'),

    // Spouse Tab
    spouseTimeSaved: document.getElementById('spouse-time-saved'),
    spouseCompSolo: document.getElementById('spouse-comp-solo'),
    spouseCompSoloInv: document.getElementById('spouse-comp-solo-inv'),
    spouseCompTeam: document.getElementById('spouse-comp-team'),
    spouseCompTeamInv: document.getElementById('spouse-comp-team-inv'),
    spouseCompExtra: document.getElementById('spouse-comp-extra'),
    spouseCompMultiplier: document.getElementById('spouse-comp-multiplier'),
    spouseCompYearsSaved: document.getElementById('spouse-comp-years-saved'),
    spouseCompReachYr: document.getElementById('spouse-comp-reach-yr'),

    // Actuals Tab
    actualsTbody: document.getElementById('actuals-table-tbody'),
    ccRevisedCorpus: document.getElementById('cc-revised-corpus'),
    ccVarianceText: document.getElementById('cc-variance-text'),
    ccRequiredRate: document.getElementById('cc-required-rate'),
    ccRateDiff: document.getElementById('cc-rate-diff'),
    ccRequiredSIP: document.getElementById('cc-required-sip'),
    ccSipDiff: document.getElementById('cc-sip-diff'),
    btnAddActualYr: document.getElementById('btn-add-actual-yr'),
    btnResetActuals: document.getElementById('btn-reset-actuals'),

    // Profiles & Modals
    profileSelect: document.getElementById('profile-select'),
    profileStatusBadge: document.getElementById('profile-status-badge'),
    btnSaveProfile: document.getElementById('btn-save-profile'),
    btnNewProfile: document.getElementById('btn-new-profile'),
    btnManageProfiles: document.getElementById('btn-manage-profiles'),
    modalNewProfile: document.getElementById('modal-new-profile'),
    modalManageProfiles: document.getElementById('modal-manage-profiles'),
    modalPrintOptions: document.getElementById('modal-print-options'),
    newProfileNameInput: document.getElementById('new-profile-name-input'),
    newProfileTemplateSelect: document.getElementById('new-profile-template-select'),
    btnConfirmCreateProfile: document.getElementById('btn-confirm-create-profile'),
    profilesListContainer: document.getElementById('profiles-list-container'),
    btnExportProfilesJson: document.getElementById('btn-export-profiles-json'),
    inpImportProfilesJson: document.getElementById('inp-import-profiles-json'),
    btnTriggerPrint: document.getElementById('btn-trigger-print'),
    printUserName: document.getElementById('print-user-name'),
    printReportDate: document.getElementById('print-report-date'),
    printReportHorizon: document.getElementById('print-report-horizon'),
    toastContainer: document.getElementById('toast-container'),

    // Redesign additions
    compInvestedSeg: document.getElementById('comp-invested-seg'),
    compGainSeg: document.getElementById('comp-gain-seg'),
    splitCoreSeg: document.getElementById('split-core-seg'),
    splitSatSeg: document.getElementById('split-sat-seg'),
    splitCaption: document.getElementById('split-caption'),
    goalCurrentCorpus: document.getElementById('goal-current-corpus'),
    goalSipSub: document.getElementById('goal-sip-sub'),
    goalRateSub: document.getElementById('goal-rate-sub'),
    ccSipTitle: document.getElementById('cc-sip-title'),
    spouseHorizonLabel: document.getElementById('spouse-horizon-label'),
    doublingKpiMultTitle: document.getElementById('doubling-kpi-mult-title'),
    doublingKpiCountTitle: document.getElementById('doubling-kpi-count-title'),
    sensMultTh: document.getElementById('sens-mult-th'),
    printAssumptions: document.getElementById('print-assumptions'),
    printMilestonesTbody: document.getElementById('print-milestones-tbody'),

    // SIP stop months, youngster months
    selfAddStopMonths: document.getElementById('inp-self-add-stop-months'),
    spouseAddStopMonths: document.getElementById('inp-spouse-add-stop-months'),
    inpYoungsterAddStopMonths: document.getElementById('inp-youngster-add-stop-months'),

    // Step-up ₹/% additions
    selfStepUpEnable: document.getElementById('inp-self-stepup-enable'),
    spouseStepUpEnable: document.getElementById('inp-spouse-stepup-enable'),
    selfStepUpMode: document.getElementById('inp-self-stepup-mode'),
    selfStepUpAmt: document.getElementById('inp-self-stepup-amt'),
    eqSelfStepUp: document.getElementById('eq-self-stepup'),
    spouseStepUpMode: document.getElementById('inp-spouse-stepup-mode'),
    spouseStepUpAmt: document.getElementById('inp-spouse-stepup-amt'),
    eqSpouseStepUp: document.getElementById('eq-spouse-stepup'),
    inpYoungsterStepUpMode: document.getElementById('inp-youngster-stepup-mode'),
    inpYoungsterStepUpAmt: document.getElementById('inp-youngster-stepup-amt'),
    eqYoungsterStepUp: document.getElementById('eq-youngster-stepup'),
    helpYoungsterStepUpStop: document.getElementById('help-youngster-stepup-stop'),
    helpYoungsterAddStop: document.getElementById('help-youngster-add-stop'),

    // Goal return selector
    goalReturn: document.getElementById('inp-goal-return'),
    dispGoalReturn: document.getElementById('disp-goal-return'),
    goalReturnNote: document.getElementById('goal-return-note'),
    btnGoalReturnReset: document.getElementById('btn-goal-return-reset'),
    goalSipTitle: document.getElementById('goal-sip-title'),
    goalSensTbody: document.getElementById('goal-sens-tbody')
  };

  const fmtPct = (x, d = 1) => `${(x * 100).toFixed(d).replace(/\.0+$/, '')}%`;
  const inrFull = (v) => CE.formatINR(Math.round(v), { decimals: 0 });

  /**
   * One line explaining a step-up in the other unit:
   *  % mode -> the rupee amount it adds;  ₹ mode -> the % it represents.
   */
  function stepupEquivText(base, mode, pct, amt, stopYr, addStop, yearWord = 'year') {
    const lastStepYr = Math.min(stopYr, addStop);
    if (lastStepYr < 2) return 'No step-up: the SIP stops or stops rising after year 1.';
    const y2 = CE.steppedMonthly(base, 2, stopYr, mode, pct, amt);
    const yLast = CE.steppedMonthly(base, lastStepYr, stopYr, mode, pct, amt);
    if (mode === 'amt') {
      if (amt <= 0) return 'No step-up.';
      if (base <= 0) return `SIP starts at ₹0 and grows by <strong>${inrFull(amt)}/mo</strong> each ${yearWord}; ${inrFull(yLast)}/mo by ${yearWord} ${lastStepYr}.`;
      const firstPct = amt / base;
      const lastPct = amt / CE.steppedMonthly(base, lastStepYr - 1, stopYr, mode, pct, amt);
      return `= <strong>${fmtPct(firstPct)}</strong> of the ${yearWord}-1 SIP${lastStepYr > 2 ? `, easing to ${fmtPct(lastPct)} by ${yearWord} ${lastStepYr}` : ''}. SIP reaches ${inrFull(yLast)}/mo.`;
    }
    if (pct <= 0) return 'No step-up.';
    if (base <= 0) return 'Enter a monthly SIP to see the rupee step-up.';
    return `= <strong>+${inrFull(y2 - base)}/mo</strong> in ${yearWord} 2 (${inrFull((y2 - base) * 12)} more a year). SIP reaches ${inrFull(yLast)}/mo by ${yearWord} ${lastStepYr}.`;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- Version control: single source of truth for version and credits ----------
  const APP_INFO = {
    version: '1.17',
    date: '2026-10-30',
    developer: 'Sathiya Sekhar E',
    group: 'Warren Charlie Study group - TechnoFunda Top Guns',
    history: [
      { version: '1.17', date: '2026-10-30', notes: [
        'Youngster lab starts at core 18% / satellite 25% (the ≈20% pair) instead of 17% / 27%',
        'The pots grow separately, so the default figures are lower: ₹24.01 Cr at 50, ₹189.88 Cr at 60, ₹1,591.63 Cr at 70'
      ] },
      { version: '1.16', date: '2026-10-30', notes: [
        'Presets follow the house core / satellite pairs: 26% = core 20% + satellite 40%, 18% = 15% + 25%, ≈20% = 18% + 25%',
        '“10X in 10 Yrs @26% 70:30 Split” now uses core 20% / satellite 40% (was 23% / 33%)',
        'The family models A–D show their blended CAGR'
      ] },
      { version: '1.15', date: '2026-10-29', notes: [
        'Spouse and SIP boxes can be typed in while switched off; typing an amount switches them on',
        'A 0% return shows the Portfolio IRR and doubling time as —, never “0.00%” or an endless doubling time',
        'Annual review: a last SIP year with extra months counts as planned SIP when working out the SIP needed'
      ] },
      { version: '1.14', date: '2026-10-29', notes: [
        'Inflation view button renamed INF_ADJ ON / OFF',
        'More ways to set inflation: − / + in the tab bar, a slider and 4–8% chips in the INF_ADJ strip, chips beside the inflation-adjusted goal',
        'Youngster lab control panel compacted to two rows, with Core and Satellite CAGR side by side'
      ] },
      { version: '1.13', date: '2026-10-29', notes: [
        'Inflation rate in the tab bar (default 6%) and a Today’s ₹ button that shows every page in today’s rupees, with real returns',
        'Goal: “Target in today’s money” switch for an inflation-adjusted freedom number (saved with the user)',
        'Youngster lab: horizons set on the cards (−/+ on each) and one control that moves all three; age from 0, starting at 20',
        'Defaults: step-up 10% and SIP for 10 years everywhere',
        'Presets renamed; 22 presets, including two inflation demonstrations'
      ] },
      { version: '1.12', date: '2026-10-29', notes: [
        'Presets menu: 19 ready-made demonstrations in four groups (10× in 10 years, Youngster lab, the family math, more from the slides), with a presenter note and Previous / Next',
        'While a preset is shown, the plan pages leave the user’s year-end records out',
        'Youngster lab: lump sum today, any three ages to show (up to 100), waiting steps of 3, 5 or 10 years',
        'CAGR table rates now 12, 15, 18, 20, 23, 26 and 30%',
        'Fixes: waiting cards no longer widen the page on phones'
      ] },
      { version: '1.11', date: '2026-10-24', notes: [
        'Help button: the User manual and the Design manual open inside the calculator, at the page you are on',
        'Manuals also supplied as PDF files',
        'Version stamps on file addresses, so a browser never shows an old version after an update'
      ] },
      { version: '1.10', date: '2026-10-21', notes: [
        'Users with user IDs and goals, saved in the browser and an optional database file (local or OneDrive)',
        'Annual review by user: year-end values and amounts invested, revised projection to the goal',
        'Goal & schedule page: goal, CAGR comparison, doubling ladder and 60-year schedule in one place',
        'Spouse analysis inside the Core engine; step-up in % or ₹ with on/off switch; SIP stop in years and months',
        'Chart markers for 25% / 50% / 75% of the end goal; Portfolio IRR beside Blended CAGR',
        'Youngster lab simplified; Reset page with Undo on every page; new standard defaults',
        'Formula fixes (course-correction SIP, spouse lump double count, profile saving of zero values) and a new design'
      ] }
    ]
  };
  const fmtAppDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  function renderAppInfo() {
    const map = { version: APP_INFO.version, date: fmtAppDate(APP_INFO.date), developer: APP_INFO.developer, group: APP_INFO.group };
    document.querySelectorAll('[data-app]').forEach(el => { const k = el.getAttribute('data-app'); if (map[k]) el.textContent = map[k]; });
    const hist = document.getElementById('about-history');
    if (hist) hist.innerHTML = APP_INFO.history.map(h =>
      `<li><span class="ver">v${h.version}</span><strong>${fmtAppDate(h.date)}</strong><ul style="margin:6px 0 0 18px">${h.notes.map(n => `<li style="background:none;border:0;padding:1px 0">${escapeHtml(n)}</li>`).join('')}</ul></li>`).join('');
    document.title = `Compounding Calculator v${APP_INFO.version}`;
  }

  /** Inflation as a fraction (from the tab-bar control). */
  function inflRate() { return Math.max(0, Math.min(15, Number(state.inflation) || 0)) / 100; }
  /** Today's-rupee view: the inflation used to deflate displayed values (0 = actual rupees). */
  function viewInflation() { return state.realView ? inflRate() : 0; }

  /** Year-end records used by the plan pages; left out while a preset is shown. */
  function planActuals() { return state.presetId ? {} : (state.actualsHistory || {}); }

  function bindClick(id, fn) { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); }

  /** Number from an input, treating only blank/invalid as missing (0 stays 0). */
  function numOr(el, fallback) {
    if (!el) return fallback;
    const v = parseFloat(el.value);
    return isNaN(v) ? fallback : v;
  }
  function intOr(el, fallback) {
    if (!el) return fallback;
    const v = parseInt(el.value, 10);
    return isNaN(v) ? fallback : v;
  }

  /** Theme colours for canvas drawing, read from CSS custom properties. */
  function palette() {
    const cs = getComputedStyle(document.documentElement);
    const v = (name) => cs.getPropertyValue(name).trim();
    return {
      core: v('--core'), sat: v('--sat'), growth: v('--growth'), gold: v('--gold'),
      rose: v('--rose'), invested: v('--invested'), text: v('--text-main'),
      textSec: v('--text-secondary'), muted: v('--text-muted'), line: v('--line'),
      lineStrong: v('--line-strong'), panel: v('--panel'),
      fontUi: v('--font-ui') || 'sans-serif', fontDisplay: v('--font-display') || 'sans-serif'
    };
  }

  /** Size a canvas to its box at device pixel ratio; returns drawing size in CSS px. */
  function prepCanvas(canvas, fallbackH) {
    const box = canvas.parentElement;
    let w = Math.max(200, Math.floor((box && box.clientWidth) || canvas.clientWidth || 800));
    let h = Math.max(160, Math.floor((box && box.clientHeight) || fallbackH || 320));
    if (state.printing && canvas === state.growthChartCanvas) {
      // A4 content box: ~188mm wide x 180pt tall, in CSS px
      w = 710; h = 240;
    }
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, width: w, height: h };
  }

  function withAlpha(color, a) {
    // Accepts #RRGGBB
    if (/^#[0-9a-f]{6}$/i.test(color)) {
      const n = parseInt(color.slice(1), 16);
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
    }
    return color;
  }


  /**
   * Helper: Read current parameters from inputs
   */
  function getCurrentParams() {
    const coreAllocPct = parseFloat(els.coreAlloc.value) / 100.0;
    const satAllocPct = 1.0 - coreAllocPct;

    return {
      coreAlloc: coreAllocPct,
      satAlloc: satAllocPct,
      coreReturn: parseFloat(els.coreRet.value) / 100.0,
      satReturn: parseFloat(els.satRet.value) / 100.0,
      horizon: parseInt(els.horizon.value, 10),

      selfLump: Math.max(0, numOr(els.selfLump, 0)),
      selfMonthly: Math.max(0, numOr(els.selfMonthly, 0)),
      selfInclude: els.selfInclude.checked,
      selfStepUpOn: !els.selfStepUpEnable || els.selfStepUpEnable.checked,
      selfStepUp: (!els.selfStepUpEnable || els.selfStepUpEnable.checked) ? numOr(els.selfStepUp, 0) / 100.0 : 0,
      selfStepUpMode: els.selfStepUpMode && els.selfStepUpMode.value === 'amt' ? 'amt' : 'pct',
      selfStepUpAmt: (!els.selfStepUpEnable || els.selfStepUpEnable.checked) ? Math.max(0, numOr(els.selfStepUpAmt, 0)) : 0,
      selfStepUpStop: Math.max(1, intOr(els.selfStepUpStop, 7)),
      selfAddStop: Math.max(0, intOr(els.selfAddStop, 7)),
      selfAddStopMonths: Math.max(0, Math.min(11, intOr(els.selfAddStopMonths, 0))),

      spouseLump: Math.max(0, numOr(els.spouseLump, 0)),
      spouseMonthly: Math.max(0, numOr(els.spouseMonthly, 0)),
      spouseInclude: els.spouseInclude.checked,
      spouseStepUpOn: !els.spouseStepUpEnable || els.spouseStepUpEnable.checked,
      spouseStepUp: (!els.spouseStepUpEnable || els.spouseStepUpEnable.checked) ? numOr(els.spouseStepUp, 0) / 100.0 : 0,
      spouseStepUpMode: els.spouseStepUpMode && els.spouseStepUpMode.value === 'amt' ? 'amt' : 'pct',
      spouseStepUpAmt: (!els.spouseStepUpEnable || els.spouseStepUpEnable.checked) ? Math.max(0, numOr(els.spouseStepUpAmt, 0)) : 0,
      spouseStepUpStop: Math.max(1, intOr(els.spouseStepUpStop, 30)),
      spouseAddStop: Math.max(0, intOr(els.spouseAddStop, 30)),
      spouseAddStopMonths: Math.max(0, Math.min(11, intOr(els.spouseAddStopMonths, 0))),

      realInflation: viewInflation(),
      maxYears: 60
    };
  }

  /**
   * Main Recalculate & Render Workflow
   */
  function updateAll() {
    const params = getCurrentParams();
    renderInflationState();

    // 1. Input label displays
    els.dispCoreAlloc.textContent = `${Math.round(params.coreAlloc * 100)}%`;
    els.labelCoreSplit.textContent = `Core ${Math.round(params.coreAlloc * 100)}%`;
    els.labelSatSplit.textContent = `Satellite ${Math.round(params.satAlloc * 100)}%`;
    els.barCoreSegment.style.width = `${params.coreAlloc * 100}%`;
    els.barSatSegment.style.width = `${params.satAlloc * 100}%`;

    els.dispCoreRet.textContent = `${(params.coreReturn * 100).toFixed(1)}%`;
    els.dispSatRet.textContent = `${(params.satReturn * 100).toFixed(1)}%`;
    els.dispHorizon.textContent = `${params.horizon} yrs`;
    els.kpiHorizonYr.textContent = params.horizon;

    els.dispSelfStepUp.textContent = fmtPct(numOr(els.selfStepUp, 0) / 100);
    els.dispSpouseStepUp.textContent = fmtPct(numOr(els.spouseStepUp, 0) / 100);
    [['self', params.selfStepUpOn], ['spouse', params.spouseStepUpOn]].forEach(([who, on]) => {
      const g = document.querySelector(`.stepup-group[data-who="${who}"]`);
      if (g) g.classList.toggle('is-disabled', !on);
      const stopG = document.getElementById(`group-${who}-stepup-stop`);
      if (stopG) { stopG.classList.add('fade-block'); stopG.classList.toggle('is-off', !on); }
    });
    if (els.eqSelfStepUp) els.eqSelfStepUp.innerHTML = params.selfStepUpOn
      ? stepupEquivText(params.selfMonthly, params.selfStepUpMode, params.selfStepUp, params.selfStepUpAmt, params.selfStepUpStop, params.selfAddStop)
      : 'Step-up is off: the SIP stays flat.';
    if (els.eqSpouseStepUp) els.eqSpouseStepUp.innerHTML = params.spouseStepUpOn
      ? stepupEquivText(params.spouseMonthly, params.spouseStepUpMode, params.spouseStepUp, params.spouseStepUpAmt, params.spouseStepUpStop, params.spouseAddStop)
      : 'Step-up is off: the SIP stays flat.';

    if (els.selfAdditionsContainer) els.selfAdditionsContainer.classList.toggle('is-off', !params.selfInclude);
    const selfMonthlyGroup = els.selfMonthly ? els.selfMonthly.closest('.form-group') : null;
    if (selfMonthlyGroup) selfMonthlyGroup.classList.add('fade-block', 'type-on'), selfMonthlyGroup.classList.toggle('is-off', !params.selfInclude);
    els.spouseContainer.classList.toggle('is-off', !params.spouseInclude);

    // 2. Main schedule (with any logged actual years)
    const result = CE.calculateSchedule(params, planActuals());
    state.lastResult = result;
    const hasMoney = result.totalInvested > 0;

    // 3. Hero
    els.kpiTotalCorpus.textContent = CE.formatINR(result.totalCorpus, { compact: true, decimals: 2 });
    els.kpiTotalCorpusExact.textContent = CE.formatINR(result.totalCorpus, { decimals: 0 });
    els.kpiMultipleBadge.textContent = hasMoney ? `${result.multiple.toFixed(1)}× what you invested` : 'Nothing invested yet';

    els.kpiTotalInvested.textContent = CE.formatINR(result.totalInvested, { compact: true, decimals: 2 });
    els.kpiInvestedExact.textContent = CE.formatINR(result.totalInvested, { decimals: 0 });
    els.kpiWealthGain.textContent = CE.formatINR(result.wealthGain, { compact: true, decimals: 2 });
    const gainShare = result.totalCorpus > 0 ? (result.wealthGain / result.totalCorpus) * 100 : 0;
    if (els.kpiWealthGainPill) els.kpiWealthGainPill.textContent = `${gainShare.toFixed(1)}% of the corpus`;
    if (els.compInvestedSeg && els.compGainSeg) {
      const investedShare = result.totalCorpus > 0 ? Math.min(100, (result.totalInvested / result.totalCorpus) * 100) : 100;
      els.compInvestedSeg.style.width = `${investedShare}%`;
      els.compGainSeg.style.width = `${Math.max(0, 100 - investedShare)}%`;
    }

    els.kpiIrr.textContent = (hasMoney && result.portfolioIRR > 0) ? CE.formatPercent(result.portfolioIRR, 2) : '—';
    els.kpiWeightedRate.textContent = CE.formatPercent(result.weightedStartingReturn, 2);
    const gapNote = document.getElementById('rate-gap-note');
    if (gapNote) {
      const d = (result.portfolioIRR - result.weightedStartingReturn) * 100;
      const satFinal = result.totalCorpus > 0 ? (result.satCorpus / result.totalCorpus) * 100 : 0;
      const hasActuals = Object.keys(planActuals()).length > 0;
      gapNote.textContent = !hasMoney ? 'Blended CAGR is the mix-weighted return of core and satellite.'
        : Math.abs(d) < 0.1 ? 'IRR matches the blended CAGR — your money compounds at the planned rate.'
        : d > 0 ? `IRR is ${d.toFixed(2)} pts above the CAGR: the faster satellite grows from ${Math.round(params.satAlloc * 100)}% to ${satFinal.toFixed(0)}% of the money.`
        : `IRR is ${(-d).toFixed(2)} pts below the CAGR${hasActuals ? ': your recorded years earned less than planned.' : '.'}`;
    }
    els.kpiDoublingTime.textContent = (hasMoney && result.doublingTimeAtIRR > 0) ? CE.formatYears(result.doublingTimeAtIRR, 2) : '—';
    els.kpiNext2x.textContent = !hasMoney ? '—'
      : (typeof result.nextDoublingAfterHorizon === 'number' ? CE.formatYears(result.nextDoublingAfterHorizon, 2) : result.nextDoublingAfterHorizon);

    // Core vs satellite split
    const coreShare = result.totalCorpus > 0 ? (result.coreCorpus / result.totalCorpus) * 100 : 0;
    const satShare = result.totalCorpus > 0 ? (result.satCorpus / result.totalCorpus) * 100 : 0;
    els.kpiCoreCorpus.textContent = CE.formatINR(result.coreCorpus, { compact: true, decimals: 2 });
    els.kpiCoreSub.textContent = `${CE.formatINR(result.coreCorpus, { decimals: 0 })} · ${coreShare.toFixed(1)}%`;
    els.kpiSatCorpus.textContent = CE.formatINR(result.satCorpus, { compact: true, decimals: 2 });
    els.kpiSatSub.textContent = `${CE.formatINR(result.satCorpus, { decimals: 0 })} · ${satShare.toFixed(1)}%`;
    if (els.splitCoreSeg) els.splitCoreSeg.style.width = `${result.totalCorpus > 0 ? coreShare : params.coreAlloc * 100}%`;
    if (els.splitSatSeg) els.splitSatSeg.style.width = `${result.totalCorpus > 0 ? satShare : params.satAlloc * 100}%`;
    if (els.splitCaption) {
      els.splitCaption.textContent = result.totalCorpus > 0
        ? `Satellite is ${Math.round(params.satAlloc * 100)}% of every rupee invested, and ${satShare.toFixed(0)}% of the corpus by year ${result.horizon}`
        : 'Enter a lump sum or SIP to see how the corpus splits';
    }

    // 4. Print-only blocks
    renderPrintBlocks(params, result);

    // 5. Charts and other tabs
    const spouseAnalysis = updateSpouseAccelerator(params);
    state.soloRows = spouseAnalysis ? spouseAnalysis.selfOnlyResult.yearlyRows : null;
    drawGrowthChart(state.growthChartCanvas, result.yearlyRows, result.horizon, state.isLogScale);
    updateGoalPlanner(params);
    updateYoungsterLab(params);
    updateActualsTab(params);
    refreshDirtyState();
    renderFullScheduleTable(result.yearlyRows, result.horizon);
    updateContributionsChips(params);
    renderLadder(result, params);
  }

  /**
   * Print-only: plan assumptions + doubling ladder of the main plan
   */
  function renderPrintBlocks(params, result) {
    if (els.printAssumptions) {
      const pct = (x) => `${(x * 100).toFixed(1)}%`;
      const inr = (x) => CE.formatINR(x, { compact: true, decimals: 2 });
      const step = (mode, p, a, stop) => (mode === 'amt' ? a <= 0 : p <= 0) ? 'no step-up' : (mode === 'amt' ? `+${inr(a)}/mo each yr` : `+${pct(p)}/yr`) + ` to yr ${stop}`;
      const selfSip = params.selfInclude
        ? `${inr(params.selfMonthly)}/mo, ${step(params.selfStepUpMode, params.selfStepUp, params.selfStepUpAmt, params.selfStepUpStop)}, for ${params.selfAddStop} yrs${params.selfAddStopMonths ? ' ' + params.selfAddStopMonths + ' mo' : ''}`
        : 'Off';
      const spouseSip = params.spouseInclude
        ? `${inr(params.spouseLump)} lump; ${inr(params.spouseMonthly)}/mo, ${step(params.spouseStepUpMode, params.spouseStepUp, params.spouseStepUpAmt, params.spouseStepUpStop)}, for ${params.spouseAddStop} yrs${params.spouseAddStopMonths ? ' ' + params.spouseAddStopMonths + ' mo' : ''}`
        : 'Not included';
      const logged = Object.keys(planActuals()).length;
      els.printAssumptions.innerHTML = `
        <div>Mix: <strong>${Math.round(params.coreAlloc * 100)}% core / ${Math.round(params.satAlloc * 100)}% satellite</strong></div>
        <div>Returns: <strong>core ${pct(params.coreReturn)}, satellite ${pct(params.satReturn)}</strong></div>
        <div>Self lump sum: <strong>${inr(params.selfLump)}</strong></div>
        <div>Actual years logged: <strong>${logged || 'none'}</strong></div>
        <div style="grid-column: span 2">Self SIP: <strong>${selfSip}</strong></div>
        <div style="grid-column: span 2">Spouse: <strong>${spouseSip}</strong></div>
        <div style="grid-column: span 2">Values: <strong>${params.realInflation ? 'today’s rupees, after ' + pct(params.realInflation) + ' inflation a year (real returns)' : 'actual rupees, before inflation'}</strong></div>`;
    }
    if (els.printMilestonesTbody) {
      els.printMilestonesTbody.innerHTML = milestoneRowsHtml(result.milestones.filter(m => typeof m.yearReached === 'number').slice(0, 11), result.horizon, 5);
    }
  }

  function milestoneRowsHtml(milestones, horizon, emptyCols) {
    if (!milestones || milestones.length === 0) {
      return `<tr><td colspan="${emptyCols}" class="c-muted" style="text-align:center; padding: 22px;">Enter a lump sum or monthly SIP to see the doubling ladder.</td></tr>`;
    }
    return milestones.map(m => {
      const status = m.isWithinHorizon
        ? `<span class="badge-milestone">Within year ${horizon}</span>`
        : `<span class="badge-beyond">${typeof m.yearReached === 'number' ? 'After horizon' : 'Not within 60 yrs'}</span>`;
      const yr = typeof m.yearReached === 'number' ? `<strong>Year ${m.yearReached.toFixed(2)}</strong>` : `<span class="c-muted">${m.yearReached}</span>`;
      const gap = typeof m.gap === 'number' ? `${m.gap.toFixed(2)} yrs` : '<span class="c-muted">—</span>';
      return `<tr>
          <td><strong class="c-gold">${m.multiple.toLocaleString('en-IN')}×</strong></td>
          <td>${CE.formatINR(m.target, { compact: true, decimals: 2 })}</td>
          <td>${yr}</td>
          <td>${gap}</td>
          <td>${status}</td>
        </tr>`;
    }).join('');
  }

  /**
   * Doubling ladder table (Doubling tab)
   */
  function renderSummaryMilestones(milestones, initialLump, horizon) {
    if (!els.summaryMilestonesTbody) return;
    els.summaryMilestonesTbody.innerHTML = milestoneRowsHtml(milestones, horizon, 5);
  }

  /**
   * Full 60-year schedule
   */
  function renderFullScheduleTable(rows, horizon) {
    if (!els.fullScheduleTbody) return;
    const f = (v) => CE.formatINR(v, { decimals: 0 });
    const dash = '<span class="c-muted">—</span>';
    const finalCorpus = rows[horizon] ? rows[horizon].totalCorpus : 0;
    const th = document.getElementById('th-share-final');
    if (th) th.textContent = `% of yr-${horizon} corpus`;
    els.fullScheduleTbody.innerHTML = rows.map(r => {
      const yrsTo2xStr = typeof r.yrsTo2x === 'number' ? r.yrsTo2x.toFixed(2) : `<span class="c-muted">${r.yrsTo2x}</span>`;
      return `<tr class="${r.year === horizon ? 'row-horizon' : ''}">
          <td><strong>${r.year}</strong>${r.isActual ? ' <span class="badge badge-gold" title="Uses your logged actual return">actual</span>' : ''}</td>
          <td>${r.selfContrib > 0 ? f(r.selfContrib) : dash}</td>
          <td>${r.spouseContrib > 0 ? f(r.spouseContrib) : dash}</td>
          <td>${f(r.coreOpen)}</td>
          <td>${r.coreAdd > 0 ? f(r.coreAdd) : dash}</td>
          <td>${f(r.coreRet)}</td>
          <td><strong>${f(r.coreClose)}</strong></td>
          <td>${f(r.satOpen)}</td>
          <td>${r.satAdd > 0 ? f(r.satAdd) : dash}</td>
          <td>${f(r.satRet)}</td>
          <td><strong>${f(r.satClose)}</strong></td>
          <td class="c-growth">${f(r.totalCorpus)}</td>
          <td>${f(r.totalInvested)}</td>
          <td class="c-gold">${r.multiple.toFixed(2)}×</td>
          <td>${finalCorpus > 0 ? ((r.totalCorpus / finalCorpus) * 100).toFixed(r.totalCorpus / finalCorpus >= 0.1 ? 0 : 1) + '%' : '—'}</td>
          <td>${yrsTo2xStr}</td>
        </tr>`;
    }).join('');
  }

  /** Nice x-axis step for a horizon */
  function xStepFor(h) {
    if (h <= 6) return 1;
    if (h <= 12) return 2;
    if (h <= 30) return 5;
    return 10;
  }

  /**
   * Growth chart: stacked core + satellite areas, invested as dashed line
   */
  function drawGrowthChart(canvas, rows, horizon, isLog) {
    if (!canvas || !rows || !rows.length) return;
    const { ctx, width, height } = prepCanvas(canvas, 320);
    const P = palette();
    const H = Math.max(1, Math.min(60, parseInt(horizon, 10) || 30));
    const hr = rows.filter(r => r.year <= H);

    const padL = 64, padR = 18, padT = 34, padB = 30;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    state.chartGeom = { padL, plotW, H };

    const fontUi = (sz, wt = 400) => `${wt} ${sz}px ${P.fontUi}`;
    const maxRaw = Math.max(...hr.map(r => r.totalCorpus || 0));
    if (maxRaw <= 0) {
      const n = document.getElementById('chart-share-note'); if (n) n.textContent = '';
      ctx.font = fontUi(13, 500);
      ctx.fillStyle = P.muted;
      ctx.textAlign = 'center';
      ctx.fillText('Enter a lump sum or monthly SIP to see your corpus grow.', width / 2, height / 2);
      return;
    }

    // Y scale
    let yTicks, scaleY;
    if (isLog) {
      const positives = hr.map(r => Math.min(r.totalInvested || Infinity, r.coreClose || Infinity, r.satClose || Infinity)).filter(v => v > 0 && isFinite(v));
      const minPos = positives.length ? Math.min(...positives) : 1000;
      const lo = Math.pow(10, Math.floor(Math.log10(Math.max(1000, minPos))));
      const hi = Math.pow(10, Math.ceil(Math.log10(maxRaw)));
      const lMin = Math.log10(lo), lMax = Math.log10(hi);
      scaleY = (v) => padT + plotH - ((Math.log10(Math.max(lo, v || lo)) - lMin) / (lMax - lMin)) * plotH;
      yTicks = [];
      for (let e = lMin; e <= lMax; e++) yTicks.push(Math.pow(10, e));
    } else {
      const rawStep = maxRaw / 5;
      const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= rawStep);
      const top = Math.ceil(maxRaw / step) * step;
      scaleY = (v) => padT + plotH - ((v || 0) / top) * plotH;
      yTicks = [];
      for (let v = 0; v <= top + 1e-6; v += step) yTicks.push(v);
    }
    const scaleX = (yr) => padL + (yr / H) * plotW;

    // Grid + y labels
    ctx.lineWidth = 1;
    ctx.font = fontUi(11);
    ctx.textAlign = 'right';
    yTicks.forEach(v => {
      const y = Math.round(scaleY(v)) + 0.5;
      ctx.strokeStyle = P.line;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      ctx.fillStyle = P.muted;
      ctx.fillText((v === 0 ? '₹0' : CE.formatINR(v, { compact: true, decimals: v >= 1e7 ? 0 : 1 }).replace('.0 ', ' ')), padL - 8, y + 4);
    });

    // X labels
    const step = xStepFor(H);
    ctx.textAlign = 'center';
    for (let yr = 0; yr <= H; yr += step) {
      if (yr === H || H - yr < step * 0.5) continue;
      ctx.fillStyle = P.muted;
      ctx.fillText(`${yr}`, scaleX(yr), padT + plotH + 18);
    }
    ctx.fillStyle = P.gold;
    ctx.font = fontUi(11, 700);
    ctx.fillText(`Yr ${H}`, Math.min(scaleX(H), width - padR - 12), padT + plotH + 18);

    const pathFor = (key, baseKey) => {
      ctx.beginPath();
      hr.forEach((r, i) => {
        const x = scaleX(r.year), y = scaleY(r[key]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      if (baseKey === undefined) return;
      for (let i = hr.length - 1; i >= 0; i--) {
        const r = hr[i];
        ctx.lineTo(scaleX(r.year), baseKey === null ? padT + plotH : scaleY(r[baseKey]));
      }
      ctx.closePath();
    };

    // Augment with stacked value
    hr.forEach(r => { r._stackTop = r.coreClose + r.satClose; });

    if (!isLog) {
      // Stacked areas: core bottom, satellite on top
      pathFor('coreClose', null);
      ctx.fillStyle = withAlpha(P.core, 0.55); ctx.fill();
      pathFor('_stackTop', 'coreClose');
      ctx.fillStyle = withAlpha(P.sat, 0.45); ctx.fill();
    } else {
      [['coreClose', P.core], ['satClose', P.sat]].forEach(([k, c]) => {
        pathFor(k); ctx.strokeStyle = c; ctx.lineWidth = 1.8; ctx.stroke();
      });
    }

    // Invested (dashed)
    pathFor('totalInvested');
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = P.textSec; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.setLineDash([]);

    // Total corpus line
    pathFor('totalCorpus');
    ctx.strokeStyle = P.growth; ctx.lineWidth = 2.6; ctx.stroke();

    // Spouse on: overlay the "self only" path
    const solo = state.soloRows ? state.soloRows.filter(r => r.year <= H) : null;
    if (solo && solo.length) {
      ctx.beginPath();
      solo.forEach((r, i) => { const x = scaleX(r.year), y = scaleY(r.totalCorpus); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
      ctx.strokeStyle = P.rose; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
    }

    // Horizon marker
    const hRow = hr[hr.length - 1];
    const hX = scaleX(H), hY = scaleY(hRow.totalCorpus);
    ctx.strokeStyle = withAlpha(P.gold, 0.6); ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(hX, padT); ctx.lineTo(hX, padT + plotH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(hX, hY, 5, 0, Math.PI * 2);
    ctx.fillStyle = P.gold; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = P.panel; ctx.stroke();

    // Where the corpus reaches 25%, 50% and 75% of its final (horizon) value
    const finalC = hRow.totalCorpus;
    const shareMarks = [0.25, 0.5, 0.75].map(f => ({ f, yr: CE.yearReaching(hr, f * finalC, H) }))
      .filter(m => m.yr !== null && m.yr > 0 && m.yr < H);
    shareMarks.forEach(m => {
      const x = scaleX(m.yr), v = m.f * finalC, y = scaleY(v);
      ctx.strokeStyle = withAlpha(P.gold, 0.45); ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, padT + plotH); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = P.gold; ctx.fill(); ctx.strokeStyle = P.panel; ctx.lineWidth = 1.5; ctx.stroke();
      const label = `${Math.round(m.f * 100)}% · yr ${m.yr.toFixed(1)}`;
      ctx.font = fontUi(11, 600);
      const tw = ctx.measureText(label).width + 12, th = 18;
      let lx = x - tw - 8, ly = y - th / 2;
      if (lx < padL + 4) lx = x + 8;
      ly = Math.max(padT + 22, Math.min(padT + plotH - th - 2, ly));
      ctx.fillStyle = withAlpha(P.panel, 0.92); ctx.strokeStyle = withAlpha(P.gold, 0.55); ctx.lineWidth = 1;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(lx, ly, tw, th, 5); else ctx.rect(lx, ly, tw, th); ctx.fill(); ctx.stroke();
      ctx.fillStyle = P.gold; ctx.textAlign = 'left'; ctx.fillText(label, lx + 6, ly + 13);
    });
    const noteEl = document.getElementById('chart-share-note');
    if (noteEl) {
      const half = shareMarks.find(m => m.f === 0.5);
      noteEl.innerHTML = half
        ? `Half of the year-${H} corpus (${CE.formatINR(finalC / 2, { compact: true, decimals: 2 })} of ${CE.formatINR(finalC, { compact: true, decimals: 2 })}) is made by <strong>year ${half.yr.toFixed(1)}</strong> — the last ${(H - half.yr).toFixed(1)} years make the other half.`
        : `Corpus at year ${H}: ${CE.formatINR(finalC, { compact: true, decimals: 2 })}`;
    }

    // Legend (top-left)
    const items = [
      { label: 'Total corpus', color: P.growth, type: 'line' },
      { label: 'Core', color: P.core, type: 'box' },
      { label: 'Satellite', color: P.sat, type: 'box' },
      { label: 'Invested', color: P.textSec, type: 'dash' }
    ];
    if (solo && solo.length) items.push({ label: 'Self only', color: P.rose, type: 'dash' });
    let lx = padL;
    const ly = 14;
    ctx.font = fontUi(11.5, 500);
    ctx.textAlign = 'left';
    items.forEach(it => {
      ctx.strokeStyle = it.color; ctx.fillStyle = it.color; ctx.lineWidth = 2.4;
      if (it.type === 'box') ctx.fillRect(lx, ly - 5, 12, 10);
      else {
        if (it.type === 'dash') ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 14, ly); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = P.textSec;
      ctx.fillText(it.label, lx + 19, ly + 4);
      lx += ctx.measureText(it.label).width + 38;
    });

    // Hover readout
    if (state.hoverYear !== null && state.hoverYear !== undefined && state.hoverYear <= H) {
      const r = hr.find(x => x.year === state.hoverYear);
      if (r) {
        const x = scaleX(r.year), y = scaleY(r.totalCorpus);
        ctx.strokeStyle = P.lineStrong; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = P.growth; ctx.fill(); ctx.strokeStyle = P.panel; ctx.lineWidth = 2; ctx.stroke();

        const finalCorpus = hRow.totalCorpus;
        const finalGain = hRow.totalCorpus - hRow.totalInvested;
        const finalInvested = hRow.totalInvested;
        const moneyPct = finalInvested > 0 ? (r.totalInvested / finalInvested) * 100 : 0;
        const corpusPct = finalCorpus > 0 ? (r.totalCorpus / finalCorpus) * 100 : 0;
        const gainPct = finalGain > 0 ? Math.max(0, (r.totalCorpus - r.totalInvested) / finalGain * 100) : 0;
        const pctTxt = (x) => x >= 10 || x === 0 ? x.toFixed(0) + '%' : x.toFixed(1) + '%';
        const cr2 = (v) => CE.formatINR(v, { compact: true, decimals: 2 });
        const lines = [
          [`End goal (year ${H}): ${cr2(finalCorpus)}`, P.text, 700],
          [`${pctTxt(corpusPct)} achieved by year ${r.year}: ${cr2(r.totalCorpus)}`, P.gold, 700],
          [`Core: ${cr2(r.coreClose)}`, P.core, 500],
          [`Satellite: ${cr2(r.satClose)}`, P.sat, 500],
          [`Invested: ${cr2(r.totalInvested)}`, P.textSec, 500]
        ];
        const soloRow = solo ? solo.find(x => x.year === r.year) : null;
        if (soloRow) lines.push([`Self only: ${cr2(soloRow.totalCorpus)}`, P.rose, 500]);
        ctx.font = fontUi(12, 600);
        const tw = Math.max(...lines.map(l => ctx.measureText(l[0]).width)) + 22;
        const th = lines.length * 17 + 12;
        let tx = x + 12; if (tx + tw > padL + plotW) tx = x - tw - 12;
        const ty = Math.max(padT, Math.min(padT + plotH - th, y - th / 2));
        ctx.fillStyle = P.panel; ctx.strokeStyle = P.lineStrong; ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(tx, ty, tw, th, 8); else ctx.rect(tx, ty, tw, th);
        ctx.fill(); ctx.stroke();
        lines.forEach((l, i) => {
          ctx.font = fontUi(12, l[2]); ctx.fillStyle = l[1];
          ctx.fillText(l[0], tx + 11, ty + 20 + i * 17);
        });
      }
    }
  }

  function updateGoalPlanner(params) {
    if (!els.goalTarget || !els.goalYears) return;
    const target = Math.max(0, numOr(els.goalTarget, 100000000));
    const years = Math.max(1, intOr(els.goalYears, 20));
    const planned = CE.weightedReturnOf(params);

    // Return used for the SIP: the plan's blended return unless the user moved the slider
    if (els.goalReturn && !state.goalReturnTouched) els.goalReturn.value = (planned * 100).toFixed(1);
    const assumed = state.goalReturnTouched ? numOr(els.goalReturn, planned * 100) / 100 : planned;
    if (els.dispGoalReturn) els.dispGoalReturn.textContent = fmtPct(assumed);
    if (els.goalReturnNote) {
      const d = (assumed - planned) * 100;
      els.goalReturnNote.textContent = Math.abs(d) < 0.05 ? 'Your blended CAGR'
        : `${Math.abs(d).toFixed(1)} pts ${d > 0 ? 'above' : 'below'} your blended CAGR of ${fmtPct(planned)}`;
    }
    if (els.btnGoalReturnReset) els.btnGoalReturnReset.hidden = !state.goalReturnTouched || Math.abs(assumed - planned) < 0.0005;
    const applyBtn = document.getElementById('btn-goal-return-apply');
    if (applyBtn) {
      applyBtn.hidden = !state.goalReturnTouched || Math.abs(assumed - planned) < 0.0005;
      applyBtn.textContent = `Use ${fmtPct(assumed)} in my plan`;
    }
    if (els.goalSipTitle) els.goalSipTitle.textContent = `Monthly SIP to hit it on time at ${fmtPct(assumed)}`;

    // Goal maths: with "Target in today's money" on, the target is compared with the plan in today's rupees
    // (the same as growing the target with inflation). Displayed amounts follow the Today's ₹ view.
    const inf = inflRate();
    const goalInfl = !!(els.goalInflation && els.goalInflation.checked) && inf > 0;
    const gp = Object.assign({}, params, { realInflation: goalInfl ? inf : 0 });
    const sameUnits = (gp.realInflation || 0) === (params.realInflation || 0);
    const goalRes = CE.solveGoal(target, years, gp, { assumedBlendedReturn: assumed });
    const cr = (v) => CE.formatINR(v, { compact: true, decimals: 2 });

    const inflNote = document.getElementById('goal-infl-note');
    const inflRow = document.getElementById('goal-infl-row');
    if (inflRow) inflRow.hidden = !goalInfl;
    if (inflNote) {
      if (goalInfl) inflNote.innerHTML = `${cr(target)} today = <strong>${cr(target * Math.pow(1 + inf, years))}</strong> in year ${years} at ${fmtPct(inf)} inflation.`;
    }
    if (els.goalCurrentCorpus) {
      const viewVal = sameUnits ? goalRes.currentCorpusAtHorizon : CE.calculateSchedule(Object.assign({}, params, { horizon: years })).totalCorpus;
      const extra = goalInfl && !state.realView ? ` <span class="c-muted">(${cr(goalRes.currentCorpusAtHorizon)} in today’s money)</span>` : '';
      els.goalCurrentCorpus.innerHTML = `Your current plan at year ${years}: <strong>${cr(viewVal)}</strong>${extra}`;
    }

    if (target <= 0) {
      els.goalTimeToHit.textContent = 'Now';
      els.goalTimeSub.textContent = 'A target of ₹0 is already met.';
      els.goalRequiredSIP.textContent = '₹0 / mo';
      if (els.goalSipSub) els.goalSipSub.textContent = '';
      els.goalRequiredRate.textContent = '—';
      if (els.goalSensTbody) els.goalSensTbody.innerHTML = '';
      return;
    }

    if (goalRes.timeToGoalYears !== null) {
      els.goalTimeToHit.textContent = `Year ${goalRes.timeToGoalYears.toFixed(1)}`;
      const diff = years - goalRes.timeToGoalYears;
      els.goalTimeSub.innerHTML = diff >= 0
        ? `<span class="good">${diff.toFixed(1)} years before your deadline.</span>`
        : `<span class="bad">${Math.abs(diff).toFixed(1)} years after your deadline</span> at your current SIP and returns.`;
    } else {
      els.goalTimeToHit.textContent = 'Not in 60 yrs';
      els.goalTimeSub.textContent = 'Your current plan never reaches this within 60 years. Raise the SIP or the return.';
    }

    // Required SIP — describe exactly what it assumes
    els.goalRequiredSIP.textContent = goalRes.sipUnreachable ? 'Not reachable'
      : `${CE.formatINR(goalRes.requiredMonthlySIP, { decimals: 0 })} / mo`;
    const lastSipYr = Math.min(params.selfAddStop, years);
    const lastStepYr = Math.min(params.selfStepUpStop, lastSipYr);
    const stepTxt = lastStepYr < 2 ? 'no step-up'
      : (params.selfStepUpMode === 'amt'
        ? (params.selfStepUpAmt > 0 ? `rising ${inrFull(params.selfStepUpAmt)}/mo each year to year ${lastStepYr}` : 'no step-up')
        : (params.selfStepUp > 0 ? `stepped up ${fmtPct(params.selfStepUp)} a year to year ${lastStepYr}` : 'no step-up'));
    if (els.goalSipSub) {
      const lumpTxt = (params.selfLump + (params.spouseInclude ? params.spouseLump : 0)) > 0 ? 'your lump sum' : 'no lump sum';
      const spouseTxt = params.spouseInclude ? ' and your spouse’s plan' : '';
      let txt;
      if (goalRes.sipUnreachable) {
        txt = `Your SIP stops after year ${params.selfAddStop}, so no amount gets there. Raise “Last SIP year” in the Core engine.`;
      } else if (goalRes.requiredMonthlySIP === 0) {
        txt = `${lumpTxt.charAt(0).toUpperCase() + lumpTxt.slice(1)}${spouseTxt} already get${spouseTxt ? '' : 's'} there at ${fmtPct(assumed)} — no SIP needed.`;
      } else {
        txt = `Starting SIP, ${stepTxt}, paid until year ${lastSipYr}, with ${lumpTxt}${spouseTxt}. Your SIP today: ${CE.formatINR(params.selfInclude ? params.selfMonthly : 0, { decimals: 0 })}.`;
      }
      els.goalSipSub.textContent = txt;
    }

    // One table: what a different blended CAGR does to IRR, doubling, corpus, goal date and SIP
    if (els.goalSensTbody) {
      const pts = new Set([0.12, 0.15, 0.18, 0.20, 0.23, 0.26, 0.30].map(x => Math.round(x * 1000)));
      pts.add(Math.round(planned * 1000));
      pts.add(Math.round(assumed * 1000));
      const today = params.selfInclude ? params.selfMonthly : 0;
      const sensTh = document.getElementById('sens-mult-th');
      if (sensTh) sensTh.textContent = `Corpus at year ${params.horizon}`;
      const rows = Array.from(pts).sort((x, y) => x - y).map(k => {
        const r = k / 1000;
        const rates = CE.ratesForBlended(r, params);
        const sched = CE.calculateSchedule(Object.assign({}, params, rates), planActuals());
        const schedGoal = sameUnits ? sched : CE.calculateSchedule(Object.assign({}, gp, rates), planActuals());
        const reach = CE.yearReaching(schedGoal.yearlyRows, target, 60);
        const res = CE.requiredSIPAtReturn(target, years, gp, r);
        const isChosen = Math.abs(r - assumed) < 0.0006;
        const isPlan = Math.abs(r - planned) < 0.0006;
        const ok = sched.totalInvested > 0;
        const irr = ok && sched.portfolioIRR > 0 ? fmtPct(sched.portfolioIRR, 1) : '—';
        const dbl = ok && sched.doublingTimeAtIRR > 0 ? `${sched.doublingTimeAtIRR.toFixed(1)} yrs` : '—';
        const corpus = ok ? `<strong>${cr(sched.totalCorpus)}</strong> <span class="c-muted">${sched.multiple.toFixed(0)}×</span>` : '—';
        let reachCell;
        if (reach === null) reachCell = '<span class="bad">Not in 60 yrs</span>';
        else {
          const d = years - reach;
          reachCell = `Year ${reach.toFixed(1)} <span class="${d >= 0 ? 'good' : 'bad'}">${d >= 0 ? '✓' : '+' + (-d).toFixed(1) + ' yrs'}</span>`;
        }
        let sipCell;
        if (res.unreachable) sipCell = '<span class="c-muted">Not reachable</span>';
        else {
          const sip = Math.round(res.sip);
          const d = sip - today;
          sipCell = sip === 0 ? '<span class="good">No SIP needed</span>'
            : `<strong>${inrFull(sip)}</strong> <span class="${Math.abs(d) < 50 ? 'c-muted' : (d > 0 ? 'bad' : 'good')}">${Math.abs(d) < 50 ? 'same' : (d > 0 ? '+' : '−') + inrFull(Math.abs(d))}</span>`;
        }
        const tags = `${isPlan ? ' <span class="badge badge-self">yours</span>' : ''}${isChosen && !isPlan ? ' <span class="badge badge-win">selected</span>' : ''}`;
        return `<tr class="${isChosen ? 'sensitivity-highlight' : ''}" data-ret="${(r * 100).toFixed(1)}">
            <td><strong>${fmtPct(r)}</strong>${tags}</td>
            <td>${fmtPct(rates.coreReturn)} / ${fmtPct(rates.satReturn)}</td>
            <td class="c-growth">${irr}</td>
            <td>${dbl}</td>
            <td>${corpus}</td>
            <td>${reachCell}</td>
            <td>${sipCell}</td>
          </tr>`;
      });
      els.goalSensTbody.innerHTML = rows.join('');
    }

    if (goalRes.requiredBlendedReturn !== null) {
      els.goalRequiredRate.textContent = CE.formatPercent(goalRes.requiredBlendedReturn, 1);
      if (els.goalRateSub) {
        const rates = CE.ratesForBlended(goalRes.requiredBlendedReturn, params);
        els.goalRateSub.textContent = `Blended CAGR over ${years} years — about ${(rates.coreReturn * 100).toFixed(1)}% core and ${(rates.satReturn * 100).toFixed(1)}% satellite. Your blended CAGR is ${((params.coreAlloc * params.coreReturn + params.satAlloc * params.satReturn) * 100).toFixed(1)}%.`;
      }
    } else {
      els.goalRequiredRate.textContent = goalRes.rateOutOfRange === 'high' ? 'Over 150%' : '—';
      if (els.goalRateSub) {
        els.goalRateSub.textContent = goalRes.rateOutOfRange === 'high'
          ? 'No realistic return gets there with your current lump sum and SIP.'
          : 'Add a lump sum or SIP in the Core engine first.';
      }
    }
  }

  /**
   * Switch a step-up control between % and ₹, carrying over the equivalent value.
   */
  function setStepupMode(who, mode, convert = true) {
    const group = document.querySelector(`.stepup-group[data-who="${who}"]`);
    const modeInp = document.getElementById(`inp-${who}-stepup-mode`);
    if (!group || !modeInp) return;
    const pctInp = document.getElementById(who === 'youngster' ? 'inp-youngster-stepup-pct' : `inp-${who}-stepup`);
    const amtInp = document.getElementById(`inp-${who}-stepup-amt`);
    const baseInp = document.getElementById(`inp-${who}-monthly`);
    if (convert && modeInp.value !== mode && pctInp && amtInp && baseInp) {
      const base = parseFloat(baseInp.value) || 0;
      if (base > 0 && mode === 'amt') {
        amtInp.value = Math.round(base * (parseFloat(pctInp.value) || 0) / 100 / 100) * 100;
      } else if (base > 0 && mode === 'pct') {
        pctInp.value = Math.min(25, Math.max(0, Math.round((parseFloat(amtInp.value) || 0) / base * 200) / 2));
      }
    }
    modeInp.value = mode;
    group.querySelectorAll('.seg-btn').forEach(b => {
      const on = b.getAttribute('data-mode') === mode;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    group.querySelector('.stepup-pct').hidden = mode !== 'pct';
    group.querySelector('.stepup-amt').hidden = mode !== 'amt';
  }

  document.querySelectorAll('.stepup-group .seg-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const who = this.closest('.stepup-group').getAttribute('data-who');
      setStepupMode(who, this.getAttribute('data-mode'), true);
      if (who === 'youngster') updateYoungsterLab(); else updateAll();
    });
  });

  /** Keep a "years" slider's max equal to the horizon; the max position means "never stop". */
  function syncYearSlider(input, horizon) {
    if (!input) return;
    const oldMax = parseInt(input.max, 10) || horizon;
    const atMax = (parseInt(input.value, 10) || 0) >= oldMax;
    input.max = Math.max(1, horizon);
    if (atMax || parseInt(input.value, 10) > horizon) input.value = horizon;
  }

  /** Keep three horizons increasing, at least 1 year, and the last within maxH. */
  function fitHorizons(h, maxH) {
    let [a, b, c] = h.map(x => Math.round(Number(x) || 0));
    maxH = Math.max(3, maxH);
    c = Math.min(Math.max(c, 3), maxH);
    b = Math.min(Math.max(b, 2), c - 1);
    a = Math.min(Math.max(a, 1), b - 1);
    return [a, b, c];
  }

  /**
   * Youngster Lab: wealth at three horizons and the cost of delay
   */
  function updateYoungsterLab() {
    if (!els.inpYoungsterAge || !els.youngsterCards) return;

    const currentAge = intOr(els.inpYoungsterAge, 20);
    // Three horizons (years from now) shown on the cards; the projection runs to the last one, at most age 100
    const hz = fitHorizons(state.youngHz || [30, 40, 50], 100 - currentAge);
    state.youngHz = hz;
    const checkAges = hz.map(h => currentAge + h);
    const targetAge = checkAges[2];
    const horizon = Math.max(1, targetAge - currentAge);
    const lump = Math.max(0, numOr(els.inpYoungsterLump, 0));
    const waitStep = state.youngWait || 3;
    const delayList = [waitStep, waitStep * 2, waitStep * 3];
    syncYearSlider(els.inpYoungsterStepUpStop, horizon);
    syncYearSlider(els.inpYoungsterAddStop, horizon);

    const monthly = Math.max(0, numOr(els.inpYoungsterMonthly, 10000));
    const stepUpEnabled = els.inpYoungsterStepUpEnable ? els.inpYoungsterStepUpEnable.checked : true;
    const stepUpMode = els.inpYoungsterStepUpMode && els.inpYoungsterStepUpMode.value === 'amt' ? 'amt' : 'pct';
    const stepUpPct = stepUpEnabled ? numOr(els.inpYoungsterStepUpPct, 10) : 0;
    const stepUpAmt = Math.max(0, numOr(els.inpYoungsterStepUpAmt, 0));
    const stopRaw = intOr(els.inpYoungsterStepUpStop, 10);
    const addRaw = intOr(els.inpYoungsterAddStop, horizon);
    const stepUpStopYears = stopRaw >= horizon ? 999 : stopRaw;
    const additionsStopYears = addRaw >= horizon ? 999 : addRaw;
    if (els.inpYoungsterAddStopMonths) els.inpYoungsterAddStopMonths.disabled = additionsStopYears >= horizon;
    const addMonths = additionsStopYears >= horizon ? 0 : Math.max(0, Math.min(11, intOr(els.inpYoungsterAddStopMonths, 0)));
    // Core / satellite selections on this tab (as in the Core engine)
    const yAlloc = Math.max(0, Math.min(100, numOr(els.inpYoungsterAlloc, 70)));
    const yCore = numOr(els.inpYoungsterCoreRet, 18);
    const ySat = numOr(els.inpYoungsterSatRet, 25);
    const rate = (yAlloc * yCore + (100 - yAlloc) * ySat) / 100;   // blended CAGR, %

    if (els.dispYoungsterAge) els.dispYoungsterAge.textContent = `${currentAge} yrs`;
    if (els.dispYoungsterHorizon) els.dispYoungsterHorizon.textContent = `${horizon} years`;
    const setT = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
    setT('disp-timeline-end-age', targetAge);
    if (els.inpYoungsterHz) {
      els.inpYoungsterHz.max = Math.max(1, (100 - currentAge) - (hz[2] - hz[0]));
      els.inpYoungsterHz.value = hz[0];
    }
    const ro = document.getElementById('hz-readout');
    if (ro) ro.innerHTML = `<strong>${hz.join(' · ')} yrs</strong> · ages ${checkAges.join(' · ')}`;
    document.querySelectorAll('.hz-btn').forEach(b => {
      const i = parseInt(b.getAttribute('data-hz'), 10), d = parseInt(b.getAttribute('data-d'), 10);
      const lo = i === 0 ? 1 : hz[i - 1] + 1, hi = i === 2 ? 100 - currentAge : hz[i + 1] - 1;
      b.disabled = d < 0 ? hz[i] <= lo : hz[i] >= hi;
    });
    if (els.dispYoungsterStepUp) els.dispYoungsterStepUp.textContent = fmtPct(stepUpPct / 100);
    const stepGroup = document.querySelector('.stepup-group[data-who="youngster"]');
    if (stepGroup) stepGroup.classList.toggle('is-disabled', !stepUpEnabled);
    if (els.eqYoungsterStepUp) {
      els.eqYoungsterStepUp.innerHTML = stepUpEnabled
        ? stepupEquivText(monthly, stepUpMode, stepUpPct / 100, stepUpAmt, Math.min(stepUpStopYears, horizon), Math.min(additionsStopYears, horizon))
        : 'Step-up is off: the SIP stays flat.';
    }
    const setTxt = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
    setTxt('disp-youngster-alloc', `${yAlloc}% / ${100 - yAlloc}%`);
    setTxt('disp-youngster-core-ret', `${yCore.toFixed(1)}%`);
    setTxt('disp-youngster-sat-ret', `${ySat.toFixed(1)}%`);
    const cs = document.getElementById('young-core-seg'), ss = document.getElementById('young-sat-seg');
    if (cs) cs.style.width = `${yAlloc}%`;
    if (ss) ss.style.width = `${100 - yAlloc}%`;
    setTxt('help-youngster-return', `Core ${yAlloc}% / Satellite ${100 - yAlloc}% · Core+SAT blend ${rate.toFixed(1)}%`);
    if (els.dispDelayCurrentAge) els.dispDelayCurrentAge.textContent = currentAge;
    if (els.dispTimelineStartAge) els.dispTimelineStartAge.textContent = currentAge;

    if (els.inpYoungsterStepUpPct) els.inpYoungsterStepUpPct.disabled = !stepUpEnabled;
    if (els.groupYoungsterStepUpStop) els.groupYoungsterStepUpStop.classList.toggle('is-off', !stepUpEnabled), els.groupYoungsterStepUpStop.classList.add('fade-block');
    const yrs = (n) => `${n} yr${n === 1 ? '' : 's'}`;
    if (els.dispYoungsterStepUpStop) {
      els.dispYoungsterStepUpStop.textContent = !stepUpEnabled ? '—' : (stepUpStopYears >= horizon ? 'Never' : yrs(stopRaw));
    }
    if (els.helpYoungsterStepUpStop) {
      els.helpYoungsterStepUpStop.textContent = !stepUpEnabled ? 'Step-up is off'
        : (stepUpStopYears >= horizon ? `Keeps rising every year to ${targetAge}` : `Rises until year ${stopRaw} (the age-${currentAge + stopRaw} row), then stays flat`);
    }
    if (els.dispYoungsterAddStop) {
      els.dispYoungsterAddStop.textContent = additionsStopYears >= horizon ? `Until ${targetAge}` : yrs(addRaw) + (addMonths ? ` ${addMonths} mo` : '');
    }
    if (els.helpYoungsterAddStop) {
      els.helpYoungsterAddStop.textContent = monthly <= 0 ? 'No monthly SIP set'
        : additionsStopYears >= horizon ? `Investing every year to ${targetAge}`
        : `SIPs end after ${yrs(addRaw)}${addMonths ? ' ' + addMonths + ' months' : ''} (age ${currentAge + addRaw}); the corpus keeps compounding to ${targetAge}`;
    }

    const result = CE.calculateYoungsterWealth({
      currentAge, targetAge, monthly, stepUpEnabled, stepUpPct, stepUpMode, stepUpAmt,
      stepUpStopYears, additionsStopYears, additionsStopMonths: addMonths, rate,
      coreRate: yCore, satRate: ySat, coreAlloc: yAlloc,
      lump, checkpointAges: checkAges, realInflation: viewInflation(),
      delayYearsList: delayList
    });
    const cr = (v, d = 2) => CE.formatINR(v, { compact: true, decimals: d });

    const setAge = (valEl, exactEl, multEl, corpus, mult, startedLabel) => {
      if (!valEl) return;
      if (corpus !== null && corpus !== undefined) {
        valEl.textContent = cr(corpus);
        if (exactEl) exactEl.textContent = CE.formatINR(corpus, { decimals: 0 });
        if (multEl) multEl.textContent = mult > 0 ? `${mult.toFixed(0)}× invested` : '';
      } else {
        valEl.textContent = '—';
        if (exactEl) exactEl.textContent = startedLabel;
        if (multEl) multEl.textContent = '';
      }
    };
    const cps = result.checkpoints;
    const ageTitle = (cp) => `At age ${cp.age}` + (cp.age > currentAge ? ` · in ${cp.age - currentAge} yrs` : '') + '<span class="real-tag"> · today’s ₹</span>';
    ['ykpi-title-1', 'ykpi-title-2', 'ykpi-title-3'].forEach((id, i) => { const el = document.getElementById(id); if (el) el.innerHTML = ageTitle(cps[i]); });
    setAge(els.ykpiCorpus50, els.ykpiCorpus50Exact, els.ykpiMult50, cps[0].corpus, cps[0].multiple, 'Not after the starting age');
    setAge(els.ykpiCorpus60, els.ykpiCorpus60Exact, els.ykpiMult60, cps[1].corpus, cps[1].multiple, 'Not after the starting age');
    setAge(els.ykpiCorpus, els.ykpiCorpusExact, els.ykpiMult70, cps[2].corpus, cps[2].multiple, 'Not after the starting age');

    if (els.ykpiInvested) els.ykpiInvested.textContent = cr(result.totalInvested);
    if (els.ykpiInvestedSub) {
      const activeYears = Math.min(horizon, additionsStopYears);
      const sipTxt = monthly <= 0 ? '' : activeYears >= horizon
        ? `SIPs over ${horizon} years, age ${currentAge} to ${targetAge}`
        : `SIPs for ${activeYears} yrs${addMonths ? ' ' + addMonths + ' mo' : ''}, age ${currentAge} to ${currentAge + activeYears}`;
      const lumpTxt = lump > 0 ? `${cr(lump)} today` : '';
      els.ykpiInvestedSub.textContent = [lumpTxt, sipTxt].filter(Boolean).join(' + ') || 'Nothing invested yet';
    }
    if (els.ykpiGain) els.ykpiGain.textContent = cr(result.wealthGain);
    if (els.ykpiGainShare) {
      els.ykpiGainShare.textContent = `${result.corpus > 0 ? ((result.wealthGain / result.corpus) * 100).toFixed(1) : '0'}% of wealth`;
    }
    if (els.ykpiMultiple) els.ykpiMultiple.textContent = result.totalInvested > 0 ? `${result.multiple.toFixed(0)}× invested` : '—';

    const delay5 = result.delayScenarios.find(s => s.delayYears === waitStep);
    setT('ykpi-delay-title', `Cost of waiting ${waitStep} years`);
    if (els.ykpiDelay5) {
      if (delay5) {
        els.ykpiDelay5.textContent = `−${delay5.pctLost.toFixed(1)}%`;
        if (els.ykpiDelay5Loss) els.ykpiDelay5Loss.textContent = `${cr(delay5.wealthLost, 1)} less at ${targetAge}`;
      } else {
        els.ykpiDelay5.textContent = 'n/a';
        if (els.ykpiDelay5Loss) els.ykpiDelay5Loss.textContent = `Too close to ${targetAge}`;
      }
    }
    const delayNote = document.getElementById('young-delay-note');
    if (delayNote) {
      delayNote.innerHTML = `Same ${lump > 0 ? 'lump sum, ' : ''}monthly amount and step-up, started ${delayList[0]}, ${delayList[1]} or ${delayList[2]} years later. Loss is measured at age ${targetAge} against starting today at <strong>age ${currentAge}</strong>.`;
    }
    document.querySelectorAll('.wait-toggle .seg-btn').forEach(b => {
      const on = parseInt(b.getAttribute('data-wait'), 10) === waitStep;
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    // How fast money doubles — FD, Nifty and your Core+SAT mix from this tab's selections.
    // Core and satellite grow as separate pots (as in the Core engine), so the mix is valued pot by pot.
    {
      const dblBody = document.getElementById('young-doubling-tbody');
      const cw = yAlloc / 100, rc = yCore / 100, rs = ySat / 100;
      const vi = viewInflation();
      const realF = (t) => Math.pow(1 + vi, t);           // today's rupees: divide by inflation
      const mixGrowth = (t) => (cw * Math.pow(1 + rc, t) + (1 - cw) * Math.pow(1 + rs, t)) / realF(t);
      const realRate = (r) => (1 + r) / (1 + vi) - 1;
      const dblAt = (r) => { const x = realRate(r); return x > 0 ? Math.log(2) / Math.log(1 + x) : null; };
      // Years for a lump sum in the mix to double: solve mixGrowth(t) = 2
      let lo = 0, hi = 200;
      for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (mixGrowth(m) >= 2) hi = m; else lo = m; }
      const mixDbl = mixGrowth(200) >= 2 ? (lo + hi) / 2 : null;
      const rows = [
        { name: 'Fixed deposit', ret: vi ? `${(realRate(0.065) * 100).toFixed(1)}% real` : '6.5%', d: dblAt(0.065), v: 100000 * Math.pow(1.065, 30) / realF(30) },
        { name: 'Nifty 50 index', ret: vi ? `${(realRate(0.13) * 100).toFixed(1)}% real` : '13%', d: dblAt(0.13), v: 100000 * Math.pow(1.13, 30) / realF(30) },
        { name: 'Core+SAT', ret: vi ? `${(realRate(rate / 100) * 100).toFixed(1)}% real` : `${rate.toFixed(1)}%`, d: mixDbl, v: 100000 * mixGrowth(30), chosen: true }
      ];
      if (dblBody) {
        dblBody.innerHTML = rows.map(x => `<tr class="${x.chosen ? 'sensitivity-highlight' : ''}">
            <td>${x.chosen ? '<strong>' + x.name + '</strong>' : x.name}</td>
            <td>${x.ret}</td>
            <td>${x.d ? x.d.toFixed(1) + ' yrs' : '—'}</td>
            <td>${CE.formatINR(x.v, { compact: true, decimals: 2 })}</td>
          </tr>`).join('');
      }
      const noteEl = document.getElementById('young-doubling-note');
      if (noteEl) {
        noteEl.innerHTML = mixDbl
          ? `Core+SAT = ${yAlloc}% core at ${yCore.toFixed(1)}% and ${100 - yAlloc}% satellite at ${ySat.toFixed(1)}% (blend ${rate.toFixed(1)}%). It first doubles in ${mixDbl.toFixed(2)} years, and a lump sum doubles about ${Math.log2(mixGrowth(horizon)).toFixed(1)} times between age ${currentAge} and ${targetAge}.`
          : 'Choose returns above zero.';
      }
    }

    // Cost of delay cards
    const cpVal = (list, i) => (list && list[i] && list[i].corpus !== null && list[i].corpus !== undefined) ? cr(list[i].corpus) : '—';
    const ageRows = (list) => `
      <div class="yc-rows">
        <div class="yc-row"><span>At ${checkAges[0]}</span><strong>${cpVal(list, 0)}</strong></div>
        <div class="yc-row"><span>At ${checkAges[1]}</span><strong>${cpVal(list, 1)}</strong></div>
      </div>`;

    let cardsHtml = `
      <div class="youngster-card baseline">
        <div class="yc-head"><span class="yc-title">Start today, age ${result.currentAge}</span><span class="badge badge-win">Best</span></div>
        ${ageRows(result.checkpoints)}
        <div class="yc-final"><span>At ${targetAge}</span><strong class="val-growth">${cr(result.corpus)}</strong></div>
        <div class="yc-loss-bar yc-keep-bar"><i style="width:100%"></i></div>
        <div class="yc-foot">Invested ${cr(result.totalInvested)} · ${result.multiple.toFixed(0)}× back</div>
      </div>`;

    result.delayScenarios.forEach(d => {
      const keep = Math.max(0, 100 - d.pctLost);
      cardsHtml += `
        <div class="youngster-card delayed">
          <div class="yc-head"><span class="yc-title">Wait ${d.delayYears} yr${d.delayYears > 1 ? 's' : ''}, age ${d.startAge}</span><span class="badge badge-loss">−${d.pctLost.toFixed(0)}%</span></div>
          ${ageRows(d.checkpoints)}
          <div class="yc-final"><span>At ${targetAge}</span><strong>${cr(d.corpus)}</strong></div>
          <div class="yc-loss-bar" title="${keep.toFixed(0)}% of the start-today corpus"><i style="width:${keep}%; background: var(--text-muted)"></i></div>
          <div class="yc-foot"><span class="val-rose">${cr(d.wealthLost, 1)} less</span> · invested ${cr(d.totalInvested)}</div>
        </div>`;
    });
    els.youngsterCards.innerHTML = cardsHtml;

    // Timeline table
    if (els.youngsterTimelineTbody && result.yearlyRows) {
      const tag = { [checkAges[0]]: 'badge-self', [checkAges[1]]: 'badge-gold', [targetAge]: 'badge-win' };
      els.youngsterTimelineTbody.innerHTML = result.yearlyRows.map(r => {
        const special = checkAges.includes(r.age) || r.age === targetAge;
        const rowClass = special ? 'row-horizon' : (r.age % 5 === 0 ? 'milestone-row' : '');
        const mult = r.totalInvested > 0 ? (r.corpus / r.totalInvested).toFixed(1) : '0.0';
        const badge = special ? ` <span class="badge ${tag[r.age] || 'badge-gold'} age-tag">Age ${r.age}</span>` : '';
        const growthBeatsSaving = r.annualInterest > r.annualAdd && r.annualAdd > 0;
        return `<tr class="${rowClass}">
            <td><strong>${r.age}</strong>${badge}</td>
            <td>${r.year}</td>
            <td>${r.monthly > 0 && r.months > 0 ? CE.formatINR(r.monthly, { decimals: 0 }) + (r.months < 12 ? ` <span class="c-muted">× ${r.months} mo</span>` : '') : '<span class="c-muted">—</span>'}</td>
            <td>${r.annualAdd > 0 ? cr(r.annualAdd) : '<span class="c-muted">—</span>'}</td>
            <td class="${growthBeatsSaving || r.annualAdd === 0 ? 'c-gold' : ''}">${cr(r.annualInterest)}</td>
            <td>${cr(r.totalInvested)}</td>
            <td class="c-growth">${cr(r.corpus)}</td>
            <td>${mult}×</td>
          </tr>`;
      }).join('');
    }
  }

  /**
   * Doubling ladder (Goal & schedule) — compact rungs for the main plan
   */
  function renderLadder(result, params) {
    const strip = document.getElementById('ladder-strip');
    const note = document.getElementById('ladder-note');
    if (!strip) return;
    const ms = result.milestones.filter(m => typeof m.yearReached === 'number').slice(0, 14);
    const base = params.selfLump + (params.spouseInclude ? params.spouseLump : 0);
    if (!ms.length) {
      strip.innerHTML = '<li class="is-out"><span class="ly">Enter a lump sum or SIP in the Core engine to see the ladder.</span></li>';
      if (note) note.textContent = '';
      return;
    }
    const baseAmt = base > 0 ? base : ms[0].target / 2;
    if (note) {
      const irr = result.portfolioIRR;
      const dt = result.doublingTimeAtIRR;
      note.textContent = `Multiples of ${base > 0 ? 'your ' + inrFull(baseAmt) + ' starting capital' : 'the first year’s SIP (' + inrFull(baseAmt) + ')'}, SIPs included. ` +
        (irr > 0 ? `At the plan’s ${fmtPct(irr, 1)} IRR money doubles every ${dt.toFixed(2)} yrs (the Rule of 72 says ${(72 / (irr * 100)).toFixed(2)}) — about ${(result.horizon / dt).toFixed(1)} doublings in ${result.horizon} years.` : '');
    }
    strip.innerHTML = ms.map(m => `
      <li class="${m.isWithinHorizon ? 'is-in' : 'is-out'}" title="${m.isWithinHorizon ? 'Reached within your horizon' : 'Reached after your horizon'}">
        <span class="lm">${m.multiple.toLocaleString('en-IN')}×</span>
        <span class="lv">${CE.formatINR(m.target, { compact: true, decimals: 2 })}</span>
        <span class="ly">Year ${m.yearReached.toFixed(1)}${typeof m.gap === 'number' && m.multiple > 2 ? ` · +${m.gap.toFixed(1)}` : ''}</span>
      </li>`).join('');
  }

  /**
   * Spouse effect strip (Core engine) — shown only when spouse contributions are on.
   * Returns the analysis so the growth chart can overlay the "self only" path.
   */
  function updateSpouseAccelerator(params) {
    const strip = document.getElementById('spouse-strip');
    const wisdom = document.querySelector('.wisdom-bottom-row');
    if (!strip) return null;
    if (!params.spouseInclude) {
      strip.hidden = true;
      if (wisdom) wisdom.hidden = false;
      return null;
    }
    strip.hidden = false;
    if (wisdom) wisdom.hidden = true;
    const sa = CE.analyzeSpouseImpact(params);
    const savedYrs = sa.timeSavedYears;
    const h = sa.combinedResult.horizon;
    els.spouseTimeSaved.textContent = savedYrs > 0.05 ? `${savedYrs.toFixed(1)} years` : '—';
    if (els.spouseCompYearsSaved) els.spouseCompYearsSaved.textContent = savedYrs > 0 ? `${savedYrs.toFixed(1)} yrs` : '';
    if (els.spouseHorizonLabel) els.spouseHorizonLabel.textContent = h;
    els.spouseCompReachYr.textContent = sa.yearsWithSpouseToReachSelfTarget !== null ? sa.yearsWithSpouseToReachSelfTarget.toFixed(1) : '—';
    els.spouseCompSolo.textContent = CE.formatINR(sa.selfCorpus, { compact: true, decimals: 2 });
    els.spouseCompSoloInv.textContent = CE.formatINR(sa.selfTotalInvested, { compact: true, decimals: 1 });
    els.spouseCompTeam.textContent = CE.formatINR(sa.combinedCorpus, { compact: true, decimals: 2 });
    els.spouseCompTeamInv.textContent = CE.formatINR(sa.combinedTotalInvested, { compact: true, decimals: 1 });
    els.spouseCompExtra.textContent = sa.extraCorpusAtHorizon > 0 ? `+${CE.formatINR(sa.extraCorpusAtHorizon, { compact: true, decimals: 2 })}` : '₹0';
    els.spouseCompMultiplier.textContent = sa.spouseWealthMultiplier > 0
      ? `${sa.spouseWealthMultiplier.toFixed(1)}× the ${CE.formatINR(sa.spouseTotalInvested, { compact: true, decimals: 1 })} the spouse invests`
      : 'Enter the spouse’s lump sum or SIP';
    return sa;
  }

  /**
   * Annual review: the active user's year-end records vs the plan, and what it now takes
   * to reach the user's goal on time.
   */
  function goalParamsFor(params) {
    const g0 = readGoalInputs();
    const inf = inflRate();
    const g = Object.assign({}, g0, { todayTarget: g0.target,
      target: g0.inflationAdjusted && inf > 0 ? g0.target * Math.pow(1 + inf, g0.years) : g0.target });
    params = Object.assign({}, params, { realInflation: 0 });
    return { goal: g, params: Object.assign({}, params, { horizon: Math.min(60, Math.max(1, g.years)) }) };
  }

  function periodLabel(startYear, y) {
    const a = (startYear || thisYear()) + y - 1;
    return `${a}–${String((a + 1) % 100).padStart(2, '0')}`;
  }

  function updateActualsTab(params) {
    if (!els.actualsTbody) return;
    const u = activeUser();
    const startYear = u ? u.startYear : thisYear();
    const { goal, params: gp } = goalParamsFor(params);
    const review = CE.reviewActualsAndCorrect(gp, state.actualsHistory, goal.target);
    const baseline = CE.calculateSchedule(gp);              // the original plan, no actuals
    const revised = review.revisedSchedule;                  // actual years + plan after
    const cr = (v) => CE.formatINR(v, { compact: true, decimals: 2 });
    state.lastReview = { review, baseline, revised, goal, startYear };

    // User card
    const setText = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
    if (u) {
      setText('review-user-name', u.name);
      setText('review-user-id', `User ID: ${u.userId}`);
      setText('review-goal', `${cr(goal.target)} in ${goal.years} yrs (by ${startYear + goal.years - 1}–${String((startYear + goal.years) % 100).padStart(2, '0')})` +
        (goal.target !== goal.todayTarget ? ` · ${cr(goal.todayTarget)} in today’s money at ${fmtPct(inflRate())} inflation` : ''));
      setText('review-start', `${startYear}`);
      const logged = Object.keys(state.actualsHistory).length;
      setText('review-logged', logged ? `${logged} (latest: year ${review.latestActualYear})` : 'None yet');
      setText('review-saved', fmtDateTime(u.updatedAt));
    }

    // Cards
    setText('cc-revised-title', `Projected at year ${goal.years} (${periodLabel(startYear, goal.years)})`);
    els.ccRevisedCorpus.textContent = cr(review.revisedCorpus);
    const gap = review.revisedCorpus - goal.target;
    if (Math.abs(gap) < Math.max(1000, goal.target * 0.0005)) {
      els.ccVarianceText.textContent = 'right on the goal'; els.ccVarianceText.style.color = 'var(--growth)';
    } else if (gap > 0) {
      els.ccVarianceText.textContent = `${cr(gap)} above the goal`; els.ccVarianceText.style.color = 'var(--growth)';
    } else {
      els.ccVarianceText.textContent = `${cr(-gap)} short of the goal`; els.ccVarianceText.style.color = 'var(--rose)';
    }

    const tEl = document.getElementById('cc-time-to-goal'), tSub = document.getElementById('cc-time-sub');
    if (tEl && tSub) {
      if (review.revisedTimeToGoal === null) {
        tEl.textContent = 'Not in 60 yrs'; tSub.textContent = 'At the planned SIP and returns the goal is never reached.';
      } else {
        const d = goal.years - review.revisedTimeToGoal;
        tEl.textContent = `Year ${review.revisedTimeToGoal.toFixed(1)}`;
        tSub.innerHTML = d >= 0
          ? `<span class="good">${d.toFixed(1)} years before the deadline</span>, with the planned SIP and returns from here.`
          : `<span class="bad">${(-d).toFixed(1)} years after the deadline</span>, with the planned SIP and returns from here.`;
      }
    }

    const planned = (review.plannedWeightedRate * 100).toFixed(1);
    if (review.latestActualYear >= goal.years) {
      els.ccRequiredRate.textContent = '—';
      els.ccRateDiff.textContent = 'Every year up to the goal year is already recorded.';
    } else if (review.requiredFutureRate !== null) {
      els.ccRequiredRate.textContent = CE.formatPercent(review.requiredFutureRate, 1);
      const d = (review.requiredFutureRate - review.plannedWeightedRate) * 100;
      const yrsLeft = goal.years - review.latestActualYear;
      els.ccRateDiff.innerHTML = Math.abs(d) <= 0.05
        ? `Blended CAGR for the remaining ${yrsLeft} years — the same as your ${planned}%.`
        : `Blended CAGR for the remaining ${yrsLeft} years: <span class="${d > 0 ? 'bad' : 'good'}">${Math.abs(d).toFixed(1)} pts ${d > 0 ? 'above' : 'below'}</span> your ${planned}%.`;
    } else {
      els.ccRequiredRate.textContent = review.rateOutOfRange === 'high' ? 'Over 150%' : '—';
      els.ccRateDiff.textContent = review.rateOutOfRange === 'high'
        ? 'Returns alone cannot close this gap — more money is needed (see SIP).'
        : 'Already ahead of the goal even at very low returns.';
    }

    if (els.ccSipTitle) els.ccSipTitle.textContent = `Monthly SIP needed from year ${review.sipFromYear}`;
    if (review.latestActualYear >= goal.years) {
      els.ccRequiredSIP.textContent = '—'; els.ccSipDiff.textContent = '';
    } else if (review.sipUnreachable) {
      els.ccRequiredSIP.textContent = 'Not reachable';
      els.ccSipDiff.textContent = 'No SIP closes the gap in the time left at the planned returns.';
    } else {
      els.ccRequiredSIP.textContent = `${inrFull(review.requiredFutureSIP)} / mo`;
      const plannedM = inrFull(review.plannedFutureMonthly);
      const delta = review.sipAdjustmentNeeded;
      if (review.sipMode === 'restart') {
        els.ccSipDiff.innerHTML = review.requiredFutureSIP > 0
          ? `The planned SIP has ended by year ${review.sipFromYear}. A flat SIP like this until year ${goal.years}, at planned returns, reaches the goal.`
          : '<span class="good">No more SIP needed</span> — the goal is reached anyway.';
      } else if (delta > 100) {
        els.ccSipDiff.innerHTML = `The plan has ${plannedM} for year ${review.sipFromYear}. <span class="bad">Add ${inrFull(delta)} a month</span>, keeping the step-up, at planned returns.`;
      } else if (delta < -100) {
        els.ccSipDiff.innerHTML = `The plan has ${plannedM} for year ${review.sipFromYear}. <span class="good">${inrFull(-delta)} a month less</span> still reaches the goal.`;
      } else {
        els.ccSipDiff.textContent = `The planned SIP (${plannedM} in year ${review.sipFromYear}) is enough.`;
      }
    }

    // Records table: every recorded year, plus the next year to fill in
    const lastRow = Math.min(60, Math.max(review.latestActualYear + 1, 1));
    const pending = state.reviewPending || {};
    let html = '';
    for (let yr = 1; yr <= lastRow; yr++) {
      const rec = state.actualsHistory[yr];
      const b = baseline.yearlyRows[yr], r = revised.yearlyRows[yr], prev = revised.yearlyRows[yr - 1];
      const hasValues = rec && (rec.coreValue != null || rec.satValue != null || rec.totalValue != null);
      const legacy = rec && !hasValues;
      const p = pending[yr] || {};
      const val = (k) => p[k] !== undefined ? p[k] : (rec && rec[k] != null && rec[k] !== '' ? rec[k] : '');
      const edited = Object.keys(p).length > 0;
      const plannedInv = b.selfContrib + b.spouseContrib;
      const invPh = Math.round(plannedInv);
      const corePh = Math.round(r.coreClose), satPh = Math.round(r.satClose);

      let retCell = '<span class="c-muted">—</span>', diffCell = '<span class="c-muted">—</span>', totalCell = '<span class="c-muted">—</span>';
      if (rec) {
        const add = r.selfContrib + r.spouseContrib;
        const open = prev.totalCorpus;
        const base = open + add / 2;
        const tot = base > 0 ? (r.totalCorpus - open - add) / base : null;
        const pc = (x) => x === null || x === undefined ? '—' : `${(x * 100).toFixed(1)}%`;
        retCell = `<div class="ret-cell"><strong class="${tot !== null && tot < 0 ? 'val-rose' : ''}">${pc(tot)}</strong><small>core ${pc(r.actualCoreRate)} · sat ${pc(r.actualSatRate)}</small></div>`;
        const d = r.totalCorpus - b.totalCorpus;
        diffCell = `<span class="${d >= 0 ? 'c-growth' : 'val-rose'}">${d >= 0 ? '+' : '−'}${CE.formatINR(Math.abs(d), { compact: true, decimals: 2 })}</span>`;
        totalCell = `<strong>${inrFull(r.totalCorpus)}</strong>`;
      }
      html += `
        <tr data-yr="${yr}" class="${edited ? 'is-pending' : ''}">
          <td><strong>Year ${yr}</strong><span class="yr-sub">${periodLabel(startYear, yr)}${legacy ? ' · returns entered' : ''}</span></td>
          <td>${inrFull(plannedInv)}</td>
          <td><input type="number" min="0" step="1000" data-k="invested" value="${val('invested')}" placeholder="${invPh}" aria-label="Actual amount invested in year ${yr}" class="${p.invested !== undefined ? 'is-edited' : ''}"></td>
          <td>${inrFull(b.totalCorpus)}</td>
          <td><input type="number" min="0" step="1000" data-k="coreValue" value="${val('coreValue')}" placeholder="${corePh}" aria-label="Core portfolio value at end of year ${yr}" class="${p.coreValue !== undefined ? 'is-edited' : ''}"></td>
          <td><input type="number" min="0" step="1000" data-k="satValue" value="${val('satValue')}" placeholder="${satPh}" aria-label="Satellite portfolio value at end of year ${yr}" class="${p.satValue !== undefined ? 'is-edited' : ''}"></td>
          <td>${totalCell}</td>
          <td>${retCell}</td>
          <td>${diffCell}</td>
          <td><span class="row-actions">
            <button class="btn btn-compact btn-row-save" data-act="save" ${edited ? '' : 'disabled'}>Save</button>
            ${rec ? '<button class="btn-link" data-act="clear">Delete</button>' : ''}
          </span></td>
        </tr>`;
    }
    if (!u) html = '<tr><td colspan="10" class="empty-note">Open or create a user to record year-end values.</td></tr>';
    els.actualsTbody.innerHTML = html;

    drawReviewChart(document.getElementById('reviewChart'), baseline.yearlyRows, revised.yearlyRows, review.latestActualYear, goal);
  }

  // Row editing: inputs only mark the row as pending; Save writes to the database
  if (els.actualsTbody) {
    els.actualsTbody.addEventListener('input', (e) => {
      const input = e.target.closest('input[data-k]');
      if (!input) return;
      const tr = input.closest('tr[data-yr]');
      const yr = parseInt(tr.getAttribute('data-yr'), 10);
      state.reviewPending = state.reviewPending || {};
      state.reviewPending[yr] = state.reviewPending[yr] || {};
      state.reviewPending[yr][input.getAttribute('data-k')] = input.value;
      tr.classList.add('is-pending');
      input.classList.add('is-edited');
      const btn = tr.querySelector('[data-act="save"]');
      if (btn) btn.disabled = false;
    });
    els.actualsTbody.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const tr = e.target.closest('tr[data-yr]');
      if (tr) { e.preventDefault(); saveReviewRow(parseInt(tr.getAttribute('data-yr'), 10)); }
    });
    els.actualsTbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const yr = parseInt(btn.closest('tr[data-yr]').getAttribute('data-yr'), 10);
      if (btn.getAttribute('data-act') === 'save') saveReviewRow(yr);
      if (btn.getAttribute('data-act') === 'clear') {
        if (!confirm(`Delete the year ${yr} record for ${activeUser() ? activeUser().name : 'this user'}?`)) return;
        delete state.actualsHistory[yr];
        if (state.reviewPending) delete state.reviewPending[yr];
        persistActiveActuals();
        updateAll();
        showToast(`Year ${yr} record deleted`, '✓');
      }
    });
  }

  function saveReviewRow(yr) {
    const tr = els.actualsTbody.querySelector(`tr[data-yr="${yr}"]`);
    if (!tr) return;
    const read = (k) => { const el = tr.querySelector(`input[data-k="${k}"]`); return el ? el.value.trim() : ''; };
    const inv = read('invested'), cv = read('coreValue'), sv = read('satValue');
    if (cv === '' || sv === '') {
      showToast(`Enter both the core and the satellite value for year ${yr}`, '!');
      (cv === '' ? tr.querySelector('input[data-k="coreValue"]') : tr.querySelector('input[data-k="satValue"]')).focus();
      return;
    }
    const nums = [inv, cv, sv].filter(x => x !== '').map(Number);
    if (nums.some(n => !isFinite(n) || n < 0)) { showToast('Values must be numbers of ₹0 or more', '!'); return; }
    state.actualsHistory[yr] = {
      invested: inv === '' ? null : Number(inv),
      coreValue: Number(cv),
      satValue: Number(sv),
      recordedAt: nowIso()
    };
    if (state.reviewPending) delete state.reviewPending[yr];
    persistActiveActuals();
    updateAll();
    showToast(`Year ${yr} saved for ${escapeHtml(activeUser() ? activeUser().name : '')}${inv === '' ? ' (invested taken as planned)' : ''}`, '✓');
    const next = els.actualsTbody.querySelector(`tr[data-yr="${yr + 1}"] input[data-k="invested"]`);
    if (next) next.focus();
  }

  /** Plan vs actual/revised vs goal */
  function drawReviewChart(canvas, planRows, revRows, latest, goal) {
    if (!canvas || canvas.offsetParent === null) return;
    const { ctx, width, height } = prepCanvas(canvas, 280);
    const P = palette();
    const H = Math.max(1, Math.min(60, goal.years));
    const plan = planRows.filter(r => r.year <= H), rev = revRows.filter(r => r.year <= H);
    const padL = 64, padR = 24, padT = 16, padB = 30;
    const plotW = width - padL - padR, plotH = height - padT - padB;
    const fontUi = (sz, wt = 400) => `${wt} ${sz}px ${P.fontUi}`;
    const maxRaw = Math.max(goal.target, ...plan.map(r => r.totalCorpus), ...rev.map(r => r.totalCorpus));
    if (!(maxRaw > 0)) return;
    const rawStep = maxRaw / 5, mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= rawStep);
    const top = Math.ceil(maxRaw / step) * step;
    const sx = (yr) => padL + (yr / H) * plotW, sy = (v) => padT + plotH - (v / top) * plotH;

    ctx.font = fontUi(11); ctx.textAlign = 'right'; ctx.lineWidth = 1;
    for (let v = 0; v <= top + 1e-6; v += step) {
      const y = Math.round(sy(v)) + 0.5;
      ctx.strokeStyle = P.line; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      ctx.fillStyle = P.muted; ctx.fillText(v === 0 ? '₹0' : CE.formatINR(v, { compact: true, decimals: v >= 1e7 ? 0 : 1 }).replace('.0 ', ' '), padL - 8, y + 4);
    }
    ctx.textAlign = 'center';
    const xs = xStepFor(H);
    for (let yr = 0; yr < H; yr += xs) { if (H - yr >= xs * 0.5) { ctx.fillStyle = P.muted; ctx.fillText(`${yr}`, sx(yr), padT + plotH + 18); } }
    ctx.fillStyle = P.gold; ctx.font = fontUi(11, 700); ctx.fillText(`Yr ${H}`, Math.min(sx(H), width - padR - 12), padT + plotH + 18);

    // Goal line
    ctx.setLineDash([6, 4]); ctx.strokeStyle = P.gold; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(padL, sy(goal.target)); ctx.lineTo(padL + plotW, sy(goal.target)); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = fontUi(11.5, 600); ctx.fillStyle = P.gold; ctx.textAlign = 'left';
    ctx.fillText(`Goal ${CE.formatINR(goal.target, { compact: true, decimals: 2 })}`, padL + 6, sy(goal.target) - 6);

    const path = (rows) => { ctx.beginPath(); rows.forEach((r, i) => { const x = sx(r.year), y = sy(r.totalCorpus); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); };
    // Plan
    path(plan); ctx.strokeStyle = P.muted; ctx.lineWidth = 1.8; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
    // Actual part (solid) then projection (dashed)
    const cut = Math.min(latest, H);
    if (cut > 0) { path(rev.filter(r => r.year <= cut)); ctx.strokeStyle = P.growth; ctx.lineWidth = 2.8; ctx.stroke(); }
    path(rev.filter(r => r.year >= cut)); ctx.strokeStyle = P.growth; ctx.lineWidth = 2.2; ctx.setLineDash(cut > 0 ? [7, 4] : []); ctx.stroke(); ctx.setLineDash([]);
    // Recorded points
    rev.forEach(r => {
      if (r.year >= 1 && r.year <= cut && state.actualsHistory[r.year]) {
        ctx.beginPath(); ctx.arc(sx(r.year), sy(r.totalCorpus), 4, 0, Math.PI * 2);
        ctx.fillStyle = P.growth; ctx.fill(); ctx.strokeStyle = P.panel; ctx.lineWidth = 2; ctx.stroke();
      }
    });
    // Goal marker at deadline
    ctx.beginPath(); ctx.arc(sx(H), sy(goal.target), 5, 0, Math.PI * 2);
    ctx.fillStyle = P.gold; ctx.fill(); ctx.strokeStyle = P.panel; ctx.lineWidth = 2; ctx.stroke();
  }

  /**
   * Update Contributions Segmented Chips (Self & Spouse preview amounts)
   */
  function updateContributionsChips(params) {
    if (els.chipSelfVal) {
      if (params.selfInclude && params.selfMonthly > 0) {
        els.chipSelfVal.textContent = `${CE.formatINR(params.selfMonthly, { compact: true, decimals: 0 })}/mo`;
        els.chipSelfVal.classList.remove('chip-off');
      } else if (params.selfLump > 0) {
        els.chipSelfVal.textContent = 'Lump only';
        els.chipSelfVal.classList.remove('chip-off');
      } else if (params.selfInclude) {
        els.chipSelfVal.textContent = '₹0';
        els.chipSelfVal.classList.remove('chip-off');
      } else {
        els.chipSelfVal.textContent = 'Off';
        els.chipSelfVal.classList.add('chip-off');
      }
    }
    if (els.chipSpouseVal) {
      if (!params.spouseInclude) {
        els.chipSpouseVal.textContent = 'Off';
        els.chipSpouseVal.classList.add('chip-off');
      } else if (params.spouseMonthly > 0) {
        els.chipSpouseVal.textContent = `${CE.formatINR(params.spouseMonthly, { compact: true, decimals: 0 })}/mo`;
        els.chipSpouseVal.classList.remove('chip-off');
      } else if (params.spouseLump > 0) {
        els.chipSpouseVal.textContent = 'Lump only';
        els.chipSpouseVal.classList.remove('chip-off');
      } else {
        els.chipSpouseVal.textContent = '₹0';
        els.chipSpouseVal.classList.remove('chip-off');
      }
    }
  }

  /**
   * Initialize Segmented Switcher for Self & Spouse in Contributions Card
   */
  function initContributionsSwitcher() {
    const btnSelf = document.getElementById('tab-btn-self');
    const btnSpouse = document.getElementById('tab-btn-spouse');
    const paneSelf = document.getElementById('pane-self');
    const paneSpouse = document.getElementById('pane-spouse');

    if (!btnSelf || !btnSpouse || !paneSelf || !paneSpouse) return;

    btnSelf.addEventListener('click', function () {
      btnSelf.classList.add('active');
      btnSpouse.classList.remove('active');
      paneSelf.classList.add('active');
      paneSpouse.classList.remove('active');
    });

    btnSpouse.addEventListener('click', function () {
      btnSpouse.classList.add('active');
      btnSelf.classList.remove('active');
      paneSpouse.classList.add('active');
      paneSelf.classList.remove('active');
    });
  }

  /**
   * Initialize Youngster Lab Event Listeners & Quick Chips
   */
  function initYoungsterLab() {
    const inputs = [
      els.inpYoungsterAge,
      els.inpYoungsterMonthly,
      els.inpYoungsterLump,
      els.inpYoungsterStepUpEnable,
      els.inpYoungsterStepUpPct,
      els.inpYoungsterStepUpStop,
      els.inpYoungsterAddStop,
      els.inpYoungsterAlloc,
      els.inpYoungsterCoreRet,
      els.inpYoungsterSatRet,
      els.inpYoungsterStepUpAmt,
      els.inpYoungsterAddStopMonths
    ];

    // −/+ buttons: move a years slider by exactly one year
    document.querySelectorAll('.year-stepper .step-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const input = document.getElementById(this.getAttribute('data-target'));
        if (!input) return;
        const v = (parseInt(input.value, 10) || 1) + parseInt(this.getAttribute('data-delta'), 10);
        input.value = Math.max(parseInt(input.min, 10) || 1, Math.min(parseInt(input.max, 10) || 60, v));
        updateYoungsterLab();
      });
    });

    inputs.forEach(input => {
      if (!input) return;
      input.addEventListener('input', updateYoungsterLab);
      input.addEventListener('change', updateYoungsterLab);
    });

    // Quick Monthly Chips
    document.querySelectorAll('.quick-youngster-chips .chip-action').forEach(chip => {
      chip.addEventListener('click', function () {
        const val = parseFloat(this.getAttribute('data-val'));
        if (els.inpYoungsterMonthly && !isNaN(val)) {
          els.inpYoungsterMonthly.value = val;
          document.querySelectorAll('.quick-youngster-chips .chip-action').forEach(c => c.classList.remove('active'));
          this.classList.add('active');
          updateYoungsterLab();
        }
      });
    });

    // Synchronize active chip when user types manually in monthly input
    if (els.inpYoungsterMonthly) {
      els.inpYoungsterMonthly.addEventListener('input', function () {
        const val = parseFloat(this.value);
        document.querySelectorAll('.quick-youngster-chips .chip-action').forEach(chip => {
          if (parseFloat(chip.getAttribute('data-val')) === val) {
            chip.classList.add('active');
          } else {
            chip.classList.remove('active');
          }
        });
      });
    }

    // Lump sum chips
    const syncLumpChips = () => {
      const v = numOr(els.inpYoungsterLump, 0);
      document.querySelectorAll('.quick-young-lump-chips .chip-action').forEach(c => c.classList.toggle('active', parseFloat(c.getAttribute('data-val')) === v));
    };
    document.querySelectorAll('.quick-young-lump-chips .chip-action').forEach(chip => {
      chip.addEventListener('click', function () {
        if (!els.inpYoungsterLump) return;
        els.inpYoungsterLump.value = this.getAttribute('data-val');
        syncLumpChips(); updateYoungsterLab();
      });
    });
    if (els.inpYoungsterLump) els.inpYoungsterLump.addEventListener('input', syncLumpChips);

    // How far ahead to look: one control moves all three horizons; −/+ on each card moves one
    const shiftAll = (delta) => {
      const age = intOr(els.inpYoungsterAge, 20), h = state.youngHz || [30, 40, 50];
      const maxShift = (100 - age) - h[2], minShift = 1 - h[0];
      const d = Math.max(minShift, Math.min(maxShift, delta));
      state.youngHz = h.map(x => x + d);
      updateYoungsterLab();
    };
    if (els.inpYoungsterHz) els.inpYoungsterHz.addEventListener('input', () => {
      const h = state.youngHz || [30, 40, 50];
      shiftAll((parseInt(els.inpYoungsterHz.value, 10) || 1) - h[0]);
    });
    document.querySelectorAll('[data-hz-shift]').forEach(b => b.addEventListener('click', () => shiftAll(parseInt(b.getAttribute('data-hz-shift'), 10))));
    document.querySelectorAll('.hz-btn').forEach(b => b.addEventListener('click', () => {
      const i = parseInt(b.getAttribute('data-hz'), 10), d = parseInt(b.getAttribute('data-d'), 10);
      const age = intOr(els.inpYoungsterAge, 20), h = (state.youngHz || [30, 40, 50]).slice();
      const lo = i === 0 ? 1 : h[i - 1] + 1, hi = i === 2 ? 100 - age : h[i + 1] - 1;
      h[i] = Math.max(lo, Math.min(hi, h[i] + d));
      state.youngHz = h;
      updateYoungsterLab();
    }));

    // Waiting steps: 3, 5 or 10 years
    document.querySelectorAll('.wait-toggle .seg-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        state.youngWait = parseInt(this.getAttribute('data-wait'), 10) || 3;
        updateYoungsterLab();
      });
    });

    // Step-up toggle switch
    if (els.inpYoungsterStepUpEnable) {
      els.inpYoungsterStepUpEnable.addEventListener('change', updateYoungsterLab);
    }

    // Initial calculation
    updateYoungsterLab();
  }



  // --- Attach Event Listeners ---
  const reactiveInputs = [
    els.coreAlloc, els.coreRet, els.satRet, els.horizon,
    els.selfLump, els.selfMonthly, els.selfInclude, els.selfStepUp, els.selfStepUpStop, els.selfAddStop,
    els.spouseInclude, els.spouseLump, els.spouseMonthly, els.spouseStepUp, els.spouseStepUpStop, els.spouseAddStop,
    els.goalTarget, els.goalYears, els.selfStepUpAmt, els.spouseStepUpAmt,
    els.selfAddStopMonths, els.spouseAddStopMonths, els.selfStepUpEnable, els.spouseStepUpEnable
  ];

  // 1.15: the faded boxes stay editable; typing an amount switches the monthly SIP / the spouse on
  // (registered before updateAll so the new amount is counted at once)
  [[els.selfMonthly, els.selfInclude], [els.spouseLump, els.spouseInclude], [els.spouseMonthly, els.spouseInclude]].forEach(([inp, sw]) => {
    if (inp && sw) inp.addEventListener('input', () => { if (!sw.checked && Number(inp.value) > 0) sw.checked = true; });
  });

  reactiveInputs.forEach(input => {
    if (!input) return;
    input.addEventListener('input', updateAll);
    input.addEventListener('change', updateAll);
  });

  // Use the goal's assumed CAGR in the Core engine (keeps the core–satellite gap)
  bindClick('btn-goal-return-apply', () => {
    const p = getCurrentParams();
    const assumed = numOr(els.goalReturn, p.coreReturn * 100) / 100;
    const r = CE.ratesForBlended(assumed, p);
    const before = { core: els.coreRet.value, sat: els.satRet.value, touched: state.goalReturnTouched, ret: els.goalReturn.value };
    const clamp = (el, v) => {
      const lo = parseFloat(el.min), hi = parseFloat(el.max), st = parseFloat(el.step) || 0.5;
      return Math.min(hi, Math.max(lo, Math.round(v / st) * st));
    };
    const c = clamp(els.coreRet, r.coreReturn * 100), sa = clamp(els.satRet, r.satReturn * 100);
    els.coreRet.value = c; els.satRet.value = sa;
    state.goalReturnTouched = false;
    updateAll();
    const exact = Math.abs(c - r.coreReturn * 100) < 0.26 && Math.abs(sa - r.satReturn * 100) < 0.26;
    showToast(`Core engine now uses ${c}% core and ${sa}% satellite${exact ? '' : ' (nearest the sliders allow)'} — press Save to keep it`, '✓', () => {
      els.coreRet.value = before.core; els.satRet.value = before.sat;
      state.goalReturnTouched = before.touched; els.goalReturn.value = before.ret;
      updateAll();
    });
  });

  // Goal planner: return assumed for the SIP
  if (els.goalReturn) {
    els.goalReturn.addEventListener('input', () => { state.goalReturnTouched = true; updateGoalPlanner(getCurrentParams()); });
  }
  if (els.btnGoalReturnReset) {
    els.btnGoalReturnReset.addEventListener('click', () => { state.goalReturnTouched = false; updateGoalPlanner(getCurrentParams()); });
  }
  if (els.goalSensTbody) {
    els.goalSensTbody.addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-ret]');
      if (!tr || !els.goalReturn) return;
      els.goalReturn.value = tr.getAttribute('data-ret');
      state.goalReturnTouched = true;
      updateGoalPlanner(getCurrentParams());
    });
  }

  // Goal Planner Quick Target Chips
  document.querySelectorAll('.chip-goal-quick').forEach(chip => {
    chip.addEventListener('click', function () {
      const val = parseFloat(this.getAttribute('data-goal'));
      if (els.goalTarget && !isNaN(val)) {
        els.goalTarget.value = val;
        updateAll();
      }
    });
  });



  // Navigation Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const targetId = this.getAttribute('data-tab');
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      this.classList.add('active');
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add('active');
      state.activeTab = targetId;

      // Charts measure their box, so redraw once the panel is visible
      requestAnimationFrame(updateAll);
    });
  });

  // Chart Scale Buttons
  const btnLinear = document.getElementById('btn-scale-linear');
  const btnLog = document.getElementById('btn-scale-log');
  if (btnLinear && btnLog) {
    btnLinear.addEventListener('click', () => {
      state.isLogScale = false;
      btnLinear.classList.add('active');
      btnLog.classList.remove('active');
      updateAll();
    });
    btnLog.addEventListener('click', () => {
      state.isLogScale = true;
      btnLog.classList.add('active');
      btnLinear.classList.remove('active');
      updateAll();
    });
  }

  // Annual review buttons
  if (els.btnAddActualYr) {
    els.btnAddActualYr.addEventListener('click', () => {
      const rows = els.actualsTbody ? els.actualsTbody.querySelectorAll('tr[data-yr]') : [];
      const last = rows.length ? rows[rows.length - 1] : null;
      const input = last ? last.querySelector('input[data-k="invested"]') : null;
      if (input) { input.focus(); input.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    });
  }
  if (els.btnResetActuals) {
    els.btnResetActuals.addEventListener('click', () => {
      const u = activeUser();
      const n = Object.keys(state.actualsHistory).length;
      if (!n) { showToast('There are no records to delete', '✓'); return; }
      if (!confirm(`Delete all ${n} year-end record(s) for ${u ? u.name : 'this user'}? This cannot be undone.`)) return;
      state.actualsHistory = {};
      state.reviewPending = {};
      persistActiveActuals();
      updateAll();
      showToast('All year-end records deleted', '✓');
    });
  }

  // User search (Annual review): by user ID or name
  function openUserBySearch() {
    const inp = document.getElementById('inp-user-search');
    const msg = document.getElementById('user-search-msg');
    if (!inp) return;
    const q = inp.value.trim().toLowerCase();
    if (msg) msg.textContent = '';
    if (!q) { if (msg) msg.textContent = 'Type a name or user ID.'; return; }
    const users = Object.values(getStoredProfiles());
    let hit = users.find(u => u.userId === q) || users.find(u => u.name.toLowerCase() === q);
    if (!hit) {
      const partial = users.filter(u => u.userId.includes(q) || u.name.toLowerCase().includes(q));
      if (partial.length === 1) hit = partial[0];
      else if (partial.length > 1) { if (msg) msg.textContent = `${partial.length} users match — be more specific: ${partial.slice(0, 4).map(u => u.userId).join(', ')}`; return; }
    }
    if (!hit) { if (msg) msg.textContent = `No user called “${inp.value.trim()}”. Use New user to create one.`; return; }
    if (hit.userId !== activeProfileId && state.isDirty && !confirm('You have unsaved plan changes for the current user. Open the other user and discard them?')) return;
    inp.value = '';
    loadProfile(hit.userId, true);
  }
  bindClick('btn-user-load', openUserBySearch);
  const userSearch = document.getElementById('inp-user-search');
  if (userSearch) userSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); openUserBySearch(); } });

  // Reset page — restores the inputs of the page you are on, with Undo
  // Youngster lab starting values (also what Reset page restores)
  const youngsterDefaults = { age: 20, lump: 0, monthly: 10000, enable: true, mode: 'pct', pct: 10, amt: 500, stop: 10, add: 10, addMonths: 0, alloc: 70, core: 18, sat: 25, hz: [30, 40, 50], wait: 3 };
  function readYoungsterInputs() {
    return {
      age: els.inpYoungsterAge.value, monthly: els.inpYoungsterMonthly.value,
      lump: els.inpYoungsterLump ? els.inpYoungsterLump.value : 0,
      hz: (state.youngHz || [30, 40, 50]).slice(),
      wait: state.youngWait || 3,
      enable: els.inpYoungsterStepUpEnable.checked, mode: els.inpYoungsterStepUpMode.value,
      pct: els.inpYoungsterStepUpPct.value, amt: els.inpYoungsterStepUpAmt.value,
      stop: els.inpYoungsterStepUpStop.value, add: els.inpYoungsterAddStop.value,
      addMonths: els.inpYoungsterAddStopMonths ? els.inpYoungsterAddStopMonths.value : 0,
      alloc: els.inpYoungsterAlloc.value, core: els.inpYoungsterCoreRet.value, sat: els.inpYoungsterSatRet.value
    };
  }
  function applyYoungsterInputs(v) {
    els.inpYoungsterAge.value = v.age;
    state.youngHz = (v.hz || [30, 40, 50]).slice();
    if (els.inpYoungsterLump) els.inpYoungsterLump.value = v.lump || 0;
    document.querySelectorAll('.quick-young-lump-chips .chip-action').forEach(c => c.classList.toggle('active', parseFloat(c.getAttribute('data-val')) === parseFloat(v.lump || 0)));
    state.youngWait = parseInt(v.wait, 10) || 3;
    updateYoungsterLab(); // resizes the year sliders for the age
    els.inpYoungsterMonthly.value = v.monthly;
    els.inpYoungsterStepUpEnable.checked = v.enable;
    setStepupMode('youngster', v.mode, false);
    els.inpYoungsterStepUpPct.value = v.pct; els.inpYoungsterStepUpAmt.value = v.amt;
    els.inpYoungsterStepUpStop.value = v.stop;
    els.inpYoungsterAddStop.value = Math.min(parseInt(v.add, 10), parseInt(els.inpYoungsterAddStop.max, 10));
    if (els.inpYoungsterAddStopMonths) els.inpYoungsterAddStopMonths.value = v.addMonths;
    els.inpYoungsterAlloc.value = v.alloc; els.inpYoungsterCoreRet.value = v.core; els.inpYoungsterSatRet.value = v.sat;
    document.querySelectorAll('.quick-youngster-chips .chip-action').forEach(c => c.classList.toggle('active', parseFloat(c.getAttribute('data-val')) === parseFloat(v.monthly)));
    updateYoungsterLab();
  }
  function readPlanTabInputs() {
    return { target: els.goalTarget.value, years: els.goalYears.value, ret: els.goalReturn ? els.goalReturn.value : null,
      touched: state.goalReturnTouched, infl: !!(els.goalInflation && els.goalInflation.checked) };
  }
  function applyPlanTabInputs(v) {
    els.goalTarget.value = v.target; els.goalYears.value = v.years;
    if (els.goalInflation) els.goalInflation.checked = !!v.infl;
    if (els.goalReturn && v.ret !== null) els.goalReturn.value = v.ret;
    state.goalReturnTouched = v.touched;
    updateAll();
  }

  function resetPage() {
    const tab = state.activeTab || 'tab-core';
    const u = activeUser();
    if (tab === 'tab-core') {
      const before = readInputsForProfile();
      state.presetId = null; if (presetNote) presetNote.hidden = true;
      applyParamsToInputs(defaultPlanParams());
      updateAll();
      showToast('Core engine reset to the standard plan — press Save to keep it for this user', '↺',
        () => { applyParamsToInputs(before); updateAll(); });
    } else if (tab === 'tab-plan') {
      const before = readPlanTabInputs();
      const g = u ? u.goal : { target: 100000000, years: 20, assumedReturn: null, inflationAdjusted: false };
      applyGoalToInputs(g);
      if (!(g.assumedReturn !== undefined && g.assumedReturn !== null)) state.goalReturnTouched = false;
      updateAll();
      showToast(u ? `Goal back to ${escapeHtml(u.name)}’s saved goal` : 'Goal reset', '↺',
        () => applyPlanTabInputs(before));
    } else if (tab === 'tab-actuals') {
      const n = Object.keys(state.reviewPending || {}).length;
      state.reviewPending = {};
      updateAll();
      showToast(n ? `Unsaved entries discarded (${n} year${n === 1 ? '' : 's'})` : 'Nothing unsaved to discard — saved records are untouched', '↺');
    } else if (tab === 'tab-youngsters') {
      const before = readYoungsterInputs();
      applyYoungsterInputs(youngsterDefaults);
      showToast('Youngster lab back to its starting values', '↺', () => applyYoungsterInputs(before));
    }
  }
  bindClick('btn-reset-page', resetPage);

  // =========================================================================
  // PRESETS — ready-made demonstrations for talks and slides
  // Each preset sets the Core engine (core), the goal (goal) and/or the
  // Youngster lab (young), then opens a page and shows a short talking point.
  // While a preset is shown, the plan pages leave the user's year-end records out.
  // =========================================================================
  const corePreset = (o) => Object.assign(defaultPlanParams(), {
    selfInclude: false, selfStepUpOn: false, selfMonthly: 10000, selfAddStop: 10, selfAddStopMonths: 0, selfStepUpStop: 10,
    spouseInclude: false, spouseStepUpOn: false
  }, o);
  const youngPreset = (o) => Object.assign({}, youngsterDefaults, { lump: 0, enable: false, add: 999, stop: 10, alloc: 100, core: 18, sat: 25, hz: [30, 40, 50], wait: 3 }, o);
  // 1.16: blended CAGR in the title (70 : 30) — 26% = 20 / 40, 18% = 15 / 25, ≈20% = 18 / 25
  const blendText = (c, s) => {
    const b = Math.round((0.7 * c + 0.3 * s) * 10) / 10;
    return b % 1 === 0 ? `${b}%` : Math.abs(b - Math.round(b)) < 0.2 ? `≈${Math.round(b)}%` : `${b}%`;
  };
  const familyModel = (name, c, s) => ({
    id: 'family-' + name.toLowerCase(), title: `Model ${name} · core ${c}% / satellite ${s}% · ${blendText(c, s)} blended`,
    sub: '₹1 Cr at 40 + ₹80,000 a month, 70 : 30, to 60', tab: 'tab-core',
    core: corePreset({ coreAlloc: 70, coreRet: c, satRet: s, horizon: 20, selfLump: 10000000, selfInclude: true, selfMonthly: 80000, selfAddStop: 20, selfStepUpStop: 20 }),
    note: `₹1 Cr at age 40 (₹70 L core, ₹30 L satellite) plus the ₹80,000 monthly surplus (₹56,000 core, ₹24,000 satellite) for 20 years, to age 60. Core ${c}%, satellite ${s}% (${blendText(c, s)} blended CAGR). Compare the corpus, the IRR and how much of it the satellite makes.`
  });

  const PRESET_GROUPS = [
    { title: 'Core engine', hint: 'Slide 11', items: [
      { id: 'tenx', title: '10X in 10 Yrs @26%', sub: '₹1 L lump sum, all in core, no SIP, 10 years', tab: 'tab-core',
        core: corePreset({ coreAlloc: 100, coreRet: 26, satRet: 40, horizon: 10, selfLump: 100000 }),
        note: '₹1 lakh compounding at 26% a year. By the Rule of 72 it doubles about every 2.8 years, so it is near 10× by year 10. Hover over year 5 to see what selling halfway would leave behind.' },
      { id: 'tenx-7030', title: '10X in 10 Yrs @26% 70:30 Split', sub: 'Core 20% + satellite 40% = 26% blended', tab: 'tab-core',
        core: corePreset({ coreAlloc: 70, coreRet: 20, satRet: 40, horizon: 10, selfLump: 100000 }),
        note: 'Same ₹1 lakh and the same 26% blended CAGR, split 70 : 30 as core 20% and satellite 40%. The satellite is never rebalanced, so it becomes a bigger share and the end value beats plain 26%. Compare the corpus and the Portfolio IRR with the previous preset.' },
      { id: 'sip18', title: '₹10,000 monthly SIP @18%', sub: 'All in core, no step-up, SIP for 10 years', tab: 'tab-core',
        core: corePreset({ coreAlloc: 100, coreRet: 18, satRet: 25, horizon: 10, selfLump: 0, selfInclude: true, selfMonthly: 10000, selfAddStop: 10 }),
        note: '₹10,000 every month for 10 years at 18%, with no step-up and no lump sum. Compare what went in with what compounding added.' },
      { id: 'sip18-spouse', title: '₹10,000 monthly SIP @18% + spouse investing', sub: 'Spouse adds ₹10,000 a month too', tab: 'tab-core',
        core: corePreset({ coreAlloc: 100, coreRet: 18, satRet: 25, horizon: 10, selfLump: 0, selfInclude: true, selfMonthly: 10000, selfAddStop: 10,
          spouseInclude: true, spouseLump: 0, spouseMonthly: 10000, spouseAddStop: 10, spouseStepUpStop: 10 }),
        note: 'Both partners invest ₹10,000 a month for 10 years at 18%. The strip under the chart compares self only with both of you, and how much sooner the same corpus is reached.' }
    ] },
    { title: 'Youngster lab', hint: 'Plain 18% vs 70 : 30', items: [
      { id: 'y20', title: 'Age 20 · ₹10,000 a month · @ 18%', sub: 'All in core, no step-up, SIP to 70', tab: 'tab-youngsters',
        young: youngPreset({ age: 20, monthly: 10000 }),
        note: '₹10,000 every month from age 20 to 70 at a plain 18%, no step-up. The cards show wealth after 30, 40 and 50 years.' },
      { id: 'y20-7030', title: 'Age 20 · ₹10,000 a month · @ 18% split 70 : 30', sub: 'Core 15% + satellite 25% = 18% blended, SIP to 70', tab: 'tab-youngsters',
        young: youngPreset({ age: 20, monthly: 10000, alloc: 70, core: 15, sat: 25 }),
        note: 'The same SIP and the same 18% blended CAGR, split 70 : 30. Without rebalancing the satellite takes over, so each card is well above the plain 18% figures.' },
      { id: 'y20-10', title: 'Age 20 · ₹10,000 a month · @18% · SIP 10 yrs', sub: 'SIP for 10 years only, no step-up, then left alone', tab: 'tab-youngsters',
        young: youngPreset({ age: 20, monthly: 10000, add: 10 }),
        note: '₹10,000 a month for just 10 years, from 20 to 30, then never touched, at a plain 18%. Compare with investing all the way to 70.' },
      { id: 'y20-step', title: 'Age 20 · ₹10,000 a month · @18% 10% step-up, SIP 10 yrs', sub: 'SIP rises 10% a year for 10 years, then stops', tab: 'tab-youngsters',
        young: youngPreset({ age: 20, monthly: 10000, enable: true, mode: 'pct', pct: 10, stop: 10, add: 10 }),
        note: '₹10,000 a month rising 10% a year, invested for 10 years, then left alone to compound at a plain 18%.' },
      { id: 'y20-step-7030', title: 'Age 20 · ₹10,000 a month · @18% 10% step-up, SIP 10 yrs, split 70 : 30', sub: 'Core 15% + satellite 25%', tab: 'tab-youngsters',
        young: youngPreset({ age: 20, monthly: 10000, enable: true, mode: 'pct', pct: 10, stop: 10, add: 10, alloc: 70, core: 15, sat: 25 }),
        note: 'Ten years of stepped-up SIPs, then hands off, now split 70 : 30 at the same 18% blended CAGR.' },
      { id: 'y40', title: 'Age 40 · ₹25 L lump sum · plain 18%', sub: 'No SIP, after 30, 40 and 50 years', tab: 'tab-youngsters',
        young: youngPreset({ age: 40, lump: 2500000, monthly: 0, hz: [30, 40, 50] }),
        note: '₹25 lakh invested once at 40 and never touched, at a plain 18%. The cards show it after 30, 40 and 50 years (ages 70, 80, 90): money that outlives the person who built it.' },
      { id: 'y40-7030', title: 'Age 40 · ₹25 L lump sum · plain 18%, split 70 : 30', sub: 'Core 15% + satellite 25%', tab: 'tab-youngsters',
        young: youngPreset({ age: 40, lump: 2500000, monthly: 0, hz: [30, 40, 50], alloc: 70, core: 15, sat: 25 }),
        note: 'The same ₹25 lakh split 70 : 30 at the same 18% blended CAGR. Over 30 to 50 years the unrebalanced satellite makes the gap enormous.' }
    ] },
    { title: 'The family math', hint: 'Slide 12 · Models A to D', items: [
      familyModel('A', 15, 20), familyModel('B', 18, 25), familyModel('C', 18, 30), familyModel('D', 20, 40)
    ] },
    { title: 'More presets', hint: 'Slides 11 and 13 · inflation', items: [
      { id: 'ten-lakh', title: '₹10 L at 18% for 30 years', sub: 'Compound vs linear · slide 11', tab: 'tab-core',
        core: corePreset({ coreAlloc: 100, coreRet: 18, satRet: 25, horizon: 30, selfLump: 1000000 }),
        note: 'About 143× by year 30, against 6.4× at simple interest. The 25 / 50 / 75% markers show most of the money arriving in the last decade. Hover over years 10 and 20.' },
      { id: 'rate-grid', title: 'What ₹10 L becomes at 12% to 26%', sub: 'CAGR table · slide 11', tab: 'tab-plan',
        core: corePreset({ coreAlloc: 100, coreRet: 18, satRet: 25, horizon: 30, selfLump: 1000000 }),
        goal: { target: 100000000, years: 30, assumedReturn: null },
        note: 'The CAGR table shows what ₹10 lakh becomes by year 30 at each rate, and when it reaches ₹10 Cr. Change Horizon on the Core engine to 10 or 20 for the other columns of the slide.' },
      { id: 'start-21', title: '₹10,000 a month from 21 · a 10-year delay', sub: 'Plain 18%, at 40, 50, 60 · slide 13', tab: 'tab-youngsters',
        young: youngPreset({ age: 21, monthly: 10000, hz: [19, 29, 39], wait: 10 }),
        note: '₹10,000 a month from 21 at 18%, checked at 40, 50 and 60. The first waiting card starts at 31 instead: compare the two at 60 to see what ten years of delay costs.' },
      { id: 'leave-20', title: 'Stop at 50, leave it 20 more years', sub: '₹10,000 a month from 21 to 50 · slide 13', tab: 'tab-youngsters',
        young: youngPreset({ age: 21, monthly: 10000, add: 29, hz: [29, 39, 49] }),
        note: 'SIPs stop at 50. If the children leave the money alone for 20 more years, compare the wealth at 50 with the wealth at 70.' },
      { id: 'ff-40', title: '₹25 L at 40 · when is ₹3 Cr reached?', sub: 'Freedom number · slide 13', tab: 'tab-plan',
        core: corePreset({ coreAlloc: 100, coreRet: 18, satRet: 25, horizon: 20, selfLump: 2500000, selfAddStop: 20, selfStepUpStop: 20 }),
        goal: { target: 30000000, years: 20, assumedReturn: null },
        note: 'Freedom number ₹3 Cr (25 × ₹12 lakh a year). “When your current plan gets there” gives the year at 18%; add 40 for the age. The CAGR table shows 12%, 18% and 26% side by side, with the value at 60.' },
      { id: 'ff-40-real', title: '₹25 L at 40 · ₹3 Cr in today’s money', sub: 'Inflation-adjusted freedom number', tab: 'tab-plan',
        core: corePreset({ coreAlloc: 100, coreRet: 18, satRet: 25, horizon: 20, selfLump: 2500000, selfAddStop: 20, selfStepUpStop: 20 }),
        goal: { target: 30000000, years: 20, assumedReturn: null, inflationAdjusted: true },
        note: 'The same ₹3 Cr, but in today’s money: it grows with the inflation rate in the tab bar, so freedom comes later. The note under the target shows what ₹3 Cr becomes by 60; the SIP card shows the monthly top-up that still gets there on time.' },
      { id: 'ten-lakh-real', title: '₹10 L at 18% for 30 years · in today’s ₹', sub: 'Same as above, after inflation', tab: 'tab-core', real: true,
        core: corePreset({ coreAlloc: 100, coreRet: 18, satRet: 25, horizon: 30, selfLump: 1000000 }),
        note: 'The same ₹10 lakh at 18%, shown in today’s rupees: what the corpus would buy now after inflation, and the real return. Press INF_ADJ OFF to switch back.' }
    ] }
  ];
  const PRESET_LIST = [];
  PRESET_GROUPS.forEach(g => g.items.forEach(it => { it.group = g.title; PRESET_LIST.push(it); }));

  const presetBtn = document.getElementById('btn-presets');
  const presetMenu = document.getElementById('preset-menu');
  const presetNote = document.getElementById('preset-note');

  function renderPresetMenu() {
    if (!presetMenu) return;
    let n = 0;
    presetMenu.innerHTML = PRESET_GROUPS.map(g => `
      <div class="preset-group" role="group" aria-label="${escapeHtml(g.title)}">
        <div class="preset-group-head"><span>${escapeHtml(g.title)}</span><small>${escapeHtml(g.hint)}</small></div>
        ${g.items.map(it => { n++; return `
          <button type="button" class="preset-item${state.presetId === it.id ? ' is-active' : ''}" role="menuitem" data-preset="${it.id}">
            <span class="preset-num">${n}</span>
            <span class="preset-text"><strong>${escapeHtml(it.title)}</strong><small>${escapeHtml(it.sub)}</small></span>
          </button>`; }).join('')}
      </div>`).join('');
  }

  function openPresetMenu(open) {
    if (!presetMenu || !presetBtn) return;
    if (open) renderPresetMenu();
    presetMenu.hidden = !open;
    presetBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      const first = presetMenu.querySelector('.preset-item.is-active') || presetMenu.querySelector('.preset-item');
      if (first) first.focus({ preventScroll: true });
    }
  }

  function switchToTab(id) {
    const btn = document.querySelector(`.tab-btn[data-tab="${id}"]`);
    if (btn && !btn.classList.contains('active')) btn.click();
  }

  function showPresetNote(p) {
    if (!presetNote) return;
    const i = PRESET_LIST.indexOf(p);
    const set = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
    set('preset-note-tag', `Preset ${i + 1} of ${PRESET_LIST.length} · ${p.group}`);
    set('preset-note-title', p.title);
    set('preset-note-desc', p.note);
    presetNote.hidden = false;
    const prev = document.getElementById('btn-preset-prev'), next = document.getElementById('btn-preset-next');
    if (prev) prev.disabled = i <= 0;
    if (next) next.disabled = i >= PRESET_LIST.length - 1;
  }

  function clearPreset() {
    if (!state.presetId) return;
    state.presetId = null;
    if (presetNote) presetNote.hidden = true;
    updateAll();
  }

  function applyPreset(id, withUndo = true) {
    const p = PRESET_LIST.find(x => x.id === id);
    if (!p) return;
    const before = { core: readInputsForProfile(), plan: readPlanTabInputs(), young: readYoungsterInputs(), tab: state.activeTab || 'tab-core', preset: state.presetId, real: state.realView };
    state.presetId = p.id;
    state.realView = !!p.real;
    try { localStorage.setItem('compounding_calculator_real_view', state.realView ? '1' : '0'); } catch (e) { /* ignore */ }
    if (p.core) applyParamsToInputs(p.core);
    if (p.goal) { applyGoalToInputs(Object.assign({ inflationAdjusted: false }, p.goal)); state.goalReturnTouched = false; }
    if (p.young) applyYoungsterInputs(p.young);
    switchToTab(p.tab);
    refreshAllPages();
    showPresetNote(p);
    document.querySelectorAll('.toast-message.is-preset').forEach(t => t.remove());
    if (withUndo) {
      const t = showToast(`Preset: ${escapeHtml(p.title)}`, '▶', () => {
        state.realView = before.real;
        applyParamsToInputs(before.core); applyPlanTabInputs(before.plan); applyYoungsterInputs(before.young);
        const back = before.preset ? PRESET_LIST.find(x => x.id === before.preset) : null;
        state.presetId = back ? back.id : null;
        if (back) showPresetNote(back); else if (presetNote) presetNote.hidden = true;
        switchToTab(before.tab); updateAll();
      });
      if (t) t.classList.add('is-preset');
    }
  }

  if (presetBtn) presetBtn.addEventListener('click', (e) => { e.stopPropagation(); openPresetMenu(presetMenu.hidden); });
  if (presetMenu) {
    presetMenu.addEventListener('click', (e) => {
      const item = e.target.closest('[data-preset]');
      if (!item) return;
      openPresetMenu(false);
      applyPreset(item.getAttribute('data-preset'));
    });
    presetMenu.addEventListener('keydown', (e) => {
      const items = Array.from(presetMenu.querySelectorAll('.preset-item'));
      const i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); (items[i + 1] || items[0]).focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); openPresetMenu(false); presetBtn.focus(); }
    });
  }
  document.addEventListener('click', (e) => {
    if (presetMenu && !presetMenu.hidden && !e.target.closest('.preset-wrap')) openPresetMenu(false);
  });
  const stepPreset = (d) => {
    const i = PRESET_LIST.findIndex(x => x.id === state.presetId);
    const next = PRESET_LIST[i + d];
    if (next) applyPreset(next.id, false);
  };
  bindClick('btn-preset-prev', () => stepPreset(-1));
  bindClick('btn-preset-next', () => stepPreset(1));
  bindClick('btn-preset-close', clearPreset);

  // ---------- Inflation: rate, today's-rupee view ----------
  function renderInflationState() {
    document.body.classList.toggle('is-real', !!state.realView);
    const b = document.getElementById('btn-real-view');
    if (b) { b.setAttribute('aria-pressed', state.realView ? 'true' : 'false'); b.textContent = state.realView ? 'INF_ADJ ON' : 'INF_ADJ OFF'; }
    const sl = document.getElementById('inp-inflation-slider');
    if (sl && document.activeElement !== sl) sl.value = Math.min(12, state.inflation);
    document.querySelectorAll('[data-infl]').forEach(c => c.classList.toggle('active', parseFloat(c.getAttribute('data-infl')) === Number(state.inflation)));
    const n = document.getElementById('real-note');
    if (n) n.hidden = !state.realView;
    const r = document.getElementById('real-note-rate');
    if (r) r.textContent = fmtPct(inflRate());
    if (els.inpInflation && document.activeElement !== els.inpInflation) els.inpInflation.value = state.inflation;
    const gl = document.querySelector('.goal-infl-label');
    if (gl) gl.textContent = `Target in today’s money (grows at ${fmtPct(inflRate())} inflation)`;
  }
  function refreshAllPages() { updateAll(); updateYoungsterLab(); }
  function setRealView(on) {
    state.realView = !!on;
    try { localStorage.setItem('compounding_calculator_real_view', on ? '1' : '0'); } catch (e) { /* ignore */ }
    refreshAllPages();
  }
  function setInflation(v) {
    if (isNaN(v)) return;
    state.inflation = Math.round(Math.max(0, Math.min(15, v)) * 10) / 10;
    try { localStorage.setItem('compounding_calculator_inflation', String(state.inflation)); } catch (e) { /* ignore */ }
    refreshAllPages();
  }
  if (els.inpInflation) {
    els.inpInflation.addEventListener('input', () => setInflation(parseFloat(els.inpInflation.value)));
    els.inpInflation.addEventListener('change', () => { els.inpInflation.value = state.inflation; });
  }
  // Other ways to set the rate: −/+ in the tab bar, the slider and quick chips in the INF_ADJ strip and on the goal
  document.querySelectorAll('[data-infl-step]').forEach(b => b.addEventListener('click', () =>
    setInflation(Number(state.inflation) + parseFloat(b.getAttribute('data-infl-step')))));
  document.querySelectorAll('[data-infl]').forEach(b => b.addEventListener('click', () => setInflation(parseFloat(b.getAttribute('data-infl')))));
  const inflSlider = document.getElementById('inp-inflation-slider');
  if (inflSlider) inflSlider.addEventListener('input', () => setInflation(parseFloat(inflSlider.value)));
  bindClick('btn-real-view', () => setRealView(!state.realView));
  bindClick('btn-real-off', () => setRealView(false));
  if (els.goalInflation) els.goalInflation.addEventListener('change', updateAll);

  // ---------- Help: manuals shown inside the app ----------
  const HELP_SECTION = { 'tab-core': 'core', 'tab-plan': 'goal', 'tab-actuals': 'review', 'tab-youngsters': 'youngster' };
  let helpManual = 'user-manual';
  function manualUrl(name, anchor) {
    const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    return `manual/${name}.html?v=${APP_INFO.version}&theme=${theme}${anchor ? '#' + anchor : ''}`;
  }
  function showManual(name, anchor) {
    helpManual = name;
    document.querySelectorAll('.manual-switch-btn').forEach(b => {
      const on = b.getAttribute('data-manual') === name;
      b.classList.toggle('active', on); b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    const url = manualUrl(name, anchor);
    const frame = document.getElementById('manual-frame');
    if (frame) frame.src = url;
    const lnk = document.getElementById('lnk-help-newwin');
    if (lnk) lnk.href = url;
    const pdf = document.getElementById('lnk-help-pdf');
    if (pdf) pdf.href = (name === 'design-manual' ? 'manual/Compounding-Calculator-Design-Manual.pdf' : 'manual/Compounding-Calculator-User-Manual.pdf') + '?v=' + APP_INFO.version;
    const here = document.getElementById('btn-help-this-page');
    if (here) here.hidden = name !== 'user-manual';
  }
  bindClick('btn-help', () => {
    showManual('user-manual', HELP_SECTION[state.activeTab || 'tab-core']);
    openModal(document.getElementById('modal-help'));
  });
  bindClick('btn-help-this-page', () => showManual('user-manual', HELP_SECTION[state.activeTab || 'tab-core']));
  document.querySelectorAll('.manual-switch-btn').forEach(b =>
    b.addEventListener('click', () => showManual(b.getAttribute('data-manual'), '')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F1') { e.preventDefault(); const b = document.getElementById('btn-help'); if (b) b.click(); }
  });


  // Theme Toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-icon');
  const themeText = document.getElementById('theme-text');
  try {
    const savedTheme = localStorage.getItem('compounding_calculator_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', savedTheme);
      if (themeText) themeText.textContent = savedTheme === 'light' ? 'Dark' : 'Light';
    }
  } catch (err) { /* ignore */ }
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      if (themeText) themeText.textContent = next === 'light' ? 'Dark' : 'Light';
      try { localStorage.setItem('compounding_calculator_theme', next); } catch (err) { /* ignore */ }
      updateAll();
    });
  }

  // Interactive Hover Inspection on Growth Chart Canvas
  if (state.growthChartCanvas) {
    state.growthChartCanvas.addEventListener('mousemove', function (e) {
      const rect = state.growthChartCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const g = state.chartGeom || { padL: 64, plotW: rect.width - 82, H: parseInt(els.horizon.value, 10) || 30 };
      const padL = g.padL;
      const plotW = g.plotW;
      const effectiveHorizon = g.H;

      if (mouseX >= padL && mouseX <= padL + plotW) {
        const norm = (mouseX - padL) / plotW;
        const yr = Math.round(norm * effectiveHorizon);
        if (state.hoverYear !== yr) {
          state.hoverYear = yr;
          if (state.lastResult) {
            drawGrowthChart(state.growthChartCanvas, state.lastResult.yearlyRows, state.lastResult.horizon, state.isLogScale);
          }
        }
      } else {
        if (state.hoverYear !== null) {
          state.hoverYear = null;
          if (state.lastResult) {
            drawGrowthChart(state.growthChartCanvas, state.lastResult.yearlyRows, state.lastResult.horizon, state.isLogScale);
          }
        }
      }
    });

    state.growthChartCanvas.addEventListener('mouseleave', function () {
      if (state.hoverYear !== null) {
        state.hoverYear = null;
        if (state.lastResult) {
          drawGrowthChart(state.growthChartCanvas, state.lastResult.yearlyRows, state.lastResult.horizon, state.isLogScale);
        }
      }
    });
  }

  // CSV Export
  function exportScheduleToCSV() {
    const params = getCurrentParams();
    const result = CE.calculateSchedule(params, planActuals());
    let csv = `# Compounding Calculator v${APP_INFO.version} (${fmtAppDate(APP_INFO.date)}) - developed by ${APP_INFO.developer}\n` + 'Year,Self Added,Spouse Added,Core Opening,Core Addition,Core Returns,Core Closing,Sat Opening,Sat Addition,Sat Returns,Sat Closing,Total Corpus,Total Invested,Multiple,Yrs to Next 2x\n';

    result.yearlyRows.forEach(r => {
      csv += `${r.year},${r.selfContrib.toFixed(2)},${r.spouseContrib.toFixed(2)},${r.coreOpen.toFixed(2)},${r.coreAdd.toFixed(2)},${r.coreRet.toFixed(2)},${r.coreClose.toFixed(2)},${r.satOpen.toFixed(2)},${r.satAdd.toFixed(2)},${r.satRet.toFixed(2)},${r.satClose.toFixed(2)},${r.totalCorpus.toFixed(2)},${r.totalInvested.toFixed(2)},${r.multiple.toFixed(2)},${r.yrsTo2x}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Compounding_Schedule_${params.horizon}Yrs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const exportBtn1 = document.getElementById('export-csv-btn');
  const exportBtn2 = document.getElementById('btn-export-schedule-csv');
  if (exportBtn1) exportBtn1.addEventListener('click', exportScheduleToCSV);
  if (exportBtn2) exportBtn2.addEventListener('click', exportScheduleToCSV);

  // Copy Schedule Table
  const copyBtn = document.getElementById('btn-copy-schedule');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const table = document.getElementById('full-schedule-table');
      if (!table) return;
      let text = '';
      for (const row of table.rows) {
        const cells = Array.from(row.cells).map(c => c.innerText.trim());
        text += cells.join('\t') + '\n';
      }
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = 'Copied';
        setTimeout(() => { copyBtn.textContent = 'Copy table'; }, 2000);
      });
    });
  }

  // --- Toast Notification Helper ---
  function showToast(message, icon = '✓', undoFn = null) {
    if (!els.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `<span style="color: ${icon === '!' ? 'var(--rose)' : 'var(--growth)'}; font-weight: 700;">${icon}</span> <span>${message}</span>`;
    if (typeof undoFn === 'function') {
      const b = document.createElement('button');
      b.className = 'toast-undo'; b.textContent = 'Undo';
      b.addEventListener('click', () => { undoFn(); if (toast.parentNode) toast.parentNode.removeChild(toast); });
      toast.appendChild(b);
    }
    els.toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, undoFn ? 7000 : 3500);
    return toast;
  }

  // --- Modal Helpers ---
  function openModal(modalEl) {
    if (modalEl) modalEl.classList.add('active');
  }

  function closeModal(modalEl) {
    if (modalEl) modalEl.classList.remove('active');
  }

  document.querySelectorAll('.modal-close-btn, [data-close]').forEach(btn => {
    btn.addEventListener('click', function () {
      const modalId = this.getAttribute('data-close');
      if (modalId) {
        closeModal(document.getElementById(modalId));
      } else {
        const overlay = this.closest('.modal-overlay');
        if (overlay) closeModal(overlay);
      }
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function (e) {
      if (e.target === this) closeModal(this);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(closeModal);
    }
  });

  // =========================================================================
  // USER DATABASE
  // Users are keyed by a unique user ID. Each record holds the plan inputs, the goal,
  // the plan start year and the year-end records (actuals). Records live in browser
  // storage and, optionally, in a database file that is rewritten after every change.
  // =========================================================================
  const STORAGE_KEY = 'compounding_calculator_user_profiles_v6';
  const ACTIVE_PROFILE_KEY = 'compounding_calculator_active_profile_v5';
  const TOMBSTONE_KEY = 'compounding_calculator_deleted_users_v1';
  const nowIso = () => new Date().toISOString();
  const thisYear = () => new Date().getFullYear();
  const fmtDateTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /** Standard plan: the Core engine's starting values and what "Reset page" restores. */
  function defaultPlanParams() {
    return {
      selfLump: 100000, selfMonthly: 10000, selfInclude: true,
      selfStepUpOn: true, selfStepUp: 10, selfStepUpMode: 'pct', selfStepUpAmt: 1000,
      selfStepUpStop: 10, selfAddStop: 10, selfAddStopMonths: 0,
      coreAlloc: 70, coreRet: 15.0, satRet: 25.0, horizon: 30,
      spouseInclude: false, spouseLump: 0, spouseMonthly: 0,
      spouseStepUpOn: true, spouseStepUp: 10, spouseStepUpMode: 'pct', spouseStepUpAmt: 1000,
      spouseStepUpStop: 10, spouseAddStop: 10, spouseAddStopMonths: 0
    };
  }

  /** User IDs: lowercase letters, digits, dot, dash, underscore; 2–32 characters. */
  function slugifyId(s) {
    return String(s || '').toLowerCase().trim().replace(/\s+/g, '.').replace(/[^a-z0-9._-]/g, '').replace(/^[._-]+|[._-]+$/g, '').slice(0, 32);
  }
  function validUserId(id) { return /^[a-z0-9][a-z0-9._-]{1,31}$/.test(id); }

  function makeUser({ userId, name, params, goal, startYear, actualsHistory }) {
    const t = nowIso();
    return {
      id: userId, userId: userId, name: name,
      createdAt: t, updatedAt: t,
      startYear: startYear || thisYear(),
      params: params || defaultPlanParams(),
      goal: goal || { target: 100000000, years: 20, assumedReturn: null, inflationAdjusted: false },
      actualsHistory: actualsHistory || {}
    };
  }

  function getDefaultProfiles() {
    return { sekhar: makeUser({ userId: 'sekhar', name: 'Sekhar' }) };
  }

  /** Bring any older profile record up to the current shape, keyed by user ID. */
  function normaliseUsers(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    const src = raw.users && typeof raw.users === 'object' ? raw.users : raw;
    for (const [key, prof] of Object.entries(src)) {
      if (!prof || typeof prof !== 'object' || !prof.name) continue;
      if (['profile_default', 'profile_sanjay', 'profile_couple'].includes(key)) continue;
      let uid = prof.userId || slugifyId(key.replace(/^profile_/, '')) || slugifyId(prof.name);
      if (!validUserId(uid)) uid = slugifyId(prof.name) || ('user' + Object.keys(out).length + 1);
      let unique = uid, n = 2;
      while (out[unique]) unique = `${uid}-${n++}`;
      const createdAt = prof.createdAt || (prof.created && !isNaN(new Date(prof.created)) ? new Date(prof.created).toISOString() : nowIso());
      out[unique] = Object.assign({}, prof, {
        id: unique, userId: unique,
        legacyId: prof.legacyId || (key !== unique ? key : undefined),
        createdAt: createdAt,
        updatedAt: prof.updatedAt || createdAt,
        startYear: prof.startYear || new Date(createdAt).getFullYear(),
        params: Object.assign(defaultPlanParams(), prof.params || {}),
        goal: Object.assign({ target: 100000000, years: 20, assumedReturn: null, inflationAdjusted: false }, prof.goal || {}),
        actualsHistory: prof.actualsHistory || {}
      });
    }
    return out;
  }

  let usersCache = null;

  function getStoredProfiles() {
    if (usersCache) return JSON.parse(JSON.stringify(usersCache));
    let users = {};
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) users = normaliseUsers(JSON.parse(data));
    } catch (err) {
      console.warn('Could not read users from browser storage:', err);
    }
    if (Object.keys(users).length === 0) users = getDefaultProfiles();
    usersCache = users;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(users)); } catch (err) { /* ignore */ }
    return JSON.parse(JSON.stringify(users));
  }

  function getTombstones() {
    try { return JSON.parse(localStorage.getItem(TOMBSTONE_KEY) || '{}') || {}; } catch (err) { return {}; }
  }
  function setTombstones(t) {
    try { localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(t)); } catch (err) { /* ignore */ }
  }

  function saveStoredProfiles(profiles) {
    usersCache = JSON.parse(JSON.stringify(profiles));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch (err) {
      showToast('Could not save to browser storage: ' + escapeHtml(err.message), '!');
    }
    fileDb.scheduleWrite();
    refreshDirtyState();
  }

  /** Database snapshot written to the file. */
  function dbSnapshot() {
    return {
      app: 'Compounding Calculator',
      format: 2,
      appVersion: APP_INFO.version,
      savedAt: nowIso(),
      users: getStoredProfiles(),
      deleted: getTombstones()
    };
  }

  /** Merge another database into this browser's copy: newer record per user wins; deletions respected. */
  function mergeDatabase(other) {
    const mine = getStoredProfiles();
    const theirs = normaliseUsers(other && other.users ? other.users : other);
    const tomb = Object.assign({}, getTombstones());
    if (other && other.deleted) {
      for (const [id, t] of Object.entries(other.deleted)) {
        if (!tomb[id] || tomb[id] < t) tomb[id] = t;
      }
    }
    let added = 0, updated = 0;
    for (const [id, u] of Object.entries(theirs)) {
      if (tomb[id] && tomb[id] >= (u.updatedAt || '')) continue;
      if (!mine[id]) { mine[id] = u; added++; }
      else if ((u.updatedAt || '') > (mine[id].updatedAt || '')) { mine[id] = u; updated++; }
    }
    for (const [id, t] of Object.entries(tomb)) {
      if (mine[id] && t >= (mine[id].updatedAt || '')) delete mine[id];
    }
    if (Object.keys(mine).length === 0) Object.assign(mine, getDefaultProfiles());
    setTombstones(tomb);
    usersCache = mine;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mine)); } catch (err) { /* ignore */ }
    return { added, updated };
  }

  // ---------- Database file (File System Access API; handle kept in IndexedDB) ----------
  const idb = {
    open() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('compounding-calculator', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('kv');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    },
    async get(key) {
      const db = await idb.open();
      return new Promise((resolve, reject) => {
        const r = db.transaction('kv').objectStore('kv').get(key);
        r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
      });
    },
    async set(key, val) {
      const db = await idb.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(val, key);
        tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
      });
    },
    async del(key) {
      const db = await idb.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(key);
        tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
      });
    }
  };

  const fileDb = {
    supported: typeof window.showSaveFilePicker === 'function' && typeof indexedDB !== 'undefined',
    handle: null,
    status: 'none',       // 'none' | 'ok' | 'needs-permission' | 'error'
    lastSaved: null,
    error: '',
    timer: null,
    writing: false,

    async init() {
      if (!this.supported) { renderDbStatus(); return; }
      try {
        this.handle = await idb.get('dbHandle');
      } catch (err) { this.handle = null; }
      if (!this.handle) { renderDbStatus(); return; }
      try {
        const perm = await this.handle.queryPermission({ mode: 'readwrite' });
        if (perm === 'granted') await this.syncFromFile(false);
        else this.status = 'needs-permission';
      } catch (err) {
        this.status = 'error'; this.error = err.message;
      }
      renderDbStatus();
    },

    async syncFromFile(announce) {
      const file = await this.handle.getFile();
      const text = await file.text();
      let res = { added: 0, updated: 0 };
      if (text.trim()) {
        const parsed = JSON.parse(text);
        res = mergeDatabase(parsed);
      }
      this.status = 'ok';
      await this.writeNow();
      populateProfileSelect();
      if (getStoredProfiles()[activeProfileId]) loadProfile(activeProfileId, false);
      else loadProfile(Object.keys(getStoredProfiles())[0], false);
      if (announce) showToast(`Database opened: ${res.added} user(s) added, ${res.updated} updated`, '✓');
    },

    scheduleWrite() {
      if (this.status !== 'ok') { renderDbStatus(); return; }
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.writeNow(), 300);
    },

    async writeNow() {
      if (!this.handle || this.status !== 'ok' || this.writing) return;
      this.writing = true;
      try {
        const w = await this.handle.createWritable();
        await w.write(JSON.stringify(dbSnapshot(), null, 2));
        await w.close();
        this.lastSaved = new Date();
        this.error = '';
      } catch (err) {
        this.status = 'error'; this.error = err.message;
        showToast('Could not save the database file: ' + escapeHtml(err.message), '!');
      } finally {
        this.writing = false;
        renderDbStatus();
      }
    },

    async create() {
      const handle = await window.showSaveFilePicker({
        id: 'compounding-db',
        startIn: 'documents',
        suggestedName: 'compounding-users.json',
        types: [{ description: 'Compounding Calculator database', accept: { 'application/json': ['.json'] } }]
      });
      this.handle = handle;
      await idb.set('dbHandle', handle);
      this.status = 'ok';
      await this.writeNow();
      showToast(`Database file created: ${escapeHtml(handle.name)}`, '✓');
    },

    async open() {
      const [handle] = await window.showOpenFilePicker({
        id: 'compounding-db',
        types: [{ description: 'Compounding Calculator database', accept: { 'application/json': ['.json'] } }]
      });
      const perm = await handle.requestPermission({ mode: 'readwrite' });
      if (perm !== 'granted') { showToast('Permission to edit the file was not given', '!'); return; }
      this.handle = handle;
      await idb.set('dbHandle', handle);
      await this.syncFromFile(true);
    },

    async reconnect() {
      if (!this.handle) return;
      const perm = await this.handle.requestPermission({ mode: 'readwrite' });
      if (perm === 'granted') await this.syncFromFile(true);
      else showToast('Permission to edit the file was not given', '!');
      renderDbStatus();
    },

    async unlink() {
      this.handle = null; this.status = 'none'; this.lastSaved = null;
      try { await idb.del('dbHandle'); } catch (err) { /* ignore */ }
      renderDbStatus();
      showToast('Database file unlinked. Users stay saved in this browser.', '✓');
    }
  };

  function renderDbStatus() {
    const pill = document.getElementById('db-status');
    const panel = document.getElementById('db-panel-status');
    const show = (id, on) => { const el = document.getElementById(id); if (el) el.hidden = !on; };
    let pillText = 'Saved in this browser', panelText = 'Not linked. Users are saved in this browser only.';
    let cls = '';
    if (!fileDb.supported) {
      panelText = 'This browser cannot link a database file. Use Export / Import to back up users.';
    } else if (fileDb.status === 'ok' && fileDb.handle) {
      cls = 'is-file';
      const when = fileDb.lastSaved ? fileDb.lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      pillText = `${fileDb.handle.name}${when ? ' · saved ' + when : ''}`;
      panelText = `Linked to ${fileDb.handle.name}. Every change is saved to it automatically${when ? ' (last at ' + when + ')' : ''}.`;
    } else if (fileDb.status === 'needs-permission' && fileDb.handle) {
      cls = 'is-warn';
      pillText = `Reconnect ${fileDb.handle.name}`;
      panelText = `${fileDb.handle.name} is linked, but this session needs your permission to use it. Changes are kept in the browser until you reconnect.`;
    } else if (fileDb.status === 'error') {
      cls = 'is-warn';
      pillText = 'Database file problem';
      panelText = `The database file could not be used: ${fileDb.error}. Changes are kept in the browser.`;
    }
    if (pill) {
      pill.textContent = pillText;
      pill.classList.remove('is-file', 'is-warn');
      if (cls) pill.classList.add(cls);
      pill.title = panelText;
    }
    if (panel) panel.textContent = panelText;
    const linked = !!fileDb.handle;
    show('btn-db-create', fileDb.supported);
    show('btn-db-open', fileDb.supported);
    show('btn-db-reconnect', linked && fileDb.status !== 'ok');
    show('btn-db-unlink', linked);
  }

  const dbAction = (fn) => async () => {
    try { await fn(); } catch (err) {
      if (err && err.name === 'AbortError') return; // picker cancelled
      showToast('Database file: ' + escapeHtml(err.message || String(err)), '!');
    }
    renderDbStatus();
  };
  bindClick('btn-db-create', dbAction(() => fileDb.create()));
  bindClick('btn-db-open', dbAction(() => fileDb.open()));
  bindClick('btn-db-reconnect', dbAction(() => fileDb.reconnect()));
  bindClick('btn-db-unlink', dbAction(() => fileDb.unlink()));
  bindClick('db-status', () => {
    if (fileDb.status === 'needs-permission') dbAction(() => fileDb.reconnect())();
    else { renderManageProfilesList(); openModal(els.modalManageProfiles); }
  });

  // ---------- Active user ----------
  let activeProfileId = (() => {
    let id = null;
    try { id = localStorage.getItem(ACTIVE_PROFILE_KEY); } catch (err) { /* ignore */ }
    const users = getStoredProfiles();
    if (id && users[id]) return id;
    const byLegacy = Object.values(users).find(u => u.legacyId === id);
    return byLegacy ? byLegacy.userId : Object.keys(users)[0];
  })();
  function setActiveId(id) {
    activeProfileId = id;
    try { localStorage.setItem(ACTIVE_PROFILE_KEY, id); } catch (err) { /* ignore */ }
  }
  function activeUser() { return getStoredProfiles()[activeProfileId] || null; }

  function populateProfileSelect() {
    const users = getStoredProfiles();
    if (!users[activeProfileId]) setActiveId(Object.keys(users)[0]);
    const sorted = Object.values(users).sort((a, b) => a.name.localeCompare(b.name));
    if (els.profileSelect) {
      els.profileSelect.innerHTML = sorted.map(u =>
        `<option value="${escapeHtml(u.userId)}" ${u.userId === activeProfileId ? 'selected' : ''}>${escapeHtml(u.name)} (${escapeHtml(u.userId)})</option>`).join('');
    }
    const dl = document.getElementById('user-datalist');
    if (dl) {
      dl.innerHTML = sorted.map(u => `<option value="${escapeHtml(u.userId)}">${escapeHtml(u.name)}</option>` +
        `<option value="${escapeHtml(u.name)}">${escapeHtml(u.userId)}</option>`).join('');
    }
    const cur = users[activeProfileId];
    if (cur && els.printUserName) els.printUserName.textContent = cur.name;
  }

  /** Put stored plan inputs (UI units) into the form. */
  function applyParamsToInputs(p) {
    if (!p) return;
    const set = (el, v) => { if (el && v !== undefined && v !== null) el.value = v; };
    set(els.selfLump, p.selfLump); set(els.selfMonthly, p.selfMonthly);
    if (p.selfInclude !== undefined) els.selfInclude.checked = !!p.selfInclude;
    set(els.selfStepUp, p.selfStepUp);
    if (els.selfStepUpEnable) els.selfStepUpEnable.checked = p.selfStepUpOn !== false;
    setStepupMode('self', p.selfStepUpMode === 'amt' ? 'amt' : 'pct', false);
    set(els.selfStepUpAmt, p.selfStepUpAmt !== undefined ? p.selfStepUpAmt : 2500);
    set(els.selfStepUpStop, p.selfStepUpStop); set(els.selfAddStop, p.selfAddStop);
    set(els.selfAddStopMonths, p.selfAddStopMonths || 0);
    set(els.coreAlloc, p.coreAlloc); set(els.coreRet, p.coreRet); set(els.satRet, p.satRet); set(els.horizon, p.horizon);
    if (p.spouseInclude !== undefined) els.spouseInclude.checked = !!p.spouseInclude;
    set(els.spouseLump, p.spouseLump); set(els.spouseMonthly, p.spouseMonthly); set(els.spouseStepUp, p.spouseStepUp);
    if (els.spouseStepUpEnable) els.spouseStepUpEnable.checked = p.spouseStepUpOn !== false;
    setStepupMode('spouse', p.spouseStepUpMode === 'amt' ? 'amt' : 'pct', false);
    set(els.spouseStepUpAmt, p.spouseStepUpAmt !== undefined ? p.spouseStepUpAmt : 2500);
    set(els.spouseStepUpStop, p.spouseStepUpStop); set(els.spouseAddStop, p.spouseAddStop);
    set(els.spouseAddStopMonths, p.spouseAddStopMonths || 0);
  }

  function applyGoalToInputs(goal) {
    if (!goal) return;
    if (goal.target !== undefined && els.goalTarget) els.goalTarget.value = goal.target;
    if (goal.years !== undefined && els.goalYears) els.goalYears.value = goal.years;
    state.goalReturnTouched = goal.assumedReturn !== undefined && goal.assumedReturn !== null;
    if (state.goalReturnTouched && els.goalReturn) els.goalReturn.value = goal.assumedReturn;
    if (els.goalInflation) els.goalInflation.checked = !!goal.inflationAdjusted;
  }

  function loadProfile(profileId, showToastNotice = false) {
    const users = getStoredProfiles();
    const u = users[profileId];
    if (!u) return;
    setActiveId(profileId);
    state.presetId = null;
    const pn = document.getElementById('preset-note'); if (pn) pn.hidden = true;
    applyParamsToInputs(u.params);
    state.actualsHistory = JSON.parse(JSON.stringify(u.actualsHistory || {}));
    state.reviewPending = {};
    applyGoalToInputs(u.goal);
    if (els.printUserName) els.printUserName.textContent = u.name;
    populateProfileSelect();
    updateAll();
    if (showToastNotice) showToast(`Opened ${escapeHtml(u.name)} (${escapeHtml(u.userId)})`, '✓');
  }

  /** Inputs as stored in a user record. A value of 0 is kept as 0 (no silent fallback). */
  function readInputsForProfile() {
    return {
      selfLump: numOr(els.selfLump, 0),
      selfMonthly: numOr(els.selfMonthly, 0),
      selfInclude: els.selfInclude.checked,
      selfStepUpOn: !els.selfStepUpEnable || els.selfStepUpEnable.checked,
      selfStepUp: numOr(els.selfStepUp, 0),
      selfStepUpMode: els.selfStepUpMode ? els.selfStepUpMode.value : 'pct',
      selfStepUpAmt: numOr(els.selfStepUpAmt, 0),
      selfStepUpStop: intOr(els.selfStepUpStop, 7),
      selfAddStop: intOr(els.selfAddStop, 7),
      selfAddStopMonths: intOr(els.selfAddStopMonths, 0),
      coreAlloc: numOr(els.coreAlloc, 70),
      coreRet: numOr(els.coreRet, 20),
      satRet: numOr(els.satRet, 30),
      horizon: intOr(els.horizon, 30),
      spouseInclude: els.spouseInclude.checked,
      spouseLump: numOr(els.spouseLump, 0),
      spouseMonthly: numOr(els.spouseMonthly, 0),
      spouseStepUpOn: !els.spouseStepUpEnable || els.spouseStepUpEnable.checked,
      spouseStepUp: numOr(els.spouseStepUp, 10),
      spouseStepUpMode: els.spouseStepUpMode ? els.spouseStepUpMode.value : 'pct',
      spouseStepUpAmt: numOr(els.spouseStepUpAmt, 0),
      spouseStepUpStop: intOr(els.spouseStepUpStop, 30),
      spouseAddStop: intOr(els.spouseAddStop, 30),
      spouseAddStopMonths: intOr(els.spouseAddStopMonths, 0)
    };
  }

  function readGoalInputs() {
    return {
      target: numOr(els.goalTarget, 100000000),
      years: Math.max(1, intOr(els.goalYears, 20)),
      assumedReturn: state.goalReturnTouched ? numOr(els.goalReturn, null) : null,
      inflationAdjusted: !!(els.goalInflation && els.goalInflation.checked)
    };
  }

  /** Header indicator: are the plan/goal inputs different from what is saved? */
  function refreshDirtyState() {
    const u = (usersCache || {})[activeProfileId];
    if (!u || !els.selfLump) return;
    const sameParams = JSON.stringify(Object.assign(defaultPlanParams(), u.params)) === JSON.stringify(Object.assign(defaultPlanParams(), readInputsForProfile()));
    const g = readGoalInputs();
    const sameGoal = Number(u.goal.target) === Number(g.target) && Number(u.goal.years) === Number(g.years) &&
      (u.goal.assumedReturn ?? null) === (g.assumedReturn ?? null) && !!u.goal.inflationAdjusted === !!g.inflationAdjusted;
    const dirty = !(sameParams && sameGoal);
    if (els.btnSaveProfile) els.btnSaveProfile.classList.toggle('is-dirty', dirty);
    const pill = document.getElementById('db-status');
    if (pill) pill.classList.toggle('is-dirty', dirty);
    state.isDirty = dirty;
  }

  function saveActiveProfile() {
    const users = getStoredProfiles();
    const u = users[activeProfileId];
    if (!u) return;
    u.params = readInputsForProfile();
    u.goal = readGoalInputs();
    u.actualsHistory = JSON.parse(JSON.stringify(state.actualsHistory));
    u.updatedAt = nowIso();
    saveStoredProfiles(users);
    showToast(`Saved ${escapeHtml(u.name)} (${escapeHtml(u.userId)})`, '✓');
    updateAll();
  }

  /** Save only the year-end records of the active user (plan edits are not saved by this). */
  function persistActiveActuals() {
    const users = getStoredProfiles();
    const u = users[activeProfileId];
    if (!u) return;
    u.actualsHistory = JSON.parse(JSON.stringify(state.actualsHistory));
    u.updatedAt = nowIso();
    saveStoredProfiles(users);
  }

  // ---------- New / edit user modals ----------
  const uf = (p) => ({
    name: document.getElementById(`${p}-name`),
    id: document.getElementById(`${p}-id`),
    msg: document.getElementById(`${p}-msg`),
    target: document.getElementById(`${p}-goal-target`),
    years: document.getElementById(`${p}-goal-years`),
    start: document.getElementById(`${p}-start-year`)
  });
  const newF = uf('new-user'), editF = uf('edit-user');
  let editingUserId = null;

  // Auto-suggest the user ID from the name until the ID is typed by hand
  [newF, editF].forEach(f => {
    if (!f.name || !f.id) return;
    f.name.addEventListener('input', () => {
      if (f.id.dataset.touched !== '1') f.id.value = slugifyId(f.name.value);
      f.msg.textContent = '';
    });
    f.id.addEventListener('input', () => { f.id.dataset.touched = '1'; f.msg.textContent = ''; });
  });
  document.querySelectorAll('[data-goal-for]').forEach(chip => {
    chip.addEventListener('click', function () {
      const f = this.getAttribute('data-goal-for') === 'new-user' ? newF : editF;
      if (f.target) f.target.value = this.getAttribute('data-goal');
    });
  });

  function readUserForm(f, excludeId) {
    const name = (f.name.value || '').trim();
    const id = slugifyId(f.id.value || name);
    const users = getStoredProfiles();
    if (!name) return { error: 'Enter a name.' };
    if (!validUserId(id)) return { error: 'User ID needs 2–32 letters or digits (dot, dash and underscore allowed).' };
    if (users[id] && id !== excludeId) return { error: `User ID “${id}” is already taken by ${users[id].name}.` };
    const target = parseFloat(f.target.value);
    const years = parseInt(f.years.value, 10);
    const start = parseInt(f.start.value, 10);
    if (!(target > 0)) return { error: 'Enter a goal corpus above ₹0.' };
    if (!(years >= 1 && years <= 60)) return { error: 'Goal years must be between 1 and 60.' };
    if (!(start >= 1980 && start <= 2100)) return { error: 'Enter the year the plan started, e.g. ' + thisYear() + '.' };
    return { name, id, goal: { target, years }, startYear: start };
  }

  function openNewUserModal() {
    newF.name.value = ''; newF.id.value = ''; newF.id.dataset.touched = '';
    newF.msg.textContent = '';
    newF.target.value = numOr(els.goalTarget, 100000000);
    newF.years.value = intOr(els.goalYears, 20);
    newF.start.value = thisYear();
    openModal(els.modalNewProfile);
    setTimeout(() => newF.name.focus(), 80);
  }

  function createNewProfile() {
    const r = readUserForm(newF, null);
    if (r.error) { newF.msg.textContent = r.error; return; }
    const template = els.newProfileTemplateSelect ? els.newProfileTemplateSelect.value : 'current';
    const users = getStoredProfiles();
    users[r.id] = makeUser({
      userId: r.id, name: r.name,
      params: template === 'current' ? readInputsForProfile() : defaultPlanParams(),
      goal: { target: r.goal.target, years: r.goal.years, assumedReturn: null, inflationAdjusted: false },
      startYear: r.startYear,
      actualsHistory: {}
    });
    const tomb = getTombstones(); delete tomb[r.id]; setTombstones(tomb);
    saveStoredProfiles(users);
    closeModal(els.modalNewProfile);
    loadProfile(r.id, false);
    showToast(`Created ${escapeHtml(r.name)} (${escapeHtml(r.id)})`, '✓');
  }

  function openEditUserModal(userId) {
    const u = getStoredProfiles()[userId || activeProfileId];
    if (!u) return;
    editingUserId = u.userId;
    editF.name.value = u.name; editF.id.value = u.userId; editF.id.dataset.touched = '1';
    editF.msg.textContent = '';
    const isActive = u.userId === activeProfileId;
    editF.target.value = isActive ? numOr(els.goalTarget, u.goal.target) : u.goal.target;
    editF.years.value = isActive ? intOr(els.goalYears, u.goal.years) : u.goal.years;
    editF.start.value = u.startYear || thisYear();
    openModal(document.getElementById('modal-edit-user'));
    setTimeout(() => editF.name.focus(), 80);
  }

  function saveEditedUser() {
    const r = readUserForm(editF, editingUserId);
    if (r.error) { editF.msg.textContent = r.error; return; }
    const users = getStoredProfiles();
    const u = users[editingUserId];
    if (!u) return;
    const wasActive = editingUserId === activeProfileId;
    if (r.id !== editingUserId) {
      delete users[editingUserId];
      const tomb = getTombstones(); tomb[editingUserId] = nowIso(); setTombstones(tomb);
      u.legacyId = editingUserId;
    }
    u.userId = r.id; u.id = r.id; u.name = r.name; u.startYear = r.startYear;
    u.goal = Object.assign({}, u.goal, { target: r.goal.target, years: r.goal.years });
    u.updatedAt = nowIso();
    users[r.id] = u;
    saveStoredProfiles(users);
    closeModal(document.getElementById('modal-edit-user'));
    if (wasActive) {
      setActiveId(r.id);
      if (els.goalTarget) els.goalTarget.value = r.goal.target;
      if (els.goalYears) els.goalYears.value = r.goal.years;
    }
    populateProfileSelect();
    renderManageProfilesList();
    updateAll();
    showToast(`Saved ${escapeHtml(r.name)} (${escapeHtml(r.id)})`, '✓');
  }

  bindClick('btn-confirm-edit-user', saveEditedUser);
  bindClick('btn-review-edit-user', () => openEditUserModal(activeProfileId));
  bindClick('btn-review-new-user', openNewUserModal);
  [newF, editF].forEach((f, i) => {
    Object.values(f).forEach(el => el && el.tagName === 'INPUT' && el.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); i === 0 ? createNewProfile() : saveEditedUser(); }
    }));
  });

  // ---------- Users list (Manage) ----------
  function renderManageProfilesList() {
    if (!els.profilesListContainer) return;
    renderDbStatus();
    const users = getStoredProfiles();
    const filterEl = document.getElementById('inp-manage-filter');
    const q = (filterEl ? filterEl.value : '').trim().toLowerCase();
    const list = Object.values(users)
      .filter(u => !q || u.name.toLowerCase().includes(q) || u.userId.includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
    const many = Object.keys(users).length > 1;
    els.profilesListContainer.innerHTML = list.length ? list.map(u => {
      const isActive = u.userId === activeProfileId;
      const logged = Object.keys(u.actualsHistory || {}).length;
      const goalTxt = `${CE.formatINR(u.goal.target, { compact: true, decimals: 1 })} in ${u.goal.years} yrs`;
      return `
        <div class="profile-list-item ${isActive ? 'active-item' : ''}">
          <div>
            <div style="font-weight: 600; display: flex; align-items: center; gap: 8px;">${escapeHtml(u.name)} <span class="c-muted" style="font-weight:400">${escapeHtml(u.userId)}</span> ${isActive ? '<span class="badge badge-gold">Open</span>' : ''}</div>
            <div class="profile-item-meta">Goal ${goalTxt} · started ${u.startYear} · ${logged} year${logged === 1 ? '' : 's'} recorded · saved ${escapeHtml(fmtDateTime(u.updatedAt))}</div>
          </div>
          <div class="profile-item-actions">
            ${isActive ? '' : `<button class="btn-icon btn-switch-prof" data-id="${escapeHtml(u.userId)}">Open</button>`}
            <button class="btn-icon btn-edit-prof" data-id="${escapeHtml(u.userId)}">Edit</button>
            <button class="btn-icon btn-dup-prof" data-id="${escapeHtml(u.userId)}">Clone</button>
            ${many ? `<button class="btn-icon btn-del-prof" data-id="${escapeHtml(u.userId)}" style="color: var(--rose);">Delete</button>` : ''}
          </div>
        </div>`;
    }).join('') : '<p class="modal-note">No user matches that filter.</p>';

    els.profilesListContainer.querySelectorAll('.btn-switch-prof').forEach(btn => btn.addEventListener('click', function () {
      loadProfile(this.getAttribute('data-id'), true); renderManageProfilesList();
    }));
    els.profilesListContainer.querySelectorAll('.btn-edit-prof').forEach(btn => btn.addEventListener('click', function () {
      openEditUserModal(this.getAttribute('data-id'));
    }));
    els.profilesListContainer.querySelectorAll('.btn-dup-prof').forEach(btn => btn.addEventListener('click', function () {
      const all = getStoredProfiles();
      const src = all[this.getAttribute('data-id')];
      if (!src) return;
      let id = slugifyId(src.userId + '-copy'), n = 2;
      while (all[id]) id = slugifyId(`${src.userId}-copy${n++}`);
      const copy = makeUser({ userId: id, name: `${src.name} (copy)`, params: JSON.parse(JSON.stringify(src.params)),
        goal: JSON.parse(JSON.stringify(src.goal)), startYear: src.startYear, actualsHistory: JSON.parse(JSON.stringify(src.actualsHistory || {})) });
      all[id] = copy;
      saveStoredProfiles(all);
      populateProfileSelect(); renderManageProfilesList();
      showToast(`Cloned as ${escapeHtml(copy.name)} (${escapeHtml(id)})`, '✓');
    }));
    els.profilesListContainer.querySelectorAll('.btn-del-prof').forEach(btn => btn.addEventListener('click', function () {
      const id = this.getAttribute('data-id');
      const all = getStoredProfiles();
      if (Object.keys(all).length <= 1) return;
      if (!confirm(`Delete ${all[id].name} (${id}) and all of their year-end records?`)) return;
      delete all[id];
      const tomb = getTombstones(); tomb[id] = nowIso(); setTombstones(tomb);
      saveStoredProfiles(all);
      if (activeProfileId === id) loadProfile(Object.keys(all)[0], false);
      populateProfileSelect(); renderManageProfilesList();
      showToast('User deleted', '✓');
    }));
  }
  const manageFilter = document.getElementById('inp-manage-filter');
  if (manageFilter) manageFilter.addEventListener('input', renderManageProfilesList);

  // ---------- Header / modal event handlers ----------
  if (els.profileSelect) els.profileSelect.addEventListener('change', function () {
    if (state.isDirty && !confirm('You have unsaved plan changes for this user. Switch anyway and discard them?')) {
      this.value = activeProfileId; return;
    }
    loadProfile(this.value, true);
  });
  if (els.btnSaveProfile) els.btnSaveProfile.addEventListener('click', saveActiveProfile);
  if (els.btnNewProfile) els.btnNewProfile.addEventListener('click', openNewUserModal);
  if (els.btnConfirmCreateProfile) els.btnConfirmCreateProfile.addEventListener('click', createNewProfile);
  if (els.btnManageProfiles) els.btnManageProfiles.addEventListener('click', () => {
    if (manageFilter) manageFilter.value = '';
    renderManageProfilesList(); openModal(els.modalManageProfiles);
  });

  // Export / import (also works as a manual backup when no database file is linked)
  if (els.btnExportProfilesJson) {
    els.btnExportProfilesJson.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(dbSnapshot(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compounding_users_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      showToast('Users exported', '✓');
    });
  }
  if (els.inpImportProfilesJson) {
    els.inpImportProfilesJson.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const res = mergeDatabase(JSON.parse(e.target.result));
          saveStoredProfiles(getStoredProfiles());
          populateProfileSelect(); renderManageProfilesList();
          loadProfile(getStoredProfiles()[activeProfileId] ? activeProfileId : Object.keys(getStoredProfiles())[0], false);
          showToast(`Imported: ${res.added} new, ${res.updated} updated`, '✓');
        } catch (err) {
          alert('That file could not be read as a users file: ' + err.message);
        }
      };
      reader.readAsText(file);
      this.value = '';
    });
  }

  // =========================================================================
  // DEDICATED HIGH-QUALITY PDF PRINTING ENGINE
  // =========================================================================
  const printBtn = document.getElementById('print-summary-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      openModal(els.modalPrintOptions);
    });
  }

  if (els.btnTriggerPrint) {
    els.btnTriggerPrint.addEventListener('click', () => {
      // Setup print meta
      const profiles = getStoredProfiles();
      const curProf = profiles[activeProfileId];
      if (els.printUserName) {
        els.printUserName.textContent = curProf ? curProf.name : 'Sekhar';
      }
      if (els.printReportDate) {
        els.printReportDate.textContent = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      if (els.printReportHorizon) {
        els.printReportHorizon.textContent = `${els.horizon.value} Years`;
      }

      // Check selected print mode
      const printModeRadio = document.querySelector('input[name="print-report-type"]:checked');
      const isSummaryOnly = printModeRadio ? printModeRadio.value === 'summary' : true;

      // Apply mode class to body for strict page budgeting
      document.body.classList.remove('print-mode-summary', 'print-mode-full');
      if (isSummaryOnly) {
        document.body.classList.add('print-mode-summary');
      } else {
        document.body.classList.add('print-mode-full');
      }

      closeModal(els.modalPrintOptions);

      // Trigger print after modal animation clears and chart redraws
      setTimeout(() => {
        window.print();
      }, 250);
    });
  }

  // Clean up print classes and re-render charts after print dialog closes
  window.addEventListener('beforeprint', () => {
    state.printing = true;
    const sd = document.getElementById('schedule-details');
    if (sd && document.body.classList.contains('print-mode-full')) { state.scheduleWasOpen = sd.open; sd.open = true; }
    if (els.printReportDate && els.printReportDate.textContent.trim() === '—') {
      els.printReportDate.textContent = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (els.printReportHorizon) els.printReportHorizon.textContent = `${els.horizon.value} years`;
    if (state.lastResult) {
      drawGrowthChart(state.growthChartCanvas, state.lastResult.yearlyRows, state.lastResult.horizon, state.isLogScale);
    }
  });
  window.addEventListener('afterprint', () => {
    state.printing = false;
    const sd = document.getElementById('schedule-details');
    if (sd && state.scheduleWasOpen !== undefined) { sd.open = state.scheduleWasOpen; state.scheduleWasOpen = undefined; }
    document.body.classList.remove('print-mode-summary', 'print-mode-full');
    if (state.lastResult) {
      drawGrowthChart(state.growthChartCanvas, state.lastResult.yearlyRows, state.lastResult.horizon, state.isLogScale);
    }
  });

  // Handle window resize for charts
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateAll, 120);
  });

  // Initial Startup
  initContributionsSwitcher();
  initYoungsterLab();
  populateProfileSelect();
  loadProfile(activeProfileId, false);
  renderDbStatus();
  fileDb.init();
  renderAppInfo();
  bindClick('btn-about', () => openModal(document.getElementById('modal-about')));
});

