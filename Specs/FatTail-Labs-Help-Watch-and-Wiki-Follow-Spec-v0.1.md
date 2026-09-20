# FatTail Labs — Help Watch and Wiki Follow Spec v0.1

**Status:** DRAFT **BASELINE FREEZE** — 2026-09-15. **SUPERSEDED as working text by v0.2.** Keep on disk; do not plan or build against this file.  
**Successor:** [`FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.2.md`](./FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.2.md)

**Original status:** DRAFT — Phase 0 Coach intent captured 2026-09-15. **Not BUILD AUTHORITY.**  
**Program:** Help Watch (new) + Wiki Follow (existing Wiki agent / S1 poller, extended).  
**Coach Phase 0 (verbatim job):** an agent that knows what changes have been made to apps, decodes whether a Help-file update is necessary, then **makes those changes**; the Wiki agent watches the Help agent’s updates and makes changes, additions, or updates to the Wiki.

**Parents:**
- [`FatTail-Labs-Help-Concierge-Spec-v1.2.md`](./FatTail-Labs-Help-Concierge-Spec-v1.2.md) — whitelist `server/help_reference/*.md`; file present = published; **DL-572** catalog
- [`FatTail-Labs-Wiki-Source-Contract-Spec-v0_1_4.md`](./FatTail-Labs-Wiki-Source-Contract-Spec-v0_1_4.md) — S1 Help is **poll**; **poll ≠ subscribe**; L4 no invented substance; L9 Wiki never writes Help; L11 publication-worthy only; L12 thin decline
- [`DRAFT-Wiki-Authoring-Agent-Spec-v0_1.md`](./DRAFT-Wiki-Authoring-Agent-Spec-v0_1.md) — colleague that already knows the surface and speaks coverage first

**Does not supersede** Help Concierge retrieval, Wiki L9, or Coach’s poll≠subscribe ruling. This spec adds a **writer in front of Help files** and a **follow path into Wiki**.

---

## 0. Why

Help and Wiki do not watch the product. They only know what a human wrote into `help_reference`. Trade Log PPL2/PPL3 (partial-residual, API 422, DELETE 409, kit confirm) shipped on `origin/main` (`9e7659e9`) with **no** Help file change. Members asking Help still get Open / Complete / Orphan close and sheet-only warnings.

Coach’s wanted loop:

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

---

## 2. Help Watch

### 2.1 What it knows

On each relevant `origin/main` push (or an equivalent poll of `main` if webhook is later), Help Watch reads:

- the commit range vs the last Help-Watch watermark
- paths that change **how a member sees or operates an app** (routes, chrome, sheets, named states, save/delete/close, Autofilter, Help files themselves)
- the current `server/help_reference/*.md` library
- the parent Spec / DL for that surface when one exists (documentation parity)

It does **not** search the repo at member question time. Concierge retrieval stays whitelisted to Help files (**Help Concierge §4**).

### 2.2 Decode

For each surface touched, one of:

| Verdict | Meaning |
|---------|---------|
| **No Help change** | Internal, test-only, admin-only, or Help already truthful |
| **Update existing guide** | Named file + sections that drifted |
| **Add a guide** | New member-facing behavior with no `help_reference` home |
| **Decline** | Thin / not publication-worthy / would invent trading advice — report why (**L12** analog) |

Decode is **member teaching**, not a code review. Process outcomes only. No profit claims.

### 2.3 Make the changes (Coach)

Help Watch **writes the Help markdown**. That is in-scope. It is not a queue that waits for a second human to type the file.

**As-built constraint (not a trim of Coach’s job):** `help_reference` has **no draft state**. File present = published (**DL-572**). Unreviewed bytes in that folder are live for members.

**How this spec keeps both:** Help Watch writes the files in the same body of work as the product change *or* in a follow-on commit on `main` that is still Help Watch’s write — not a “later someday.” Echo/Hotel/Lima may review after; they do not become a required gate that parks the write. *(India opinion, labeled: a holding `help_reference/_draft/` would add a draft state DL-572 forbids unless Coach opens it. Not adopted here.)*

### 2.4 What it may change

- Existing `server/help_reference/*.md` sections (update copy to match as-built)
- New `help_reference/<surface>.md` when a surface has no guide
- `app-areas.md` section for that app when the area’s one-paragraph job changed

