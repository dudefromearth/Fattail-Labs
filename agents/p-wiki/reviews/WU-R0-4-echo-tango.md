# WU-R0-4 Echo + Tango — Wiki Spec v0.2.1 (launcher + window)

**Agents:** Echo (HIG / control grammar) · Tango (member psychology)  
**Spec:** `Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md` I.1, III.3, III.4  
**Prior:** `reviews/R0-3-echo-tango.md` (Wiki Agent v0.1.2; WA-4 UI deferred)  
**Date:** 2026-08-23  
**Spec not modified.**  
**Verdict:** **NO BLOCK** on the spec. **BLOCKING for WU-1 implementation**
if the launcher is member-visible or if AppChrome is touched without
three-OK. Chrome ruling is **blank** this packet — no pixels.

---

## Prominence without member-facing noise

**Echo:** Standing presence (I.1) is an **admin** affordance. Help Concierge
already occupies lower-right (`HelpLauncher`, emerald FAB, members). Wiki
must not clone that control: different corner or density, sentence-case
“Wiki agent” (R0-3), not “Help”, not “Compile this”. House tokens, not
ad-hoc emerald.

**Tango:** Members must never see this. A member-visible “ask the wiki to
write a page about your trades” is capacity-over-dependency **and** Family B
risk — **BLOCKING if it ships to members**. Unauthenticated visitors: no
node in the DOM.

WA-4 already shipped `WikiAgentPanel` on wiki layout (`useIsAdmin`, start
false). That pattern (in-place-admin, no flash) is the visibility law to
reuse.

## Message window

**Echo:** Multi-turn chat, free text, stay-put. Propose-and-dispose: agent
proposals in-window **execute nothing** until Coach acts. Explicit Seal.
Do not auto-seal on route change (R0-3 advisory, still stands).

**Tango copy (admin-only; R0-3 carried):**

| Surface | String |
|---------|--------|
| Title | “Wiki agent” |
| Opening | Cite `{surface, route, entity}`, then wait. No “How can I help you today?” |
| Draft raised | “Draft on the board — you still approve.” Never “Published.” |
| Failed | Named state, not a dead spinner |

No streaks, no “pages compiled this week.”

## Two orbs

**Echo ADVISORY (plan O1):** If ruling **(A)** puts a launcher on AppChrome
beside Help, **retire** the wiki-layout FAB. If ruling **(B)** keeps
wiki-owned only, **keep** `WikiAgentPanel`. Do not ship both.

## Chrome

Help mounts in frozen `AppChrome.tsx` lines 16, 35–39. Echo will not sketch
`/app/*` placement until Coach fills the chrome ruling. **BLOCKING
(implementation):** new host control on AppChrome or `web/app/layout.tsx`
without DL-539 three-OK.

## Bench delta

Visibility split vs Help is the WU-1 design invariant. Panel copy from R0-3
still applies; members never get this window.
