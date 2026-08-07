# C0-1 — India residual architecture stamp

**Agent:** India  
**Date:** 2026-08-06  
**Depends on:** C0-0 PASS · Spec **v1.0.2** BUILD AUTHORITY · DL-237–240 · Mike C0-3 PASS  
**Verdict:** **APPROVED**

---

## 1. Checklist (seed)

| # | Requirement | Verdict | Evidence |
|---|-------------|---------|----------|
| 1 | Dual SoR intact (Discord chat / Labs bots) | **PASS** | Spec §1.3: guild text SoR = Discord (**FatTail AI**); house bots + member shares + channel map SoR = Labs; connect/name SoR = fattail.ai WP (DL-240) |
| 2 | B1 date-aware reconcile binding | **PASS** | DL-238; Spec §6.6.2 · §8.1 C-D-3 · §8.6; Mike C0-3 §5 hybrid (WP primary writer + Labs safety-net sweep) |
| 3 | R1–R4 in Spec | **PASS** | R1 §6.6.1 backfill · R2 §6.7 event matrix · R3 §8.5 platform · R4 §6.8 mod workflow |
| 4 | No MSC product-boundary leak | **PASS** | Doctrine + Spec header: standalone repo, API/JWT contracts only; bridge is Labs-owned Discord API; MSC docs used for **WP inventory reference only** (Mike C0-3), not shared code |
| 5 | Family B on member bot shares | **PASS** | §7.2 opt-in publish · §7.3 Apply → recipient Family B only · §11 snapshot-not-live-window · success criterion 10 · mint not auto-share §7.4 |

---

## 2. Dual SoR integrity (detail)

| Concern | SoR | Drift risk | Status |
|---------|-----|------------|--------|
| Mapped channel chat | Discord | Labs-only history | Forbidden by §2.2 / §6.6.1 (no invent local-only) |
| House bots / versions | Labs | Discord as design SoR | Forbidden §2.2 |
| Member shares | Labs snapshot | Live Family B window | Forbidden §11.2 |
| Member connect + Discord name | fattail.ai WP plugin | Labs-primary OAuth | Forbidden DL-240 / C-D-0 |
| Entitlement (who is paid) | Labs memberships | Trust Woo/Discord alone for date expiry | Forbidden DL-238 |

v1.0.2 correctly **extends** dual SoR with WP connect without collapsing Discord chat SoR or Labs bot SoR. Mike C0-3 executor design is **compatible**: WP commerce roles + Labs reconcile does not invent a third SoR for guild **text**.

---

## 3. India prior CONDITIONAL GO — closure confirmation

| ID | Closed in Spec? |
|----|-----------------|
| B1 date-aware revoke | §6.6.2 + DL-238 |
| R1 gap-heal | §6.6.1 |
| R2 event matrix | §6.7 |
| R3 platform prereqs | §8.5 (member connect vs bridge split in v1.0.2) |
| R4 hold ≠ Discord delete | §6.8 |
| D2 dual DL-236 | Community = DL-237; Visualize = DL-236 |
| D3 Observer term | 6 weeks (DL-128) cited in §6.6.2 |

No re-open of B1/R1–R4. Coach Phase 5 (DL-239) remains build authority; v1.0.2 is an **additive** connector amend, not a scope rewrite.

---

## 4. Residual drift found & folded (same-day)

| Location | Issue | Action |
|----------|-------|--------|
| Spec §2.1 “User sync \| OAuth link…” | Contradicted DL-240 / §8.0 | **Folded** → WP connector ingest + WP/Labs role split |
| Spec §10 “Discord role assignment \| System from Labs membership” | Understated WP primary executor (Mike C0-3) | **Folded** → WP primary + Labs reconcile |

These were wording integrity, not architectural return. Document control row added under v1.0.2.

---

## 5. Product boundary & Family B (build rules for Alpha)

1. **No** MarketSwarm-Canonical imports, vendored bots, or copied MSC Discord code — HTTP Discord API + WP JWT only.  
2. **community_bot_shares** store snapshots; Apply forks into recipient-owned Strategy Lab state — never a pointer into publisher’s live bot.  
3. House catalog projection is Labs SoR (DL-235); Community shelf must not allow member delist.  
4. Schema for C1a+ must trace to Spec §4 (channels, messages, shares) — migration without Spec basis = block at implement review.

---

## 6. Flagged ideas / residuals (non-blocking)

| Item | Status |
|------|--------|
| Ideas inventory §2.3 | **Intact** — no silent drops |
| Mike operator residual (live fattail guild id, connect URL, fotw-sso claims) | **Ship evidence** for C1b, not architecture RETURN |
| Architecture/06 reconcile evidence | Deferred to implement gates (Spec already points there) |
| Optional `Architecture/21-community.md` | Not required for C0-1; Lima may add at C1a |

**Inventory intact.** Nothing FLAGGED that changes v1 dual SoR.

---

## 7. Bench delta (durable)

1. This gate report locks residual **APPROVED** architecture for C0-G.  
2. Spec §2.1 / §10 wording now matches DL-240 (no OAuth-link drift).  
3. Explicit alignment: **Mike C0-3 hybrid role model** is architecture-compatible with DL-238.

---

## 8. Verdict

**APPROVED** — architecture is build-ready for Community Spec v1.0.2 under Agent Bench sequencing (C0-G still required for program lock; C1a may not start until C0-G or Coach waive).

India does **not** reopen CONDITIONAL GO. B1 and R1–R4 remain closed. DL-240 dual-SoR extension accepted.
