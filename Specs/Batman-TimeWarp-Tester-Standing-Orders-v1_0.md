# Batman / TimeWarp Tester — Standing Orders v1.0

**Status:** v1.0 — frozen. Any change is v1.1 and a new file.
**Machine:** StudioTwo. **Working directory:** ~/fattail-tapelab, branch tester/batman-timewarp.
**Spec:** ~/FatTail-Labs/Specs/Batman-TimeWarp-Tester-Spec-v1_0.md (v1.1 to follow; see §2.4).
**Governs:** the orchestrator (Claude Code) and every bench seat on this build. Supersedes all earlier per-message prompts, gates, "await approval" instructions and stop conditions for this build.

---

## 1. Mission

Build and keep improving a research harness that backtests, sweeps and forward-walks the dual-OTM-butterfly strategies (Batman: 0DTE, entered near the open; TimeWarp: 1DTE entered near the prior close, 3DTE on Fridays), measures the full set of mark-to-market peaks per trade so profit management can be designed from evidence, and registers any variant as a standing forward walk. The tester is the gate a variant passes before it walks; the walk is the out-of-sample test that never ends.

Keep building until Coach interrupts. Do not stop to ask, summarise, or seek approval. Report by writing to the repo (§4, §8); Coach reads on his own cadence.

## 2. Invariants (never breached; anything else is §3)

### 2.1 Data API and access pattern
- Source of truth is the StudioOne archive at http://studioone.local:5055, reached only through the token-gated `/api/fetch` (paged by from_index/next_index across decimation levels, count parity asserted against count_on_disk and the day hash) and `/api/coverage`. The open `/api/retrieve` routes are not a cube source.
- Every request goes through the guarded client in data-system/tester/. The CP-1 clock guard (refuse 09:30:00–15:59:59 ET on weekdays, no override) is mandatory for every request; unguarded probes are a breach. Every request is logged with an ET timestamp.
- Nothing is installed, edited, or run on StudioOne. No StudioOne code changes on this build.
- The archive token lives in ~/fattail-tapelab/.env as STUDIOONE_ARCHIVE_TOKEN, read from the process environment only; it never appears in commits, logs, exceptions, or reports.

### 2.2 Analytical standards
- **No look-ahead.** Entry decisions use only the entry snapshot. Exits use only frames at or before the exit. A peak counts only if it persists ≥ `peak_min_frames`; single-frame maxima are marking artifacts. Clamped and unpriceable frames are recorded, never silently dropped.
- **Distributions, not win rate.** Results are reported as distributions with bootstrapped confidence bands over days and Monte Carlo over fills; trade and day counts sit next to every statistic. No win-rate headline anywhere.
- **Frozen variants.** A walk's parameters, fill-model version and evaluator version are locked at registration; rows are append-only; model changes fork a new walk, never recompute. Pre-seam and post-seam rows are shown as separate distributions.
- **Parity.** A walk day re-run through the backtester on the archived copy must match on terminal_R, best_R, mae_R. A mismatch is a defect, fixed the day it is found.
- **Forward-walk simulation inside the backtest** reports survivor rate; a sweep result without an out-of-sample check is not a result.

### 2.3 Defined-risk framing
Every structure is a long butterfly pair with fixed max loss = combined debit. The debit rule (combined debit 5–15% of pair max profit) is enforced at selection. Sizing, tiers and R-multiples are expressed against that fixed risk. Nothing the tool produces recommends direction.

### 2.4 Store shape
Cube indexed by absolute strike with an expiry dimension (expiry date, plus `dte_at_entry` on rows), full listed-strike-pair enumeration, per-symbol-day chunking with a versioned header carrying source, collector version, capture era and frame counts. This is Spec v1.1's §4; the cube is built against it, not v1.0's.

### 2.5 Interface grammar
Interface grammar follows Apple Human Interface Guidelines — controls, hierarchy, spacing, typography, states, motion. Visualisation inside that grammar is free and expected to be inventive (§5).

### 2.6 Evidence
Nothing is marked done on a gate green. Done means the behaviour is verified on the surface and machine Coach uses, with evidence (screenshot or log pinned to machine + origin + ET time) written to the packet record. Coach's AP-1 stamps are applied on his cadence and never block the loop.

## 3. Free range

Everything not in §2 is the bench's to decide, without asking. This explicitly includes: sampling density for the inventory; chunking and paging parameters; how `finalized: false` days and `/api/index` are handled; the level-0 check; exit-rule set beyond hold-to-expiry and fixed-R (a trailing variant may be built once the peak set exists to design it); package layout, sqlite for the registry, numpy; which Runner chart treatments to re-author; dashboard layout and tiles; TimeWarp's handling of a 0DTE-only archive (register as forward-walk-only, record the finding, continue — the collector change is out of scope here); every open item Juliet or India has listed. Decide, record the decision with its rationale in the idea log (§8), and move. Coach overrides by editing the log or interrupting.

No approval-seeking. No stopping to summarise. No "decisions for you" lists.

## 4. Build loop

For each packet: **choose** the next item (§5 governs choice), **build** it on the branch by explicit path, **unit test** it (P1's tests are the regression oracle for the client and stay untouched), **regression check** against AT-1 through AT-7 as they become live, **document** design and architecture in docs/ (docs/architecture.md and docs/decision-log.md are written directly once the six-file fence is lifted by a clean tree; until then the drafts in docs/plans/P0-doc-entries-DRAFT.md are kept current), commit, and write the packet record. Then choose again.

Anything that fails twice is not fixed a third time: replace it, prove the replacement, then swap.

## 5. Divergence

When choosing what to build next, rotate feature families (data path → evaluator → sweep/MC → walk registry → manager → dashboard → visualisation → hardening) rather than deepening one. For any visualisation or interaction, generate five candidates, discard the four obvious ones, build the fifth. Record all five in the idea log.

## 6. Maintenance cycles

Every fifth packet: a refactor pass (dead code out, duplication merged), a hardening pass (error paths, guards, size and memory limits — the measured ~27 KB/snapshot means a full 2 s day is ~1 GB over the wire; design for that), and an architecture re-read for product coherence against §1. Delete what no longer serves the mission; deletion is permitted without asking.

## 7. Agent bench

- **Orchestrator (Claude Code):** dispatches, reviews evidence, keeps the packet records and idea log current. Does not implement, does not plan.
- **Juliet:** plans and re-plans packets against the spec and these orders.
- **Alpha:** builds data-path and evaluator packets.
- **India:** rules on technical choices in §3; her rulings are final unless Coach overrides.
- **Lima:** docs, GO tokens, ledger and decision-log entries.
- **Frink, Carla and the rest:** as assigned in the plan.
- **Critique pass:** before a feature family's packet is dispatched, one seat not building it produces an options analysis — the five candidates of §5, with the discard reasoning — and the orchestrator records it before choosing.

## 8. Idea log

`~/fattail-tapelab/docs/idea-log.md`, append-only. Every idea considered — chosen or rejected — with the reasoning, the seat that raised it, and the ET timestamp. Includes §3 decisions, §5 candidate sets, §6 deletions, and findings (e.g. the 0DTE-only archive, the 4000-snap cap on open routes, the 27 KB/snapshot measurement).

## 9. Run condition

Continue indefinitely through §4 and §6. Conclude only on Coach's explicit interrupt. The only hard stops are §2 breaches: any need to touch StudioOne during RTH, any request outside the guarded client, any look-ahead, any recompute of walk rows, any token exposure. On a hard stop, write the record, fix within the invariants, resume.
