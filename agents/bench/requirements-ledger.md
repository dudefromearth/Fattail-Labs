# Requirements Ledger (RL-1)

Canonical capture of Coach requirements. Wording preserved. Close only by **AP-1** (Coach acceptance) or explicit withdraw. Hashable FINAL texts: `artifacts/reqs/REQ-001.md` · `REQ-002.md` · `REQ-003.md` · `REQ-004.md` · `REQ-005.md` · `REQ-006.md` · `REQ-007.md` · `REQ-009.md`.

Status: `OPEN` · `AP-1` · `WITHDRAWN`  
**WG-1 last cycle:** never (not armed — TOPO-1 backlog). Canonical `agents/bench/groundskeeping.json`.

## Open

| ID | Captured | Track | Status | Coach wording |
|----|----------|-------|--------|-----------------|
| **REQ-001** | 2026-09-19 | VP | OPEN | See full row below. |
| **REQ-002** | 2026-09-19 | VP settings | OPEN | See full row below. |
| **REQ-003** | 2026-09-19 | VP contracts | OPEN | See full row below. |
| **REQ-004** | 2026-09-19 | Refactor sweep | OPEN · **HOLD** | After TOPO-1 AP-1. See row below. |
| **REQ-005** | 2026-09-19 | Hardening pass | OPEN · **HOLD** | After REQ-004. See row below. |
| **REQ-006** | 2026-09-19 | Chart lookback | OPEN | N bars per interval; TV pan-page. See row below. |
| **REQ-007** | 2026-09-20 | Visible Range VP | OPEN | Server bins; VR default. See `artifacts/reqs/REQ-007.md`. |
| **REQ-009** | 2026-09-20 | Contract specs | OPEN · **BUILD** v0.2 | Registry is the instrument fact SoR. Spec v0.2 BUILD AUTHORITY (`sha1 33675b0b…`). `:4011` overlay + loader **folded into futures deploy GO** (DL-790). AP-1 Coach. See `artifacts/reqs/REQ-009.md`. |
| **REQ-010** | 2026-09-28 | OPF full book | OPEN · **BUILD** v0.3 | Ceiling 2,500 / 10 pages. SPX 2026-09-30 must be captured whole. See row below. |
| **REQ-011** | 2026-09-28 | OPF full book W4 | OPEN | Before any fullbook launchd load, the mexp2 tree at the W1-G commit. See row below. |
| **REQ-012** | 2026-09-28 | Runner 500s | OPEN | Diagnose Runner internal server errors. P1 P2 P3 P5 approved. P4 approved, last. P5 after Tuesday 2026-09-29 close, one API restart. See row below. |
| **REQ-013** | 2026-09-28 | Runner live ladder | OPEN · **ACCEPTED** | Plan v1.0 accepted. Reach path `:5055`. W0 dispatched. Canary is Coach plus one admin; ids later; no member ids. See row below. |
| **REQ-014** | 2026-09-29 | Member market path | OPEN · **ACCEPTED** | Plan v1.2 accepted (DL-807, commit `a213a1f7`). Plan v1.3 moves the market-stream ladder into Phase 1 W2–W4. Canary ids on file: 10 and 12. Phase 3 is a first standing-up of `ohlc_feed` on StudioOne. Phase 5 is positions valuation. See row below. |
| **REQ-015** | 2026-09-29 | Ladder book view | OPEN | `:5055` serves a wings window over `mb:book` when that key is present, else `mb:ladder`. chain_feed stops per-wings SPX/XSP fetches once the full-book worker is live. Six fetches per name per pass. Member JSON unchanged. Wednesday parallel run is the proof. See row below. |
| **REQ-016** | 2026-09-29 | Runner fast path item 1 | OPEN | SPX and XSP workers are schedulers. Each book has a 2-second timer. Request is (book, sequence). Newer sequence wins. In-flight cap skips and counts. Write only when the quote clock moved. See row below. |
| **REQ-017** | 2026-09-29 | Massive concurrency cap | OPEN | Measure SPX snapshot concurrency at N = 2, 4, 6, 8, 12. Cap is the largest clean N minus one. Set it on the full-book plist. sym_feed `--interval 1` on Wednesday's restart only. See row below. |
| **REQ-018** | 2026-09-30 | Full-book retry | OPEN | Restart the full-book job now. A DNS failure does not end the session. The scheduler and the spot stream log, back off, and keep their timers. launchd KeepAlive is the outer net. See row below. |
| **REQ-019** | 2026-09-30 | Ladder document age | OPEN | Amended the same day: no 15-minute rule, in RTH or out. The route serves the document. The only 502 is a book that has never been written. See row below. |
| **REQ-020** | 2026-09-30 | RTH ladder misses | OPEN | The 7% misses are decided by (symbol, DTE, wings), expected to be feed interest for DTE ≥ 6 and unserved wings, not the hop. See row below. |
| **REQ-021** | 2026-09-30 | Spot chip clock | OPEN | The spot chip and center-spot marker keep the timestamp of the spot they last displayed. An earlier ladder or frame is ignored for the label. See row below. |
| **REQ-022** | 2026-10-01 | Strike Ladder | OPEN | Spot row from the spot stream. Per-cell flash. Age pill amber past 5 s. Changed-cell tint. Src column removed. Last column inset from the window. Coach ordered this on the Runner page the same day. See row below. |
| **REQ-023** | 2026-10-02 | One ladder truth | OPEN | The last-key backup is not Coach's rule. One truth, or fail loudly, in the Analyzer and every other app. See row below. |
| **REQ-024** | 2026-10-03 | Canonical trade | OPEN | Abandon the August Tradier specs. The current direction is the canonical trade draft. See row below. |
| **REQ-025** | 2026-10-03 | Canonical trade | OPEN | Include the Practice trade log. See row below. |
| **REQ-026** | 2026-10-04 | Canonical trade | OPEN | The admin click view is in. Four trees. Count 0 of 3. Conor owns that view. See row below. |

