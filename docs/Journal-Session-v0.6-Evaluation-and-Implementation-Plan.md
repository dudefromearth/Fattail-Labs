# Journal Session Spec v0.6 — Evaluation & Implementation Plan

**Date:** 2026-07-30  
**For:** Coach review  
**Spec:** [`Specs/FatTail-Labs-Journal-Session-Spec-v0.6.md`](../Specs/FatTail-Labs-Journal-Session-Spec-v0.6.md)  
**Status of Spec:** **DRAFT** — not build authority until Coach GO  
**Supersedes (product frame):** v0.5 multi-entry-per-date; inherits v0.5 chatbot + Tag Manager law  
**Prior plan:** [`Journal-Session-v0.5-Implementation-Plan.md`](./Journal-Session-v0.5-Implementation-Plan.md)  
**Prior board:** `agents/p-journal-session-v05/` (partial J1–J5 substrate under v0.5 GO)

**Calendar note:** There is **no separate Calendar Spec file**. Calendar product law lives in
Journal Session Spec **§1.6** (Week activity map) and **§1.7** (cell is the control). This plan
treats those sections as first-class deliverables equal to the day chat surface.

---

## 0. Executive verdict

| Question | Answer |
|----------|--------|
| Is v0.6 a rewrite or a polish? | **Targeted product rewrite** of navigation + record cardinality + day chrome. Chatbot thesis (v0.5) stays. |
| Is it coherent? | **Yes** — one conversation per date unlocks simpler UI and makes Week bands meaningful. |
| Ready for GO as written? | **Nearly.** Draft hygiene + open decisions (11, 12, 4b, 5) should lock before build freeze. |
| What to do with v0.5 board work? | **Keep as substrate**, then **reframe** board to `p-journal-session-v06` (or recharter v05) after GO. Do not ship multi-entry chrome. |
| Biggest risk | **Multi-session merge** before `UNIQUE (identity_id, journal_date)` without losing member content. |
| Second risk | **Trade Log width/R2R** (§1.5 / §17-4b) — Journal must not invent R2R; depends on Trade Log expose. |
| Third risk | **Tag UI wording** in v0.6 §5 drifts toward generic `TagPicker`/chips; keep compact control + list window from v0.5 / DL-160 to avoid chip-wall regression. |

**Recommendation:** Coach GO after small Spec hygiene + lock decisions 11/12 (and interim defaults for 4b/5 if deferred). Then execute the plan below on top of current substrate.

---

## 1. What v0.6 changes (vs v0.5)

### 1.1 Product law deltas

| Area | v0.5 | v0.6 |
|------|------|------|
| **Cardinality** | Multiple sessions per date | **Exactly one** conversation per `(identity_id, journal_date)` |
| **Day chrome** | Entries list · New entry · Refresh | **None** — no list, no New entry, no Refresh |
| **Thread** | Soft max-height; page can grow | **Fixed-height scroll region**; page height stable; composer pinned |
| **Timestamps** | Optional / phase chrome risk | **Always visible** beside speaker label (market-local) |
| **Agent label** | "Interviewer" risk | Agent **name** (persona); never "Interviewer" |
| **Explanatory copy** | Several teach-the-UI strings | **Banned** — remove; if UI needs a paragraph, remove a control |
| **Media** | Paste-primary (J6), vague placement | **Header thumbnail strip** + drop/click + lightbox caption |
| **Trades strip** | Day-book summary | **Width · R2R · entry/exit datetime** (process, no P&L framing) |
| **Week view** | Decorative band grid (no dots) | **Activity map**: member-message dots; band → day + scroll |
| **Calendar nav** | Select day + **Open** panel | **Cell is the control**; no Open button |
| **Tags §5.0** | Explicit compact + list window | Wording simplified to TagPicker; **intent still assign-only** |
| **Schema** | Multi-row ok | `UNIQUE (identity_id, journal_date)` + merge migration |

### 1.2 Unchanged law (carry forward)

