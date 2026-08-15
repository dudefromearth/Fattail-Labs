# FatTail Labs — Journal Session Spec v0.6

**Status:** **BUILD AUTHORITY** — Coach implement GO 2026-07-30 · board
`agents/p-journal-session-v06/` · DL-161.  
**Supersedes:** v0.5 (multiple entries per date), v0.1–v0.4a entirely, and the v0.2 / v0.4a
program product frames.

**What changed in v0.6.** One conversation per date replaces multiple entries per date — the
session already holds everything with per-message timestamps, so entry-list chrome, `New entry`,
and `Refresh` were redundant. Plus: timestamps beside speaker labels, a fixed-height scrolling
thread, image thumbnails in the session header, and richer position detail on the trades strip.  
**Family:** B (member-private)  
**Entitlement:** Observer, Activator, and Navigator have identical Journal access; Observer is a
paid six-week trial differing only in term. No role means no product access (Identity & Access).

**Parents (cite this version for that topic):**

| Doc | Cite for |
|-----|----------|
| **Tag Manager Spec v0.3** | System vocabulary, assignments, picker, admin CRUD, Family B on assignments |
| Retrospective **v0.6** / **v0.5** | As-built lifecycle; gather Option C; complete hook |
| Journey Experience **v1.0** | Cadence meter, profiles, routine |
| Trade Log **v1.1** | Day-book context for the agent |
| Practice Portability **v1.1** | Export/import/purge (version bump required) |
| Member Data Privacy **v0.1** | Family B |
| **Member AI Memory & Period Brief v1.0** | What the Journal agent may know; compile pack; admin Edit |

**2026-08-14 Coach day-view ruling (j.png · DL-339).** On the Journal day card, **remove**
Tags, Campaign, Playbooks, and **anything to do with structured interviews**. The image
area **extends the full width**. The message thread **grows** into the room those
controls occupied. Practice suite nav (Playbook / Campaigns) is unchanged.

**Data model (same ruling):** a Journal session is a **conversation** — date, messages,
attachments, prompt version. Create does not stamp tags, structured fields, or a
campaign. Retrospective compile reads member messages, not a form. Leftover columns
may exist as NULL; they are not product.

**2026-08-14 Coach — admin Edit on Journal (DL-340).** Lower-left black **Edit**
(Labs convention). Opens an **AI Instructions** window over the message box:
markdown editor (same window as Playbook / Toughness), **Close** dismisses,
bottom border **Reasoning** (low / medium / high) + **Save**. Not a site-wide
framework change yet.

**Prerequisite:** Tag Manager is **BUILD AUTHORITY / as-built** (DL-159 · mig 053 · TM7-G PASS).
Journal Session **consumes** Tag Manager; it does not define vocabulary or create tags.

**Why this is a rewrite.** v0.1–v0.4 accreted tag-scripts, depth budgets, required-field gates,
partial records, day-sealing, and a second write surface. v0.5 is the chatbot product: conversation
is the record.

**Why it matters.** The Journal is where process integrity is recorded — central to Practice, not
a side feature.

---

## 1. What this is

**The Journal is an AI chatbot** — conversation thread + composer. The conversation *is* the journal
record.

### 1.1 The screen

Top to bottom:

1. Calendar controls — Year / Month / Week / Day, previous / next, Today
2. The date, and `Open retrospective` (§6)
3. **Session header** — system tags (§5) and image thumbnails (§1.4)
4. **The conversation thread** — a **scrollable session**: fixed region, scrolls internally, the
   window does not grow (§1.4)
5. **The composer** — one box, voice input, send
6. `Structured interview` — collapsed bar (§1.2)
7. Trades on this day (§1.5)

The composer is the entry point. No start button. No intermediate step before writing.

**One conversation per date.** There is no entries list, no `New entry`, and no `Refresh`. The
session holds everything for that date and every message is timestamped, so a second entry adds
nothing the transcript does not already carry.

### 1.2 The interview