### REQ-001 — ≥ 90 days of price on the chart (VP confirmation blocker)

**Captured:** 2026-09-19 (this session).  
**Track:** Volume Profile. **Priority: now.** Nothing else advances on the VP track first.

**Coach wording (addendum, 2026-09-19):**

> REQ-001 is not an enhancement. Without >= 90 days of price on the chart, Coach cannot validate the volume profile against known price structure — the VP product itself is UNCONFIRMED until this lands. Priority: now. Nothing else advances on the VP track first.
>
> Add one step after acceptance: Coach performs the visual cross-check — profile nodes and gaps against 3 months of price he knows. HIS confirmation, not the screenshot, is what marks the VP instrument CONFIRMED on the board. The screenshot only closes the range requirement.

**Prior statements (RL-1 process defect — stated ≥5 times without a row):** Data Delivery v1.0 D1 / T1 “≥ 3 months”; REQ-001 addendum; this packet “LONG OVERDUE”. Filed as REQ-001. Does not close conversationally.

**Acceptance split:**
1. **Range requirement** — screenshot of ≥ 90 days of price on the chart closes REQ-001's *range* half.
2. **Instrument CONFIRMED** — only Coach's visual cross-check (nodes/gaps vs 3 months of price he knows). Not the screenshot.

**Closes:** AP-1 or Coach withdraw. Not closed.

### REQ-002 v2 — TV-model settings dialog (hierarchical, context, light)

**Captured:** 2026-09-19. Addendum same day: hierarchical combined dialog; context right-click; light theme; our settings only.

**Coach wording (RL-1):**

> the same layout, the same control elements and components, the same sizes, everything the same as TV.
>
> current settings standards are "inadequate"; he wants "the exact model that TV uses."
>
> Light theme for the dialog: white background, black text.

**Visual contract:** `artifacts/references/REQ-002-settings-dialog-reference.png`  
**Git blob:** `bf9fa21ac600cfe0432f2651dcee9080d55258f4`  
**Spec:** `Specs/REQ-002-TV-Settings-Dialog-Fidelity-Spec-v2.md`  
**Measurement:** `artifacts/references/REQ-002-measurement-spec.md`  
**Inventory:** `agents/p-vp-chart-primitive/gate-reports/REQ-002-inventory.md`

Our option set only — do not clone TV fields we do not have. VP chart is first wire.

**Acceptance — AP-1 / PP-1:** headed screenshots on studiotwo:3000 member route — (a) dialog open, white/black, sidebar; (b) two right-click targets → two sections. Closure: Coach's own browser, his right-click. **OPEN until then.**

**Closes:** AP-1 or Coach withdraw. Not closed.

### REQ-003 FINAL — Symbol picker: TV pattern, role-aware registry, gray law

**Captured:** 2026-09-19. **Supersedes** REQ-003 v1–v4 and the addendum; this is the only build text.

**Coach wording (RL-1):**

> same method as TV for selection... unsupported unavailable or grayed out
>
> universe "about 20 or so" bound by ">= 3 expirations per week" because "we are focused on 1-5 DTE"
>
> futures supported "for other purposes"
>
> goal: "maximize the way we display available symbols."

**Visual contract:** `artifacts/references/REQ-003-symbol-search-reference.png` on **main**. Not on main → **do not dispatch, ask Coach.** Do not substitute another screenshot.

**Law (summary):** TV-fidelity picker; All/Futures/Stocks/Indices chips; full universe visible at rest; ES family expandable (ES1!/ES2! + strip contracts); dialect ES1! /ES @ES / ESZ6; interim 1! opens front labeled “opens front contract · continuous coming”; registry-driven roles **options** (SPX, XSP; ≥3 expirations/week) vs **price-structure** (ES, MES); gray real-but-unsupported with reason; eligibility report before adding ~20 options rows.

