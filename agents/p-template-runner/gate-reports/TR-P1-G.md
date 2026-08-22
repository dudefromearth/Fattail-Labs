# TR-P1-G — Browser Runner Shell

**Date:** 2026-08-21  
**Delta:** **PASS**  
**Token:** [`agents/go/TR-P1.md`](../../go/TR-P1.md) · **DL-533**  
**Packet:** `Specs/Template-Runner-Packet-TR-P1-Browser-Shell-v0_1.md`

Delta does not modify work under review. This verdict is evidence-only.

---

## Criteria

| # | Criterion | Result |
|---|-----------|--------|
| W0 | Door cited by path; one market WS/tab | **PASS** — GO token W0 table · evidence pack |
| Hash | `tilesHash(shell) === tilesHash(current)` on SPX, TSLA, SPY | **PASS** |
| `content_hash` | Runner snapshot = `useOptionChainBus` field | **PASS** `gen-spx-trp1` |
| TR12 | Unknown template · undeclared sink · I/O · missing socket | **PASS** |
| TEMPLATE_IO | All six guarded surfaces | **PASS** (follow-up) |
| Template source | `git diff` heatmap templates empty | **PASS** |
| Flag | missing/`0` current; `1` shell; missing not fail-loud | **PASS** |
| Socket flag 0 vs 1 | Market WS count identical (1) | **PASS** — screenshots attached |
| `server/` / `web/lib/market/` | Untouched by packet | **PASS** |
| `npm run build` | Clean | **PASS** |
| Browser | `/app/options-lab/heatmap` renders | **PASS** · 423 tiles both flags |

**BLOCKED if** second market socket or `web/lib/market/` edit — **not triggered**.

---

## 1. Socket count (artifacts)

Playwright `page.on("websocket")` on `/app/options-lab/heatmap` after `/api/auth/dev-login`. Script: `web/lib/runner/__tests__/capture-ws.mjs` (exits 1 if market count ≠ 1).

Pack: [`agents/p-template-runner/evidence/tr-p1/`](../evidence/tr-p1/)

| Flag | Market WS | Tiles | Network WS screenshot | Heatmap screenshot |
|------|-----------|-------|----------------------|--------------------|
| **0** | **1** (`/api/me/market/stream`) | 423 | `ws-flag-0.png` | `heatmap-flag-0.png` |
| **1** | **1** (`/api/me/market/stream`) | 423 | `ws-flag-1.png` | `heatmap-flag-1.png` |

JSON: `ws-flag-0.json` · `ws-flag-1.json`. HMR sockets are Next dev, not market (Arch 28 §4.3).

Flag 1 run: `NEXT_PUBLIC_LABS_RUNNER_SHELL=1 npm run dev` (Next will not dual-bind the same `web/` dir).

---

## 2. TEMPLATE_IO — six surfaces

`npx --yes tsx lib/runner/__tests__/shell.test.ts`

```
ok  TEMPLATE_IO io-fetch
ok  TEMPLATE_IO io-xhr
ok  TEMPLATE_IO io-ws
ok  TEMPLATE_IO io-localStorage
ok  TEMPLATE_IO io-sessionStorage
ok  TEMPLATE_IO io-document
```

Guard always installs traps for `fetch`, `XMLHttpRequest`, `WebSocket`, `localStorage`, `sessionStorage`, `document` (`web/lib/runner/run.ts`). One `RunnerError('TEMPLATE_IO')` assertion each.

---

## 3. Hash / negatives / flag (full run)

```
ok  tilesHash SPX 17c08e08:13320
ok  tilesHash TSLA 22045e86:9759
ok  tilesHash SPY -1b8c8c6b:23788
ok  content_hash gen-spx-trp1
ok  UNKNOWN_TEMPLATE
ok  UNDECLARED_SINK
ok  TEMPLATE_IO io-fetch
ok  TEMPLATE_IO io-xhr
ok  TEMPLATE_IO io-ws
ok  TEMPLATE_IO io-localStorage
ok  TEMPLATE_IO io-sessionStorage
ok  TEMPLATE_IO io-document
ok  MISSING_SOCKET
ok  one socket instance for two runner interests
ok  flag missing/0 off · 1 on
ok  render sink
TR-P1 16 passed
```

---

## 4. Build / pytest / template diff

- `cd web && npm run build` — compiled, TypeScript finished, heatmap route in graph.
- Heatmap template + `web/lib/market/` diff vs HEAD: **empty**.
- `pytest tests -q`: **1029 passed**, 3 skipped, **1 failed** — see separate finding. Not TR-P1.

---

## Separate finding (not this gate)

[`FINDING-test-chain-ladder-0dte.md`](./FINDING-test-chain-ladder-0dte.md)

`test_live_zero_dte_fits_one_page_monthly_friday_does_not` — `assert len(z) == 200` got `0`. **Fails on clean `origin/main` (`14b622d`) with TR-P1 absent.** Calendar-settled fixture. Owner: chain ladder live AT, not Runner.

---

## Verdict

**PASS**

---

## Delta record

Submitted for verdict with evidence pack
[`agents/p-template-runner/evidence/tr-p1/`](../evidence/tr-p1/)
and this report.

**Re-checked before record:** `npx --yes tsx lib/runner/__tests__/shell.test.ts` ·
`ws-flag-0.json` / `ws-flag-1.json` `marketCount: 1` · heatmap template
`git diff` empty · `web/lib/market/` empty.

**Recorded:** **PASS**  
**Date:** 2026-08-21  
**Does not:** MiniTwo (Foxtrot, separate GO).
