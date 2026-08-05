# Strategy Lab — Versioning & Process Control Recommendations v1.2  
### Clarity of state · full control of work · flow discipline

**Status:** **RECOMMENDATION** (not yet full build authority — feeds future specs/PRs)  
**Date:** 2026-08-05 (v1.2: Claude review fold-in — sequencing rails, P8 clone, SoR metrics)  
**Product:** FatTail Strategy Lab  

**Builds on**

| Spec | Already locked |
|------|----------------|
| [`Strategy-Lab-Navigation-Continuity-Spec-v1.0.md`](./Strategy-Lab-Navigation-Continuity-Spec-v1.0.md) | Place memory (`localStorage`); version **explore ≠ restore**; restore = **minor** + `expected_head`; lifecycle `summary` |
| [`Strategy-Lab-Development-Phase-Spec-v1.0.md`](./Strategy-Lab-Development-Phase-Spec-v1.0.md) | Design: back test → forward walk → Deployed → Curate |
| [`Strategy-Lab-Strategy-Pack-Architecture-v1.0.md`](./Strategy-Lab-Strategy-Pack-Architecture-v1.0.md) | Packs, risk-adjusted primary metric, exit rules |
| [`Strategy-Lab-Portability-Spec-v1.0.md`](./Strategy-Lab-Portability-Spec-v1.0.md) | Whole-lab backup/restore of product data; replace_lab recovery blobs |
| [`Strategy-Lab-Architecture-Design-v1.0.md`](./Strategy-Lab-Architecture-Design-v1.0.md) | Phase bins, versionable product, lifecycle log |
| [`Strategy-Lab-Process-Runtime-Spec-v1.1.md`](./Strategy-Lab-Process-Runtime-Spec-v1.1.md) | Deploy runtime v1.1: handoff-first, Tradier, M0–M2 primary — applies P1–P8 |

**Coach direction (this note):**  
Full control of strategies created, work done, and **clarity of system state** are first-class. Continuity is place **and** version walking. Explore is free; restore is explicit. This document recommends **additional** features that are common in serious versioning systems and process-control / workflow tools, filtered for FatTail Labs (process over profit theater, fail loud, Family B privacy).

**v1.1 adds:** lineage & aliases, draft/dirty discipline, locks, retention, aging/WIP, DoR, freezes, drift, paper-before-live, self-signoff, handoff notes, gate severity.  
**v1.2 adds:** Claude review — **P8 clone-over-branch** elevated to principle; restore **minor** locked with continuity; Wave A **must** include `expected_head` + crude snapshot cap; process metrics from **SoR not place**; handoff note **server-side on card**; share-link named Privacy consumer; status strip empty-state uses charter line.

---

## 0. Design principles (filter for every recommendation)

| ID | Principle |
|----|-----------|
| **P1** | **Clarity of state** — member always knows: phase, phase_state, working version, explore lens, gates open/blocked, dirty/clean |
| **P2** | **Full control** — nothing important mutates without an intentional act (nav restore, explore, restore, promote, archive) |
| **P3** | **Deterministic trails** — audit and replay from events/snapshots, not AI narrative |
| **P4** | **Explore ≠ apply** — browsing history never silently becomes the working product |
| **P5** | **Process before P&L** — gates and metrics prefer risk/process outcomes; no win-rate theater |
| **P6** | **Fail loud** — missing snapshot, blocked promote, dirty leave: explicit messages |
| **P7** | **Family B** — version history and trails are identity-scoped; no peer leakage |
| **P8** | **Clone over branch** — traders think in **strategies**, not refs. Experiments = **clone card** (full life-cycle entity), not git-style branches inside one card |

If a “common industry feature” violates P1–P8, **do not ship it** (or ship a FatTail-shaped variant).

---

## 1. State clarity (recommended UI/system surface)

Members lose control when state is implicit. Recommend a single **status strip** (always visible when a strategy is selected):

```text
[Design]  Back test · pass  |  Forward walk · pending  |  Working v1.3.0  |  Viewing v1.1.0 (explore)  |  Clean
```

