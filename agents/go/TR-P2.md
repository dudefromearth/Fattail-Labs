# GO token — Template Runner TR-P2 · Controls + Live

**ID:** `TR-P2`  
**Program:** Template Runner  
**Spec:** v0.1.2 TR4 · TR5 · TR7 · TR10 · TR12  
**Gate:** **TR-P2-G**  
**Board:** `agents/p-template-runner/` · seeds `tr-p2/`  
**Parent:** TR-P1 **PASS** `f4cc89a` · **DL-533**

---

## Coach stamp

- [x] **GO** — this brief is the stamp  
- [ ] **Amend**  
- [ ] **Stop**

**Signed:** Coach  
**Date:** 2026-08-21  

This GO covers **packet TR-P2 only**. IKI host, composition, license, data/notify sinks remain THESIS.

---

## W0 — citations

| Piece | Path |
|-------|------|
| TR-P1 shell | `web/lib/runner/{registry,subscribe,run,sinks/render,templates/heatmap}.ts` |
| Tab singleton | `web/lib/market/MarketSocket.ts` — `subscribe` listener · `setChainInterest` |
| MB7 updates | `server/routes/market_stream.py` — snapshot `mode=full`, then `diff` / `unchanged` / `full` with `content_hash` |
| Chain document (as-built) | WS payload: `t, mode, key, content_hash, as_of?, ladder?, session_open` |
| `epoch_quality` | Arch 30 §5.6 **PackageQuote** (`ok` \| `skewed` \| `incomplete`) — **not** on the chain WS document |
| Bus `stale` | `server/market_data/underlier_marks.py` / live marks — **underlier**, not chain generation |

**W0 honesty (do not invent):** as-built `chain` WS messages do **not** carry `stale` or `epoch_quality`. TR-P2 subscribe requires those fields on the yielded document (TR10). Absent → `RunnerError('STALENESS_MISSING')`. Tests inject them. Live bus without the keys fail-loud by name — we will **not** map `session_open` into `stale` (that would invent a staleness field). Zero `server/` change.

**Folder:** `web/lib/runner/` (unchanged).

---

## W0 — files

**Touch:** `web/lib/runner/{registry,run,subscribe}.ts`, `web/lib/runner/sinks/render.ts`, `web/lib/runner/templates/heatmap.ts` (registration fields only — `sym-fly` source not touched), `web/app/app/options-lab/heatmap/page.tsx` (flag-gated selector via shell host)

**Create:** `web/lib/runner/templates/spread-tax.ts`, `web/lib/runner/__tests__/p2.test.ts`

**Read only:** `web/lib/market/*`, `web/lib/options-lab/templates/symFly.ts`, `server/*`

---

## W0 — `spread-tax@0.1` TR7 record (before source)

| Field | Value |
|-------|--------|
| id | `spread-tax` |
| version | `0.1` |
| inputs | `["chain"]` |
| controls | `{ id: "side", kind: "select", default: "both", options: ["call","put","both"] }` · `{ id: "min_oi", kind: "number", default: 0, bounds: [0, ∞) }` |
| outputKind | `visual/heatmap` |
| live | `true` |
| sinks | `["render"]` |
| honesty | missing bid/ask or `mid ≤ 0` → cell `null` (no fill, no zero); `stale` passed through |
| framing | trader |
| nonClaim | "execution cost at the quoted market; not a forecast." |
| exit | none |
| Knowledge / Intelligence | **Knowledge** |
