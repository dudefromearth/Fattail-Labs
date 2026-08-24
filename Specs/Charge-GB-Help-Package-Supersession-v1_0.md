# Charge to Grok Build — Help Package Supersession

**Issued by:** Coach
**To:** Grok Build (GB)
**Date:** 2026-08-23
**Authority:** FatTail Labs — Wiki Source Contract Spec v0.1.4
**Deliverable:** an executable plan. **Not code. Do not begin implementation.**

---

## 0. Preconditions — verify before planning

| # | Condition | State |
|---|---|---|
| P1 | Wiki Source Contract v0.1.4 stamped by Coach | ☐ |
| P2 | Parent document confirmed by file header (B-3) | ☐ |
| P3 | L10 stamped (hash wins over signal) | ☐ |
| P4 | Owner named for the §6.1 diffs | ☐ |

If any box is open, say so and stop. Do not plan against an unstamped contract.

---

## 1. The supersession — read this first

**There is no Help Package.** It is superseded in full by the Wiki Source Contract.

Help is not a special case and never was. It is **S1** — caller number one — using the same
envelope as Courses, IKI Factory templates, transcripts, YouTube, blogs, and the admin push.
One envelope, seven source kinds, no per-source payloads.

Any document, seed, charter, or comment still containing the phrase "Help Package,"
"registration envelope pushed at Deploy," or "complete package stops the belt" is **stale**
and is in scope for correction under §4.

---

## 2. The reversal — the item most likely to be misread

**Prior instruction to GB:** the Factory builds a delivery hook and pushes a complete
registration envelope at Deploy.

**Current contract:** the Factory exposes a **publication signal at Deploy**. Nothing else.

This is a **removal of work, not a change of payload shape.** Do not plan a hook with a
different body. Do not plan envelope construction on the Factory side. The Factory does not
know the Wiki agent exists.

| Board | Obligation under v0.1.4 |
|---|---|
| **Factory IF-4** | Expose a publication signal at Deploy. That is the whole obligation. No envelope build, no delivery hook, no wiki page bytes, no write path to the Wiki. |
| **Wiki WU-3** | Poll the signal → compare `content_hash` against the agent's own watermark → fetch the artifact → compose the envelope Wiki-side → compose the page → return disposition. |

**The Factory publication signal does not exist yet.** It may land 2026-08-23 evening. The
plan must accept it on arrival and must not block on its name or location. Where the signal
lives is a source-side detail; that it exists at Deploy is the contract.

---

## 3. Acquisition — three mechanisms, do not conflate

| Mechanism | Initiator | Requires of source | In scope? |
|---|---|---|---|
| **Poll** | Agent, on a cadence | Nothing | **Yes — the default** |
| **Push** | Human, via the floating Wiki bot | Nothing | **Yes — P1 backfill** |
| **Subscribe** | Source emits to the agent | An emitter must be built | **No — out of scope for v0.1** |

Poll is not subscribe. Nothing in this plan builds an emitter in any source system.

### Phasing

| Phase | Mechanism | Scope |
|---|---|---|
| **P1 — Backfill** | Push, via the floating Wiki bot | Existing courses, help guides, YouTube videos, Descript transcripts. Admin works the standing library. |
| **P2 — Steady state** | Poll | New and changed items acquired automatically. |

P1 must record `content_hash` for everything it lands, or P2 cutover reads the entire
backfilled library as new. This is not optional and is the practical reason `content_hash`
sits in the required set.

---

## 4. Stale documents — diffs only, not rewrite packets

| Document | Stale claim | Correction |
|---|---|---|
| Factory Spec OD-F10 / §6 / §9 | Deploy pushes a complete registration envelope; incomplete package stops the belt | Deploy exposes a publication signal only |
| Factory plan IF-4 seeds | Build delivery hook | No hook. Signal only. |
| **Gemba charter, invariant 9** | "Deploy pushes registration" | Realign to signal-only |
| IKI Factory board card (`web/components/admin/IkiFactoryBoard.tsx`) | Help Package / registration-envelope copy on the Kanban card | No Help Package chrome. Floor state only. Publication signal is IF-4. |

**Gemba is the sharp edge.** If invariant 9 is still stale when execution starts, GB will
correctly refuse on the charter — this has already happened once on this program. Land the
diff before the first packet, not after.

These are **stale→replacement diffs**. Do not regenerate the documents.

---

## 5. Invariants the plan must hold

