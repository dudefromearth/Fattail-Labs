# Wiki Source Contract v0.1.4 — Full Agent Bench Plan v1.0

**Program:** Wiki (Source Contract). Help Package is **gone**.  
**Charge:** [`Specs/Charge-GB-Help-Package-Supersession-v1_0.md`](../Specs/Charge-GB-Help-Package-Supersession-v1_0.md)  
**Contract:** [`Specs/FatTail-Labs-Wiki-Source-Contract-Spec-v0_1_4.md`](../Specs/FatTail-Labs-Wiki-Source-Contract-Spec-v0_1_4.md) **APPROVED DL-560** · **B-3 closed DL-561**  
**Parent:** [`Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md`](../Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md) (H1 v0.2.1, **DL-555**). Wiki Agent Spec files are not the parent.  
**Board:** Wiki packets [`agents/p-wiki/`](../agents/p-wiki/). Factory/Gemba diffs [`agents/p-iki-factory/`](../agents/p-iki-factory/) + [`agents/bench/gemba.md`](../agents/bench/gemba.md) (P4 split).  
**As-built not rebuilt:** WA-1…WA-4, WU-0…WU-2. Portal, ledger, Oscar git+board, linkage, session panel, public read stay.

Juliet. **No product code until Coach stamps GO SC-0 / GO SC-1 / …** Seeds are written in the same body of work as each GO. This document is the executable plan (charge §6). Not implementation.

**Isolation:** Wiki tree for SC-1+. Factory files only in **SC-0 diffs** (signal-only, no hook). No emitters. No write into Courses/Help/Factory. Frozen trees need DL-539 three-OK. AppChrome / root layout stay out (WU-1 ruling B).

---

## Preconditions (closed)

| # | Condition | Evidence |
|---|-----------|----------|
| P1 | Contract stamped | **DL-560** |
| P2 / B-3 | Parent by file header | **DL-561** — `FatTail-Labs-Wiki-Spec-v0_2_1.md` v0.2.1 |
| P3 | L10 hash wins | **DL-560 ACCEPTED** |
| P4 | §6.1 diff owner | **Both (DL-560):** Lima wiki-side; Factory/Gemba board for Factory Spec OD-F10/§6/§9, IF-4 seeds, Gemba invariant 9, **IKI Factory board card** |

S7 **closed** (**DL-562**). OD-3 **closed as skill-delivered, no stub** (**DL-564** — earlier stub framing was wrong). Remaining holds: OD-4, 6, 7, 8, 9, 10, 12, 13, 14 — not resolved by default.

---

## The supersession (law)

There is no Help Package. Help is **S1** on the same envelope as Courses, IKI Factory templates, transcripts, YouTube, blogs, and admin push. One envelope, seven `source_kind`s, no per-source payloads.

**Factory IF-4 shrinks:** expose a **publication signal at Deploy**. No envelope, no delivery hook, no wiki page bytes. The Factory does not know the Wiki agent exists. The signal may land later; Wiki accepts it on arrival and does not block on name or path.

**Wiki WU-3 / SC-3:** poll the signal → compare `content_hash` to the Wiki-side watermark → fetch artifact → compose envelope **Wiki-side** → compose page or L12-decline → disposition.

Poll ≠ subscribe. **No emitters in this plan.**

---

## Invariants (L1–L12) — every packet

L1 one envelope · L2 shape independent of mechanism · L3 automated fill vs admin artifact+intent (never a schema form) · L4 no invention of substance · L5 git-only page bytes · L6 access default public · L7 disposition always · L8 no profit claims · L9 sources read-only; Wiki holds the watermark · L10 hash wins over signal · L11 publication-worthy only · L12 thin material → decline, `failed-partial` with reason, **no retry**. Throughput is not a health metric.

---

## Holds — do not default

