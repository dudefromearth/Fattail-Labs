# FatTail Labs — Human Interface Spec v1.0

**Product:** FatTail Labs (`labs.fattail.ai`)  
**Status:** Approved (Coach 2026-07-24) — open questions locked to §15 recommendations  
**Authority:** Coach (final); Echo (design system); Charlie (implementation); India (architecture); Tango (member experience); Delta (gates)  
**Related:** Admin Dual Surface v1.0 · In-Place Admin v1.0–v1.5 · Course Hosting v1.0 · SEO v1.3 · Architecture/03-frontend-design.md  
**Decision log:** 2026-07-24 "Human Interface Spec v1.0 + Appearance control plane"  

---

## 1. Purpose

Establish a single **Human Interface constitution** for every graphical surface in
Labs — member site, in-place admin, and operator control plane (`/admin/*`) — so
that:

1. **Apple’s Human Interface Guidelines (HIG)** are the non-negotiable interaction
   and visual bar (adapted rigorously to web; see §2).  
2. **Charlie can implement without inventing** colors, type, or controls — everything
   traces to tokens and primitives.  
3. **Administrators can control major interface elements** (chrome, brand, hub
   composition, density, announcements) through a **first-class control plane** —
   not by editing code or CSS files (see §10).  
4. **Learners** get clarity, deference, and calm density consistent with
   capacity-over-dependency (Tango).  

This is a **system specification**, not a one-page restyle. Compliance is phased
(§12); new UI after approval **must** use the kit.

---

## 2. Platform interpretation — “Apple HIG for Labs web”

### 2.1 What we adopt (strict)

| HIG pillar | Labs web requirement |
|---|---|
| **Clarity** | One primary action per region; readable hierarchy; no emoji as chrome. |
| **Deference** | Content (course, lesson, hub) is the hero; chrome recedes. |
| **Depth** | Layered surfaces: canvas → grouped content → chrome → modal. |
| **Consistency** | Same controls, spacing, and feedback everywhere. |
| **Feedback** | Alerts, progress, validation — never silent failure. |
| **Direct manipulation** | In-place edit stays; targets ≥ 44×44 pt; clear edit mode. |
| **User control** | Destructive actions require cancel + explicit confirm. |
| **Accessibility** | WCAG AA contrast, keyboard, focus rings, reduced motion, labels. |

### 2.2 What we do **not** do

- Ship native AppKit/UIKit or require Mac-only fonts to function.  
- Clone apple.com marketing layout.  
- Import or copy MarketSwarm-Canonical UI (product boundary).  
- Allow arbitrary admin-injected CSS/JS (security; Mike).  
- Use profit-claim marketing chrome or dark patterns (Tango).  

### 2.3 Platform dialects (one language, two densities)

| Dialect | Surfaces | Character |
|---|---|---|
| **Member** | Public + authenticated learner routes | Calm, content-first, iOS-like grouped content + clear CTAs |
| **Operator** | `/admin/*` + dense in-place toolbars | macOS-like: toolbar, sidebar, lists/inspectors, higher density |

Both dialects share **tokens, type ramp, icons, and primitives**. Density and
chrome layout differ via **appearance profile** (§10), not a second brand.

---

## 3. Non-goals (v1.0)

- Pixel-perfect recreation of any Apple first-party app.  
- Full CMS for arbitrary page builders (Webflow-style).  
- Per-member theme personalization (site-wide + admin preview only in v1).  
- White-label multi-tenant theming for third parties.  
- Replacing in-place admin with a separate “builder app.”  

---

## 4. Design tokens (source of truth)

### 4.1 Rules

1. **Tokens only** — components and pages reference semantic tokens; no raw
   `zinc-500` / hex / magic px in feature code after migration.  
2. **Fail loud in build** — missing required token definitions fail the design
   system unit check (see §11).  
3. **Light and dark** — every semantic color has both; respect
   `prefers-color-scheme` and optional admin **Appearance mode**
   (`system` \| `light` \| `dark`).  