**Acceptance — AP-1 / PP-1:** headed studiotwo:3000 artifacts (a)–(e) per the FINAL packet. Closure: Coach's own browser, his clicks. REQ-003 in every status report until closed.

**Dispatch:** PNG on `origin/main` blob `f09d78735399a7d4fe78d13ee5fe21e3c4707ab6`. SYM3-G PASS (surface). SYM-SWAP-G PASS. **REQ-003 stays OPEN.**

**F1 amendment (2026-09-19, Coach-ruled):** replaces F1 clauses **2–3** only. Filed `artifacts/reqs/REQ-003-F1.md`.

> "full search" (tickers AND names both matched, substrings highlighted)
>
> "the current active and the forward contract are on top."

Typing "es" → ES family on top, front first, forward second, highlights visible. Clauses 1, 4–6 stand as issued.

**Closes:** AP-1 or Coach withdraw. Not closed.

### REQ-004 — Refactor sweep (after TOPO-1)

**Captured:** 2026-09-19. **HOLD** until TOPO-1 AP-1. R0 inventory then Coach-approved list; no R1 before that list.

**Coach wording:** TOPO-1 AP-1 → REFACTOR → HARDEN. R0: dead code, orphaned routes, fill remnants, fixture leftovers, overlay/redrawVp, L2/custom-series comments, duplicate symbol lists, hardcodes, TS-1 one-strike candidates, SYM-SWAP/migration seams. Triaged packets + effort — Coach approves before execute. R1: behavior-preserving; tests before/after; AP-1 in reverse; grep-proofs; line counts (DL-766 health, not a gate).

**Priority:** Open REQs, F3, TOPO-1, eligibility report stay first. This program starts only when that board is clear.

**Closes:** AP-1 (reverse) or withdraw. Not closed. Filed `artifacts/reqs/REQ-004.md`.

### REQ-005 — Hardening pass (after REFACTOR)

**Captured:** 2026-09-19. **HOLD** until REQ-004 closes.

**Coach wording:** H0 minimum: fail-loud/banner-law; auth seams (computed headers — what authenticates a member); dev-login gap; structure 500; STALE re-verify cadence; CP-1 watchdog + combined Massive budget; secrets/.env; restart-on-crash; backup/off-site + Sept-14 volumes/archive + one restore drill; CVE pass. SEV-ranked packets — Coach approves. H1: PP-1; StudioOne = CP-1 full dress; member-facing close AP-1.

**Closes:** AP-1 per member-facing seed or withdraw. Not closed. Filed `artifacts/reqs/REQ-005.md`.

### REQ-006 — Lookback is a fixed bar count per interval (v2)

**Captured:** 2026-09-19. **GO.** Supersedes calendar 90-day window (**deleted**, not retired).

**Coach wording:** "There should be a fixed number of intervals or candles we can go back, so it will be different for the different time chart intervals." · "Do away with the 90 day current model." · "It is intuitive, where ToS forces you to learn how it works."

N=5000 initial + 5000-bar pages. Cap at contract birth = COMPLETE. SHORT HISTORY only if shorter than N **and** more exists. Payload: bars_served, bars_rule, at_contract_birth. ToS aggregation pairs rejected for lookback (SYM-4.0 keeps ToS continuity).

**Closes:** AP-1 pan ES+MES every interval, pages to first-traded (Sep 2025 Z6). Filed `artifacts/reqs/REQ-006.md`.

### REQ-010 — Full SPX and XSP book, ceiling 2,500

**Captured:** 2026-09-28. **BUILD.** Spec v0.3. Plan v1.1 accepted with this amendment, recorded as plan v1.2.

**Coach wording:**

> The 750-contract ceiling is raised so every listed book is captured whole. New ceiling 2,500 contracts / 10 pages; a book past THAT fails loud. Rationale: SPX 2026-09-30 is 1,198 contracts and costs 1.14 s on a 15-second cadence; refusing it contradicts the ask. W1's ceiling test uses that book as the one that must SUCCEED, and a synthetic book over 2,500 as the one that fails.
>
> Storage planning figure: the last_updated-gated write, ~5.7 GB per session both names, as the plan already builds. The 12.8 GB figure is the bound, not the plan.
>
> Plan v1.1 accepted with that amendment. Dispatch W1 after India's W0-G and after the close.

**Closes:** W7 AP-1 (Wednesday screen on the existing expiry control) or Coach withdraw. Not closed.

### REQ-011 — W4 names the tree before the fullbook launchd load

**Captured:** 2026-09-28. **OPEN.** Plan v1.3. Spec v0.3 unchanged.

**Coach wording:**

> Add to Foxtrot's W4 gate, before any parallel launchd load: ssr_fullbook.py and its tests are present in ~/Fattail-Labs-mexp2 on StudioOne at the commit W1-G reviewed, the tests pass there in that tree's venv, and the fullbook_capture plist's script and working directory name that tree. Two trees is how Friday nearly lost a session; W4-G states which tree runs Tuesday's capture.

