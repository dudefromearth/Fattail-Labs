# Strategy Lab — Navigation Continuity Spec v1.0  
### Place memory · focus · last-worked-on · path to replay & version restore

**Status:** **SPEC AUTHORITY**  
**Date:** 2026-08-05 (amended: Claude review fold-in — localStorage, restore minor, restore safety rails)  
**Product:** FatTail Strategy Lab (`/app/strategy-lab`, `/app/strategy-lab/archive`)  

**Parents / siblings**

| Document | Role |
|----------|------|
| [`Strategy-Lab-Architecture-Design-v1.0.md`](./Strategy-Lab-Architecture-Design-v1.0.md) | Board, suite chrome, work area |
| [`Strategy-Lab-Development-Phase-Spec-v1.0.md`](./Strategy-Lab-Development-Phase-Spec-v1.0.md) | Design validation (back test / forward walk) |
| [`Strategy-Lab-Strategy-Pack-Architecture-v1.0.md`](./Strategy-Lab-Strategy-Pack-Architecture-v1.0.md) | Designer / pack UI — high choice density |
| [`Strategy-Lab-Portability-Spec-v1.0.md`](./Strategy-Lab-Portability-Spec-v1.0.md) | Export of product truth (not session place) |
| [`Strategy-Lab-Versioning-and-Process-Control-Recommendations-v1.0.md`](./Strategy-Lab-Versioning-and-Process-Control-Recommendations-v1.0.md) | Recommended versioning + flow-control features beyond place/explore/restore |
| [`Strategy-Lab-Process-Runtime-Spec-v1.1.md`](./Strategy-Lab-Process-Runtime-Spec-v1.1.md) | Deployment plans, runners, decision log, Tradier handoff — **L2 trail fuel**; user+broker first |
| This document | **Where the member is**, **what they last touched**, and the trail that enables **replay** and **version restore** |

**Doctrine:** Continuity is part of trust. In a high-complexity desk, losing place is not a minor UX glitch — it **breaks cognition**. Switching phase must restore the last place in that bin, or show an honest empty work area. Never invent a different strategy as if it were the same. Fail loud when restore is impossible.

**UI phase labels:** Design · Curate · Deploy · Archive  
**Phase keys (API/DB):** `development` · `curation` · `deployment` · `bin`

---

## 0. Why this exists (product thesis)

### 0.1 Sheer complexity of choices

Strategy Lab is not a simple list app. A single Design-session card can involve:

- Phase + phase_state life cycle  
- Pack family (Batman dual-fly, single, BWB)  
- Widths, regimes, DTE, capital, primary metric, exit rules JSON  
- Rank / construct candidates  
- Back test and forward walk evidence  
- Version bumps, renames, lifecycle log  

When a member hops Design → Curate → Design, **re-finding** “the card I was configuring and the step I was on” by visual search is cognitively expensive and error-prone. **Focus** and **last-worked-on memory** exist so the desk absorbs that complexity:

> **The system remembers the place; the member remembers the thinking.**

Without place memory, every phase switch becomes a soft reset of context — unacceptable for FatTail process discipline.

### 0.2 Continuity is not cosmetics

| Without place memory | With place memory |
|----------------------|-------------------|
| Wrong card selected after nav | Last card in that phase |
| Work area shows another phase’s strategy | Work area always matches focused bin |
| Re-open designer from scratch | Return toward last work surface |
| “What was I doing?” | “I’m back where I left off” |

### 0.3 Same spine → replay and version restore (intent)

Place memory is the **first layer** of a longer product spine:

```text
Layer 1  PLACE          Where I am (phase + strategy + UI chrome)
Layer 2  ACTION TRAIL   What I did (append-only events — lifecycle_log + future action log)
Layer 3  VERSION        What the product was (semver + attribute snapshots)
Layer 4  REPLAY         Re-walk actions for teaching, audit, debugging
Layer 5  RESTORE        Return a strategy (or desk) to a prior version / checkpoint
```

