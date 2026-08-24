# R0-2 Mike — Wiki Agent Spec v0.1.2 (auth)

**Agent:** Mike  
**Spec:** `Specs/FatTail-Labs-Wiki-Agent-Spec-v0_1_2.md` §2 seating, §3.4 session, §3.5 portal  
**Date:** 2026-08-23  
**Verdict:** **RETURNED for GO** until Coach stamps; **auth design is implementable** with the minimal gap below. Spec not modified.

---

## Spec named question (verbatim from reviewers table)

> existing agent API key model (per WIK-D7, scoped keys e.g. `wiki:reindex`) — does it already support a contract-delivery scope set (`contracts:deliver`, per-source principals), or what is the minimal gap?

**Answer:** **It does not already support `contracts:deliver`.** The model **does** support per-source principals and scoped keys. **Minimal gap = one new scope string + mint keys on per-source principals + portal checks registry ∩ scope.**

**Evidence**

- WIK-D7: reindex = human admin **or** agent key with `wiki:reindex` (`Architecture/00-decision-log.md`; `server/routes/wiki.py` `require_actor(..., scopes=["wiki:reindex"])`).
- `server/agent_auth.py` `VALID_SCOPES` (lines 16–25) is a **closed frozenset**:

  `ai:run`, `ai:status`, `admin:read`, `admin:content`, `board:operate`, `wiki:reindex`.

  Unknown scopes raise `AgentAuthError` at mint (`normalize_scopes`). **`contracts:deliver` is not in the set.**
- Agent Identity Spec v1.0 §2.3 lists the same closed table (plus “never grant billing / key minting / membership”). Adding a scope is an **amendment to that allowlist**, not a new auth system.
- Per-source principals: `agent_principals.callsign` UNIQUE (`create_principal`). A `courseware` / `help` / `wiki-poller` / `iki-templates` principal can exist today. Keys bind `principal_id` + `scopes_json`.
- `guards.require_actor(scopes=[...])`: human administrator **bypasses** scope checks (lines 200–209); agents need **every** required scope. Bearer `ftl_ag_` **wins** over cookie (Agent Identity §3) — do not let a poller key ride a human session by accident.

**Minimal WA-1 gap (wiki tree, when GO’d)**

1. Add `contracts:deliver` to `VALID_SCOPES` and Agent Identity spec scope table (documentation parity).  
2. Source registry: slug → `principal_id` (or callsign) + enabled.  
3. `POST /api/wiki-agent/contracts` for `source_change` / `registration`: `resolve_actor` must be **agent**, `has_scopes(["contracts:deliver"])`, and actor id/callsign **matches** registered principal for `source`. Unregistered or wrong principal → **loud 403/400**, ledger `rejected` (Juliet note: prove separately from schema fail).  
4. `wiki-poller` is a registered principal under OD-5, same scope, `principal` field on the envelope = `wiki-poller`.  
5. Do **not** grant `contracts:deliver` on studio default keys (`ai:run`/`ai:status`).

Human admin should **not** POST source_change as themselves if we want attribution honest; they use **session** kind (below). Advisory: reject human cookie on `kind=source_change|registration`.

---

## `kind=session` — admin session cookie

**APPROVED as specified.** Spec §3.4: `admin` is “session-authenticated — this is a **human principal, not an agent key**.”

- Use `require_actor(human_admin=True)` / `require_admin` (cookie `ft_session`, live role check H1 in `guards.py`).  
- **BLOCKING if implemented:** accepting `ftl_ag_` bearer for `kind=session` (would mint session contracts without a human).  
- Conflict rule: if both cookie and bearer present, bearer wins — session open must **require cookie path** and **reject agent bearer**, even if a valid admin cookie is also sent.  
- `admin` field = `identity_id` from verified session, **server-assigned**, never trusted from the JSON body.

---

## Family B exclusion from envelopes

**BLOCKING for implementation (invariant W11), not a spec rewrite.**

Member Wiki v0.1 W11: no raw Family B in agent compilation context, transcripts, or shared pages.

| Allowed in envelope | Forbidden |
|---------------------|-----------|
| `context.surface`, `context.route` | Journal body, trade P&L, playbook private files, member ids as “entity” for practice rows |
| `context.entity` as **canonical Family A** ref (course, lesson, template `id@version`, help article key, wiki slug) | Trade-log fill ids, journal session ids, capital figures |

Sanitize `session` transcript server-side: if it embeds pasted P&L / account numbers, fail-loud or redact per Mike+Tango at WA-4 seed — **do not** compile it into a shared page.

`refs[]` are kind+id+canonical URL only (spec §3.1). Enforce URL allowlist to Labs canonical routes, not `?account=` query strings (`wiki_compile_surfaces.sanitize_capture` already strips query for the idle overlay — same discipline).

---

## Negative cases to prove at WA-1-G (when GO’d)

- Observer cookie → session open **404/401**.  
- Agent key with only `wiki:reindex` → source POST **403**.  
- Agent key `contracts:deliver` for `help` posting `source=courseware` → **rejected**.  
- Schema-valid body, **unregistered** principal → loud fail (distinct from schema 4xx).

**Secrets:** no keys in git, logs, or contract payload.

---

## Bench delta

`contracts:deliver` is a one-scope extension of the closed allowlist; session is cookie-only; Family B stays out of envelopes.