| Element | Shows |
|---------|--------|
| **Phase focus** | Design / Curate / Deploy (active bin) |
| **Gate chips** | Validation gaps (from Development Phase Spec) |
| **Working version** | Head semver on the card |
| **Version cursor** | “Working” vs “Exploring vX.Y.Z” |
| **Dirty** | Unsaved designer draft (warn on leave) |
| **Blocked next step** | e.g. “Promote blocked — forward walk required” |
| **Alias / pin** (later) | e.g. `known-good` · `candidate` next to working version |

**Recommendation priority:** **P0 — hold firm.** The status strip is what makes explore lens, dirty state, and blocked-next **legible**. Without it, explore ≠ restore exists in the data model but not in the member’s head — the continuity “landmine” warning comes true anyway. Do not demote this behind prettier boards or deeper explorer chrome.

**Empty status / empty work area** may surface the charter line (§11) as orientation copy, e.g.:  
*Know where you are, what you’re looking at, what changed, and what you’re allowed to do next.*

### 1.1 Desk-level state (board, not just card)

Common process-control surfaces that belong **above** a single card:

| Surface | Clarity it provides |
|---------|---------------------|
| **Bin capacity meter** | How full Design / Curate / Deploy are (0–100 already conceptual) |
| **Blocked / ready counters** | “3 ready to promote · 2 blocked on forward walk” |
| **Stale work highlight** | Cards not touched in N days (see §3.5 aging) |
| **Explore badge on chrome** | Global “you are exploring history on card X” so leave/nav doesn’t feel like product change |

---

## 2. Versioning features (common patterns → FatTail fit)

### 2.1 Already directed (do these)

| Feature | Fit | Notes |
|---------|-----|--------|
| Semver head | Shipped | major.minor.patch |
| Lifecycle log | Shipped | Enrich with `summary` + `detail` |
| Explore timeline | Spec’d | Read-only lens |
| Jump to latest | Spec’d | Exit explore |
| Explicit restore + confirm | Spec’d | New version after restore |
| Immutable snapshots | Spec’d | On material save + bump |

### 2.2 Strongly recommended next

| Feature | Why | FatTail shape |
|---------|-----|----------------|
| **Compare (diff)** | Complexity of pack JSON makes “what changed?” unreadable without diff | Side-by-side or structured diff of `butterfly_config@1` keys; highlight exit_rules / widths / metric |
| **Named checkpoints / tags** | Semver alone is opaque (“what was v1.4.0?”) | Optional tag: `pre-forward-walk`, `coach-review`, `after-batman-uneven`; not a branch |
| **Material change classification** | Not every keystroke deserves a version | Rules: pack save → snapshot; optional auto patch bump on material keys only |
| **Version list with summaries** | Explore needs a story | Timeline rows = version + log `summary` + relative time |
| **Restore preview** | Confirm before apply | “Will replace working config with snapshot v1.1.0; create **v1.4.0** (minor)” |
| **Pin “known good”** | Fast return to last validated config | Pin = tag + one-click explore; restore still confirms |
| **Version lineage** | Restores create non-linear history | Store `parent_version` / `restored_from` on each snapshot; show “restored from v1.1.0” in timeline |
| **Working draft vs HEAD** | Designer edits are not yet product | Dirty flag + Save creates snapshot; Cancel discards local draft only |
| **Changelog / release note** | Humans need “why this version” | Optional free-text `version_note` on bump (member-authored; process language encouraged) |
| **Semver bump policy surface** | Ambiguity kills trust | **Locked:** patch = note/meta; **minor = pack material (includes restore)**; major = pack family / breaking schema |
| **Restore HEAD precondition** | Multi-tab silent overwrite | Body `expected_head`; **409** if mismatch — **ships with restore, not later** |
| **Crude snapshot cap** | Unbounded growth while restore exists | Keep last N (default 50) + never prune pins — **ships with restore**; full policy may refine later |
| **Protected / pinned snapshots** | Prevent accidental GC of critical versions | Pins and `known-good` exempt from retention prune |
| **Snapshot retention policy** | Ops debt beyond crude cap | Wave C: promote-packet versions, FIFO prune rest with log event |

