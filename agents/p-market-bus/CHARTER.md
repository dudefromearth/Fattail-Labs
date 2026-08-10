# p-market-bus — Charter

**Program:** Massive Market Bus & Shared Client  
**Plan:** [`docs/Massive-Market-Bus-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Massive-Market-Bus-Full-Agent-Bench-Plan-v1.0.md)  
**Spec:** [`Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md`](../../Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) **v1.0.1**  
**Orchestration:** Juliet · **Authority:** Coach  

## Mission

Ship **Massive → feed(s) → Redis → labs-api → one WebSocket/tab → shared MarketClient → Labs apps**, so concurrent members do not multiply Massive.

## In scope

- Redis generation store + pub/sub (MB-P1)  
- Chain feed process (MB-P2)  
- Symbol + market_status topics (MB-P3)  
- WS stream + shared web client (MB-P4)  
- Chain ladder surface as **consumer** (MB-P5)  
- AT-MB1–10 + 1→N client scale smoke  

## Out of scope

- Live main **header** product UI (surface Spec required)  
- Catalog name “Options Lab” ratification (OD-nav)  
- Full multi-chart product program  
- MSC  

## Cross-board

| Board | Rule |
|-------|------|
| `p-options-chain-picker` | H1-2 = OC15 **minimal** only; MB-P1 is **successor** (Spec §1.2) |

## Gates

Delta: **PASS / FAIL / BLOCKED** only — never waive.  
Coach GO blocked until Spec §18 specialist gates PASS.
