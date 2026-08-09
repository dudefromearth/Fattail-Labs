# FatTail Labs Practice Suite — Hardening Audit

**Date:** 2026-08-09  
**Type:** Read-only audit + ranked recommendations  
**Scope:** Practice suite apps and shared infrastructure (trade log, reports, journal, retrospective, playbook, campaigns, capital/positions, practice context, export/import, live marks). Strategy Lab / courses only where they share infrastructure.  
**Method:** Code exploration of `/Users/ernie/fattail-labs` (server + web); no production exploit testing.

---

## 1. Executive summary

The suite has grown **faster than its contracts**. The highest-value work is not greenfield features — it is **unifying scope** (account / campaign / date / capital), **entitlement consistency**, **purge/export honesty**, and **ops on live marks**.

| Theme | Risk if ignored |
|--------|------------------|
| Dual filters (chrome vs blotter) | Support: “Reports ≠ Trade Log” |
| Capital starting balance vs Reports $50k localStorage | Wrong equity curves / “balance” arguments |
| Practice spine un-gated vs Trade Log gated | Free/no-plan bypass on playbook/export |
| Purge incomplete vs capital tables | “Wipe” leaves capital prefs |
| Stale marks stream | Wrong MTM (e.g. TSLA mid frozen while real close moved) |

---

## 2. Ranking key

| Value | Meaning |
|-------|---------|
| **H** | Security, data loss/wrong money, or high support load |
| **M** | Correctness/UX consistency, scale, portability |
| **L** | Polish, debt, optional |

| Effort | Meaning |
|--------|---------|
| **S** | Hours–1 day |
| **M** | 1–3 days |
| **L** | Multi-day / multi-surface |

---

## 3. Priority matrix (value × effort)

### Tier A — Do first (high value, small–medium effort)

| # | Proposal | Value | Effort | Why |
|---|----------|-------|--------|-----|
| **A1** | **Gate Practice spine + export/import** with same membership floor as Trade Log (`require_practice_member` / `_require_tool_member`) | **H** | **S** | `practice_spine` + `export` use `require_session` only; free signed-in users can playbook/campaign/import/purge while Trade Log 403s |
| **A2** | **Export trade legs: always filter `identity_id`** (`export_domain` batch legs) | **H** | **S** | Family B defense-in-depth; list path already dual-scopes |
| **A3** | **Unify campaign scope: chrome = blotter** — stop Trade Log auto-picking ledger/default independent of chrome | **H** | **M** | Reports use chrome `campaignId`; blotter keeps local filter + auto-ledger → same account, different books |
| **A4** | **Trade Log date contract** — either pass Practice `rangeFrom/To` into `fetchTrades`, or hide date chrome / stop empty-period copy that claims period filtering | **H** | **S–M** | Chrome period often **does not** filter the blotter list |
| **A5** | **Complete purge inventory** — capital prefs, cash movements, campaign funding/bounds/memory; fail-loud sub-steps; update UI/API blast-radius copy | **H** | **S–M** | Capital tables (110–115+) post-date purge; wipe can leave prefs |
| **A6** | **Live marks ops + UI honesty** — supervise stream; alert on stale heartbeat; UI: “as of / age” not silent mid; optional official-close fallback when stream dead | **H** | **S** (ops) / **M** (UX) | Known: marks can freeze for days while real market moves |

### Tier B — Next (high value, medium effort)

| # | Proposal | Value | Effort | Why |
|---|----------|-------|--------|-----|
| **B1** | **Reports/Retro starting capital from account `starting_balance`**, not global `localStorage` $50k | **H** | **M** | Equity/DD/return disagree with Capital for same book |
| **B2** | **Lift `PracticeContextProvider` to Practice layout** (one hydrate per suite, not every nav) | **H** | **M** | Remount → re-fetch me/accounts/campaigns + prefs flash; Journal lacks `prefsReady` gate |
| **B3** | **Capital (prefs + cash movements) in export/import pack** | **H** | **M** | Portability incomplete after capital/funding |
| **B4** | **Full-pack media** (playbook archive/cover bytes; journal attachments) with size caps | **H** | **M** | Single-book ZIP has media; full pack does not |
| **B5** | **Account `trade_count` scale + tests** — domain-aligned open-structure count; avoid unscoped leg aggregation hot path | **H** | **M** | Correct after open/close fix; large ToS books will hurt list-accounts |