- Chatbot = journal; interview on request only; bar default collapsed  
- Tag Manager v0.3 SoR; admin lexicon; assign-only; agent gets **labels as context only**  
- Retrospective = dedicated action, not a tag  
- One seal = retro complete, scope-true; open \| closed  
- Member-first agent; RTH quiet; code guardrails; model-down still captures  
- Family B media; no public URLs  
- No profit claims; process outcomes only  

### 1.3 Spec quality issues (fix before GO)

| Issue | Severity | Fix |
|-------|----------|-----|
| Status still **DRAFT**; §18 DL text still says "v0.5" | High for GO | Bump to BUILD AUTHORITY + rewrite §18 for v0.6 |
| Document history only lists v0.5 | Low | Add 2026-07-30 v0.6 row |
| Duplicate paragraph ("Stated precisely…") in §1.4 | Low | Deduplicate |
| §5 TagPicker language may invite chip-wall regression | Medium | Restore one sentence from v0.5 §5.0: compact control → list window, not always-on wall |
| Agent persona name open (§17-5) but UI forbids "Interviewer" | Medium | Interim default name e.g. **"Journal"** or product agent callsign until Coach locks |
| Week band rules open (§17-12) | Medium | Ship interim: midpoint AM/PM; weekends = GX/AM/PM/CL by **local clock halves** or **single "DAY" band** (Coach pick) |
| Summary panel removal open (§17-11) | Low | Recommend **remove** with cell navigation |
| Trades R2R dependency open (§17-4b) | Medium | Phase A: show entry/exit times; width if already computable; R2R when Trade Log exposes |

---

## 2. Gap analysis vs as-built substrate (2026-07-30)

### 2.1 Already close (keep)

| Asset | Path / note |
|-------|-------------|
| Tag Manager | mig 053 · assign APIs · admin lexicon · **COMPLETE** |
| Closed-date + closed-session tag refuse | `routes/tags.py` 409 |
| Composer-first empty day + first-send create | `JournalCalendar` `onFirstSend` |
| Interview collapse bar | `journal-interview-bar` |
| Compact tags list window | `JournalTagsControl` |
| Retro dedicated control | "Open retrospective" |
| Agent plain-text degrade | `SessionInterviewChat` fallback to `postJournalMessage` |
| Agent TM labels in LLM context | `journal_session_agent._llm_turn` |
| Message timestamps in DB | `created_at` on messages |
| Attachment API substrate | `journal_session_media` · attachments routes |
| Date closures | `member_journal_date_closures` |
| Week band **shell** | `WEEK_BANDS` GX/AM/PM/CL UI exists (no dots / no band deep-link yet) |

### 2.2 Contradicts v0.6 (must kill or rework)

| Current | Spec v0.6 | Action |
|---------|-----------|--------|
| Multi-entry list · New entry · Refresh | Forbidden | **Remove** day chrome |
| Auto-open "newest of many" sessions | One per date | Load **the** session for date (or empty composer) |
| `create_session` allows N rows/day | UNIQUE 1 | Domain + migration |
| `max-h-64` thread, page grows | Fixed session viewport | Thread+composer layout rewrite |
| Speaker **"Interviewer"** | Agent name | Copy fix |
| Explanatory UI paragraphs | Banned | Delete strings |
| `DayPanel` + **Open** button | No Open anywhere | Remove panel; cell navigates |
| Month/Year may only **select** without entering Day | Cell → Month/Day | Wire navigation matrix §1.7 |
| Week bands empty / select day only | Dots + scroll-to-band | Activity map API + scroll anchors |
| No header media strip | §1.4 | New component |
| Day trades thin | Width / R2R / times | Day-book + Trade Log extend |
| No unique index | Schema | mig + merge |

### 2.3 Still missing from v0.5 plan (unchanged need)

- Market calendar **config fail-loud** for phase + band boundaries (not hard-coded RTH alone)  
- Admin **prompt_version_id** store + stamp  
- Full **guardrail corpus** tests (Kilo)  
- Export Spec bump + purge completeness  
- Formal Delta gates  

---

## 3. Product definition of done (v0.6)