The structured interview **appears only when the member requests it**. When done, they collapse it
to a **bar** that can expand again. Default layout is chatbot only.

It never opens on load, never opens because a tag was selected, and never appears uninvited.

### 1.3 Not on the screen

No manual-write path and no alternative to the conversation — the conversation is the Journal.

No question/turn counters. No member-facing seal control. No internal vocabulary in member copy:
no phase names, status enums, tag ids, field keys, or `§` references.

**No entry chrome.** No entries list, no entry selector, no `New entry`, no `Refresh`.

**No copy explaining the surface.** Strings like "This conversation is the journal. Write in your
words; optional structure is available when you ask for it" or "No further absence probes right now
— write freely or invoke the structured pass" describe the interface to the member instead of
letting it work. Both are currently on screen and both come out. If a screen needs a paragraph of
explanation, remove a control rather than add the paragraph.

**Not "Interviewer."** The agent's turns carry its name. The interview is the optional add-on, not
the frame.

### 1.4 Thread and header

#### Scrollable session (required feature)

> **The session is a scrollable region. The window does not grow.**

This is a feature of the Journal, not an implementation detail or a styling preference. The
conversation scrolls inside a fixed region; adding messages never lengthens the page. The composer
stays in view.

Stated precisely, because "contained" is true at three messages and false at forty:

- The thread has a **bounded height** and its own overflow. Message count changes what is inside it,
  never the height of the page.
- The **composer is pinned below the thread** inside the same container and is always reachable
  without scrolling the page.
- **Short sessions do not stretch.** One message renders in a region of the same height as forty,
  so the surface does not jump as a conversation grows.
- **New messages scroll the thread to the bottom** — unless the member has scrolled up to read, in
  which case position is held rather than yanked.
- Reopening a session lands at the **most recent** message.
- The thread does **not** chain its scroll to the page: reaching top or bottom stops there rather
  than carrying the page with it.

**Every message shows a clearly visible timestamp beside the speaker label.** Not a hover title, not
a tooltip, not revealed on selection — rendered, legible, and always present. The record is stamped
in market time, a member reading back needs to see when something was said without acting on
anything, and the Week view (§1.6) is built on the same timestamps.

**The session header is the image area**, beside the tags. Uploads (§10) land there rather than
expanding the thread, which keeps the scroll region for conversation and gives the header a job — it
is otherwise dead space.

It is three things at once:

| Function | Behavior |
|---|---|
| **Thumbnail strip** | Every image on this session, in upload order |
| **Drop target** | Drag and drop anywhere in the area. Multi-file drop accepted up to the per-session cap; the whole drop is refused with a count if it would exceed, rather than silently taking the first few |
| **Click to upload** | Clicking empty area opens the file picker |

Paste into the composer remains the primary path (§10) — a screenshot is already on the clipboard.
Drag-drop and click are the additional routes, not replacements.

**Clicking a thumbnail opens a lightbox**: the full image, navigation to the other images on the
session, and **the caption field**. The caption is what the system reads, since the agent never
interprets images (§10), so the lightbox is where it is written and edited — the spec previously
required captions without saying where they came from.

**When the date is closed** (§7) the area still displays existing thumbnails and the lightbox still
opens, but drop, click-to-upload, and caption editing are refused with the same reason and link as
any other write to a closed date. Read stays open; the record does not change after review.

Thumbnails, full images, and the lightbox are served by authenticated per-owner reads with no public
URL (§10). A thumbnail is Family B, exactly as the image is.

### 1.5 Trades on this day

Each position shows, beyond what is displayed today:

- **Spread width**
- **Risk-to-reward**, computed and supplied by Trade Log — not derived in the Journal
- **Entry and exit time and date**

R2R here is a structural property of the position, known at entry. It is process detail, not
performance: no win rate, no expectancy, no aggregate P&L framing anywhere on this strip.

Requires Trade Log to expose width and R2R. *Gate: **India**, **Alpha**, **Hotel** (correctness of
R2R for defined-risk spreads).*

