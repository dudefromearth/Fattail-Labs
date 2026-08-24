# FatTail Labs — Wiki Source Contract Spec v0.1.2

**Status:** DRAFT for Coach stamp.
**Lineage:** v0.1 advisor draft → v0.1.1 Grok → v0.1.2 Coach rulings 2026-08-23 + advisor review.
**Supersedes:** the informal "Help Package" as the blocker for Wiki WU-3 and Factory IF-4.
**Parent:** ⚠️ **UNVERIFIED.** v0.1 cited *Wiki Agent Spec v0.1*; v0.1.1 cited *Wiki Spec
v0.2.1 (unified)* with no changelog entry for the change. Coach to confirm the filename and
version by file header. Every inheritance claim below depends on it. (**B-3, open.**)

---

## 0. Scope

One envelope. Every piece of content that enters the Wiki arrives through this contract —
Help, Courses, IKI Factory templates, transcripts, blogs, admin push. No side doors. No
bespoke per-source payloads.

This document defines the contract, the acquisition mechanisms, and the source catalog. It
does not specify storage migrations, UI, auth, or payment behavior.

| Field | Value |
|---|---|
| Active program | Wiki |
| Trees touched | Wiki agent contract surface; source-channel definitions |
| Touches outside program | **NONE** — §3.4 (watermark) is the ruling that keeps it so |

---

## 1. Governing laws

| # | Law |
|---|-----|
| **L1** | **One envelope.** Every source uses this contract. |
| **L2** | **Symmetry of shape.** Same envelope regardless of how it was acquired. Mechanism is transport, not schema. |
| **L3** | **Asymmetry of burden.** Automated acquisition fills the full required set. The human channel supplies artifact + `intent` only; the agent infers or asks. **An admin is never given a schema form.** |
| **L4** | **No invention.** Every claim on a produced page traces to a field or body in the envelope. The agent may infer **metadata** — subject terms, linkage hints, classification. The agent may never infer **substance** — claims, facts, body. *(Boundary promoted from a §2.4 note; advisor review A-1.)* |
| **L5** | **Git is the only writer** of page bytes. |
| **L6** | **Access default public.** Restriction is a stated field, never assumed. |
| **L7** | **Disposition is reported.** `accepted` / `failed-partial` / `rejected` + path + reason. Never a silent skip. |
| **L8** | **Process outcomes only.** No profit claims on produced pages. |
| **L9** | **Source systems are read-only.** The agent never writes state into Courses, Help, the Factory, or any other source system. It holds its own watermark. *(Coach ruling 2026-08-23: least invasive is best.)* |
| **L10** | **Hash is correctness; flags are optimization.** Change is determined by `content_hash` against the agent's watermark. A create/edit flag is a cheap prefilter so the agent need not re-hash the whole corpus each tick. **Where flag and hash disagree, the hash wins.** *(Advisor-proposed 2026-08-23 — pending Coach stamp.)* |

---

## 2. The envelope (binding — OD-2 closed at v0.1.1)

### 2.1 Required — composition

| Field | Meaning |
|-------|---------|
| `source_kind` | Closed enum — see §2.5 |
| `source_id` | Stable id inside that source system |
| `title` | Human title |
| `body` | Substance, or resolvable pointer to it |
| `body_format` | `markdown` · `transcript` · `html` · `structured` |
| `intent` | One line: what this is for |
| `origin_ref` | Canonical location (git path, route, URL, external id) |
| `origin_owner` | System or person accountable |
| `change_type` | `created` · `updated` · `unpublished` |

### 2.2 Required — transport and honesty

| Field | Meaning |
|-------|---------|
| `submitted_at` | When this envelope was produced |
| `content_hash` | Hash of payload — change detection, idempotency, and the correctness basis under L10 |

### 2.3 Optional — better pages, not blockers

