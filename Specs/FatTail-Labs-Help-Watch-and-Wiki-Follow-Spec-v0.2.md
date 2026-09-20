# FatTail Labs — Help Watch and Wiki Follow Spec v0.2

**Status:** DRAFT **BASELINE FREEZE** — 2026-09-15. **SUPERSEDED as working text by v0.3.** Keep on disk; do not plan or build against this file.  
**Successor:** [`FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.3.md`](./FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.3.md)

**Original status:** DRAFT — v0.1 baseline freeze + Claude F-1…F-5 + Coach OD ticks (2026-09-15). **Not BUILD AUTHORITY.**  
**Program:** Help Watch (new seat) + Wiki Follow (existing Wiki agent / S1 poller, extended).  
**Supersedes as working text:** [`FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.1.md`](./FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.1.md) — **baseline freeze; leave on disk.**  
**Coach Phase 0 (verbatim job, carried — not dropped):** an agent that knows what changes have been made to apps, decodes whether a Help-file update is necessary, then **makes those changes**; the Wiki agent watches the Help agent’s updates and makes changes, additions, or updates to the Wiki.

**Parents (unchanged — do not re-open):**
- [`FatTail-Labs-Help-Concierge-Spec-v1.2.md`](./FatTail-Labs-Help-Concierge-Spec-v1.2.md) — whitelist `server/help_reference/*.md`; file present = published; **DL-572** catalog
- [`FatTail-Labs-Wiki-Source-Contract-Spec-v0_1_4.md`](./FatTail-Labs-Wiki-Source-Contract-Spec-v0_1_4.md) — S1 Help is **poll**; **poll ≠ subscribe**; **L4** no invented substance; **L9** Wiki never writes Help; **L11** publication-worthy only; **L12** thin decline
- [`DRAFT-Wiki-Authoring-Agent-Spec-v0_1.md`](./DRAFT-Wiki-Authoring-Agent-Spec-v0_1.md) — colleague that already knows the surface and speaks coverage first

**Does not supersede** Help Concierge retrieval, Wiki L9, or Coach’s poll≠subscribe ruling. This spec adds a **writer in front of Help files** and a **follow path into Wiki**.

**Do not re-open:** L4 / L9 / L11 / L12 · poll≠subscribe · DL-572 · concierge whitelist · standing freezes (matcher FIFO, `AnalyzerPositionsList.tsx`, LIM / QFRIC / XS product files).

---

## Changes since v0.1

| # | Change | Driven by |
|---|--------|-----------|
| 1 | **OD-HW-1** earned autonomy: PR-first calibration window, then straight-to-main after precision proven (**D-B1-10 pattern**). Branch is the draft state, **outside** `help_reference/` — DL-572 folder stays publish-on-presence | **F-1** · Coach tick HW-1 ladder |
| 2 | Self-trigger guard: watermark advances past Help Watch’s own commits; own author identity excluded from decode | **F-2** |
| 3 | Watermark storage named: `agents/p-help-watch/watermark.json` | **F-3** |
| 4 | Acceptance: golden-set calibration run (replay PPL2/PPL3) | **F-4** |
| 5 | §2.2 reverts on `main` decode symmetrically | **F-5** |
| 6 | **OD-HW-2…5** ticked: new seat · explicit allowlist · follow-on same-day commit never same-SHA · StudioTwo only | Coach ticks |

Coach Phase 0 job, two-agent split, Wiki poll door, concierge whitelist, and isolation table are **carried**. Nothing from v0.1 Coach text is dropped.

---

## Claude review disposition (v0.1 findings; all carried, none dropped)

| Finding | Disposition |
|---------|-------------|
| **F-1** OD-HW-1 / `_draft/` vs DL-572 | **Resolved.** Ladder: PR-first until precision proven, then straight-to-main. Branch = draft. No `help_reference/_draft/` |
| **F-2** Self-trigger | **In.** Watermark + author exclusion (§2.7) |
| **F-3** Watermark location unnamed | **Named.** §2.7 |
| **F-4** No golden-set acceptance | **In.** §6 item 6 |
| **F-5** Reverts not decoded | **In.** §2.2 |