### 1.6 Week view — activity map

The Week view is a grid: one column per day, four rows of session bands.

| Band | Window |
|---|---|
| **GX** | Before the regular open |
| **AM** | Open to session midpoint |
| **PM** | Session midpoint to close |
| **CL** | After the close |

**Band boundaries come from the market calendar config** (§4), never hardcoded. A half-day shifts
the close, so CL begins earlier that day.

**A dot means the member wrote in that band.** Placement is by the message's own timestamp against
that date's session window — the same timestamps rendered in the thread (§1.4). Content written
outside the session window falls into GX or CL by construction; no special case is needed.

**Dots key on member-authored messages only.** Agent turns produce no dots. Every member message
draws a reply, so counting both would make the map show conversation volume rather than when the
trader journaled.

**Clicking a band opens that day's journal and scrolls the thread to the first message in that
band.** This is the navigation. Clicking a band with no dot opens the day at the top rather than
doing nothing — an empty day must still be reachable, and so must the day header.

Deep-link scroll requires the thread to address an individual message, which it can, since messages
are ordered and timestamped.

**The summary panel below the calendar becomes redundant** if bands are the navigation — it repeats
what the grid shows and adds a second way to open the same day. Recommend removing it; Coach's call
(§17 item 11).

Band click behavior is one instance of the general rule in §1.7.

Three placement rules need deciding rather than guessing (§17 item 12):

- **AM/PM split.** Session midpoint is more robust than a fixed noon, since a half-day would
  otherwise leave a near-empty PM band. *Hotel.*
- **Weekends and holidays** have no session window at all. The bands still need a rule — midday as
  the only meaningful division, or a single merged band for those columns. *Hotel, Echo.*
- **Content written on a later date** about this one lands in CL by construction, which is honest
  but indistinguishable from something written that evening. Whether it earns a distinct dot
  treatment is a legibility question. *Echo, Tango.*

### 1.7 Calendar navigation — the cell is the control

**Every calendar cell navigates directly. There is no Open button anywhere.**

| View | Clicking a cell goes to |
|---|---|
| Year | That month, in Month view |
| Month | That day, in Day view |
| Week — day header | That day, in Day view |
| Week — session band | That day, scrolled to the first message in the band (§1.6) |

**Why this replaces the info panel's Open button.** A member looks at a day with content, then has to
move focus to a separate control somewhere else on the page to act on the thing they were already
looking at. The object they are attending to is not the object they can act on. Direct manipulation
is the Apple HIG standard this platform adopted, and it says the cell *is* the control.

Rules that make it real rather than nominal:

- **The whole cell is the hit target**, not the date number inside it.
- **Cells that contain nothing are still clickable** and open that day at the top. A member journals
  a day *because* it is empty; an unclickable empty day is the same failure in a smaller form.
- **Cells carry a visible interactive state** — hover and focus — so the affordance is legible
  before the click.
- **Keyboard reachable**: cells are focusable and activate on Enter.

With navigation on the cells, the summary panel below the calendar has no remaining function
(§17 item 11).

*Gate: **Echo** (layout), **Tango** (copy).*

---

## 2. The record

| Layer | Content | Mutability |
|-------|---------|------------|
| **Transcript** | Every message (member and agent) with author, timestamp, derived market phase | Append-only while open; closed by retrospective completion (§7) |
| **Structured record** | Fields confirmed through the optional interview (§1.2) | Written on confirmation; absent if interview never used |
| **Tag assignments** | Zero or more **system tags** on the session | Via Tag Manager only (§5); open sessions only |

A transcript with no structured record and no tags is a complete journal entry.

There is one record per date (§3), so "the entry" and "the conversation" are the same object.

**Attribution is load-bearing.** Downstream readers quote **member-authored content only**. Agent
turns are never quoted as the member's words.

Unfilled structured fields are **absent** — never inferred, never agent-filled.

*Gate: **India**, **Mike**.*

---

