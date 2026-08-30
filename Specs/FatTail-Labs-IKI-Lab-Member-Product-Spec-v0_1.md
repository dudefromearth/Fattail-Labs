# FatTail Labs — IKI Lab Member Product Spec v0.1

**Status:** **BUILD AUTHORITY** (Coach plan stamp 2026-08-28)  
**Addendum to:** IKI Lab + Factory suite spec v0.1.2 (chrome/naming) · Identity-Access v1.0  
**Does not reverse:** **DL-540** (IKI does not mint identity) · OPF Truth / market bus · Factory/Runner admin-only

---

## 0. Coach intent

Two IKI Lab suite pages for members who purchase the **IKI Lab** subscription on
FatTail.ai WooCommerce:

| Page | Job |
|------|-----|
| **Your Lab** | The member’s subscribed IKI products, as an IKI **Heatmap** (version of Options Lab Heatmap) |
| **Analyzer** | IKI **Analyzer** — version of Options Lab Analyzer (`OpfRiskAnalyzer`). Not `/app/options-lab/analyzer` |

**First catalog SKU (DL-607):** Woo product **IKI Lab** already exists on
**fattail.ai**. Existing fotw-sso SSO (`wordpress:fattail`) is the bridge. JWT
`membership_plans` for that purchase map to Labs plan `iki-lab`. That owned
product is the first Your Lab dropdown item.

IKI Lab purchasers see **Your Lab** and **Analyzer**. Observer / Activator /
Navigator **without** that product do **not**. **Admins** see the new pages and
the rest of Labs.

---

## 1. Entitlement

**IKI Lab is a plan, not a role.**

| | |
|--|--|
| Labs plan slug | `iki-lab` |
| Name | IKI Lab |
| `grants_role` | `observer` (does **not** elevate Navigator tools) |
| Access test | Plan **present** (`active`/`grace`, unexpired) **or** administrator |
| Combinable | Navigator + `iki-lab` → full Labs **and** Your Lab / Analyzer |
| IKI-only | Sole commercial plan is `iki-lab` → product shell (§2) |
| Role ladder | Unchanged. Do not add `iki-lab` as a fifth role |
| Woo / SSO | Product **IKI Lab** on fattail.ai. Provider `wordpress:fattail`. Map keys `iki-lab`, `iki-lab-access`, `iki-lab-membership`. Name “IKI Lab” → `iki-lab` via entitlement candidates. |

**DL-540:** pages consume membership. IKI does not implement SSO (fotw-sso already does).

`iki-lab` is **not** in Access Control commercial expansion (`expand_plans`).
Observer-trial does not imply IKI Lab.

---

## 2. Product shell (IKI-only)

| May use | Must not use |
|---------|----------------|
| `/app/iki/about`, `/catalog`, `/your-lab`, `/analyzer` | Practice, Trade Log, Journal, Options Lab, Strategy Lab, Wiki `/app/wiki`, Factory, Runner, course player |
| Header: those four labels | Courses / Apps / Resources / Live / Guide as today |
| `/me`, `/settings`, logout | Other Apps cards |

Landing: `/app/iki/about`. Logo → About. Server should deny non-IKI app APIs in a
follow-on if chrome-only is insufficient; first ship: chrome + page guards +
`/api/auth/me` flags `iki_lab` / `iki_lab_only`.

---

## 3. Suite nav

| Audience | Pills |
|----------|--------|
| IKI Lab subscriber | About · Catalog · **Your Lab** · **Analyzer** |
| Admin | Factory · Runner · About · Catalog · **Your Lab** · **Analyzer** |
| Other members | About · Catalog |

| Page | Path | Body |
|------|------|------|
| Your Lab | `/app/iki/your-lab` | `IkiSuiteChrome` workspace + **reuse** `HeatmapChainPanel`. `OptionsLabProvider`. Not a forked heatmap. Not IKI Runner. |
| Analyzer | `/app/iki/analyzer` | `IkiSuiteChrome` workspace + **reuse** `OpfRiskAnalyzer`. OPF only. |

Your Lab product dropdown lists owned products. First SKU: **IKI Lab** (Woo on
fattail.ai). Later Factory-published items append to the same dropdown.

Market: one `MarketSocket` / tab. No per-widget Massive. OPF Truth (DL-309) on Analyzer.

---

## 4. Isolation

Factory/Runner stay administrator. Options Lab Heatmap/Analyzer for OL members
unchanged. No Journal/Records. No dual-host cutover.

---

## 5. Acceptance

| # | Expect |
|---|--------|
| N1 | Admin suite nav includes Your Lab and Analyzer; Heatmap and OPF Analyzer mount |
| N2 | Practice login (no `iki-lab`) has no those pills; routes forbidden |
| N3 | `iki-lab` only: header is the four IKI pages; `/app/trade-log` redirects to About |
| N4 | `/api/auth/me` has `iki_lab` / `iki_lab_only` |
| N5 | Plan `iki-lab` exists; `wordpress:fattail` maps `iki-lab` (and access/membership aliases) |
| N6 | `expand_plans` does not add `iki-lab` |

---

**Coach Content Law:** First Woo product is **IKI Lab** on fattail.ai (**DL-607**).
Further Factory SKUs wait on Conor’s publish path.
