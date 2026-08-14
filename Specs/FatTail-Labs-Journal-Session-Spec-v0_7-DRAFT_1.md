# FatTail Labs — Journal Session Spec v0.7 (DRAFT — rev 2)

**Status:** DRAFT — advisor artifact, revised per 2026-08-13 advisor review (Grok; verdict
FAITHFUL, must-fixes H1–H6 + should-fixes S1–S5 folded here). **Not build authority**
until Coach GO + Lima decision-log entry. Implements ruled **B-Agent** (Coach override,
2026-08-13 — companion DL entry draft prepared for Lima).
**Supersedes on ratification:** Journal Session Spec v0.6 §1.3 (posture clause), §8
(agent), §9 (guardrails), §2 (structured-record mutability clause) — **and nothing else**.
Every v0.6 section not named in the delta map (§1) remains as-built law and is inherited
by reference, unmodified.
**Family:** B (member-private)
**Entitlement:** unchanged from v0.6 — Observer, Activator, Navigator identical Journal
access; Observer differs only in term.

**Authority chain:** B-Agent ruled by Coach override 2026-08-13 → this spec lands the
override as versioned law (overrule-not-waive) → Lima DL entry on GO.

**Parents (cite this version for that topic):**

| Doc | Cite for |
|-----|----------|
| **Journal Session v0.6** | Everything inherited (§1 delta map): surface, calendar, record, dates, tags, retro navigation, closure, uploads, portability base, schema base |
| **Practice-Coach Design Architecture v0.3** | Design frame: guide charter §6 · conversation-not-forms §3.1 · lean-on-model §3.2 · glide path §6.3 |
| **DL entry — B-Agent (Coach override)** | Scope of the override; retained rails |
| **Trade Log v1.1** | Day-book context · **derived open book** ("Position (v1.1): derived open quantity by instrument key within one account — not a stored table") · `GET /api/me/trade-log/opens` (unmatched opens, FIFO match) — the §5.2 heat-gate SoR |
| **Trader Development Phase 1 — Own Spine v1.1** | Playbook entries · campaign-scoped playbook · manual adherence §4.4 |
| **Member Campaign Spec v1.3** | As-built practice campaign (B-Campaign-bind pending; §4.2a lawful empty) |
| **Tag Manager v0.3** | Vocabulary, assignments (unchanged consumer) |
| **Journey Experience v1.0 / DL-190 / DL-067** | Profile context; idle timeout §2.3b; fade calibration **pends B-Journey-Feed** |
| **Retrospective v0.6 / v0.7.1** | Lifecycle, gather, complete hook (unchanged) |
| **Continuous Journaling DL-191** | `member_notify` pattern for surfacing kinds |
| **Member Data Privacy v0.1 · Member Practice Portability v1.3** | Family B; export/purge. *(v1.3 is the latest authority in the advisor project copy; the 2026-08-13 review cites v1.4 as-built — confirm repo state at fold. Either way, this spec's export/purge delta requires the **next** version bump — §11.)* |
| **Agent Identity Spec v1.0** | Agent attribution substrate |

**What changed in v0.7, in one paragraph.** The agent's charter changes from witness to
**guide**: it may surface proactively at open moments, open the day, and drive the routine
early — fading toward leading questions as the trader internalizes the practice, never
withdrawing presence. Two new rails are code: a **live-risk heat gate** keyed to the
request-time derived open book (quiet while risk is held) and **extract-and-confirm**
(the conversation is the record; machine-filed fields are member-visible,
member-confirmed structured events, never silent, never new field keys). Composer drafts
persist server-side so the idle timeout can never cost a reflection. Everything else
about the Journal — surface, calendar, one-conversation-per-date, tags, closure,
uploads — is v0.6, untouched.

---

## 1. Delta map — what this version changes

| v0.6 § | Disposition in v0.7 |
|---|---|
| §1.1–1.2, §1.4–1.7 (screen, interview bar, thread/header, trades strip, week view, calendar) | **Inherited unchanged.** The interview remains the optional, member-requested add-on; conversation-first makes it less needed, not different |
| §1.3 "Not on the screen" | **Inherited except one clause:** "Not 'Interviewer'" survives as a *label* rule (the agent's turns carry its name — placeholder pending B-Name); the *posture* implication (the agent never conducts) is superseded by the guide charter (§4) |
| §2 The record | **Inherited, one amendment:** structured-record row gains extract-and-confirm as a second write path (§6). "Unfilled structured fields are absent — never inferred" **survives verbatim** for anything not member-confirmed. Attribution law unchanged: downstream readers quote member-authored content only |
| §3 Dates and sessions · §4 Timestamps and phase | **Inherited unchanged** (phase table drives surfacing windows §4.3; it does **not** drive the heat gate — §5.2) |
| §5 Tags · §6 Retro navigation · §7 Closure | **Inherited unchanged.** Closure gains one derived rule: the Coach never surfaces on, or writes to, a closed date (§4.3) |
| §8 The agent | **Superseded by §4** (the guide) |
| §9 Guardrails | **Superseded by §5** (preserved list + code gates; supersessions itemized) |
| §10 Uploads · §11 Cadence · §12 Portability | **Inherited**; portability bump for new stores (§11 here) |
| §13 Schema | **Extended** (§10) |
| §14 Build order | **Replaced for this program** (§13 here — J7 slices) |
| §15 Verification | **Inherited + extended** (§12) |

---

## 2. What this is

Unchanged in essence, restated with the ruled charter: **the Journal is a conversation
with the Coach** — thread + composer; the conversation *is* the journal record. What v0.7
adds is the other half of the relationship: the Coach is a **guide**, not a witness. It
comes to the trader at the day's boundaries, holds them to their own written standard by
asking, files what they say with their confirmation, and eases off as the routine becomes
theirs — without ever leaving the room.

The interaction law (Design Architecture §3.1): **you talk; the Coach presents and asks;
you confirm.**

---

## 3. The trader's day — an act of adherence

The trader walks in with a plan, an active campaign (when one exists — §4.2a), and the
loaded playbook — the ideal trade and ideal conduct already written. The day is the
attempt to **enact those edicts**. What the trader wants from the Coach intraday is
affirmation that they're doing it and the open-ended questions that keep them honest and
moving — not analysis in the moment. At close, what remains is the **routine instance**:
the objective trade (Trade Log) plus the conversation and everything recorded around it
(Journal), fused for one day. This section is context for §4–§5; it introduces no new
stores.

---

## 4. The Coach (supersedes v0.6 §8)

### 4.1 What it knows

Inherited from v0.6 §8.1, extended:

- Trade Log context for the entry's date — **and the request-time derived open book
  (§5.2)**
- Journey profile (calibrate only; never recite grades/meters/streaks/scores)
- Selected system tag labels as description only (v0.6 §5.1 unchanged)
- Transcript so far
- **Trajectory digest** — most recent ratified chunks + active commitments + live
  campaign scope. **Read-only context; may be empty; empty is lawful; the Coach never
  narrates a missing digest.** (Chunk mechanics live in the Retro conversation-frame
  spec; until that lands the digest is simply empty.)
- **Personalization store** — *gated on B-Personalize ruling; absent until that spec
  lands; nothing here depends on it*

### 4.2 Posture — the guide

**Proactive surfacing is the primary interaction model.** The Coach may initiate at
**open moments** (§4.3); the member no longer always writes first (v0.6 §8.2 superseded
per ruled B-Agent).

- **Pre-open:** the Coach opens the day by mirroring the live experiment — last retro's
  commitment, the active campaign's loaded rules (snapshot-at-load, B4: "loaded rules"
  means the entries as snapshotted at campaign activation), "what's today's plan?"
  *(Design intent only — every greeting string is **blocked pending B-Name**; nothing in
  this bullet is shippable copy.)* Their commitments, their rules, their words — mirror
  only. Playbook references remain **reference-only**: the Coach may quote the loaded
  rule; it never asserts whether the rule was followed. Adherence marks remain **manual**
  (Own Spine §4.4); auto-adherence stays Phase 4-gated.
- **Intraday:** governed by the heat gate (§5.2).
- **Post-close:** invites the exhale in process language.
- **Retro-ready:** surfaces the standing nudge (rides the existing cadence machinery;
  undone-work framing, CJ-7; **no analysis in the ping**).
- **Anytime, on request:** files via extract-and-confirm (§6); star; voice note; paste.

**Questioning.** Open-ended; presses for precision, not brevity; starts in the middle
using the trade log; detects absences **once per absence per day** (the anti-nag rail
survives the override). The v0.6 one-question-per-turn **absolute** is superseded;
conversational judgment governs, with Tango gating tone and the §5.2 gate enforcing zero
unprompted questions while risk is held.

#### 4.2a Lawful empties (B-Campaign-bind and pre-Retro-frame safety)

- **No active campaign:** the Coach still opens the day. The loaded-rules block is
  simply omitted. The Coach never invents a season, never implies one should exist, and
  never nags toward creating one. (B-Campaign-bind remains OPEN; nothing in this spec
  creates or requires a campaign object.)
- **Digest / chunks missing or empty:** context omits them. The Coach never fabricates
  history and never mentions the absence.
- **Fail-loud applies to required config only** (market calendar, model config, posture
  default — §4.5, §10). Optional context being empty is lawful and silent.

### 4.3 Surfacing mechanics

- **Kinds.** New notification kinds on the `member_notify` pattern (DL-191):
  `coach_day_open` (pre-open) · `coach_day_close` (post-close) · retro-ready continues to
  ride the existing cadence nudge kind.
- **Kind × state matrix (one law, no gaps):**

| Kind | Heat on (§5.2) | Heat off | Off-session date | Closed date |
|------|----------------|----------|------------------|-------------|
| `coach_day_open` | **Suppressed — consumed, not deferred** | Fires, ≤1 per date | Never | Never |
| `coach_day_close` | Suppressed | Fires, ≤1 per date | Never | Never |
| retro-ready | Existing cadence rules; **no analysis in the ping** | Same | Per Retro spec | n/a |

  - **Consumed, not deferred:** a heat-suppressed `coach_day_open` never fires late.
    When the book empties, the next lawful surfacing is `coach_day_close` if the clock
    is post-close — the Coach does not dump "what's the plan?" at 15:00.
  - An **overnight unmatched open suppresses `coach_day_open`** — holding risk into the
    open is exactly the heat the gate exists for.
  - **If the Journal surface is already focused**, the notify no-ops and only the
    in-thread presence/entrance runs — never a double nag (inbox + bubble).
- **Presence.** The Coach has a visible presence element with an entrance animation —
  it "bubbles up off the screen." The **entrance character is Tango-gated: welcome,
  never nag.** **Dismissing the entrance kills the animation only** — the presence
  chrome (composer, speaker area) survives; presence never withdraws (§4.4).
- **Member-facing greeting and speaker label are BLOCKED pending B-Name.** Build uses a
  neutral placeholder label; no name string ships until ruled. (v0.6's "the agent's
  turns carry its name" holds — the name itself is the open ruling; this closes v0.6
  §17 item 5.)
- **Closed dates:** the Coach never surfaces on, never writes to, a closed date (v0.6 §7
  refusal semantics apply to agent writes identically).
- **Off-session dates** (weekend/holiday per market calendar config): no unprompted
  surfacing; the Coach responds if written to. Missing calendar fails loud (v0.6 §4
  inherited).

### 4.4 The fading glide path

- **Early:** forward — surfaces, initiates, drives.
- **Melding:** lays back — leading questions; less "here's what we do now," more "what
  are you seeing?"
- **Always:** visually present; only the insistence withdraws, never the presence
  (survives entrance dismissal — §4.3).

**Calibration input pends B-Journey-Feed.** The intended input is the pillar state
(Daily routine, Process adherence trending true north → lay back; drifting → lean in).
As-built meters do not yet compute those signals, so **until B-Journey-Feed lands, the
posture is a constant** — `coach_posture_default` in config (fail-loud, no silent
default), shipped as `forward`. The glide path activates by flipping calibration from
constant to pillar-read when that ruling lands; no schema change required (§10 carries
the posture read at context-build time). Fade-too-soon is the named failure mode; a
constant-forward interim is the safe side of it.

### 4.5 Prompt and availability

Inherited from v0.6 §8.3–8.4 unchanged: admin-editable versioned prompt, each session
stamps `prompt_version_id`; guardrails enforced in **code**, not prompt hope; always
available — if the model is down, the composer still captures, UI unchanged, no failure
"mode" label. **Model/effort configuration** (provider, model string, effort map) is
**fail-loud config**, verified against current vendor docs at implementation time
(Design Architecture §3.2); a mis-named effort parameter must abort boot, not silently
no-op. `coach_effort_map` keys are the **closed set** `{day_open, surface, extract,
mechanical_turn}` — Journal moment classes are **light-effort**; maximum-effort tiers
belong to the retro compile, which is not this spec. A missing key in the map aborts
boot; an unknown key aborts boot.

---

## 5. Guardrails (supersedes v0.6 §9)

Code-enforced before any agent turn renders. Violating turns do not display; log.
Unchanged enforcement class; changed contents.

### 5.1 Preserved — never, at any posture, any tier

Motive/emotion naming · unstated market/price facts · advice · praise/blame · loss
asymmetry · P&L figures · grades/meters/streaks/scores recited · brevity demands ·
trade-log redundancy · image interpretation · **silent field writes (see §6 — the v0.6
"filling empty fields" prohibition survives as a prohibition on *unconfirmed* writes)** ·
therapy · profit claims (Sacred Invariant 8). "I don't know" is complete. Once-only
absences.

### 5.2 The heat gate — new, code (retained rail 1 of the B-Agent ruling)

> **While the member is holding risk — now, at request time — the Coach is quiet and
> non-analytic.**

- **Source of record:** the **request-time derived open book**, identity-scoped, across
  **any active account**: unmatched opens exist per Trade Log v1.1's derived-position
  model (`GET /api/me/trade-log/opens` / `listUnmatchedOpens`-equivalent — FIFO
  structure match; position is derived, **not a stored table**; do not invent an
  `open_positions` table). **The journal date is not an input to the gate.** India and
  Alpha own the exact API shape.
- **Why request time, not session date:** the doctrine protects a person *holding risk
  now*. Backdating Tuesday's journal on Wednesday while holding a position **now** must
  restrain. Journaling today after the book is flat must release, even if the morning
  held a trade. An overnight unmatched open must restrain pre-open (`coach_day_open`
  suppressed — §4.3 matrix). Closed dates refuse all agent writes independently
  (v0.6 §7).
- **Multi-account:** any unmatched open on any active account restrains.
- **Book has unmatched opens →** the Coach receives; acknowledges briefly or not at all;
  answers if asked. **Zero unprompted questions, zero analysis, zero emotional
  processing.** Violations are hard-rejected at the same render layer as every other §5
  gate.
- **Book flat →** the restraint is off; guide posture (§4.2) governs; a position opened
  mid-conversation flips the gate on the next turn.
- **Fail direction:** if the open-book check is unavailable, **treat as holding risk**
  (restrained). The safe failure is silence, not analysis in the heat. The outage is
  logged and surfaced to admin; the member sees nothing.

### 5.3 Superseded by ruled B-Agent (itemized, so nothing falls silently)

| v0.6 §9 item | v0.7 disposition |
|---|---|
| "Member always writes first" (§8.2) | Superseded — §4.2 open moments |
| "No unprompted questions" as a blanket rule | Narrowed to the §5.2 gate and off-session dates; elsewhere governed by guide posture + Tango-gated tone |
| "More than one question per turn" as a code reject | Superseded as an absolute; conversational judgment + prompt guidance; Kilo keeps a regression fixture asserting the agent does not interrogate (no 3+ question stacks) as a tone canary, Tango-owned threshold |
| "Filling empty fields" | **Replaced, not removed:** silent writes stay forbidden; confirmed extraction is the lawful path (§6) |

---

## 6. Extract-and-confirm (retained rail 2; amends v0.6 §2 structured record)

**The conversation is the source of record.** The structured record is a derived,
member-confirmed view of it — never a parallel authored surface.

- The machine-side structured pass may draft field values **only from member-authored
  content** in this session (attribution law: agent turns are never a source).
- **Closed field set:** extraction may draft **only keys already defined by the v0.6
  structured interview schema.** No new keys in this version — no psychological, state,
  or emotion fields exist to extract into. **Unknown keys are a hard reject** (code, not
  review). Hotel's "no state-shaped fields" gate is thereby enforceable against a closed
  set.
- **Confirmation is a structured event, not a message.** SoR: a confirmation event on
  the session — `(field, value-or-absent, source_message_ids[], confirmed_at,
  actor=member, method=extraction|interview)`. It **renders** as a card in the thread
  but **creates no member message** — it mints no Week-view dot (v0.6 §1.6 dots key on
  member messages) and is itself **not extractable content**. The agent's "here's what
  I'm filing" presentation is an agent turn or non-message chrome; either way, never an
  extraction source.
- **Write law:** no mutation of `structured_json` without its confirmation event **in
  the same transaction.** Provenance rides `structured_provenance_json` per field.
  A field without provenance and confirmation does not exist.
- **Confirm** writes; **edit** writes the member's correction; **decline** leaves the
  field **absent.** v0.6's law survives verbatim for the unconfirmed case: *unfilled
  structured fields are absent — never inferred, never agent-filled.*
- The optional interview (v0.6 §1.2) remains available and writes the same
  `structured_json` through the **same confirmation-event law** (method=interview).
  Two paths, one record, one write law.
- Closed dates refuse confirmations like every other write (v0.6 §7).

*Gate: India (SoR integrity, event model), Tango (card copy), Hotel (closed field set),
Kilo (silent-write + unknown-key regression tests).*

---

## 7. Draft persistence — no capture lost to a timeout

Idle timeout is 30 minutes default, member-adjustable 15–60 (Journey v1.0 §2.3b). A
member mid-thought must never lose a reflection to a session evaporating.

- The composer buffer autosaves **server-side** (debounced) to `member_journal_drafts`
  keyed by (identity, journal_date); restored into the composer on next open; cleared on
  send.
- Drafts are Family B, identity-scoped. **Purge removes drafts. Export excludes them** —
  an unsent draft is not part of the record; the record is sent messages (v0.6 §2).
- Drafts never render in the thread, never reach the agent context, and are never
  extracted from (§6 sources are sent, member-authored messages only).
- A draft against a date that closes before send is surfaced to the member read-only with
  the closed-date reason — not silently discarded, not appended to a sealed record.

*Gate: India, Mike, Echo.*

---

## 8. Voice capture (thin requirements — build-gated on Mike; slice J7-5)

Inherited intent from v0.6 §17 item 4, now specified to requirement level:

- Transcription provider is **fail-loud config**; no silent degradation. If STT is down,
  voice input is unavailable and says so plainly; text capture is unaffected.
- Audio stored Family B with **export-and-purge parity with images** (v0.6 §10 class).
- **The transcript is member-correctable** — their words are the record; an uncorrected
  mis-transcription corrupts the mirror. Corrections edit the transcript before send;
  sent messages follow normal append-only law.
- Analysis and extraction consume the **transcript only — never tone of voice.**
  Vocal-affect inference is state inference and is prohibited like every other form.

*Gate: Mike (Family B, provider), Hotel (transcript-only analysis), Tango (correction
UX copy).*

---

## 9. The star (slice J7-6; India holds the split-or-keep decision)

One-tap, member-authored mark on a message — "this is reference material."

- **Star is not a tag** (Tag Manager doctrine: tags record, never behave; the
  retrospective routing action is the sole defended exception). A star feeds retro
  staging and creates references — that is behavior — so it is its own object.
- Stored **outside the sealed record**: starring a closed message never amends it
  (v0.6 §7 intact). Stars on open or closed sessions are both lawful — the mark lives
  beside the record, not in it.
- The retro is the refinery: starred messages in scope are staged as write-back
  candidates; promotion is trader-authored with a wikilink back to the source message.
- **Journal v0.7 defines the star mark only.** The references store
  (`member_practice_references`) is **reserved here and written only by the Retro
  conversation-frame spec** — one table, one owning spec, no dual ownership.
- Export includes stars; purge removes them. References follow the Retro spec's bump.

*Gate: India (object model, split decision), Echo (one-tap affordance), Mike (Family B).*

---

## 10. Schema deltas (extends v0.6 §13)

```
-- unchanged: member_journal_sessions, member_journal_messages,
--            member_journal_attachments, member_journal_date_closures,
--            tag_assignments (Tag Manager)

member_journal_sessions
  + structured_provenance_json NULL   -- per-field: {source_message_ids[], confirmed_at,
                                      --             method: interview|extraction}

member_journal_confirmations           -- §6 event SoR (write law: same txn as
  id, session_id, identity_id,         --   structured_json mutation)
  field_key, value_present, source_message_ids_json,
  method (interview|extraction), confirmed_at
  -- field_key constrained to the v0.6 interview schema's closed set

member_journal_drafts
  identity_id, journal_date, body_md, updated_at
  PK (identity_id, journal_date)      -- one live draft per date (§7)

member_journal_stars
  id, identity_id, session_id, message_id, created_at
  UNIQUE (identity_id, message_id)    -- one star per message (§9)

-- member_practice_references: RESERVED — defined and written by the Retro
--   conversation-frame spec only. Journal never writes it (§9).

member_notify kinds (+)
  coach_day_open, coach_day_close      -- §4.3 matrix; retro-ready rides existing kind

config (fail-loud, no silent defaults)
  coach_posture_default                        -- §4.4 interim constant (forward)
  coach_model_provider / coach_model           -- §4.5
  coach_effort_map                             -- closed keys: day_open, surface,
                                               --   extract, mechanical_turn (§4.5);
                                               --   missing or unknown key aborts boot
  stt_provider                                 -- voice (§8)

-- Trade Log dependency (owned by Trade Log v1.1; cited, not redefined):
--   request-time derived open book — GET /api/me/trade-log/opens
--   (unmatched opens, FIFO match; NOT a stored open_positions table)  (§5.2)
```

All new stores: Family B, identity-scoped, export-and-purge obligated (except drafts:
purge yes, export no — §7). **Practice Portability version bump required (next version
after current repo authority — v1.3 in the advisor copy; review cites v1.4; confirm at
fold).**

*Gate: India, Alpha, Mike.*

---

## 11. Portability (amends v0.6 §12)

Export adds: stars, confirmation events + structured provenance, voice audio +
transcripts. Export excludes: unsent drafts (§7). Purge adds: drafts, stars,
confirmation events, voice media, personalization rows if/when B-Personalize lands.
References: Retro spec's bump (§9). Import remains additive; never rewrites a closed
transcript.

---

## 12. Verification (extends v0.6 §15; all v0.6 assertions inherited)

**Heat gate (§5.2)** — Fixture with an unmatched open on any active account: any
unprompted agent question or analytic turn is rejected and logged, none renders.
**Backdated session (journal_date ≠ today) with a live open now: restrained** — the
date is not an input. Book flat after a morning round-trip: released. Overnight
unmatched open: `coach_day_open` does not fire; when the book empties post-close,
`coach_day_close` may fire; no late day-open ever fires (**consumed, not deferred**).
Signal endpoint down: agent behaves as holding-risk; admin log entry exists;
member-facing surface unchanged. Boundary: a position opened mid-conversation flips the
gate on the next turn. Multi-account: an open in a second active account restrains.

**Proactive surfacing (§4.3)** — Each kind fires at most once per date; never on
off-session dates; never on closed dates; suppressed kinds are consumed (assert no
deferred fire). Journal focused: notify no-ops, presence/entrance only (no double nag).
Never renders a name string while B-Name is open (grep rendered copy for the placeholder
only). Dismissing the entrance kills the animation; presence chrome remains. Agent turns
still produce no Week-view dots (v0.6 §1.6 inherited).

**Extract-and-confirm (§6)** — No `structured_json` mutation exists without a
confirmation event in the same transaction, citing member-authored message ids. A
confirmation event creates **no member message and no Week-view dot**. Decline leaves
the field absent. Agent-turn text as extraction source: rejected by construction.
**Unknown field key: hard reject** (fixture with a key outside the v0.6 interview
schema). Closed date: confirmation returns the 409 closed refusal. The v0.6 silent-fill
rejection fixtures still pass — silence is still not a write path. Interview path writes
through the same event law (method=interview).

**Lawful empties (§4.2a)** — No active campaign: day-open fires (heat off) with no
loaded-rules block and no season nag (grep fixture output). Empty digest: no narration
of absence. Required-config absence (calendar, model, posture, effort map): boot aborts;
optional-context emptiness: silent.

**Draft persistence (§7)** — Kill the session cookie mid-draft; reopen; the draft is in
the composer. Send clears it. Purge removes it; export omits it. A draft on a
subsequently-closed date renders read-only with the closed reason. Drafts never appear
in agent context fixtures.

**Posture (§4.4) / config (§4.5)** — `coach_posture_default` absent → boot aborts.
`coach_effort_map` missing a closed-set key, or carrying an unknown key → boot aborts.
No pillar-read code path executes while B-Journey-Feed is open (feature-flag assertion).

**Tone canary (§5.3)** — Regression fixture: no agent turn stacks 3+ questions
(Tango-owned threshold), asserted over the fixture corpus.

*Gate: Kilo, Delta.*

---

## 13. Build order — J7 slices

| Slice | Lands | Depends / notes |
|-------|-------|-----------------|
| **J7-0** | Coach GO + Lima DL (B-Agent + this spec) | Spec becomes BUILD AUTHORITY |
| **J7-1** | Draft persistence (§7) | Independent; pure safety; can land first |
| **J7-2** | Trade Log open-book signal + heat gate (§5.2) | **Blocks any agent behavior change**; India/Alpha API shape |
| **J7-3** | Guide agent + extract-and-confirm + placeholder name (§4, §6) | J7-2; Kilo fixtures in same slice |
| **J7-4** | Notify kinds + presence/entrance (§4.3) | J7-3; Tango/Echo gates; B-Name still placeholder |
| **J7-5** | Voice (§8) | Mike-gated; **not GO-critical** |
| **J7-6** | Star mark (§9) | India split-or-keep; references deferred to Retro spec |
| **J7-7** | Portability bump (§11) | After stores exist |

**Charter GO = J7-0 … J7-4.** Voice, star, and the portability bump may ship later
against this same spec. Critical path: J7-0 → J7-2 → J7-3 → J7-4.

*Gate: Juliet, Delta.*

---

## 14. Review gates

| Agent | Reviews |
|-------|---------|
| **India** | Delta-map integrity (nothing v0.6 falls silently), SoR/provenance/event model, closed field set, star object + split decision, schema, Trade Log signal boundary (derived book, no stored table), reserved references table |
| **Mike** | Family B on drafts/stars/voice/confirmations, prompt + model config authority, notification kinds |
| **Hotel** | Heat-gate semantics (request-time clock), guardrail contents, transcript-only analysis, closed field set (no state-shaped keys) |
| **Tango** | Entrance character (welcome never nag), all member copy, confirmation-card copy, tone canary threshold, B-Name enforcement, no-season-nag copy (§4.2a) |
| **Echo** | Presence element + dismiss behavior, confirmation card in-thread, draft restore UX, star affordance |
| **Charlie / Alpha** | Presence/animation wire, draft autosave, agent context (open book, digest), notification kinds, opens-endpoint client |
| **Kilo / Delta / Lima / Juliet** | Tests, gates, DL entries, board, J7 slices |

---

## 15. Open decisions

| # | Decision | Owner | Blocks |
|---|----------|-------|--------|
| 1 | **B-Name** — member-facing agent name + greeting strings *(closes v0.6 §17 item 5)* | Coach (Tango advises) | Any name/greeting string; placeholder ships meanwhile |
| 2 | **B-Journey-Feed** — fade calibration input | Coach (after the Journey as-built parity pull) | §4.4 glide activation only; constant-posture interim ships |
| 3 | **B-Personalize** — learning store schema | Coach (Hotel + Tango + Mike advise) | §4.1 personalization context only |
| 4 | **B-Campaign-bind** — path-piece Campaign binds to `member_practice_campaigns` | Coach (India advises) | Nothing here — §4.2a lawful empty keeps this spec campaign-neutral |
| 5 | Star: in-spec vs split thin spec | India | §9 packaging only |
| 6 | Portability current version (v1.3 advisor copy vs v1.4 per review) | Lima confirms at fold | §11 bump target number only |
| 7 | v0.6 §17 items 1–3, 4b (trades-strip width/R2R exposure), 6–8, 11–12 | inherited owners | unchanged, still open |

---

## 16. Decision-log entry (draft, on Coach GO)

> **Journal Session v0.7 — the guide charter (B-Agent fold).** Coach override of
> 2026-08-13 landed as versioned law: witness → guide; proactive surfacing at open
> moments is the primary interaction model (`coach_day_open` / `coach_day_close` +
> retro-ready; ≤1 per kind per date; suppressed = consumed, never deferred); fading
> glide path (interim constant posture pending B-Journey-Feed). Retained rails as code:
> heat gate on the **request-time derived open book** (any active account; journal date
> not an input; fail toward restraint) and **extract-and-confirm** as structured
> confirmation events (closed v0.6 interview field set; same-transaction write law; no
> member message minted; silent writes remain forbidden). Server-side draft persistence
> (idle timeout can no longer cost a reflection). Voice requirements set (J7-5); star as
> own object outside sealed records (J7-6; references reserved to Retro spec). B-Name
> blocks all agent name strings. Campaign-neutral (lawful empties). v0.6 surface,
> calendar, one-session-per-date, tags, closure, uploads unchanged. Family B on all new
> stores; Portability bump. No profit claims.

---

## 17. Document history

| Date | Note |
|------|------|
| 2026-07-30 | v0.6 BUILD AUTHORITY — one session/date, calendar nav, media header |
| 2026-08-13 | v0.7 DRAFT — B-Agent fold: guide charter, proactive surfacing, heat gate, extract-and-confirm, draft persistence, voice/star requirements |
| 2026-08-13 | **v0.7 DRAFT rev 2** — advisor review folded (H1–H6, S1–S5): heat gate re-clocked to request-time derived open book (date not an input; consumed-not-deferred; multi-account; overnight suppression); kind × state matrix + focus no-op; confirmation-event SoR + same-txn write law + closed field set; lawful empties (no campaign / empty digest); parents corrected (Own Spine, Member Campaign, Portability version note); J7 build slices; references table reserved to Retro spec; effort-map closed keys; dismiss ≠ presence withdrawal |

---

*Advisor artifact — FatTail Labs external advisor layer. Becomes build authority only on
Coach GO + Lima decision-log entry per repo governance.*
