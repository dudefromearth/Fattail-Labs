# Wiki Spec v1.2 — Full Agent Bench Plan v1.0

**SUPERSEDED** by [`Wiki-Spec-v1.2-Full-Agent-Bench-Plan-v1.1.md`](./Wiki-Spec-v1.2-Full-Agent-Bench-Plan-v1.1.md). Do not stamp this file.

**Program:** IKI Lab — Wiki (DL-539 · DL-540)  
**Spec of this packet:** [`Specs/FatTail-Labs-Wiki-Spec-v1_2.md`](../Specs/FatTail-Labs-Wiki-Spec-v1_2.md) **DRAFT v1.2** — first seed is §14 **W0**. No BUILD AUTHORITY until Coach stamps this plan.  
**Companion surfaces:** [`Specs/FatTail-Labs-Wiki-Admin-Interface-Spec-v0_1.md`](../Specs/FatTail-Labs-Wiki-Admin-Interface-Spec-v0_1.md) (inbox + launcher). Prefer **v0.1.2** text where it names Wiki Spec v1.2.  
**Member Wiki v0.1** remains spec of record for storage, course corpus ①②⑤, W1–W11. **Not superseded.** Do not run `agents/p-wiki/` (Member Wiki spine) as this packet.  
**Board:** [`agents/p-wiki-v12/`](../agents/p-wiki-v12/)  
**Oscar:** charter [`agents/bench/oscar.md`](../agents/bench/oscar.md) — **does not exist yet**; W0 Lima seats it from the spec companion. Oscar is not the Knowledge-vault Oscar unless Coach unifies them.

Coach: *the wiki is agent-curated, always looking for what shipped; if there is no directive it keeps a list and asks; it waits, it does not invent.*

This plan is Juliet. **No W0 code until Coach stamps GO W0** and disposes the OD boxes below.

---

## Doctrine and first principles

| Law | Application |
|-----|-------------|
| **DL-539** | Active program = IKI Lab — Wiki. Options Lab, `AppChrome` launcher mount, Trade Log, Market Bus, Runner compute: **frozen**. Three successive OKs before any exception. Admin Interface OD-WA1/WA2 are raise-1-of-3 only — **not seeded**. |
| **DL-540** | IKI has **zero auth**. Shared `/app/*` guard. No `iki_public`, no public-session mint, no IKI middleware. |
| **WK14 / W1–W11** | Course registrar ①, transcriber ②, related tick ⑤ **untouched**. Watcher does not replace them. |
| **W5 / WK5** | Approval stays on the content board. Inbox never approves. |
| **W11** | No Family B, no page body, in capture or compile context. |
| **Change control** | Seeds list files. `git diff --stat` = AT-WA11 (IKI/Wiki routes + declared components only). |
| **INSTRUCTIONS §5** | Echo (UI) + Tango (copy) + Interaction on Admin Interface. India on the table. Mike on the write matrix. Hotel only if OD-WK2 = prose. |
| **Build on what exists** | `lab-wiki` + derived index + `/app/wiki` as-built. Sibling `wiki_compile_candidates` (OD-WK4 recommended). No second wiki. |
| **Spec is the contract** | WK1–WK15. Path-dependent ③ (v1.2): course = prose from transcript; deploy/admin-point = stubs iff OD-WK2. |

---

## What this program ships (product)

The wiki becomes the **compiled map of what Labs ships**, still waiting, still human-published:

1. **Deploy watcher** (code) diffs production SHA over deploy kinds; first SHA = snapshot, **zero candidates** (WK7, AT-WK5).  
2. **Candidate inbox** on `/app/wiki` (administrator only, stay-put).  
3. **“Compile this into Wiki”** launcher on **IKI + Wiki routes only**.  
4. **Oscar** proposes, compiles (path-dependent), files on publish (WK15). Never publishes.  
5. Course loop **exactly** Member Wiki v0.1.

W0+W1 = “the wiki in place, doing the right thing”: point, dispose, file. W2–W4 fill help / template / feature as parents land.

---

## What this program does not ship

