# Journal + Retro Interface Floor — Full Agent Bench Plan v1.0

**Date:** 2026-08-14  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship / visual judge)  
**Board:** [`agents/p-journal-retro-floor/`](../agents/p-journal-retro-floor/)  
**Governance:** doctrine (incl. **§12** · DL-334) · first-principles · spec-create-review-workflow · execution display (banners every step)

| Law | Path |
|-----|------|
| Retrospective Spec | `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.7.1.md` (**§6.3** interface floor) |
| Journal Session parent | `Specs/FatTail-Labs-Journal-Session-Spec-v0.6.md` (§1 screen: thread + composer) |
| Human Interface | `Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md` |
| Floor images | `Specs/references/journal-retro-v0.7.1/ref1.png` (composer) · `ref2.jpg` (thread) |
| Prior ceremony program | `agents/p-retrospective-v07/` — **PROGRAM COMPLETE** (DL-163 / DL-164). This plan does **not** re-run R0–R9. |

This is the **executable multi-agent plan**. Specialists run **seeds only**. Juliet **never executes packets**. Coordination only through **Coach** or **Juliet**. Delta: **PASS / FAIL / BLOCKED** — never waived.

**Hard stop:** No Charlie/Alpha implementation until **IF0 Coach GO** (accept §6.3 + this plan). No Journal/Retro UI until **IF1 Echo visual-law packet** exists.

---

## 0. Mission

Ship Journal + Retrospective **to the interface floor**, without substituting bench taste (doctrine **§12**).

The ceremony program already shipped. What failed last time was **craft**: the surface did not meet the references. This program exists so the next ship is the vision, not an easier version.

| Floor | Meaning | Judge |
|-------|---------|--------|
| **Look** | Apple HIG sophistication (craft, restraint, depth, motion) + pixel-for-pixel intent vs **ref1** (composer) and **ref2** (bubbles). Compromise look = FAIL even if code works. | Echo gates; **Coach is the judge** (side-by-side) |
| **In use** | Claude Desktop intelligence: context, anticipate next action, grow with input, controls where the work is. “Does it feel like it’s thinking with you?” | Echo + Coach **in use** |
| **Compile** | Retro does not re-ask the week. Gather emits `journal_compile`; the write is **the fix** (`one_thing_md`). Spec §5.3 · DL-333 | India / Alpha / Charlie |

**Both look and in-use are the floor.**

---

## 1. Full bench roster

### 1.1 Authority & orchestration

| Callsign | Role | Authority |
|----------|------|-----------|
| **Coach** | Vision, §6.3 accept, side-by-side judge, ship/no-ship | Final |
| **Juliet** | This plan, board, seeds, banners, sequencing | Plans only — **never executes** |
| **India** | Spec/parent alignment, Family B, no second store, compile vs ceremony | Architecture veto |

### 1.2 Platform

| Callsign | Role |
|----------|------|
| **Echo** | Visual law packet; HIG + refs; in-use intelligence; **blocks** compromise UI |
| **Charlie** | Implements Echo’s packet only — Journal thread/composer, Retro workspace |
| **Alpha** | `journal_compile`, `one_thing_md`, gather/serialize/PATCH, mig 126 |
| **Mike** | Family B isolation unchanged; no new public leakage |
| **Foxtrot** | Deploy **only** if Coach names MiniTwo |
| **Sierra** | No marketing / profit-claim leakage from journal words |

### 1.3 Quality, member, trading

| Callsign | Role |
|----------|------|
| **Delta** | Gates IF0-G … IF7-G |
| **Kilo** | Characterization, isolation (A never sees B), `filterwarnings=error` suite |
| **Lima** | DL for program GO + as-built; spec status honesty |
| **Tango** | Warmth/invite without chrome-explaining copy; no profit claims |
| **Hotel** | Compile buckets stay process words, not P&L theater |

### 1.4 Lineage (when copy or framing is in play)

| Callsign | When |
|----------|------|
| **Victor** | Via negativa — do not decorate the ceremony |
| **Whiskey** | No P&L theater in compile or book-last |
| **Yankee** | Small-N honesty if compile is empty |

### 1.5 Not seated

Golf · content studio · Conversation Lab (STOPPED).

---

## 2. Sacred invariants

