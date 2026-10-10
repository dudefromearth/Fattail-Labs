# Links — Owned Short Links with Scan/Click Tracking and Attribution in FatTail Labs — Spec v0.4 (LK-1.2 — as-built close-out, Phase 1)

**Version:** v0.4 as LK-1.2 (stamped `LK-1.md` plus the LK-L4 clarification in `LK-1.1.md`, plus this as-built record)
**Supersedes:** `Specs/LK-1.1.md` (stamped baseline; its bytes are unchanged and it stays on disk) for *current state*. `LK-1.1` remains the law text of record for anything this file does not explicitly amend.
**Date:** 2026-10-10
**Machine:** Built and proven directly on StudioTwo; promoted to MiniTwo (production, `labs.fattail.ai`). Phase 1 is live.
**Status:** **AS-BUILT.** This file records what Phase 1 actually is today, closes the one open gate finding, and names what the original W-gate process did and did not end up tracking. It is not a new law catalogue — amendments are called out individually against LK-1.1.
**Series ID:** LK-1.2 — continues the LK-1 series.
**Canonical filename:** `Specs/LK-1.2.md`

**Parents (cited, not amended):** `Specs/LK-1.md` (stamped baseline, `Specs/LK-1-STAMP.md`), `Specs/LK-1.1.md` (LK-L4 clarification).

---

## §1 Why this file exists

`LK-1.1` describes a build process — Alpha/Charlie/Kilo seats, Delta-reviewed W-gates, Grok Advisor rounds — that Phase 1 stopped following partway through. W0, W1, and W2 ran through that process and have filed gate reports. Everything after that — the rest of W2's actual fix, all of W3 (the admin app), W4 (Coach's live acceptance), and W5 (promotion to MiniTwo) — happened directly: Coach and Claude, in one continuous working session, building a change, testing it live on StudioTwo, deploying it to MiniTwo, and verifying it live, repeated roughly a dozen times. No seat boundaries, no Delta review, no Grok Advisor round.

That's not a process failure to paper over — it worked, it shipped a real, tested, in-use feature faster than the gate process would have, and Coach was the actual reviewer and approver of every revision, which is what the gates exist to guarantee anyway. But the paper trail stopped matching reality, and `agents/p-links/gate-reports/W2-G.md` actively says something false (NO-GO) about a defect that's been fixed for several revisions. This file fixes the paper trail.

---

## §2 Closing W2-G — RD-L3 amended

**Finding (W2-G, filed):** the redirect route took the visitor's address from the client-supplied `X-Forwarded-For` header. A visitor could set that header themselves and choose the country/region written on the event. **Verdict was NO-GO.**

**Fix, shipped and verified live on `labs.fattail.ai`:** `web/app/q/[slug]/route.ts`'s `peerAddress()` now prefers `CF-Connecting-IP` — set authoritatively by Cloudflare's edge on every request (production sits entirely behind a Cloudflare Tunnel; the client cannot set or override this header, Cloudflare overwrites it) — and falls back to `X-Forwarded-For` only when no Cloudflare is in front (StudioTwo, local testing). Verified: a real scan through the public domain correctly resolved to a real country/region; a forged `X-Forwarded-For` alongside a genuine `CF-Connecting-IP` was ignored in favor of the trustworthy header.

**RD-L3 is amended:** "The raw IP" now means, in order of preference: `CF-Connecting-IP` if present and non-empty, else the first entry of `X-Forwarded-For`. Everything else in RD-L3 (one lookup, discard after, country+region only) is unchanged.

**W2-G verdict is superseded: GO**, on the evidence above. The original `W2-G.md` is left on disk unedited, as the historical record of the finding; this section is the closing record.

---

## §3 Process note — what actually ran, and what to do next time

