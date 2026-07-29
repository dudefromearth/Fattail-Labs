# p-practice-harden — frozen scope (PH0-0)

**Status:** awaiting Coach **ACK** / **ADJUST**  
**Opened:** 2026-07-29 · Primary: Juliet  
**Mission:** Architecturally harden the Practice suite only — no new product features.

Architectural hardening of the **Practice suite** (Trade Log, Reports, Journal,
Retrospective shell, Playbook shell, shared chrome). Member-visible behavior stays
stable on H0–H2 unless Coach labels a change.

---

## CHARTER goals → seed coverage

| # | CHARTER goal | Covered by |
|---|--------------|------------|
| 1 | Robustness — scale, isolation, fail-loud | PH0-1, PH0-2, PH0-3, PH0-G · Mike/Kilo |
| 2 | Single source of truth — structure / open-on-day / PnL | PH1-0 … PH1-4, PH1-G · India/Alpha/Charlie |
| 3 | Simpler modules — thin routes/pages | PH2-1 … PH2-5, PH2-G · Alpha/Charlie/Echo |
| 4 | Completeness — multi-agent review + Delta | Every seed + PHn-G · collaboration law |
| 5 | Behavior stability | H0–H2 default; H1 formula only if labeled; H4 Coach GO |

| CHARTER DoD item | Seeds |
|------------------|-------|
| H0–H3 gates PASS (H4 optional) | PH0-G … PH3-G; PH4-* optional |
| One authoritative position/PnL/open-on-day | PH1-0 … PH1-4 |
| List trades O(trades), not N+1 | PH0-2, PH0-3 |
| Dev identity fallback only when `LABS_ENV=dev` | PH0-1, PH0-3 |
| Clients no longer own multi-hundred-line domain algos | PH1-3, PH2-2…4 |
| Specs/docs match as-built | PH3-1 … PH3-4 |
| Lima close entry | PH3-2 (+ program close) |

**Verdict (Juliet):** Seed pack is complete vs CHARTER. No orphan goals. No product-feature seeds.

---

## In-scope file inventory (as-built 2026-07-29)

### Server — Trade Log / Practice data

| Path | Notes / likely phases |
|------|------------------------|
| `server/routes/trade_log.py` | H0 identity + batch legs; H1 API; H2 split |
| `server/trade_log_io.py` | I/O; stay unless domain extract needs it |
| `server/trade_log_catalog.py` | Catalog helpers |
| `server/import_0dte_xlsx.py` | Ops/bench import — H1-4 share domain; PH3-3 ops note |
| `server/seed_trade_log_demo.py` | Bench seed — H1-4 |
| `server/seed_reports_demo_pnl.py` | Bench seed — H1-4 |
| `server/seed_clone_trade_log.py` | Ops clone — PH3-3 ops note |
| `server/tests/test_trade_log.py` | H0–H1 characterization |
| `server/tests/test_trade_log_import.py` | Import tests |
| `server/tests/fixtures/tos_trade_history_sample.csv` | Fixture |
| Migrations already applied (`040`/`041` practice/trade log) | **No new migrations in H0** unless Coach/India force |

**May be created later (design-approved only):**

- `server/trade_log_domain/` (or name from PH1-0)  
- Split route packages under `server/routes/` (PH2-1)  
- Additional tests under `server/tests/`  

### Web — Practice suite

| Path | Notes / likely phases |
|------|------------------------|
| `web/app/app/practice/page.tsx` | Redirect → Reports |
| `web/app/app/trade-log/page.tsx` | Blotter host |
| `web/app/app/reports/page.tsx` | Practice home |
| `web/app/app/journal/page.tsx` | Calendar / day book |
| `web/app/app/retrospective/page.tsx` | **Shell only** — no content features |
| `web/app/app/playbook/page.tsx` | **Shell only** — no content features |
| `web/app/app/page.tsx` | Apps catalog nesting under Practice (PH2-5) |
| `web/components/practice/PracticeSuiteChrome.tsx` | Suite chrome |
| `web/components/practice/PracticeSuiteNav.tsx` | Suite nav |
| `web/components/trade-log/TradeLogTable.tsx` | Blotter (H4 virtualize if GO) |
| `web/components/trade-log/TradeSheet.tsx` | Sheet |
| `web/components/trade-log/TradeLogToolbar.tsx` | Toolbar |
| `web/components/journal/JournalCalendar.tsx` | God component → PH2-3 |
| `web/components/reports/ReportsDashboard.tsx` | God component → PH2-4 |
| `web/lib/tradeLog.ts` | Client types/helpers → PH1-3 / PH2-2 |
| `web/lib/reportsBook.ts` | Client analytics twin → PH1-3 |
| `web/lib/journalDayBook.ts` | Client day-book twin → PH1-3 |
| `web/lib/practiceSuite.ts` | Suite slugs/nav → PH2-5 |

