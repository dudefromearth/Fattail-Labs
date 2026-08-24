# FatTail Labs — Wiki Source Contract Spec v0.1

**Status:** DRAFT for Juliet. Advisor-produced. Not implementation instruction.
**Author:** Advisor (Claude), from Coach's direction in session 2026-08-23.
**Supersedes:** the "IKI Help Package" as the artifact blocking Wiki WU-3 and Factory IF-4.
**Parent authority:** FatTail-Labs-Wiki-Agent-Spec-v0.1 (directives D1–D7, contract kinds,
`failed-partial`). **Unverified citation — Coach should confirm the parent filename and
version before this document is treated as bound to it.**

---

## 0. Scope statement

| Field | Value |
|---|---|
| Active program | Wiki |
| Trees touched | Wiki agent contract surface; source-channel definitions |
| Touches outside program | **NONE** |

This document defines a contract and a catalog of sources. It does not specify storage
schema migrations, UI, auth, or payment behavior. It contains no implementation steps.

---

## 1. The correction this spec makes

Grok is blocked asking for a **Help Package**. There is no Help Package.

**Coach's ruling (2026-08-23):** there is *one* contract for every piece of content that
enters the Wiki. Help is caller number one, not a special case. Courses, IKI Factory
templates, transcripts, blogs, and admin-pushed material all present the same envelope.

Building the narrow artifact would have produced a second contract the moment courses
arrived, and a third at templates. One envelope, built once, unblocks WU-3 and IF-4
together and every subsequent feeder for free.

---

## 2. Governing laws

| # | Law |
|---|---|
| **L1** | **One envelope.** Every piece of content entering the Wiki arrives through the source registration contract. No side doors, no bespoke per-source payloads. |
| **L2** | **Symmetry of direction.** The same envelope serves both directions: pushed by a registering source, and pulled by the agent when it detects change. Direction is a transport detail, not a schema fork. |
| **L3** | **Asymmetry of burden.** Automated channels populate the full envelope without human involvement. The human channel asks only for the artifact and the intent. The agent infers the remainder and raises a question only when inference genuinely fails. |
| **L4** | **No invention.** The agent composes; it does not assert. Every claim on a produced page traces to a field or body supplied in the envelope. |
| **L5** | **Git is the only writer.** All Wiki writes land through git. No parallel store of truth. (Inherited, D1.) |
| **L6** | **Access is an explicit act.** The envelope's default disposition is public. Any restriction is a stated field, never an assumed default. (Inherited, Coach's ruling on Wiki openness.) |
| **L7** | **Disposition is reported.** Every submission returns what the agent did, when, and where the page landed. Incomplete drafts land as `failed-partial` with a stated reason — never a silent skip. |
| **L8** | **Process outcomes only.** No profit claims on any produced page, regardless of what the source contained. (Inherited platform doctrine.) |

---

## 3. The envelope — proposed schema

Coach's stated minimum: *what this thing is, where it lives, who owns it, what it's about,
and what changed.* The table below is the advisor's proposal against that minimum. Field
names and required/optional marks are **proposals pending Coach's ruling** (OD-2).

### 3.1 Identity

| Field | Req | Meaning |
|---|---|---|
| `source_kind` | R | Which channel this came from — see §4 catalog |
| `source_id` | R | Stable identifier of the artifact within its source system |
| `title` | R | Human title of the artifact |
| `submitted_at` | R | When this envelope was produced |

### 3.2 Location and provenance

| Field | Req | Meaning |
|---|---|---|
| `origin_ref` | R | Where the artifact canonically lives — git path, route, URL, or external id |
| `origin_owner` | R | The system or person accountable for the artifact |
| `content_hash` | R | Hash of the payload, so change is detectable and re-runs are idempotent |
| `version` | O | Source-system version where one exists |

### 3.3 Substance

| Field | Req | Meaning |
|---|---|---|
| `body` | R | The artifact content, or a resolvable pointer to it |
| `body_format` | R | markdown · transcript · html · structured |
| `intent` | R | What this is for, in one line — the only field the human channel must supply |
| `subject_terms` | O | Topic hints; automated channels supply, humans need not |
| `linkage_hints` | O | Known related entities, so D4 linkage has a starting point |

### 3.4 Change

| Field | Req | Meaning |
|---|---|---|
| `change_type` | R | `created` · `updated` · `unpublished` |
| `changed_summary` | O | What changed, where the source knows |
| `supersedes` | O | Prior `source_id` or hash this replaces |

### 3.5 Disposition controls

| Field | Req | Meaning |
|---|---|---|
| `access` | O | Absent means public (L6). Any restriction stated explicitly. |
| `publish_gate` | O | Whether the composed page requires human approval before publish (see OD-4) |

### 3.6 Return — disposition record

The agent returns, for every submission: `accepted` / `failed-partial` / `rejected`; the
resulting page path where one exists; the linkages written; and, on anything other than
`accepted`, the stated reason.

---

## 4. Source catalog

Two families. Automated channels carry L3's full burden; the human channel carries almost
none.

### 4.1 Automated channels — listeners

