# G1-2 — Kilo: umpire on trade path

**Agent:** Kilo  
**Gate:** G1-G  
**Depends:** S1-G

## Task

1. Trade create undirected (null campaign) → **200** without Big Three / campaign.  
2. Trade create **never** requires Same-bet or CR-12.  
3. No correlation / CR-12 modal on trade-log path.

## Invariants

P3 · P9 · umpire · display never demand.

## Acceptance

Spec §10 #1 (trade half) · #14 · #15 (absence on trade)

## Completion

pytest + note no UI hook on trade sheet.