| Field | Meaning |
|-------|---------|
| `version` | Source-system version where one exists |
| `subject_terms` | Topic hints |
| `linkage_hints` | Known related entities |
| `changed_summary` | What changed |
| `supersedes` | Prior `source_id` or hash this replaces |
| `access` | Absent = public. **See B-2, §8 — contested for `admin_push`.** |
| `publish_gate` | Human approval required before publish? Behavior when absent is **OD-4**. |
| `acquired_by` | Which mechanism produced this envelope — `poll` · `push` · `subscribe` |

### 2.4 Return — agent to caller

| Field | Meaning |
|-------|---------|
| `status` | `accepted` · `failed-partial` · `rejected` |
| `page_path` | Resulting git path where one exists |
| `linkages` | Linkages written |
| `reason` | Required when status ≠ `accepted` |

**Incomplete required set → `failed-partial` or `rejected`.** Never invent missing
substance. Never a silent skip.

### 2.5 `source_kind` — closed enum

`help_guide` · `course` · `iki_factory_template` · `transcript` · `youtube` · `blog` ·
`admin_push`

**Closed, per advisor review B-4.** An unrecognized value aborts loudly. Adding an eighth
kind is a versioned edit to this spec plus a decision-log entry — a new source is a new
governance surface, not a config tweak.

---

## 3. Acquisition mechanisms

Coach's correction, 2026-08-23: **poll is not the same as subscribe.** Three distinct
mechanisms, one envelope.

### 3.1 The three

| Mechanism | Who initiates | What it requires of the source |
|---|---|---|
| **Poll** | Agent, on a cadence | Nothing. The source does not know the agent exists. |
| **Push** | Human, via the floating Wiki bot | Nothing. |
| **Subscribe** | Source emits an event to the agent | An emitter must be built in the source system. |

**Ruling (Coach): mostly poll work.** Poll is the least invasive mechanism and is the
default for automated acquisition. Subscribe is **not in scope** for v0.1 — it is recorded
here as the third mechanism so that "poll" is never used loosely to mean it.

### 3.2 The poll path — two steps

1. **Detect.** The agent reads the source's create/edit flag as a prefilter, then compares
   `content_hash` against its own watermark.
2. **Fetch.** Where change is confirmed, the agent fetches the artifact and composes the
   envelope.

The flag says *something changed*. It is not the payload and it is not the proof — L10.

### 3.3 The push path — one step

The administrator points the **floating Wiki bot** at an artifact and states intent. The
agent composes. Under L3 the admin is never shown a schema.

*Naming: "floating Wiki bot" is Coach-confirmed 2026-08-23. It is unrelated to the
floating trader bot in the Strategy Lab alerts work — different surface, different job.
Advisor review A-3 closed.*

### 3.4 The watermark — L9 in practice

The agent holds its own record, **on the Wiki side**, of what it has last seen per
`source_id`. It does not clear flags, set fields, or write any state into Courses, Help,
the Factory, or any external feed.

**This is the ruling that keeps this program's touch list at NONE.** Clearing flags would
mean writing into three trees outside the active program, two of which have their own
owners.

---

## 4. Phasing — backfill, then listen

**Coach ruling 2026-08-23.**

| Phase | Mechanism | Scope |
|---|---|---|
| **P1 — Backfill** | **Push** (floating Wiki bot) | Existing courses, existing help guides, existing YouTube videos, existing Descript transcripts. The admin works through the standing library. |
| **P2 — Steady state** | **Poll** | Once the library is caught up, the system listens. New and changed items are acquired automatically. |

### 4.1 Two consequences, flagged

**During P1, S7 is the primary channel by volume.** L3 was written on the assumption that
the human channel is occasional. It is not, during backfill. This sharpens B-2 (§8) rather
than softening it — the channel carrying the most traffic is the one with no schema in
front of it.

**P1 must record `content_hash` for everything it lands**, or P2 cutover will read the
entire backfilled library as new and re-register it. The hash and `supersedes` are what
make the transition quiet. This is why §2.2 holds `content_hash` as required rather than
optional, and it is the practical reason L10 matters.

