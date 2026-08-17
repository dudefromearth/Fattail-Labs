# W1-G — Echo labels · no chrome

**Verdict:** **PASS**  
**Date:** 2026-08-16  
**Agent:** Delta  
**Artifact:** `agents/p-ot-ef-session-print/echo-labels.md`  
**Seed:** `agents/p-ot-ef-session-print/seeds/W1-G-delta.md`  
**Depends on:** W1-1 · W1-2 · W1-3  

**Sources read (not modified):**

- `agents/p-ot-ef-session-print/echo-labels.md` (Echo W1-1, 2026-08-16)
- `agents/p-ot-ef-session-print/gate-reports/W1-2-tango.md`
- `agents/p-ot-ef-session-print/gate-reports/W1-3-hotel.md`
- `agents/p-ot-ef-session-print/seeds/W1-1-echo-labels.md`
- `agents/p-ot-ef-session-print/seeds/W1-2-tango-copy.md`
- `agents/p-ot-ef-session-print/seeds/W1-3-hotel-honesty.md`
- `agents/p-ot-ef-session-print/seeds/W1-G-delta.md`
- Plan W1 table · W1-G evidence row (`docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md` §6 / §8)
- Session/Print Spec v0.1 §6 member table
- OT-EF v1.1 §8.3 Echo seed list
- `agents/p-ot-ef-session-print/gate-reports/W2-G.md` (already **PASS**)
- `agents/p-ot-ef-session-print/gate-reports/` listing (no `W3-G.md`)

This gate writes **this file only**. `echo-labels.md` was not edited. No product file was touched. No chrome.

---

## Criteria (restated)

| Check | Pass if | Result |
|-------|---------|--------|
| Label seed exists | `echo-labels.md` has all six states filled | **PASS** |
| Tango + Hotel | `gate-reports/W1-2-tango.md` and `W1-3-hotel.md` exist with verdicts | **PASS** — both **APPROVED**; no RETURNED row |
| No chrome | W1 did **not** ship badges or dialog strings into `web/` as this program packet | **PASS** |
| Forbidden phrases | `echo-labels.md` lists what each state must not say | **PASS** |

Holes that would FAIL: an empty badge / package / must-not cell; Tango or Hotel missing or **RETURNED** with an unresolved defect; W1-authored member strings in `web/`; a six-state row with no forbidden list.

**Defects:** none.

---

## Six badges (plane)

Cited from `echo-labels.md` § “Six badges (plane)” — these are the six member words this gate locks:

| # | State | Badge / plane |
|---|--------|----------------|
| 1 | `open` + `live` | **Live** |
| 2 | `extended` + last print | **Pre/post** |
| 3 | `closed` + last print | **Off market** |
| 4 | Held / residual (after τ, before midnight ET) | **Held residual** |
| 5 | EXPIRED (after midnight ET) | **Expired** |
| 6 | `print_quality=none` | **No print** |

**Last print** is not a seventh badge. Echo assigned it as the package-quality phrase under a number when OPF has a held print (`extended` or `closed`). Matches Coach’s six-word seed list (**Live · Pre/post · Off market · last print · Held residual · EXPIRED**) without collapsing print quality into session class.

Sentence-case plane badges vs Law B ALL-CAPS package replacements (`EXPIRED` · `HELD RESIDUAL` · `UPDATING` · `CHECK LEGS`) is Echo’s casing rule. Tango and Hotel both left it standing.

---

## 1. Label seed exists — six states filled

File on disk: `agents/p-ot-ef-session-print/echo-labels.md` (115 lines). Header: Agent Echo, seed `W1-1-echo-labels.md`, Date 2026-08-16, Status **Words only. No chrome. No `web/` or `server/` edits.**

W1-1 required table (every cell filled):

| State | Badge / plane | Package / curve (summary) | Must-not cell |
|-------|---------------|---------------------------|---------------|
| `open` + `live` | **Live** | Numeric live mark. Curve is the live book. *This is the market now.* | Filled |
| `extended` + last print | **Pre/post** | Numeric **last print** + held disclaimer. Not RTH NBBO. | Filled |
| `closed` + last print | **Off market** | Numeric **last print**, labeled held. Market is closed. | Filled |
| Held / residual (after τ, before midnight ET) | **Held residual** | Frozen last print / residual **plus** named state. Package token **HELD RESIDUAL**. | Filled |
| EXPIRED (after midnight ET) | **Expired** | Named state **EXPIRED** + **defined debit** on the viewport ghost. Never a blank price. | Filled |
| `print_quality=none` | **No print** | No number. Law B **UPDATING** / **CHECK LEGS**. *No generation yet — the app is not broken.* | Filled |

Also required by W1-1 and present:

- **Show** is the checkbox verb (not Focus, not “select for graph”). **Hide** when unchecked. Checking B must not un-show A (DL-394).
- HIG block: no pastel panic · no profit theater · last print is not an outage · Held residual is never Live · EXPIRED is never a blank price.
- Control grammar: one word list, three placements (plane badge · package chip · curve).

No empty cell. No second word list.

---

## 2. Tango + Hotel — on disk, APPROVED

| Reviewer | File | Overall verdict | RETURNED / BLOCK |
|----------|------|-----------------|------------------|
| **Tango** (W1-2) | `agents/p-ot-ef-session-print/gate-reports/W1-2-tango.md` | **APPROVED** | **No.** Every row APPROVED (Live · Pre/post · Off market · Held residual · EXPIRED · No print · Show/Hide). |
| **Hotel** (W1-3) | `agents/p-ot-ef-session-print/gate-reports/W1-3-hotel.md` | **APPROVED** | **No.** “No label, as written… teaches a false lift.” |