1. Doctrine **§12** — vision is Coach’s; craft and efficiency serve it; hard → **STOP and tell Coach**; never quietly build less.  
2. Doctrine **§11** — Coach text in §6.3 stays; objections labeled.  
3. Family B isolation — member A never sees member B (journal, retro, export).  
4. No profit claims. No second progress store.  
5. **journalBeats.ts never comes back** as the product conversation. Soft beats stay out of this program.  
6. Conversation Lab remains **STOPPED**.  
7. Standalone repo. Fail loud. Evidence over assertion.  
8. Echo **before** Charlie on any visual surface. Charlie does not invent chrome.  
9. MiniTwo / production **not** in this program unless a GO names MiniTwo.  
10. Suite: characterization green + **zero warnings** (`server/pytest.ini`).

---

## 3. Substrate (keep / kill)

### Keep

| Asset | Path |
|-------|------|
| Ceremony program as-built | `p-retrospective-v07` R0–R9 |
| Journal session APIs | `routes/journal_sessions.py`, `journal_session_domain.py` |
| Thread + composer as-built | `SessionInterviewChat.tsx`, `JournalCalendar.tsx` |
| Retro workspace / API | `RetrospectiveWorkspace.tsx`, `routes/retrospectives.py` |
| Compile helpers (StudioTwo uncommitted) | `build_journal_compile`, mig **126**, §5.3 |
| Floor images | `Specs/references/journal-retro-v0.7.1/` |

### Kill / do not revive

| Kill | Why |
|------|-----|
| “Good enough” thinner bubbles / flatter composer | §6.3 FAIL |
| Re-asking the four questions in Retro | §5.3 |
| journalBeats as conversation | Coach lock |
| Conversation Lab / ConversationSurface | STOPPED |
| Solo implement without seeds/gates | Last failure class |

---

## 4. Phase graph

```
IF0  Coach GO · §6.3 accept · India parents · Lima DL · Delta
 │
 ▼
IF1  Echo visual-law packet (HIG + ref1 + ref2 + motion + intelligence)
 │    Charlie BLOCKED until this packet exists
 ▼
IF2  Alpha compile residual (mig 126 · gather · PATCH one_thing · Kilo)
 │    may run in parallel with IF1 (no UI)
 ▼
IF3  Charlie Journal thread + composer  → Echo review → Kilo → Delta
 │
 ▼
IF4  Charlie Retro workspace (compile + fix + ceremony chrome to floor)
 │    → Echo review → Kilo → Delta
 ▼
IF5  Tango copy (warmth; no chrome-explaining strings)
 │
 ▼
IF6  Echo side-by-side + in-use  → Coach judge  → Delta
 │
 ▼
IF7  Full suite 0 warnings · isolation · Lima as-built · Delta program PASS
```

**Critical path:** `IF0 → IF1 → IF3 → IF4 → IF6 → IF7`  
**Parallel after IF0:** IF2 (API only).  
**IF5** after IF3/IF4 copy exists; before IF6.

**Display:** Juliet posts the board. Every seed opens with a seat banner. Deviation → **STOP and ask Coach**.

---

## 5. Phase packets

### IF0 — Lock

**Seats:** Coach · India · Lima · Delta  

| Seed | Seat | Deliverable |
|------|------|-------------|
| IF0-0 | Coach | Accept §6.3 as written (or mark objections). Accept this plan. |
| IF0-1 | India | Parents: Session v0.6 §1, Retro v0.7.1 §5.3/§6/§6.3, HI Spec; Family B; no second store. APPROVED / RETURNED. |
| IF0-2 | Lima | DL: program GO. Spec header: §6.3 accepted if Coach said so. |
| IF0-G | Delta | Evidence: Coach accept, India verdict, DL exists. |

**Out:** code, UI, MiniTwo.

### IF1 — Echo visual law

**Seat:** Echo (then Delta)  

Packet Charlie can implement without inventing:

1. Composer grammar vs **ref1** (grow-with-input, + attach, send, voice, type hierarchy).  
2. Bubble grammar vs **ref2** (incoming/outgoing weight, radius, type, timestamps, arrival).  
3. Token map (color, type, radius, elevation, motion) — Labs tokens, not ad-hoc hex.  
4. Motion: message arriving; composer focus; not decorative bounce.  
5. Intelligence notes: context, next action, controls at the work.  
6. What is **hard** — named to Coach, not silently dropped.

**Files (Echo writes, not Charlie):** `agents/p-journal-retro-floor/echo-visual-law.md` (or HI Spec addendum).  
**Gate:** IF1-G — packet exists; refs cited; HIG cited; hard items listed or none.