1. **One conversation per date** — DB unique; second create 409 or get-or-create; no multi-entry UI.  
2. **Empty day** = composer only; first send creates/opens that day's session.  
3. **Fixed-height thread** + pinned composer; scroll rules per §1.4 (Kilo measurable).  
4. **Visible timestamps** on every message; agent label = configured name, not "Interviewer".  
5. **No** entries list, New entry, Refresh, Open button, or surface-explaining copy.  
6. **Tags** compact + assign-only via Tag Manager; closed refuses.  
7. **Interview** collapsed until requested.  
8. **Header images** — thumbnails, drop/click/paste same store, lightbox + caption, closed read-only.  
9. **Trades strip** — width, R2R (when available), entry/exit date-time; no win rate / expectancy / aggregate P&L.  
10. **Week map** — member-message dots by band; band click → Day scrolled to first message in band.  
11. **Calendar cells** navigate per §1.7; empty cells still open Day.  
12. Agent member-first; guardrails; RTH; TM labels context-only; model-down capture.  
13. Retro action + scope-true closure; export/purge include tags + media.  
14. Suite green; Spec BUILD + DL after GO + J9.

---

## 4. Architecture decisions (for India / Alpha)

### 4.1 One session per date

**API law (recommended):**

| Op | Behavior |
|----|----------|
| `POST /api/me/journal-sessions` with `journal_date` | **Get-or-create** open session for that date; if exists, return existing (200) — **or** 409 with `session_id` (pick one at J0; recommend **get-or-create** for first-send UX) |
| Second explicit "create" | Never creates a second row |
| List by date | 0 or 1 session (array of length ≤1 for back-compat) |

**Migration (India):**

1. Find all `(identity_id, journal_date)` with `COUNT(*) > 1`.  
2. For each group: choose **canonical** session = earliest `session_started_at` (or lowest id).  
3. Re-point **messages** and **attachments** to canonical (`session_id` update).  
4. Merge `structured_json`: if one non-null, keep; if two non-null **collide**, keep both under admin review table / log — **do not drop**.  
5. Re-point **tag_assignments** `object_id` to canonical; dedupe tag_ids.  
6. Delete orphan session rows after re-point.  
7. Add `UNIQUE (identity_id, journal_date)`.  
8. Emit report of collisions for Coach/India.

### 4.2 Market calendar + week bands

Band boundaries must share one function with phase derivation:

```
band(journal_date, message_at) ∈ {GX, AM, PM, CL, OFF?}
```

- **GX** — local time &lt; open  
- **AM** — open ≤ t &lt; midpoint  
- **PM** — midpoint ≤ t &lt; close  
- **CL** — t ≥ close **or** `later_day` phase  
- Weekends/holidays — **open decision §17-12**; interim default in §6 of this plan  

Ship `market_calendar_config` (or existing mig 052 table if present) with fail-loud read.

### 4.3 Week activity API

New (or extend list) endpoint, e.g.:

`GET /api/me/journal-sessions/week-activity?from=YYYY-MM-DD&to=YYYY-MM-DD`

```json
{
  "days": {
    "2026-07-28": {
      "session_id": 12,
      "bands": { "gx": true, "am": false, "pm": true, "cl": false },
      "first_message_id_by_band": { "gx": 101, "pm": 140 }
    }
  }
}
```

Dots = **member** messages only. Empty band still navigates.

### 4.4 Scroll deep-link

Day view accepts `scrollToMessageId` (state or `?m=` query). Thread `data-message-id` anchors; on load scroll into view once.

### 4.5 Media header

Reuse Family B attachment APIs; UI placement moves to session header. Cap enforcement: refuse whole multi-drop with count (server + client).

### 4.6 Trades strip

Journal **displays** fields Trade Log provides. Do not recompute expectancy. Gate R2R correctness with Hotel for defined-risk spreads.

---

## 5. Sequencing (recommended board)