### 4.2 Open — the backfill fetch question

When the admin points the floating bot at an **existing** course, help guide, or video:

- Does the bot **fetch that item's metadata itself** — `origin_ref`, `version`,
  `content_hash` already present in the source system — with the admin supplying only
  intent?
- Or does it take **only what the admin hands it**?

If it fetches, P1 is human-triggered and machine-filled: provenance survives, L4 is better
served, and P2 cutover is clean because the hash is already on record. That is arguably a
fourth mode rather than a variety of push.

**Not decided here. OD-9.**

---

## 5. Source catalog

### 5.1 Automated sources

| # | Source | `source_kind` | P1 | P2 | Notes |
|---|--------|---------------|----|----|-------|
| **S1** | Help guides | `help_guide` | Push | **Poll** — create/edit flag | Caller number one |
| **S2** | Courses | `course` | Push | **Poll** — create/edit flag | |
| **S3** | IKI Factory templates | `iki_factory_template` | — | **Poll** — create/edit flag | No standing library; Factory output begins new |
| **S4** | Descript / livestream transcripts | `transcript` | Push | Poll — **OD-10** | Decomposition skill: **OD-3** |
| **S5** | YouTube published | `youtube` | Push | Poll — feed comparison, no flag | Same skill family as S4 |
| **S6** | Blogs | `blog` | — | Poll — RSS, no flag | Feed does not yet exist: **OD-7** |

**S4–S6 have no create/edit flag to read.** They are feeds. Detection is hash-against-
watermark with no prefilter, which is exactly the case L10 was written for. Whether
Descript exposes a change signal at all is **OD-10** — advisor does not know.

### 5.2 Human source

| # | Source | `source_kind` | Notes |
|---|--------|---------------|-------|
| **S7** | Admin push, via the floating Wiki bot | `admin_push` | Artifact + `intent` only. Covers text specs, user guides, development progress, and any ad hoc page — plus the entire P1 backfill. |

### 5.3 Excluded — decisions, not omissions

| Source | Why (Coach) |
|--------|-----|
| Specs, as an automated feed | Constant churn, many versions; the spec's audience is not the Wiki's audience |
| Decision log, as an automated feed | Individual entries too fragmented to make a useful page alone |
| Member-generated content | Out of scope. Admin-generated is the exception. |

**Preserved idea — decision-progress graph.** Coach raised turning the decision log into a
graph showing the progression of decisions. Not dropped: it is a **derived** artifact
requiring synthesis across many entries, which no automated mechanism can produce without
violating L4. Resolution: the administrator synthesizes and submits the result via **S7**.

### 5.4 Volume — restored from v0.1

Coach's projection: **three to five items per day** from S4–S6, and **up to ten per day**
from S3 at Factory cadence.

At that rate composition is not the constraint — **linkage quality is.** A thousand-plus
pages a year with weak linkage is a landfill, not a wiki. This is the load-bearing reason
D4 matters and is recorded here because v0.1.1 dropped it.

---

## 6. Factory and Wiki binding

**⚠️ Reversal from v0.1.1.** v0.1.1 §4 stated *"Factory Deploy pushes this envelope"* and
*"push is preferred for S3."* **Coach ruled poll on 2026-08-23.** The Factory builds no
delivery hook and no emitter.

| Board | Obligation |
|-------|------------|
| **Factory IF-4** | Set the create/edit flag on template Deploy. **Nothing else.** No envelope construction, no delivery hook, no wiki page bytes. The Factory does not know the agent exists. |
| **Wiki WU-3** | Poll the flag; confirm change by hash against watermark; fetch; compose from envelope fields and linkage evidence only; declare new vs update; return disposition. Human publish gate per OD-4. |

This is a **reduction** in Factory obligation. IF-4 gets smaller, not larger.

---

