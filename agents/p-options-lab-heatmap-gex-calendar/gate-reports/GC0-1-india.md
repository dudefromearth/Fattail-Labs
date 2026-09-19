# GC0-1 India — as-built quotes (Term Mass)

**Seat:** India  
**Date:** 2026-09-18  
**Spec:** v0.1.1 `Specs/FatTail-Labs-Options-Lab-Heatmap-GEX-Calendar-Spec-v0_1_1.md`  
**Does not:** product code.

## (i) Live parent + HM21 numbering

**Live parent:** `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md` current revision **v0.2.4**.

Quoted (v0.2.4 line 116):

> **HM21 — Inspector tab-session** | Heatmap **inspector selections** persist for **this browser tab** (`sessionStorage` key `ft_labs_heatmap_session`). …

Quoted (v0.3 header rebase note, line 12):

> Live **HM21** is inspector tab-session (v0.2.1 · **DL-575**). This draft's §2.4 proposes a **new** HM21 (auxiliary read plane). Rebase must not steal that id.

**Resolved ID:** inspector tab-session = **HM21** (v0.2.4 live). v0.3 §2.4 is **not live law**. Not a third thing. GC docs cite inspector as **HM21**. Auxiliary plane stays unnumbered until v0.3 rebases (v0.3 already spent HM22/HM23 on other clauses). **DL-763** records this. gex-cal does not use the auxiliary plane.

## (ii) N concurrent chain interests

**Hook (one expiry):** `useOptionChainBus` opts `expiration: string` (singular). Interest id:

```
const interestId = `chain:${symbol}:${expiration}:w${wings}`;
sock.setChainInterest(interestId, { symbol, expiration, side, wings });
```

Heatmap panel calls the hook **once** (`HeatmapChainPanel.tsx` `useOptionChainBus({ symbol, expiration, … })`). Heatmap has only ever **asked** for one book.

**Bus already holds N:** `MarketSocket.chains = Map<string, ChainSub>`. `setChainInterest(id, sub)` sets/deletes by id. `flushSubs` sends **all** values:

```
const chains = [...this.chains.values()];
ws.send(JSON.stringify({ op: "sub", symbols, chains, session }));
```

**Server:** `chain_subs: dict[str, dict]` keyed `chain:{symbol}:{exp}:w{wings}` (`market_stream.py` `_chain_sub_key`). `_handle_sub` iterates `for c in msg.get("chains")`.

**Verdict:** interest-for-N is **present** on the socket and the stream. It is **absent** as a Heatmap consumer. GC1 attaches N interests through the existing `MarketSocket` / one WS/tab. **Not a STOP.** Do not fake columns. Do not open a second Massive client.

## (iii) ValueModeId + inspector restore

Quoted `web/lib/options-lab/templates/types.ts`:

```
export type ValueModeId =
  | "debit" | "credit" | "r2r" | "pct_change"
  | "d_debit" | "d2_debit" | "theta" | "velocity" | "acceleration"
  | "slope" | "curvature" | "cp_asym" | "width_fit"
  | "gex_all" | "gex_net" | "gex_call" | "gex_put" | "gex_abs"
  | "quote" | "lim";
```

`gex_net` / `gex_abs` / `gex_all` already exist. Do not add a fourth GEX mode.

Inspector: `web/lib/options-lab/heatmapSession.ts`. Key `ft_labs_heatmap_session` (**HM21**). Restore:

```
const templateId = HEATMAP_TEMPLATES.some((t) => t.id === o.templateId)
  ? String(o.templateId)
  : "";
if (!templateId) return null;
```

Unknown / not-in-registry id → parse fails → no restore. Flag-off with no registry row ⇒ `gex-cal` cannot restore (AT-GC / HM21). After GC4 append, restore only if listed.

## HM1 tension

`ChainContext` remains one book. Term Mass uses local `GexCalPack` (JR1). Frozen `gex` / LIM / flies unchanged.
