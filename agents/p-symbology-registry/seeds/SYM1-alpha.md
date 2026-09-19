# SYM1 — Registry service + API

**Depends:** SYM0-G PASS (**DL-772**)  
**Agents:** Alpha, Kilo  
**Machine:** Code in this repo on **StudioTwo**. Runtime home is the price server (**StudioOne**) — **do not SSH StudioOne, do not install, do not touch capture.** CP-1: this packet is repo-only; Foxtrot install is a later named packet.

**Spec:** `Specs/FatTail-Labs-Symbology-Registry-Service-Spec-v0_2_1.md` sha1 `c87580829301d9a44e678641023e32c07bca58d6`

## Do

Implement §4 in Labs FastAPI (dev on StudioTwo `:4000`):

- `GET /symbology/v1/universe?roles=`
- `GET /symbology/v1/resolve?q=&roles=&preset=`
- `POST /symbology/v1/telemetry`
- `GET /symbology/v1/eligibility-report` (admin)
- `GET /symbology/v1/roll-catalog`

SYM-1…13. Tests for: `ESZ6` → matches, no bind; `ES1!` / `/ES` / **`@ES`** → continuity-alias, `bound_symbol` dated long form; alias as ingest key refused; `GET /roll-catalog` lists `tv-1VO` named-not-built.

Initial rows (COMING unless a real PP-1 artifact file is attached in-repo):

- SPX, XSP — role `options`
- ES, MES — role `price-structure` (never chains)
- SPY — `volume-source`, **not** in picker fixture

Do **not** answer D6/D7/D8. Do not write VPS symbol-metadata. Do not grant model-kind ACTIVE. Do not hardcode month letters in client. Do not add `1!` as an ingest key.

## Gate SYM1-G

pytest on those endpoints. Isolation: no LIM/QFRIC/XS/PPL files.

## CP-1 (this packet)

Repo-only. Footprint vs chain_feed: **none** (no StudioOne process). Rollback: `git revert` of the commit. BEFORE/AFTER chain_feed: **N/A** (StudioOne not touched). If you feel you must SSH StudioOne, **STOP**.