---

## 0. Why

Help and Wiki do not watch the product. They only know what a human wrote into `help_reference`. Trade Log PPL2/PPL3 (partial-residual, API 422, DELETE 409, kit confirm) shipped on `origin/main` (`9e7659e9`) with **no** Help file change. Members asking Help still get Open / Complete / Orphan close and sheet-only warnings.

Coach’s wanted loop (carried):

```text
app change on main  →  Help Watch decides  →  Help files change
                                              ↓
                                    Wiki agent sees Help updates
                                              ↓
                                    Wiki pages change / add / update
```

---

## 1. Two agents, two jobs (do not collapse)

| Agent | Job | Writes | Does not write |
|-------|-----|--------|----------------|
| **Help Watch** | Know what changed in **apps**. Decode whether member Help must change. **Make the Help-file changes.** | `server/help_reference/*.md` only | Wiki pages, product UI, matcher, LIM/QFRIC/XS, PPL product |
| **Wiki Follow** | Watch **Help Watch’s updates** (the published Help catalog those files become). Change, add, or update Wiki pages. | Wiki git pages (existing Wiki writer) | Help files (**L9**) |

Wiki already **polls** `GET /api/help/guides` (`poll_help_source`). That poll is the machine door. This spec does **not** turn Wiki into a GitHub subscriber. Help Watch may be triggered by a push to `main`; Wiki still **polls Help**.

**Seat (OD-HW-2):** Help Watch is a **new seat**. Callsign OPEN (Coach names; sitcom seat if the NATO set is exhausted). Wiki Follow is **not** a second new seat — it is the existing Wiki poller + Wiki agent operator door.

Board: `agents/p-help-watch/`.

---

## 2. Help Watch

### 2.1 What it knows

On each relevant `origin/main` push (or an equivalent poll of `main` if webhook is later), Help Watch reads:

- the commit range vs the last Help-Watch watermark (§2.7)
- paths on the **explicit allowlist** (§2.8) that change **how a member sees or operates an app** (routes, chrome, sheets, named states, save/delete/close, Autofilter, Help files themselves)
- the current `server/help_reference/*.md` library
- the parent Spec / DL for that surface when one exists (documentation parity)

It does **not** search the repo at member question time. Concierge retrieval stays whitelisted to Help files (**Help Concierge §4**).

**Host (OD-HW-5):** StudioTwo only, against `origin/main`. Not MiniTwo unless Coach names production in a later OD.

### 2.2 Decode

For each surface touched in the range, including **reverts on `main`** (a revert is a change; decode it the same four ways — Help must not keep teaching a behavior that `main` took back):

| Verdict | Meaning |
|---------|---------|
| **No Help change** | Internal, test-only, admin-only, or Help already truthful |
| **Update existing guide** | Named file + sections that drifted |
| **Add a guide** | New member-facing behavior with no `help_reference` home |
| **Decline** | Thin / not publication-worthy / would invent trading advice — report why (**L12** analog) |

Decode is **member teaching**, not a code review. Process outcomes only. No profit claims.

Symmetric revert examples: a revert of PPL3’s 422 path is an **Update** (or Decline if Help never shipped the 422 sentence); a revert of tests-only is **No Help change**.

### 2.3 Make the changes (Coach)

Help Watch **writes the Help markdown**. That is in-scope. It is not a queue that waits for a second human to type the file.

**As-built constraint (not a trim of Coach’s job):** `help_reference` has **no draft state**. File present = published (**DL-572**). Unreviewed bytes in that folder are live for members.

**Earned autonomy (OD-HW-1 · F-1 · D-B1-10 pattern):**

| Phase | How Help Watch lands writes |
|-------|-----------------------------|
| **Calibration window** | **PR-first.** Help markdown lives on a **branch**. The branch **is** the draft state. It is **outside** `server/help_reference/` on `main` until merge. Merge onto `main` is the publish (DL-572). |
| **After precision proven** | Coach names proven (DL). Then Help Watch may commit **straight to `main`**. |