```
Tag Manager COMPLETE
        │
        ▼
J0   Spec GO + §17 locks + DL + board recharter (v0.6)
        │
        ▼
J1   Schema UNIQUE + merge + get-or-create + market calendar bands
        │
        ├──► J1b  Calendar navigation §1.7 + remove DayPanel/Open
        ├──► J1c  Day surface: one session, fixed thread, timestamps, copy purge
        │
        ▼
J2   Agent (name, guardrails, RTH, once-only, tag labels) — continues substrate
        │
        ├──► J3  Admin prompt versions
        ├──► J4  Tags compact (keep list window; wire TagPicker body if needed)
        ├──► J5  Interview bar polish
        │
J6   Header media + lightbox captions + paste
J7   Retro action + complete warnings (copy)
J8   Closure honesty (409, open count)
J9   Portability + program close

Parallel after J1:
  W1  Week activity map (depends market calendar + message phase/bands)
  T1  Trades strip width/R2R (depends Trade Log §17-4b)
```

**Critical path:** J0 → J1 (unique + surface) → J1b/J1c → J2 → J8 → J9  
**Calendar path:** J1 → J1b → W1  
**Media path:** J1 → J6  

---

## 6. Phase detail

### J0 — Spec GO + freeze

| Seed | Agent | Work |
|------|-------|------|
| J0-1 | India | v0.6 integrity: unique model, merge map, Tag Manager boundary, Trade Log dependency honesty |
| J0-2 | Mike | Family B media header, caption as assertion, no public thumb URLs |
| J0-3 | Hotel | Band rules interim (§17-12), phase/midpoint, R2R correctness criteria |
| J0-4 | Tango | Copy ban list; agent name interim; no surface-explaining strings |
| J0-5 | Echo | Fixed thread layout; header strip; calendar cell affordances; no Open |
| J0-6 | Sierra | No journal leakage |
| J0-G | Delta | Spec-lock evidence |
| J0-0 | Coach | **GO** · lock §17 items 11, 12, 4b (or defer R2R), 5 (agent name) |

**Exit:** Spec **BUILD AUTHORITY** · DL entry · board `p-journal-session-v06` (or rechartered v05) · freeze product frame.

**Recommended Coach locks (defaults if silent):**

| # | Default |
|---|---------|
| 11 | **Remove** summary `DayPanel` |
| 12 | Midpoint AM/PM; weekends/holidays: four bands by **local 6h quarters of day** *or* single **OFF** column style with GX/CL only — pick midpoint + **GX/CL only for non-session days** as simpler |
| 4b | Ship times + width first; R2R when Trade Log ready (flag "pending" not fake numbers) |
| 5 | Agent display name **"Journal"** until persona GO |

---

### J1 — Schema + get-or-create

| Seed | Agent | Deliverable |
|------|-------|-------------|
| J1-1 | Alpha · India | Migration: consolidate multi-session dates; `UNIQUE (identity_id, journal_date)`; collision report |
| J1-2 | Alpha | `create_session` → get-or-create; refuse second row; tests |
| J1-3 | Alpha | Market calendar config fail-loud; band helper shared with phase |
| J1-4 | Kilo | Isolation, unique, closed 409, merge fidelity |

**Exit:** Domain enforces one conversation per date.

---

### J1b — Calendar navigation (§1.7)

| Seed | Agent | Deliverable |
|------|-------|-------------|
| J1b-1 | Charlie · Echo | Year cell → Month; Month cell → Day; Week header → Day; full cell hit target; hover/focus; keyboard |
| J1b-2 | Charlie | Remove `DayPanel` / Open button (if Coach 11) |
| J1b-3 | Kilo · Echo | Empty cells navigate; no Open in DOM grep |

---

### J1c — Day surface rewrite (§1.1–1.4 UI)

| Seed | Agent | Deliverable |
|------|-------|-------------|
| J1c-1 | Charlie · Echo | Remove entries list, New entry, Refresh, status chrome noise |
| J1c-2 | Charlie · Echo | **Fixed-height** session region: thread + pinned composer; scroll rules §1.4 |
| J1c-3 | Charlie | Visible timestamps (America/New_York display); `data-message-id` anchors |
| J1c-4 | Tango | Purge explanatory copy; agent name label |
| J1c-5 | Kilo | Layout tests: height stability 1 vs 40 msgs; scroll-stick-up |

**Exit:** Day view matches §1.1 order; empty = composer; active = header/tags + thread + composer + interview bar + trades.

---

### J2 — Agent