## 3. Dates and sessions

**Every entry is attached to a specific date.** `journal_date` is member-set, defaults to today
(America/New_York), backdating allowed. It is the Retrospective scope key — not derived from
`created_at`.

**One conversation per date.** `UNIQUE (identity_id, journal_date)`. Everything the member records
for that date lives in one session, ordered and disambiguated by per-message timestamps (§4).

Backdating is unaffected: a member writing Tuesday up on Wednesday opens Tuesday's conversation.

**Migration.** Dates that currently hold more than one session must be consolidated before the
constraint applies: merge transcripts by message timestamp, preserving author and phase. Structured
records may collide — where two exist for one date, keep both under review rather than discarding
one, and hand admin the list. Do not drop member content to satisfy a constraint. *India.*

**A session stays open until a retrospective covering its `journal_date` has been completed** (§7).
Until then the member may return and continue. No end-of-day seal, no partial status.

`status` is binary: `open` | `closed`.

*Gate: **India**.*

---

## 4. Timestamps and market phase

Every message has an immutable UTC timestamp.

Phase is derived per message from timestamp vs market calendar for `journal_date`:

| Phase | Meaning |
|-------|---------|
| `pre_open` | Before the open on that date |
| `intraday` | Between open and close |
| `post_close` | After the close, same date |
| `off_session` | Weekend or holiday |
| `later_day` | Written on a later calendar date than `journal_date` |

**Retrospective expected-vs-actual** draws only on **`pre_open` member** content for that date.
Later-written material flows to reflection sections. Nothing discarded; read honestly.

Market hours / holidays / half-days from **config**. Missing calendar fails loud.

*Gate: **India**, **Hotel**.*

---

## 5. Tags — Tag Manager compliance (normative)

Journal **does not own tag vocabulary**. It is a **consumer** of Tag Manager Spec **v0.3**
(as-built).

### 5.1 Compliance rules (must hold)

| Rule | Requirement |
|------|-------------|
| **Vocabulary SoR** | Tag Manager `tags` table only. No session column is the source of truth for tags. |
| **Assignment SoR** | `tag_assignments` with `object_type = journal_session`, `object_id = session.id`, `identity_id = owner`. |
| **Admin-only CRUD** | Members never create, rename, merge, retire, or delete tags. Admin only (`/admin/tags`). |
| **Assign-only** | Members select from active system tags via shared **TagPicker** (or equivalent chips). |
| **No free-text birth** | Composer / chips must not invent new labels. Unknown strings are not tags. |
| **Optional** | Session may have zero tags. Composer works with none selected. |
| **Open only** | Tag changes refused when session or date is closed. |
| **Context to agent** | Agent may receive selected labels as description ("member tagged: …"). Never as instruction: no script, no interview open, no required-field change, no persona switch. |
| **No P&L** | No UI or agent path correlating tags with profit, win rate, or expectancy. |
| **Family B** | Assignments inherit session privacy. Export includes tags; purge removes assignments. |
| **Lexicon teaching** | Browse/learn the vocabulary on Resources hub **Lexicon** — not inside Journal. |

### 5.2 Implementation contract (as-built Tag Manager)

| Capability | Path / component |
|------------|------------------|
| List active vocabulary | `GET /api/tags` |
| Read assignments | `GET /api/tags/assignments?object_type=journal_session&object_id=` |
| Set assignments | `PUT /api/tags/assignments` with `tag_ids[]` |
| UI | `TagPicker` with `objectType="journal_session"` |
| Admin lexicon | `/admin/tags` (out of Journal scope) |

### 5.3 Explicitly forbidden (anti-regression)

- Per-session or per-member tag definition tables  
- Tag-driven interview scripts or depth budgets  
- Tag chips that imply a required choice before writing  
- Using a tag as the retrospective **navigation** control (see §6)  
- Showing tag ids, slugs as technical chrome, or "system_key" to members  

### 5.4 Migration from prior Journal programs