Tango answered the four copy asks (closed not alarming · residual not live · EXPIRED + defined debit not a sales number · no profit-claim / “you can lift this” leak). Opinions (chip **last print** not **held** on Off market; do not shorten *settled* / *frozen* into member chrome; apply the lift-now ban to Off market / Held residual / Expired) are labeled **Tango opinion**, not returns.

Hotel answered the four honesty asks (Pre/post ≠ RTH NBBO · Off market ≠ now-tradeable · Held residual ≠ still live through the close · wrong reading would make a member worse, but Echo’s words do not teach it). Opinions (naked number · Off-market homonym · Law C wins the card over house session) are labeled **Hotel opinion**, not blocks.

Neither file edits `echo-labels.md`. Coach Content Law held: Echo’s words stay; notes sit beside.

Unresolved RETURNED defects: **none.** This check is not a taste pass. APPROVED + no RETURNED = pass.

---

## 3. No chrome (W1 did not ship `web/` strings)

Criterion is **this packet**, not “`web/` must contain zero session words.” As-built Analyzer posture chrome predates W1 (HEAD commit `3bc034c` — `feat(options-lab): independent Show checkboxes, additive book, midnight-ET EXPIRED`, DL-393 / DL-394). That commit message already names Live / pre/post / dark-plane last print.

| Probe | Evidence |
|-------|----------|
| W1 files in scope | W1-1 deliverable is `echo-labels.md` only. W1-2 / W1-3 review that file. All three seeds list chrome / `web/` as out of scope. |
| W1 program tokens in `web/` | Ripgrep `echo-labels` \| `W1-1` \| `W1-G` under `web/` → **no matches**. |
| W1-new badge words in `web/` | Ripgrep `Held residual` \| `No print` \| `HELD RESIDUAL` under `web/` → **no matches**. Those two words exist only on the board. |
| W1 member-reads / forbid phrases in `web/` | Ripgrep `this is the market now` \| `not the RTH book` \| `no generation yet` \| `you can lift this` \| `after-hours live` \| `expires at the bell` \| `expires at 4` under `web/` → **no matches**. |
| This gate | Writes `gate-reports/W1-G.md` only. Did not edit `echo-labels.md`, `web/`, or `server/`. |

**As-built (not W1 — residual honesty, not a defect):**

- `web/components/options-lab/OpfRiskAnalyzer.tsx` (~768–795) already paints house posture **Live** / **Pre/post** / **Off market** and dialog lines “Pre/post session — Massive last print…” / “Off market — last print. Not polling a live chain.”
- `web/components/options-lab/PositionBuilder.tsx` (~1744) already uses empty-label **“Off market — last print”**.
- Comments in `usePackageQuotes.ts` / `useBuilderChain.ts` mention “Off market” (not member chrome).

Those strings are prior session-posture work. W1 did not add them. W5 is the packet that may *consume* Echo’s six words **after** W4. This gate ships no code.

---

## 4. Forbidden phrases — each state lists what it must not say

From `echo-labels.md` required table, **Must not say** column:

| State | Must not say |
|-------|----------------|
| `open` + `live` | Last print; held; delayed; estimated; theoretical; “approx”; Pre/post; Off market |
| `extended` + last print | Live; open; NBBO; “after-hours live”; “you can lift this”; unavailable; closed; outage; error |
| `closed` + last print | Live; Pre/post; unavailable; OPF unavailable; error; offline; broken; “no data”; “market down”; a blank cell |
| Held / residual | Live; open; “still trading”; “through the close”; “expires at the bell”; “expires at 4”; last print presented as current tape; a blank cell |
| EXPIRED | Live; last print as a current mark; a blank cell; **$0** as “worthless”; “you made / you lost”; profit theater |
| `print_quality=none` | Unavailable; OPF unavailable; error; broken; offline; retry; a guessed mid; **last print** (there isn’t one); a blank cell |

Show / Hide also has a do-not-say list: Focus · Select for graph · Include / plot / activate / enable.

Plan W1 example forbids (guaranteed / lift-now on Live; OPF unavailable / broken on closed; live on residual; blank price on EXPIRED; empty cell on none) are covered by Echo’s cells **or** by Echo simply not proposing the banned word (Tango recorded: Echo did not write “guaranteed”). Reviewers did not RETURN any row for a missing forbid. Not a hole.

---

## 5. Holes (FAIL defects)

**None.**

Six states filled. Tango **APPROVED**. Hotel **APPROVED**. No RETURNED defect. W1 shipped no `web/` badges or dialog strings. Every state has a must-not-say list.

---

## Next

- **W3-2 may use these words.** That packet already filed (`gate-reports/W3-2-echo-tango.md`) under Coach’s parallel-fire override; it claimed the W1-1 list and no second vocabulary. **W3-G** still owns whether the HOW packet is complete.
- **W5 chrome** may use these words **after W3-0 + W4**. W3-0 is already BUILD (DL-397). Still **no code from this gate alone**.
- **W2-G is already PASS** (`gate-reports/W2-G.md`).
- **W4 still needs W3-G.** `gate-reports/W3-G.md` is **not on disk**. Envelope code stays blocked on **W1-G + W2-G + W3-G**. This PASS is one of those three. W4 does not fire yet.
- Juliet updates the board. Lima does not need a new DL for a labels PASS.

**End of W1-G.**