For the remainder of Phase 1 polish on this app (bug fixes, UI/reporting improvements, anything that doesn't touch the auth boundary on the public route or leave the Labs host), **continue the direct-iteration pattern**: build on StudioTwo, verify live with real requests (not just unit-level checks), get Coach's explicit go, commit only the touched files to `main` (the working tree on both machines carries large amounts of unrelated in-progress work that must never be swept into a Links commit — every revision so far has been staged by hand, file by file, for exactly this reason), deploy to MiniTwo the same session, verify live again.

**Reserve the heavier W-gate/seat process for anything that is Phase 2+ in kind**, even if it ships small: reading a Labs session on the public route (P2-R1), any new WordPress/WooCommerce tree (Phase 3), anything that moves money or changes member entitlements. Those are exactly the cases the gate process's "never auto-GO" / "own three-OK" language was written for, and this session's track record of fast, safe iteration does not extend to that risk class without more deliberate review. See `Specs/Links-Attribution-Affiliates-Spec-v0_1.md`, companion to this file, for the first such case.

W0, W1, and W2's gate reports stay on disk as the record of what *was* formally gated. W3, W4, and W5 have no gate reports; §4 of this file is their record instead.

---

## §4 As-built inventory — everything Phase 1 is today

Shipped, live on `labs.fattail.ai`, admin-only at `/admin/links`:

**Core (W1–W2, as specced):** link store (C1); event store (C2); public redirect `/q/<slug>`, 302-only, no-store headers, destination fence (C3); QR renderer, SVG/PNG, contrast-checked, self-decoded before serving, optional FatTail-mark logo forcing level H (C4); geo lookup against a **real MaxMind GeoLite2-City database** (not a placeholder — `~/GeoIP/GeoLite2-City.mmdb` on both machines, licensed, monthly auto-refresh via `geoipupdate` under a new launchd job `ai.fattail.labs.geoip-refresh` on both StudioTwo and MiniTwo) (C5).

**Admin app (W3, built past what any plan version bound an allowlist for):**
- Create / edit / deactivate / reactivate a link; destination, label, and the four placement fields (`source`, `medium`, `campaign`, `placement` — present and optional, per LK-L1, unchanged from Phase 1 law).
- QR downloads: plain SVG, plain PNG, and a composited **"QR with label" card** (the law-bound renderer in `links/qr.py` is untouched; the label band is drawn at the admin layer, PIL, after the payload is rendered and decode-verified).
- Reporting: total scans / camera-scan / link-click stat tiles (bots excluded, all-time); a date-range selector (7d / 30d / 90d / All, **default 7d**) driving a **fixed, zero-filled calendar-grid** over-time chart (not just whatever days happen to have events) with **date-axis labels** (~6 evenly spaced regardless of window length); top-10 panels for OS, device, country, region, and **traffic source** (a new dimension beyond the original spec — referrer normalized to a domain, e.g. `instagram.com`, or "Direct / camera scan"), each with a **"View all N →"** drill-down to a dedicated ranked page when there are more than 10.
- CSV export, **tied to the same date-range selector** as the chart (not always full history).
- **Recent-scans table paginated at 10 rows**, Previous/Next, resets to page 1 on a date-range change.
- **List page**: search (label/destination substring), status filter (all/active/inactive), **campaign filter** (including "no campaign"), campaign shown as a badge per row, row checkboxes with "select all on this page," **bulk activate/deactivate**, and its own **10/25/50-per-page** pagination (default 10).
- **Live update**: both the list and the detail/report page poll every 5 seconds (paused when the browser tab isn't visible) so scan counts and the chart update without a manual refresh; never disturbs an in-progress edit in the form.
- A dev-only (`LABS_ENV=dev`-gated, 404s elsewhere) scannable QR pointing at the caller's own network address, used to verify the full pipeline on StudioTwo before promotion — removed from the UI once Phase 1 was confirmed working end to end; the backend endpoint is left in place, unreferenced, for the next time it's useful.

**Not yet built, named as near-term roadmap, not re-scoped into this file:**
- Bot-catalogue visibility — bot-flagged events are stored and correctly excluded from every count (D4, unchanged), but nothing in the admin UI shows *how many* were excluded. Agreed as worth adding.
- Alerts (Phase 4 territory, e.g. "zero scans N days after a link went live," "sudden spike") — agreed as worth adding, not yet scoped.
- The W6 close-out artifacts LK-1.1 names and this session never produced: the disclosure paragraph for fattail.ai (RD-L3 requires one exist; none has been drafted or placed), a DL-### decision-log entry, an architecture-doc amendment documenting the new public route, and a Lima Help-doc check.

---

## §5 Deploy reality — a gap in `infra/deploy.md`, named not fixed here

`infra/deploy.md` documents `git pull origin main` as the production deploy step. That does not match MiniTwo's actual git state: its `main` branch carries its own uncommitted, unrelated in-progress work (an access-log middleware, Help/AI and journal-session changes, several `.bak.*` files) and, at one point this session, two locally committed-but-never-pushed commits. A plain `git pull` risks either a merge conflict against that WIP or silently publishing those unpushed commits to `origin/main` as a side effect — neither acceptable to do unprompted.

Every deploy this session instead used a **surgical per-file checkout** (`git checkout origin/main -- <exact paths>`, never a merge) after confirming on disk exactly which files a revision touched, leaving the rest of MiniTwo's tree exactly as dirty as it already was. This worked, but it is undocumented process living only in this chat. It is **not amended into `infra/deploy.md`** here, because that file is wider than this app and its own drift is Coach's call, not something to silently rewrite from inside a Links spec. Flagged for Coach; worth its own fix.

---

## §6 Scope note — campaign fields are Phase 1, not a quiet Phase 2

LK-L1 names `source`/`medium`/`campaign`/`placement` as "present but optional" in Phase 1. The list page's campaign filter, badge, and bulk actions are a *view* over fields the law already allowed to be written and read in Phase 1 — no new field, no enforcement, no `owner` activation, no member-identity read on the public route. **True Phase 2 territory (P2-R1 member identity, P2-R2 deep links, P2-R4 channel/orders report) remains not authorized** and untouched.

---

## §7 Traceability

| Area | LK-1.1 | LK-1.2 |
|---|---|---|
| RD-L3 peer address | client-supplied `X-Forwarded-For`, trusted | `CF-Connecting-IP` preferred (Cloudflare-authoritative), `X-Forwarded-For` fallback for non-Cloudflare paths |
| W2-G | NO-GO (filed) | **superseded: GO**, evidence in §2 |
| Geo database | Q2 ruled "local MaxMind GeoLite2," not yet installed | installed, licensed, both machines, monthly auto-refresh |
| Admin app | scoped (AD-L1…L5), not built in LK-1.1 | built; see §4 for the full, larger-than-originally-scoped inventory |
| Process | Alpha/Charlie/Delta/W-gates assumed throughout | ran through W2 only; W3–W5 ran as direct Coach↔Claude iteration (§3) |

Nothing dropped.

---

*LK-1.2. As-built record, 2026-10-10. Does not reopen BUILD AUTHORITY questions — Phase 1 was authorized at the LK-1 stamp and stays authorized. Phases 2–4 remain not authorized by this file.*