### 2.3 Recommended later (valuable, more cost)

| Feature | Why | Caveats |
|---------|-----|---------|
| **Branch / fork strategy** | Experiment without touching main line | **P8:** **clone card** only — no in-card branch UI |
| **Cherry-pick fields** | Restore only exit_rules from v1.2 | Powerful; easy to create invalid packs — only after full restore is solid |
| **Blame / annotate** | Who changed width? | Single-member Family B → lower value unless coach multi-actor later |
| **Time-travel whole lab** | Restore desk to Monday | Use portability pack + recovery blobs first; full lab time-travel is heavy |
| **Signed coach freezes** | Curriculum demos immutable | Admin/coach “publish template version” for teaching packs |
| **Version aliases** | `latest`, `stable`, `candidate` | Map aliases → semver; only one `stable` pin per card |
| **Side-by-side validation** | Compare two versions under same walk protocol | Run BT/FW against explore snapshot without promoting it to working |
| **Soft lock while editing** | Avoid double-tab overwrite of same card | Per-identity, per-strategy soft lock with TTL + “take over” confirm (richer than `expected_head` alone) |
| **Stash (scratch pad)** | Park half-finished designer work | Optional local or server draft stash; **not** a version until Save |
| **Broader conflict detection** | Explore then edit then save races | Wave A already requires `expected_head` on restore; later extend same precondition to pack save |

### 2.4 Avoid or reshape

| Common feature | Issue | Prefer |
|----------------|-------|--------|
| Auto-restore on click of old version | Violates explore ≠ restore | Explicit Restore button |
| Unlimited undo stack without snapshots | False safety | Snapshot + confirm restore |
| Force-push style history rewrite | Destroys audit | Append-only log; new semver |
| AI “summarize my edge as win rate” | Doctrine | Process summaries only |
| Hard delete of intermediate versions | Breaks lineage / audit | Soft-hide + retention prune with event |
| Automatic merge of two pack configs | Invalid composites | Full restore or clone + manual re-entry |

---

## 3. Process control over flow (workflow / stage-gate)

Strategy Lab already has a **flow**: Design → Curate → Deploy → Archive, with states inside each bin. Recommendations strengthen **control and clarity** without inventing new top-level phases.

### 3.1 Already directed

| Control | Spec |
|---------|------|
| Ordered phase_state in Design | Architecture + Development Phase |
| Back test before forward walk | Development Phase |
| Both validations + Deployed before Curate | Development Phase |
| Pack validate before promote | Pack Architecture |
| Capacity 0–100 per phase | Architecture |
| Archive off-board | Product UX |

### 3.2 Strongly recommended

| Feature | Purpose | FatTail shape |
|---------|---------|----------------|
| **Definition of Done per phase** | Clarity of “can I leave this bin?” | Checklist chips: Design = pack valid + BT + FW + Deployed; Curate = categorized… (fill as curation plugins ship) |
| **Definition of Ready (entry)** | Don’t start work you can’t finish | e.g. new Design card requires pack selected + name; promote-to-Curate requires DoD of Design |
| **Blocked-next with reason** | Full control | Promote / move buttons disabled + tooltip from `validation_gaps` / pack errors |
| **Gate severity (warn vs block)** | Process without theater | Missing optional note = warn; missing FW before promote = **block** |
| **WIP limits (soft then hard)** | Process control | Soft warn at N strategies in Design “Deployed but not curated”; hard stay at 100 |
| **Promotion packet** | Coach / self-review | Snapshot of validation@1 + pack summary required on promote (stored on card) |
| **Self-signoff** | Intentional promote even solo | Checkbox “I accept these gates / packet” logged with promote event (not a second person) |
| **Hold / parking state** | Pause without archive | Optional flag `on_hold` or phase_state only where valid — **prefer not** new phase; use note + tag |
| **Entry criteria for Deploy** | Mirror Design gates | e.g. Curate must reach `monitored` before Deploy (when curation depth ships) |
| **Exit criteria for Archive** | Intentional kill | Require `bin_reason` (already); optional structured reason codes |
| **Change freeze on live** | Stop quiet config edits while capital is at risk | When phase = Deploy and live/paper attached: edits require explicit “unfreeze / revise” → may demote or clone |
| **Paper / shadow before live** | Process control for capital | Deploy sub-states: paper → monitored live; never skip if product sells “live” |
| **Quarantine / invalid flag** | Isolate broken product | Pack fails validation after schema migration → `invalid` badge, block promote, allow fix or archive |

