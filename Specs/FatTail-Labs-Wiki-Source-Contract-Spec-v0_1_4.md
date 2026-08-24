# FatTail Labs — Wiki Source Contract Spec v0.1.4

**Status:** APPROVED (Coach 2026-08-23 · **DL-560**). **B-3 closed (DL-561).**
**S7 RULED · OD-3 RULED (Coach 2026-08-24 · GO SC-0 · DL-562).** Remaining
holds: OD-4, 6, 7, 8, 9, 10, 12, 13, 14 — not resolved by default.
**Lineage:** v0.1 advisor draft → v0.1.1 Grok → v0.1.2 Coach rulings + advisor review →
v0.1.3 generic publication signal → v0.1.4 publication-worthy standard (Coach 2026-08-23).
**Supersedes:** the informal "Help Package" as the blocker for Wiki WU-3 and Factory IF-4.
**Parent:** [`Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md`](./FatTail-Labs-Wiki-Spec-v0_2_1.md)
— H1 **Wiki Spec v0.2.1 (Unified)**; content version **v0.2.1**; APPROVED **DL-555**.
Wiki Agent Spec files (`…-v0_1.md`, `…-v0_1_3.md` lineage) are SUPERSEDED and are
**not** the parent. (**B-3 closed.**)

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
| **L7** | **Disposition is reported.** `accepted` / `failed-partial` / `rejected` + path + reason. Never a silent skip. Under L12, `failed-partial` is a **correct outcome**, not a defect — see §2.4. |
| **L8** | **Process outcomes only.** No profit claims on produced pages. |
| **L9** | **Source systems are read-only.** The agent never writes state into Courses, Help, the Factory, or any other source system. It holds its own watermark. *(Coach ruling 2026-08-23: least invasive is best.)* |
| **L10** | **Hash is correctness; signals are optimization.** Change is determined by `content_hash` against the agent's watermark. A publication signal is a cheap prefilter so the agent need not re-hash the whole corpus each tick. **Where signal and hash disagree, the hash wins.** *(Coach ACCEPTED 2026-08-23 · **DL-560**.)* |
| **L11** | **Publication-worthy only — universal.** Only finished, publishable material enters the Wiki, through **every** mechanism. Not drafts, not working notes, not in-flight state. The standard does not vary by source or by mechanism. *(Coach ruling 2026-08-23.)* |
| **L12** | **No content is better than poor content.** Where the material is too thin to make a page worth reading, the agent **declines to compose** and reports why. A Wiki that says nothing on a topic is honest; one that publishes a hollow page has told the reader there is nothing more to know. *(Coach ruling 2026-08-23.)* |

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
| `acquired_by` | Which mechanism produced this envelope — `poll` · `push` · `subscribe` · `skill` |

### 2.4 Return — agent to caller

| Field | Meaning |
|-------|---------|
| `status` | `accepted` · `failed-partial` · `rejected` |
| `page_path` | Resulting git path where one exists |
| `linkages` | Linkages written |
| `reason` | Required when status ≠ `accepted` |

**Incomplete required set → `failed-partial` or `rejected`.** Never invent missing
substance. Never a silent skip.

**`failed-partial` is not a defect state.** Under L12 it is the correct result whenever the
material will not support a page worth reading — the agent had thin substance, declined to
compose, and said so. Two distinct causes, both legitimate, both reported with a reason:

| Cause | Meaning |
|---|---|
| **Incomplete envelope** | Required fields absent. A transport failure. |
| **Insufficient substance (L12)** | Envelope complete, material too thin. A judgment, correctly exercised. |

A board full of `failed-partial` cards from the second cause is a functioning Wiki, not a
backlog. It is only a defect if the reason is missing.

*What L12 adds beyond L4:* L4 stops the agent inventing. It does not stop the agent
composing a technically-sourced but useless page from a weak envelope. L12 does.

