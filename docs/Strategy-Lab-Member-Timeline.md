# Strategy Lab — product timeline (member focus)

**Status:** Coach operating lock (2026-08-07)  
**Decisions:** DL-251 · **DL-252**  
**Architecture:** `Architecture/26-strategy-lab-member-timeline.md` · growth playbook Arch 17  
**Guiding doctrine (DL-382):** [`FatTail-Labs-Strategy-Lab-Guiding-Doctrine-Spec-v1.0.md`](../Specs/FatTail-Labs-Strategy-Lab-Guiding-Doctrine-Spec-v1.0.md) · [position paper](./Strategy-Lab-Position-We-Position-We-Dont-Predict.md)  

---

## Now

| What | Who |
|------|-----|
| **Design + Curate** — finish, lock, full access | **Current entitled membership** |
| **Deploy** product surface | **Members** — full Deploy **except** real-broker connectivity |

---

## What Deploy members *do* get

Everything in Deploy that does **not** require connecting to a **real broker** for **real-money** trading: promote from Curate, Deploy workflow, monitoring, process views, sim/non-broker paths as built, preparation for live without placing live capital orders.

---

## What stays gated

| Gated | Detail |
|-------|--------|
| **Real broker connectivity** | **Tradier** (our real-broker path) |
| **Real-money environment** | Actually trading the bot with **real capital** — the ultimate purpose of Deploy |

**Admin** proves Tradier paper → live first. Then we **provision** that connectivity for designated members.

---

## Parallel track (admin)

| What | Who |
|------|-----|
| Build and dogfood **Tradier / real-money Deploy** | **Admin only** until proven |

---

## Later

When the real-broker rail works for admin → open **Tradier / real-money** Deploy to designated members (same stack, caps + arming).

---

## Sequencing

```text
Members ──► Design + Curate LOCK
         ──► Deploy UX (no real-money Tradier yet)
Admin  ──► Tradier dogfood ──► then provision real-broker Deploy
```

---

## One-line summary

**Members get Design, Curate, and Deploy except real-broker (Tradier) real-money trading; admin proves that rail, then we open it to designated members.**