### Tier C — Hardening hygiene (medium value, small effort)

| # | Proposal | Value | Effort | Why |
|---|----------|-------|--------|-----|
| **C1** | Magic-byte sniff for playbook cover/archive (like Help uploads) | **M** | **S** | Client Content-Type alone |
| **C2** | Confine media paths under `media_root().resolve()` | **M** | **S** | Defense if `storage_key` ever poisoned |
| **C3** | Export pack `warnings[]` — no silent skip of failed books | **M** | **S** | False “complete backup” confidence |
| **C4** | Fix FatTail-book / Default-label **test drift** | **M** | **S** | Doctrine vs tests (Primary/unset residuals) |
| **C5** | Zip-bomb caps (entry count + uncompressed total) | **M** | **S** | Import robustness |
| **C6** | Positions init from Practice account/campaign | **M** | **S** | Dual account pickers under Trade Log Positions mode |
| **C7** | Soften empty-account **auto-hop** (once / invalid only, not on deliberate empty pick) | **M** | **S** | Fights intentional empty books |
| **C8** | Purge + export API copy list **playbook/campaigns/capital** | **M** | **S** | Honest blast radius |
| **C9** | “Avg Risk per trade” fallback to \|avg net\| when no losers — fix or relabel | **M** | **S** | Undermines process honesty |

### Tier D — Refactor / debt (medium value, medium effort)

| # | Proposal | Value | Effort | Why |
|---|----------|-------|--------|-----|
| **D1** | Shared `PracticeLoadShell` + `EmptyPeriodNotice` + money/http helpers | **M** | **M** | Three HTTP styles; copy-pasted money; uneven empty/error |
| **D2** | Playbook list: stop N+1 `ensure_book_pages_migrated` on every list | **M** | **M** | Latency with many books |
| **D3** | One glossary strip: **cash balance / marked positions / reports equity** | **M** | **M** | Three “balance” languages → support |
| **D4** | Capital “Allocations declared: none” stub — real or remove | **M** | **S** | Looks live, isn’t |
| **D5** | Deduplicate account create surfaces (Capital vs Trade Accounts) | **M** | **M** | Two write paths, diverging copy |
| **D6** | Thin Playwright: login → trade-log → playbook → export | **M** | **M** | e2e is smoke/admin only today |

### Tier E — Known / lower priority

| # | Proposal | Value | Effort | Notes |
|---|----------|-------|--------|-------|
| **E1** | Options MTM (still at-cost by design V13) | **L–M** | **L** | Product decision, not bug |
| **E2** | Dual subdomain Practice vs Labs | **L** now | **L** | Design-only |
| **E3** | Stickies margin rail / house-design “Start from…” (PB3 polish) | **L–M** | **M** | Roadmap polish |
| **E4** | Dead `accountPages` / nav comment drift | **L** | **S** | Cleanup |

---

## 4. Architecture findings

### 4.1 What’s solid

| Area | Notes |
|------|--------|
| Trade-list Family B + batch legs | `_load_legs_for_trades` + isolation tests |
| CSRF Origin middleware | Present with tests |
| Playbook archive size/MIME caps | Config fail-loud |
| Single-book PB3 export + cover path | Implemented |
| FatTail book venue doctrine | Code path solid; tests lag |
| Positions mark age header | Spec V17 intentional; age exposed |
| Isolation tests | trade_log, analytics, import, member_export present |

### 4.2 Structural stress points

