# IKI-P3-W1 — Workspace + inspector rail

**Project:** IKI Lab · IKI-P3  
**Agent:** Charlie  
**Depends:** Coach stamp on the plan: **B1 · B2 · B3 · C1** and **GO W1**  
**Feeds:** W1b Kilo · Echo · Tango  
**GO:** `agents/go/IKI-P3.md` · **DL-539**

## In scope

| File | Touch |
|------|--------|
| `web/components/iki/IkiSuiteChrome.tsx` | `workspace` prop (Heatmap workspace fill). Default **off**. |
| `web/app/app/iki/runner/page.tsx` | `workspace`; flex 1/5+4/5; rail + host |
| `web/app/app/iki/runner/IkiRunnerRail.tsx` | **Create.** HM §6.1 rail via imported `inspectorChrome` |

**If B3 = Yes:** also `web/lib/runner/sinks/render.ts` — strip `runner-template-selector`; keep session + `TileGrid`; lift controls; view-panel frame.

**If B3 = No:** do **not** edit `render.ts`. Hide/cover the host selector from the page/rail so the member does not see the ad-hoc bar.

## Out of scope

Options Lab files (import `inspectorChrome` only). `web/lib/market/`. `server/`. `subscribe.ts`, `run.ts`, `registry.ts`, `host.ts`, `templates/**`. Factory page (not workspace). ToS, Analyzer, Width Fit sliders. Catalog naming.

## Law

- Tokens only. `min-h-[var(--hit-min)]` on interactive rows. Tint focus rings.  
- **B2:** until Coach ticks Ratify, **hide like Heatmap**. If Coach ticks Ratify, disable-don’t-hide. The disable rule is **Coach’s IKI-P3 brief**, not Juliet’s.  
- Stream chip **visual** = Heatmap chip. Labels/mapping = proposal until Echo + Tango + **C1**. Do not invent Market closed.  
- One `getMarketSocket()`. Do not add a socket.  
- Default wings 25. Do not change `run()` math.  
- Echo owns grammar: inspector patterns only.  
- `useOptionsLab` is a **stand-in** (A1) for member session.

## Completion (verifiable)

- `/app/iki/runner` has `iki-suite-chrome` + `data-testid="iki-runner-rail"` + view pane.  
- Visible ad-hoc `runner-template-selector` count **0**.  
- Factory `/app/iki/factory` still stacked page.  
- `git diff --stat` matches B3 allowlist.

## Gate share

W1 files exist; frozen trees untouched. Feeds Kilo + Echo + Tango.