### 3.3 Flow visualization (clarity)

| Feature | Purpose |
|---------|---------|
| **Mini pipeline on card** | `H → M → BT → FW · Dep` ticks for Design; greys incomplete |
| **Board-level health** | Count blocked vs ready-to-promote in Design |
| **Activity pulse** | Last **material** work per bin from **SoR** (`lifecycle_log` / card timestamps) — **not** place `updated_at` |
| **Flow heatmap (simple)** | Where work piles up (Design Deployed-not-promoted vs Curate idle) — counts only, no P&L |

### 3.4 Governance (later)

| Feature | When |
|---------|------|
| Coach review gate | Multi-actor coaching product |
| Dual control on live capital | Tradier / Deploy live |
| Policy-as-code for promote | Enterprise / team books |
| Change advisory “window” | Ops calendar for team desks |

Not required for single-member Family B v1.

### 3.5 Aging, throughput, and bottleneck control (Kanban-common)

These are **process** metrics — never strategy returns.

| Feature | Purpose | FatTail shape |
|---------|---------|----------------|
| **Age in state** | Surface stuck work | Days since last **SoR** material event (`lifecycle_log` or phase_state change) — **never** place `updated_at` |
| **Stale threshold** | Soft process nudge | e.g. “14d in Design without validation progress” → board highlight, not auto-archive |
| **Throughput (optional)** | Am I finishing flow? | Count promotes / archives per week per member — private, Family B only |
| **WIP aging chart** | Little’s-law intuition without jargon | Simple list: oldest cards in each bin (SoR timestamps) |
| **Classes of service (later)** | Expedite vs normal | Prefer **one queue**; avoid multi-swimlane complexity until multi-strategy ops demand it |

**Doctrine filter:** aging alerts say “process stalled,” never “this strategy is losing money.”  
**Honesty filter:** place memory is **navigation-only**. Member-facing process nudges that claim “last worked” or “stale” must use SoR; otherwise a tab close or other device makes the metric a lie.

### 3.6 Handoff and session continuity (flow of *attention*)

| Feature | Purpose | FatTail shape |
|---------|---------|----------------|
| **Handoff note** | “What I was doing” | Optional one-line `next_action` on the **card (server-side)** — survives tab close, device switch after server place, and logout-restore of product. **Not** on place storage alone (place evaporates on logout; defeats the purpose). Shown when restoring place if present. |
| **Resume checklist** | Re-enter complex designer | Last designer step already in WorkSnapshot trajectory; pair with handoff note |
| **Dirty leave intercept** | Prevent silent loss of draft | Modal: Save · Discard · Cancel leave (standard editor pattern) |

---

## 4. Observability & control surfaces (common ops)

