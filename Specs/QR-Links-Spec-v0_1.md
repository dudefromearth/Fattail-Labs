# QR Links — Dynamic QR Codes with Scan Tracking in FatTail Labs — Spec v0.1 (DRAFT)

**Version:** v0.1 (DRAFT — first version; supersedes nothing)
**Date:** 2026-10-04
**Machine:** Build and prove on StudioTwo (dev); promote to MiniTwo (production, labs.fattail.ai) once proven. Specification only; files/trees touched by this document: NONE.
**Scope:** A new admin-only Labs app, `QR Links`: create dynamic QR codes whose image encodes a short link on the Labs host; a public redirect route that records each scan and forwards to the destination; an admin surface that lists codes, edits destinations without reprinting, and shows scan history with device, referrer, and rough location.
**Touches outside the new app:** one **public, unauthenticated** route on the Labs host (the redirect); the Labs app registry (one new admin-role entry); the existing instrumentation store if scans are written there (Q4). No member surface. No identity/auth change beyond "admin role sees the app." Trees named here are a hypothesis until W0.
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
| G-P | W4-G GO on StudioTwo with evidence; rollback named. Coach gate; never auto-GO | W5 promotion | Pending |

Nothing dispatches until G-0 and G-A are GO. W1 needs G-H and G-S; W2 needs G-G and G-I.

---

## §3 Law catalogue

### Codes (QR)

**QR-L1 — Dynamic by default.** A code record holds: slug, destination URL, label, created/updated timestamps, active flag, and optional design settings (QR-L4). The QR image encodes `https://<host>/q/<slug>` (host per Q1), never the destination. Changing the destination changes nothing about the image.

**QR-L2 — Slug.** Short, URL-safe, unambiguous (no 0/O, 1/l/I), generated, unique; editable before first scan, frozen after (a scanned slug may be printed somewhere). Length is a recorded decision (D3).

**QR-L3 — Static codes are honest.** A code may be generated as static (image encodes the destination directly). It is stored and labeled "static — not tracked," with no scan count shown, ever. Nothing fakes tracking for it.

**QR-L4 — Image.** Rendered server-side as SVG and PNG at chosen pixel size; error-correction level selectable (L/M/Q/H), default H when a center logo is applied; optional center logo (FatTail mark or an uploaded image) with a quiet zone kept. Colors selectable; a contrast check refuses combinations below the scannable threshold rather than rendering a dead code. Every rendered image is scan-tested by the server's own decoder before it is offered for download (AT-2).

**QR-L5 — Deactivate, never delete.** Deactivating a code makes the redirect show a plain "this link is no longer active" page; scan history is kept. Deletion is not a feature in v1.

### Redirect (RD)

**RD-L1 — Public and fast.** `GET /q/<slug>` requires no login, sets no Labs session, and answers with a 302 to the destination within the Labs latency bar (< 0.5 s after receipt). Logging never delays the redirect: the scan is recorded after the response is sent (or asynchronously), and a logging failure never breaks the redirect.

**RD-L2 — What a scan records.** Timestamp (UTC); slug; device class derived from the user agent (phone / tablet / desktop / other) plus OS family; referrer header if present (a camera scan usually carries none — the surface says "direct scan" rather than blank); rough location (country, region, city) derived from the request IP via the Q2 source; a bot flag when the user agent is a known crawler or link-preview fetcher (those scans are stored but excluded from counts by default).

**RD-L3 — IP handling.** The raw IP is used for the geo lookup and then handled per Q3 (not stored / stored truncated / stored hashed). The spec does not default this.

**RD-L4 — Unknown or inactive slug.** Unknown → a plain 404 page in Labs styling, no redirect anywhere. Inactive → the QR-L5 page. Neither is logged as a scan of any code; both are counted in a separate "misses" tally the admin can see.

**RD-L5 — No open redirect.** Only destinations stored on a code record are ever redirected to. The route never takes a destination from the request.

### Admin surface (AD)

**AD-L1 — Admin only.** The app appears in the Apps hub for the admin role only, using the existing role derivation. No new entitlement logic.

**AD-L2 — List view.** All codes, each with label, slug, destination, active state, total scans (bots excluded), last scan time, a sparkline of the last 30 days, and the image download. Sorting by scans, last scan, created.

**AD-L3 — Code detail.** Edit label/destination/active/design; regenerate the image; scan table (RD-L2 fields) with filters by date range, device class, country; a daily-scan chart; export of the scan table as CSV.

**AD-L4 — Create.** One form: destination URL (validated as reachable with a HEAD/GET at creation — a failure is a warning, not a block), label, dynamic/static, design. The image and the short link appear immediately.

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
| C7 Fixtures | Test data | Kilo | Dynamic code, static code, inactive code, unknown slug, bot UA, phone/desktop UAs, a geo-resolvable and an unresolvable IP |

---

## §5 Work packets