Legacy `member_journal_sessions.tag` (single string) and any interim join tables are **not** SoR.
On implement: map known legacy values to system `tag_id`s where a matching active tag exists;
otherwise leave unassigned. Do not create member-owned tags to preserve orphans.

*Gate: **India**, **Tango**, **Alpha** (Tag Manager integration).*

---

## 6. Moving to the Retrospective

**Retrospective navigation is a Session action, not a Tag Manager tag.**

A dedicated control (e.g. "Open retrospective") — **not** a vocabulary chip — routes the member:

| Situation | Behavior |
|-----------|----------|
| Nothing written yet | Route only. No journal entry created |
| Mid-conversation | Save, **leave session open**, link entry ↔ retrospective both ways, navigate |

Resume open retrospective if one exists; else create via existing R1 path. Empty scope: create
nothing; explain. **Never auto-gather.**

Warnings before gather and before complete — dates named, open session count stated (copy § as
v0.5 prior draft). Completing is irreversible.

*Gate: **Tango**, **India**, **Delta**.*

---

## 7. Closure

Completion of a retrospective that reviewed dates is the **only** seal.

- Closed set: scope-true — dates actually reviewed, from scope start through day before gather.
  Gather date stays open.  
- Open sessions on closed dates → `closed`. No further messages, attachments, **tag changes**, or
  structured confirmations.  
- New sessions/attachments on closed dates: **409** + reason + link to closing retrospective.  
- Permanent for members. Demo: immutable `is_demo` fixtures only.

*Gate: **India**, **Mike**, **Delta**.*

---

## 8. The agent

### 8.1 What it knows

- Trade Log context for the entry's date  
- Journey profile (calibrate only; never recite grades/meters/streaks/scores)  
- Selected **system tag labels** as context only (§5.1)  
- Transcript so far  
- **Member context pack** (compile, not a second biography):
  - Profile display name  
  - **Journey activity** — courses, completed lessons, live check-ins, habit plans.
    Never grades, meters, streaks, or scores.  
  - **Trade Log (last 14 days)** — date, product, strategy, side, adherence.
    Never P&L as identity.  
  - **Past journal days (last 21 days, other dates)** — member words.  
  - **Completed retrospectives** — period, title, body, one-thing.  

  Use as memory. Do not recite the pack unless asked. Do not invent missing text.  

### 8.2 Behavior

Open-ended. Detects absences once. Member leads. Member always writes first. During market hours:
no unprompted questions; answer if asked. Presses for precision, not brevity. Starts in the middle
using the trade log.

### 8.3 Prompt

Admin-editable, versioned; each session stamps `prompt_version_id`. Guardrails (§9) enforced in
**code**, not prompt hope.

### 8.4 Availability

Always available. If the model is down: composer still captures messages; UI unchanged; no "mode"
label for the failure.

*Gate: **Hotel**, **Tango**, **Mike**.*

---

## 9. Guardrails

Code-enforced before any agent turn renders. Violating turns do not display; log.

Never: motive/emotion naming; unstated market/price facts; advice; praise/blame; loss asymmetry;
P&L figures; grades/meters/streaks/scores; brevity demands; trade-log redundancy; image
interpretation; filling empty fields; more than one question per turn.

"I don't know" is complete. Once-only absences.

*Gate: **Hotel**, **Tango**, **Delta**.*

---

## 10. Uploads

Paste-primary. Family B private media. No public URL. Export + purge from day one. Agent does not
interpret images; member caption is the machine-readable assertion.

*Gate: **Mike**, **Hotel**.*

---

## 11. Retrospective cadence

Owned by Retrospective + Journey. Recorded here because §6–§7 depend on it: weekly default,
trader-configurable; missed period alert; adherence in process integrity score.

*Gate: **Coach**, **Hotel**, **Tango**, **India**.*

---

## 12. Portability

Export: sessions, messages (author, phase), structured record, **tag assignments** (slug/label via
Tag Manager), attachment captions + binaries.

