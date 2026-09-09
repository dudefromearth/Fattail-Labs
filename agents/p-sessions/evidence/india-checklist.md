# GSC0-1 — India · Spec integrity

**Agent:** India  
**Date:** 2026-09-09  
**Machine:** Ernies-MacBook-Pro.local (Coach's MacBook — Spec §0 development)  
**Plan:** `docs/Sessions-Global-Session-Clock-Full-Agent-Bench-Plan-v1.2.md`  
**Spec:** `Specs/FatTail-Labs-Sessions (Global Session Clock).md`  
**Product code:** none. Spec: not edited.

---

## Spec hash (procedure for Lima at GO)

```bash
shasum -a 1 "Specs/FatTail-Labs-Sessions (Global Session Clock).md"
```

**This session:** `81984ba9f2394d52aa359cefcdb108451fdec9e3` — **matches** plan land hash.

Plan v1.2:

```bash
shasum -a 1 docs/Sessions-Global-Session-Clock-Full-Agent-Bench-Plan-v1.2.md
```

**This session:** `ae068f612b6cb5e2f413f3e497c8e296d6183304`.

**Procedure at GSC0-0:** re-run both commands; paste whole-file sha1 into `agents/go/GSC-W0.md` “at stamp” cells and into the DL. **Do not write the hash into the Spec.** Spec is immutable (India invariant 1).

---

## Verdict (build readiness)

**RETURNED until Coach stamps `agents/go/GSC-W0.md`.** That is the process, not a Spec defect. After stamp: India would APPROVE this plan for GSC1 **provided** the allowlist stays out of DL-539 trees (see Flagged).

No invariant / law / system **block** on the Spec dates or the DAG.

---

## L-locks are provisional

| Location | How L1–L11 are described |
|----------|--------------------------|
| Plan §2 preamble | “provisional until then” (GSC0-0) |
| Plan CHARTER | “Coach locks (provisional until GSC0-0)” |
| Seeds GSC0-1 | FAIL if cited as stamped early |
| `agents/go/GSC-W0.md` | “**LOCKED** at this stamp” — **stamp effect**, not a claim they are already locked |

No GSC0 seed treats L1–L11 as already stamped. **PASS.**

---

## Phantom gate `GSC2-axis-G`

Grep of `agents/p-sessions/seeds/*.md` **Depends/Feeds** lines: **no seed Depends or Feeds `GSC2-axis-G`.** Mentions are N1 defect-history only (GSC0-1, GSC0-5, GSC0-G).

Plan §6 write-tree, GSC2-view **Must not write:** `timeAxis.ts` / `exchanges.ts` — **full stop (N1)**. DAG gate is **GSC2-G** only. Phase name `GSC2-axis` is a write-tree label, not a Delta gate.

**PASS** on live gates (no seed Depends/Feeds `GSC2-axis-G`; GSC2-view write ban is absolute).

**Note (not a Spec FAIL):** plan v1.2 still *mentions* the string `GSC2-axis-G` three times — fold table L55, risk register L560, §13 verification checkbox L617 (“No citation to `GSC2-axis-G`”). Those are defect-history / verify-the-fold lines, not a Delta gate. India does not edit the plan this session. Escalate to Coach/Juliet if the runner prompt’s “no citation” is meant as a literal grep of the plan file.

---

## OD-S conflicts (plan §1.3) — on-disk evidence, not picks

India does **not** dispose these. Quotes only.

### OD-S1 — `/resources/sessions` vs `/resource`

- Spec §3.3: `Route: /resources/sessions`
- As-built hub: `web/app/resource/page.tsx` canonical `siteUrl("/resource")`; `SiteHeader` `NAV` `{ href: "/resource", label: "Resources" }`
- Appearance allowlist (`server/appearance.py` `ALLOWED_MEMBER_HREFS`): `"/resources"` present; **`"/resource"` absent**

Both Spec sentences stay. Conflict is Coach’s.

### OD-S2 — child item vs tabs

`web/components/resources/ResourcesHub.tsx` `ResourcesSubNav`: in-page **buttons** `Library | Tags` (`role="tablist"`), not Links. Practice `PracticeSuiteNav` is Links — **pattern only; do not edit Practice.**

### OD-S3 — authenticated vs public hub

`web/app/resource/page.tsx`: `revalidate = 3600`, JSON-LD CollectionPage, no auth. Spec §3 entitlement: authenticated, Observer included, no new policy.

### OD-S4 — `session-clock.html`

Spec line 8 names it. Charlie packet locates or records missing. **Not a GSC0-G fail** (plan B1). India confirms GSC0-G seed 5b / “does not fail because HTML is missing.”

### OD-S0 — filename

On disk: `Specs/FatTail-Labs-Sessions (Global Session Clock).md` — no `Spec-v0_1`, no BUILD header. Do not delete.

---

## Neighbor quotes (plan §1.4) — verbatim check

| Plan assertion | Artifact | Quote found |
|----------------|----------|-------------|
| `p-resources` CLOSED v1.0 | `agents/p-resources/ORCHESTRATOR.md` L35 | `## Project status: **CLOSED (v1.0)**` |
| close gate PASS | `agents/p-resources/gate-reports/R7-project-close.md` L5 | `**Verdict:** **PASS**` |
| Resources pills Library \| Tags | `web/components/resources/ResourcesHub.tsx` L20–40 | `ResourcesSubNav`; tabs `library` / `tags` labelled Library / Tags |
| DL-539 frozen | `Architecture/00-decision-log.md` DL-539 | “Do not drift. Do not touch existing work.” Options Lab, Width Fit, Template Runner internals, Market Bus named frozen |

Quotes **match**. Not a FAIL.

---

## Plan §9.3 forbidden vs DL-539

Plan forbids: `web/lib/market/**` · `web/components/options-lab/**` · `web/lib/runner/**` · `server/routes/**` · `server/market_data/**` · `migrations/**` · Practice suite files · SiteHeader `NAV` · Dude One.

DL-539 (2026-08-22): Options Lab, Width Fit, Template Runner internals, Market Bus, Trade Log, “every other shipped or in-flight tree” frozen without three successive OKs.

**Alignment:** Sessions must not open those trees. **Opinion (not a block):** GSC3 **does** edit shipped Resources files (`ResourcesHub.tsx`, `ResourcesPageClient.tsx`). That is existing work under DL-539’s broad freeze. The **GSC0-0 GO token naming those files** is the license — not a silent three-OK. Coach stamp of GSC-W0 with JR4 / allowlist is sufficient if Coach treats this as a new board, not a raid on a frozen tree.

`web/styles/tokens.css` is shared; Echo additive `--color-session-*` only.

---

## DAG covers Spec §9–§10

Spec §9.1 → GSC2-axis ATs 01–05 (+ 06a/b/c plan).  
Spec §9.2 → GSC1 ATs 10–17.  
Spec §9.3 → GSC2-view ATs 20–22.  
Spec §9.4 → GSC5 ATs 30–35 (+ 36 plan).  
Spec §10 → GSC3/4/5/6 placement ATs 40–45.

**PASS** coverage. Spec §9.4 “zero network after initial page load” is **amended in the plan** (B3/N3) without editing the Spec — objection sits beside Spec §9.4 as plan law, Coach disposes via JR11.

---

## Coach content intact?

Yes. Spec not edited. Route `/resources/sessions` not rewritten. Objections labeled India.

## Bench delta

Hash procedure named. Neighbor quotes verified from disk. DL-539 vs Resources-edit called out so GSC3 does not discover it as a surprise FAIL.

## Flagged ideas

| ID | Idea | Why | Discuss with |
|----|------|-----|--------------|
| FI-GSC-I1 | Site-wide `/resource` vs `/resources` repair | Out of this ship; Lima known-divergence | Coach · Lima |
| FI-GSC-I2 | Resources hub files as DL-539 “existing work” | GO token must name them | Coach |

## Blocks (invariant / law / system only)

None.

## Opinions / recommendations (not blocks)

- JR1 `/resource/sessions` conforms to as-built hub prefix (Spec §3.4) without deleting Spec §3.3.
- OD-S4(c) if HTML missing — do not hold GSC1.
- Do not seat Alpha.