**Closes:** Coach AP-1 on W4-G's tree statement, or Coach withdraw. Not closed. W4 is not opened by filing this row.

### REQ-012 — Runner internal server errors

**Captured:** 2026-09-28. **OPEN.** Diagnostic only. Production was not changed.

**Coach wording:** Coach and members have had internal server errors viewing the Runner app (Options Lab) over the past few days. Find the cause. Inventory every 500. Correlate deploys, the Sep 25 collector change, Monday's slow session, the OPF API, and host sockets. Reproduce one 500 on StudioTwo if it can be done without load on production. Report, then a GO / NO-GO on a hotfix. The hotfix is its own packet on Coach's acceptance, after the close.

**Disposition:** `docs/Runner-500-Diagnostic-v0_1.md` (hotfix was **NO-GO** the night it was written) and `docs/Runner-Performance-Audit-v0_1.md`. Coach on 2026-09-28, recorded as DL-802: P1, P2, P3, and P5 approved. P5 after Tuesday 2026-09-29 close, one restart of `ai.fattail.labs.api`, evidence as the audit. P4 approved and scheduled last. It changes fill order. The 500 and the 502 are unchanged by it. On 2026-09-29 Coach ordered that restart again, after 16:00 ET, as its own step after the StudioOne chain_feed restart. P1 and P2 are written on StudioTwo and not yet on the MiniTwo process. P5 is the plist limit and rides that same restart. It has not been applied. P3 is the web job and is not part of the API restart. Not closed. The structural ladder spec is REQ-013, not a rewrite of this row.

### REQ-013 — Runner live ladder from the StudioOne data plane

**Captured:** 2026-09-28. **OPEN. ACCEPTED.** Plan v1.0 accepted (DL-803). Nothing built. Production was not restarted. W0 dispatched. W1 has not started.

**Coach wording:**

> Nothing else in Runner changes. No control, screen, selector, or default. Spec, for the bench to plan: production Runner's live ladder is served from the data plane on StudioOne, not from Massive inside the Labs API process on MiniTwo. State the design that already exists (LABS_MARKET_BUS / Redis ladders), what reaching it from MiniTwo requires under TOPO-1 (the bus, or a ladder route on the OPF API — the bench decides which and says why), and what the handler does when the bus has no fresh ladder (a stale-but-marked ladder, never a 60-second Massive wait on the request thread). The response JSON to the browser does not change. Wings cap stays at 50 until Coach rules otherwise. Parallel-run discipline: a canary member set or a staging host first, measured with P2's duration log, then production after a close. No Massive call remains on the Runner request path when this ships. Plan first; nothing built until Coach accepts.

**Disposition:** Spec `docs/Runner-Live-Ladder-Data-Plane-v0_1.md` unchanged. Plan v1.0 accepted and frozen. Plan v1.1 records the acceptance rulings: `:5055` confirmed, Tuesday's one API restart is P5 + P1 + P2 with no data-plane code, and the W3 canary is Coach's own identity plus one administrator identity. Coach names both ids before that close. No member identity is on the list. Inventory GO remains the Runner ladder only. W0 is dispatched. This row stays open.

**Closes:** Coach AP-1 on the production cut (spec §8: no Massive call on the Runner request path, one regular-hours hour of P2 durations inside the hop), or Coach withdraw. Not closed. Accepting the plan started W0. It does not close this row.

### REQ-014 — Member market path on the StudioOne data plane

**Captured:** 2026-09-29. **OPEN. ACCEPTED.** Plan v1.0 accepted (DL-805). Nothing built. Production was not restarted. W0 dispatched. Phase 2 has not started. Phase 1 is REQ-013 and is not this row.

**Coach wording:**

> Spec for the bench. Write it to docs/Labs-Member-Market-Path-Data-Plane-v0_1.md, commit, and plan it — the Runner ladder plan v1.1 is Phase 1 of this and is not re-planned. Show me the plan before any packet beyond Phase 1 runs. CP-1 on every StudioOne packet. No Labs control, screen, selector, or default changes anywhere in this program.

The spec text he supplied is the file. It is not restated here.

**Disposition:** Spec v0.1 and plan v1.1 are unchanged and are in commit `a01a3acc` with DL-800 through DL-805. Spec v0.2, plan v1.2, and DL-806 are in commit `a213a1f7`. Plan v1.2 is accepted (DL-807). Plan v1.3 moves the market-stream `_fetch_ladder` calls into Phase 1 W2–W4: same key, same last-document read, same 2-second budget. Phase 5 keeps positions valuation. The VP futures route stays the SODP-5 provider and is not a phase. Q1, Q2, and Q3 stand. The row 2 `stale` wording is corrected in spec v0.2. Canary ids on file for every phase: identity_id 10 and identity_id 12. No canary loads. W0-G is MATCH. Ladder W1 and W2 have not started. Phase 5 is not dispatched. Phase 3's job is a first standing-up of `ohlc_feed` on StudioOne. This row stays open. REQ-010, REQ-011, REQ-012, and REQ-013 stay open. Plan v1.3 and DL-807 are written and are outside `a213a1f7`.

