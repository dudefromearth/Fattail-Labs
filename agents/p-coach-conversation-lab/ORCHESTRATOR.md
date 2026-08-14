# ORCHESTRATOR — Coach Conversation Lab v0.1

**Juliet** owns this board. Specialists fire only from seeds.

**Plan:** [`docs/Coach-Conversation-Lab-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Coach-Conversation-Lab-Full-Agent-Bench-Plan-v1.0.md) **v1.1**

## Status (2026-08-13)

| Gate | Verdict |
|------|---------|
| **CL-0** Lima DL + spec BUILD | **DONE** — DL-327 · spec `v0_1.md` BUILD |
| CL-1 ConversationSurface (visual) | **landed** |
| CL-2 Schema + enable flag | **landed** (migration 128) |
| CL-3 Proxy + persist + export | **landed** (`POST /greet` · husk-reset · 17 tests) |
| CL-4 Lab page | **landed** `/admin/coach-lab` |
| **CL-G** Charter | **NEXT** — Coach feel-test remaining |

**Not this board’s GO:** CL-V voice · Journal remount.

## DAG

```
CL-0 ✓ ──┬──► CL-1 ✓ ──┐
            └──► CL-2 ✓ ──► CL-3 ✓ ──┴──► CL-4 ✓ ──► CL-G (feel-test)
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