**Coach intent (locked direction):**  
Focus and last-touched memory are valuable **because choices are complex**. That same continuity model must eventually support:

1. **Replay** — play back the sequence of actions that led to the current card (and optionally the path across phases).  
2. **Restore versions** — return pack config / strategy product to a prior version, explicitly and fail-loud.

v1 ships Layer 1 firmly; Layers 2–5 are specified enough to avoid dead-ends (see §11–§12). Implementation of full replay/restore may follow in later PRs without redesigning navigation.

---

## 1. Intent (v1 navigation)

When the member switches life-cycle phase — via **top suite nav** or by **focusing a phase bin** — the **work area** must:

1. Bind to that **active phase** (never show another bin’s card as if it were this one), and  
2. Restore the **last strategy** selected **in that phase**, if known and still valid, **or**  
3. Show the work area for that phase with **no strategy selected** if there is **no memory** (or memory is invalid).

### 1.1 Goals

| Goal | Meaning |
|------|---------|
| **Perfect continuity** | Re-enter Design → same card as last leave (if still in Design) |
| **Honest empty** | No memory → empty work area for that phase, not a random other card |
| **Shared model** | Top nav and bin focus behave identically for place restore |
| **No surprise SoR changes** | Phase *navigation* does not rewrite `phase_state` or pack config |
| **Trail-ready** | Place + lifecycle events are designed so replay/restore can attach later |

### 1.2 Non-goals (v1)

- Full action replay UI (specified as trajectory; not required to ship with place memory)  
- Full version-restore wizard (trajectory; uses existing version + log as foundation)  
- Multi-device place sync (optional later)  
- Auto-moving strategies on nav click  

---

## 2. As-built (2026-08-05)

| Capability | Status |
|------------|--------|
| Entire bin clickable (title, chrome, empty body) | **Shipped** |
| Strong selected-bin shadow + dim non-selected bins | **Shipped** |
| Per-phase last `strategy_id` in `localStorage` (survives tab close; clear on logout) | **Shipped** (`web/lib/strategyLabPlace.ts`) |
| Focus phase → restore last card or clear work area | **Shipped** |
| Top nav `?phase=` → same restore | **Shipped** |
| Work area only shows selection if it belongs to active phase | **Shipped** |
| Follow card on Promote/move into destination phase | **Shipped** |
| Designer step / scroll in WorkSnapshot | **Partial / later** |
| Action replay UI | **Not shipped** (spec trajectory §11) |
| Version restore UI | **Not shipped** (spec trajectory §12) |

---

## 3. Concepts

### 3.1 Active phase (focus)

The **active phase** is where work is occurring:

- `development` → **Design**  
- `curation` → **Curate**  
- `deployment` → **Deploy**  

**Focus** = which bin is “here” (visual lift + suite pill + work area binding).

**Archive** = separate route with its own place (§7).

### 3.2 Place (per phase)

```text
Place[P] = {
  strategy_id: string | null,   // last selected card that belonged to phase P
  updated_at: ISO-8601,
  work: WorkSnapshot | null     // UI chrome continuity (§3.3)
}
```

Only strategies with `phase === P` may occupy `strategy_id` for that place.

### 3.3 Work snapshot

**WorkSnapshot** restores UI chrome only — **not** server product truth.

| Layer | v1 | Later |
|-------|----|--------|
| Selected strategy | Required (`strategy_id`) | — |
| Designer stepper section | Optional | Preferred |
| Validation panel open | Optional | Preferred |
| Lifecycle log open | Optional | — |
| Scroll in work area | Optional | — |
| Unsaved field drafts | No (warn on leave) | — |
| Rank result cache | Optional clear | — |
| `phase_state` / version / attributes | From SoR on load | Snapshots for restore (§12) |

**Principle:** Restoring a place **re-selects** and **reopens chrome**. It does **not** mutate life-cycle or pack data.

