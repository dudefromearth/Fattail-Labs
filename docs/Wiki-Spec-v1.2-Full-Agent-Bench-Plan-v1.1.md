# Wiki Spec v1.2 — Full Agent Bench Plan v1.1

**Program:** IKI Lab — Wiki (DL-539 · DL-540)  
**Spec of this packet:** [`Specs/FatTail-Labs-Wiki-Spec-v1_2.md`](../Specs/FatTail-Labs-Wiki-Spec-v1_2.md) **DRAFT v1.2** — first seed is §14 **W0**. No BUILD AUTHORITY until Coach stamps this plan.  
**Companion surfaces:** [`Specs/FatTail-Labs-Wiki-Admin-Interface-Spec-v0_1_2.md`](../Specs/FatTail-Labs-Wiki-Admin-Interface-Spec-v0_1_2.md) **v0.1.2 — one file, one version.** Do not cite `v0_1` as live. W0 allowlist consolidates the tree to exactly that file.  
**Oscar charter source:** [`Specs/oscar_2.md`](../Specs/oscar_2.md) **v0.3** (path-dependent ③). Lima conforms to `agents/bench/agent-template.md` on seating — does not re-derive.  
**Member Wiki v0.1** remains spec of record for storage, course corpus ①②⑤, and W1–W11. **Not superseded.** Do not run `agents/p-wiki/` (Member Wiki spine) as this packet.  
**Board:** [`agents/p-wiki-v12/`](../agents/p-wiki-v12/)

**v1.0 → v1.1:** merged Coach/review patch list. No spec law changes in this document. No seeds run from this file.

Coach: *the wiki is agent-curated, always looking for what shipped; if there is no directive it keeps a list and asks; it waits, it does not invent.*

Juliet. **No W0 code until Coach stamps GO W0** and ticks the stamp page.

---

## Doctrine and first principles

| Law | Application |
|-----|-------------|
| **DL-539** | Active program = IKI Lab — Wiki. Options Lab, `AppChrome` launcher, Trade Log, Market Bus, Runner compute: **frozen**. Three OKs before any exception. OD-WA1/WA2 raise-1-of-3 only — **not seeded**. |
| **DL-540** | IKI has **zero auth**. Shared `/app/*` guard. Lima **confirms this number** on seating — does not invent a DL. |
| **WK14 / W1–W11** | Course registrar ①, transcriber ②, related tick ⑤ **untouched**. |
| **W5 / WK5** | Approval on the content board. Inbox never approves. **W0 inbox has no compile/dismiss at all.** |
| **W11** | No Family B, no page body, in capture or compile context. |
| **SI #2** | SHA input fail-loud: CLI arg / env / test fixture. No silent default. |
| **SI #10** | W0-2 / W0-3 and W0-G: `cd server && .venv/bin/python -m pytest tests -q` green. |
| **Change control** | Seeds list files. AT-WA11 = **declared W0 allowlist** (includes SQL). |
| **Design chain (W0)** | **UX · Echo · Interaction · Tango.** Not “Echo covers all three” unless Coach ticks that exception (this stamp page has **no** such box). |
| **Hotel** | **Not on W0** (no compile). W1: Hotel only if OD-WK2 = prose. |
| **Build on what exists** | `lab-wiki` + derived index + `/app/wiki`. Sibling candidates table + **watcher-state sibling** for last SHA. |
| **Spec is the contract** | WK1–WK15. Path-dependent ③ (v1.2). |

---

## What this program ships (product)

The wiki becomes the **compiled map of what Labs ships**, still waiting, still human-published:

1. **Deploy watcher** (code) diffs production SHA over deploy kinds; first SHA = snapshot, **zero candidates** (WK7, AT-WK5).  
2. **Candidate inbox** on `/app/wiki` (administrator only, stay-put).  
3. **“Compile this into Wiki”** launcher on **IKI + Wiki routes only**.  
4. **Oscar** proposes, compiles (path-dependent), files on publish (WK15). Never publishes.  
5. Course loop **exactly** Member Wiki v0.1.

**W0 ships item 1 (watcher stub) + item 2 (empty inbox) only.** Items 3–5 are program, not this packet.

W0+W1 (later stamp) = “the wiki in place, doing the right thing.” W2–W4 fill help / template / feature as parents land.

---

## What this program does not ship

- Public wiki render (OD-WK7 / OD-PDS10).  
- IKI identity / `iki_public` (DL-540).  
- `AppChrome` or Options Lab launcher (three-OK; not seeded).  
- Replacing Member Wiki ①②⑤.  
- Invented Application Framework `apps` table as `surface_key` SoR.  
- Help target until OD-WK6 + parent amendments.  
- `kind=template` until Help Package in-tree (W3).  
- Staff wiki until OD-WK3.  
- Snooze (OD-WK8).  
- MiniTwo unless Coach asks.  
- **W0:** Compile, Dismiss, target chooser (W1 / OD-WK2).

---

## Open decisions Juliet does not pick

