# R0-3 Echo + Tango — Wiki Agent Spec v0.1.2 (session surface + strings)

**Agents:** Echo (HIG / control grammar), Tango (member psychology / honesty)  
**Spec:** `Specs/FatTail-Labs-Wiki-Agent-Spec-v0_1_2.md` §3.4, §7, OD-6, WA7–WA8  
**Date:** 2026-08-23  
**Verdict:** **NO BLOCK** on the spec. **WA-4 UI is deferred** pending Coach chrome ruling (OD-6 + DL-539 three-OK or narrowed routes). Spec not modified.

---

## Chrome ruling — deferred explicitly

OD-6 proposal: floating affordance in **host chrome** on every `/app/*`, multi-turn chat, free text, context-seeded.

That control lives in **AppChrome**. Plan v0.1.2 B3: frozen tree without three successive OKs, or Coach narrows to `/app/wiki` + `/admin`.

**Echo:** We will not invent a second floating button beside Help Concierge, and we will not sketch `/app/*` placement in this review. **WA-4 UI notes are deferred** until Coach fills the stamp-sheet chrome blank. When un-deferred, Echo’s packet is: one control grammar, reuse Help overlay / sheet pattern (`Specs/FatTail-Labs-Help-System-Architecture-v0.1.md` §3.2), house tokens, no ad-hoc “agent orb.”

**Tango:** Members must never see this affordance. Spec is admin-directed. A member-visible “ask the wiki to write a page about your trades” is a **capacity-over-dependency** and Family B leak risk — **BLOCKING if it ships to members**. Not implied by the spec as written (admin session cookie).

---

## Implied strings (review now; copy-final at WA-4)

Spec does not ship member `/app/wiki` reading-experience copy (§7). Strings below are **admin / board / error** surfaces the spec implies.

| Surface | Implied string / behavior | Echo | Tango |
|---------|---------------------------|------|-------|
| Session open | Agent’s first turn must show it knows `{surface, route, entity}` (WA7) | Lead with one calm context line, then wait. No “How can I help you today?” generic chrome. | No “I’ll write you an edge.” Process: “This is Strategy Lab / this route. What should the wiki page cover?” |
| Session panel title | “Wiki agent” / not “IKI compiler” | Sentence case. Not a launcher leftover. | Not “Compile this into Wiki” (removed affordance, DL-545/547). |
| Draft raised | Board card exists; admin still must approve (WA8/W5) | Stay-put: don’t navigate the member wiki under them. | Never “Published.” “Draft on the board — you still approve.” |
| `failed` / `failed-partial` | Ledger + board | Named state, not a spinner that dies. | Honest: the agent could not finish; nothing silent. |
| Rejected contract | Actionable schema/principal error (WA2) | Operator tone, not member marketing. | No blame theater. |
| Member wiki | Untouched | Do not add session chrome to the article rail. | Empty Related/practice remain hide-when-empty (S0). |
| Template page (WA-5) | “How it fits FatTail Labs” | — | **Hotel** owns claims; Tango: no profit, no “this template makes money.” |

**ADVISORY:** Session close control must be explicit (“Seal and send to board” vs abandon). Spec seals at close; don’t auto-seal on route change without a prompt (stay-put / accidental loss).

**ADVISORY:** No streaks, “pages compiled this week” gamification on the admin panel (Tango invariant 1).

---

## BLOCKING vs ADVISORY

| Severity | Finding |
|----------|---------|
| **BLOCKING (implementation, not spec)** | Affordance visible to non-admin members. |
| **BLOCKING (implementation)** | New host control on `/app/*` without three-OK or narrowed routes. |
| **BLOCKING (implementation)** | Reintroducing CompileLauncher / compile-inbox on wiki. |
| **ADVISORY** | Defer all pixel/layout work to WA-4 after chrome stamp. |
| **ADVISORY** | Reuse Help overlay grammar when chrome is allowed. |

---

## Bench delta

WA-4 is two stamps: (1) session **API** (open/accrete/seal) can be wiki-side; (2) **pixels** wait on chrome. Members never get this panel.