4. **Admin overrides** map only onto **allowed override keys** (§10.4) — never
   invent parallel hex fields in components.  

### 4.2 Color (semantic)

**Apple depth rule (locked from apple.com marketing ref `apple1.png`):**

| Layer | Value | Role |
|---|---|---|
| **Canvas** | Soft off-white (~5% gray, `#f5f5f7`) | Full-page wash — **never pure white** |
| **Surface** | Pure white `#ffffff` | Cards, chrome, elevated tiles |
| **Surface inverse** | Pure black `#000000` | Hero product tiles that need maximum contrast |
| **Secondary surface** | Slightly darker wash | Nested fills *inside* a white card |

Measured from the HomePod marketing page: page wash ≈ `#f2f2f5`–`#f5f5f7`; HomePod mini
tile `#ffffff`; HomePod tile `#000000`; nav chrome pure white on the soft canvas.

Without the soft canvas, pure-white cards disappear. Without pure-white surfaces, tiles
look “flat SaaS.” Both layers are required.

**Invariant:** Every primary content bounding box (tab panels, instructor block,
reviews, resources, discussion, students, enroll card, catalog cards, module
groups) **must** use `color.surface` (or `surface-card`) against `color.canvas`.
Border-only boxes that inherit the page wash are **not** HIG-compliant.

| Token | Role |
|---|---|
| `color.canvas` | Page background (~5% off-white light / pure black dark) |
| `color.surface` | Pure elevated white (cards, header) |
| `color.surface.secondary` | Nested / inset surface |
| `color.surface.inverse` | Pure black (or white in dark mode) product tiles |
| `color.separator` | Hairline borders / dividers |
| `color.label` | Primary text |
| `color.label.secondary` | Secondary text |
| `color.label.tertiary` | Tertiary / placeholders |
| `color.tint` | Brand interactive (links, primary buttons, focus) |
| `color.tint.emphasis` | Pressed / stronger tint |
| `color.destructive` | Delete / irreversible |
| `color.success` / `color.warning` | Status (process outcomes only; no profit green hype) |
| `color.fill` | Control fills (fields, chips, tab tracks) |
| `color.overlay` | Modal scrim |

**Default brand tint:** FatTail emerald family, expressed as tokens — not
hardcoded `emerald-500` in components.

**CSS helpers:** `.bg-canvas`, `.bg-surface`, `.surface-card`, `.surface-card-inverse`.

### 4.3 Typography

| Style | Use |
|---|---|
| `text.largeTitle` | Rare page heroes |
| `text.title1` / `title2` / `title3` | Page / section titles |
| `text.headline` | Card titles, module titles |
| `text.body` | Default reading |
| `text.callout` | Emphasized body |
| `text.subheadline` | Metadata strips |
| `text.footnote` / `caption1` / `caption2` | Meta, legal, timestamps |

**Font stack (web):**

```text
--font-ui: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI",
           system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif;
--font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
```

Geist (or other display fonts) may be used **only** if registered as an optional
**display** token and enabled via appearance; default is system/SF stack.

**Line length:** body content max ~66ch where reading is primary (lessons, about).

### 4.4 Spacing, radius, elevation

| System | Rule |
|---|---|
| **Space** | 4 pt base; scale 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 |
| **Hit target** | Minimum **44×44 pt** for all interactive controls |
| **Radius** | `radius.sm` (controls), `radius.md` (fields/cards), `radius.lg` (sheets), `radius.full` (pills/avatars only) |
| **Elevation** | `elevation.0` flat · `elevation.1` raised card · `elevation.2` popover · `elevation.3` modal |
| **Motion** | Duration tokens `motion.fast` / `normal` / `slow`; **zero motion** when `prefers-reduced-motion: reduce` |

### 4.5 Implementation home

| Artifact | Location (proposed) |
|---|---|
| CSS variables / `@theme` | `web/app/globals.css` + `web/styles/tokens.css` |
| TS token map (optional) | `web/lib/design/tokens.ts` |
| Primitive components | `web/components/ui/*` |
| Icons | `web/components/ui/icons/*` (SVG) |

