# FatTail Labs — SEO Spec v1.3 (Layers 3+4: structured data + AEO)

**Status:** Approved as built (2026-07-21)
**Extends:** v1.2. The machine-readable layer: what search and answer engines
can assert about the Lab, its founder, and its schedule.

---

## 1. Structured-data expansion (Layer 3)

- **Course pages** gain: `offers` (Subscription, $250 USD → /membership) and
  the trailer as a `VideoObject` (YouTube thumbnail via i.ytimg.com, embed URL,
  uploadDate = published_at) — tying the channel's authority to the site.
  Lesson pages stay VideoObject-free: watching is gated, and schema must not
  promise media the page won't serve.
- **/live** emits `Event` JSON-LD for upcoming **public** sessions only (the
  0DTE Live Show): OnlineEventAttendanceMode, isAccessibleForFree, virtual
  location, organizer. Member sessions never appear in schema. Hourly
  revalidation rolls the window.
- **Entity graph:** `/about` — the who-is-this page. `Person` (Ernie
  Varitimos, founder & head coach) + `Organization` (FatTail Labs), both with
  `sameAs` → youtube.com/@0dte, 0-dte.com, fattail.ai. Copy is conservative
  and doctrine-voiced (bio deliberately limited to in-repo facts — founder
  review invited). Sitewide `Organization` JSON-LD in the root layout. About
  added to nav + sitemap.

## 2. AEO (Layer 4)

- **Membership FAQ:** six real Q&As (inclusions, trial mechanics, the alumni
  year, cancellation, Activator vs Navigator, experience needed) rendered as a
  visible section AND as `FAQPage` JSON-LD **from the same array** — schema
  can never drift from the page.
- **`/llms.txt`:** the AI-crawler site card — positioning, doctrine, key URLs,
  schedule, membership terms. Same welcome robots.txt extends.
- Entity naming held consistent everywhere: "FatTail Labs", "Ernie
  Varitimos", "First, stop the bleeding".

## 3. Layer status

SEO design v1.0–v1.3 complete: plumbing → lesson landing pages → category
hubs → structured data + AEO. Remaining opportunities are content-side
(notes on free previews, category copy review) and post-launch (Search
Console, canonical-host 301 at the vhost).
