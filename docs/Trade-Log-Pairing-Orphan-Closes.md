# Trade Log — Pairing an orphan close with its open

**Audience:** Members who imported or typed fills that did not connect  
**Route:** `/app/trade-log`  
**Spec:** [`Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md`](../Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md) §16  
**As-built design:** [`Architecture/15-trade-log-manual-management.md`](../Architecture/15-trade-log-manual-management.md)

---

## The short answer

There is **no “link this close to that open” button**, and **no search box** on the blotter.

Pairing is **automatic**. Two fills become one position when they share the same structure on the same account, the close is after the open, and they sit inside a **30-day** hold window.

If an import left them unconnected, fix the structure (or the clock) so they look like the same position, then save. They pair themselves.

---

## What “orphan” means

| Badge | Meaning |
|-------|---------|
| **Open** | TO OPEN fill with no paired close |
| **Complete** | Open and close matched |
| **Orphan close** | TO CLOSE fill with no paired open |

An orphan is not “lost data.” It means the matcher did not see the same structure (or the times / account broke the order).

---

## How pairing works

The book treats two fills as one position when all of this is true:

| Rule | Detail |
|------|--------|
| Same **account** | Matching is account-scoped |
| Same **structure** | Underlier, expiration, and strike / qty / put-call shape (normalized) |
| Close **after** open | Chronological FIFO |
| Within **30 days** | `MAX_STRUCTURE_HOLD_DAYS` |

**Side is ignored** so a reverse close can match the open. You do not pick a pair; the engine pairs when the keys match.

---

## How to pair them today

1. On the blotter, filter **Open: N** to see unmatched opens.
2. Open the orphan close. The sheet says **TO CLOSE · orphan**.
3. Open the intended open. Compare account, symbol, expiry, strikes, and times.
4. Edit the fill that is wrong — usually:
   - Practice **account**
   - `TO_OPEN` / `TO_CLOSE`
   - a **strike** or qty (legs not a clean reverse)
   - **`exec_at`** (open must be earlier than close)
5. Save. They pair themselves. The close should read **paired with an open**; the open should go **Complete**.

If you want them to stay unlinked, check **Allow orphan / unexpected pair** on save. That keeps them unlinked on purpose — it is not how you force a pair.

There is no picker like “pair with open #1842.”

---

## Why imports often miss

- Different Practice account  
- Open and close more than 30 days apart  
- Close timestamp earlier than the open  
- Legs not the same shape (one extra strike, qty not a clean reverse)  
- One row tagged open, the other not tagged close  

---

## Search

You cannot type a symbol or trade id into a search field on the blotter.

What exists:

| Path | What it does |
|------|----------------|
| **Open: N** | Filter to unmatched opens |
| `/app/trade-log?id=123` | Open that trade’s sheet |
| `/app/trade-log/find` | **Not** a trade search — jumps to campaign badge find |

---

## Not built (on purpose, for now)

A “find this orphan’s open” search, or a pick-a-pair control, is **not** in the product. Pairing stays fail-loud and structure-true: same key → pair; different key → orphan, unless you explicitly allow it.

If that find-and-pair sheet is wanted, it is a new design — not a hidden button.

---

## Related

- Spec §16.1 structure matching · §16.5 close save gates  
- Architecture 15 §§4.1–4.3 (structure key, unmatched open, pairing gates)  
- Hold window: 30 days (`MAX_STRUCTURE_HOLD_DAYS` in `web/lib/tradeLog.ts` and the server match domain)  
