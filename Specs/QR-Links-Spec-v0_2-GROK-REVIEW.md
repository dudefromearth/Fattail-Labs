# Review request: QR Links — Spec v0.2 (DRAFT)

**Machine:** StudioTwo (dev). Read-only; this packet authorizes no edits and no file placement.
**To:** Grok Advisor (adversarial review seat)
**From:** Coach
**Document under review:** reproduced in full below. Supersedes v0.1, which you reviewed NO-GO on 2026-10-04.

## What to do
1. **Finding traceability.** §10 dispositions your five v0.1 findings. Confirm each is closed by the cited law or test, or reopen it with the reason.
2. **Doctrine and architecture.** RD-L1 cache law and RD-L6 fence against what a redirect on the Labs host would actually do; the auth-exemption scope line in the header and W0.
3. **Spec integrity.** Q1–Q6 are the open set; nothing elsewhere answers them; D3/D4/D6 are overridable decisions with rationale; header/version consistent.

## Report format
Verdict line (GO / NO-GO for intake, one sentence why); numbered prose findings by severity, each **BLOCKING** or **ADVISORY**, never conflated; "Notes without findings"; "Summary for Coach" in plain language, no agent labels.

## Stop conditions
- Any QR or short-link spec in `~/FatTail-Labs/Specs/` — report and stop.
- Any doubt about the auth-exemption pattern — state it as a finding; do not resolve by assumption.

---
---

# QR Links — Dynamic QR Codes with Scan Tracking in FatTail Labs — Spec v0.2 (DRAFT)

**Version:** v0.2 (DRAFT — v0.1 after Grok Advisor review 2026-10-04, NO-GO; all five findings dispositioned in §10)
**Supersedes:** `QR-Links-Spec-v0_1.md` (DRAFT, NO-GO; left on disk as baseline)
**Date:** 2026-10-04
**Machine:** Build and prove on StudioTwo (dev); promote to MiniTwo (production, labs.fattail.ai) once proven. Specification only; files/trees touched by this document: NONE.
**Scope:** A new admin-only Labs app, `QR Links`: create dynamic QR codes whose image encodes a short link on the Labs host; a public redirect route that records each scan and forwards to the destination; an admin surface that lists codes, edits destinations without reprinting, and shows scan history with device, referrer, and rough location.
**Touches outside the new app:** one **public, unauthenticated** route on the Labs host (the redirect) — if the host's auth middleware is global, exempting `/q/` is an auth-tree touch and is raised to Coach at W0-G before anything else; the Labs app registry (one new admin-role entry); the existing instrumentation store if scans are written there (Q4). No member surface. Trees named here are a hypothesis until W0.
**Status:** DRAFT. **BUILD AUTHORITY: none.**
**Canonical filename:** provisional — assigned the next free `Specs/` series ID at Juliet intake.

**Parents (cited, not amended):**
- Labs app registry and role ladder (observer < alumni < activator < navigator < admin), date-aware role derivation — as-built.
- Labs instrumentation (`page_views` recorder, admin Flow / Users) — as-built; cited for the storage decision in Q4.
- TOPO-1 / SODP — the UI host never calls Massive. Not engaged (no market data), cited to state so.
- Labs data-serving rule (one document per thing, updated in place, age visible) — inherited for the code records.

**Framing:** a conventional Labs app, not an Agent Spaces instance. Rationale in D1; Coach may override.

---

## §1 Purpose

Coach prints or posts QR codes (decks, show overlays, flyers, the Tradier breakout page, member materials). Each code must keep working if its destination changes, and each scan must be countable and attributable: when, from what kind of device, from where (city-level), and from what context. The code encodes a short link that Labs owns, so Labs sees every scan before the phone leaves for the destination. A static QR (destination baked into the image) can be generated too, but nothing about it is tracked, and the surface says so.

---

## §2 Dependency gates

| Gate | What it is | Scope | State |
|---|---|---|---|
| G-0 | W0 census: the Labs app-registry entry pattern, the public-route pattern (if any exists), the admin page shell, the instrumentation store schema | All packets | Not run |
| G-A | Coach Phase-5 stamp (BUILD AUTHORITY). Coach gate; never auto-GO | All packets | Pending |
| G-H | Q1 ruled — which host the short link uses | W1 slug/URL law | Open |
| G-G | Q2 ruled — geolocation source | W2 | Open |
| G-I | Q3 ruled — what of the scanner's IP is retained | W2 | Open |
| G-S | Q4 ruled — scans in the existing instrumentation store or the app's own | W1 | Open |
| G-D | Admin surface mockup approved (bench UX seat) | W3 | Not started |
| G-L | Q6 ruled — location granularity stored and public disclosure | W1 scan store | Open |
| G-P | W4-G GO on StudioTwo with evidence; rollback named. Coach gate; never auto-GO | W5 promotion | Pending |

