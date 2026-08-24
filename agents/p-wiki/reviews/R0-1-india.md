# R0-1 India — Wiki Agent Spec v0.1.2

**Agent:** India  
**Spec:** `Specs/FatTail-Labs-Wiki-Agent-Spec-v0_1_2.md`  
**Plan:** `docs/Wiki-Agent-Full-Agent-Bench-Plan-v0_1_2.md`  
**Date:** 2026-08-23  
**Build-readiness verdict:** **RETURNED** (spec is DRAFT; ODs unstamped). Architecture is **sound to stamp** if Coach accepts the sealed-transcript ruling below and OD-1…6 as proposed. India does not modify the spec.

---

## Named question (verbatim)

> Sealed session transcript is treated as contract evidence on the ledger row (mutable only while unsealed). Pages remain git-only. Rule on whether this satisfies the no-second-store invariant or whether the sealed transcript must move to git / board card.

**Ruling:** **Satisfies WIK-D1** for wiki **page bytes**. Does **not** require the sealed transcript to move to git or the board as a precondition of GO.

**Evidence / law**

- WIK-D1 (`Architecture/00-decision-log.md` 2026-07-28): MySQL holds a **rebuildable derived index**, never page content. Member Wiki v0.1 §3.0: *content* in git; *state/derived data* in MySQL.
- Spec §2 / §4: ledger is “state, never content”; “pages live in git.”
- Spec §3.1 (v0.1.2): session payload **is the contract**; it accretes then **seals as evidence**. WA10 requires the ledger to account for every contract received, including payload.

A second store of truth would be **draft markdown duplicated in MySQL as if it were the page**. A sealed transcript is the session contract’s envelope, not a wiki page. Mutable-while-unsealed matches the spec’s session exception (not a fork of `lab-wiki`).

**ADVISORY (not blocking):** Spec §7 still says “no content in contracts beyond pointers and source-authored summaries.” That sentence is written for `source_change`. Session transcripts are admin specifications. At the next spec rev, carve `kind=session` explicitly so §7 and §3.1 cannot be read as a contradiction. Optional belt: copy sealed transcript to `lab-wiki/raw/contracts/{id}.md` **in addition to** the ledger — not instead — if Coach wants git-visible evidence. India does **not** require that for no-second-store.

---

## Envelope schema

**ADVISORY.** ULID at portal, `contract_version` fail-loud, three kinds, `refs[]` as pointers — aligned with WA2/WA11. Source-change `content_pointer` as a read-API URL is the right anti-copy rule.

**ADVISORY.** Name the JSON schema file at WA-1 seed (`wiki_agent_contract.v1.json`) so unknown fields reject (fail-loud, not strip-and-continue).

---

## Source registry

**APPROVED as designed.** Unregistered principal → loud reject (WA2). Maps to as-built `agent_principals` (callsign) + a wiki-side registry row (slug, principal, kind, enabled). Do not overload `wiki_compile_candidates` (idle overlay, DL-545).

---

## Pointer-registry placement (WA-2)

**APPROVED — wiki tree, WA-2.** Canonical ids + URLs + hashes/updated-at cursors. **Not** lesson/help bodies. That is `corpus_items`-shaped **registry state** (Member Wiki §3.0 already allows registry in MySQL). Must not become a second authoring table. India: name it in the WA-2 seed (`corpus_items` reuse vs `wiki_contract_pointers`) — prefer **one** table, not both.

---

## No-second-store across the ledger

| Store | Allowed | Forbidden |
|-------|---------|-----------|
| `lab-wiki` git | page bytes, drafts | — |
| `wiki_pages_idx` | reindex cache only | upsert without reindex |
| `wiki_contracts` | envelope, status, SHAs, board ids, sealed session transcript as **evidence** | drafted page `body_md` |
| pointer registry | refs, cursors | canonical prose |

**BLOCKING if WA-1 implementation stores page markdown on `wiki_contracts`.** Not blocking in the spec as written.

---

## Isolation / DL-539

Portals specified; source-tree **delivery** is out of wiki packets. Pollers (OD-5) against **canonical read APIs** are wiki-side and WA11-legal. **BLOCKING:** WA-4 host chrome on every `/app/*` without three OKs (plan B3). Not a spec defect.

---

## Bench delta

Next invocation can cite: sealed transcript = contract evidence, not a page; pointer registry is wiki-side WA-2; do not reuse `wiki_compile_*` as the ledger.

**Flagged:** §7 vs §3.1 session payload wording (advisory carve-out).
