# C0-2 — Tango member experience

**Agent:** Tango  
**Date:** 2026-08-06  
**Depends on:** C0-0 PASS · Spec v1.0.2 · DL-240 · Mike C0-3 (connect path)  
**Persona:** Bleeding trader — short on trust, time, and capital; allergic to hustle theater  
**Verdict:** **APPROVED** (build direction) — copy deltas binding for Charlie at implement

---

## 1. Walkthrough (persona)

### 1.1 Lands on `/app/community` first time (entitled, Discord already on fattail.ai)

**Hope:** “Same room as FatTail AI Discord, not a second club.”  
**Spec:** Second-window thesis §1.2 · name from fattail.ai · shelves beside chat.  
**Tango:** Good. Cognitive load stays low if UI says **one conversation**, not “join our Labs community.”  
**Copy risk:** Calling it “Labs Community” is fine as product name; body copy must not imply a **separate** social graph.

### 1.2 Entitled, Discord **not** linked (A1 — highest-friction cohort, often Observer)

**Hope:** Read the room without being punished; clear next step.  
**Spec:** Lurk if entitled; post blocked; CTA → **fattail.ai** connector (§6.9 · §8.3).  
**Tango:** **APPROVED** — capacity over dependency: reading peers/process without forced social bind.  
**Shame test:** Must not read as “you’re incomplete” or “finish onboarding to belong.”

### 1.3 Posts from Labs (bridge)

**Hope:** Peers see me as me.  
**Spec:** Discord name + honest “via Labs” if bot/webhook path (§6.2).  
**Tango:** **APPROVED** — silent impersonation would break trust twice (industry + us).  
**Honest limit (A2):** Member may not edit/delete their Labs-origin line from Discord client — one calm line of UX, not a bug report tone.

### 1.4 Sees a message “disappear” after admin Hold

**Hope:** Not gaslit.  
**Spec:** Hold = Labs UI only; Discord still has it (§6.8).  
**Tango:** **APPROVED** if admin chrome and any member-facing empty state never say “removed” / “deleted from Discord.”

### 1.5 Bot shelves

**Hope:** Designs that teach process, not P&L flex.  
**Spec:** No P&L on cards §7.2 · hub blurb “No P&L theater” §3 · house provenance A4 §6.10 · Apply → Design only (no one-click live Deploy).  
**Tango:** **APPROVED** — process pathway, not social trading porn. Provenance reduces “which house fork is real?” confusion without ranking people.

### 1.6 Lapsed / Alumni (no Discord entitled)

**Hope:** Not humiliated at the door.  
**Spec:** Tier matrix §8.2; members-only board default §16.  
**Tango:** Empty/deny states for chat must be **matter-of-fact** (access ended), not upsell theater. Shelves: follow existing app-gate norms; do not invent profit-led rejoin copy.

---

## 2. Seed checklist

| # | Item | Verdict | Notes |
|---|------|---------|-------|
| 1 | Connect CTA → fattail.ai, not Labs OAuth; not shamey | **PASS** | Spec §6.9 · §8.0 · Mike C0-3 connect URL |
| 2 | Lurk-without-link if entitled | **PASS** | §6.3 · §6.9 |
| 3 | Hold ≠ Discord removal copy | **PASS** | §6.8 laws 2–3 |
| 4 | “via Labs” attribution | **PASS** | §6.2 |
| 5 | Shelves: process only, no profit claims | **PASS** | §3 blurb · §7.2 · §11.4–5 · acceptance #14 |
| 6 | House provenance on forks (A4) | **PASS** | §6.10 |

**No invariant violations.** No RETURN for capacity/dependency, profit claims, or humiliation in the Spec as written.

---

## 3. Binding copy deltas (Charlie — implement; not Spec RETURN)

Use or adapt; do not invent “softer” profit language.

### 3.1 Connect Discord (composer blocked)

| Element | Copy (recommended) |
|---------|-------------------|
| Title | **Connect Discord to post** |
| Body | You’re reading the same conversation as the **FatTail AI** Discord. To post here, connect Discord on **fattail.ai** — we use the name you already have there. |
| Primary CTA | **Connect on fattail.ai** → `LABS_DISCORD_CONNECT_URL` |
| Secondary | **Keep reading** (dismiss / stay in lurk) |
| Forbidden | “Complete your profile” · “Unlock the community” · “Don’t miss out” · fake Labs “Authorize Discord” OAuth |

### 3.2 Unlinked Discord author in stream (A3)

| Element | Copy |
|---------|------|
| Name line | Discord display name only |
| Affordance | No Labs profile chip |
| Tooltip (optional) | Not linked to a Labs account |

### 3.3 “via Labs” (send / mirror)

| Element | Copy |
|---------|------|
| Badge | **via Labs** (adjacent to author name) |
| Helper (first send, once) | Messages from Labs may show as **via Labs** in Discord. You might not be able to edit them from the Discord app — that’s the bridge, not a bug. |
| Forbidden | Pretending the message was typed natively in Discord with no label |

### 3.4 Labs Hold (admin + any member-visible residual)

| Element | Copy |
|---------|------|
| Admin action label | **Hold in Labs** (not “Delete” / “Remove from Discord”) |
| Confirm | Hides this message in the Labs second window only. It remains in Discord unless a moderator removes it there. |
| Forbidden | “Message deleted” without Labs-only qualifier |

### 3.5 Bot shelves / empty states

| Element | Copy direction |
|---------|----------------|
| Hub card blurb | Keep Spec §3: process peers + shared designs; **No P&L theater** |
| FatTail shelf empty (shouldn’t happen) | House designs load from FatTail catalog — try refresh; no P&L tease |
| Member shares empty | No member designs published yet. Apply a FatTail house design in Strategy Lab when you’re ready. |
| Share card fields | Name, process summary, phase, pack, house key@version / provenance — **never** P&L, ROI, win rate, “made X%” |
| Apply CTA | **Apply to Design** / **Copy & rebuild** — never “Deploy live now” from Community |
| Provenance line | Based on **{house name} v{n}** · Copy & rebuild |

### 3.6 Entitlement / chat denied (lapsed)

| Element | Copy direction |
|---------|----------------|
| Board | Community chat is for active Discord-included memberships. |
| Forbidden | Shame (“you left”), FOMO counters, profit-led rejoin |

---

## 4. Capacity notes (non-blocking)

| Pattern | Tango position |
|---------|----------------|
| Lurk-first | **Protect** — Observer can learn tone without performative posting |
| Bot shelf + chat side-by-side | OK if shelves are **tools**, not leaderboards |
| Social comparison | No member rankings, streak boards, or “top bots by P&L” in v1 |
| Journey/Wiki channels omitted | **Correct** — personal growth surfaces stay unbundled from public chat |

---

## 5. Flagged ideas

| Idea | Status |
|------|--------|
| Featured/curated share tier (A4 scale) | **FLAGGED** deferred — good when shelf noise grows; not v1 |
| Labs profile link from Discord name | Deferred Spec — optional later; don’t force identity merge UX in v1 |

Inventory otherwise intact.

---

## 6. Bench delta

1. **Connect CTA pattern:** external fattail.ai connect + lurk secondary — shame language is a ship blocker at UI review.  
2. **Hold naming:** “Hold in Labs” is the trust-preserving admin verb.  
3. **Bridge honesty:** “via Labs” + one-line edit limitation prevents support-shaped distrust.

---

## 7. Verdict

**APPROVED** for member experience on Community Spec v1.0.2.

Charlie implements §3 copy deltas; Echo may refine density/tokens without softening honesty.  
Tango re-reviews member-facing strings at C1a/C1c UI seeds if copy diverges.