| Feature | Recommendation |
|---------|----------------|
| **Lifecycle log as first-class panel** | Timeline with `summary`; filter by event type; link to version explore |
| **Action replay** | From continuity spec §11 — playback events; never auto-apply |
| **Lab recovery blobs** | Shipped for replace_lab — model for “desk undo”; recovery gap closed |
| **Export before destructive** | Already SLP-15 spirit — reuse for restore and lab wipe |
| **Read-only share link** | Later: coach views member card with consent. **Named consumer** of Family B data — must enter **Member Data / Privacy** work as an explicit use case (consent capture, revocation, scope), not arrive as a surprise share path |
| **Integrity self-check** | “This card claims Deployed but validation@1 incomplete” → fail loud repair |
| **Config drift detection** | When live/paper exists: compare broker/runtime config hash to card HEAD; fail loud if diverge |
| **Audit export** | Member-initiated JSON/CSV of lifecycle_log + version list (Family B self-service) |
| **Event completeness check** | Periodic: every material attribute change has a log event + snapshot when required |
| **Idempotent re-run of gates** | Re-run pack validate / BT / FW without inventing versions; stamp “revalidated at” |
| **Rollback plan on promote-to-Deploy** | Later: require “known-good pin exists” before going live — process safety net |

---

## 5. Recommended build sequence (practical)

Aligned with current as-built and locked specs:

### Wave A — Clarity & trail (near-term)

**Status strip is P0 and first.** Restore does **not** ship without its own safety rails (items 5–7).

1. **Status strip** (phase · gates · working version · explore lens · dirty) — P0  
2. Lifecycle log `summary` + `detail` on all new material events  
3. Version **snapshots** on pack save + version bump  
4. Version **explorer** UI: list, inspect read-only, **Jump to latest**  
5. **Restore** with confirm + **minor** bump + `version_restore` log + **lineage** (`restored_from`)  
6. Restore **`expected_head`** precondition → **409** on mismatch (minimal multi-tab guard — not deferred)  
7. **Crude snapshot cap** (keep last N + never prune pins) — not deferred to full retention  
8. Dirty leave intercept + working draft vs HEAD  

### Wave B — Process control polish

9. DoD + DoR checklists + blocked Promote reasons (wire to existing gaps)  
10. Gate severity (warn vs block) on promote UI  
11. Structured pack **compare/diff** between two versions  
12. Named tags / pin “known good” + protect from prune  
13. Design pipeline ticks on cards (BT / FW / Deployed)  
14. Promotion packet + optional self-signoff on promote  
15. Board health: blocked / ready counts; **stale from SoR timestamps only**  

### Wave C — Replay, retention, deeper control

16. Action replay (single strategy first)  
17. Full snapshot retention policy (beyond crude cap)  
18. Soft lock / broader save conflict (extends `expected_head` pattern)  
19. Entry criteria Curate → Deploy when curation plugins mature  
20. Change freeze + paper-before-live when Deploy capital attaches  
21. Config drift detection vs runtime  
22. Optional **clone card** for experiments (P8 — never in-card branch UI)  
23. Lab-level checkpoint export (portability + label)  
24. Audit export of trail  
25. Read-only share link **only after** Privacy/Member Data names this consumer  

---

## 6. Explicit non-recommendations (for now)

| Idea | Why not (yet) |
|------|----------------|
| Git-style branching UI inside one card | Clone strategy is clearer for traders |
| AI auto-restore “best version” | Violates control + doctrine |
| Hidden auto-promote on green metrics | Gates must stay intentional |
| Public leaderboards of strategy versions | Privacy + profit-theater risk |
| Infinite undo without snapshots | False confidence |
| Auto-archive stale strategies | Too aggressive; use highlight + human archive |
| Multi-person approval for every Design save | Solo Family B friction; keep intentional promote |
| Profit-based WIP prioritization | Process doctrine violation |
| Silent schema “best effort” migration of old snapshots | Fail loud or explicit migrate tool |
| Real-time collaborative multi-cursor editing | Complexity; soft lock is enough |

---

## 7. Success metrics (process, not P&L)

How to know this worked:

| Signal | Healthy |
|--------|---------|
| Phase switches without re-finding cards | High continuity |
| Restore used with confirm; explore used more often | Explore ≠ restore internalized |
| Promote attempts blocked with clear gaps | Fail loud working |
| Lifecycle summaries readable by non-engineers | Trail quality |
| Fewer “lost config” support moments | Control + clarity |
| Dirty drafts saved or discarded on leave | No silent draft loss |
| Stale cards reduced without auto-kills | Process awareness |
| Drift alerts when live ≠ card (when live exists) | Runtime honesty |

