# Compounding Calculator — notes for Claude Code

Core + Satellite compounding calculator for the TechnoFunda method. Owner and developer: **Sathiya Sekhar E**.
Live site: https://esathiyasekhar.github.io/CompoundingCalc/ (GitHub Pages, deploys from `main`, root folder).
Current version: **1.14** (29 Oct 2026). Full detail is in `manual/design-manual.html` (architecture, every formula, data model, visual system); read the relevant chapter before changing an area.

## What it is

Plain HTML/CSS/JavaScript. No framework, no build step, no server. Opens from `file://` (Windows app) or any static host.

| File | Role |
|---|---|
| `index.html` | All markup: header, tab bar (Inflation, INF_ADJ, Presets, Reset page), four page panels, modals, icon sprite, print-only report blocks |
| `styles.css` | Design tokens (dark default + `:root[data-theme="light"]`), components, responsive rules, print styles. Later sections at the end of the file override earlier ones |
| `calculator.js` | The engine (`window.CompoundingEngine`, also a Node module). No DOM access. `calculateSchedule`, `solveGoal`, `reviewActualsAndCorrect`, `calculateYoungsterWealth`, `solveIRR`, `ratesForBlended`, `formatINR` |
| `app.js` | Interface: reads inputs → engine → renders cards, tables, canvas charts; users/storage/database file; presets; inflation; Help |
| `manual/` | User manual and Design manual (HTML shown inside the app via Help/F1, plus PDFs), `manual.css`, `manual.js`, screenshots in `img/` |
| `test_runner.html`, `test_milestones.html` | Engine test pages (must end with “ALL 8 TEST SUITES PASSED”) |
| `installer/` | Go source for the Windows launcher and per-user setup program (`build.ps1` / `build.sh` → `dist/CompoundingCalculator-Setup.exe`) |
| `tools/` | Playwright scripts: `smoke-test.js`, `screenshots.js`, `manual-pdfs.js`, and a tiny static `server.js` |

## Commands

```bash
npm install && npx playwright install chromium   # once
npm test              # smoke test: engine suites, versions, Help anchors, INF_ADJ, all presets, phone width
npm run screenshots   # retake manual/img/*.jpg (run after visible UI changes)
npm run pdfs          # rebuild both manual PDFs from the HTML manuals
npm run serve         # local preview at http://localhost:8000
installer\build.ps1   # Windows (or installer/build.sh elsewhere): needs Go 1.21+
```

## Model essentials (do not change without the owner asking)

- Two pots, **core** and **satellite**, compounding at their own CAGR, **never rebalanced**. That is why Portfolio IRR > Blended CAGR.
- Yearly steps; SIPs earn part of a year: weight `w = 0.5` for a full year, `1 − m/24` for `m` months. IRR uses flows at `t = year − w` (equals the source spreadsheet's semi-annual IRR).
- Solvers bisect over the full schedule and keep the user's core–satellite gap (`ratesForBlended`). Every solved SIP/return must reproduce the target when put back.
- Recorded year-end values (Annual review) replace the model for those years; while a preset note is shown, `planActuals()` returns no records.
- Inflation: `realInflation` deflates values by `(1+i)^t` after the nominal loop (rows still add up; real IRR = (1+IRR)/(1+i) − 1 exactly). INF_ADJ view passes it for display; the goal switch “Target in today’s money” runs goal solvers in real terms. The Annual review is always nominal.
- Youngster lab: own three sliders (core %, core CAGR, satellite CAGR), optional lump sum, three horizons in `state.youngHz` (years from now, up to age 100), age from 0.

## Reference figures (smoke-tested — if these change, something broke)

Standard plan (₹1 L + ₹10,000/month, 10% step-up to year 10, SIP 10 yrs, 70/30 at 15%/25%, 30 yrs): **₹22.91 Cr**, invested ₹20.12 L, IRR **20.51%**, blended 18.00%. With INF_ADJ at 6%: ₹3.99 Cr, real IRR 13.69%. Youngster defaults (age 20): ₹30.49 Cr at 50, ₹292.12 Cr at 60, ₹2,993.09 Cr at 70. Slide checks: ₹1 L at 26% for 10 yrs = ₹10.09 L; family Models A–D at year 20 = ₹36.27 / 67.05 / 107.80 / 363.84 Cr.

## Owner's preferences

- Indian number format everywhere (`formatINR`: lakh/crore grouping, compact L / Cr). ₹ symbol.
- Plain, short on-screen wording that says what happens. Colours only from CSS tokens (gold = money/horizon, growth green, core periwinkle, satellite teal, rose = loss).
- Defaults: Core engine ₹1,00,000 lump + ₹10,000 SIP, step-up ON 10%, last step-up year 10, SIP 10 yrs, 70/30, 15%/25%, 30 yrs, spouse off. Youngster: age 20, ₹10,000, step-up 10% for 10 yrs, SIP 10 yrs, 70%/17%/27%, horizons 30/40/50. Inflation 6%, INF_ADJ off. Reset page restores these.
- Header quote: Einstein line on one line in gold, “— Albert Einstein” (no “attributed to”).
- Credits: “Developed by Sathiya Sekhar E”. The group name “Warren Charlie Study group - TechnoFunda Top Guns” appears in About and the footer only — **not** in printed reports or the manuals.
- Every change is a new version with a history note; the owner sees the version pill (v1.xx).

## Release checklist (every version)

1. `APP_INFO` in `app.js`: `version`, `date`, new `history` entry at the top.
2. `index.html`: every `data-app="version"`/`data-app="date"` fallback, `<meta name="app-version">`, and the `?v=` stamp on `styles.css`, `calculator.js`, `app.js` (browsers cache old files otherwise).
3. Manuals: version on cover/contents/footer, `?v=` on `manual.css`, `manual.js` and every image; update the text for the change; Design manual version-history row.
4. `npm test`, then `npm run screenshots` (if the UI changed) and `npm run pdfs`.
5. Installer: `appVersion` in `installer/setup/main.go`, `assemblyIdentity version` in `installer/manifest.xml`; rebuild with `installer/build.*` (refresh `.syso` with `rsrc` when the version changes).
6. README: version line and feature list. Commit to `main` → GitHub Pages republishes; tell the owner to press Ctrl+F5 if the old version still shows.

A separate copy also exists as a claude.ai web page (artifact) with downloads/print hidden; it is updated from claude.ai, not from this repo.