- Public wiki render (OD-WK7 / OD-PDS10).  
- IKI identity / `iki_public` (DL-540).  
- `AppChrome` or Options Lab launcher (three-OK; not seeded).  
- Replacing Member Wiki ①②⑤.  
- Invented Application Framework `apps` table as `surface_key` SoR.  
- Help target until OD-WK6 + Help Arch / Board amendments.  
- `kind=template` until Help Package is in-tree (W3).  
- Staff wiki (`spec` / `decision`) until OD-WK3.  
- Snooze (OD-WK8).  
- MiniTwo unless Coach asks.

---

## Open decisions Juliet does not pick

Tick before the slice that **needs** them. W0 does **not** need OD-WK1/2/5/6/7.

| ID | Blocks | Coach / owner |
|----|--------|----------------|
| **OD-WK4** | W0 table | India recommends sibling `wiki_compile_candidates`. **W0 waits on this.** |
| **OD-WK2** | W1 compile of **deploy** path | Stubs (recommended) vs prose. Course path is **not** in this question (WK3 v1.2). |
| **OD-WK9** | W1 file-on-publish | How Oscar sees board publish. |
| **OD-WK6** | W2 help target | Help on the board, or W5 does not apply to help. |
| **OD-WK1** | W3/W4 live watcher (W0 stub can poll or record SHA without a hook) | Foxtrot hook vs poll. |
| **OD-WK5** | W3 directive compile | Trailer / frontmatter syntax. |
| **OD-WK3, 7, 8** | later | Staff sink; public sink; snooze. |
| **OD-WA1, WA2** | never this board’s seeds | AppChrome / Options Lab mounts. Raise 1 of 3 only. |
| **OD-WA3** | W1 launcher chrome | Chord vs visible mark — Echo / Interaction. |

---

## Critical path

```text
Coach stamps THIS plan + OD-WK4
  → W0 India table · Alpha migration · watcher stub · inbox empty region
      → Echo ∥ Tango ∥ Mike
          → Kilo AT-WK5 / WA1 / WA6 / WA11
              → Lima Oscar charter + DL
                  → W0-G Delta
Coach OD-WK2 = stubs (deploy) + OD-WK9
  → W1 launcher (IKI+Wiki) · local surface_key list · admin-point · wiki-only stubs · board card · file-on-publish
      → Echo ∥ Tango ∥ Interaction (OD-WA3)
          → Kilo AT-WK11–13 + WA2–5,7–8,10
              → W1-G
OD-WK6 + parent amendments
  → W2 help target → W2-G
Help Package in-tree + server template registry SoR
  → W3 kind=template → W3-G
W1 list or H1 as-built
  → W4 kind=feature → W4-G
```

Echo **or** Tango FAIL ⇒ Delta FAIL. No waive.

W3 **blocker (honest):** Runner registry today is **client** on a tree that may be frozen. Spec §14 W3: “a server-side template registry SoR.” That is a **named parent**, not a silent edit of `web/lib/runner/`. If it requires Runner internals, **stop** — DL-539 three-OK.

---

## File allowlist (W0 — tight)

| Area | Touch |
|------|--------|
| `migrations/NNN_wiki_compile_candidates.sql` | **Create** after OD-WK4 |
| `server/` wiki compile candidate store + last-SHA stub | Alpha; **not** Member Wiki ①②⑤ |
| `web/app/app/wiki/**` | Inbox **region** only (administrator DOM gate, empty state, stay-put) |
| `web/app/app/iki/**` | **None in W0** (launcher is W1) |
| `agents/bench/oscar.md` | Lima seats charter |
| `Architecture/00-decision-log.md` | Lima: Wiki Spec v1.2 seated; W0 as-built |
| `Specs/FatTail-Labs-Wiki-Spec-v1_2.md` | Status line only when Coach gives BUILD AUTHORITY |

**Never in W0/W1 seeds:** `web/components/AppChrome.tsx`, `web/app/app/options-lab/**`, `web/lib/market/**`, `server/routes/market_stream.py`, Member Wiki compile of courses, IKI-P3 Runner chrome except `surface_key=iki.runner` as a **string in the declared list**.

---

