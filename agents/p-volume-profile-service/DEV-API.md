# VP Profile API — StudioTwo dev sidecar

**APPS reads this file.** Do not scan ports. Do not guess paths.

| Field | Value |
|-------|--------|
| **State** | **UP** |
| **Base URL** | `http://127.0.0.1:4010` |
| **Health (flip signal)** | `GET /v1/health` — computing-class session; **403** members; **401** none. Coverage block is the flip signal. |
| **Contract** | **v1.1** [`Specs/VP-API-Contract-v1_1.md`](../../Specs/VP-API-Contract-v1_1.md) sha1 `d01b3dd9bfbac3bbcafb34110ef7d06cd6650915` · **DL-733** (supersedes v1.0 `b403937a…`) |
| **Launchd** | `ai.fattail.labs.vp-api` KeepAlive |
| **Last verified** | **2026-09-17 14:08 ET** — listen `127.0.0.1:4010` PID 967; unauth `/v1/health` → 401 JSON; computing `/v1/health` → 200 with `coverage` |

## Store (stated once — do not guess)

StudioTwo engine **and** ingest live at:

**`/Users/ernie/fattail-market-data`**

FatTail2TB is **unmounted** on this machine. `.env` may still name `/Volumes/FatTail2TB/...`; the sidecar run script **overrides** to the path above. APPS must not path-guess FatTail2TB.

`LABS_MARKET_DATA_ROOT=/Users/ernie/fattail-market-data`

## Coverage at last verify (from `/v1/health`)

| Source | floor_session | ceiling_session | sessions_binned |
|--------|---------------|-----------------|----------------:|
| ES | 2026-09-17 | 2026-09-17 | 1 |
| MES | 2026-09-17 | 2026-09-17 | 1 |
| SPY | null | null | 0 |

Interval is always **[floor … now]** (newest-first backfill). A hole is a service defect.

## Notes

- Does **not** replace Labs `:3000` / `:4000`.
- `/v1/profile*` remains computing-only (**403** even in dev).
- INFRA updates **this file** whenever state or address changes.
