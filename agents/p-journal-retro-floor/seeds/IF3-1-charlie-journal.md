# Seed IF3-1 — Charlie Journal surface

**Agent:** Charlie  
**Depends on:** IF1-G PASS  

---

## Intent

Implement Echo’s packet on the Journal thread + composer. Do not invent chrome.

## Files

- `web/components/journal/SessionInterviewChat.tsx`  
- `web/components/journal/JournalCalendar.tsx`  
- Only additional files **named in** `echo-visual-law.md`  

## Out of scope

`web/lib/journalBeats.ts` (never comes back). Retro workspace (IF4). Conversation Lab. Calendar product rewrite.

## Invariants

§6.3. Doctrine §12. Session v0.6 §1 (scrollable session, composer pinned). If the packet is hard, STOP.

## Completion

- [ ] Composer matches Echo grammar vs ref1  
- [ ] Bubbles match Echo grammar vs ref2  
- [ ] No unexplained new tokens  

## Gate

Handoff Echo IF3-2 → Kilo IF3-3 → IF3-G