## W0 — what “done” is (AT-WK5, WA1, WA6, WA11)

1. Sibling table `wiki_compile_candidates` exists (OD-WK4).  
2. Watcher stub: given a SHA, records last-registered SHA, **writes zero candidates** (first SHA = snapshot).  
3. `/app/wiki` inbox region: **administrator** sees empty state; Navigator **no node in DOM**.  
4. Stay-put: disposing nothing yet — empty state does not navigate away.  
5. `git diff --stat` inside allowlist.

---

## W1 — what “done” is (needs OD-WK2 stubs + OD-WK9)

Declared IKI/Wiki-local `surface_key` list (spec examples: `iki.wiki.entry`, `iki.wiki.article`, `iki.runner`). Launcher on those routes only. Admin-point upserts identity (WK7). Compile **wiki-only** stubs (help/both **disabled** in chooser). Board card. Publish → WK15 wiki-page file (deploy-kind vs course-kind as AT-WK13). Capture: `surface_key` + optional `state_key` token + route — **never** entity id, never Family B (AT-WA3).

---

## Seeds

| Seed | Agent | Depends | Feeds |
|------|--------|---------|--------|
| [`W0-1-india-table.md`](../agents/p-wiki-v12/seeds/W0-1-india-table.md) | India | Coach GO W0 + OD-WK4 | Alpha |
| [`W0-2-alpha-schema.md`](../agents/p-wiki-v12/seeds/W0-2-alpha-schema.md) | Alpha | W0-1 | Foxtrot / Charlie |
| [`W0-3-foxtrot-watcher-stub.md`](../agents/p-wiki-v12/seeds/W0-3-foxtrot-watcher-stub.md) | Foxtrot | W0-2 | Kilo |
| [`W0-4-charlie-inbox.md`](../agents/p-wiki-v12/seeds/W0-4-charlie-inbox.md) | Charlie | W0-2 | Echo / Tango |
| [`W0-5-echo-tango.md`](../agents/p-wiki-v12/seeds/W0-5-echo-tango.md) | Echo · Tango | W0-4 | W0-G |
| [`W0-6-mike-matrix.md`](../agents/p-wiki-v12/seeds/W0-6-mike-matrix.md) | Mike | W0-1 | W0-G |
| [`W0-7-kilo-at.md`](../agents/p-wiki-v12/seeds/W0-7-kilo-at.md) | Kilo | W0-3 · W0-4 | W0-G |
| [`W0-8-lima-oscar-dl.md`](../agents/p-wiki-v12/seeds/W0-8-lima-oscar-dl.md) | Lima | W0-1 | W0-G |
| [`W1-*.md`](../agents/p-wiki-v12/seeds/) | (blocked) | W0-G · OD-WK2 · OD-WK9 | W1-G |

---

## W0-G / later gates (Delta)

**W0-G:** AT-WK5 · AT-WA1 · AT-WA6 · AT-WA11 · Mike write-matrix note · Oscar charter exists · no course-path edits · no `iki_public` · no AppChrome/OL.  
**W1-G:** AT-WK11, WK12, WK13 wiki-only · AT-WA2–5, 7–8, 10 · help/both disabled.  
**W2-G–W4-G:** as spec §10 tags.

---

## Relationship to other boards

| Board | Role |
|-------|------|
| `agents/p-wiki/` | Member Wiki **spine** (browse/page/search as-built). **Do not execute those seeds for v1.2.** |
| `agents/p-iki-lab/` | IKI Runner chrome (IKI-P3). Wiki Spec may **name** `iki.runner` as a `surface_key`; it does not restyle the runner. |
| Knowledge-vault Oscar | Different product unless Coach unifies the callsign. This spec’s Oscar is Labs wiki compiler. |

---

## Coach stamp

- [ ] **OD-WK4** = sibling `wiki_compile_candidates` (India rec) / other: ________  
- [ ] **GO W0** — this plan is the stamp (spec v1.2 seated for W0 only)  
- [ ] **Amend**  
- [ ] **Stop**

W1 is a **second stamp** after OD-WK2 and OD-WK9.

**Signed:** _(Coach)_  
**Date:**
