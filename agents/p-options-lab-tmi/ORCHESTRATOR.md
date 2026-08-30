# Orchestrator — Time Machine Instant Replay (TMI)

**PARKED.** See `PARKED.md`. 32 seeds, never stamped — that was not retirement. Unified Time Machine v0.7.4 GO runs on `agents/p-options-lab-tm/` / plan v1.2 / `agents/go/TM-W0.md`. **Do not fire any seed on this board.**

**Juliet** runs this board. Specialists only via seeds. Gates via **Delta** ternary.

**Plan:** [`docs/Options-Lab-Time-Machine-Instant-Replay-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Time-Machine-Instant-Replay-Full-Agent-Bench-Plan-v1.0.md) **v1.0**  
**Spec:** [`Specs/FatTail-Labs-Options-Lab-Time-Machine-Instant-Replay-Spec-v0_1_1.md`](../../Specs/FatTail-Labs-Options-Lab-Time-Machine-Instant-Replay-Spec-v0_1_1.md) **v0.1.1 DRAFT** · **DL-594** · **DL-595**  
**W0 token:** [`agents/go/TMI-W0.md`](../go/TMI-W0.md) — **not stamped**

### Critical path

```text
W0 → W0-BA → W1 → W2 → W3 → W4 ∥ W5 ∥ W6 → W7 → W8 → W-G
                              └ W6 HOLD if §11.5 out
```

| Phase | Name | State |
|-------|------|--------|
| **W0** | Review + §11 ticks | **Not fired** — needs `TMI-W0.md` |
| **W0-BA** | BUILD AUTHORITY | **Blocked** on W0-G + every §11 tick |
| **W1** | Playhead owner + adapter | Blocked on W0-BA |
| **W2** | Recorder + Cache slider | Blocked on W1-G |
| **W3** | Heatmap host | Blocked on W2-G |
| **W4** | Analyzer projector | Blocked on W3-G |
| **W5** | Width Fit Replay | Blocked on W3-G |
| **W6** | Surface projector | Blocked on W3-G **and** §11.5 |
| **W7** | Kilo AT-TMI-1…32 | Blocked on W4-G |
| **W8** | Lima + help | Blocked on W7-G |
| **W-G** | Delta | Blocked on W7 + W8 |

### Gate protocol

1. Seeds executed → evidence in `gate-reports/` or cited paths.  
2. **Delta** PASS / FAIL / BLOCKED.  
3. No SKIP. Chrome gates require **Echo**.  
4. Overrule of a specialist finding = **DL entry**, not silent waive.  
5. Missing §11 tick = **not BUILD**.

### Seed naming

`W0-{n}-{agent}-{slug}.md` · `W1-…` · Gates: `W0-G.md` · `W1-G.md` · …

### First actions (Juliet)

1. **W0-0** Coach stamps `TMI-W0.md` (§11 ticks).  
2. Do **not** open W1 until **W0-BA**.  
3. Do **not** let `p-template-runner-stream-book` SB5 ship a second scrubber.

### Do not

- Product code before W0-BA.  
- Silent-default spec §11.  
- Client Massive / second socket.  
- Fork `AnalyzerTimeMachineStrip` into a second Day machine.  
- Algo Alert on Instant Replay.  
- Invent prints, upsample 10s→2s, gold-fill NO FILM.  
- MiniTwo until Coach asks.