Nothing dispatches until G-0 and G-A are GO. W1 needs G-H, G-S, and G-L; W2 needs G-G and G-I. Coach gates: **G-A, G-P, W4-G, W5-G**; never auto-GO.

---

## §3 Law catalogue

### Codes (QR)

**QR-L1 — Dynamic by default.** A code record holds: slug, destination URL, label, created/updated timestamps, active flag, and optional design settings (QR-L4). The QR image encodes `https://<host>/q/<slug>` (host per Q1), never the destination. Changing the destination changes nothing about the image.

**QR-L2 — Slug.** Short, URL-safe, unambiguous (no 0/O, 1/l/I), generated, unique; editable before first scan, frozen after (a scanned slug may be printed somewhere). Length is a recorded decision (D3).

**QR-L3 — Static codes are honest.** A code may be generated as static (image encodes the destination directly). It is stored and labeled "static — not tracked," with no scan count shown, ever. Nothing fakes tracking for it.

**QR-L4 — Image.** Rendered server-side as SVG and PNG at chosen pixel size; error-correction level selectable (L/M/Q/H), default H when a center logo is applied; optional center logo (FatTail mark or an uploaded image) with a quiet zone kept. Colors selectable; a contrast check refuses combinations below the scannable threshold rather than rendering a dead code. Every rendered image is scan-tested by the server's own decoder before it is offered for download (AT-2).

**QR-L5 — Deactivate, never delete.** Deactivating a code makes the redirect show a plain "this link is no longer active" page; scan history is kept. Deletion is not a feature in v1.

### Redirect (RD)

**RD-L1 — Public, fast, and never cached.** `GET /q/<slug>` requires no login, sets no Labs session, and answers with a **302** (never 301/308) to the destination within the Labs latency bar (< 0.5 s after receipt). The response carries `Cache-Control: no-store, no-cache, max-age=0, must-revalidate`, `Pragma: no-cache`, `Expires: 0`, and `Vary: *`, so no phone, preview proxy, or CDN keeps the old destination or skips Labs on a later scan. This is the law that makes QR-L1 (edit without reprint) and RD-L2 (every scan recorded) true; a cached redirect breaks both. Logging never delays the redirect: the scan is recorded after the response is sent, and a logging failure never breaks the redirect.

**RD-L2 — What a scan records.** Timestamp (UTC); slug; device class derived from the user agent (phone / tablet / desktop / other) plus OS family; referrer header if present (a camera scan usually carries none — the surface says "direct scan" rather than blank); location derived from the request IP via the Q2 source, at the granularity Q6 rules (country only, or country/region/city); a bot flag when the user agent is a known crawler or link-preview fetcher (those scans are stored but excluded from counts by default).

**RD-L3 — IP and location handling.** The raw IP is used for the geo lookup and then handled per Q3 (not stored / stored truncated / stored hashed). The derived location is stored at the Q6 granularity and disclosed as Q6 rules. Scanners are the public, not members, and a 302 shows them nothing; the spec does not default either.

**RD-L4 — Unknown or inactive slug.** Unknown → a plain 404 page in Labs styling, no redirect anywhere. Inactive → the QR-L5 page. Neither is logged as a scan of any code; both are counted in a separate "misses" tally the admin can see.

**RD-L5 — No open redirect.** Only destinations stored on a code record are ever redirected to. The route never takes a destination from the request.

**RD-L6 — Destination fence (store, fetch, and forward).** A destination is accepted only if, at creation and at every edit: the scheme is `https` (D6); the host is a DNS name, not a bare IP; the name resolves, at check time, only to public unicast addresses — loopback, link-local, private (RFC 1918 / ULA), CGNAT, multicast, and the Labs hosts themselves are refused; no credentials or fragments in the URL. A destination that fails the fence is **refused, not warned** — nothing is stored, nothing is fetched. The reachability check (AD-L4) runs only after the fence passes, follows no redirects, sends no body, and times out in 5 s. The redirect route forwards only to a stored, fenced destination; it re-applies the scheme check at serve time.

### Admin surface (AD)

**AD-L1 — Admin only.** The app appears in the Apps hub for the admin role only, using the existing role derivation. No new entitlement logic.

**AD-L2 — List view.** All codes, each with label, slug, destination, active state, total scans (bots excluded), last scan time, a sparkline of the last 30 days, and the image download. Sorting by scans, last scan, created.

