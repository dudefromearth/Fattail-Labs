# FatTail Labs — Help Watch and Wiki Follow Spec v0.3

**Status:** **BUILD AUTHORITY** for board `agents/p-help-watch/` upon `HW-W0` stamp 2026-09-15 (**DL-704**). Seat: **Sierra**. Sweep is the calibration window. Straight-to-main not enabled.  
**Program:** Help Watch (new seat) + Wiki Follow (existing Wiki agent / S1 poller, extended).  
**Supersedes as working text:** [`FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.2.md`](./FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.2.md) — **baseline freeze; leave on disk.** v0.1 remains an earlier freeze.  
**Coach Phase 0 (verbatim job, carried — not dropped):** an agent that knows what changes have been made to apps, decodes whether a Help-file update is necessary, then **makes those changes**; the Wiki agent watches the Help agent’s updates and makes changes, additions, or updates to the Wiki.

**Parents (unchanged — do not re-open):**
- [`FatTail-Labs-Help-Concierge-Spec-v1.2.md`](./FatTail-Labs-Help-Concierge-Spec-v1.2.md) — whitelist `server/help_reference/*.md`; file present = published; **DL-572** catalog
- [`FatTail-Labs-Wiki-Source-Contract-Spec-v0_1_4.md`](./FatTail-Labs-Wiki-Source-Contract-Spec-v0_1_4.md) — S1 Help is **poll**; **poll ≠ subscribe**; **L4** no invented substance; **L9** Wiki never writes Help; **L11** publication-worthy only; **L12** thin decline
- [`DRAFT-Wiki-Authoring-Agent-Spec-v0_1.md`](./DRAFT-Wiki-Authoring-Agent-Spec-v0_1.md) — colleague that already knows the surface and speaks coverage first

**Does not supersede** Help Concierge retrieval, Wiki L9, or Coach’s poll≠subscribe ruling. This spec adds a **writer in front of Help files** and a **follow path into Wiki**.

**Do not re-open:** L4 / L9 / L11 / L12 · poll≠subscribe · DL-572 · concierge whitelist · standing freezes (matcher FIFO, `AnalyzerPositionsList.tsx`, LIM / QFRIC / XS product files).

---

## Changes since v0.2

| # | Change | Driven by |
|---|--------|-----------|
| 1 | **Retrospective sweep is Help Watch’s first job** — compare current as-built app surfaces to current `server/help_reference/*.md`, surface by surface, **not** git-history replay | Coach 2026-09-15 |
| 2 | Sweep output: catch-up Help updates, **one PR per app area**, plus a **skipped-list with reasons** | Coach |
| 3 | Trade Log batch is graded on known ground truth: **partial-residual / 422 / 409 must appear** | Coach · F-4 intent kept, method changed |
| 4 | Calibration window = the sweep’s PRs (Coach reviews each batch). Straight-to-main stays blank until the sweep is **fully merged** and precision is shown | Coach token amendment |

Everything else in v0.2 stands. Coach Phase 0 job, two-agent split, Wiki poll door, ODs HW-1…5, allowlist, watermark, self-trigger, reverts, isolation are **carried**.

---

## Claude review disposition (v0.1 findings; carried through v0.2; none dropped)

| Finding | Disposition |
|---------|-------------|
| **F-1** OD-HW-1 / `_draft/` vs DL-572 | **Resolved.** Ladder: PR-first until precision proven, then straight-to-main. Branch = draft. No `help_reference/_draft/` |
| **F-2** Self-trigger | **In.** Watermark + author exclusion (§2.7) |
| **F-3** Watermark location unnamed | **Named.** §2.7 |
| **F-4** No golden-set acceptance | **In.** Sweep Trade Log batch is the grade (§2.0 · §6 item 6). Not a git-range replay |
| **F-5** Reverts not decoded | **In.** §2.2 (steady-state after the sweep) |

---

## 0. Why

Help and Wiki do not watch the product. They only know what a human wrote into `help_reference`. Trade Log PPL2/PPL3 (partial-residual, API 422, DELETE 409, kit confirm) shipped on `origin/main` (`9e7659e9`) with **no** Help file change. Members asking Help still get Open / Complete / Orphan close and sheet-only warnings.

**The backlog is already there.** A push-to-`main` watcher starting at today’s SHA would never see PPL2/PPL3. The first job is therefore a **retrospective sweep** of as-built vs Help, then the live loop.

Coach’s wanted loop (carried — this is the **steady state after the sweep**):

```text
app change on main  →  Help Watch decides  →  Help files change
                                              ↓
                                    Wiki agent sees Help updates
                                              ↓
                                    Wiki pages change / add / update
```