---

## 5. Iconography

1. **No emoji as interface chrome** (trash, drag, lock, check, status). Content
   emoji in member-authored markdown is allowed.  
2. **SVG icon set** aligned with SF Symbols concepts: `trash`, `plus`, `xmark`,
   `chevron.*`, `play`, `lock`, `checkmark`, `grip`, `photo`, `link`, `gear`,
   `person`, `bell`, `sidebar`, etc.  
3. Default optical size **20×20** in toolbars; **24×24** for empty states; stroke
   weight consistent.  
4. Icons inherit `currentColor`; never hardcode brand hex in SVGs.  
5. Every icon button has an accessible **name** (`aria-label` or visible text).  

---

## 6. Component primitives (kit)

All new and migrated UI uses these. Variants are **closed enums**.

### 6.1 Actions

| Primitive | Variants | Notes |
|---|---|---|
| `Button` | `primary` · `secondary` · `tertiary`/`plain` · `destructive` · `tint` · `bordered` | Loading + disabled states; min height 44. **`bordered`** = Apple outline on inverse/dark chrome (transparent fill, `--color-on-inverse` stroke + label, hover/press fill, tint focus ring). Capsule `radius-full`. |
| `IconButton` | same intents | Square 44×44; requires accessible name |
| `Link` | inline / standalone | Uses `color.tint`; underline on focus/hover per HIG web practice |
| `SegmentedControl` | 2–5 segments | Tabs that are mutually exclusive filters |
| `Menu` / `MenuItem` | — | Keyboard navigable; for overflow actions |

### 6.2 Inputs

| Primitive | Notes |
|---|---|
| `TextField` | Label, helper, error; never placeholder-only labels |
| `TextArea` | Same; markdown editors compose on top |
| `Select` | Native or custom with full keyboard |
| `Checkbox` / `Switch` / `RadioGroup` | 44pt targets |
| `SearchField` | Clear button, submit semantics |

### 6.3 Feedback & modality

| Primitive | Replaces | Rules |
|---|---|---|
| `AlertDialog` | `window.confirm` / `alert` | Title, message, **Cancel** (escape/default focus for non-destructive), primary or destructive confirm |
| `Sheet` / `Modal` | Ad-hoc fixed overlays | Scrim, focus trap, Esc closes non-critical |
| `Banner` | Inline page notices | Info / warning / success; dismissible when appropriate |
| `Toast` | Transient success | Optional; never sole carrier of errors that need action |
| `Progress` / `Spinner` | Busy states | Determinate preferred when known |
| `EmptyState` | “No items” prose | Icon + title + one action |

**Destructive pattern (mandatory):**

1. Control uses `destructive` visual intent.  
2. Opens `AlertDialog` with item **name**, consequence sentence, **Cancel** + **Delete**.  
3. Confirm is the only path that calls DELETE APIs.  
4. Browser `confirm()` / `alert()` are **banned** after kit lands (lint rule §11).  

### 6.4 Structure

| Primitive | Use |
|---|---|
| `List` / `ListRow` | Grouped inset lists (modules, settings, resources) |
| `Card` | Marketing / catalog only when content needs a media face |
| `Toolbar` | Top actions for edit mode and admin |
| `Sidebar` | Admin app navigation; optional member course nav rail |
| `TabBar` | Course tabs, admin sections |
| `FormSection` | Grouped labeled fields |

### 6.5 In-place edit affordances

| State | Visual |
|---|---|
| View | No dashed noise |
| Edit mode on | Subtle tint outline or material on editable regions; toolbar present |
| Field focused | Standard focus ring (`color.tint`) |
| Dirty | Save / Discard in toolbar (not only browser leave warning) |
| Structure ops blocked while dirty | `AlertDialog` or Banner explaining Save/Discard first |

---

## 7. Navigation & shells

### 7.1 Member shell

- `SiteHeader`: mark, primary nav, auth cluster (login / avatar menu).  
- Primary nav items are **data-driven** from appearance chrome config (§10) with
  safe defaults.  