1. **No single “Practice scope” contract** — account, campaign, date, capital each have local forks.  
2. **Access control matrix incomplete** — Trade Log / Capital gated; spine / export not.  
3. **Schema grew past purge/export** — capital migrations 110–115 not fully reflected in purge/export.  
4. **Marks are a shared ops dependency** — silent freeze looks like “wrong last price.”  
5. **Domain split is healthy** (`playbook_scrapbook` vs `practice_spine`) but list paths still do read-time migration work.

### 4.3 Evidence pointers (backend)

| Finding | Primary paths |
|---------|----------------|
| Spine/export ungated | `server/routes/practice_spine.py`, `server/routes/export.py` vs `trade_log/common._require_tool_member`, `capital.py` |
| Purge inventory | `server/import_domain.py` `purge_practice_data`; Arch `Architecture/27-practice-suite-schema.md` lag vs capital 110+ |
| Export legs | `server/export_domain.py` batch legs without `identity_id` |
| Capital not in pack | `build_member_pack` surfaces list |
| Pack media | `single_playbook_to_zip_bytes` vs full pack JSON-only |
| Marks | `server/market_data/live_marks.py`, `live_stream.py`, `capital_positions.py` |
| Trade count | `server/routes/trade_log/accounts.py` |

### 4.4 Evidence pointers (frontend)

| Finding | Primary paths |
|---------|----------------|
| Dual campaign filters | `PracticeContextBar.tsx`, `practiceContext.tsx`, `web/app/app/trade-log/page.tsx`, `ReportsDashboard.tsx` |
| Date filter unused on Trade Log | `trade-log/page.tsx` `fetchTrades` vs chrome `rangeFromYmd` |
| Starting capital LS | `web/lib/reportsBook.ts`, Retro/StatsTable |
| Provider remount | `PracticeSuiteChrome.tsx` wraps new `PracticeContextProvider` every page |
| Empty-account auto-hop | `practiceContext.tsx` |
| Positions vs chrome | `PositionsView.tsx` |

---

## 5. Suggested delivery slices

| Slice | Items | Outcome |
|-------|--------|---------|
| **1. Trust & access** | A1, A2, A5, C8 | Entitled members only; wipe/export isolation; honest purge copy |
| **2. One scope** | A3, A4, B2, C6, C7 | Chrome = blotter = positions; less “why is my list wrong?” |
| **3. Money honesty** | B1, D3, C9, A6 | One capital story; marks age/close fallback |
| **4. Portability vNext** | B3, B4, C3, C5 | Full pack worth restoring after purge |
| **5. Scale & UI kit** | B5, D1, D2, D6 | Large books + shared load shells + e2e |

---

## 6. Test gaps (priority)

| Test | Covers |
|------|--------|
| Free role 403 on playbook + export (after A1) | Entitlement |
| Purge deletes capital prefs/movements | Wipe honesty |
| Export legs always scoped by identity | Isolation |
| Open+close pair → account trade_count ≈ 1 structure | Count doctrine |
| Capital round-trip export→purge→import | Portability |
| Cover reject non-image magic | Upload hygiene |
| Default account = Default + fattail | Doctrine |
| Playwright smoke of Practice critical path | UI regressions |

---

## 7. Bottom line

**Highest ROI:** A1–A6 (gates, campaign/date unity, purge, marks honesty).  
**Highest support ROI after that:** B1–B2 (capital-linked reports + stable Practice provider).  
**Don’t prioritize** dual-subdomain or full options MTM until scope/money contracts are clean.

---

## 8. Document history

| Date | Note |
|------|------|
| 2026-08-09 | Initial audit captured from read-only code review (server + web Practice suite) |
| 2026-08-09 | **Slices 1–4 implemented:** trust/access (A1/A2/A5/C8), one scope (A3/A4/B2/C6/C7), money honesty (B1/C9/D3/A6 UI+prev_close), portability (B3/B4 media budget/C3/C5). Remaining: Slice 5 scale & UI kit (B5/D1/D2/D6), deeper marks ops, C1–C4 hygiene. |

*Related recent work: FatTail-book accounts (migration 105), structure trade counts, playbook cover/export PB3, practice portability panel, campaign/capital expansions (migrations 096–115).*