**AD-L3 — Code detail.** Edit label/destination/active/design; regenerate the image; scan table (RD-L2 fields) with filters by date range, device class, country; a daily-scan chart; export of the scan table as CSV.

**AD-L4 — Create.** One form: destination URL (fenced per RD-L6 — fence failure refuses; a reachability failure after the fence passes is a warning), label, dynamic/static, design. The image and the short link appear immediately.

**AD-L5 — Honesty of numbers.** Counts shown are exact counts of stored scans; "unique" is never claimed in v1 (no cookies on scanners, IP retention is Q3). Geo is labeled "approximate (IP-based)."

---

## §4 Component inventory

| Component | Kind | Owner seat | Notes |
|---|---|---|---|
| C1 Code store | Records (one document per code, updated in place) | Alpha | QR-L1…L5 |
| C2 Scan store | Append-only scan records | Alpha | RD-L2; location per Q4 |
| C3 Redirect route | Public server route | Alpha | RD-L1…L5 |
| C4 QR renderer + self-decode check | Server library | Alpha | QR-L4; a mainstream QR library, pinned |
| C5 Geo lookup | Server function | Alpha | Q2 source; RD-L3 |
| C6 Admin app (list, detail, create) | UI, admin role | Charlie | AD-L1…L5 |
| C7 Fixtures | Test data | Kilo | Dynamic code, static code, inactive code, unknown slug; bot UA catalogue (iMessage preview, Slackbot-LinkExpanding, Discordbot) as the D4 file; phone/desktop UAs; geo-resolvable and unresolvable IPs; fence fixtures: `http://`, bare IP, `localhost`, `127.0.0.1`, `10.x`, `192.168.x`, `169.254.x`, `fd00::`, the Labs host, a URL with credentials |

---

## §5 Work packets

**W0 — Census (G-0).** Read-only: app-registry pattern; **how auth is applied on the Labs host and whether any route is already exempt** (the item that matters — if middleware is global, `/q/` needs an exemption and that is an auth-tree touch); admin shell; instrumentation schema. **Gate W0-G:** report with paths; the auth-exemption finding and any new tree raised to Coach before W1. GO / NO-GO.

**W1 — Stores + route** (C1, C2, C3, C7). Requires G-H, G-S. **Gate W1-G:** AT-1 (including headers), AT-4, AT-5, AT-6, AT-10 green; redirect timing measured; `git diff --stat` allowlist matched. GO / NO-GO.

**W2 — Renderer + geo** (C4, C5). Requires G-G, G-I. **Gate W2-G:** AT-2, AT-3 green; IP handling per Q3 shown in code. GO / NO-GO.

**W3 — Admin app** (C6). Requires G-D. **Gate W3-G:** AT-7, AT-8 evidence on StudioTwo, one screenshot per view. GO / NO-GO.

**W4 — Live acceptance.** Coach scans a dev-hosted code from his own phone; scan appears with device and location; Coach edits the destination and rescans the same printed image. **Gate W4-G (Coach, never auto-GO):** evidence pinned to machine + origin + time.

**W5 — Promotion to MiniTwo.** Requires G-P (Coach). Market-closed window; rollback ready. **Gate W5-G (Coach, never auto-GO):** AT-9 on production from Coach's phone.

**W6 — Close-out.** DL-### entry, architecture doc amended (new public route documented), India drift check, Help-doc check. **Gate W6-G (final).**

Orchestration auto-GOes through clean implementer gates (W0-G…W3-G, W6-G) and stops on any problem; G-A, G-P, W4-G, W5-G are Coach's.

---

## §6 Acceptance tests

**AT-1 Redirect.** Fixture dynamic code → 302 (not 301/308) to its destination; the no-store/no-cache header set of RD-L1 present verbatim; no Labs session set; measured latency under the bar. A second request after a destination edit lands on the new destination without any cache purge.
**AT-2 Image validity.** Every rendered SVG/PNG, at every error-correction level and with the logo applied, decodes with the server's decoder to the short link; a failing contrast combination is refused.
**AT-3 Geo.** Resolvable fixture IP → country/region/city; unresolvable → "unknown," never a guess; IP retained per Q3 and nothing more.
**AT-4 Scan record.** Phone UA → phone + OS; desktop UA → desktop; each pinned bot UA in the D4 file → stored, flagged, excluded from the count; no referrer → "direct scan."
**AT-5 Unknown / inactive.** Unknown slug → 404 page, no scan record, miss counted; inactive → QR-L5 page, same.
**AT-6 No open redirect.** A request carrying a destination parameter is ignored; only the stored destination is used.
**AT-10 Fence.** Every fence fixture in C7 is refused at create and at edit with nothing stored and no outbound request made (verified by network capture on StudioTwo); a public `https` destination passes; a destination whose name resolves to a private address at check time is refused.
**AT-7 Edit without reprint.** Change a code's destination; the previously rendered image, scanned, lands on the new destination.
**AT-8 Static honesty.** A static code shows no count anywhere and is labeled.
**AT-9 Production.** AT-1 and AT-7 from Coach's phone against labs.fattail.ai.