### 3.4 Last-worked-on

**Last-worked-on** for phase P is exactly `places[P].strategy_id` (plus `work` when present).  
It is updated when the member **selects a card** in P or **saves meaningful work** while P is active (optional: any pack save / validation run keeps the same id and bumps `updated_at`).

---

## 4. Lab desk place model

```text
LabDeskPlace = {
  active_phase: "development" | "curation" | "deployment",
  places: {
    development: Place,
    curation: Place,
    deployment: Place
  }
}
```

Storage v1: **`localStorage`** key `ft.strategyLab.place.v1`  
Implementation: `web/lib/strategyLabPlace.ts`  

**Why localStorage (locked):** Place memory exists so the desk survives cognitive interruption. Tab close and overnight laptop sleep are the interruptions that matter most. `sessionStorage` is destroyed on tab close and would force a cold desk every new day — contradicting §0.1. Payload is strategy IDs and chrome state only (not pack secrets). Still per-device; cleared on logout. Server-side place remains optional later (Q1).

### 4.1 Write rules

| Event | Update |
|-------|--------|
| **Select card** in bin P | `places[P].strategy_id = id`; `active_phase = P` |
| **Focus phase P** (bin anywhere / top nav) | `active_phase = P`; **read** place[P] into work area |
| **Save pack / back test / forward walk / rename / version** | Keep `strategy_id`; SoR updates independently |
| **Move** strategy P → Q | Clear id from P if it matched; set Q’s place to id if following card; `active_phase = Q` when following |
| **Archive** | Clear id from board places; archive place may select it |
| **Missing / wrong-phase id on restore** | Clear place[P]; empty work area (§5) |

### 4.2 Read rules (switch to phase P)

1. Set focus: suite pill + bin “here” styling for P.  
2. Load `places[P].strategy_id`.  
3. If non-null **and** strategy still exists **and** still in phase P → select it; restore `work` if any.  
4. Else → **empty work area** for P (no strategy selected). Clear invalid memory.  
5. Work area content is **only** for that selection (or empty).  

**Critical:** Never leave a Design card selected in the work area while Curate is focused.

### 4.3 Empty-on-unknown (locked)

If there is **no memory** for phase P, or memory is invalid:

- **Do not** auto-select “most recently updated in P” as a fake continuity.  
- Show work area empty state for that phase.  
- Member picks a card or creates New.

(Optional soft notice later: “No previous selection in Curate.”)

---

## 5. Continuity break and repair

### 5.1 Invalid last strategy

| Case | Behavior |
|------|----------|
| Never set | Empty work area |
| Deleted | Clear place; empty work area |
| Exists but phase ≠ P | Clear place; empty work area |
| Exists in P | Restore |

**Forbidden:** Silently selecting another strategy in P (or any strategy in another phase) and pretending it is the previous place.

### 5.2 Move P → Q

1. If `places[P].strategy_id === movedId`, clear it.  
2. Set `places[Q].strategy_id = movedId` when following the card (**default after Promote**).  
3. Set `active_phase = Q` when following.

### 5.3 Unsaved designer edits

- Saved fields remain on server.  
- Dirty invalid JSON: warn on leave (“Unsaved exit-rules text will be lost”).  
- Prefer fail loud over silent discard.

### 5.4 Device place scope

| Scope | v1 |
|-------|-----|
| Storage | **`localStorage`** (`ft.strategyLab.place.v1`) |
| Survive refresh | Yes |
| Survive tab close / overnight | **Yes** (same browser profile, same device) |
| Logout / identity switch | **Clear** via `clearLabDeskPlace()` |
| Cross-device | Not required (Q1 server place later) |
| Export pack | Places **not** exported |

**Forbidden (v1):** Using place `updated_at` as a **process** metric (stale/aging). Place timestamps are navigation-only. Aging and “last worked-on” process signals MUST source from **SoR** (`lifecycle_log` / strategy `updated_at` on the card) — see recommendations doc §3.3 / §3.5.