**L12 on push vs poll (Coach 2026-08-24 · S7 RULED).** On the **push** path the L12
decline case largely disappears: material is finished before it arrives (§5.2). The
same is true of **skill-delivered** envelopes, which arrive fully formed (§3.6). L12
still governs the **automated poll** channels in full — a thin Factory template still
produces no page.

### 2.5 `source_kind` — closed enum

`help_guide` · `course` · `iki_factory_template` · `transcript` · `youtube` · `blog` ·
`admin_push`

**Closed, per advisor review B-4.** An unrecognized value aborts loudly. Adding an eighth
kind is a versioned edit to this spec plus a decision-log entry — a new source is a new
governance surface, not a config tweak.

---

## 3. Acquisition mechanisms

Coach's correction, 2026-08-23: **poll is not the same as subscribe.** One envelope,
four mechanisms. Subscribe is recorded so "poll" is never used loosely to mean it.
**Skill-delivered** is a later ruling (2026-08-24 · OD-3) — a third *in-scope* delivery
mode, distinct from push and poll.

### 3.1 The four

| Mechanism | Who initiates | What it requires of the source |
|---|---|---|
| **Poll** | Agent, on a cadence | Nothing. The source does not know the agent exists. |
| **Push** | Human, via the floating Wiki bot | Nothing. |
| **Skill-delivered** | Skill, given Coach's instruction | Nothing of the source system. The skill emits a complete envelope. |
| **Subscribe** | Source emits an event to the agent | An emitter must be built in the source system. |

**Ruling (Coach): mostly poll work.** Poll is the least invasive mechanism and is the
default for automated acquisition. Subscribe is **not in scope** for v0.1. Skill-delivered
**is** in scope for S4/S5: Coach has a working transcript-decomposition skill; it is
modified to emit this envelope (§3.6). `acquired_by` values: `poll` · `push` ·
`subscribe` · `skill`.

### 3.2 The poll path — two steps

1. **Detect.** The agent reads the source's **publication signal** (§3.5) as a prefilter,
   then compares `content_hash` against its own watermark.
2. **Fetch.** Where change is confirmed, the agent fetches the artifact and composes the
   envelope.

The signal says *something became live*. It is not the payload and it is not the proof — L10.

### 3.5 The publication signal — generic, not per-source

**Coach ruling 2026-08-23.** The contract does **not** name a Factory-specific flag, a
courseware-specific flag, or a help-specific flag. It names one concept.

> **Publication signal:** the state transition in a source system at which an artifact
> becomes live. Each polled source exposes one. The agent polls that transition.

| Source system | Local name for the same moment |
|---|---|
| IKI Factory | **Deploy** |
| Courses | **Publish** |
| Help guides | **Publish** |
| Blogs | **Publish** (RSS item appears) |
| YouTube | **Publish** (feed item appears) |
| Descript | OD-10 — unknown whether a signal exists |

Deploy and Publish are the same event wearing local names. Specifying them separately would
reintroduce the per-source bespoke shape that L1 exists to prevent.

**Status:** the Factory signal **does not exist yet** and may land the evening of
2026-08-23. The contract is written to accept it whenever it arrives; the Wiki side does not
block on its name or location. Adding the signal to a source system is a source-side
obligation (§6), not a contract change.

**Created ≠ published — OD-11 closed (Coach, 2026-08-23).** The agent sees only material
worth publishing. It never sees drafts. Session language was "create or edit flag"; the
ruling is that the agent polls **publication**, not creation.

Two consequences: the platform's draft→publish invariant is preserved from the outside, and
**no source system need expose draft state to the agent at all** — which narrows the read
surface as well as the write surface (L9).

### 3.3 The push path — one step

The administrator hands the **floating Wiki bot** a **finished, publishable** artifact
and states intent. The bot is a **delivery point**, not a submission surface. Coach
prepares content to completion **outside** the system and hands it off. There is no
draft state, no queue, and no unfinished-work store on either side. The agent does
**not** review, hold, or warehouse human-submitted work. Under L3 the admin is never
shown a schema.