**Closes:** Coach AP-1 on the program ship bar (spec §4: one regular-hours session after the last cut), or Coach withdraw. Not closed. Accepting the plan started W0. It does not close this row.

### REQ-015 — Ladder served from the full book

**Captured:** 2026-09-29. **OPEN.** Spec v0.1 is on disk. Proved on StudioTwo. Not on the live feed. Not on the live dash.

**Coach wording (2026-09-29):**

> Spec for the bench, dev-first on StudioTwo: the :5055 ladder route serves any wings window as a view over mb:book:{name}:{date} when that key is present, falling back to mb:ladder when it is not. chain_feed stops fetching per-wings topics for SPX and XSP once the full-book worker is live; six fetches per name per pass. The member response JSON does not change. Wednesday's parallel full-book run is the proof; if it is clean, this and the swap land on Wednesday's close together.

The same message orders tonight, after 16:00 ET, on StudioOne: land the dedicated SPX/XSP chain_feed workers in the tree pid 73931 runs from, restart chain_feed once, then the MiniTwo P5/P1/P2 restart as its own step. Wednesday's watch reports served-ladder age beside the stale fraction.

**Disposition:** Spec `docs/Ladder-Book-View-v0_1.md`. `{name}` is the feed symbol, key `mb:book:I:SPX:{date}` or `mb:book:I:XSP:{date}`. The view is proved on StudioTwo with no Massive call: wings 1 and wings 2 are two windows of one book, the member key set is unchanged, a missing book still serves hot then last, and an unreadable book is the existing 502. `LABS_CHAIN_FEED_BOOKS` unset stays on per-wings fetches, so tonight's feed restart does not stop them. The six fetches are the full-book worker's pass. Wednesday 09:30–10:00 reports the stale fraction and the age median, p90, and max, split hot versus last. The parallel run was not clean: the full-book job died on DNS at 09:19 ET. Coach, 2026-09-30: the book view, the feed switch, and the swap wait for a clean parallel day on Thursday. They were not landed. This row stays open. REQ-010, REQ-012, and REQ-013 stay open.

**Closes:** Coach AP-1 after the Wednesday close land, or Coach withdraw. Not closed. Filing the spec does not close this row.

### REQ-016 — Runner fast path item 1

**Captured:** 2026-09-29. **OPEN.** Proved on StudioTwo. In the mexp2 tree. Not started.

**Coach wording (2026-09-29):**

> The SPX and XSP workers are schedulers, not loops. Each book has its own 2-second timer that fires a fetch regardless of whether the previous fetch for that book has returned. Every request carries (book, sequence). Responses are assembled on arrival: the assembler writes a response only if its sequence is newer than the last written for that book, and discards it otherwise. In-flight requests per book are capped at the Massive concurrency Delta measured; a tick that would exceed the cap is skipped and counted, never queued. Write only when the quote clock moved. Prove on StudioTwo with recorded responses delayed at random 0.3–4 s: generations land on a 2-second grid, out-of-order responses are dropped, and the in-flight cap holds.