---

## 6. Navigation surfaces (one model)

### 6.1 Top suite nav (Design · Curate · Deploy)

| Action | Behavior |
|--------|----------|
| Click phase pill | Focus that phase + restore place (or empty) |
| URL `?phase=` | Same restore on land |
| Archive | Separate page place |

Must **not** move strategies or reset phase_state.

### 6.2 Phase bins

| Action | Behavior |
|--------|----------|
| **Click anywhere on bin** (title, count, hint, empty body) | Focus phase + restore place |
| Click **card** | Select strategy; write place; focus phase |
| Sort control | `stopPropagation` — does not block focus when clicking chrome |
| Hop / Promote / Archive on card | Move + repair places |

**Hit target:** entire bin is selectable for focus, not only strategy rows.

### 6.3 Focus visuals (required)

| Bin | Visual |
|-----|--------|
| **Active** | Blue border + ring + **deep multi-layer shadow** (working column lifts) |
| **Inactive** | Dim + soft wash overlay; still readable and clickable |

### 6.4 Navigate vs move

| Verb | Meaning |
|------|---------|
| **Navigate / focus** | Change active phase + place restore only |
| **Move** | Change strategy’s `phase` in SoR (dropdown, hop, promote, archive) |

---

## 7. Archive place

```text
ArchivePlace = { strategy_id: string | null, updated_at: ISO-8601, work?: WorkSnapshot }
```

Storage: same `localStorage` desk blob may hold `archive: ArchivePlace` (or a sibling key `ft.strategyLab.archivePlace.v1`). **Write/read rules mirror §4** for the Archive route only:

| Event | Update |
|-------|--------|
| **Select card** on Archive page | `archive.strategy_id = id` |
| **Land on Archive** | Restore archive place if id still exists and `phase === bin`; else empty |
| **Restore from Archive → board** | Clear archive id if matched; set destination board place per §5.2 |
| **Board visit** | Board places **preserved** when visiting Archive and returning (do not wipe Design/Curate/Deploy places) |

Invalid / missing archive id → empty Archive work area (empty-on-unknown §4.3).

---

## 8. Work area binding

```text
active_phase = focused bin
selected     = places[active_phase].strategy_id after restore rules
work area    = empty | chrome for selected (must belong to active_phase)
```

Empty copy (example):  
“**Design** — no strategy selected. Click a card in this bin, or create one with + New.”

---

## 9. What must never jump unexpectedly

| Situation | Behavior |
|-----------|----------|
| Design → Curate → Design | Same Design card if still in Design |
| Focus bin with no memory | Empty work area |
| Top nav vs bin click | Identical restore |
| Reload `?phase=deployment` | Deploy place restore |
| List refresh after save | Keep selection if still valid |
| Background reload | Do not steal selection to “newest” |

---

## 10. Implementation map (as-built)

| Piece | Role |
|-------|------|
| `web/lib/strategyLabPlace.ts` | Load/save `LabDeskPlace` |
| `StrategyLabApp.focusPhase` | Focus + restore/clear selection |
| `StrategyLabApp.selectStrategy` | Write place for phase |
| `?phase=` effect | Top-nav restore |
| Bin `onClick` on whole column | Full-bin focus |
| Promote/move handlers | Follow card; clear origin place |

---

## 11. Trajectory: action replay (why place memory matters)

### 11.1 Intent

Members and coaches must eventually **replay** what happened:

- Teaching: “Watch how this Batman got to Deployed.”  
- Audit: “What did I change before the forward walk failed?”  
- Debug: “Which step introduced the bad exit_rules?”  

Replay is **not** AI improvisation. It is **deterministic playback** of recorded events.

### 11.2 Sources of truth for replay

