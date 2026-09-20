# SODP0 — Foxtrot (infra)

**Machine:** StudioTwo read-only; may SSH StudioOne **read-only** (no bootout, no git pull).  
**Review object:** spec §4 process set, Arch 36 machine catalog, plan SODP2/4/5.

## Do

1. Confirm live listeners: StudioOne `:4010` `:4011` chain_feed; StudioTwo leftover `:4010` / chain-feed / vp-engine.
2. Pin law: `192.168.1.111` LAN, `100.74.220.38` Tailscale. Never `.local`.
3. CP-1 footprint of a history provider vs chain_feed (Massive GET, disk, port). Rollback line.
4. Retire plan for StudioTwo leftovers (SODP5) without touching capture.

**Gate:** APPROVED / RETURNED. File `gate-reports/SODP0-foxtrot.md`. Carry CP-1 verbatim.
