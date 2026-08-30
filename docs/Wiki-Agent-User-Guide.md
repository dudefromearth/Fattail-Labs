# Wiki agent — User Guide (administrators)

**Where:** lower right of every Labs page, immediately **left of Help**  
**Help (concierge):** `server/help_reference/wiki-agent.md`  
**Spec:** `Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md` I.1 · III.3 · **DL-573**

The Wiki agent is standing presence for **administrators**. Members never see
it. It captures finished pages and session direction. It does not publish.
You still approve every draft.

---

## Who and where

- Role: **administrator** only. Anyone else: the button is not in the DOM.
- Look: zinc pill, sentence-case **Wiki agent** — not Help’s emerald control.
- Place: lower right, **left of Help**. On `/admin/*` Help is hidden; the
  agent stays lower right.
- Scope: the **entire FatTail app plane** (Apps, Wiki, Options Lab, Trade
  Log, courses, admin, …). One orb. The old IKI-only lower-left pill is gone.

## Open

Click **Wiki agent**. Close with **×**. Surface and route come from the page
you are on. Unregistered screens are valid (route only).

## Hand off

Finished, publishable material only. Paste the page and one line of intent.
Delivery point — nothing is queued in the window. Thin copy or a profit
claim does not become a page (named reason, not a silent miss).

## Session

1. **Open session** — first turn cites context, then waits.
2. **Send** — proposals stay in the window; they execute nothing.
3. **Draft to board** — git `status: draft` + board `awaiting_approval`.
   Copy: “Draft on the board — you still approve.” Never “Published.”
4. **Seal session** — transcript freezes. Follow-on is a new session.

## Drain queued revisions

Pulls the next linkage-queue items onto the board. You still approve. Not a
publish button.

## After a draft lands

Publish is a human act on the board / in git. Members see the page after the
wiki host pulls and reindexes.

## What it will not do

Publish · invent a profit story · appear for members · clone Help · replace
the reader Wiki (`/app/wiki`).
