# Template Runner — Packet TR-P1 · Browser Runner Shell v0.1

**Status:** **GO** (`agents/go/TR-P1.md` · **DL-533**). Spec authority: `Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md` (v0.1.2; TR-P1 as-built, rest THESIS).  
**Project:** `agents/p-template-runner/`  
**Callsign:** Charlie (frontend) · India seeds W0 · Delta gates  
**Feeds gate:** TR-P1-G

## Purpose
Stand up the browser Runner shell (TR2): registry → subscribe via the **existing `MarketSocket` tab singleton** (Coach's "SSE gateway"; Arch 34) → run a template → sink. Prove it by running today's heatmap template through the shell and producing **byte-identical** tiles to the current Options Lab heatmap on the same generation.

## Task sequence
1. **W0-1 (India):** Restate the door by artifact: `server/routes/market_stream.py` (WS `/api/me/market/stream`), `web/lib/market/MarketSocket.ts`, `useOptionChainBus`; Arch 28 §4.1–4.3; Arch 34; DL-419/420. Restate one-socket-per-tab: the Runner **registers interest on the existing tab singleton** — it never opens a socket of its own.
2. **W0-2 (India):** Declare files in scope (below) and neighbor-board locks by artifact, not table.
3. **W1-1 (Charlie):** `web/lib/runner/` (India confirms name): `registry` (id, version, TR7 contract fields), `subscribe(interest)` → wraps `getMarketSocket()` interest API, `run(template, streams, controls)`, `sinks` (render only in P1).
4. **W1-2 (Charlie):** Register the existing HM v0.2 heatmap template(s) unchanged as `output: visual/heatmap, static-per-generation`, no controls, sink = render.
5. **W1-3 (Kilo):** Characterization: fixture generation → shell → tiles; hash equals current heatmap path output. Also: unknown template id, undeclared sink, template attempting fetch → named error (TR12).
6. **W1-4 (Charlie):** Mount behind a flag on one Options Lab route; no default-on.

## Files in scope
- `web/lib/runner/` — new (India confirms in W0-2)
- `web/lib/market/` — **read only**; Runner consumes its interest API, no edits
- Existing heatmap template module(s) — **read only** in P1; registration wraps, does not edit
- `web/` one Options Lab route — flag mount only

## Out of scope (P1)
IKI Lab host mount · controls · live/streaming output · data output · notification/signal sinks · composition (TR6) · license metadata (OD-TR7) · any `server/` change · any gateway change.

## Invariants
SI #2 fail loud (no ad-hoc socket, no HTTP fallback invented in the Runner — `useOptionChainBus` already owns stale-poll) · SI #4 evidence · SI #5 declared files only · SI #10 suite green · HM1–HM20 unchanged · TR5 purity · TR12.

## Completion criteria (verifiable)
- [x] W0-1 artifact: door cited by file path; Runner opens zero new WebSockets (Arch 28 §4.3 evidence: socket count before/after)
- [x] Runner `chain` snapshot `content_hash` == `useOptionChainBus` hash on same topic
- [x] `tiles_hash(shell) == tiles_hash(current)` on ≥3 recorded generations (SPX, one equity, one ETF)
- [x] TR12 negative tests green
- [x] No change to heatmap template source (diff empty)
- [x] Flag off by default; flag on → shell renders in Options Lab
- [x] Evidence pack for Delta: commands, hashes, screenshots

## Gate TR-P1-G (Delta)
PASS / FAIL / BLOCKED. BLOCKED if the Runner opens a second market socket or touches `web/lib/market/`.