- No membership hard-sell in the header beyond one clear Join/Membership path
  when logged out (Tango).  
- Footer: legal / about / resources — also configurable within allowlist.  

### 7.2 Admin app shell (`/admin/*`)

Per Admin Dual Surface v1.0, plus HIG:

- Persistent **sidebar** (or top tabs on narrow viewports).  
- **Toolbar** region for page actions.  
- Identity readout; “View site”; notification bell.  
- `noindex`; no member upsell chrome.  

### 7.3 In-place admin chrome

- Single **edit toolbar** pattern (not one-off FABs per page long-term).  
- Enter / exit edit mode explicit.  
- Structural vs content edit rules unchanged from In-Place Admin specs.  

---

## 8. Page templates (composition)

Echo-owned layouts Charlie reuses:

| Template | Key regions |
|---|---|
| **Hub home** | Hero / intro video, value prop, flagship course, FAQ |
| **Catalog** | Filters, card grid, empty |
| **Course detail** | Trailer hero, metadata strip, enroll rail, tabs |
| **Lesson** | Player, notes, course nav rail, progress |
| **Auth** | Centered form card, SSO stack, errors |
| **Dashboard / Me** | Resume, lists, stats |
| **Live** | Calendar + detail |
| **Resources** | Library list + admin tools |
| **Admin list/detail** | Toolbar + table/list + inspector optional |
| **Admin board** | Kanban; still uses kit controls/dialogs |

Course detail remains the **flagship** polish budget (Echo charter).

---

## 9. Accessibility (floor)

1. **WCAG 2.2 AA** contrast for text and essential icons.  
2. Visible **focus** on all interactive elements (`:focus-visible`).  
3. **Keyboard**: tab order matches reading order; menus/dialogs fully operable.  
4. **Names**: icon-only controls labeled; form fields associated with labels.  
5. **`prefers-reduced-motion`**: disable non-essential animation.  
6. **Hit targets** ≥ 44×44 pt (padding allowed to expand visual glyph).  
7. Do not rely on color alone for state (error = text + icon).  

---

## 10. Admin control over major interface elements

### 10.1 Purpose

Administrators must be able to shape **major interface elements** without
deploys: brand presence, chrome composition, hub structure, density, and
announcements — within a **typed, validated schema** that cannot break security
or HIG invariants.

This is the **Appearance & Chrome Control Plane**.

### 10.2 Principles

| Principle | Rule |
|---|---|
| **Config-driven, fail loud** | Invalid appearance documents rejected at write (422); corrupt read falls back to **compiled defaults** and logs loudly (operator Banner in `/admin`). |
| **Allowlisted** | Only keys in this spec (and versioned extensions) are writable. Unknown keys → 422. |
| **No code injection** | No freeform CSS, JS, HTML chrome, or remote font URLs outside Media Library / approved font tokens. |
| **Preview then publish** | Draft appearance vs published appearance; public site reads **published** only. |
| **One brand language** | Overrides re-tint tokens; they do not create a second component kit. |
| **Auditability** | Who published what, when (`updated_by`, `updated_at`, optional note). |
| **Role** | `administrator` only for write; public/member GET of published safe subset. |

### 10.3 Control surfaces (what admins can change)

#### A. Brand

| Control | Type | Notes |
|---|---|---|
| Product name (display) | string ≤ 64 | Default “FatTail Labs” |
| Wordmark / logo | media ref (public tier) | Light + dark optional pair |
| Favicon | media ref | Optional |
| Tint | enum of approved swatches **or** constrained hue token | Not arbitrary CSS gradients |
| Support / contact URL | https URL allowlist | Optional |

#### B. Appearance mode

| Control | Values |
|---|---|
| Color scheme | `system` \| `light` \| `dark` |
| Density (operator + optional member) | `comfortable` \| `compact` |
| Corner style | `rounded` \| `smooth` (maps to radius token set) |
| Display font | `system` \| `registered_display` (if enabled) |

#### C. Member chrome

