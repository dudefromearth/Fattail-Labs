# Spec question — session/developing bins during roll week

**To:** Coach courier  
**From:** INFRA · 2026-09-18 (ESU6 expiry; both contracts live)  
**Do not** change served profile payloads until answered.

## Finding

Session and developing histograms for `source=ES` **sum both contracts' eligible prints**. Two price bands, one product session.

| Store | ESU6 | ESZ6 | Histogram span | Histogram total |
|-------|------|------|----------------|-----------------|
| StudioTwo local | n=1986 vol=4150 px 7629.25–7670.25 | n=48385 vol=116720 px 7696.00–7739.25 | **7629.25–7739.25** (both) | 120870 = 116720+4150 |
| StudioOne (READ-ONLY) | n=3701 vol=7699 px 7625.25–7670.25 | n=125713 vol=374682 px 7687.00–7739.25 | **7625.25–7739.25** (both) | 376413 (eligibility trim vs raw 382381) |

`print_eligible` filters odd lots / Q4 / average-price. It does **not** filter `contract`. `rebuild_session` loads the whole day's gzip.

## Spec v0.6.1

- **§4:** roll weeks **capture both** (ingest). Lawful.
- **§5.2:** histogram = eligible prints per §4. Eligibility is conditions, not contract.
- **§6 / VP-L17:** cross-session accumulation only in **target space**; "raw contract-space histograms valid within a **single session**"; AT-12 Stage B roll seam.

**Underspecified:** whether a source-space `session`/`developing` histogram is one **product-session** (all active contracts) or one **contract-session**. Mixing ESU6+ESZ6 in source space double-counts the market at two bands (~70 pts apart today).

## Candidate law (for Coach)

Session/developing bins are **per contract**. The **published series** follows the lead-contract rule (volume leadership in the roll window / vendor Contracts calendar — same rule now on the OHLC path). All-history / target-space accumulation stays roll-coherent per §6 (each contract-session through its own offset).

**Until answered:** served `/v1/profile*` payloads stay as-is (known-mixed, honest).