| ID | Item | Effect on this plan |
|----|------|---------------------|
| **S7 / L11** | Development progress notes eligible for admin push? | **CLOSED (DL-562).** ARE NOT. Finished publishable material only. Delivery point, not a submission surface. No draft/queue/unfinished store. Agent does not review or hold human-submitted work. L12 decline largely gone on push. |
| **OD-3** | Transcript decomposition tooling | **CLOSED (DL-564).** Earlier stub framing **wrong — no stub.** Skill-delivered is a third in-scope mode. Coach has a working skill; it emits a complete envelope (`acquired_by` = `skill`). Wiki receives finished envelopes; it does not decompose raw transcripts. Wiring the skill emit is a later GO, not SC-0. S7 remains a different path. |
| **OD-4** | `publish_gate` absent | First ship uses **parent W5** (board for every class, v0.2.1 II.5). Per-source auto-publish stays hold |
| **OD-6** | Unpublish / deletion | `change_type: unpublished` handling **HELD**. No unpublish packet |
| **OD-7** | Blog RSS | **S6 HELD** |
| **OD-8** | Dedup across channels | **HOLD.** No dedup packet. Several pages from **one** transcript under **different instructions** (summary vs how-to) are honest — not this OD; do not collapse. Accidental cross-channel dup (livestream + YouTube + blog) remains unruled. |
| **OD-9** | Backfill bot fetches source metadata? | SC-2 implements **L3**: admin hands artifact + intent; agent infers **metadata** only and hashes what it composed. Fetch-from-source is **not** in first ship |
| **OD-10** | Descript publication signal | **S4 poll HELD** |
| **OD-12** | Sitemap which host / eighth kind | Sitemap stays D4 linkage target (WU-2 list exists). No eighth `source_kind` |
| **OD-13** | Poller watchdog | Non-blocking. Not first ship |
| **OD-14** | L11 line for finished vs in-flight specs | S7 does not ingest specs as a feed. Finished-spec-via-push **HELD** |

---

## What this plan ships vs does not

**Ships (when stamped):**

1. Envelope validation (required set §2.1–2.2), closed `source_kind` enum, loud abort, disposition return.  
2. Wiki-side watermark per `source_id`; hash comparison is the change test (L10).  
3. Poll path: signal as prefilter, hash confirm, fetch, compose. Cadence named; tick Foxtrot (local first).  
4. Push path: floating Wiki bot (existing `WikiAgentPanel`, ruling B) — artifact + intent only.  
5. P1 backfill through that bot; `content_hash` recorded on every landed item.  
6. Three §4 stale→replacement **diffs** before the first code packet.  
7. Characterization tests: unknown `source_kind` abort; L12 decline **with reason and no retry**.

**Does not:** emitters, webhooks, Factory-side envelope, agent writes into Courses/Help/Factory, flag-clearing, non-git page bytes, auth/payments, AppChrome, Help Package spec, `registration` push, subscribe.

**IF-4 is smaller:** signal only.

---

## Relationship to as-built wiki agent

Existing portal `kind` = `source_change` \| `registration` \| `session`. The Source Contract is **one new envelope**, not a second portal.

| As-built | Under this plan |
|----------|-----------------|
| `POST /api/wiki-agent/contracts` | Same URL. New `contract_version` / schema for Source Contract envelopes **or** an explicit sibling path India names in SC-1. **Not** a second ingestion product |
| `source_change` pollers (courseware, help) | Become poll **adapters** that fill the **one** envelope (S1/S2). No parallel `source_change` forever |
| `kind=registration` | **Retired as a payload shape.** S3 = `iki_factory_template` composed Wiki-side after Deploy **signal** |
| `kind=session` | Unchanged (parent III.3/III.4). Push (S7) may ride the session bot: artifact + intent, not a schema form |
| Oscar git + board W5 | Compose still git `status: draft` → board `awaiting_approval` (parent W5). L12 may produce **no page** + `failed-partial` |
| Pointer registry / `wiki_refs` | Reused. Watermark is a **new Wiki-side table**, not source-system state |