**W0 — Census (G-0).** Read-only: app-registry pattern, any existing public route pattern on the Labs host, admin shell, instrumentation schema. **Gate W0-G:** report with paths; any new tree beyond the header's list raised to Coach. GO / NO-GO.

**W1 — Stores + route** (C1, C2, C3, C7). Requires G-H, G-S. **Gate W1-G:** AT-1, AT-4, AT-5, AT-6 green; redirect timing measured; `git diff --stat` allowlist matched. GO / NO-GO.

**W2 — Renderer + geo** (C4, C5). Requires G-G, G-I. **Gate W2-G:** AT-2, AT-3 green; IP handling per Q3 shown in code. GO / NO-GO.

**W3 — Admin app** (C6). Requires G-D. **Gate W3-G:** AT-7, AT-8 evidence on StudioTwo, one screenshot per view. GO / NO-GO.

**W4 — Live acceptance.** Coach scans a dev-hosted code from his own phone; scan appears with device and location. **Gate W4-G:** evidence pinned to machine + origin + time. GO / NO-GO.

**W5 — Promotion to MiniTwo.** Requires G-P (Coach). Market-closed window; rollback ready. **Gate W5-G (Coach, never auto-GO):** AT-9 on production from Coach's phone.

**W6 — Close-out.** DL-### entry, architecture doc amended (new public route documented), India drift check, Help-doc check. **Gate W6-G (final).**

Orchestration auto-GOes through clean implementer gates and stops on any problem; G-A, G-P, W5-G are Coach's.

---

## §6 Acceptance tests

**AT-1 Redirect.** Fixture dynamic code → 302 to its destination; no Labs session set; measured latency under the bar.
**AT-2 Image validity.** Every rendered SVG/PNG, at every error-correction level and with the logo applied, decodes with the server's decoder to the short link; a failing contrast combination is refused.
**AT-3 Geo.** Resolvable fixture IP → country/region/city; unresolvable → "unknown," never a guess; IP retained per Q3 and nothing more.
**AT-4 Scan record.** Phone UA → phone + OS; desktop UA → desktop; bot UA → stored, flagged, excluded from the count; no referrer → "direct scan."
**AT-5 Unknown / inactive.** Unknown slug → 404 page, no scan record, miss counted; inactive → QR-L5 page, same.
**AT-6 No open redirect.** A request carrying a destination parameter is ignored; only the stored destination is used.
**AT-7 Edit without reprint.** Change a code's destination; the previously rendered image, scanned, lands on the new destination.
**AT-8 Static honesty.** A static code shows no count anywhere and is labeled.
**AT-9 Production.** AT-1 and AT-7 from Coach's phone against labs.fattail.ai.

Evidence standard: screenshots and logs pinned to machine + origin + time.

---

## §7 Recorded decisions (rationale given; Coach may override)

**D1 — Conventional app, not Agent Spaces.** Rationale: Agent Spaces is a playground until it has survived failure-mode simulation; a QR redirect is a mechanical binding with nothing for an agent to judge. If Coach wants it as the first utility built the new way, say so and this becomes a space-plus-agent spec.
**D2 — Log after redirect.** Rationale: the member-facing bar is "never looks dead"; the public-facing bar is the same — a scanner who waits on a geo lookup reads the code as broken.
**D3 — Slug length 6, unambiguous alphabet.** Rationale: ~2 billion combinations, short enough for low-density QR, no visual lookalikes for anyone typing it.
**D4 — Bots excluded from counts by default, kept in the store.** Rationale: link-preview fetchers (iMessage, Slack, Discord) fire on every share; counting them makes every number a lie.
**D5 — No "unique scans" claim in v1.** Rationale: AD-L5; without cookies or retained IP there is no honest basis.

---

## §8 Open decisions requiring Coach (no defaults applied; silence does not decide)

**Q1 — Short-link host.** `labs.fattail.ai/q/…` (the app's own host, nothing to wire) or `fattail.ai/q/…` (the brand domain; needs a WordPress-side pass-through to Labs, a second tree). Consequence: the host is printed on things and cannot change later.
**Q2 — Geolocation source.** A local database on the Labs host (e.g. MaxMind GeoLite2: free, updated by download, no per-scan call) or an IP-lookup API (no file to maintain, a per-scan network call, a vendor, a rate limit). No default.
**Q3 — IP retention.** Not stored at all after lookup; stored truncated (last octet dropped); or stored hashed. Affects what a future "unique" count could ever be and what a privacy page has to say.
**Q4 — Scan store.** A new event type in Labs' existing instrumentation store (one place for all behavior data; admin Flow could show it) or the app's own store (self-contained, portable). No default.
**Q5 — Center logo.** Which mark is the stock logo option, if any.

---

## §9 Explicitly out of scope

Member-created codes; payments or storefront; vCard/Wi-Fi/other QR payload types (destination URL only in v1); unique-visitor counting; A/B destinations; deleting codes; any market-data path.

---

*Content hash: computed from disk at DL seating; not carried in this draft.*