There is **no** `help_reference/_draft/` folder. That would be a second draft state inside the publish folder. **Not adopted.**

**Same-day, never same-SHA (OD-HW-4):** Help Watch’s git commit is a **follow-on** the same calendar day as the product packet. It is **never** the same SHA as the app change. Documentation parity = same day, two commits.

Echo/Hotel/Lima may review after; during calibration the PR **is** that review. After the ladder, they do not become a required gate that parks the write.

### 2.4 What it may change

- Existing `server/help_reference/*.md` sections (update copy to match as-built)
- New `help_reference/<surface>.md` when a surface has no guide
- `app-areas.md` section for that app when the area’s one-paragraph job changed

### 2.5 What it must not change

- Concierge prompt / search code except if a new file must appear in the index (automatic if the file is in the folder)
- Product trees (Trade Log, Options Lab, …)
- Wiki pages
- Specs (India). If the spec is now false, **flag** — do not silently rewrite Specs/
- Matcher FIFO body, `AnalyzerPositionsList.tsx`, LIM / QFRIC / XS product files (standing freeze — **read for decode only if on the allowlist; never write**)

### 2.6 Trigger

GitHub push to `origin/main` (or StudioTwo hook that sees `main` land). Cadence is the push, not a 24 h research window.

Poll of `main` is an allowed fallback so this does not depend on GitHub subscribe as a Wiki-source mechanism.

### 2.7 Watermark and self-trigger guard (F-2 · F-3)

**Storage (named):** `agents/p-help-watch/watermark.json` in this repo on StudioTwo.

Required fields:

| Field | Meaning |
|-------|---------|
| `schema` | `help-watch-watermark-v1` |
| `last_processed_main_sha` | Last `origin/main` SHA whose range was decoded |
| `help_watch_author_email` | Git author email of Help Watch commits (bound when the new seat is named) |
| `help_watch_commit_shas` | SHAs Help Watch itself landed (PR merges or straight-to-main) |

**Guard:** before decode, advance `last_processed_main_sha` **past Help Watch’s own commits**. Commits whose git author is `help_watch_author_email` (or that are listed in `help_watch_commit_shas`) are **excluded from the decode range**. Help Watch must not treat its own `help_reference` write as an app change and loop.

Watermark is Help Watch’s, not Wiki’s S1 hash store. Wiki L10 watermarks stay on the Wiki side.

### 2.8 Explicit allowlist (OD-HW-3)

Decode **only** these prefixes and files. Anything else is out of the range even if it landed on `main`.

**In:**

| Prefix / path | Why |
|---------------|-----|
| `web/app/app/` | Member app routes |
| `web/components/trade-log/` | Trade Log sheet, blotter, import |
| `web/components/practice/` | Practice chrome |
| `web/components/capital/` | Positions valuation |
| `web/components/journal/` | Journal |
| `web/components/retrospective/` | Retrospective |
| `web/components/strategy-lab/` | Strategy Lab member surface |
| `web/components/ui/ConfirmProvider.tsx` | Kit confirm |
| `web/components/ui/AlertDialog.tsx` | Kit confirm |
| `web/lib/tradeLog.ts` | Client match / badges / close draft |
| `web/lib/tradeLogAutofilter.ts` | Status tokens |
| `web/lib/tradeLogApi.ts` | Member Trade Log HTTP |
| `web/lib/tradeLogPrefs.ts` | Last-used entry |
| `server/routes/trade_log/` | Member Trade Log API (422 / 409 live here) |
| `server/trade_log_domain/` | Named states / gates (FIFO `match_open_close` **read-only**) |
| `server/capital_positions.py` | Positions qty grain |
| `server/help_reference/` | Help library itself |
| `web/app/app/options-lab/` | Options Lab member routes |
| `web/components/options-lab/` | Options Lab member UI **except** the freeze file below |
| `web/lib/market/` | Shared live-underlier pattern members see |
| `web/components/wiki/` | Member Wiki chrome |
| `web/components/help/` | Help launcher, if present |