India SC-1 names the seam. Default proposal (India may amend): one portal, `source_kind` present ⇒ Source Contract schema; `kind=session` unchanged.

---

## Critical path

```
GO SC-0   [diffs — before any code]
  SC-0-1  Lima     wiki-side stale Help Package / registration-envelope language
  SC-0-2  Factory  Factory Spec OD-F10 / §6 / §9 → publication signal only
  SC-0-3  Gemba    invariant 9 realign to signal-only (charter diff, not rewrite)
  SC-0-4  Juliet   Factory plan IF-4 seeds: no hook
       → SC-0-G Delta   (three diffs landed; IF-4 visibly smaller; no envelope on Factory)

GO SC-1   envelope + watermark
  SC-1-0  India    one portal; no second store; enum closed
  SC-1-1  Alpha    schema + watermark table; disposition
  SC-1-2  Kilo     unknown source_kind abort; incomplete required set → failed-partial/rejected
       → SC-1-G

GO SC-2   push / P1 (OD-9 fetch HELD)
  SC-2-0  Echo+Tango  artifact + intent; no schema form; admin-only (existing panel)
  SC-2-1  Alpha       compose envelope Wiki-side; record content_hash; L12 decline path
  SC-2-2  Hotel       L4/L8/L12; guidelines still law
  SC-2-3  Kilo        hash recorded; L12 no retry; session still admin-only
       → SC-2-G

GO SC-3   poll P2 for S1+S2 only
  SC-3-0  Foxtrot     cadence + where the tick runs (local; MiniTwo only if Coach asks)
  SC-3-1  Alpha       signal prefilter if present; hash vs watermark; GET-only fetch
  SC-3-2  Kilo        hash wins over a lying signal (L10); silent-skip forbidden (L7)
       → SC-3-G

SC-3b S3  HELD until Factory publication signal exists (accept on arrival; no name lock)
S4 poll   HELD (OD-10)
S5 poll   optional later — feed-item-as-signal; not first stamp
S6        HELD (OD-7)
S4/S5 skill-delivered  named (OD-3 closed · DL-564). Envelope arrives complete. Wiring the skill = later GO, not SC-0. No stub.
unpublished      HELD (OD-6)
watchdog         HELD (OD-13)
```

**Never:** Factory POST of a Wiki envelope · `contracts:deliver` from Factory · Help Package completeness gate as Wiki law · AppChrome.

---

## Packets (cold-executable)

### SC-0 — stale→replacement diffs (first packet)

**In scope**

| Owner | File | Stale → correction |
|-------|------|-------------------|
| Lima | `Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md` IV.5.3, status WU-3 | Help Package / registration emit → Source Contract poll + Wiki-side envelope |
| Lima | `docs/Wiki-Spec-v0_2_1-Full-Agent-Bench-Plan-v1.0.md`, `agents/p-wiki/ORCHESTRATOR.md`, Arch 11 | WU-3 “Help Package spec named” → this plan |
| Factory | Factory Spec v0.1.5 OD-F10 / §6 / §9 | Deploy pushes complete registration envelope / incomplete package stops the belt → **Deploy exposes a publication signal only** |
| Juliet | Factory plan IF-4 seeds | Build delivery hook → **No hook. Signal only.** IF-4 **smaller** |
| Gemba | `agents/bench/gemba.md` invariants 4, 8, 9 | “complete Help Package” / “Deploy **pushes** the registration contract” → signal-only; Gemba never writes wiki pages; Gemba never builds an envelope |
| Factory | IKI Factory board card `web/components/admin/IkiFactoryBoard.tsx` | Help Package / envelope chrome on the card → **no Help Package copy**; floor state only |

Diffs only. Do not regenerate those documents. Coach Content Law: Factory/Gemba sentences that Coach wrote stay beside the correction if they are not the stale claim; the stale **claim** is replaced.