*Naming: "floating Wiki bot" is Coach-confirmed 2026-08-23. It is unrelated to the
floating trader bot in the Strategy Lab alerts work — different surface, different job.
Advisor review A-3 closed. S7 finished-only: Coach 2026-08-24.*

### 3.4 The watermark — L9 in practice

The agent holds its own record, **on the Wiki side**, of what it has last seen per
`source_id`. It does not clear flags, set fields, or write any state into Courses, Help,
the Factory, or any external feed.

**This is the ruling that keeps this program's touch list at NONE.** Clearing flags would
mean writing into three trees outside the active program, two of which have their own
owners.

### 3.6 The skill-delivered path — one step (OD-3 closed)

**Coach ruling 2026-08-24.** The earlier stub framing was **wrong. No stub.**

Coach has a working transcript-decomposition skill. It is modified to emit a **complete
Source Contract envelope** directly: summary or extraction in `body`, plus `title`,
`origin_ref`, `content_hash`, and the rest of the required set. Coach supplies the
instruction ("summarize this and fill the fields"); the skill does the rest. The
envelope arrives fully formed. `acquired_by` = `skill`.

This is a third in-scope delivery mode, distinct from **push** (human hands a finished
artifact + intent) and **poll** (agent detects, fetches, composes). The Wiki agent does
not decompose raw transcripts and does not hold unfinished work.

One transcript may legitimately produce **several** envelopes under different
instructions — a summary and a how-to from the same video. That is intentional and
honest. Each envelope has its own `source_id`. Do not collapse them. That is not the
accidental cross-channel duplication **OD-8** holds.

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
variety of push, not skill-delivered (§3.6).

**Not decided here. OD-9.**

---

## 5. Source catalog

### 5.1 Automated sources

| # | Source | `source_kind` | P1 | P2 | Notes |
|---|--------|---------------|----|----|-------|
| **S1** | Help guides | `help_guide` | Push | **Poll** — publication signal (Publish) | Caller number one |
| **S2** | Courses | `course` | Push | **Poll** — publication signal (Publish) | |
| **S3** | IKI Factory templates | `iki_factory_template` | — | **Poll** — publication signal (Deploy) | No standing library. **Signal does not exist yet** — §3.5. |
| **S4** | Descript / livestream transcripts | `transcript` | Push and/or **skill-delivered** | Poll — **OD-10** | Skill-delivered (§3.6 / §5.1.1). Envelope arrives complete. |
| **S5** | YouTube published | `youtube` | Push and/or **skill-delivered** | Poll — feed item is the signal | Same skill family as S4 |
| **S6** | Blogs | `blog` | — | Poll — RSS item is the signal | Feed does not yet exist: **OD-7** |

**For S5 and S6 the feed *is* the publication signal** — an item appearing in the feed is
the transition. There is no separate flag to read, and none is needed. Detection remains
hash-against-watermark per L10.

Whether Descript exposes any publication signal is **OD-10** — advisor does not know.

**Sitemaps are not a source.** An XML sitemap is an index of what exists, not a feed of what
became live, and produces no page under this contract. It remains a **D4 linkage target**
(§9). Whether that means the `fattail.ai` sitemap, the `labs.fattail.ai` sitemap, or both is
**OD-12**. If Coach wants wiki pages composed *about* site pages rather than merely linked
to them, the sitemap becomes an eighth `source_kind` and §2.5 reopens — that is a ruling,
not an advisor default.

### 5.1.1 Skill-delivered (OD-3 closed) — no stub

**Coach ruling 2026-08-24.** The earlier stub framing was **wrong. No stub.** Transcript
decomposition is a **skill**, not a Wiki subsystem. Coach has a working skill. It is
modified to emit a complete Source Contract envelope (§3.6). Coach supplies the
instruction; the skill fills the required set. The Wiki agent receives a finished
envelope (`acquired_by` = `skill`) and does not decompose raw transcripts.