**Out (never decode as app change):**

| Prefix / path | Why |
|---------------|-----|
| `web/app/admin/` · `web/components/admin/` | Admin |
| `web/components/options-lab/AnalyzerPositionsList.tsx` | Standing freeze |
| `server/tests/` · `web/**/*.test.*` · `web/e2e/` | Tests |
| `agents/` except this board’s watermark | Bench, not the app |
| `Specs/` · `Architecture/` · `docs/` | Flag spec drift; do not Help-rewrite from them |
| `agents/p-options-lab-heatmap-lim/` product · QFRIC · XS trees | Active other programs; Help Watch does not teach those boards this version |

Adding a prefix is a spec bump, not a silent expand.

---

## 3. Wiki Follow

### 3.1 Watch Help, not the app

Wiki Follow’s input is **published Help** after Help Watch wrote it: catalog `GET /api/help/guides` (hash vs watermark, **L10**). It does not diff `web/components/`.

When Help Watch adds or updates a guide **and that guide is on `main`** (PR merged or straight-to-main), Wiki Follow:

- **Update** the existing Wiki page for that help id if one exists
- **Add** a Wiki page when Help has a guide and Wiki has none (and the body is not thin)
- **Change** linkage / coverage if Help’s job of the surface moved

Decline thin or profit-claim Help (**L12**, existing poller).

Calibration-window PRs do **not** publish Help, so Wiki Follow does not see them until merge (**DL-572**).

### 3.2 Two doors stay two doors

| Door | Who | Posture |
|------|-----|---------|
| Machine (S1 poll) | `poll_help_source` | Defended. GET-only. Hash wins. |
| Operator (Wiki agent window) | Admin colleague | Already specified: speaks coverage first. May be told “Help Watch just shipped trade-log-record-close” and asked to finish related pages. |

This spec **uses the machine door as the default follow**. The operator door is not removed. Coach’s earlier Wiki-authoring line — *“I noticed you have a help, but it looks incomplete…”* — remains the colleague; Help Watch is what makes Help complete so that greeting is rarer.

### 3.3 Wiki never writes Help

**L9.** If Wiki Follow finds Help thin, it **declines to compose** and reports. It does not patch `help_reference`. Help Watch owns Help.

---

## 4. Member experience

Members do not see a new button. They see Help answers and Wiki pages that match the app after `main` moves.

Admin may see a Help Watch run report (accepted / declined / files written) — chrome **OPEN** (Echo). No member-facing “AI updated this help” badge required this version.

During calibration, members see Help updates only after the PR merges.

---

## 5. Isolation

| Must not touch | Why |
|----------------|-----|
| Matcher FIFO, `AnalyzerPositionsList.tsx` | Standing freeze |
| LIM / QFRIC / XS product files | Active other trees |
| Help concierge **read** path | Stays whitelist-only |
| Wiki subscribe to GitHub | Coach ruling poll≠subscribe |
| MiniTwo | OD-HW-5 StudioTwo only |

New board: `agents/p-help-watch/`. New seat (callsign OPEN). No seeds on LIM/QFRIC/XS/PPL product.

StudioTwo only. MiniTwo only when Coach names production.

---

## 6. Success (acceptance)

1. A member-facing Trade-Log (or other allowlisted) behavior change lands on `main`. Help Watch runs. If Help was false, the matching `help_reference` file **is updated in git** — not a note that “someone should.” Follow-on commit, **same day, different SHA**.
2. If Help was already true, Help Watch reports **No Help change** with the paths it considered. No noisy empty commits.
3. After that Help file is **on `main`**, Wiki Follow’s next Help poll **adds or updates** the Wiki page (or L12-declines with a named reason).
4. Member Help concierge answers from the new file without a code change (folder whitelist).
5. Wiki agent window, if opened on that surface, can see the new Help. It still does not auto-publish from chat.
6. **Golden-set calibration run (F-4), required before OD-HW-1 ladder may advance to straight-to-main:** replay the **PPL2/PPL3 range** on StudioTwo (PPL2 read-model through PPL3 land `9e7659e9`). Help Watch **must** produce Help updates that teach **partial-residual**, **422 without override**, and **DELETE 409**. It **must not** touch unchanged surfaces (Width Fit, LIM, courses, Sessions, …). **Plus one decline exemplar** (named in the run report — e.g. tests-only or Help-Watch’s own prior commit). Precision is **not** proven until this run is evidence, not assertion.