### IF2 — Compile residual (API)

**Seats:** Alpha · Kilo · Delta  

Declare before touch. Likely files:

- `migrations/126_retrospective_one_thing.sql`  
- `server/retrospective_domain.py` (`build_journal_compile`)  
- `server/routes/retrospectives.py`  
- `server/tests/test_retrospectives.py`  
- `web/lib/retrospectiveApi.ts` (types only)

**Out:** Journal UI, journalBeats, MiniTwo, ceremony rewrite.  
**Gate:** IF2-G — tests for compile + PATCH; isolation; column exists on StudioTwo.

### IF3 — Journal surface

**Seats:** Charlie · Echo · Kilo · Delta  

Charlie implements **only** IF1 law on:

- `web/components/journal/SessionInterviewChat.tsx`  
- `web/components/journal/JournalCalendar.tsx` (composer empty + active)  
- related composer/send/voice only if IF1 names them  

**Out:** Retro workspace (IF4), journalBeats revival, calendar rewrite, Conversation Lab.  
**Handoff:** Charlie → Echo review (banner) → Kilo → Delta IF3-G.

### IF4 — Retro surface

**Seats:** Charlie · Echo · Kilo · Delta  

- `web/components/retrospective/RetrospectiveWorkspace.tsx`  
- `web/components/retrospective/RetroPeriodWindow.tsx`  
- Compile block + one-thing field to floor (not a second form)  
- Ceremony chrome to same HIG/intelligence floor  

**Out:** Re-asking the week; journalBeats; MiniTwo.  
**Gate:** IF4-G.

### IF5 — Tango

Member strings: warmth, invite, no “this conversation is the journal” chrome-explainers (Session §1.3). No profit claims.  
**Gate:** IF5-G.

### IF6 — Visual + in-use (Coach judge)

Echo: side-by-side vs ref1/ref2 + HIG. In-use walk. **Coach judges.** FAIL = no ship.  
**Gate:** IF6-G — Coach verdict on record.

### IF7 — Close

Kilo: `pytest tests -q` — 0 failed, 0 warnings; isolation journal/trade-log/privacy/export.  
Lima: as-built spec honesty; DL close.  
Delta: **PROGRAM PASS**.

---

## 6. Seed law

Each seed states: project, seat, sequence, files, **out of scope**, invariants (§2), completion (verifiable), gate it feeds. If it cannot run from cold, it is not finished.

Juliet writes seeds. Specialists do not start without a seed **and** Coach/Juliet GO for that phase.

---

## 7. Display law (loud)

Before any phase: Juliet shows the board (this §4 graph + status).  

Every step:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ STEP n of N
■ SEAT: <CALLSIGN> — <role>
■ TASK: <one sentence>
■ SCOPE: <paths>
■ OUT: <will not touch>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Close with evidence + handoff. Deviation: `⛔ STOPPING — AWAITING COACH.`

---

## 8. Ideas inventory (doctrine §11)

| Idea | Status |
|------|--------|
| §6.3 interface floor (Coach 2026-08-14, both paragraphs) | **IN-SCOPE** (IF0 accept) |
| Apple HIG + Claude Desktop intelligence | **IN-SCOPE** |
| §5.3 compile / one_thing | **IN-SCOPE** |
| Doctrine §12 | **IN-SCOPE** (all seats) |
| journalBeats as conversation | **OUT** — never comes back |
| Conversation Lab | **OUT** — STOPPED |
| MiniTwo deploy | **DEFERRED** until Coach names MiniTwo |
| Cost-of-deviation (Retro §20 #8) | **DEFERRED** (prior lock) |

Nothing of Coach’s from §6.3 is parked.

---

## 9. Recommended Coach locks at IF0

1. Accept **§6.3** (both Coach paragraphs) as law.  
2. Accept **this plan v1.0** as the only execution sequence.  
3. Echo packet **before** Charlie.  
4. Coach is the **side-by-side and in-use judge** (IF6).  
5. **journalBeats.ts** never returns as the conversation.  
6. StudioTwo only until a later GO names MiniTwo.

---

## 10. What Juliet will not do

- Execute Alpha/Charlie/Echo packets.  
- Combine IF3–IF6 into a solo ship.  
- Restart MiniTwo.  
- Start Conversation Lab.  
- Quietly thin the references.

---

**Next:** Coach IF0-0 — accept §6.3 + this plan, or return it. No implementation until that GO.