| Source | Already exists / planned |
|--------|---------------------------|
| `lifecycle_log` on each strategy | Exists — rename, phase_move, pack_config_save, backtest, forward_walk, … |
| Version fields | Exists — major.minor.patch |
| `validation@1` evidence stamps | Exists — back test / forward walk |
| **Action log** (future) | Fine-grained UI/actions if lifecycle_log is too coarse |
| Place memory | Session only — **not** the replay tape; replay uses SoR events |

### 11.3 Replay product rules (normative direction)

| ID | Rule |
|----|------|
| R-1 | Replay reads **append-only** events; it does not invent steps |
| R-2 | Replay may **animate place** (which phase/card was active) when events include enough context |
| R-3 | Replay must label stub vs live evidence (honesty doctrine) |
| R-4 | Replay does not auto-mutate production state unless user confirms “restore” (§12) |
| R-5 | Process metrics over profit theater in any replay summary |

### 11.4 Continuity link

Place memory trains the product (and the member) that **context is first-class**.  
Replay extends that: not only “where am I now?” but “where was I at step N, and what did I do?”

---

## 12. Version walking (explore) vs restore (apply)

Continuity is not only **phase/place state**. It also includes **version walking**: the ability to move attention along a strategy’s version timeline without losing the thread of *where you are* in Design / Curate / Deploy.

### 12.1 Two distinct modes (locked)

| Mode | Purpose | Mutates working product? |
|------|---------|---------------------------|
| **Explore (version traversal)** | Browse / inspect previous (or current) versions — “what did v1.2.0 look like?” | **No** |
| **Restore** | Make a chosen historical snapshot become the new working product | **Yes** — only after **explicit choose + confirm** |

**Explore is only explore.**  
Selecting an older version in the explorer **must not** rewrite attributes, phase_state, or the live working config. It is a **viewing lens** (and optional side-by-side), not an implicit restore.

**Restore is only restore.**  
To change the working product, the member must:

1. Choose a specific version (or snapshot id),  
2. Confirm a clear destructive/constructive dialog (e.g. “Restore v1.1.0 into a new working version?”),  
3. Receive fail-loud errors if the snapshot is missing.

Jumping to **most recent / current working version** is part of **explore**, not restore — a one-click “Back to latest” that clears the exploration lens and shows head again.

### 12.2 Continuity = place + version cursor

```text
ContinuityContext = {
  place: LabDeskPlace,           // which phase + which strategy + UI chrome
  version_cursor: {
    strategy_id: string,
    mode: "working" | "exploring",
    exploring_version: string | null,   // e.g. "1.2.0" when exploring
    working_version: string             // head semver on the card (SoR)
  }
}
```

| Event | Behavior |
|-------|----------|
| Focus phase / restore place | Restore strategy; version cursor defaults to **working** (latest) unless session had an open explore lens on that card (optional v1.1) |
| Open version explorer | `mode = exploring`; show snapshot for `exploring_version` |
| Jump to most recent | `mode = working`; `exploring_version = null`; show live card |
| Confirm restore | Apply snapshot per §12.5; set working to new head; exit explore to working |
| Switch phase while exploring | Place rules apply; prefer **exit explore to working** on phase leave unless explicitly sticky (default: exit explore) |

### 12.3 Why version walking belongs in this spec

Pack and validation choices are dense. Members will:

- Bump versions often while iterating exit rules / widths / regimes  
- Need to **compare** “what I had before the last save” without committing to it  
- Need a safe path back to **latest** after browsing history  
- Need **restore** only when they mean it — never as a side effect of clicking an old version  

Without a hard split between explore and restore, version UI becomes a landmine.

### 12.4 Foundations already present

| Capability | Role |
|------------|------|
| Semver on card (`version`, major/minor/patch) | Working head identity |
| `lifecycle_log` (`version_bump`, `pack_config_save`, …) | Timeline skeleton for explorer |
| Attributes bags | Payload that snapshots must capture |
| Portability export | Offline whole-lab backup |

