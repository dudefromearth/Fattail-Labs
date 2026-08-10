# p-market-bus — Orchestrator (Juliet)

## Sequence

```text
W0 (specialist gates + Coach GO)
  → R  (Redis / MB-P1 · OC15 production)
  → F  (Chain feed / MB-P2)
  → S  (Sym + session / MB-P3 · WS probe)
  → T  (WebSocket + MarketClient / MB-P4)
  → C  (Chain ladder consumer / MB-P5 · 1→N smoke)
  → K  (full AT pack — may start after T)
  → X  (optional MB-P6)
  → Z  (deploy + close)
```

## Rules

1. Seeds only; no freeform multi-agent thrash.  
2. **H1-2 / MB-P1:** one OC15 evidence trail — R1-4 + Z1-2 cite Spec §1.2.  
3. **No header UI** seeds without Coach opening a surface Spec.  
4. O1–O6 must be Accept/Override at W0-0 — no silent defaults.  
5. P1–P2 green before any “multi-member live board” marketing claim.  
6. First smoke after C: **1 client** then **N clients** same chain topic.

## Phase exits

| Gate | Must include |
|------|----------------|
| W0-G | All MB-G-* PASS or written Coach waive; O1–O6 table ready |
| R1-G | AT-MB1; multi-worker; successor cite |
| F1-G | Request-path Massive=0 for hot chains |
| S1-G | Entitlement probe transcript; AT-MB4/9 |
| T1-G | One WS; AT-MB7/8/10 |
| C1-G | Ladder on client; AT-MB5; 1→N smoke |
| K1-G | AT-MB1–10 matrix |
| Z1-G | MiniTwo + DL posture + program close |
