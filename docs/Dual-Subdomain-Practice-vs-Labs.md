# Dual subdomain future — Practice vs Labs

**Status:** **Future direction only** — not a current build or cutover  
**Decisions:** DL-248 · DL-249 · DL-250  
**Architecture:** `Architecture/25-dual-subdomain-practice-labs.md`

---

## Why this document exists

Coach is locking **long-term product intent** so Marketplace, Visualize AI, Community, Strategy Lab, and membership work can be **architected with the end state in mind** — without treating the split as something we ship this week.

| This is | This is not |
|---------|-------------|
| North-star structure for **later** | As-built production topology |
| Guidance for Specs and seams | An order to split DNS/nav/plans now |
| Two products + memberships + Community segments | Live separate hosts today |

**Production today:** everything remains on **`labs.fattail.ai`** as a single suite.

---

## Future target (when we implement it)

| Product | Future host | Membership | Job |
|---------|-------------|------------|-----|
| **Practice** | `practice.fattail.ai` | **Navigator** (trader default) | Coaching + trader education suite |
| **FatTail Labs** | `labs.fattail.ai` | **Labs** (own membership type) | Build/deploy bots, marketplace |

| Cohort (at future cutover) | Practice | Labs |
|----------------------------|----------|------|
| **Current Navigators** | Yes | **Grandfathered** — granted a Labs membership |
| **Future Navigators** | Yes | Only if they **purchase** Labs |
| **Labs-only** | No (unless also Navigator) | Yes |

**Community (future):** both products; channels scoped `practice` | `labs` | `shared`.  
**Visualize AI (future):** Practice only.

---

## How to use this while building *current* features

1. Tag Specs with **future home** (`practice` / `labs` / `both`).  
2. Prefer entitlements and plan keys that can split later (do not hard-code “Navigator means forever-all-apps” in new Labs marketplace code).  
3. Leave room for Community channel scope without requiring it live.  
4. **Do not** block current Navigator access to Strategy Lab on today’s system.  
5. **Do not** implement grandfather batch, Labs SKU, or DNS split until Coach opens that program.

---

## One-line summary

**Future: Practice vs Labs as two products/memberships (Navigators grandfathered into Labs once); today: one host, one suite — we only design in anticipation.**
