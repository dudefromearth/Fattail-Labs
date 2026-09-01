# IKI Labs — Session GEX Path Spec v0.1

**Status:** **DRAFT** — not build authority. Gates at **GX0**.
**Date:** 2026-09-01
**Canonical filename:** `Specs/IKI-Labs-Session-GEX-Path-Spec-v0_1.md`
**Component id:** `session-gex-path` · **Layout:** `series` (**new renderer**) · **Plane:** `gex_session_bucket`
**Parent:** [`IKI-Labs-GEX-Toolset-Foundation-Spec-v0_1.md`](./IKI-Labs-GEX-Toolset-Foundation-Spec-v0_1.md)
— GXF law is not restated here.

**Duplicates:** ITMatrix session recap.

---

## 1. Purpose

**The question it answers:** *how did aggregate signed gamma move through the session, and where did
spot sit relative to the sign changes?*

One time series instead of a grid. Its value is that it is readable at a glance and archivable into
the journal for process review.

**The question it does not answer:** what the path implies for sizing, strategy or the next
session (**GXF36** — and see **SP7**, because a single line labelled "regime" is the family's most
compressible claim and therefore its most quotable one).

---

## 2. Component declaration

```ts
{
  id: "session-gex-path",
  runner_template_id: "session-gex-path",
  layout: "series",
  dataPlane: { id: "gex_session_bucket", required: true },
  analyzer_handoff: false,
  books: ["expiring", "all"],
  lenses: ["oi", "flow"],
}
```

**SP1 — this tool consumes Profile summaries; it does not recompute them.** One computation, several
readers (**GXF23**). A Path that disagrees with the Profile at the same bucket is a defect
(**AT-SP1**).

---

## 3. Series

Per bucket:

```text
net_expiring        signed aggregate, expiring book
net_all             signed aggregate, full selected chain
spot                from the plane's spot track
sign_changes[]      all crossings in view that bucket, with count   (SP2)
peak_abs_strike     argmax |net| that bucket
peak_abs_value
valid               bucket had usable data                          (SP5)
```

---

## 4. Tool law

| # | Law |
|---|---|
| **SP2** | **The path cannot plot "the flip", because there may not be one.** A chain can cross sign several times, and **GP1** forbids selecting a primary crossing. So the crossing series renders as a **band of all crossings per bucket**, carrying the count. The crossing nearest spot may be emphasised — **labelled as such**, never as *the* flip, and never as a lone line that hides the others (**AT-SP2**) |
| **SP3** | **The two books diverge at 16:00 and that is the point.** Between the expiring close and the non-expiring close, `net_expiring` is **final and frozen** while `net_all` still moves (**GXF19**, **GXF20**). Render the divergence: the expiring series terminates and is marked settled; the full series continues. Extending one to meet the other, or truncating both at the earlier time, destroys information in opposite directions (**AT-SP3**) |
| **SP4** | **Two books, two baselines, one honest chart.** `net_expiring` and `net_all` are sums over different contract sets. They may share an axis because they share units — they may **never** be summed, differenced into a ratio, or combined into a score |
| **SP5** | **Session statistics carry their denominator.** `pct_time_negative` over a session with 7,862 s of gaps (08-21) is arithmetic over a fifth of the day. Every statistic renders **with observed-vs-expected bucket counts beside it**, and a session marked `complete: false` renders its statistics marked, or not at all (**OD-SP2**). A clean percentage over a broken session is the most quotable wrong number this tool can produce (**AT-SP5**) |
| **SP6** | **Events are debounced observations.** `zero_cross` (aggregate changes sign), `spot_crossing` (spot moves through a crossing), `peak_change` (argmax strike changes and holds). All obey Node Tape's guards: no fire on a gap-spanned or invalid bucket (**NT6**), none before roll completion (**NT7**), and none named for a consequence (**NT9**) |
| **SP7** | **The recap is member-facing copy and is bound by §13 in full.** `+$88M → −$451M · peak 5774 → 5769` is a **description** and is fine. One appended clause of interpretation — *"…so the day turned"*, *"…expansion risk into the close"* — is the mechanism→outcome step (**GXF36**). The recap template is reviewed by Echo and Tango as copy, not shipped as a format string (**AT-SP7**) |
| **SP8** | **Flow lens: no path.** `gex_vol` is unsigned (**GXF11**), so there is no zero to cross and no regime. Under `flow` the tool renders **cumulative gamma-weighted flow** as a magnitude series, with `zero_cross`, `sign_changes` and `regime` **absent** — not a signed path drawn from an unsigned quantity (**AT-SP8**) |
| **SP9** | **The archive is 0DTE-only, so `net_all` on back-select is not what it says.** On a back-selected session the full-chain series can only cover what was captured (**GXF26**). Either the series is absent for history with the reason stated, or it renders scoped and labelled `band(w) · 0DTE`. It is **never** presented as the full chain (**AT-SP9**) |

---

## 5. Output contract