Evidence standard: screenshots and logs pinned to machine + origin + time.

---

## §7 Recorded decisions (rationale given; Coach may override)

**D1 — Conventional app, not Agent Spaces.** Rationale: Agent Spaces is a playground until it has survived failure-mode simulation; a QR redirect is a mechanical binding with nothing for an agent to judge. If Coach wants it as the first utility built the new way, say so and this becomes a space-plus-agent spec.
**D2 — Log after redirect.** Rationale: the member-facing bar is "never looks dead"; the public-facing bar is the same — a scanner who waits on a geo lookup reads the code as broken.
**D3 — Slug length 6 over the alphabet `23456789abcdefghjkmnpqrstuvwxyz`** (31 symbols; lowercase; no 0/1/i/l/o). Rationale: ~890 million combinations, short enough for low-density QR, no visual lookalikes for anyone typing it; one alphabet so two implementations cannot differ.
**D4 — Bots excluded from counts by default, kept in the store.** The catalogue is a fixture file (C7), pinned at minimum to the iMessage link-preview fetcher, Slackbot-LinkExpanding, and Discordbot user agents, plus a generic `bot|crawler|spider|preview` match; the file is the law, extended by edit. Rationale: these fire on every share; counting them makes every number a lie.
**D5 — No "unique scans" claim in v1.** Rationale: AD-L5; without cookies or retained IP there is no honest basis.
**D6 — `https` only.** Rationale: every destination Coach will print is on a modern host; allowing `http` widens the fence for nothing.

---

## §8 Open decisions requiring Coach (no defaults applied; silence does not decide)

**Q1 — Short-link host.** `labs.fattail.ai/q/…` (the app's own host, nothing to wire) or `fattail.ai/q/…` (the brand domain; needs a WordPress-side pass-through to Labs, a second tree). Consequence: the host is printed on things and cannot change later.
**Q2 — Geolocation source.** A local database on the Labs host (e.g. MaxMind GeoLite2: free, updated by download, no per-scan call) or an IP-lookup API (no file to maintain, a per-scan network call, a vendor, a rate limit). No default.
**Q3 — IP retention.** Not stored at all after lookup; stored truncated (last octet dropped); or stored hashed. Affects what a future "unique" count could ever be and what a privacy page has to say.
**Q4 — Scan store.** A new event type in Labs' existing instrumentation store (one place for all behavior data; admin Flow could show it) or the app's own store (self-contained, portable). No default.
**Q5 — Center logo.** Which mark is the stock logo option, if any.
**Q6 — Location granularity and disclosure.** Store country only, or country/region/city, for people who only scanned a flyer and never see a notice; and whether a public page on fattail.ai discloses what a scan records. City-level location is personal data even with the IP discarded. No default.

---

## §9 Explicitly out of scope

Member-created codes; payments or storefront; vCard/Wi-Fi/other QR payload types (destination URL only in v1); unique-visitor counting; A/B destinations; deleting codes; any market-data path.

---

## §10 Finding traceability (Grok Advisor review of v0.1, 2026-10-04)

| # | Severity | Finding | Disposition in v0.2 |
|---|---|---|---|
| F1 | BLOCKING | Redirect cacheable; breaks edit-without-reprint and scan counting | RD-L1: 302 only, full no-store header set; AT-1 checks headers and a post-edit rescan |
| F2 | BLOCKING | Destination unfenced; creation check is an arbitrary server-side fetch | RD-L6 fence (https, DNS name, public unicast only, no Labs hosts, no credentials); refuse not warn; no fetch before the fence; D6; AT-10; fence fixtures in C7 |
| F3 | ADVISORY | City-level location is personal data; disclosure undecided | Q6 added; RD-L2/L3 store at the Q6 granularity; G-L gates W1 |
| F4 | ADVISORY | Slug alphabet and bot catalogue unnamed | D3 alphabet pinned; D4 catalogue is a fixture file pinned to iMessage/Slack/Discord |
| F5 | ADVISORY | W0 open; auth exemption for a public route is the real census item; W4 should be Coach's | Header scope line; W0 names the auth-exemption finding; W4-G is a Coach gate |

Nothing dropped.

---

*Content hash: computed from disk at DL seating; not carried in this draft.*