### 12.5 Gaps to close (build)

1. **Version snapshots** — on each material pack save and each version bump, persist immutable snapshot:  
   `{ version, at, attributes, name, description, validation_ref?, parent_version? }`  
2. **Explore API / UI** — list versions; load snapshot **read-only** into explorer panel; **Jump to latest**.  
3. **Restore API** — body must include:  
   ```text
   { from_version, confirm: "RESTORE_VERSION", expected_head: "<current working semver>" }
   ```  
   Apply snapshot into working attributes; mint **new minor** semver (locked — restore is pack-material); set lineage `restored_from` / `parent_version`; log `version_restore`.  
   **If `expected_head` ≠ current working version → 409** (fail loud; no silent overwrite).  
4. **Enhanced lifecycle log** (§12.6) — human-readable descriptions for timeline/replay.  
5. **Place after restore** — same `strategy_id` + phase; version cursor → working head; refresh work area from SoR.  
6. **Crude snapshot cap (with restore, not later)** — keep last **N** snapshots (default N=50) **plus** all pinned / known-good; never prune pins. Full retention policy may refine later; an unbounded store is not acceptable while restore ships.

### 12.6 Restore rules (normative)

| ID | Rule |
|----|------|
| **V-1** | Restore requires **explicit choose + confirm**; never on mere explore selection |
| **V-2** | Explore never mutates working attributes / phase_state |
| **V-3** | “Most recent” control always returns to **working head** (explore exit) |
| **V-4** | Restore always leaves an audit event (`version_restore`) with from→to versions |
| **V-5** | Prefer **new semver after restore** (do not rewrite history of old snapshots) |
| **V-5a** | Restore bumps **minor** (pack material), not patch — aligned with semver policy |
| **V-6** | Cannot restore across identity ownership |
| **V-7** | Replay may *show* an old version; restore *applies* it (same distinction as explore vs restore) |
| **V-8** | Missing snapshot → fail loud (422), do not partially apply |
| **V-9** | Restore requires `expected_head` matching current working version; else **409** (multi-tab / stale client safety) |
| **V-10** | Snapshot store applies at least a crude keep-last-N (+ pins) cap when restore ships |

### 12.7 Enhanced lifecycle log (required for explore / replay)

Today’s log events are often machine-short (`pack_config_save`, `version_bump`). For version walking and later replay, each material event **SHOULD** carry a **human description** and structured detail:

```json
{
  "at": "ISO-8601",
  "event": "pack_config_save|version_bump|version_restore|backtest|forward_walk|phase_move|rename|…",
  "version": "1.3.0",
  "summary": "Saved Butterfly config: Batman, matched widths 40, Sortino primary",
  "detail": {
    "pack_id": "butterfly",
    "changed_keys": ["exit_rules", "debit_to_width_max"],
    "from_version": "1.2.0",
    "to_version": "1.3.0"
  }
}
```

| Field | Role |
|-------|------|
| `summary` | One-line member-facing timeline text (required for new events going forward) |
| `detail` | Structured fields for replay filters and restore UI |
| `version` | Card version **after** the event (when applicable) |

**Minimum events to enrich first:** `pack_config_save`, `version_bump`, `version_restore`, `backtest`, `forward_walk`, `phase_move`, `rename`.

Legacy events without `summary` may show a fallback label derived from `event` (e.g. “Version bump”).

### 12.8 Continuity link

| Layer | Question answered |
|-------|-------------------|
| Place memory | Which **phase** and **card** was I on? |
| Version cursor (explore) | Which **version lens** am I looking through? |
| Working head | What is the **live product** right now? |
| Restore | Make a past snapshot the new live product — **only on confirm** |
| Replay | Walk the **story** of how we got here |

Last-worked-on reduces accidental loss of **place**.  
Version explore reduces accidental loss of **understanding**.  
Version restore recovers from mistaken deep edits — never by surprise.