| Control | Type |
|---|---|
| Header nav items | ordered list of `{ id, label, href, visibility }` from **allowlisted routes only** |
| Header CTA | `{ mode: hidden \| membership \| custom_allowlisted, label? }` |
| Footer columns / links | allowlisted hrefs + labels |
| Show pathway / live / resources in nav | booleans (must still respect auth/entitlements at page level) |

**Allowlisted member routes (v1):**  
`/`, `/courses`, `/labs`, `/live`, `/resources`, `/pathway`, `/dashboard`, `/me`,
`/settings`,
`/membership`, `/guide`, `/about`, `/login`, `/signup` — plus future entries only
via spec version bump.

**Primary chrome (default):** Courses · **Labs** · Resources · Live · About · Guide.  
**Not primary chrome:** Pathway (funnel / role-sequenced later; not a survey tab).  
**Labs hub:** member practice tools — Trade Log, Journal, Playbook, Statistics, Vexy.

#### D. Hub composition (major regions)

Ordered, toggleable **regions** on `/`:

| Region id | Default | Admin can |
|---|---|---|
| `hero_intro` | on | toggle, set title/subtitle (markdown ≤ limits), bind intro video id |
| `flagship_course` | on | toggle, choose course slug |
| `value_props` | on | toggle, edit ≤ N cards (title + body) |
| `faq` | on | toggle; FAQ body still via hub in-place / CMS fields where already specified |
| `custom_banner` | off | toggle, text + optional link (allowlisted) |

Region order is reorderable within the known set. **Unknown region ids rejected.**

#### E. Course & learning chrome

| Control | Type |
|---|---|
| Course tab set | enable/disable tabs from allowlist: About, Modules, Resources, Discussion, Students |
| Default course tab | enum |
| Lesson nav rail | `expanded` \| `collapsed_default` \| `hidden_on_small` |
| Catalog card fields | toggles: level, lesson count, categories (rating later) |

#### F. System announcements

| Control | Type |
|---|---|
| Global banner | `{ enabled, severity, message, href?, dismissible, starts_at?, ends_at? }` |
| Maintenance mode note | optional Banner for members (does not replace infra maintenance) |

#### G. Operator shell

| Control | Type |
|---|---|
| Admin sidebar pin order | ordered allowlisted admin nav ids |
| Default `/admin` landing | allowlisted admin path |
| Board density | `comfortable` \| `compact` |

### 10.4 Token overrides (constrained)

Admins may override **only**:

```text
tint.base
tint.emphasis   (optional; else derived)
```

Optionally (if Coach enables in v1.1):

```text
canvas, surface, label   // from approved neutral ramps only
```

**Not overridable:** destructive color, focus ring geometry, minimum hit targets,
type scale ratios, motion reduced-motion behavior, z-index modal policy.

Overrides are stored as **token keys → palette refs**, not raw CSS strings.

### 10.5 Data model

```text
site_appearance
  id                 BIGINT PK  (singleton row id=1 OR env-scoped)
  schema_version     INT NOT NULL          -- matches this spec major
  draft_json         JSON NOT NULL
  published_json     JSON NOT NULL
  draft_updated_at   DATETIME
  published_at       DATETIME NULL
  published_by       BIGINT NULL           -- identities.identity_id
  publish_note       VARCHAR(512) NULL
```

**JSON document** (illustrative shape; formal JSON Schema ships with implementation):

```json
{
  "schema_version": 1,
  "brand": {
    "display_name": "FatTail Labs",
    "logo_light": null,
    "logo_dark": null,
    "tint": "emerald"
  },
  "appearance": {
    "color_scheme": "system",
    "density": "comfortable",
    "corner_style": "rounded",
    "font": "system"
  },
  "member_chrome": {
    "nav": [
      { "id": "courses", "label": "Courses", "href": "/courses", "visibility": "always" },
      { "id": "live", "label": "Live", "href": "/live", "visibility": "member" }
    ],
    "header_cta": { "mode": "membership", "label": "Join" }
  },
  "hub": {
    "regions": [
      { "id": "hero_intro", "enabled": true, "title": "…", "subtitle_md": "…" },
      { "id": "flagship_course", "enabled": true, "course_slug": "…" }
    ]
  },
  "course_chrome": {
    "tabs": ["About", "Modules", "Resources", "Discussion", "Students"],
    "default_tab": "About",
    "lesson_nav": "expanded"
  },
  "announcement": { "enabled": false },
  "operator": {
    "admin_nav_order": ["board", "media", "cast", "ai", "agents"],
    "admin_home": "/admin/board",
    "density": "comfortable"
  }
}
```