| # | Source | Trigger | Notes |
|---|---|---|---|
| **S1** | **Help guides** | Guide created or changed in the help system | D3. Caller number one. The thing Grok is currently blocked on. |
| **S2** | **Courses** | Courseware change | D2 |
| **S3** | **IKI Factory templates** | Template creation | D6/D7. High volume — Coach's projection is up to ten per day at Factory cadence. |
| **S4** | **Descript output** | New transcript of a daily livestream or video | Requires a decomposition skill in front of the envelope — the skill turns transcript into a coherent page about what that video covered. See OD-3. |
| **S5** | **YouTube published content** | New publish on Coach's channel | Same decomposition skill as S4. Feed-based. |
| **S6** | **Blogs** | New post | Via RSS. Feed does not yet exist and must be created. |

**Volume note (Coach, 2026-08-23):** S4–S6 together are expected to produce roughly three
to five items per day, up to five. S3 may add substantially more. Composition is not the
constraint at that rate; **linkage quality is** — see §6.

### 4.2 Human channel — the admin push

| # | Source | Trigger | Notes |
|---|---|---|---|
| **S7** | **Admin push** | Administrator hands the agent an artifact directly | D5. Covers text specs, user guides, development progress, and any ad hoc page. This is the catch-all: anything without an automated feeder arrives here. |

Under L3, the admin supplies the artifact and the `intent` line. The agent infers
`subject_terms`, `linkage_hints`, and the rest, and asks a question only where inference
genuinely fails. **An admin must never be asked to fill a schema.**

---

## 5. Excluded sources — and why

Recorded so the exclusions are decisions with reasons, not omissions.

| Source | Ruling | Reason (Coach) |
|---|---|---|
| **Specs** | Excluded as an automated feeder | Constantly updated, many versions. Churn would flood the Wiki, and the spec's audience is not the Wiki's audience. |
| **Decision log** | Excluded as an automated feeder | Individual entries are too fragmented to make a useful page on their own. |
| **Member-generated content** | Excluded | Not of interest for Wiki composition. Admin-generated content is the exception. |

### 5.1 Preserved idea — decision-progress graph

Coach raised turning the full decision log into a **graph showing the progression of
decisions** as something that could be genuinely useful to a reader.

This is **not dropped**. It is routed: it is a *derived* artifact requiring synthesis
across many entries, which no automated watcher can produce without violating L4. The
resolution Coach stated is that the administrator performs the synthesis and submits the
coherent result through **S7**. Recorded here so it survives to a future spec.

---

## 6. Cross-references — deliberately not folded in

Two adjacent bodies of work were developed in the same session and are **preserved, not
merged**. Coach asked for the contract and the source types; these are separate specs.

| Topic | Status |
|---|---|
| **D4 linkage — dual trigger + sweep** | Outlined in session: event-driven on update *plus* a scheduled full-corpus sweep finding orphans, missing links, stale links, and clusters deserving an index page; sweep proposes rather than silently rewrites; also reads the `fattail.ai` sitemap to link outward. Awaiting Coach's word to draft. |
| **Quick links — context-driven, and the shop venue** | Outlined in session: one search component, link sets as configuration driven by the D5 session context; venue lanes for Labs / general / shop; shop personalization deferred behind Mike and Tango; interview-based declared intent; aggregate popularity ranking. Awaiting Coach's word to draft. |

Nothing from either outline has been removed. Both are held intact.

---

## 7. Open decisions

Advisor raises; Coach rules; Lima logs. **No proposal below is a default.**

| ID | Decision | Note |
|---|---|---|
| **OD-1** | **Filename and version for this spec.** Proposed above as `Wiki-Source-Contract-Spec-v0.1`. This was the outstanding naming item that blocked Grok. | Coach names |
| **OD-2** | **Envelope field set.** §3 is a proposal against Coach's stated minimum. Which fields are required, which optional, and what they are called. | Coach rules |
| **OD-3** | **Decomposition skills (S4/S5).** In scope for v0.1, or does the contract ship first with transcript sources following? | Coach rules |
| **OD-4** | **Publish gate per source.** Which channels compose straight to published and which require human approval. Relates to the existing publish-gate exception OD in the parent spec. | Coach rules |
| **OD-5** | **Push versus poll, per source.** Which of S1–S6 emit to the agent and which the agent polls. Relates to the parent spec's interim bridge poller OD. | Coach rules |
| **OD-6** | **Unpublish and deletion.** What the agent does when a source artifact is removed — orphan the page visibly, unpublish it, or leave it. | Coach rules |
| **OD-7** | **RSS feed creation (S6).** The blog feed does not exist yet. Who builds it, and is it in this program or outside it. | Coach rules — possible out-of-program touch |
| **OD-8** | **Deduplication across channels.** A livestream transcript, a blog post about it, and a YouTube publish may all describe one event. Whether these compose to one page or several. | Coach rules |

---

## 8. Review routing

Per the full bench process. Advisor recommends first-priority reviewers:

| Reviewer | Concern |
|---|---|
| **India** | Contract boundary; that this does not become a parallel ingestion path alongside the existing `corpus_items` registrar |
| **Mike** | S7 admin push authority; whether `access` absent-means-public (L6) survives review |
| **Hotel** | Composition from trading content — S4/S5 transcripts especially |
| **Tango** | Composed-page framing; L8 enforcement on inherited source material |
| **Oscar** | Whether the envelope gives the composer what it actually needs |

---

## 9. Content hash footer

`Wiki-Source-Contract-Spec-v0.1` — first issue, no prior version. Content hash to be
stamped by Lima on landing, per the standing guard against byte-identical version drift.