Avoid: ranking members by strategy returns.

---

## 8. Feature catalog (quick index)

Common industry features and recommended disposition:

| Domain | Feature | Disposition |
|--------|---------|-------------|
| Versioning | Explore history | **Yes** (spec’d) |
| Versioning | Explicit restore + new version | **Yes** (spec’d) |
| Versioning | Immutable snapshots | **Yes** |
| Versioning | Diff / compare | **Yes** Wave B |
| Versioning | Tags / pins / aliases | **Yes** tags/pins early; aliases later |
| Versioning | Lineage (`restored_from`) | **Yes** Wave A with restore |
| Versioning | Changelog note | **Yes** optional |
| Versioning | Retention / GC | **Yes** Wave C |
| Versioning | Soft locks / conflict | **Yes** — `expected_head` with restore (Wave A); soft lock later |
| Versioning | Branch UI | **No** — **P8** clone only |
| Versioning | Cherry-pick fields | **Later** careful |
| Versioning | Blame | **Later** multi-actor |
| Flow | Stage gates (BT/FW/DoD) | **Yes** |
| Flow | Definition of Ready | **Yes** |
| Flow | Blocked-next + reasons | **Yes** |
| Flow | Warn vs block severity | **Yes** |
| Flow | WIP soft/hard limits | **Yes** (hard=capacity) |
| Flow | Aging / stale | **Yes** soft only |
| Flow | Promotion packet + self-signoff | **Yes** |
| Flow | Hold without new phase | **Yes** tag/note |
| Flow | Paper before live | **Yes** when capital |
| Flow | Change freeze on live | **Yes** when capital |
| Flow | Quarantine invalid | **Yes** |
| Flow | Auto-promote / AI gate skip | **No** |
| Ops | Status strip | **Yes** P0 |
| Ops | Lifecycle panel + replay | **Yes** trail then replay |
| Ops | Export before destructive | **Yes** |
| Ops | Drift detection | **Yes** with runtime |
| Ops | Audit export | **Yes** self-service |
| Ops | Integrity self-check | **Yes** |
| Attention | Place memory + handoff note | Place: continuity spec; handoff: **server card** later |
| Attention | Dirty leave intercept | **Yes** Wave A |

---

## 9. Summary recommendation

**Ship a coherent control stack:**

```text
CLEAR STATE     status strip (P0) + bin focus + empty-on-unknown place memory
                + board health (ready / blocked / stale from SoR)
FULL CONTROL    explore freely · restore only on confirm (minor + expected_head)
                · promote only when gates pass · dirty save/discard · no silent apply
HONEST TRAIL    snapshots + lineage + enriched lifecycle log → replay later
                · crude cap with restore · pins never pruned
FLOW DISCIPLINE DoR/DoD · blocked-next · warn vs block · WIP limits
                · paper-before-live · freeze when capital is live
CLONE NOT REFS  experiments are new strategy cards (P8)
```

That matches: full control of strategies and work, clarity of system state, and process control over the life-cycle flow — without turning Strategy Lab into a generic IDE or a bot factory.

---

## 10. Document history

| Date | Note |
|------|------|
| 2026-08-05 | v1.0 — Recommendations for versioning + process/flow control on top of continuity & Design validation specs |
| 2026-08-05 | v1.1 — Expanded catalog: lineage, draft/HEAD, retention, DoR, gate severity, aging/WIP, freeze/paper/live, drift, locks, handoff notes, feature index |
| 2026-08-05 | v1.2 — Claude review: P8 clone-over-branch; restore minor + Wave A expected_head/crude cap; SoR-only process metrics; handoff on card; share = Privacy consumer; status strip empty-state charter |

---

## 11. One-line charter

> **Know where you are, what you’re looking at, what changed, and what you’re allowed to do next — and never change the product without meaning to.**

**UI placement:** Prefer this line (or a short paraphrase) in the **status strip empty state** / empty work area orientation — not only in the spec footer.