**Disposition:** `docs/Runner-Fast-Path-v0_1.md`. No earlier file used this title. `run_book_scheduler` is the fake-clock proof. `run_threaded_book_scheduler` is the same rules with the fetch off the timer thread. `live` calls that function, and that is the process Wednesday's parallel run starts once the cap is set. The in-flight cap is `LABS_FULLBOOK_IN_FLIGHT_CAP`, read before a Massive client is constructed. Missing or not a positive integer fails. There is no default in the code. The measured cap is 11, recorded in `docs/Massive-Concurrency-Finding-v0_1.md` and set on the StudioOne full-book plist. The grid proof's caps 3 and 1 are the test arguments. The grid proof passed cap 3. The skip proof passed cap 1. Recorded 2026-09-28 books, seed 20260929, delays 0.333–3.991 s, 120 requests, 108 writes on the 2-second grid, 12 out-of-order drops, peak in flight 2, skipped ticks 0 at cap 3. Cap 1 with a 3 s delay skipped the 2 s and 6 s ticks and did not start a fetch when the response arrived. A threaded replay of those books, real sleeps, seed 20260929, two SPX books, horizon 6 s, cap 3: three fires each, each within 0.5 s of the 2-second grid, skipped ticks 0, SPX 2026-09-30 stayed 1,198 contracts and 5 pages. Out of order, delays 2.6 s then 0.2 s, cap 2: sequence 2 arrived first and was written, sequence 1 was dropped, peak 2. Cap 1, delay 2.5 s, horizon 4 s: one send, one skipped tick, peak 1. The spot module is `server/market_data/spot_fast_path.py`, wake 1.0 s. Frames are `t`, `symbol`, `sequence`, `mid`, and `ts`, and `ts` is the tick. Seed 20260929, horizon 10 s, cap 3, delays 0.3–4 s, frames on the 1-second grid. Out of order drops sequence 1 and keeps sequence 2 at ts 1.0, mid 101.0. Cap 1, delay 3 s, horizon 4 s: sends at 0.0 and 3.0, two skipped ticks, peak 1. StudioTwo `pytest tests/test_ssr_fullbook_scheduler.py tests/test_spot_fast_path.py tests/test_ssr_fullbook_capture.py -q --noconftest` reported 21 passed in 13.92 s. The same command on StudioOne `~/Fattail-Labs-mexp2/server` reported 21 passed in 14.03 s. HEAD stayed `a91302a23b5944181e4ef1d7f58a78b76388a1cd`. `ssr_fullbook.py` stayed `03283277cfa3c49bd5514210fe705da07afdcd18552bb0aced957174a1ccef2f`. The full-book job is Disabled and not loaded. The plist now sets `LABS_FULLBOOK_IN_FLIGHT_CAP` to 11. The running chain-feed workers, pid 91469, remain the dedicated loop. `run_worker` remains for the cadence tests. `live` does not call it. This row stays open. REQ-010, REQ-012, REQ-013, and REQ-015 stay open.

**Closes:** Coach AP-1, or Coach withdraw. Not closed. The StudioTwo proof does not close this row.

### REQ-017 — Massive concurrency cap and Wednesday sym-feed interval

**Captured:** 2026-09-29. **OPEN.** Measured. Cap is on the plist. Neither job was started.

**Coach wording (2026-09-29):**

> Tonight, StudioOne, after chain_feed is confirmed stable (CP-1: state the footprint; chain_feed pid before and after; stop if Massive returns 429 to the feed during the probe): Delta measures Massive concurrency: from a throwaway process, fire N concurrent options-snapshot calls for SPX expirations, N = 2, 4, 6, 8, 12, for 30 seconds each; record per-N success rate, 429s or throttles, and p90 latency. The cap is the largest N with zero throttles and p90 under 1 s, minus one. Write it to docs/Massive-Concurrency-Finding-v0_1.md with the raw numbers, and set LABS_FULLBOOK_IN_FLIGHT_CAP to that value in the fullbook plist. If the probe cannot run by 21:00 ET, set the cap to 3 (the test value), note it as unmeasured in the plist comment, and the Wednesday report says so beside the overrun count. Also set sym_feed to --interval 1 in its plist for Wednesday's restart of that job only; the spot fast path starts with the full-book process at 09:30.

**Coach wording (2026-09-29, start time):**

> Wednesday start time: load the full-book job and restart sym_feed (--interval 1) at 09:15 ET, not 09:30, so both are warm and writing before the open. The live capture, chain_feed, band tap and dash are not touched. Everything else as planned: 09:30–10:00 watch with served-ladder age, stale fraction, spot frame cadence; clean → book view, LABS_CHAIN_FEED_BOOKS=on, and the swap after the close.

**Disposition:** Finding `docs/Massive-Concurrency-Finding-v0_1.md`. Feed pid 91469 before and after. No feed HTTP 429. Every N from 2 through 12 was success rate 1.0, zero throttles, p90 about 0.15 s. Cap is 11. The 21:00 fallback was not used. `ai.fattail.labs.fullbook-capture` has `LABS_FULLBOOK_IN_FLIGHT_CAP=11`, remains Disabled, and is not loaded. sym_feed's run script exec is `--interval 1` for the next start; the running process is still pid 82012 at `--interval 5`. The load and the sym_feed restart are 09:15 ET Wednesday 2026-09-30. The 09:30–10:00 watch is unchanged. This row stays open.

**Closes:** Coach AP-1, or Coach withdraw. Not closed.

### REQ-018 — Full-book retry and KeepAlive

**Captured:** 2026-09-30. **OPEN.** The parallel job was restarted. The retry is in the StudioTwo tree and is not on the running binary.

**Coach wording (2026-09-30):**

> Full-book job: restart it now — it is the parallel process, not the live path, and a transient DNS failure is not a reason to lose the session. Tonight, dev-first: the scheduler and the spot stream never exit on a network or DNS error; they log, back off (1 s, 2 s, 4 s, cap 30 s), and keep their timers. launchd KeepAlive on both jobs as the outer net.

