# Architecture Audit Snapshot — 2026-07-23

**Scope:** As-built `server/` + `web/` on `main` (post AI workbench commit)  
**Method:** Code inventory (routes, migrations, app pages, libs), cross-check against
`Specs/`, decision log, charters, and `docs/P1-Foundations-Review.md`  
**Purpose:** Drive retroactive architecture docs (01–06) and list residual gaps

---

## 1. Executive summary

| Area | Assessment |
|---|---|
| **Platform spine** | Strong — standalone FastAPI + MySQL + Next, clear product boundary |
| **Domain coverage** | Broad mid-product — courses, live, resources, pathway, social, billing hooks, hub CMS |
| **Spec density** | Excellent (~39 feature specs) — rare and valuable |
| **Architecture narrative** | Was thin (decision log only) — **this pack fills 01–06** |
| **Auth model** | Labs-native + pluggable providers — correct evolution from WP-first |
| **Admin UX** | In-place editing is coherent; `/admin` is a thin hub |
| **P2 readiness** | Agent model interface + workbench landed; backlog DB / agent principals open |
| **Verification** | Characterization suite real; browser AI e2e optional with keys |

**Bottom line:** The codebase is a real, sellable membership education platform. The
main historical gap was **as-built architecture documentation** lagging behind
feature specs. Feature specs remain authoritative for behavior; Architecture now
describes system shape.

---

## 2. Inventory (measured)

| Asset | Count / note |
|---|---|
| SQL migrations | 15 (`001`–`015`) |
| API route modules | 15 under `server/routes/` |
| Server Python (approx) | ~9k lines across server tree |
| Web app pages | 19 `page.tsx` routes |
| Web components | ~44 top-level + subfolders |
| Specs | ~39 markdown contracts |
| Characterization tests | 97+ passed in suite (with AI skips when no key) |
| Bench agent charters | Platform + studio + lineage + Quebec |

---

## 3. What is solid

1. **Config fail-loud** on structural secrets/ports/DB  
2. **Migration discipline** and domain growth without monorepo MSC  
3. **Public/member split** with SSG + cookie-forwarded gated lessons  
4. **Server-built YouTube embeds** (injection boundary)  
5. **Identity/providers split** (`identity.py` vs `providers.py`)  
6. **In-place admin** reduces dual-UI drift  
7. **Live category as audience contract** (agent-ready domain language)  
8. **Test suite** as characterization net, not vanity coverage  
9. **Agent model interface** with Grok primary and admin browser path  

---

## 4. Gaps & risks (ordered)

| Severity | Gap | Recommendation |
|---|---|---|
| **High (P2) → mitigated Phase B** | No durable content backlog / production board in DB | **Shipped:** Kanban board + content_items lifecycle (Board Spec v1.0) |
| **High (P2) → mitigated Phase A** | Agent actions used only admin session | **Shipped:** agent principals + scoped API keys + actor_events (Identity Spec v1.0) |
| **Medium** | Connection-per-transaction (no pool) | Monitor; pool if needed |
| **Medium** | YouTube gated-video leakage | Accept until CDN project |
| **Medium** | WP SSO production dependency | Keep native login; finish WP endpoints |
| **Medium** | Orchestrator boards can go stale (P1 folder) | Prefer charters + Architecture for truth |
| **Medium** | No durable AI prompt/audit log | Add with P2 audit spine |
| **Low** | `/admin` still thin | Intentional; expand only as operator hub |
| **Low** | Frontend visual regression suite absent | Echo process + selective Playwright |
| **Low** | `web.zip` untracked artifact in workspace | Delete or gitignore |

---

## 5. Doc debt closed by this pack

| Before | After |
|---|---|
| Decision log only under `Architecture/` | Full 01–06 as-built design set + this audit |
| New agents read CLAUDE + 30 specs to understand shape | Start at `Architecture/README.md` |
| P1/P2 charters without system map | Charters link into Architecture + capabilities |

**Still open (product, not docs):** P2 pillar implementation, agent credentials, backlog
schema, production AI audit tables.

---

## 6. Suggested reading order for new engineers / agents

1. `Architecture/01-system-overview.md`  
2. P1 charter → P2 charter (if content/ops)  
3. `02-backend-design.md` + `03-frontend-design.md`  
4. `04-domain-data-model.md` + `05-security-and-access.md`  
5. Feature **Spec** for the surface you touch  
6. `00-decision-log.md` for “why”  

---

## 7. Audit method limits

- Did not re-run production deploy or live MiniTwo probes in this pass  
- Did not re-execute full Playwright against live Grok (requires keys + running pair)  
- Did not line-audit every admin field allowlist vs UI (rely on specs + tests)  
- Security section is engineering posture, not a formal pen-test  

---

*Next architecture amendments should be incremental with the code they describe —
not another big-bang rewrite unless the topology changes.*