**Out of scope:** code, migrations, emitters, AppChrome.

**Invariants:** L1, L9, charge §4.

**Done when:** `git diff` shows replacement sentences; Gemba invariant 9 no longer says push/envelope; Factory IF-4 packet text has no hook; wiki WU-3 no longer waits on a Help Package spec. Delta quotes the three diffs. **LANDED 2026-08-24 · DL-562 · SC-0-G PASS.**

**Gate:** SC-0-G.

### SC-1 — envelope + watermark

**In scope:** `server/wiki_agent_schema.py` (or India-named module), `wiki_contracts` / new `wiki_source_watermarks` migration, portal validation, tests. Required fields §2.1–2.2. `source_kind` closed enum: `help_guide` · `course` · `iki_factory_template` · `transcript` · `youtube` · `blog` · `admin_push`. Unrecognized → loud abort + ledger `rejected`. Optional `acquired_by` when present: `poll` · `push` · `subscribe` · `skill`. Disposition `accepted` \| `failed-partial` \| `rejected` + `reason` if not accepted. Watermark: `(source_kind, source_id) → content_hash, seen_at` Wiki-side only.

**Out of scope:** poll adapters, Factory, compose/LLM, UI, OD-6 unpublish.

**Invariants:** L1, L2, L5 (no page bytes in MySQL), L7, L9, L10.

**Done when:**

- Valid envelope → `contract_id`, queryable disposition.  
- Unknown `source_kind` → 4xx + `rejected` + reason (characterization).  
- Missing required field → `failed-partial` or `rejected`, never invented substance.  
- Watermark row writable/readable; tests restore DB.  
- No MSC imports. No second portal unless India named it and Coach stamped.

**Gate:** SC-1-G.

### SC-2 — push / P1 backfill

**In scope:** evolve `WikiAgentPanel` (one orb, ruling B) so admin can hand an **artifact + intent** (no schema form). Server fills or asks for remaining required metadata (L3 infer/ask, not a form). `content_hash` of the composed envelope recorded on watermark **and** on the ledger. Oscar compose or L12 decline. Git draft + board if composed. Hotel guidelines remain law.

**Out of scope:** OD-9 fetch-from-source; schema form; AppChrome; poll; S6; decomposer.

**Invariants:** L3, L4, L5, L8, L11, L12.

**Done when:**

- Admin path never shows a field grid of the required set.  
- Every landed item has `content_hash` (P1 cutover law).  
- L12 on push is **residual** (S7 RULED: material is finished before arrival, so decline largely disappears). If a thin body is still handed: `failed-partial`, reason present, **no retry**, no page. Characterization test remains. Automated-channel L12 is SC-3 / SC-3b (thin Factory template → no page).  
- Existing session open/accrete/seal still works. Members never see the panel.

**Gate:** SC-2-G.

### SC-3 — poll P2 (S1 help, S2 courses)

**In scope:** Wiki-side GET-only reads of existing course/help **publication** surfaces (as-built pollers are the starting point). Publication signal if one exists, else hash-walk of the published catalog (signal is optimization). Compare hash to watermark; on change fetch and compose envelope; L10: if signal says new and hash matches watermark, **do not compose**. Foxtrot names cadence + process (local launchd later; MiniTwo only if Coach asks).

**Out of scope:** S3 until signal exists · S4 poll (OD-10) · S6 (OD-7) · subscribe · source-side writes · Factory tree.

**Invariants:** L9, L10, L7, L11 (published only — OD-11 closed).

**Done when:** one published course or help change produces an envelope + watermark update; unchanged hash → no new page; missing signal does not skip hash; disposition always. GET-only proof (WA-2 style).

**Gate:** SC-3-G.

### SC-3b — S3 Factory signal (not stamped)

When a Deploy publication signal exists, a **later GO** wires poll to it. Plan does not name the path. No Factory envelope. Hold until Coach points at the signal.