| Seed | Agent | Deliverable |
|------|-------|-------------|
| J2-1 | Alpha · Mike | Context: trade log + journey calibrate + **TM labels** (partially done) |
| J2-2 | Alpha | Code guardrails pre-render; once-only absences |
| J2-3 | Alpha · Hotel | RTH: no unprompted Q; answer if asked; member first |
| J2-4 | Charlie | Model down: composer unchanged (partially done) |
| J2-5 | Kilo · Hotel | Guardrail corpus + RTH + once-only |

---

### J3 — Admin prompt versions

| Seed | Agent | Deliverable |
|------|-------|-------------|
| J3-1 | Alpha · Mike | Version store; `prompt_version_id` stamp |
| J3-2 | Charlie | Admin UI + audit |
| J3-3 | Kilo | Historical sessions keep prior version |

---

### J4 — Tags (Tag Manager)

| Seed | Agent | Deliverable |
|------|-------|-------------|
| J4-1 | Charlie · Echo | Keep **compact + list window** (v0.5 law); optional TagPicker body |
| J4-2 | Charlie | Closed: read-only summary |
| J4-3 | Alpha | Closed refuse (done) |
| J4-4 | Alpha | Agent labels only (done for LLM path) |
| J4-5 | Kilo · Echo | No chip wall; isolation |

---

### J5 — Interview bar

| Seed | Agent | Deliverable |
|------|-------|-------------|
| J5-1 | Charlie · Echo | Request → panel; collapse; never on load |
| J5-2 | Alpha | structured_json on confirm only |
| J5-3 | Kilo | Tag select does not open interview |

---

### J6 — Header media (§1.4 + §10)

| Seed | Agent | Deliverable |
|------|-------|-------------|
| J6-1 | Mike · Alpha | Private media; cap; no public URL; closed refuse writes |
| J6-2 | Charlie | Header strip: thumbs, drop, click, paste-from-composer |
| J6-3 | Charlie · Echo | Lightbox: nav + caption edit |
| J6-4 | Kilo · Mike | Cap whole-drop refuse; closed read; purge/export |

---

### W1 — Week activity map (§1.6)

| Seed | Agent | Deliverable |
|------|-------|-------------|
| W1-1 | Alpha | Week activity endpoint (member dots + first message id per band) |
| W1-2 | Charlie · Echo | Week grid dots; band click → Day + scrollToMessage |
| W1-3 | Alpha | Half-day CL shift from calendar config |
| W1-4 | Kilo | Agent turns produce no dots; empty band opens day top |

---

### T1 — Trades strip (§1.5)

| Seed | Agent | Deliverable |
|------|-------|-------------|
| T1-1 | Alpha · India | Trade Log exposes width + R2R (+ entry/exit already?) |
| T1-2 | Charlie | Day trades rows show fields; no P&L aggregate framing |
| T1-3 | Hotel | R2R correctness for defined-risk spreads |
| T1-4 | Kilo | Grep: no win rate / expectancy on strip |

*If §17-4b deferred: ship times + available width; omit R2R rather than invent.*

---

### J7 — Retrospective action

| Seed | Agent | Deliverable |
|------|-------|-------------|
| J7-1 | Alpha · Charlie | Dedicated control (exists); mid-convo leave open + dual link |
| J7-2 | Charlie · Tango | Gather + complete warning: dates named + open session count |
| J7-3 | Kilo | No auto-gather; leave open |

---

### J8 — Closure

| Seed | Agent | Deliverable |
|------|-------|-------------|
| J8-1 | Alpha · India | Scope-true close; tags/messages/media/structure refuse |
| J8-2 | Charlie · Tango | Complete warning honesty |
| J8-3 | Kilo · Delta | 409 + link; permanent; is_demo |

---

### J9 — Portability + close

| Seed | Agent | Deliverable |
|------|-------|-------------|
| J9-1 | Alpha · India | Export Spec bump: one session/date, tags, media |
| J9-2 | Alpha | Purge sessions + assignments + media |
| J9-3 | Kilo | Full suite + surface greps (Open button, Interviewer, explainer strings) |
| J9-G | Delta | Program PASS |
| J9-L | Lima | DL; Spec as-built honesty |

---

## 7. Keep / kill audit (v0.6)