```json
{
  "component": { "id": "session-gex-path", "version": "0.1.0" },
  "symbol": "SPX", "session_date": "2026-09-01",
  "lens": "oi", "scale": "per_1pct",
  "windows": { "expiring": "09:30-16:00", "all": "09:30-16:15" },
  "series": [
    { "t": 0, "net_expiring": 0, "net_all": 0, "spot": 0,
      "sign_changes": [ { "px": 0, "strike_lo": 0, "strike_hi": 0 } ],
      "sign_change_count": 0,
      "peak_abs_strike": 0, "peak_abs_value": 0,
      "valid": true, "expiring_settled": false }
  ],
  "events": [
    { "t": 0, "type": "zero_cross|spot_crossing|peak_change",
      "book": "expiring", "detail": { }, "held_buckets": 3 }
  ],
  "stats": {
    "net_open": 0, "net_max": 0, "net_min": 0, "net_close": 0,
    "peak_open": 0, "peak_close": 0,
    "pct_time_negative": 0,
    "observed_buckets": 0, "expected_buckets": 0,
    "complete": true
  },
  "recap": "…",
  "coverage": { }
}
```

`stats` **always** ships `observed_buckets` and `expected_buckets` alongside any rate (**SP5**).
Under `lens: "flow"`, the signed fields are **absent** (**SP8**).

---

## 6. Visual

Upper panel: `net_expiring` and `net_all` against time, zero line marked, units labelled. The
expiring series **terminates visibly** at its close with a settled marker (**SP3**).

Lower panel (or overlay): spot with the crossings band. The band shows every crossing per bucket;
where the count is one it reads as a line, and where it is three it visibly is three — the reader
should never have to be told the difference (**SP2**).

Event markers on the series. Invalid buckets render as breaks, never interpolated. Recap strip
below, per **SP7**.

Coverage strip persistent, carrying both windows, completeness, gap count, scope and `oi_asof`.

---

## 7. Controls

| Control | Default | Notes |
|---|---|---|
| Books | both | expiring + all (**SP3**) |
| Lens | `oi` | `flow` → magnitude series only (**SP8**) |
| Scale | `per_1pct` | display only |
| Event debounce | 3 buckets | config; interacts with bucket size |
| Crossings band | on | all crossings; nearest-spot emphasis optional and labelled |
| Recap | on | Echo-reviewed template (**SP7**) |
| Session back-select | today | horizon from catalog; `net_all` scoped per **SP9** |

---

## 8. Acceptance tests

| ID | Test |
|---|---|
| **AT-SP1** | At a given bucket, `net_expiring`, `peak_abs_*` and `sign_changes` are **byte-identical** to the Profile's values for that frame |
| **AT-SP2** | A session containing buckets with 1, 2 and 3 crossings renders all of them, with counts; no bucket renders a single crossing line when more existed |
| **AT-SP3** | On an expiration day, `net_expiring` terminates at 16:00 marked settled while `net_all` continues to 16:15; neither is extended or truncated to match the other |
| **AT-SP4** | The two book series are never summed, differenced into a ratio, or exposed as a composite in payload or export |
| **AT-SP5** | 08-21 fixture → `pct_time_negative` renders **with** `observed_buckets` / `expected_buckets`, session marked not complete, reason on the strip |
| **AT-SP6** | No event fires on an invalid or gap-spanned bucket, or before roll completion |
| **AT-SP7** | The recap contains no interpretation clause, no banned string, and no profit claim; template reviewed and recorded at doc gate |
| **AT-SP8** | `lens: "flow"` → no `zero_cross`, no `sign_changes`, no `regime`; series is magnitude only |
| **AT-SP9** | Back-selected session → `net_all` is either absent with a stated reason or labelled with its true scope; it is never rendered as the full chain |
| **AT-SP10** | Invalid buckets render as breaks; no interpolation across them |
| **AT-SP11** | Lens, book, scale and back-select switches produce **zero** additional plane reads (cached) |
| **AT-SP12** | Half-day fixture → expiring window is 13:00 and the surface states it |

---

## 9. Open decisions

| # | Question | Recommendation |
|---|---|---|
| **OD-SP1** | Crossings band rendering — band, scatter, or emphasised-nearest with a count badge | **Band.** It is the only form where "three crossings" cannot be misread as one |
| **OD-SP2** | Statistics on a `complete: false` session — render marked, or suppress? | **Render marked, with denominators.** Suppressing teaches nothing; a clean number teaches something false (**GXF32**, OD-GXF8) |
| **OD-SP3** | Does the recap ship to the journal automatically? | **Member-initiated only.** An auto-filed recap becomes a daily narrative, and a daily narrative acquires a moral |
| **OD-SP4** | Is `net_all` meaningful at all when the chain is band-scoped? | Open. A "full chain" aggregate over a 15–25 wing band is a partial sum with a confident name. **SP9** discloses it; whether it should ship is Coach's |

---

## 10. Document control

| Version | Date | Notes |
|---|---|---|
| **v0.1** | 2026-09-01 | Initial. Consumes Profile, never recomputes (SP1). Crossings band replaces a single flip line (SP2). Expiring/full divergence at 16:00 rendered, not averaged (SP3). Statistics carry denominators (SP5). Recap bound as copy (SP7). Flow lens has no path (SP8). Back-select scope honesty (SP9). AT-SP1–12 · OD-SP1–4 |

**One-line law:**
**Two books on one axis and never summed, every crossing shown rather than one chosen, the expiring
series stopping visibly where the instrument stops, and no statistic rendered without the count of
buckets it was computed from.**