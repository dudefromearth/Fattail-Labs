# Bot Marketplace — how it works

**Spec:** `Specs/FatTail-Labs-Bot-Marketplace-Framework-Spec-v0.1.md` (v0.1.2)  
**Decisions:** DL-243 · DL-244 · DL-247 · DL-248 · DL-249 · **DL-250**

---

## Purpose

**Primary:** **Monetize FatTail Lab Bots** under a **separate Labs membership product** (DL-250). Admins define official bots; customers with **Labs membership** (purchased or **grandfathered**) receive and run those bots in Strategy Lab.

**Secondary:** Labs members may **limited-share** process packages with other Labs members.

**Navigators (future):** Practice coaching suite only — **must purchase Labs** to get Marketplace/Strategy Lab.  
**Navigators (current at cutover):** **Grandfathered** via a **granted Labs membership** so they keep bot access.

**Future hosts (DL-248/249/250 — intent only, not current build):** marketplace + Strategy Lab → **`labs.fattail.ai`** under a **separate Labs membership**; Navigators + Visualize AI + education → **`practice.fattail.ai`**. **Today:** single host `labs.fattail.ai`; Navigators still use the unified suite until a future cutover.

There is **no free public bot store** and **no in-app card payments**. WooCommerce sells memberships; Labs **entitles and provisions**.

---

## Two lanes

### Lane A — Commercial (main path)

```text
Admin publishes FatTail Lab Bots (versioned catalog)
        +
Customer purchases Labs subscription (WooCommerce)
        →
Labs membership unlocks offered bots
        →
Member Apply / provision → Strategy Lab Curate
        →
Deploy later only via normal Strategy Lab rules
```

- Official catalog is **admin-only** to create and version (house / FatTail Lab Bots).  
- Which bots you get is driven by **plan / subscription** (offer map), not by chat luck.  
- Cards stay **process-first** — no P&L leaderboards or profit guarantees.

### Lane B — Peer (limited)

```text
Labs member packages bots from Curate
        →
shares only with other Labs members (limits apply)
        →
peer Imports into their Curate as drafts
```

- Not for Practice Navigators.  
- Does **not** put a member bot into the **official commercial catalog**.  
- Same trust rules: strip live money state, validate pack config, house provenance when relevant.

---

## What members experience

| Who | What they get |
|-----|----------------|
| **Labs membership** (bought or grandfathered) | Entitled **FatTail Lab Bots** + optional peer packages |
| **Future Navigator** (no Labs membership) | **Practice** only — no Marketplace |
| **Current Navigator at cutover** | Practice + **Labs membership grant** (grandfather) |
| **Observer trial** | Practice parity (6 weeks) — Labs only if plan bundles it |
| **Admin** | Catalog publish / plan binding |
| Free no-plan | No commercial bot provision |

---

## What it deliberately avoids

- OA-style public clone casino  
- Performance rankings or win-rate shelves  
- One-click **live Deploy** from the Marketplace  
- Labs taking payment directly  

---

## One-line summary

**Marketplace sells and delivers official FatTail Lab Bots to Labs subscribers; Labs members may lightly peer-share packages; Navigators live on Practice with full coaching — everything bots-related lands in Curate first.**
