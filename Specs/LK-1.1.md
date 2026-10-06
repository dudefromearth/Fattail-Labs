# Links — Owned Short Links with Scan/Click Tracking and Attribution in FatTail Labs — Spec v0.4 (LK-1.1 — LK-L4 clarification; Phase 1 BUILD AUTHORITY)

**Version:** v0.4 as LK-1.1 (stamped LK-1 plus Coach's LK-L4 clarification 2026-10-05; no other law changed)
**Supersedes:** `Links-Spec-v0_3.md` (GO for intake), `Links-Spec-v0_2.md` (GO), `Links-Spec-v0_1.md` (DRAFT, NO-GO) and `QR-Links-Spec-v0_3.md` (DRAFT; Grok Advisor NO-GO rounds 2026-10-04 closed F1, F2, F4, F5, R2, R3 — those laws carry over here verbatim under new IDs, see §10). QR-Links v0.1–v0.3 stay on disk as baselines.
**Date:** 2026-10-04
**Machine:** Build and prove on StudioTwo (dev); promote to MiniTwo (production, labs.fattail.ai) once proven. Specification only; files/trees touched by this document: NONE.
**Scope:** One service — a table of links FatTail owns, a public redirect that logs every pass-through, and reporting on top — delivered in phases. **Phase 1 is the QR front-end** (admin creates links, renders them as QR, sees scans). Phases 2–4 (placements and member identity; attribution to WooCommerce orders, partner and affiliate links; threshold alerts and responses) are scoped here so Phase 1 stores nothing it would have to throw away, but they are **not authorized by this version**.
**Touches outside the new app (Phase 1):** one public, unauthenticated route on the Labs host (the redirect) — if the host's auth middleware is global, exempting `/q/` is an auth-tree touch raised at W0-G; the Labs app registry (one admin-role entry); the instrumentation store if events are written there (Q4). Phase 3 adds a WordPress tree on fattail.ai (order marker, affiliate ledger) and is a separate three-OK when it is authorized. Trees are a hypothesis until W0.
**Status:** LK-L4 clarification of stamped LK-1. **BUILD AUTHORITY: Phase 1**, by Coach's stamp of `Specs/LK-1.md` on 2026-10-05, recorded in `Specs/LK-1-STAMP.md`. This file is the law the build follows. `Specs/LK-1.md` stays the stamped baseline and is not edited.
**Series ID:** LK-1.1 — seated 2026-10-05. Supersedes `Specs/LK-1.md` (stamped 2026-10-05; that file's bytes are unchanged). Source draft `Specs/Links-Spec-v0_4.md` unchanged.
**Canonical filename:** `Specs/LK-1.1.md`

**What changed LK-1 → LK-1.1**

| Area | LK-1 | LK-1.1 |
|---|---|---|
| LK-L4 | "default H with a center logo" and "off by default" in the same sentence | Error-correction is selectable (L/M/Q/H). A center logo forces level H. The center logo is OFF by default. The FatTail mark is the only stock option, applied only when an admin turns it on (ruled Q5). The quiet zone, contrast check, and self-decode clauses are unchanged. |
| Every other law | as seated | unchanged from LK-1 |
| Authority | awaiting stamp | Phase 1 BUILD AUTHORITY by the stamp of `Specs/LK-1.md` recorded in `Specs/LK-1-STAMP.md` |

**Parents (cited, not amended):** Labs app registry and role ladder; Labs instrumentation (`page_views`, admin Flow / Users); Labs data-serving rule (one document per thing, updated in place, age visible); TOPO-1 (not engaged — no market data); WooCommerce membership site on fattail.ai (Phase 3 only; as-built, Pauline/Conor to cite the order-meta pattern at that phase's W0).

**Framing:** a conventional Labs app, not an Agent Spaces instance (D1).

---

## §1 Purpose

A link FatTail prints, posts, mails, or says on air should keep working when its destination changes, and every pass-through should be countable and, where it honestly can be, attributable: to a placement (which flyer, which video, which partner page), to a member when the click comes from someone logged into Labs, and — in Phase 3 — to an Observer order. A QR code is one way to print a link. Clicks are not the measure; Observers per channel is, and that number does not exist today.

Phase 1 delivers the QR front-end on the full link model so that nothing is rebuilt later.

---

## §2 Phases

| Phase | Delivers | Authorized by |
|---|---|---|
| **1 — QR front-end** | Link store with placement fields present but optional; public redirect with scan log; QR renderer; admin app (create, edit destination, deactivate, scan history, export) | this spec, on Coach's stamp |
| 2 — Placements and members | Source/campaign on every link; link-per-placement discipline; member identity on events from logged-in Labs sessions; deep links into Labs apps; date-ruled destinations; channel report | a v1.x amendment after Phase 1 is live |
| 3 — Attribution and affiliates | First-touch marker carried to the WooCommerce order; orders-per-link report; partner and member referral links; affiliate ledger hooks (ledger itself lives in WooCommerce) | its own spec; new WordPress tree; three-OK |
| 4 — Alerts and responses | Threshold rules on the event store (spikes, silence, firsts, milestones); notification channels; a response mechanism that can act on a link (swap destination, deactivate, notify a person) under rules in v1 and under an agent later | a v1.x amendment; its own W0 for the notification channel and the response allow-list |

Phase 1 stores every field Phase 2 and 3 will read, empty where not yet used, so no migration rewrites history. Phase 1 shows none of the later UI, and shows no number it cannot yet support (LK-L5).

---

## §3 Dependency gates

| Gate | What it is | Scope | State |
|---|---|---|---|
| G-0 | W0 census: app-registry pattern; auth middleware path, global vs per-route, routes already exempt; admin shell; instrumentation schema | All | Not run |
| G-A | Coach Phase-5 stamp (BUILD AUTHORITY) for Phase 1. Coach gate | All | Pending |
| G-H | Q1 — short-link host | W1 | **Closed 2026-10-04: `labs.fattail.ai/q/…`** |
| G-S | Q4 — event store | W1 | **Closed 2026-10-04: the app's own store** |
| G-L | Q6 — location granularity and disclosure | W1 | **Closed 2026-10-04: country + region, no city; disclosure page on fattail.ai** |
| G-G | Q2 — geo source | W2 | **Closed 2026-10-04: local MaxMind GeoLite2 database** |
| G-I | Q3 — IP retention | W2 | **Closed 2026-10-04: not stored** |
| G-D | Admin mockup approved (bench UX seat) | W3 | Not started |
| G-P | W4-G GO with evidence; rollback named. Coach gate | W5 | Pending |

Nothing dispatches until G-0 and G-A are GO. G-H, G-S, G-L, G-G, G-I are closed; G-D (mockup) remains for W3. Coach gates: G-A, G-P, W4-G, W5-G — never auto-GO.

---

## §4 Law catalogue

### Link model (LK)

**LK-L0 — Host (ruled Q1).** Every link's short URL is `https://labs.fattail.ai/q/<slug>`. This is printed and does not change.

**LK-L1 — One link, many renderings.** A link record holds: slug; destination URL; label; active flag; created/updated; **placement fields** (`source`, `medium`, `campaign`, `placement` — free text, optional in Phase 1); **owner** (`partner` / `member` id) — **present and not settable in Phase 1**: no form, API, or import writes it until Phase 3; design settings for the QR rendering. The QR image, a plain short URL, and (Phase 2) a deep link are renderings of the same record. Changing the destination changes nothing about any rendering.

**LK-L2 — Slug.** Length 6 over `23456789abcdefghjkmnpqrstuvwxyz` (31 symbols; no 0/1/i/l/o); generated; unique; editable before first event, frozen after.

**LK-L3 — Static QR is honest.** A QR may be generated static (image encodes the destination). Stored and labeled "static — not tracked"; no count is ever shown for it.

**LK-L4 — QR image.** Server-rendered SVG and PNG. Error-correction level is selectable (L/M/Q/H); whenever a center logo is applied the level is forced to H. The center logo is OFF by default; the FatTail mark is the only stock option, applied only when an admin turns it on (ruled Q5) — with quiet zone; colors with a contrast check that refuses unscannable combinations; every rendered image is decoded by the server's own decoder before it is offered (AT-2).

**LK-L5 — No number without a basis.** Phase 1 shows scans (bots excluded), last scan, and a 30-day sparkline. It shows no "unique," no "conversions," no "orders," and no channel comparison until the phase that earns them is live. Geo is labeled "approximate (IP-based)."

**LK-L6 — Deactivate, never delete.** Inactive links serve a plain "no longer active" page; history is kept.

### Redirect (RD) — carried from QR-Links v0.3, reviewed

**RD-L1 — Public, fast, never cached.** `GET /q/<slug>`: no login, no Labs session set, **302** only (never 301/308), within the Labs latency bar (< 0.5 s after receipt), with `Cache-Control: no-store, no-cache, max-age=0, must-revalidate`, `Pragma: no-cache`, `Expires: 0`, `Vary: *`. Logging happens after the response is sent; a logging failure never breaks the redirect.

**RD-L2 — Event record.** Timestamp (UTC); slug; `kind` (`scan` when the request carries no referrer and a mobile UA, else `click` — a heuristic, labeled as such); device class and OS family from the UA; referrer or "direct"; location as **country and region/state only, never city** (ruled Q6); bot flag (D4 catalogue) — stored, excluded from counts; **`member_id` and `marker_id` columns exist and are written empty**. The Phase 1 redirect reads no cookie, no session, and no identity of any kind, even when the phone carries a Labs session cookie because Q1 chose the Labs host; it writes nothing into those two columns. Reading a session is P2-R1 and arrives with its own amendment.

**RD-L3 — IP and location (ruled Q2, Q3, Q6).** The raw IP is used for one lookup against a **local MaxMind GeoLite2 database** on the Labs host (refreshed by a monthly download, age of the database visible in admin) and is then **discarded — not stored in any form, not logged**. Location is stored as country and region/state. A **disclosure page on fattail.ai** states in one paragraph what a scan records (time, code, device type, approximate country/region, no IP kept); its text is a W6 deliverable approved by Coach.

**RD-L4 — Unknown / inactive slug.** Unknown → plain 404 in Labs styling; inactive → LK-L6 page. Neither is an event on a link; both feed a separate "misses" tally.

**RD-L5 — No open redirect.** Only a stored destination is ever forwarded to; the request never supplies one.

**RD-L6 — Destination fence (store, fetch, forward).** `https` only (D6); DNS name, not a bare IP; resolves only to public unicast (loopback, link-local, RFC 1918 incl. `172.16/12`, ULA, CGNAT, multicast, and the Labs hosts refused); no credentials or fragments. Fence failure **refuses, stores nothing, fetches nothing**. The reachability check runs after the fence, **re-resolves immediately before connecting and refuses if any answer is non-public**, connects only to that second answer, follows no redirects, sends no body, 5 s timeout. The route re-applies the scheme check at serve time.

### Admin surface (AD) — Phase 1

**AD-L1 — Admin only**, via existing role derivation.
**AD-L2 — List:** label, slug, destination, active, scans (bots excluded), last scan, 30-day sparkline, QR download; sortable.
**AD-L3 — Detail:** edit label/destination/active/design/placement fields; regenerate image; event table with date/device/country filters; daily chart; CSV export. **Phase 1 columns, on screen and in the export, are exactly:** timestamp, slug, kind, device class, OS family, referrer, location (country, region), bot flag. `member_id` and `marker_id` are not in any Phase 1 view or export.
**AD-L4 — Create:** destination (fenced; fence failure refuses; reachability failure after the fence is a warning), label, dynamic/static, design, optional placement fields. No `owner` field. Image and short link appear immediately.
**AD-L5 — Placement fields are shown, optional, and unenforced in Phase 1.** Phase 2 may make `source` required. No channel report in Phase 1 (LK-L5).

### Reserved for later phases (scoped, not law yet)

**P2-R1** member identity: the redirect reads a valid Labs session, if present, and writes `member_id` — the only place that read is authorized, and it pulls the auth tree into the public route, so it is its own three-OK; **P2-R2** deep links `/q/<slug>` → an in-Labs route for members, the public destination for strangers; **P2-R3** date-ruled destinations; **P2-R4** channel report (events and, later, orders per source/campaign).
**P4-R1 Rules.** A rule is (link or link group, metric, window, threshold, direction) — e.g. scans per hour above N, zero events in N days after a placement goes live, first event on a new link, Nth event or Nth order on a partner link. Rules are admin-authored, versioned, and evaluated on the event store; evaluation never sits on the redirect path. **P4-R2 Notifications.** Channels per Q10; every alert names the rule, the link, the numbers that fired it, and the evidence window; no alert without a number. **P4-R3 Responses.** A rule may bind an action from a fixed allow-list (swap destination to a named fallback, deactivate, re-activate, notify a named person, open a task); actions are logged as events on the link with who/what/why; destructive actions require confirmation unless the rule is marked unattended; anything not on the allow-list is not a response. **P4-R4 Agent later.** When Agent Spaces is production-ready, a Sentinel-archetype agent may take rule evaluation and response as its charter; until then the rule engine is code, and the laws above are what the agent would inherit.

**P3-R1** first-touch marker: cookie on the brand domain or carried parameter, lifetime per Q7, attribution rule per Q8; **P3-R2** WooCommerce order meta records the marker; **P3-R3** orders-per-link report; **P3-R4** partner and member referral links (`owner` set); **P3-R5** affiliate ledger hooks — the ledger (commission, payout, statements, tax) lives in WooCommerce via an affiliate plugin, never in Labs.

---

## §5 Component inventory (Phase 1)

| Component | Kind | Owner seat | Notes |
|---|---|---|---|
| C1 Link store | One document per link, updated in place | Alpha | LK-L1; placement fields present and optional; `owner` present and not settable |
| C2 Event store | Append-only, **the app's own** (ruled Q4) | Alpha | RD-L2 with member/marker fields present, empty; Phase 2 may mirror member-attributed events into instrumentation |
| C3 Redirect route | Public server route | Alpha | RD-L1…L6 |
| C4 QR renderer + self-decode | Server library, pinned | Alpha | LK-L4 |
| C5 Geo lookup | Server function + GeoLite2 file + refresh job | Alpha | RD-L3; database age shown in admin |
| C6 Admin app | UI, admin role | Charlie | AD-L1…L5 |
| C7 Fixtures | Test data | Kilo | dynamic/static/inactive links; unknown slug; bot UAs (iMessage preview, Slackbot-LinkExpanding, Discordbot) as the D4 file; phone/desktop UAs; resolvable/unresolvable IPs; fence fixtures (`http://`, bare IP, `localhost`, `127.0.0.1`, `10.x`, `172.16–31.x`, `192.168.x`, `100.64.x`, `169.254.x`, `fd00::`, `::1`, Labs host, credentials in URL, flip-resolution) |

---

## §6 Work packets (Phase 1)

**W0 — Census (G-0).** Read-only. **Gate W0-G:** paths; auth middleware path, global vs per-route, exempt-route list; any new tree raised to Coach before W1. GO / NO-GO.
**W1 — Stores + route** (C1, C2, C3, C7). G-H, G-S, G-L closed. **Gate W1-G:** AT-1 (incl. headers and post-edit rescan), AT-4, AT-5, AT-6, AT-10, **AT-11a** green; latency measured; `git diff --stat` allowlist matched. GO / NO-GO.
**W2 — Renderer + geo** (C4, C5). G-G, G-I closed. **Gate W2-G:** AT-2, AT-3 green; IP discard shown in code and by AT-3's grep. GO / NO-GO.
**W3 — Admin app** (C6). Requires G-D. Q5 closed. **Gate W3-G:** AT-7, AT-8, **AT-11b** evidence, one screenshot per view. GO / NO-GO.
**W4 — Live acceptance.** Coach scans a dev-hosted QR from his phone; edits the destination; rescans the same image. **Gate W4-G (Coach):** evidence pinned to machine + origin + time.
**W5 — Promotion to MiniTwo.** Requires G-P. Market-closed window; rollback ready. **Gate W5-G (Coach):** AT-9 from Coach's phone against production.
**W6 — Close-out.** DL-### entry; disclosure page text for fattail.ai drafted for Coach's approval (RD-L3; placing it on the site is a one-page WordPress content edit, not a tree — Juliet confirms at W0-G); architecture doc amended (new public route; link/event model with reserved fields documented as reserved); India drift check; Help-doc check. **Gate W6-G.**

Orchestration auto-GOes through clean implementer gates and stops on any problem; G-A, G-P, W4-G, W5-G are Coach's.

---

## §7 Acceptance tests (Phase 1)

**AT-1** 302 (not 301/308); RD-L1 header set verbatim; no session; latency under bar; rescan after a destination edit lands on the new destination with no purge.
**AT-2** Every rendered SVG/PNG at every EC level, with and without logo, decodes to the short link; failing contrast refused.
**AT-3** Resolvable IP → country and region only, city absent from the record; unresolvable → "unknown"; the IP appears in no store and no log after the lookup (verified by grep of the event store and the server log on StudioTwo).
**AT-4** Phone/desktop UA classes; each pinned bot UA stored, flagged, excluded; no referrer → "direct"; `kind` heuristic labeled.
**AT-5** Unknown → 404, no event, miss counted; inactive → LK-L6 page, same.
**AT-6** Destination parameter on the request ignored.
**AT-7** Edit without reprint.
**AT-8** Static link shows no count and is labeled.
**AT-9** AT-1 and AT-7 on production from Coach's phone.
**AT-10** Every fence fixture refused at create and edit, nothing stored, no outbound request (network capture); flip-resolution refused at the second resolution.
**AT-11a Reserved fields — route.** `member_id` and `marker_id` exist on every event record and are empty in Phase 1; a request to `/q/<slug>` carrying a valid Labs session cookie produces an event with both still empty (the route reads no cookie).
**AT-11b Reserved fields — admin.** The CSV export and every Phase 1 view contain exactly the AD-L3 column set; `owner` is displayed nowhere and settable nowhere.

Evidence: screenshots and logs pinned to machine + origin + time.

---

## §8 Recorded decisions (rationale; Coach may override)

**D1** Conventional Labs app, not Agent Spaces (a redirect has nothing for an agent to judge; Spaces is a playground).
**D2** Log after redirect ("never looks dead" applies to the public too).
**D3** Slug alphabet and length as LK-L2.
**D4** Bot catalogue is a fixture file pinned to iMessage preview, Slackbot-LinkExpanding, Discordbot plus a generic `bot|crawler|spider|preview` match.
**D5** No "unique" in any phase without a retained basis.
**D6** `https` only.
**D7 — Full model in Phase 1, QR-only UI.** Rationale: a store rebuilt in Phase 2 would rewrite the first months of history; reserved empty fields cost nothing and are honest when documented as reserved (AT-11, W6).
**D8 — Affiliate ledger stays in WooCommerce.** Rationale: commissions, payouts, statements, and tax forms are commerce; Labs supplies attribution, not money.

---

## §9 Decisions

### §9.1 Coach's rulings 2026-10-04 on Phase 1 (adopted from Claude's recommendations; recorded as Coach's)

**Q1 — Host:** `labs.fattail.ai/q/…` → LK-L0. Rationale: nothing to wire, no second tree; a QR is scanned, not read.
**Q2 — Geo source:** local MaxMind GeoLite2 → RD-L3, C5. Rationale: no vendor on the sub-half-second path; monthly refresh.
**Q3 — IP:** discarded after lookup, stored nowhere → RD-L3, AT-3. Rationale: nothing in Phase 1 needs it; shortest honest disclosure.
**Q4 — Event store:** the app's own → C2. Rationale: a public route never writes into the member-behavior store; Phase 2 may mirror member-attributed events.
**Q5 — Logo:** FatTail mark as the single stock option, off by default → LK-L4. Rationale: a clean code scans better; the logo is for decks and overlays.
**Q6 — Location:** country + region/state, no city; disclosure page on fattail.ai → RD-L2, RD-L3, W6. Rationale: state-level answers every decision Coach would act on without keeping a city on a stranger.

### §9.2 Still open

**G-D** — admin mockup approval (W3). **W0** — auth-middleware census; if `/q/` needs an exemption, the program stops at W0-G.

*Phase 3 (ruled when Phase 3 is authorized):* **Q7** marker lifetime; **Q8** attribution rule; **Q9** affiliate scope.
*Phase 4 (ruled when Phase 4 is authorized):* **Q10** notification channels; **Q11** starting rule set; **Q12** unattended responses.

---

## §10 Carry-over traceability (QR-Links v0.1–v0.3 → Links v0.1)

| QR-Links law / finding | Links v0.1 | Status |
|---|---|---|
| RD-L1 cache (F1) | RD-L1 | verbatim |
| RD-L6 fence, re-resolve (F2, R2) | RD-L6 | verbatim |
| Q6 privacy, AT-3 granularity, G-L on W1 (F3, R1) | Q6, AT-3, G-L on W1 | verbatim |
| D3 alphabet, D4 catalogue (F4) | LK-L2, D4 | verbatim |
| W0 auth-exemption report, W4-G Coach (F5, R3) | W0-G, W4-G | verbatim |
| QR-L1…L5, AD-L1…L4 | LK-L1, L3, L4, L6; AD-L1…L4 | renamed; placement/owner fields added as optional |

Nothing dropped.

### §10.1 Grok Advisor review of Links v0.1 (2026-10-04)

| # | Severity | Finding | Disposition in v0.2 |
|---|---|---|---|
| F1 | BLOCKING | RD-L2 told the Phase 1 redirect to read a Labs session | RD-L2: columns exist, written empty, no cookie or session read of any kind; the read lives only in P2-R1 as its own three-OK; AT-11 tests a session-bearing request yields empty fields |
| F2 | ADVISORY | CSV export could read reserved fields | AD-L3 names the exact Phase 1 column set for views and export; AT-11 checks the export |
| F3 | ADVISORY | Auth exemption still a hypothesis | Unchanged by design; W0-G must report it before W1 |

Nothing dropped.

### §10.2 Grok Advisor review of Links v0.2 (2026-10-04) — GO for intake

| # | Severity | Finding | Disposition in v0.3 |
|---|---|---|---|
| G1 | ADVISORY | AT-11 was on no gate | Split: AT-11a (cookie half) on W1-G; AT-11b (export/columns half) on W3-G |
| G2 | ADVISORY | `owner` optional where other reserved fields are empty | LK-L1, C1, AD-L4: present and not settable in Phase 1; AT-11b checks it is displayed and settable nowhere |
| G3 | ADVISORY | Auth exemption still a hypothesis | Unchanged by design; W0-G must report it before W1 |

Nothing dropped.

---

## §11 Out of scope for this version

Phase 2, 3, and 4 build; member-created links; vCard/Wi-Fi payloads; unique-visitor counting; deletion; any market-data path; any WordPress change.

---

*Series ID LK-1.1. Seated 2026-10-05. Supersedes `Specs/LK-1.md` (stamped 2026-10-05; bytes unchanged). The only law change is LK-L4. BUILD AUTHORITY: Phase 1, recorded in `Specs/LK-1-STAMP.md`.*