First job (this version):

```text
as-built surfaces  ×  help_reference/*.md  →  one PR per drifted app area
                                            →  skipped-list (reasons)
                                            →  Coach reviews each batch
Wiki Follow still polls Help after each merge. Not a GitHub subscriber.
```

---

## 1. Two agents, two jobs (do not collapse)

| Agent | Job | Writes | Does not write |
|-------|-----|--------|----------------|
| **Help Watch** | Know what changed in **apps**. Decode whether member Help must change. **Make the Help-file changes.** First job: retrospective sweep (§2.0). | `server/help_reference/*.md` only | Wiki pages, product UI, matcher, LIM/QFRIC/XS, PPL product |
| **Wiki Follow** | Watch **Help Watch’s updates** (the published Help catalog those files become). Change, add, or update Wiki pages. | Wiki git pages (existing Wiki writer) | Help files (**L9**) |

Wiki already **polls** `GET /api/help/guides` (`poll_help_source`). That poll is the machine door. This spec does **not** turn Wiki into a GitHub subscriber. Help Watch may be triggered by a push to `main` **after** the sweep; Wiki still **polls Help**.

**Seat (OD-HW-2):** Help Watch is **Sierra** (stamped `HW-W0` 2026-09-15). Curriculum charter `agents/bench/sierra.md` is unchanged; this board is an additional write job (member Help markdown only). Wiki Follow is **not** a second new seat — it is the existing Wiki poller + Wiki agent operator door.

Board: `agents/p-help-watch/`.

---

## 2. Help Watch

### 2.0 Retrospective sweep (first job)

**Method:** compare **current as-built** app surfaces (allowlist §2.8, as they exist on StudioTwo `origin/main` HEAD) against **current** `server/help_reference/*.md`. Surface by surface. **Not** a git-history replay of PPL2/PPL3 or any other range.

For each **app area** (table below):

| Verdict | Output |
|---------|--------|
| Drifted or missing | Catch-up Help markdown. **One PR per app area.** PR touches `server/help_reference/*.md` only |
| Already truthful, out of scope, freeze, or decline | **Skipped-list** row with a **named reason** — no empty PR |

**App areas** (one PR each if they need a write; grouping is the PR grain, not a silent merge of two products):

| App area | Help homes (update these, or add if missing) |
|----------|-----------------------------------------------|
| **Trade Log** | `trade-log-record-close.md`, `trade-log-autofilter.md`, `app-areas.md` § Trade Log / New trade |
| **Practice / Campaigns** | `app-areas.md` Campaigns, Find and Badge |
| **Capital / Positions** | `app-areas.md` (positions / capital) and any dedicated guide |
| **Journal** | `app-areas.md` Journal |
| **Retrospective** | `app-areas.md` Retrospective |
| **Strategy Lab** | `app-areas.md` Strategy Lab |
| **Options Lab Analyzer** | `options-lab-analyzer.md` |
| **Options Lab Heatmap** | `options-lab-heatmap.md`, `options-lab-heatmap-session.md`, `options-lab-heatmap-width-fit.md` |
| **Time Machine** | `options-lab-time-machine.md` |
| **Sessions** | `sessions.md` |
| **Courses** | `courses.md` |
| **Wiki** | `wiki.md` (member). `wiki-agent.md` is admin — skip unless drifted |
| **Overview / membership** | `overview.md` |
| **Volume Profile** | `options-lab-volume-profile.md` |

**Trade Log grade (ground truth — must appear in that area’s PR if Help is false today):**

- **partial-residual** (1-of-5 still on the book)
- **422** without an explicit payload override on close
- **DELETE 409** of a paired/partial open, naming the blocking close

If the Trade Log PR ships without those three, the sweep batch is **FAIL** for that area — file the diff, do not pretend calibration passed.

**Skipped-list** lives on the board: `agents/p-help-watch/sweep-skipped.md`. Reasons are named (already truthful · out of scope LIM/QFRIC/XS this version · standing freeze · L12 thin · admin-only · tests). A skip without a reason is incomplete.

**Calibration window (OD-HW-1):** the sweep’s PRs **are** the PR-first window. Coach reviews **each** app-area PR (merge with or without edits, or reject). Edits and rejects are decode misses, filed on the board. **Straight-to-main stays blank** until **every** sweep PR is merged (or explicitly skipped with reason) **and** precision is shown — Trade Log ground truth in the merged Trade Log Help, unchanged surfaces not dirtied.

After the sweep is closed, Help Watch’s job becomes the §2.1 push-to-`main` loop. Watermark initializes to the `origin/main` SHA **after** the last sweep merge so the sweep is not re-decoded as a live range.