---

## 13. Acceptance criteria

### 13.1 Navigation / place (v1 ship)

| # | Criterion |
|---|-----------|
| 1 | Select A in Design; focus Curate; focus Design → A selected if still in Design |
| 2 | Focus phase with no memory → work area empty (no auto-pick) |
| 3 | Top nav and full-bin click produce same restore |
| 4 | Work area never shows another phase’s card while bin P is focused |
| 5 | Promote follows card into Curate and sets Curate place |
| 6 | Invalid `?phase=` restores that phase’s place |
| 7 | Nav focus does not mutate phase_state |
| 8 | Invalid bin shadow + dim non-selected bins |

### 13.2 Version explore / restore (design acceptance — build when snapshots land)

| # | Criterion |
|---|-----------|
| 9 | Selecting an older version in explorer does **not** change working attributes |
| 10 | “Jump to most recent / latest” returns to working head without confirm dialog |
| 11 | Restore requires explicit version choice **and** confirm token/dialog |
| 12 | Restore writes `version_restore` with summary + from/to versions; bumps **minor**; records lineage |
| 13 | New material events include human `summary` on lifecycle_log |
| 14 | Restore with mismatched `expected_head` returns **409** and does not apply |
| 15 | Snapshot store keeps last N (+ pins); does not grow unbounded without a cap |

### 13.3 Replay / export (later)

| # | Criterion |
|---|-----------|
| 16 | Replay reads append-only events; does not invent steps (documentation + later behavior) |
| 17 | Place memory remains orthogonal to export pack |
| 18 | Process aging/stale metrics (if shown) source SoR timestamps, not place `updated_at` |

**Note:** “Replay sources defined without requiring AI” is a **documentation acceptance** on §11–§12; it is not a runtime behavior check.

---

## 14. Open questions

| # | Question | Default |
|---|----------|---------|
| Q1 | Server-side place for cross-device? | **Not required v1** — device **`localStorage`** is the v1 answer; server place optional later |
| Q2 | Snapshot on every pack save or only version bump? | Every material pack save + every version bump |
| Q3 | Replay scope: single strategy vs whole lab desk path? | Single strategy first; desk path later |
| Q4 | Soft notice when empty-on-unknown? | Optional |
| Q5 | Semver after restore: patch vs minor? | **Locked: minor** (pack material; matches recommendations §2.2 policy) |
| Q6 | Sticky explore lens across phase switches? | **No** — exit to working on phase leave (v1) |
| Q7 | Crude snapshot N default? | **50** (+ never prune pins) until full retention policy |

---

## 15. Document history

| Date | Note |
|------|------|
| 2026-08-05 | v1.0 — Per-phase place memory; bin focus visuals; full-bin hit target |
| 2026-08-05 | v1.0.1 — Complexity rationale; empty-on-unknown; as-built place memory; **replay** and **version restore** trajectory |
| 2026-08-05 | v1.0.2 — **Version explore ≠ restore**; jump to latest; version cursor in continuity; enhanced lifecycle `summary` for walking/replay |
| 2026-08-05 | v1.0.3 — Claude review: **`localStorage`** (not sessionStorage); restore = **minor** + `expected_head` 409 + crude snapshot cap; archive place rules; process metrics SoR-only |

---

## 16. Coach lock summary

> **Focus and last-worked-on memory exist because Strategy Lab choices are too dense to re-discover on every phase hop.**  
> Switching Design / Curate / Deploy restores the last card in that bin — or an honest empty work area if none is known.  
> Place memory **survives tab close and overnight** on the device (`localStorage`); logout clears it.  
> Continuity also includes **version walking**: explore prior versions freely (and jump to the most recent) without changing the working product; **restore only on explicit choose + confirm**, with **minor** bump, lineage, and `expected_head` safety.  
> Richer lifecycle **summaries** feed explore, replay, and restore — deterministic trails, not AI guessing.