### 10.6 API

| Method | Path | Auth | Behavior |
|---|---|---|---|
| `GET` | `/api/appearance` | public | **Published** document + resolved token hints safe for client theming |
| `GET` | `/api/admin/appearance` | administrator | Draft + published + meta |
| `PUT` | `/api/admin/appearance/draft` | administrator | Validate schema; save draft |
| `POST` | `/api/admin/appearance/publish` | administrator | draft → published; revalidate layout paths |
| `POST` | `/api/admin/appearance/discard` | administrator | draft ← published |
| `GET` | `/api/admin/appearance/schema` | administrator | JSON Schema + allowlists for UI builders |

Validation failures: **422** with field paths. No partial silent drop of unknown keys.

### 10.7 Admin UI

New control-plane pages (HIG operator dialect):

| Route | Purpose |
|---|---|
| `/admin/appearance` | Overview: publish state, preview link |
| `/admin/appearance/brand` | Logo, name, tint |
| `/admin/appearance/chrome` | Nav, CTA, footer |
| `/admin/appearance/hub` | Region toggles / order / bindings |
| `/admin/appearance/course` | Tabs, lesson nav defaults |
| `/admin/appearance/announcement` | Global banner |
| `/admin/appearance/operator` | Admin shell prefs |

**Preview:** “Preview draft” opens member site with `?appearance=draft` **only for
administrators** (cookie + role); never indexable; no public leak of draft.

### 10.8 Client application of appearance

1. Root layout fetches **published** appearance (cached; revalidate on publish).  
2. Applies `data-density`, `data-corners`, `data-theme` on `<html>`.  
3. CSS maps those to token sets.  
4. `SiteHeader` / hub / course tabs **read config**, not hardcoded lists.  
5. Missing optional fields use **compiled defaults** from this spec.  

### 10.9 Security & product boundary

- Administrator role only for mutations (Mike).  
- URL allowlist prevents open redirects in CTAs.  
- Media refs must exist in public media tier.  
- Appearance never grants entitlements or bypasses lesson gates.  
- No MSC imports; Labs owns schema and API.  

### 10.10 Forward compatibility

- `schema_version` integer; readers must accept **older** published docs by
  migrating in code (explicit migration functions).  
- New controls require **spec bump** (v1.1+) and schema migration — not silent
  new keys in production admin without docs.  
- Future: per-environment appearance (staging vs prod) via config, not hardcoding.  

---

## 11. Engineering standards

### 11.1 Directory conventions

```text
web/
  styles/tokens.css
  components/ui/           # primitives only
  components/ui/icons/
  lib/design/              # token helpers, appearance types
  components/appearance/   # admin appearance editors (operator)
```

Feature folders (`components/edit`, `admin`, …) **consume** `ui/*`; they do not
redefine buttons.

### 11.2 Lint / CI (phased)

After kit lands:

| Rule | Enforcement |
|---|---|
| No `confirm(` / `alert(` in `web/` | ESLint forbidden |
| No emoji in `components/ui` and chrome paths | review + optional lint |
| Prefer `bg-canvas` token classes over raw `bg-zinc-*` | migration codemod + review |
| Appearance writes validated server-side | tests |

### 11.3 Testing

| Layer | Evidence |
|---|---|
| Unit | Token presence; appearance schema accept/reject |
| Component | Button/AlertDialog a11y smoke |
| E2E | Publish appearance → public header reflects nav; destructive delete uses dialog |
| Visual (later) | Light/dark snapshots for hub, course, lesson, admin |