W0 needs **OD-WK4** only (candidates **and** watcher-state siblings). W0 does **not** need OD-WK1/2/5/6/7.

| ID | Blocks | Owner |
|----|--------|--------|
| **OD-WK4** | W0 tables | Sibling `wiki_compile_candidates` **+** watcher-state sibling for last SHA (**not** a candidate row). |
| **OD-WK2** | W1 deploy-path compile | Stubs vs prose. Course path **not** in this question. |
| **OD-WK9** | W1 file-on-publish | How Oscar sees board publish. |
| **OD-WK6** | W2 | Help on the board, or W5 does not apply to help. |
| **OD-WK1** | W3+ live watcher | **Foxtrot** — hook vs poll. Not on the W0 seed list. Optional: Foxtrot **reviews SHA shape** only. |
| **OD-WK5** | W3 directive | Trailer / frontmatter. |
| **OD-WK3, 7, 8** | later | Staff / public / snooze. |
| **OD-WA1, WA2** | never this board’s seeds | AppChrome / Options Lab. Raise 1 of 3. |
| **OD-WA3** | **W1** launcher | Chord vs mark — Interaction / Echo. **Not W0.** |

---

## Critical path (matches seed table)

```text
Coach stamps plan v1.1 (OD-WK4 + Oscar callsign + GO W0)
  → W0-1 India (candidates table + watcher-state sibling)
      → W0-2 Alpha schema
          → W0-3 Alpha watcher stub (last SHA, zero candidates, fail-loud SHA)
      → W0-4 Charlie read-only empty inbox region
          → W0-5 UX · Echo · Interaction · Tango
              → W0-7 Kilo (ATs after Echo moves DOM)
      → W0-6 Mike (∥ after W0-1)
      → W0-8 Lima Oscar v0.3 (collision check first; ∥ after W0-1)
          → W0-G Delta
W1 is a SECOND stamp (OD-WK2 deploy stubs, OD-WK9) — not this page.
```

UX, Echo, Interaction, or Tango FAIL ⇒ Delta FAIL. No waive.  
**Do not record “Echo covers UX/UI/interaction”** unless Coach adds that exception (not on this stamp).

Hotel: **not W0.** W1: Hotel only if OD-WK2 = prose.

---

## File allowlist — **split W0 / W1**

### W0 (declared — AT-WA11)

| Area | Touch |
|------|--------|
| `migrations/` | `wiki_compile_candidates` **and** watcher-state sibling (India names, e.g. `wiki_compile_watcher_state(last_sha, recorded_at)`). Storing last SHA **in** candidates **fails AT-WK5 by construction**. |
| `server/` | Candidate store + watcher stub (Alpha). **Not** Member Wiki ①②⑤. |
| `web/app/app/wiki/**` | Read-only empty inbox **region** only |
| `web/app/app/iki/**` | **None in W0** |
| `Specs/FatTail-Labs-Wiki-Admin-Interface-Spec-v0_1_2.md` | **The** Admin Interface spec. Consolidate so the tree has **exactly one** (rename/replace `v0_1` / `v0_1_1` leftovers). |
| `Specs/FatTail-Labs-Wiki-Spec-v1_2.md` | **r4 land-with nits only:** §4 diagram matches §7 (course prose vs deploy stubs; file path-dependent); §1 Oscar one-liner matches; §11 + OD-WK2 row scoped to deploy/admin-point; companions Admin v0.1.2 / Oscar v0.3. **No other spec edits in W0.** |
| `agents/bench/oscar.md` | Seat **v0.3** from `Specs/oscar_2.md` via `agent-template.md`. Collision check first. |
| `Architecture/00-decision-log.md` | Lima: Wiki Spec v1.2 seated; **confirm DL-540** (do not invent a number). |

**AT-WA11 (Delta, one line):** `git diff --stat` = this declared W0 allowlist. **SQL in `migrations/` and `server/` is in-allowlist.** Do not FAIL W0 for applying India’s table. Still **no** `AppChrome`, Options Lab, `web/lib/market/`, course-path files.

### W0 never

`web/app/app/iki/**` · `web/components/AppChrome.tsx` · `web/app/app/options-lab/**` · `web/lib/market/**` · `server/routes/market_stream.py` · Member Wiki ①②⑤ · MiniTwo poll.

### W1 never (when stamped later)

IKI suite chrome **mount only** — no IKI-P3 restyle. `iki.runner` is a **string in the declared `surface_key` list**, not a Runner edit. Still no AppChrome / Options Lab without three-OK.

---

## W0 — done when (empty region, not an inbox of actions)

1. `wiki_compile_candidates` exists.  
2. Watcher-state sibling has last SHA. **Zero** candidate rows (AT-WK5).  
3. SHA input named and fail-loud: CLI / env / test fixture = the checkout revision the process already sees. No silent default. No MiniTwo poll.  
4. `/app/wiki` **read-only empty region** below search: administrator sees empty copy; Navigator **no node in DOM**. **No Compile, no Dismiss, no target chooser.**  
5. AT-WA6 in W0 = **empty region does not navigate**. Full stay-put-on-action → **W1-G**.  
6. `cd server && .venv/bin/python -m pytest tests -q` green (W0-2 / W0-3 and W0-G).  
7. Diff inside declared W0 allowlist.  
8. Oscar v0.3 seated **without clobbering** vault Oscar (Coach stamp box).  
9. No course-path edits · no `iki_public` · no AppChrome / Options Lab.

