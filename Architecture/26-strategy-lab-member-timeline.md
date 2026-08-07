# Strategy Lab — Member product timeline (locked focus)

**Status:** **COACH OPERATING LOCK** (2026-08-07) · **DL-251** · **DL-252**  
**Audience:** Coach · Juliet · Alpha/Charlie · membership messaging  
**Parents:** [17-strategy-lab-growth-playbook.md](./17-strategy-lab-growth-playbook.md) · Arch 14–16 · Curate/Deploy Surface Spec  
**Future dual-host (DL-248–250):** independent of this timeline; real-broker provision may later map to Labs membership.

---

## 1. Intent (Coach)

| Track | Focus | Who |
|-------|--------|-----|
| **Member track (now)** | Finish and **lock Design + Curate** | **Current membership** — complete access |
| **Deploy UX** | Members use **all of Deploy** except **real-broker connectivity** | Entitled membership |
| **Gated** | **Tradier** (real broker) — especially **real-money** trading | Admin proves first, then provision |
| **Parallel** | Prove live Tradier rail | **Admin** dogfood |
| **Later** | Open real-broker / real-money Deploy | Designated members |

**Do not** block Design/Curate polish on live Tradier readiness.  
**Do not** open multi-member **real-money Tradier** before Coach has proven that rail.

---

## 2. Life cycle reminder

```text
Design  →  Curate  →  Deploy (full UX)
                      └── real-broker $ (Tradier) gated for members
```

| Phase | Member | Admin |
|-------|--------|--------|
| **Design** | Full access | Full |
| **Curate** | Full access (sim, multi-bot compare) | Full |
| **Deploy product surface** | **Yes** — all Deploy except real-broker / real-money (see §4) | Full |
| **Deploy → Tradier / real money** | **No** until provisioned | Dogfood first |

---

## 3. Track A — Design + Curate for current membership

### Goals

1. **Lock** Design and Curate as the production Strategy Lab experience for entitled members.  
2. Give **current membership complete access** to Design + Curate (plan/entitlement map as today — not the future Practice/Labs split cutover).  
3. Multi-member Curate remains absolute (many bots, comparison, promote readiness).  
4. Quality bar: packs, envelope, version, decision log, shared marks, house designs, performance guards — **ship and stabilize**.

### In scope (member)

- Design: packs, house library, member designs, version bind  
- Curate: instances, ticks, comparison, symbols, vol ref, correlation on demand  
- Honesty: sim fills, proxy labels, no profit theater  
- Export/import of lab process where already specified  

### Out of scope for this track

- Member Tradier OAuth / live or paper Deploy  
- Multi-tenant Deploy workers for non-admin  
- “Everyone goes live” marketing  

### Exit criteria (Design + Curate “locked”)

| # | Criterion |
|---|-----------|
| A1 | Entitled members can complete Design → Curate without staff |
| A2 | Curate never requires Tradier |
| A3 | Comparison / multi-bot path stable under documented budgets (Arch 20) |
| A4 | House designs + mint starters coherent |
| A5 | Member-facing copy: **Design + Curate + Deploy (non–real-money) available; real-money Tradier when rail is ready** |
| A6 | Delta gate / Coach sign-off that Design+Curate are the locked member surface |

---

## 4. Deploy access model (Coach refine · DL-252)

### 4.1 What members get in Deploy

Members use **all of Deploy** that does **not** require **connectivity to a real broker** (Tradier) for **real-money** trading.

Examples of member-available Deploy surface (as implemented / target — non-exhaustive):

- Promote Curate → Deploy phase workflow  
- Deploy board / monitoring / process runtime views (sim or non-broker)  
- Arming ceremony UX **without** live broker bind (or with sim only)  
- Decision log, caps UI, honesty labels  
- Anything that prepares the bot for real-money without placing real-money orders  

### 4.2 What stays gated

| Gated | Detail |
|-------|--------|
| **Real broker connectivity** | **Tradier** connect / OAuth / order path for others |
| **Real-money environment** | Trading the bot with **real capital** — the ultimate purpose of Deploy |

**Admin** continues to develop and dogfood **Tradier** connectivity (paper and live as needed) until the rail is proven; then **provision** real-broker (and real-money) access for designated members.

| May say | Must not say |
|---------|----------------|
| Deploy is available; real-money Tradier is next | “Your bot is trading live money for everyone” |
| Admin is proving live broker first | Guaranteed profits / set-and-forget income |
| Your Curate process is what we will send live | Multi-broker free-for-all |

When future dual-product world ships (DL-250), real-broker provision targets **Labs membership** (purchased or grandfathered). **Until then**, “members” = as-built entitled Strategy Lab users.

---

## 5. Track B — Real-broker Deploy rail (admin dogfood → provision)

### Goals

1. Continue **Tradier / real-broker** Deploy development **without** blocking Track A or member Deploy UX.  
2. Prove end-to-end for **Coach / admin** (paper then live on Tradier per Arch 09/17).  
3. Only after proof: **provision real-broker connectivity** (and real-money) for designated members.

### Access

| Capability | Members | Admin |
|------------|---------|--------|
| Deploy phase UI (non–real-money) | **Yes** | Yes |
| Tradier / real broker connect | **No** until provisioned | **Yes** (dogfood) |
| Real-money orders | **No** until provisioned | Dogfood first |

### Exit criteria (before member real-broker / real-money)

| # | Criterion |
|---|-----------|
| B1 | Admin Design → Curate → Deploy **with Tradier** paper full cycle logged |
| B2 | Prefer: **live money** cycle for Coach once (or written waiver) |
| B3 | Arming, caps, kill path, decision log with broker ack |
| B4 | Written “Deploy real-broker rail validated” (gate report) |
| B5 | Provisioning design: entitlements, Tradier connect, worker isolation |

### Then — Track C (member real-broker Deploy)

- Same Tradier rails as admin dogfood  
- Designated members only (plan flag / Labs membership later)  
- Caps + arming + honesty; expand gradually  

---

## 6. Sequencing diagram

```text
NOW ──────────────────────────────────────────────────────────────►
 │
 ├─ Track A ──► Design + Curate LOCK
 │
 ├─ Track Deploy-UX ──► Members use Deploy **except real-broker $**
 │
 └─ Track B (admin) ──► Tradier / real-money dogfood ──► B1–B5
                                              │
                                              ▼
                         Track C ──► provision real-broker $ to designated members
```

---

## 7. Relationship to dual-subdomain future (DL-248–250)

| Topic | Interaction |
|-------|-------------|
| Practice vs Labs hosts | **Later** cutover; does not pause Track A/B |
| Navigator grandfather Labs membership | Affects **who** gets Deploy later; not admin Deploy dogfood |
| Marketplace | Lane A commercial bots still Design→Curate first; Deploy follows this timeline |

Architect Marketplace and membership **in anticipation** of Labs membership; **ship Design+Curate for current entitled members now**.

---

## 8. Work focus checklist (near term)

| Priority | Work |
|----------|------|
| P0 | Design + Curate bugs, UX lock, house catalog, performance, tests |
| P0 | Member **Deploy UX** without Tradier/real-money bind |
| P0 | Messaging: Deploy available; real-money broker next |
| P1 | Admin **Tradier** path (workers, arming, paper/live) — parallel |
| P2 | Provisioning design for member real-broker (Track C) |
| Later | Dual-host + Labs membership cutover |

---

## 9. One-line summary

**Lock Design + Curate for members; give them full Deploy product surface except real-broker (Tradier) real-money connectivity; admin proves that rail, then provision designated members.**