| # | Law |
|---|---|
| **L1** | One envelope. Every source, same contract. |
| **L2** | Same envelope shape regardless of acquisition mechanism. |
| **L3** | Automated acquisition fills the required set. The admin supplies artifact + `intent` only and is **never given a schema form**. |
| **L4** | No invention. Metadata may be inferred; **substance may not**. |
| **L5** | Git is the only writer of page bytes. |
| **L6** | Access default public; restriction is an explicit stated field. |
| **L7** | Disposition always reported. Never a silent skip. |
| **L8** | Process outcomes only. No profit claims on produced pages. |
| **L9** | **Source systems are read-only to the agent.** It clears no flags and writes no state into Courses, Help, or the Factory. It holds its own watermark, Wiki-side. |
| **L10** | **Hash is correctness; the signal is optimization.** Where they disagree, the hash wins. |
| **L11** | **Publication-worthy only, universal.** Only finished, publishable material enters — through every mechanism. No drafts, no working notes, no in-flight state. |
| **L12** | **No content is better than poor content.** Thin material → the agent declines to compose and reports why. |

### 5.1 L12 will look like a bug — it is not

An agent that receives a valid, complete envelope and produces **no page** is behaving
correctly. `failed-partial` has two distinct causes and both are legitimate:

| Cause | Meaning | Correct handling |
|---|---|---|
| Incomplete envelope | Required fields absent | Transport failure — surface it |
| **Insufficient substance (L12)** | Envelope complete, material too thin for a page worth reading | **Judgment correctly exercised — this is a pass** |

**Do not plan retry logic, backoff, or alerting around the second cause.** A board carrying
`failed-partial` cards from insufficient substance is a functioning Wiki. It is a defect only
when the *reason* is missing.

**Corollary:** throughput is not a health metric for this agent. Ten Deploys in a day
producing four pages is the system working, not the agent falling behind. Do not plan a
completion-rate gate.

---

## 6. What the plan must produce

An executable plan with seeded packets and Delta gates, covering:

1. **The envelope** — validation of the required set (§2.1, §2.2 of the contract), the closed
   `source_kind` enum with loud abort on an unrecognized value, and the disposition return.
2. **The watermark** — Wiki-side store of last-seen state per `source_id`; hash comparison as
   the correctness basis.
3. **The poll path** — signal read as prefilter, hash confirm, fetch, compose. Cadence and
   where the tick runs (Foxtrot).
4. **The push path** — the floating Wiki bot as the admin surface. Artifact + intent only.
5. **P1 backfill** — the working path through the standing library, with `content_hash`
   recorded for every landed item.
6. **The three diffs** — §4, landed in the same body of work as the first packet.
7. **Characterization tests** — including the L12 decline path and the loud-abort path on an
   unknown `source_kind`.

Each packet states: files in scope, out-of-scope declarations, applicable invariants,
verifiable completion criteria, and the gate it feeds. **If a seed cannot be executed from
cold, it is not finished.**

---

## 7. Do not plan against these — open, unruled

| ID | Item | Impact on scoping |
|---|---|---|
| **OD-3** | Decomposition skills for S4/S5 transcripts — in v0.1 or later | **Largest scoping unknown.** Flag the fork; do not pick. |
| **OD-4** | Publish gate default per source | Affects whether composed pages auto-publish |
| **OD-6** | Unpublish / deletion behavior | Affects `change_type: unpublished` handling |
| **OD-7** | Blog RSS feed — does not exist; owner unnamed | S6 may be out of first ship |
| **OD-8** | Dedup across channels | One livestream may arrive four ways |
| **OD-9** | Does the backfill bot fetch source metadata itself | Affects P1 packet shape materially |
| **OD-10** | Does Descript expose a publication signal at all | Affects whether S4 can ever poll |
| **OD-12** | Sitemap — which one, linkage target or eighth source kind | Currently linkage only |
| **OD-13** | Poller watchdog for L7 on the poll path | Non-blocking; may follow first ship |
| **OD-14** | Where the L11 line falls for S7 artifacts | Affects the bot's accept/refuse surface |

Where an open decision blocks a packet, **say so and hold the packet.** Do not select a
default and proceed.

---

## 8. Out of scope — state explicitly in the plan

- Any emitter, webhook, or delivery hook in any source system
- Any write path from the agent into Courses, Help, the Factory, or an external feed
- Any flag-clearing or source-side state mutation
- Wiki page bytes written by anything other than git
- Auth, identity, payments, commerce
- Frozen trees. Any touch requires the three-OK rule under DL-539.

---

## 9. Acceptance criteria for the plan itself

The plan is accepted when:

- [ ] Every packet is executable from cold
- [ ] IF-4 is visibly **smaller** than its prior form — signal only
- [ ] No packet builds a hook, emitter, or Factory-side envelope
- [ ] The three §4 diffs are scheduled before the first execution packet
- [ ] The L12 decline path has a characterization test and **no** retry logic
- [ ] The unknown-`source_kind` loud-abort path has a characterization test
- [ ] Open decisions are listed as holds, not resolved by default
- [ ] Every gate is a Delta gate with evidence requirements stated — no waivable paths

---

**End of charge.**