**Disposition:** StudioOne full-book was restarted from the existing mexp2 binary. Cap stayed 11. Protected pids 73887, 91469, 74138, 85136, and sym_feed 4065 were unchanged. The on-disk KeepAlive is boolean true, and the loaded job shows the keepalive property without the old Crashed / SuccessfulExit dictionary. `gui/503` bootstrap from SSH still returns I/O error; `launchctl load -w` after bootout is what brought pid 5353 up. The spot-stream job does not exist, so its KeepAlive waits with that job. sym_feed was not reloaded. The StudioTwo scheduler and `run_spot_stream` log a network or DNS error, wait 1s then 2s then 4s, doubling, capped at 30s, and keep firing. A tick inside the wait is not sent and does not take a sequence. A ceiling, an absent book, and a Massive HTTP status are not that class. This row stays open.

**Closes:** Coach AP-1, or Coach withdraw. Not closed. Restarting the parallel job does not close this row.

### REQ-019 — Ladder document, not an age miss

**Captured:** 2026-09-30. **OPEN.** The age miss was withdrawn the same day. Not on the running StudioOne dash.

**Coach wording (2026-09-30):**

> Last-key serve during RTH: a shadow document older than 15 minutes is a miss, not a serve. Outside RTH the 18-hour rule stands so the next session has a document. The :5055 route enforces it; the hop does not change.

**Disposition (superseded the same day):** The age miss was written into the StudioTwo reader and then withdrawn before any production deploy. Dash pid 85136 was not restarted. `server/routes/chain_ladder.py` was not edited.

**Amendment (Coach, 2026-09-30), operative:**

> Amend: no 15-minute rule, in RTH or out. The :5055 route always serves the one document per book with its as_of. The only 502 is a book that has never been written. The member handler marks stale by age as it does today; the Runner chip already shows the provenance line and shows the age plainly when a document is older than a minute — that is the whole staleness UI, no control change.

**Disposition:** `read_resolved_plane_ladder` serves the document it holds — book when that key is present, otherwise hot, otherwise last — with that document's `as_of`. Age is not a miss, in or out of RTH. A book with neither document is the 502, served `""`. The 18-hour last-key TTL remains the Redis retention of the copy a hot hit writes. The member handler's stale mark is unchanged. The Runner chip was not given a new control. This row stays open.

**Closes:** Coach AP-1, or Coach withdraw. Not closed.

### REQ-020 — What the regular-hours misses are

**Captured:** 2026-09-30. **OPEN.** Bucketed. The hop was not changed. Feed interest was not changed.

**Coach wording (2026-09-30):**

> The 7% misses: the 502 bucketing by (symbol, DTE, wings) I asked for this morning decides the fix — expected to be feed interest for DTE ≥ 6 and unserved wings, not the hop.

The same message sets tonight's land as the scheduler with retry, the spot stream and tape, the spot label rewire, and the 15-minute rule. The book view, the feed switch, and the swap wait for a clean parallel day on Thursday. The 15-minute age miss in that land was withdrawn the same day. See REQ-019.

**Disposition:** The morning census was closed hours only, so it does not decide the regular-hours 7%. The 09:30–10:00 log has 119,311 `ladder_result` lines, 8,335 of them `served=miss` (0.0699). Same-status pairing within six lines covers 7,659 of those misses: calendar DTE below 0 is 7,618, DTE 0–5 is 4, DTE ≥ 6 is 37. Trading DTE ≥ 6 is 33. No requested wing clamps outside 10, 25, or 50. XSP is 7,632 and SPX is 27. The ten largest buckets are expired XSP. The 7% is not feed interest for DTE ≥ 6, and it is not an unserved wing. Detail is in `docs/Ladder-Watch-2026-09-30.md`. The hop was not edited. Feed interest was not edited. This row stays open until Coach accepts the bucket or withdraws the expected fix.

**Closes:** Coach AP-1, or Coach withdraw. Not closed.

### REQ-021 — Spot chip and center-spot marker

**Captured:** 2026-09-30. **OPEN.** Dev-first in `web/`. Not deployed.

**Coach wording (2026-09-30):**

> Add to tonight's land, dev-first: web/: the spot chip and center-spot marker keep the timestamp of the spot they last displayed and never replace it with an older one. A ladder document or spot frame whose as_of / ts is earlier than the displayed spot's is ignored for the label (the tiles still repaint from the document). When the spot stream is live it is the only source for the label; until then, the monotonic rule stops the flicker between hot and last-key generations.

**Disposition:** The heatmap chip and the center-spot marker keep `{spot, ts}` for the symbol. A candidate whose time is earlier is ignored. Equal time may replace the spot. While a spot frame has arrived for the symbol, the ladder document does not move the label. Until then, ladder `as_of` is the clock. Tile values, chain math, and `bus.spot` stay on the document. The spot stream is not started. This row stays open.

**Closes:** Coach AP-1, or Coach withdraw. Not closed.

### REQ-022 — Strike Ladder spot row, flash, age, tint

**Captured:** 2026-10-01. **OPEN.** Coach ordered the Runner page the same day. The member Strike Ladder template carries the behavior. Draft spec v0.1.2 still says the member table waits for acceptance; that sentence is behind the page.