Import additive; never rewrite a closed transcript. Purge: sessions, messages, media, **tag
assignments** for that identity. Vocabulary untouched.

Export Spec version bump required.

*Gate: **India**, **Alpha**.*

---

## 13. Schema sketch

```
member_journal_sessions
  id, identity_id, journal_date, session_started_at,
  status (open|closed), closed_by_retrospective_id NULL, closed_at NULL,
  structured_json NULL,
  prompt_version_id NULL,
  spawned_retrospective_id NULL,
  export_key, created_at, updated_at
  UNIQUE (identity_id, journal_date)   -- one conversation per date (§3)
  -- NO tag / tags column as SoR

member_journal_messages
  id, session_id, identity_id, author, agent_service NULL,
  body_md, phase, created_at

member_journal_attachments
  id, session_id, identity_id, trade_id NULL,
  storage_key, caption_md, created_at

member_journal_date_closures
  identity_id, journal_date, closed_by_retrospective_id, closed_at
  PK (identity_id, journal_date)

-- Tag Manager (owned by Tag Manager Spec v0.3; not redefined here)
tag_assignments (object_type='journal_session', object_id=session.id, identity_id=owner)
tags, tag_categories
```

Legacy single-column `tag` on sessions (if present from prior programs) is **deprecated** — dual-read
until migration complete; not written for new sessions.

*Gate: **India**, **Alpha**.*

---

## 14. Build order

| Slice | Deliverable | Depends |
|-------|-------------|---------|
| **J0** | Coach GO, §17 locks, DL, board freeze | Tag Manager **shipped** (done) |
| **J1** | Schema migration; composer-first chat surface; market calendar | J0 |
| **J2** | Agent: context (trade log, journey, **tag labels**), guardrails, RTH, once-only | J1 |
| **J3** | Admin prompt edit + version stamp | J2 |
| **J4** | TagPicker on session (`journal_session`); no free-text tags | J1 + Tag Manager APIs |
| **J5** | Interview on request, collapse bar, structured_json | J2 |
| **J6** | Paste uploads, private media | J1 |
| **J7** | Retrospective **action** (not a tag) + warnings | J1 |
| **J8** | Scope-true closure; 409; open-session count in complete warning | J7 |
| **J9** | Portability + export Spec bump + program close | J1–J8 |

**Critical path:** J0 → J1 → J2 → J8  
**Tags (J4)** and **interview (J5)** after surface + agent core.

*Gate: **Juliet**, **Delta**.*

---

## 15. Verification

**Surface** — Empty day: composer, no start button. First send creates entry. Thread above
composer. Composer works with zero tags. Interview absent until requested; collapses to bar.
No counters, no seal control. Agent down: capture still works. Grep member HTML: no phase names,
status enums, tag ids, field keys, `§`.

**Surface (v0.6)** — Exactly one session exists per `(identity_id, journal_date)`; a second create
is refused. No entries list, no `New entry`, no `Refresh` anywhere on the surface. Thread renders at fixed height and
scrolls internally: assert page height is identical with 1 message and with 40, that the composer is
reachable without page scroll in both, that a new message scrolls the thread to the bottom but not
while the member is scrolled up, that reopening lands at the latest message, and that scrolling past
either end of the thread does not move the page. Every message
renders a timestamp beside its speaker label. Uploaded images render as thumbnails in the session
header, not inline in the thread. Drag-drop, click-to-upload, and paste all produce the same
attachment. A multi-file drop exceeding the cap is refused whole, with a count. Clicking a thumbnail
opens a lightbox with navigation and an editable caption. On a closed date the thumbnails and
lightbox still open while drop, upload, and caption edits return the closed-date refusal. No public
URL resolves to a thumbnail or a full image. Grep rendered copy for surface-explaining strings — none may
appear. The agent's speaker label is its name, never "Interviewer". Trades strip shows spread width,
R2R, and entry/exit time and date, with no win rate, expectancy, or aggregate P&L.

