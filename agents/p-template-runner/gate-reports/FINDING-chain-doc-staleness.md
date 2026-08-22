# FINDING — chain generation document lacks `stale` / `epoch_quality`

**Status:** **CLOSED** — **DL-535** · Market Bus Spec **v1.0.2** · GO `agents/go/MB-P2.md`.  
Chain documents now carry `stale` + `epoch_quality` by the marks/OPF definitions.

**Was:** Not a Template Runner defect. Owner Market Bus (Alpha).

TR-P2 subscribe (TR10 / SI #2) yields `stale` and `epoch_quality` **from the document**. It does not invent them from `session_open`. On the as-built bus that fail-louds `STALENESS_MISSING`.

TR-P2 subscribe (TR10 / SI #2) yields `stale` and `epoch_quality` **from the document**. It does not invent them from `session_open`. On the as-built bus that fail-louds `STALENESS_MISSING`.

---

## Where the fields exist today

| Field | Plane | Path |
|-------|--------|------|
| `stale: boolean` | Underlier marks | `server/market_data/underlier_marks.py` (returns `"stale": stale` on the mark dict) · `server/market_data/live_marks.py` (`"stale": age_s is not None and age_s > stale_seconds()`) |
| `epoch_quality` | Package quote (OPF L4) | `server/opf/generation.py` `build_epoch` / `epoch_quality_for_day_trade` (`"ok" \| "skewed" \| "incomplete"`) · `server/opf/package.py` · `server/routes/pricing.py` (`"epoch_quality": quote.get("epoch_quality")`) |

Arch 30 §5.6: `epoch_quality` is on **PackageQuote**, not the chain generation.

---

## Where they are absent

| Surface | Path |
|---------|------|
| Member chain WS | `WS /api/me/market/stream` — `server/routes/market_stream.py` sends `{ t, mode, key, content_hash, ladder, session_open }` |
| Redis generation | `mb:ladder:*` (Arch 28 §3) — the `ladder` object written by the same path (`store.set_json(bus_key, ladder)`) |

Captured live frame (flag 1, `/app/options-lab/heatmap`, 2026-08-22):  
[`agents/p-template-runner/evidence/tr-p2/chain-ws-message-keys.json`](../evidence/tr-p2/chain-ws-message-keys.json)

```
t: chain
mode: full
key: chain:SPX:2026-08-24:w25
content_hash: 52f5ca4609dc8898
session_open: false
keys_on_message: content_hash, key, ladder, mode, session_open, t
has_stale_on_message: false
has_epoch_quality_on_message: false
has_stale_on_ladder: false
has_epoch_quality_on_ladder: false
```

`ladder` keys include `as_of`, `content_hash`, `rows`, `spot`, … — not `stale`, not `epoch_quality`.

---

## Owner / next

Market Bus Spec **v1.0.2**: put `stale` and `epoch_quality` on the chain generation document (WS + `mb:ladder:*`), derived from the bus's own clocks — not invented in the Runner. Lima DL on that amendment. Then TR-P2 live templates can subscribe without `STALENESS_MISSING`.