---

## 7. Decisions (Coach ticks — 2026-09-15)

Silent-at-GO is closed for this set. Any later Coach override **replaces the tick verbatim** (new spec minor + DL), it does not sit beside it as a maybe.

| # | Question | Status |
|---|----------|--------|
| **OD-HW-1** | Straight-to-`main` vs PR? | **DISPOSED — ladder.** PR-first calibration window; straight-to-`main` after precision proven (D-B1-10 pattern). Branch is the draft state, outside the DL-572 folder |
| **OD-HW-2** | Callsign | **DISPOSED — new seat.** Callsign still OPEN (Coach names the letter/sitcom) |
| **OD-HW-3** | How “apps” are known | **DISPOSED — explicit allowlist.** §2.8. Expand = spec bump |
| **OD-HW-4** | Same SHA vs follow-on | **DISPOSED — follow-on same-day commit, never same-SHA** |
| **OD-HW-5** | MiniTwo vs StudioTwo | **DISPOSED — StudioTwo only** |

Remaining OPEN: Help Watch **callsign** (subset of HW-2). Precision-proven DL that ends the PR-first window (follows F-4 golden set). Admin run-report chrome (Echo).

---

## 8. Ideas inventory

| Idea | Disposition |
|------|-------------|
| Agent knows app changes on `main` | **IN-SCOPE** |
| Decode whether Help must change | **IN-SCOPE** |
| Help Watch **makes** the Help-file changes | **IN-SCOPE** (Coach) |
| Wiki agent watches those Help updates and changes/adds/updates Wiki | **IN-SCOPE** |
| Reuse S1 poll as Wiki Follow machine door | **IN-SCOPE** |
| Concierge remains whitelist-only at answer time | **IN-SCOPE** |
| Reverts on `main` decode symmetrically | **IN-SCOPE** (F-5) |
| Self-trigger guard | **IN-SCOPE** (F-2) |
| Named watermark file | **IN-SCOPE** (F-3) |
| Golden-set PPL2/PPL3 calibration | **IN-SCOPE** (F-4) |
| PR-first then straight-to-main | **IN-SCOPE** (F-1 / OD-HW-1) |
| Draft folder / `help_reference/_draft/` | **DISPOSED** — not adopted; branch is the draft (F-1) |
| Help Watch reads product code at **member question** time | **PARKED** — breaks Help whitelist |
| Wiki subscribes to GitHub | **PARKED** — poll≠subscribe |
| v1.3 Help self-improve from unanswered questions | **DEFERRED** — different loop (Help Concierge §7) |
| Auto-rewrite Specs/ when Help Watch sees drift | **PARKED** — India; flag only |
| MiniTwo Help Watch | **PARKED** — OD-HW-5 |

---

## 9. Out of scope (this version)

- Teaching LIM/QFRIC/XS from this board
- Changing Help desk tickets (`help_questions`)
- IKI Factory conveyor
- Member-visible Wiki agent
- Same-SHA Help + product commit
- MiniTwo

---

## 10. Version history

| Ver | Date | Note |
|-----|------|------|
| **0.1 DRAFT** | 2026-09-15 | Coach Phase 0: Help Watch apps → write Help; Wiki Follow watches Help and updates Wiki. Evidence: PPL3 Help gap. Not GO. **Baseline freeze.** |
| **0.2 DRAFT** | 2026-09-15 | Claude F-1…F-5 folded. OD-HW-1…5 ticked (ladder, new seat, allowlist, follow-on SHA, StudioTwo). Watermark path named. Golden-set acceptance. Reverts. `_draft/` rejected. Still not GO. |