A summary and a how-to from the same video are two honest pages. Do not collapse them
(§3.6). OD-8 remains the hold on accidental cross-channel duplication.

Whole-transcript-as-finished-artifact via **S7** remains a different path: Coach
finishes outside the system and hands off a publishable body through the bot.

### 5.2 Human source

| # | Source | `source_kind` | Notes |
|---|--------|---------------|-------|
| **S7** | Admin push, via the floating Wiki bot | `admin_push` | **Delivery point only.** Finished, publishable artifact + `intent`. Carries the entire P1 backfill, plus ad hoc pages and derived syntheses — all finished before handoff. |

**S7 RULED (Coach 2026-08-24).** The admin push bot accepts **finished, publishable
material only.** There is no draft state, no queue, and no unfinished-work store on
either side. Coach prepares content to completion outside the system and hands it off.
The bot is a delivery point, not a submission surface. The agent does not review or hold
human-submitted work. Development progress notes are **not eligible**.

| Artifact | Eligible? |
|---|---|
| Finished user guide | Yes |
| Completed backfill item (course, help guide, video, transcript) | Yes |
| Derived synthesis, e.g. the decision-progress graph (§5.3) | Yes — finished before handoff |
| **Development progress notes** | **No** — in-flight state, not publishable material |
| **In-flight specs** | **No** — same reason specs are excluded as a feed (§5.3) |

**L12 on this path.** Because material is finished before it arrives, the L12 decline
case largely disappears on S7. L12 still governs the automated channels in full — a thin
Factory template still produces no page.

Where the line falls between a **finished spec** and an in-flight one remains **OD-14**
(hold). Finished user guides are in. Development progress is out.

**This is what closes B-2.** The `admin_push` disclosure path ran through internal material
entering the Wiki. Under L11 that material is not eligible in the first place, so there is
no quiet over-publish path to defend against. OD-4's human gate becomes defense in depth
rather than the load-bearing fix.

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

**Under L12, signal volume is not page volume.** Ten Deploys in a day does not mean ten
pages. The signal fires, the agent judges, and some produce nothing. A day where the Factory
deploys ten templates and the Wiki gains four pages is the system working — not the agent
falling behind. **Throughput is not a health metric for this agent.**

---

## 6. Factory and Wiki binding

**⚠️ Reversal from v0.1.1.** v0.1.1 §4 stated *"Factory Deploy pushes this envelope"* and
*"push is preferred for S3."* **Coach ruled poll on 2026-08-23.** The Factory builds no
delivery hook and no emitter.

| Board | Obligation |
|-------|------------|
| **Factory IF-4** | Expose a **publication signal at Deploy** (§3.5). **Nothing else.** No envelope construction, no delivery hook, no wiki page bytes. The Factory does not know the agent exists. |
| **Wiki WU-3** | Poll the signal; confirm change by hash against watermark; fetch; compose from envelope fields and linkage evidence only; declare new vs update; return disposition. Human publish gate per OD-4. |

This is a **reduction** in Factory obligation. IF-4 gets smaller, not larger.

### 6.1 Downstream documents made stale by this reversal

Documentation parity: these land in the same body of work as the stamp, as **diffs, not
rewrite packets.**

| Document | Stale claim | Correction |
|---|---|---|
| Factory Spec OD-F10 / §6 / §9 | Deploy pushes a complete registration envelope; incomplete package stops the belt | Deploy exposes a publication signal only. **Landed SC-0 · DL-562.** |
| Factory plan IF-4 seeds | Build delivery hook | No hook. Signal only. **Landed SC-0 · DL-562.** |
| Gemba charter, invariant 9 | "Deploy pushes registration" | Realign to signal-only. **Landed SC-0 · DL-562.** |
| IKI Factory board card (`web/components/admin/IkiFactoryBoard.tsx`) | Stale Help Package / registration-envelope chrome on the card | No Help Package copy. Card shows Factory floor state (pickup, waiting-for-skills, blocked reasons). Publication signal is IF-4; Wiki composes. **Added to this list so the board and the documents say the same thing.** |