## 7. Review routing — restored from v0.1

Dropped in v0.1.1. Advisor review A-5.

| Reviewer | Concern |
|---|---|
| **Mike** | **B-2** — `access` optional on `admin_push`, sharpened by P1 volume. Blocking. |
| **Hotel** | **S4/S5.** Livestream and YouTube transcripts are trading content, agent-composed, published to a wide-open wiki. Largest gap in v0.1.1. |
| **India** | Contract boundary; that this does not become a parallel ingestion path alongside the existing `corpus_items` registrar; L9 watermark placement |
| **Tango** | Composed-page framing; L8 enforcement on inherited source material |
| **Oscar** | Whether the envelope gives the composer what it actually needs |
| **Foxtrot** | Poll cadence and where the tick runs |

---

## 8. Open decisions

| ID | Decision | Status |
|----|----------|--------|
| **B-2** | `access` optional + S7 = quiet over-publish path. An admin pushes a dev-progress note, omits a field they were never shown (L3), and internal material publishes. Nothing fails loud. **Sharpened by §4.1.** | **BLOCKING — Mike** |
| **B-3** | Parent document filename and version | **BLOCKING — Coach file header** |
| **OD-3** | Decomposition skills for S4/S5 — in v0.1 or later | Open |
| **OD-4** | Publish gate per source; behavior when `publish_gate` absent | Open |
| **OD-6** | Unpublish / deletion behavior | Open |
| **OD-7** | Blog RSS feed — who builds it, in-program or out | Open |
| **OD-8** | Dedup across channels — one livestream, its transcript, its YouTube publish, a blog about it: one page or several | Open |
| **OD-9** | Backfill fetch — does the floating bot pull source metadata itself (§4.2) | **New, open** |
| **OD-10** | Does Descript expose a change signal, or only a list | **New, open** |
| **L10** | Hash-over-flag — advisor-proposed, awaiting stamp | Pending |

**Closed:** OD-1 (name, v0.1.1) · OD-2 (envelope, v0.1.1) · OD-5 (poll for S1/S2/S3;
subscribe out of scope; push for P1 backfill) · B-1 (resolved by OD-5) · B-4 (enum closed) ·
A-1 (promoted to L4) · A-3 (floating Wiki bot confirmed) · A-4 (hash footer restored) ·
A-5 (routing restored).

---

## 9. Cross-reference — not folded in

**D4 linkage** still has no spec of its own. Outlined in session: event-driven on update
*plus* a scheduled full-corpus sweep finding orphans, missing links, stale links, and
clusters deserving an index page; the sweep proposes rather than silently rewrites; it also
reads the `fattail.ai` sitemap to link outward. Preserved intact, awaiting Coach's word.

§5.4 is the argument for why it should not wait long.

---

## 10. Changelog

| Ver | Date | Notes |
|-----|------|-------|
| **v0.1.2** | 2026-08-23 | Coach rulings: poll ≠ subscribe (§3); poll for S1/S2/S3; subscribe out of scope; watermark, source systems read-only (L9); P1 backfill by push → P2 listen (§4). **Reversal: v0.1.1 §4 Factory push → poll (§6).** Advisor review applied: enum closed (B-4), L4 inference boundary (A-1), L10 proposed, routing restored incl. Hotel (A-5), volume note restored, hash footer restored (A-4). B-2 and B-3 remain blocking. OD-9, OD-10 opened. |
| **v0.1.1** | 2026-08-23 | OD-1 closed (name). OD-2 closed (binding envelope). Help Package language retired. S3 folded under one contract. |
| **v0.1** | 2026-08-23 | First advisor draft. |

---

## 11. Content hash footer

`Wiki-Source-Contract-Spec-v0.1.2` — content hash to be stamped by Lima on landing, per
the standing guard against byte-identical version drift. The changelog records intent; the
hash detects the failure. Both are kept.

---

**End of Wiki Source Contract Spec v0.1.2**