---

## W1 — second stamp only (OD-WK2 deploy stubs + OD-WK9)

Declared IKI/Wiki-local `surface_key` list (`iki.wiki.entry`, `iki.wiki.article`, `iki.runner` as **strings**). Launcher on those routes. Admin-point. Compile wiki-only stubs; help/both disabled. Board card. WK15 on publish. Capture: surface_key + optional state_key token + route — never entity id, never Family B.

OD-WA3 (chord vs mark) is **W1**. Hotel only if OD-WK2 = prose.

---

## Seeds (table = critical path)

| Seed | Agent | Depends | Feeds |
|------|--------|---------|--------|
| [`W0-1-india-table.md`](../agents/p-wiki-v12/seeds/W0-1-india-table.md) | India | GO W0 + OD-WK4 | Alpha · Mike · Lima |
| [`W0-2-alpha-schema.md`](../agents/p-wiki-v12/seeds/W0-2-alpha-schema.md) | Alpha | W0-1 | W0-3 · Charlie |
| [`W0-3-alpha-watcher-stub.md`](../agents/p-wiki-v12/seeds/W0-3-alpha-watcher-stub.md) | **Alpha** | W0-2 | Kilo (after W0-5) |
| [`W0-4-charlie-inbox.md`](../agents/p-wiki-v12/seeds/W0-4-charlie-inbox.md) | Charlie | W0-2 | W0-5 |
| [`W0-5-design-chain.md`](../agents/p-wiki-v12/seeds/W0-5-design-chain.md) | **UX · Echo · Interaction · Tango** | W0-4 | **W0-7** |
| [`W0-6-mike-matrix.md`](../agents/p-wiki-v12/seeds/W0-6-mike-matrix.md) | Mike | W0-1 | W0-G |
| [`W0-7-kilo-at.md`](../agents/p-wiki-v12/seeds/W0-7-kilo-at.md) | Kilo | **W0-5** (ATs after Echo moves DOM; watcher stub already landed) | W0-G |
| [`W0-8-lima-oscar-dl.md`](../agents/p-wiki-v12/seeds/W0-8-lima-oscar-dl.md) | Lima | W0-1 | W0-G |
| [`W1-blocked.md`](../agents/p-wiki-v12/seeds/W1-blocked.md) | — | W0-G · OD-WK2 · OD-WK9 | W1-G |

**Foxtrot is off the W0 seed list.** Foxtrot = OD-WK1 (hook vs poll), **W3+**. Juliet may ask Foxtrot to **review SHA shape** only.

---

## W0-G list (final) — Delta

- Table `wiki_compile_candidates` exists  
- Watcher-state row has SHA  
- **Zero** candidate rows  
- Administrator sees empty copy  
- Navigator has no node in DOM  
- Empty region does not navigate (AT-WA6 W0 reading)  
- `cd server && .venv/bin/python -m pytest tests -q` **green**  
- `git diff --stat` inside declared W0 allowlist (SQL allowed; no AppChrome, no Options Lab, no `web/lib/market/`, no course-path)  
- Oscar v0.3 seated without clobbering vault Oscar  
- No course-path edits  
- No `iki_public`  
- No AppChrome / Options Lab  

**W1-G (later):** AT-WK11–13 wiki-only · AT-WA2–5, 7–8, 10 · **full stay-put-on-action** · help/both disabled.

---

## Relationship to other boards

| Board | Role |
|-------|------|
| `agents/p-wiki/` | Member Wiki spine. **Do not execute for v1.2.** |
| `agents/p-iki-lab/` | IKI-P3 Runner chrome. W1 may **name** `iki.runner`; W0 does not touch `web/app/app/iki/**`. |
| Knowledge-vault Oscar | Collision check. Coach stamp picks unify vs separate file that does not clobber. |

---

## Coach stamp (plan v1.1)

- [x] **OD-WK4** = sibling `wiki_compile_candidates` **+** watcher-state sibling for last SHA (not a candidate row)
- [x] **Oscar callsign:** Labs wiki curator is a separate `agents/bench/oscar.md` that does not clobber Knowledge-vault Oscar (`~/.grok/agents/oscar.md`). Collision check: no in-repo file existed. GO-with-plan seats Labs Oscar here.
- [x] **GO W0** — plan v1.1 as patched; spec v1.2 seated for W0 only; design chain on W0 = UX + Echo + Interaction + Tango
- [ ] **Amend**
- [ ] **Stop**

W1 is a **second stamp** (OD-WK2 deploy-path stubs, OD-WK9). Do not stamp those here.

**Signed:** Coach (GO 2026-08-22: “Coach approved so, GO with the plan”)  
**Date:** 2026-08-22
