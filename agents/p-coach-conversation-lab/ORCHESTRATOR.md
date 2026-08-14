# ORCHESTRATOR — Coach Conversation Lab v0.1

**Juliet** owns this board. Specialists fire only from seeds.

**Plan:** [`docs/Coach-Conversation-Lab-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Coach-Conversation-Lab-Full-Agent-Bench-Plan-v1.0.md) **v1.1**

## Status (2026-08-13)

| Gate | Verdict |
|------|---------|
| **CL-0** Lima DL + spec BUILD | **DONE** — paper only (DL-327) |
| CL-1…CL-4 + CL-G **code** | **REVERTED** (`7864d54`…`00c3f2e`) — solo ship failed G4; product restored |
| CL-1 ConversationSurface | **blocked on Echo token lock** — do not implement until Echo writes it |
| CL-2 Schema + enable flag | blocked on Echo + India (already signed at CL-0-2) |
| CL-3 Proxy + persist + export | blocked on CL-2 |
| CL-4 Lab page | blocked on CL-1 + CL-3 |
| **CL-G** Charter | not open |

**Law:** Juliet does not execute packets. Echo side-by-side vs `docs/references/coach-lab-imessage-reference.jpg` is a hard gate before Charlie. Kilo/Delta before any “landed” claim.

**Not this board’s GO:** CL-V voice · Journal remount.

## DAG

```
CL-0 ✓ ──┬──► CL-1 surface (visual) ──┐
            └──► CL-2 schema ──► CL-3 ───┴──► CL-4 lab page ──► CL-G
```

## Sequencing law

1. No lab routes until **CL-0** (BUILD + DL).
2. **CL-1 may use fixture messages** — do not block the still on the proxy.
3. Chat body is `{ text }` only. Server-held transcript is the SoR.
4. Arrival greeting only via **`POST /greet`** (B-CL1). Idempotent. Page load must not empty-`/chat` or `/reset` to talk first.
5. Husk-reset: zero trader turns → discard, not archive.
6. Visual fail = semibold bubbles, Labs-chrome thread, or a stretched full-width pane.
7. `SessionInterviewChat` is untouched. This GO is not a remount.

## Parents

Journal v0.7 board [`../p-journal-session-v07/`](../p-journal-session-v07/) is **not**
substrate for this surface. Do not import it.