### 2.1 What it knows (steady state, after the sweep)

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

The sweep uses the same four verdicts, against as-built vs Help, not against a commit range.

### 2.3 Make the changes (Coach)

Help Watch **writes the Help markdown**. That is in-scope. It is not a queue that waits for a second human to type the file.

**As-built constraint (not a trim of Coach’s job):** `help_reference` has **no draft state**. File present = published (**DL-572**). Unreviewed bytes in that folder are live for members.

**Earned autonomy (OD-HW-1 · F-1 · D-B1-10 pattern):**

| Phase | How Help Watch lands writes |
|-------|-----------------------------|
| **Calibration window** | **The retrospective sweep’s PRs.** One PR per app area. Help markdown lives on a **branch**. The branch **is** the draft state. It is **outside** `server/help_reference/` on `main` until merge. Merge onto `main` is the publish (DL-572). Coach reviews each batch. |
| **After precision proven** | Coach names proven (DL) **after the sweep is fully merged** and the Trade Log grade holds. Then Help Watch may commit **straight to `main`** for the live loop. |

There is **no** `help_reference/_draft/` folder. That would be a second draft state inside the publish folder. **Not adopted.**

**Same-day, never same-SHA (OD-HW-4):** in the **live loop**, Help Watch’s git commit is a **follow-on** the same calendar day as the product packet. It is **never** the same SHA as the app change. Documentation parity = same day, two commits. The sweep is catch-up: no same-day product SHA is required.

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

**First:** the retrospective sweep (§2.0), once, after HW0 seating. Not a 24 h research window.

**Then:** GitHub push to `origin/main` (or StudioTwo hook that sees `main` land). Cadence is the push.

Poll of `main` is an allowed fallback so this does not depend on GitHub subscribe as a Wiki-source mechanism.

### 2.7 Watermark and self-trigger guard (F-2 · F-3)

**Storage (named):** `agents/p-help-watch/watermark.json` in this repo on StudioTwo.

Required fields:

| Field | Meaning |
|-------|---------|
| `schema` | `help-watch-watermark-v1` |
| `last_processed_main_sha` | Last `origin/main` SHA whose range was decoded. After the sweep: the SHA of the last sweep merge |
| `help_watch_author_email` | Git author email of Help Watch commits (bound when the new seat is named) |
| `help_watch_commit_shas` | SHAs Help Watch itself landed (PR merges or straight-to-main) |
| `sweep_status` | `pending` · `in_progress` · `closed` |

**Guard:** before decode, advance `last_processed_main_sha` **past Help Watch’s own commits**. Commits whose git author is `help_watch_author_email` (or that are listed in `help_watch_commit_shas`) are **excluded from the decode range**. Help Watch must not treat its own `help_reference` write as an app change and loop.

The sweep itself is not a commit-range decode; the guard still applies so a sweep PR merge does not retrigger a live-loop decode of the same Help files.

Watermark is Help Watch’s, not Wiki’s S1 hash store. Wiki L10 watermarks stay on the Wiki side.

### 2.8 Explicit allowlist (OD-HW-3)

Decode **only** these prefixes and files. Anything else is out of the range even if it landed on `main`. The sweep reads the same allowlist as the as-built side of the comparison.

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
| `agents/` except this board’s watermark and skipped-list | Bench, not the app |
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

Calibration-window PRs (sweep batches) do **not** publish Help, so Wiki Follow does not see them until merge (**DL-572**). Each merged app-area PR is a Help catalog change; the poller follows on its own cadence. Zero poller changes in this spec.

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

During calibration (the sweep), members see Help updates only after each app-area PR merges.

---

## 5. Isolation

| Must not touch | Why |
|----------------|-----|
| Matcher FIFO, `AnalyzerPositionsList.tsx` | Standing freeze |
| LIM / QFRIC / XS product files | Active other trees |
| Help concierge **read** path | Stays whitelist-only |
| Wiki subscribe to GitHub | Coach ruling poll≠subscribe |
| MiniTwo | OD-HW-5 StudioTwo only |

New board: `agents/p-help-watch/`. Seat **Sierra**. No seeds on LIM/QFRIC/XS/PPL product.

StudioTwo only. MiniTwo only when Coach names production.

---

## 6. Success (acceptance)