### 11.4 Characterization

Existing API characterization suite remains green; appearance endpoints add tests
in the same change as the migration.

---

## 12. Compliance program (phased delivery)

| Phase | Name | Exit criteria |
|---|---|---|
| **H0** | Constitution | This spec approved; decision log; Echo reference boards |
| **H1** | Foundation | Tokens + `ui/*` primitives + icons + AlertDialog; lint bans confirm/alert for new code |
| **H2** | Member flagship | Shell, hub, catalog, course detail, lesson player on kit |
| **H3** | Member secondary | Auth, dashboard, live, resources, quizzes, social tabs |
| **H4** | In-place admin | Edit toolbar, structure ops, media, danger zone on kit + dialogs |
| **H5** | Appearance control plane | §10 schema, API, `/admin/appearance/*`, publish/preview |
| **H6** | Operator admin | Board, cast, media, AI, agents restyled; density tokens |
| **H7** | Hardening | A11y audit, reduced motion, visual gates, Delta PASS |

**Interim rule:** Bugfixes before H1 (e.g. clickable delete) may ship with native
dialogs **only if** tracked for replacement in H1/H4; no new emoji chrome.

**Parallelism:** H5 (appearance data model) may start after H1 tokens exist;
public application of appearance requires H2 shell consumption points.

---

## 13. Governance & review

| Gate | Owner | Blocks on |
|---|---|---|
| Spec approval | Coach | Scope, brand limits, admin power boundary |
| Design system detail | Echo | Tokens, primitives, templates |
| Architecture | India | Schema, API, caching, product boundary |
| Member honesty | Tango | CTA density, announcement misuse, pathway pressure |
| Security | Mike | Injection, open redirects, role checks |
| Implementation | Charlie | Kit + migrations + pages |
| Evidence | Delta | Ternary gate per phase |

**Change control:** Appearance schema and token names are contractual. Expanding
admin power requires a versioned spec update — not a quiet JSON field.

---

## 14. Success metrics

1. **Zero** raw browser `confirm`/`alert` in production client.  
2. **Zero** emoji used as action icons in chrome.  
3. **100%** of new UI in `components/ui` or composed from it.  
4. Administrator can change **logo, tint, nav, hub regions, course tabs,
   announcement** via `/admin/appearance` and publish without deploy.  
5. Echo can review light/dark + three viewports against token references.  
6. AA contrast on member flagship templates.  

---

## 15. Resolved decisions (Coach 2026-07-24)

| # | Topic | Decision |
|---|---|---|
| 1 | **Tint model** | **Closed swatch enum only** in v1.0 (`emerald` + future approved swatches). Custom hex deferred to v1.1 with contrast checks. |
| 2 | **Display font** | **System / SF stack only** in v1.0. No registered webfont toggle until v1.1. |
| 3 | **Member density** | **Admin-controlled only** (`comfortable` \| `compact` on published appearance). Per-user preference later if needed. |
| 4 | **Draft preview** | **Administrator session + `?appearance=draft`**. Never public; never indexable. |
| 5 | **Hub FAQ** | **Region toggle/order** via appearance; **FAQ body content** remains hub in-place CMS (not appearance JSON). |  

---

## 16. References

- Apple Human Interface Guidelines (Apple Developer) — principles adopted in §2.  
- Echo charter: `agents/bench/echo.md`  
- Admin Dual Surface Spec v1.0  
- In-Place Admin Specs v1.0–v1.5  
- Architecture/03-frontend-design.md  
- Pre-spec audit: session HIG compliance scope (2026-07-24)  

---

## 17. Document history

| Version | Date | Notes |
|---|---|---|
| v1.0 | 2026-07-24 | Approved: HIG constitution, tokens, kit, phases, Appearance control plane; §15 locked |
| v1.0.1 | 2026-08-14 | Allowlisted member route `/settings` (Member Settings Spec v1.0 · DL-338) |

---

*Polish is not decoration. It is the evidence that someone cared — and that operators
can steer the product face without forking the codebase.*