### 6.2 Cost of the reversal — recorded, not hidden

Under push, an incomplete envelope **stopped the belt**: failure was loud, at the Factory,
immediately. Under poll, the Factory deploys and moves on. If composition never happens, or
if the poller itself is down, **nothing surfaces anywhere** — which is the silent-skip shape
L7 forbids.

The trade is deliberate and correct: less invasiveness for a weaker failure signal. But L7
is not satisfied by the poll path alone. A Wiki-side watchdog that alarms when the watermark
stops advancing is the obvious remedy. **Not written into this spec — advisor raised it
2026-08-23, unruled. OD-13.**

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
| **B-2** | `access` optional + S7 over-publish path | **Closed by L11** — internal material is no longer eligible for any mechanism (§5.2). Residual for Mike: whether `access` should still be required on `admin_push` as defense in depth. |
| **B-3** | Parent document filename and version | **Closed (DL-561).** Parent = `Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md`, content v0.2.1, APPROVED DL-555. Wiki Agent Spec files are not the parent. |
| **S7 / L11** | Development progress notes eligible for admin push? | **Closed (Coach 2026-08-24 · DL-562).** ARE NOT. Finished publishable material only. Bot is a delivery point, not a submission surface. No draft/queue/unfinished store. Agent does not review or hold human-submitted work. |
| **OD-3** | Decomposition skills for S4/S5 | **Closed (Coach 2026-08-24 · DL-564).** Earlier stub framing **wrong — no stub.** Skill-delivered is a third in-scope mode (§3.6). Coach has a working skill; it emits a complete envelope. `acquired_by` = `skill`. |
| **OD-4** | Publish gate per source; behavior when `publish_gate` absent | **HOLD** — defense in depth rather than the B-2 fix |
| **OD-6** | Unpublish / deletion behavior | **HOLD** |
| **OD-7** | Blog RSS feed — who builds it, in-program or out | **HOLD** |
| **OD-8** | Dedup across channels — one livestream, its transcript, its YouTube publish, a blog about it: one page or several | **HOLD.** Note: several pages from **one** transcript under **different instructions** (summary vs how-to) are intentional and honest — not this OD. Do not collapse them. |
| **OD-9** | Backfill fetch — does the floating bot pull source metadata itself (§4.2) | **HOLD** |
| **OD-10** | Does Descript expose a publication signal, or only a list | **HOLD** |
| **OD-12** | **Sitemap.** `fattail.ai`, `labs.fattail.ai`, or both — and linkage target only, or an eighth `source_kind`? | **HOLD** |
| **OD-13** | **Poller watchdog.** Alarm when the watermark stops advancing, to satisfy L7 on the poll path (§6.2). | **HOLD** — non-blocking |
| **OD-14** | **The L11 line for finished specs via S7.** Development progress is out. Finished user guides are in. Where does a finished spec sit? | **HOLD** — not resolved by default |
| **L10** | Hash-over-signal | **Closed — ACCEPTED (DL-560).** Hash wins over signal. |

**Who writes the §6.1 diffs, and when.** **Named (P4 · DL-560): both.** Lima —
wiki-side stale Help Package / registration-envelope language. Factory/Gemba
board — Factory Spec OD-F10/§6/§9, IF-4 seeds, Gemba invariant 9, **IKI Factory
board card**. **Landed SC-0 · DL-562.** Board card added to this list so the
board and the documents say the same thing.

**Closed:** OD-1 (name, v0.1.1) · OD-2 (envelope, v0.1.1) · OD-3 (skill-delivered,
no stub, DL-564) · OD-5 (poll for S1/S2/S3; subscribe out of scope; push for P1
backfill) · B-1 (resolved by OD-5) · B-3 (parent, DL-561) · B-4 (enum closed) ·
S7/L11 (finished-only delivery point, DL-562) · A-1 (promoted to L4) · A-3
(floating Wiki bot confirmed) · A-4 (hash footer restored) · A-5 (routing
restored).

