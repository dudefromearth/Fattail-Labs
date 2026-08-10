# Charter — p-options-chain-picker

**Mission:** Ship the **Options Chain Picker** (heal → harden → HIG UI → preform calendar) so members can pick an Admin-universe symbol, choose among the next three distinct listed expirations, and watch a vertical ±σ ladder update **only** where quotes change — with **proxy-safe** spot/vol and **Apple HIG for Labs web** on every control.

**Board:** [`ORCHESTRATOR.md`](./ORCHESTRATOR.md)  
**Full Agent Bench Plan (execution law):**  
[`docs/Options-Chain-Picker-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Chain-Picker-Full-Agent-Bench-Plan-v1.0.md)

**Product law:**

| Spec | Path |
|------|------|
| Options Chain Picker Spec v1.0.1 | `Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.md` |
| Human Interface Spec v1.0 (**HIG**) | `Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md` |

**Companions:** Architecture/18 live marks · Admin `market_symbol_universe` · `chain_collector` / Massive client  

**Seeds:** [`seeds/`](./seeds/)  
**Gates:** [`gate-reports/`](./gate-reports/)

**Doctrine:** no MSC · proxy never strike/σ · shared Massive generation · diff-not-reload · universe SoR · **HIG always (even prelim)** · fail loud · evidence · no waived Delta gates.

---

## Product north stars

| Goal | Meaning |
|------|---------|
| **True scale** | Chain underlying spot; native VIX1D/VIX only for σ |
| **Three contracts** | Distinct listed expiries; default nearest; DTE auto |
| **Quiet UI** | Only changed strikes repaint |
| **HIG calm** | Kit controls; chain is content; ≥44pt targets |

---

## Collaboration

Coordination through **Coach** or **Juliet** only. Specialists execute **only** via seeds.  
Echo owns HIG; Charlie implements kit only.