### 2.5 What it must not change

- Concierge prompt / search code except if a new file must appear in the index (automatic if the file is in the folder)
- Product trees (Trade Log, Options Lab, …)
- Wiki pages
- Specs (India). If the spec is now false, **flag** — do not silently rewrite Specs/

### 2.6 Trigger

**Default (this draft):** GitHub push to `origin/main` (or StudioTwo hook that sees `main` land). Cadence is the push, not a 24 h research window.

Poll of `main` is an allowed fallback so this does not depend on GitHub subscribe as a Wiki-source mechanism.

---

## 3. Wiki Follow

### 3.1 Watch Help, not the app

Wiki Follow’s input is **published Help** after Help Watch wrote it: catalog `GET /api/help/guides` (hash vs watermark, **L10**). It does not diff `web/components/`.

When Help Watch adds or updates a guide, Wiki Follow:

- **Update** the existing Wiki page for that help id if one exists
- **Add** a Wiki page when Help has a guide and Wiki has none (and the body is not thin)
- **Change** linkage / coverage if Help’s job of the surface moved

Decline thin or profit-claim Help (**L12**, existing poller).

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

---

## 5. Isolation

| Must not touch | Why |
|----------------|-----|
| Matcher FIFO, `AnalyzerPositionsList.tsx` | Standing freeze |
| LIM / QFRIC / XS product files | Active other trees |
| Help concierge **read** path | Stays whitelist-only |
| Wiki subscribe to GitHub | Coach ruling poll≠subscribe |

New board: `agents/p-help-watch/` (name OPEN). No seeds on LIM/QFRIC/XS/PPL product.

StudioTwo first. MiniTwo only when Coach names production.

---

## 6. Success (acceptance)

1. A member-facing Trade-Log (or other app) behavior change lands on `main`. Help Watch runs. If Help was false, the matching `help_reference` file **is updated in git** — not a note that “someone should.”
2. If Help was already true, Help Watch reports **No Help change** with the paths it considered. No noisy empty commits.
3. After that Help file is published, Wiki Follow’s next Help poll **adds or updates** the Wiki page (or L12-declines with a named reason).
4. Member Help concierge answers from the new file without a code change (folder whitelist).
5. Wiki agent window, if opened on that surface, can see the new Help. It still does not auto-publish from chat.

---

## 7. Open decisions (Coach)

No silent default on these:

| # | Question |
|---|----------|
| **OD-HW-1** | Help Watch **commits straight to `main`**, or opens a branch/PR Coach merges? (Coach said “make those changes.” Branch is an implementation seam, not a second author.) |
| **OD-HW-2** | Callsign: new seat, or Lima (writes) + existing Wiki poller (follow), or Gemba-style conveyor? |
| **OD-HW-3** | Path allowlist for “apps” (e.g. `web/app/`, `web/components/` minus admin), or Help Watch infers from routes? |
| **OD-HW-4** | Same-commit as the product packet (documentation parity in one SHA) vs follow-on Help Watch commit? |
| **OD-HW-5** | MiniTwo: does Help Watch run on production host, or only StudioTwo against `origin/main`? |

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
| Draft folder / approve-before-publish for Help | **FLAGGED** — fights DL-572 unless Coach opens a draft state |
| Help Watch reads product code at **member question** time | **PARKED** — breaks Help whitelist |
| Wiki subscribes to GitHub | **PARKED** — poll≠subscribe |
| v1.3 Help self-improve from unanswered questions | **DEFERRED** — different loop (Help Concierge §7) |
| Auto-rewrite Specs/ when Help Watch sees drift | **PARKED** — India; flag only |

---

## 9. Out of scope (this version)

- Teaching LIM/QFRIC/XS from this board
- Changing Help desk tickets (`help_questions`)
- IKI Factory conveyor
- Member-visible Wiki agent

---

## 10. Version history

| Ver | Date | Note |
|-----|------|------|
| **0.1 DRAFT** | 2026-09-15 | Coach Phase 0: Help Watch apps → write Help; Wiki Follow watches Help and updates Wiki. Evidence: PPL3 Help gap. Not GO. |