1. A member-facing Trade-Log (or other allowlisted) behavior change lands on `main` **after the sweep is closed**. Help Watch runs. If Help was false, the matching `help_reference` file **is updated in git** — not a note that “someone should.” Follow-on commit, **same day, different SHA**.
2. If Help was already true, Help Watch reports **No Help change** with the paths it considered. No noisy empty commits.
3. After that Help file is **on `main`**, Wiki Follow’s next Help poll **adds or updates** the Wiki page (or L12-declines with a named reason).
4. Member Help concierge answers from the new file without a code change (folder whitelist).
5. Wiki agent window, if opened on that surface, can see the new Help. It still does not auto-publish from chat.
6. **Sweep / calibration (replaces git-range golden set as the method):** Help Watch’s first job produces **one PR per drifted app area** and a **skipped-list with reasons**. The **Trade Log** PR **must** teach **partial-residual**, **422 without override**, and **DELETE 409**. It **must not** touch unchanged surfaces in that same PR (Width Fit, LIM, courses, Sessions, …). **Plus one decline or skip with named reason** on the skipped-list. Precision is **not** proven until the sweep is **fully merged** (or skipped with reason) and that Trade Log grade is on `main`. Evidence, not assertion.

---

## 7. Decisions (Coach ticks — 2026-09-15)

Silent-at-GO is closed for this set. Any later Coach override **replaces the tick verbatim** (new spec minor + DL), it does not sit beside it as a maybe.

| # | Question | Status |
|---|----------|--------|
| **OD-HW-1** | Straight-to-`main` vs PR? | **DISPOSED — ladder.** PR-first = **sweep PRs**; straight-to-`main` after the sweep is fully merged and precision proven (D-B1-10 pattern). Branch is the draft state, outside the DL-572 folder |
| **OD-HW-2** | Callsign | **DISPOSED — Sierra** (`HW-W0` 2026-09-15) |
| **OD-HW-3** | How “apps” are known | **DISPOSED — explicit allowlist.** §2.8. Expand = spec bump |
| **OD-HW-4** | Same SHA vs follow-on | **DISPOSED — follow-on same-day commit, never same-SHA** (live loop). Sweep is catch-up |
| **OD-HW-5** | MiniTwo vs StudioTwo | **DISPOSED — StudioTwo only** |

Remaining OPEN: Precision-proven DL that ends the PR-first window (follows sweep close + Trade Log grade). Admin run-report chrome (Echo).

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
| Retrospective sweep as first job | **IN-SCOPE** (v0.3) |
| One PR per app area + skipped-list | **IN-SCOPE** (v0.3) |
| Trade Log ground truth partial-residual / 422 / 409 | **IN-SCOPE** (F-4 via sweep) |
| Git-history replay of PPL2/PPL3 as the calibration method | **SUPERSEDED** — sweep vs as-built is the method |
| PR-first then straight-to-main | **IN-SCOPE** (F-1 / OD-HW-1); window = sweep PRs |
| Draft folder / `help_reference/_draft/` | **DISPOSED** — not adopted; branch is the draft (F-1) |
| Help Watch reads product code at **member question** time | **PARKED** — breaks Help whitelist |
| Wiki subscribes to GitHub | **PARKED** — poll≠subscribe |
| v1.3 Help self-improve from unanswered questions | **DEFERRED** — different loop (Help Concierge §7) |
| Auto-rewrite Specs/ when Help Watch sees drift | **PARKED** — India; flag only |
| MiniTwo Help Watch | **PARKED** — OD-HW-5 |

---

## 9. Out of scope (this version)

- Teaching LIM/QFRIC/XS from this board (sweep: skip with that reason)
- Changing Help desk tickets (`help_questions`)
- IKI Factory conveyor
- Member-visible Wiki agent
- Same-SHA Help + product commit
- MiniTwo
- Git-history replay as the first job

---

## 10. Version history

| Ver | Date | Note |
|-----|------|------|
| **0.1 DRAFT** | 2026-09-15 | Coach Phase 0: Help Watch apps → write Help; Wiki Follow watches Help and updates Wiki. Evidence: PPL3 Help gap. Not GO. **Baseline freeze.** |
| **0.2 DRAFT** | 2026-09-15 | Claude F-1…F-5 folded. OD-HW-1…5 ticked. Watermark path named. Golden-set as git replay. Reverts. `_draft/` rejected. **Baseline freeze.** |
| **0.3 DRAFT** | 2026-09-15 | Retrospective sweep is first job (as-built vs Help, one PR per app area, skipped-list). Trade Log graded on partial-residual / 422 / 409. Calibration window = sweep PRs. Git replay SUPERSEDED as method. |
| **0.3 BUILD AUTHORITY** | 2026-09-15 | `HW-W0` stamped: Sierra · sweep = calibration window · straight-to-main blank. **DL-704.** |
