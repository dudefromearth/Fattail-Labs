# VP Profile API

**APPS reads this file.** Do not scan ports. Do not guess paths.

| Field | Value |
|-------|--------|
| **Authoritative** | **PRODUCTION · StudioOne** |
| **State** | **UP** |
| **Canonical base (LAN)** | **`http://192.168.1.111:4010`** |
| **Canonical base (Tailscale / MiniTwo)** | **`http://100.74.220.38:4010`** · MagicDNS host `studioone` (**not** `studioone.local`) |
| **Do not use** | `http://studioone.local:4010` — mDNS returns extra A/AAAA (`192.168.68.57` + IPv6). urllib/http.client stall **~1.2 s/request**. |
| **Health (flip signal)** | `GET /v1/health` — computing-class; **403** members (F6); **401** none |
| **Contract** | **v1.1** sha1 `d01b3dd9bfbac3bbcafb34110ef7d06cd6650915` (`row=` is a **display-resolution override**, SA-L8 render-only; finer than substrate → 422) |
| **Launchd** | `ai.fattail.labs.vp-api` KeepAlive |
| **Client** | `sa_dev.vp_client` HTTP/1.1 keep-alive pool. Pin the canonical IP above. |
| **Last verified** | **2026-09-18 07:55 ET** — hop: `.local` p50 **1227 ms** vs LAN IP p50 **4.1 ms** (new conn) / **2.8 ms** (keep-alive). Tailscale `100.74.220.38` p50 **8.5 ms**. |
| **Store** | `/Volumes/FatTail2TB/fattail-market-data` |
| **Ops pane (single)** | **`http://studioone.local:5055`** — Chain Snapshot + VP pipeline. `GET /api/vp-ops`. No second dashboard. |

## StudioTwo sidecar (DEV only — not authoritative)

| Field | Value |
|-------|--------|
| **State** | UP · retained for APPS fixture work |
| **Base URL** | `http://127.0.0.1:4010` |
| **Store** | `/Users/ernie/fattail-market-data` |
| **Note** | No longer the flip signal. APPS uses the **LAN pin** `http://192.168.1.111:4010`. |

## Coverage at last verify (production `/v1/health`)

| Source | floor | ceiling | sessions_binned | last_print |
|--------|-------|---------|----------------:|------------|
| SPY | 2026-09-17 | 2026-09-18 | 2 | live |
| ES | 2026-09-17 | 2026-09-18 | 2 | live |
| MES | 2026-09-17 | 2026-09-18 | 2 | live |