**Week view (§1.6)** — A band shows a dot when at least one member message falls in that window;
agent turns produce none. Band boundaries follow the market calendar, and a half-day shifts CL.
Clicking a band opens the day and scrolls the thread to the first message in that band; clicking an
empty band opens the day at the top. Every message in the thread renders a visible timestamp without
hover or selection.

**Calendar navigation (§1.7)** — Year cells open Month, Month cells open Day, Week day headers open
Day, Week bands open Day scrolled to the band. No Open button exists on any calendar surface. The
full cell area is the hit target, empty cells navigate, cells show hover and focus states, and cells
are keyboard focusable and activate on Enter.

**Tag Manager compliance** — Session has no vocabulary SoR column for new writes. Assignments only
via Tag Manager APIs. Non-admin cannot create tags. Retired tags not assignable. Closed session
refuses tag changes. Agent prompt fixture includes tags as description only; assert no behavior
change from tag alone. Export includes tags; purge removes assignments only.

**Record** — Author, timestamp, phase on every message. Member-only quotes for intent. Transcript-only
entry valid.

**Dates / phase / agent / closure / uploads / copy** — As prior v0.5 draft §15 (unchanged intent).

*Gate: **Kilo**, **Delta**.*

---

## 16. Review gates

| Agent | Reviews |
|-------|---------|
| **India** | Model, closure, schema, **Tag Manager boundary** |
| **Mike** | Family B, media, prompt authority, demo |
| **Hotel** | Guardrails, phase, non-vision |
| **Tango** | Copy, warnings, trial, tags as framing only |
| **Echo** | Composer-first, interview bar, tag chips UI |
| **Charlie** | Chat, TagPicker wire, collapse bar |
| **Alpha** | Agent context, calendar, portability, Tag Manager client |
| **Sierra** | No journal leakage; tags ≠ course taxonomy |
| **Kilo** / **Delta** / **Lima** / **Juliet** | Tests, gates, docs, board |

---

## 17. Open decisions

| # | Decision | Owner |
|---|----------|-------|
| 1 | Cadence configuration UX | Coach + India |
| 2 | Cadence meter adherence vs days-since | India + Tango |
| 3 | Routine meter + backdating | India + Tango |
| 4 | Voice transcription / Family B | Mike |
| 4b | Trade Log exposure of spread width and R2R for the trades strip (§1.5) — new dependency | India + Alpha |
| 11 | Removal of the summary panel below the calendar. With cell navigation (§1.7) it has no remaining function — recommend removing | Coach |
| 12 | Week view band rules: AM/PM split point, weekend and holiday columns, treatment of later-written content (§1.6) | Hotel + Echo + Tango |
| 5 | Agent persona name | Coach + India |
| 6 | Admin prompt edit scope | Coach + Mike + Tango |
| 7 | Agent principals interim vs P2 | Coach + Mike |
| 8 | Migration map for legacy sessions / agent turns | India + Tango |

Tag Manager product locks (admin-only CRUD, assign-only) are **closed** — not open.

---

## 18. Decision-log entry (approved GO)

> **Journal Session v0.6 — one conversation per date; calendar is the control.** Conversation is
> the record; fixed-height scroll session; visible timestamps; header media; Week activity map;
> cells navigate without Open. System tags only via Tag Manager v0.3 (compact assign UI). One seal:
> retrospective complete, scope-true. Agent: member-first, once-only absences, code guardrails,
> versioned prompt stamp. Supersedes Session Specs v0.1–v0.5 multi-entry frame. No profit claims.
> Family B isolation unchanged. Mig 054 UNIQUE + merge.

---

## 19. Document history

| Date | Note |
|------|------|
| 2026-07-30 | v0.5 draft — chatbot rewrite |
| 2026-07-30 | Tag Manager compliance (§5 expanded); retrospective action vs tag; parents + prerequisite |
| 2026-07-30 | **v0.6 BUILD AUTHORITY** — one session/date · calendar nav · media header · week map · mig 054 |