**Still HOLD — do not resolve by default:** OD-4, 6, 7, 8, 9, 10, 12, 13, 14.

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
| **v0.1.4** | 2026-08-24 | **OD-3 corrected (DL-564).** Earlier stub framing was **wrong — no stub.** Skill-delivered is a third in-scope mode (§3.6); `acquired_by` fourth value `skill`. Coach's working skill emits a complete envelope (instruction in, required set out). OD-8 note: several pages from one transcript under different instructions are honest; do not collapse; OD-8 stays HOLD. Remaining holds: OD-4, 6, 7, 8, 9, 10, 12, 13, 14. |
| **v0.1.4** | 2026-08-24 | **GO SC-0 (DL-562).** **S7 RULED:** finished, publishable material only; delivery point, not a submission surface; no draft/queue/unfinished store; agent does not review or hold human-submitted work; development progress notes not eligible. L12 decline largely gone on push; L12 still full on automated poll channels. **OD-3** first write (stub / OUT of first ship) **superseded same day by DL-564.** Remaining ODs 4, 6, 7, 8, 9, 10, 12, 13, 14 stay holds. §6.1 diffs landed (wiki / Factory / Gemba). |
| **v0.1.4** | 2026-08-24 | **B-3 closed (DL-561):** parent = Wiki Spec v0.2.1 (`Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md`, DL-555). Agent Spec files are not the parent. L10 accepted **DL-560**. |
| **v0.1.4** | 2026-08-23 | Coach rulings: **L11 publication-worthy only, universal** — the standard does not vary by source or mechanism. **L12 no content is better than poor content** — the agent declines to compose thin material. **OD-11 closed:** agent sees publication only, never drafts; no source need expose draft state. Consequences: `failed-partial` reframed as a correct outcome (§2.4); S7 narrowed, development progress no longer eligible (§5.2, flagged for confirmation, OD-14 opened); signal volume ≠ page volume (§5.4); **B-2 closed by L11**, OD-4 demoted to defense in depth. |
| **v0.1.3** | 2026-08-23 | Coach ruling: **generic publication signal** replaces per-source create/edit flags (§3.5) — Deploy and Publish are the same moment under local names. Factory signal does not exist yet; contract accepts it on arrival. S5/S6 feed item *is* the signal. §6.1 records downstream stale documents (Factory Spec OD-F10/§6/§9, IF-4 seeds, Gemba invariant 9) as diffs. §6.2 records the failure-signal cost of the poll reversal. Sitemap ruled not-a-source, D4 linkage target (OD-12). OD-11, OD-12, OD-13 opened. |
| **v0.1.2** | 2026-08-23 | Coach rulings: poll ≠ subscribe (§3); poll for S1/S2/S3; subscribe out of scope; watermark, source systems read-only (L9); P1 backfill by push → P2 listen (§4). **Reversal: v0.1.1 §4 Factory push → poll (§6).** Advisor review applied: enum closed (B-4), L4 inference boundary (A-1), L10 proposed, routing restored incl. Hotel (A-5), volume note restored, hash footer restored (A-4). B-2 and B-3 remain blocking. OD-9, OD-10 opened. |
| **v0.1.1** | 2026-08-23 | OD-1 closed (name). OD-2 closed (binding envelope). Help Package language retired. S3 folded under one contract. |
| **v0.1** | 2026-08-23 | First advisor draft. |

---

## 11. Content hash footer

`Wiki-Source-Contract-Spec-v0.1.4` — sha1 of body through §10 (excluding this footer):
`3f83b4c751a14003d211780bf2a4f6ac77d1a202` (**DL-560** stamp + **DL-561** B-3 close + **DL-562** SC-0 / S7 + **DL-564** OD-3 skill-delivered).
Changelog records intent; the hash detects byte-identical version drift. Both are kept.

---

**End of Wiki Source Contract Spec v0.1.4**