| Keep | Kill / replace |
|------|----------------|
| Tag Manager assignments + closed 409 | Multi-entry day list / New entry / Refresh |
| First-send composer path | "Interviewer" label · explanatory surface copy |
| Interview collapse bar | DayPanel **Open** button (if Coach 11) |
| `JournalTagsControl` list window | Always-on tag chip wall |
| Message/attachment tables | Second session row per date |
| Week band shell | Empty non-interactive bands |
| Date closures + retro complete | Member seal as lifecycle |
| Agent plain-text degrade | Dual free-text Write path (already removed) |

---

## 8. Verification map (Spec §15 + v0.6)

| Area | Owner | Evidence |
|------|-------|----------|
| One session per date | Kilo · India | Unique constraint + create twice → one row |
| Fixed thread height | Kilo · Echo | 1 vs 40 messages: page height stable; composer in view |
| Timestamps visible | Kilo | No hover-only timestamps |
| No Open / no entry chrome | Kilo | DOM/grep |
| Calendar nav matrix | Kilo · Echo | Year→Month→Day; empty cell opens |
| Week dots + band scroll | Kilo | Member-only; scroll to message |
| Header media + lightbox | Kilo · Mike | Cap refuse; closed read; no public URL |
| Trades strip | Kilo · Hotel | Width/R2R/times; no expectancy |
| Tags | Kilo · Mike | Assign-only; closed 409 |
| Agent | Kilo · Hotel | Guardrails; member first; labels context-only |
| Closure / export | Kilo · Alpha | 409; purge |

---

## 9. Effort & dependency sketch

| Stream | Relative effort | Blocked by |
|--------|-----------------|------------|
| J0 GO + hygiene | S | Coach |
| J1 merge + unique | M–L | India merge policy |
| J1c fixed thread + copy | M | Echo layout tokens |
| J1b calendar nav | S–M | Coach 11 |
| W1 week map | M | J1 calendar bands |
| J6 header media | M–L | Attachment APIs ok |
| T1 trades strip | M | Trade Log R2R (4b) |
| J2 agent polish | M | Hotel corpus |
| J3 prompt versions | M | Coach 6 |
| J7–J9 | M | Existing substrate |

---

## 10. Relationship to in-flight v0.5 work

Do **not** throw away:

- `JournalTagsControl`, first-send, interview bar, closed tag 409, agent label context, plain-text degrade  

Do **stop** expanding multi-entry UX. Treat current "Entries this day / New entry" as **technical debt** to delete in J1c on day one of v0.6 build.

Board options after GO:

1. **Preferred:** new `agents/p-journal-session-v06/` with seeds from this plan; archive v05 board as substrate notes.  
2. **Alt:** recharter `p-journal-session-v05` → v0.6 product frame and rewrite ORCHESTRATOR.

---

## 11. Suggested Coach GO statement (draft)

> **Journal Session v0.6 — one conversation per date; calendar is the control.**  
> The Journal remains a chatbot. Exactly one session per member date (`UNIQUE`); multi-entry chrome is gone. Thread is a fixed scrollable session with visible timestamps; media lives in the header; Week bands show when the member wrote and deep-link into the transcript. Calendar cells navigate directly — no Open button. Tag Manager v0.3 remains vocabulary SoR (compact assign UI). Retrospective action and scope-true seal unchanged. Supersedes Session Spec v0.5 multi-entry frame. Family B isolation and no profit claims unchanged.

---

## 12. Immediate next steps (before code)

1. Coach reviews this plan + Spec v0.6.  
2. Spec hygiene: §18 v0.6 text, history row, dedupe §1.4, restore compact-tags sentence, status → BUILD on GO.  
3. Lock §17 items **11, 12, 5** (and **4b** ship/defer).  
4. India writes merge migration design note (collision cases).  
5. Juliet seeds `p-journal-session-v06` from §6.  
6. **No J1+ code until GO** (doctrine). Substrate may freeze; no multi-entry expansions.

---

## 13. Document history

| Date | Note |
|------|------|
| 2026-07-30 | Initial evaluation + plan against Spec v0.6 DRAFT and partial v0.5 substrate |
