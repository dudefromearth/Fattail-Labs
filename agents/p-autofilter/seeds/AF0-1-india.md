# AF0-1 — SUPERSEDED

Do not execute. Active seeds are `TLAF0-*` against Trade Log Autofilter Spec v0.1  
and `docs/Trade-Log-Autofilter-Full-Agent-Bench-Plan-v1.0.md`.

Historical opener (Autofilter Spec v0.2 multi-surface) follows for the archive.

---

# AF0-1 — India Autofilter spec / architecture (v0.2)

**Project:** p-autofilter  
**Agent:** India  
**Gate:** AF0-G  
**Isolation:** read-only. No `web/` or `server/` edits.

**Read:**

- `Specs/FatTail-Labs-Autofilter-Spec-v0_2.md`
- `docs/Autofilter-Full-Agent-Bench-Plan-v1.1.md`
- `Specs/FatTail-Labs-Member-Campaign-Spec-v1_3.md` §9.2
- `Specs/FatTail-Labs-Practice-Context-Spec-v0.2.md`
- `web/components/trade-log/TradeFindTag.tsx`
- `web/components/practice/PracticeContextBar.tsx`
- `web/components/practice/PracticeSuiteChrome.tsx`

**Out of scope:** product code · rewriting Campaign Autofilter · pulling Reports/Capital/Positions into scope.

**Invariants:** spec scope (named surfaces only) · §2.1/§2.2/A17 · §3 one component · **A18 one filtered stream** · read-only · DL-539 as v0.2 states it (naming = authorization; drift = unnamed surfaces).

**Do:**

1. Verdict: **APPROVED** or **RETURNED** for *build readiness* of Spec v0.2.
2. **A18:** how named surfaces stop using `practiceContext` date/campaign as a second client-side filter after cutover.
3. **PracticeContextBar seam:** named surfaces lose date+campaign **buttons** without stripping Playbook/Retro/Symbols. Path + prop. This is engineering, not a second Coach OK.
4. Campaign §9.2: badge tap → Autofilter campaign column; Adhere composition is a keep.
5. Column-definition API. Flag Trade Log whole-block grain vs Find and Badge rows.
6. Confirm Alpha is idle. If not, stop AF1.
7. Confirm Reports is **out** unless Coach names it. O1 must not smuggle it.
8. Flagged ideas beside Coach OPEN items. Do not delete spec text.

**Done when:** `agents/p-autofilter/reviews/AF0-1-india.md` with verdict, A18, seam, §9.2, Alpha idle/not, Reports-out.
