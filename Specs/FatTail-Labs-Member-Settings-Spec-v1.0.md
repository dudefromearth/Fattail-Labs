# FatTail Labs — Member Settings — Spec v1.0

**Status:** Approved as built (Coach 2026-08-14)  
**Phase:** Member chrome  
**Home:** `/settings` (signed-in)  
**Decision log:** DL-338

---

## 1. Intent (Coach)

Add a **Settings** page to the User (account) menu. It is similar to **Profile**, but
it is the catch-all for **application and site-wide settings**.

Coach examples:

- **Appearance** — Light / Dark, including invoking the **system** setting
- **Font size** — small, medium, large, larger
- **Alert settings** — not available yet, but **supported** (UI from Coach reference
  `/Users/ernie/Pictures/alert-settings.png`)

Profile remains identity, photo, Journey visibility, and Practice data. Settings is
not a second Profile.

---

## 2. Product law

| Decision | Choice |
|----------|--------|
| Entry | Account menu item **Settings**, next to **Profile** |
| Route | `/settings` — same chrome as `/me`; robots noindex |
| Auth | Signed-in only (same posture as Profile) |
| Persistence | This device (`localStorage`). No new API in v1.0 |
| Site vs member appearance | **Member override wins** when set. Unset → published site appearance (`AppearanceRoot`) |
| Color scheme | `system` \| `light` \| `dark` |
| Font size | `small` \| `medium` \| `large` \| `larger` (default **medium**) |
| Alerts | Settings UI is supported and saved. **Delivery is not live.** SMS and Email digest stay **Coming soon** (disabled) |
| Not in v1.0 | Extra sidebar destinations from the reference (Symbols, Tags, Brokerage, Streaming, …). Those surfaces already live elsewhere or are not requested |

---

## 3. Surfaces

### 3.1 Account menu

After **Profile**: **Settings** → `/settings`.

### 3.2 Settings shell

Two panes (catch-all; more panes only by spec bump):

1. **Appearance**
2. **Alerts**

Deep link: `/settings?section=appearance` \| `/settings?section=alerts`.

### 3.3 Appearance

- Color scheme segmented control: **System** · **Light** · **Dark**
- Font size segmented control: **Small** · **Medium** · **Large** · **Larger**
- Changes apply **immediately** site-wide (`data-theme`, `data-font-size` on `<html>`)
- **System** removes `data-theme` so `prefers-color-scheme` applies
- First paint: blocking script reads the stored document so theme/size do not flash

### 3.4 Alerts (supported, not delivered)

Transcribe the Coach reference pane:

| Block | Controls |
|-------|----------|
| **Threshold Rules** | Empty copy + **+ Add Rule**. Rules are local drafts only |
| **Alert Delivery** | Destinations: In-app, Process surface, OS notifications (persisted). **SMS** and **Email digest** — Coming soon, disabled |
| **Severity Minimums** | Per destination: In-app, Process surface, OS notifications, SMS, Email digest, Journal. Values: Info · Low · Medium · High · Critical |
| **Alert Classes** | Threshold · Algo · Prompt · System |
| **Quiet Hours** | Start, End, Min severity, Timezone |
| **Digest Mode** | Batch non-critical alerts into periodic summaries |

Honest banner on the pane: delivery is **not live**; values are saved for when alerts ship.

---

## 4. As-built files

| Path | Role |
|------|------|
| `web/app/settings/page.tsx` | Route |
| `web/components/settings/MemberSettingsApp.tsx` | Shell |
| `web/components/settings/AppearancePane.tsx` | Theme + type |
| `web/components/settings/AlertsPane.tsx` | Alert settings UI |
| `web/components/settings/MemberSettingsRoot.tsx` | Apply stored prefs after mount |
| `web/lib/memberSettings.ts` | Document, storage, apply |
| `web/components/SiteHeader.tsx` | Menu link |
| `web/components/appearance/AppearanceRoot.tsx` | Skip site `color_scheme` when member override is set |
| `web/styles/tokens.css` | `data-font-size` scale |
| `web/app/layout.tsx` | First-paint boot script |

---

## 5. Out of scope (v1.0)

- Server-synced prefs / new profile columns
- Live alert evaluation, OS permission prompts, SMS, email
- Wiring Analyzer threshold cards to these destinations
- Admin Appearance control-plane changes (site publish remains `/admin/appearance`)