**Coach wording (2026-10-01):**

> Spec for the bench, design seat first, mockup for Coach. Strike Ladder template only.
>
> 1. Spot row: bold, highlighted, nearest strike to spot, following the spot stream (not the chain generation).
> 2. Change flash: every numeric cell diffs against its own value in the previous generation; uptick flashes green, downtick red, unchanged nothing; fade ~600 ms. Stable row keys by strike, in-place update — state why the old flash stopped when the full data set landed and fix that cause, not a workaround.
> 3. Age pill beside the header: as_of, counting up, amber past 5 s.
>
> Mockup on dev against two recorded generations, then Coach approves. No new controls, selectors, or defaults. Add to the Strike Ladder spec:
>
> 4. Changed-cell tint: a cell that changed in the most recent generation keeps a background one step darker than the unchanged white after its flash fades, until the next generation lands. The tint carries no direction; the flash carries direction. Unchanged cells stay white. The design seat picks the two neutrals so the tint is visible but quiet, and shows both in the mockup against a recorded generation.

Later the same day:

> Also, I think the Src column can be removed, it is uninteresting.

Later the same day:

> There should be some right margin padding on the last column so that it is not pinned to the edge of the window.

**Disposition:** Draft `Specs/FatTail-Labs-Options-Lab-Heatmap-Strike-Ladder-Spec-v0.1.2.md` supersedes v0.1.1. Echo's unchanged white is `--color-surface` (`#ffffff`). The changed tint is `--color-surface-secondary` (`#f2f2f7`). The last column's right padding is `--space-8` (2rem). On 2026-10-01 Coach said the review page was not the request and ordered the Runner page. The member Strike Ladder (`HeatmapChainPanel`, template id `ladder`) now has the spot row, the per-cell flash, the age pill, the tint, no Src column, and the last-column inset. `mid_source` stays on the row. The cause is fixed in the hop: each served generation is parked so the next push can diff, and a full document that arrives while a generation is already on screen is diffed cell by cell before it replaces. The first paint does not flash. The spot stream is not started; the row follows the same held spot as the chip. This row stays open.

**Closes:** Coach AP-1, or Coach withdraw. Not closed.

### REQ-023 — One ladder truth

**Captured:** 2026-10-02. **OPEN.** The shadow copy is no longer served.

**Coach wording (2026-10-02):**

> I have said this backup strategy is completely wrong.

> If there is some sort of 15 min rule or backup that is something you concocted not me. I want iit fixed immediately.

> There can be only one truth. The analyzer and every other app in this system must report only the truth or fail loudly.

**Disposition:** The route was serving `mb:ladder-last` when the live `mb:ladder` key was absent, and a hot read wrote that shadow with an 18-hour TTL. That shadow is not a document. `read_resolved_plane_ladder` serves the book when that key is present, otherwise the live ladder key, and a missing live key is a 502. It does not write or read the shadow. The Analyzer drops an expiration whose fetch fails and takes the spot from the newest `as_of` among ladders the server actually returned. The local dash must be restarted for the running reader to load this. StudioOne's dash was not restarted. This row stays open.

**Closes:** Coach AP-1, or Coach withdraw. Not closed.

### REQ-024 — August Tradier specs abandoned

**Captured:** 2026-10-03. **OPEN.**

**Coach wording (2026-10-03):**

> We are abandoning the August Tradier specs and going this current direction

**Disposition:** DL-808 records the two August files superseded. The Tradier code tree and `migrations/124_member_broker_connections.sql` stay frozen. Draft v0.5 is the direction. The trade-log scope line is REQ-025. No series ID. No build stamp.

**Closes:** Coach AP-1, or Coach withdraw. Not closed.

### REQ-025 — Practice trade log is in the canonical-trade program

**Captured:** 2026-10-03. **OPEN.** Answer to the W0 scope line.

**Coach wording (2026-10-03):**

> Include it

**Disposition:** DL-809. The Tradier control is for the heatmap order block, the Analyzer, and the Practice trade log. Live Curate and the `strategy-lab-proto` generator stay off the list. The count on that three-surface list was 1 of 3, then DL-810 reset it when the admin view was ruled a fourth tree. Current count is DL-811: 0 of 3 on four trees.

**Closes:** Coach AP-1, or Coach withdraw. Not closed.

### REQ-026 — Admin click view is in; four trees; count 0 of 3

**Captured:** 2026-10-04. **OPEN.** Answer to DL-810.

**Coach wording (2026-10-04):**

> The admin click view IS part of this program. Four trees. Count is 0 of 3, as you reset it. Conor owns the admin view (C8).

**Disposition:** DL-811. Seated as `Specs/CT-1.md`. v0.7 draft unchanged. No stamp. No approval counted.

**Closes:** Coach AP-1, or Coach withdraw. Not closed.

## Closed

_(none)_