---

## Tests the plan owes (Kilo, same change as the packet)

| Test | Packet |
|------|--------|
| Unknown `source_kind` loud abort + ledger rejected | SC-1 |
| Incomplete required set → failed-partial/rejected, no invented body | SC-1 |
| L12 decline: complete envelope, thin body → failed-partial + reason, **zero retries**, no page bytes | SC-2 |
| `content_hash` stored on P1 land | SC-2 |
| L10: signal-new + same hash → no compose | SC-3 |
| Poller GET-only | SC-3 |
| Admin-only push UI (DOM + API) | SC-2 |

No completion-rate gate. No L12 retry/backoff/alert.

---

## File allowlists (when stamped)

### SC-0

Wiki spec/plan/Arch 11/ORCHESTRATOR (Lima). Factory Spec v0.1.5 named sections (Factory). Factory plan IF-4 rows. `agents/bench/gemba.md` invariant 4/8/9 **diffs**. IKI Factory board card `web/components/admin/IkiFactoryBoard.tsx`. No `web/lib/runner/**`.

### SC-1

`migrations/NNN_wiki_source_watermarks.sql` (India name). `server/wiki_agent_*.py`, `server/routes/wiki_agent.py`, tests. Not course/help/IKI trees.

### SC-2

`web/components/wiki/WikiAgentPanel.tsx` + wiki layout (already mounted). `server/wiki_agent_discharge.py` / session compose. Tests. **Never** AppChrome, `web/app/layout.tsx`, HelpLauncher.

### SC-3

Wiki-side poller modules. Foxtrot tick script (local). GET existing read APIs only.

---

## Gates (Delta, evidence, no waive)

| Gate | Evidence |
|------|----------|
| **SC-0-G** | Quoted diffs for §4 rows **including the IKI Factory board card**; IF-4 text has no hook; Gemba i9 has no push/envelope; board card has no Help Package copy; wiki WU-3 does not wait on Help Package; `git diff --stat` vs SC-0 allowlist |
| **SC-1-G** | Unknown kind abort captured; valid envelope `contract_id`; watermark round-trip; no page markdown in MySQL; house box tolerated 8 (OPF+curate) only |
| **SC-2-G** | Artifact+intent path; hash on ledger+watermark; L12 test output (reason, no retry, no commit); panel still `useIsAdmin` null for members; AppChrome empty |
| **SC-3-G** | GET-only trace; L10 disagreement: hash wins; disposition present; MiniTwo not required |

House box: tolerated 8 (OPF + Curate). SSR flake non-chargeable. Any other new failure is that packet’s.

---

## Coach stamp

- [x] **Spec v0.1.4** APPROVED (**DL-560**)  
- [x] **B-3** parent Wiki Spec v0.2.1 (**DL-561**)  
- [x] **L10** ACCEPTED  
- [x] **S7** finished-only delivery point; development progress ARE NOT eligible (**DL-562**)  
- [x] **OD-3** skill-delivered; no stub; envelope arrives complete (**DL-564**)  
- [x] **GO SC-0** (diffs first · **DL-562**; OD-3 correction **DL-564**)  
- [x] **GO SC-1** envelope + watermark (**DL-568**)  
- [x] **GO SC-2** S7 push artifact+intent (**DL-570**)  
- [x] **GO SC-3** poll S1+S2 GET-only (**DL-571**)  
- [ ] **SC-3b** when Factory signal exists  
- [ ] **Stop**

**Signed:** Juliet (plan v1.0 — no build authority)  
**Date:** 2026-08-24  
**SC-0 landed:** 2026-08-24  
**SC-1 landed:** 2026-08-24 · **DL-568** · SC-1-G PASS  
**SC-2 landed:** 2026-08-24 · **DL-570** · SC-2-G PASS  
**SC-3 landed:** 2026-08-24 · **DL-571** · SC-3-G PASS