**May be created later:**

- `web/lib/tradeLogApi.ts` (PH2-2)  
- Split components under `web/components/journal/`, `web/components/reports/`  

### Specs / memory / bench

| Path | Notes |
|------|-------|
| `Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md` | As-built / v1.2 honesty — PH3-1 |
| `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.1.md` | Honesty / non-goals only — no content build |
| `Architecture/00-decision-log.md` | PH3-2 + any mid-phase architecture decisions |
| `agents/p-practice-harden/**` | Board, seeds, gates, this SCOPE |
| Parents (read-only unless conflict): Application Framework, Member-Data-Privacy, HIG Specs | India may cite; no rewrites for features |

### Touch policy

- Seeds declare exact files before edit (change control).  
- Paths above are the **allowed neighborhood**; out-of-neighborhood needs Juliet re-seed + Coach if behavior.  
- **No code in PH0-0.**  

---

## Out of scope (hard freeze) / non-goals

- Retrospective **content** (week roll-up, agent co-author, Journey milestone pipeline beyond shell)  
- Playbook **content**  
- Live broker APIs  
- Chart library rewrite for aesthetics alone  
- ToS blotter visual rule changes without Coach  
- Production deploy (Foxtrot) unless Coach adds a phase  
- Course / Family A / Content Studio agents (Quebec, Bravo, November, Romeo, Papa, …)  
- Sierra public SEO, Golf Ask-Vexy, lineage channels (Victor/Whiskey/Yankee)  
- Feature work on `agents/p-trade-log/` board (that project is prior delivery; harden is this board)  
- Productizing ops tools: `import_0dte_xlsx`, demo seeds, clone scripts — see `OPS-VS-PRODUCT.md`  
- Treating synthetic/illustrative strikes as live broker truth  
- Spec §10.2 `records/*` as “already the Reports equity path” (analytics paths are as-built; records may alias later)  
- H4 blotter virtualization/pagination without Coach GO  

**Status:** Coach ACK via H3 execution (2026-07-29).

---

## Agents seated

| Seated | Role on board |
|--------|----------------|
| Coach · Juliet · India | Authority / orchestration / architecture |
| Alpha · Charlie · Echo · Mike | Platform execution |
| Kilo · Tango · Hotel · Delta · Lima | Quality / member honesty / gates / memory |

**Not seated** unless Coach expands charter: Foxtrot, Sierra, Golf, Content Studio roster, lineage channels.

---

## Behavior policy

| Phase | Behavior |
|-------|----------|
| H0–H2 | Same UX and metrics by default |
| H1 | Formula change only if PH1-0 + Coach labeled |
| H4 | Optional usability wins only after PH4-0 Coach GO |

---

## Audit drivers (2026-07-29) → first touch

| # | Finding | First seed |
|---|---------|------------|
| 1 | N+1 legs on list | PH0-2 |
| 2 | Dual client/server PnL / open-book | PH1-0 → PH1-3 |
| 3 | Dev identity fallback risk | PH0-1 |
| 4 | God components (journal/reports/routes) | PH2-1 … PH2-4 |
| 5 | Client full-book fetch at scale | H1 read models; H4 if still painful |
| 6 | Spec lag vs as-built | PH3-* |

---

## Seed pack freeze (complete list)

H0: PH0-0, PH0-1, PH0-2, PH0-3, PH0-G  
H1: PH1-0 … PH1-5, PH1-G  
H2: PH2-1 … PH2-5, PH2-G  
H3: PH3-1 … PH3-4, PH3-G  
H4: PH4-0 … PH4-2, PH4-G (optional)

Index: `seeds/README.md` · Sequencing: `ORCHESTRATOR.md`

---

## Collaboration kickoff rules (reaffirmed)

1. No seed done without required reviewers **APPROVED**.  
2. No phase advance without Delta **PASS**.  
3. No parallel seeds with overlapping write sets unless Juliet schedules.  
4. PH0-1 / PH0-2 may run **sequentially** (same primary file `trade_log.py`); do not parallelize PH0-1∥PH0-2.  
5. Next after Coach ACK: **PH0-1** (Alpha ◄ Mike · India).  

---

## Coach decision

Record in `gate-reports/PH0-0-coach-ack.md`:

- **ACK** — freeze accepted; PH0-1 may open  
- **ADJUST** — list deltas; Juliet revises SCOPE + board before any H0 code  
