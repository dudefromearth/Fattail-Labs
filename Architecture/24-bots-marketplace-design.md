# Bot Marketplace Framework — UX & Interaction Design

**Status:** Design locked (pre-implementation) — Spec **v0.1.2** · DL-243 · DL-244 · **DL-247**  
**Spec authority:** [`Specs/FatTail-Labs-Bot-Marketplace-Framework-Spec-v0.1.md`](../Specs/FatTail-Labs-Bot-Marketplace-Framework-Spec-v0.1.md)  
**System architecture:** [`23-bots-marketplace.md`](./23-bots-marketplace.md)  
**Owners:** Echo (HIG) · Charlie (implement) · Tango (member psychology) · Hotel (educational framing)

---

## 1. Intent

**Primary:** Members who **subscribe** to FatTail Labs see and **provision official FatTail Lab Bots** admins offer with that subscription — quiet, professional, process-first. Commerce happens on **WooCommerce**; Labs shows **entitled bots**.

**Secondary:** **Navigators** may **limited-share** process packages with other Navigators (notebook-to-notebook), not a public free store.

**Feel:** Catalog of taught process bots included with membership — not OA clone casino, not P&L rankings.

---

## 2. Surfaces (MVF only)

| Surface | Role |
|---------|------|
| Strategy Lab **Curate** | Multi-select bots · Create Package |
| Strategy Lab **Import** | File pick · preview · commit (extend existing import) |
| **Community** chat | Attachment card on package share |
| **Not MVF** | `/app/marketplace`, search, filters, ratings |

Breadcrumbs stay inside existing apps:

- `Apps › Strategy Lab › Curate`  
- `Apps › Community › {channel}`  

---

## 3. Create Package (Curate)

### 3.1 Entry

- Toolbar on Curate board: **Create Package** (enabled when ≥1 bot selected).  
- Optional: overflow menu on multi-select bulk bar.

### 3.2 Multi-select

- Checkbox on each Curate bot card/row.  
- Selection count chip: “2 bots selected”.  
- Clear selection control.

### 3.3 Modal

| Field | Rules |
|-------|--------|
| Title | Required; 1 line |
| Description | Required; short (≈ 1–2 sentences); placeholder process language |
| Package notes | Optional textarea (markdown lite) |
| Correlation notes | Optional; helper: “How these bots relate in *process* — not returns” |
| Bot list | Read-only names of selected bots |
| Actions | Cancel · **Create package** |

On success:

- Toast: “Package ready”  
- Primary: **Download**  
- Secondary: **Share to Community…** (opens channel picker if available)  
- Tertiary: Done  

### 3.4 Copy bans (Tango / Hotel)

Do not use: “monetize”, “top bots”, “win rate”, “performance package”, “edge”.  
Prefer: “process package”, “share with peers”, “import to Curate”.

---

## 4. Share to Community

### 4.1 Channel picker (minimal)

- Default channel: **Strategy Lab** app_home when present.  
- List active Community channels user can post to.  
- Confirm: “Post package card to #{channel}”.

### 4.2 Chat attachment card (Labs)

```text
┌─────────────────────────────────────────────┐
│  Bot package                                │
│  {title}                          v{version}│
│  {bot_count} bots · process package         │
│  Based on FatTail house: …   (if any)       │
│  {optional short description, 1 line}       │
│  [ Download ]  [ Import to Strategy Lab ]   │
└─────────────────────────────────────────────┘
```

**Verb:** **Import** (not Apply) for packages.  
**Never show:** P&L, win rate, expectancy, cash, “performance”.  
All free-text **encoded** on render (Spec §9 / R2).

Attribution: creator display name as Community already shows for messages (Discord name when linked).

### 4.3 Discord link-back (ships with F3)

Discord message (text or simple embed):

```text
Process package: {title} (v{version}) · {bot_count} bots
{provenance line if any}
Import in Labs: https://labs.fattail.ai/app/strategy-lab?import_package={id}
```

No claim that Discord installs or arms bots.

### 4.4 Manual download fallback (F1–F2)

Owner **Downloads** JSON (authed). Peer share via Community is F3+.

---

## 5. Import (Receiver)

### 5.1 Entry points

1. Attachment **Import to Strategy Lab** → deep-link with package id or file.  
2. Strategy Lab **Import Package** → file picker (`.json`).  
3. Existing full-lab import remains; marketplace format auto-detected.

### 5.2 Preview

| Show | Hide |
|------|------|
| Package title, description, version | Any performance fields |
| Bot names + pack_id | Cash / positions |
| House provenance if present | Rankings |
| “Will create N Curate drafts” | Deploy promise |

Honesty line:

> Imports become **your** Curate drafts. They are not armed for live trading.

### 5.3 Commit

- Spinner → success list of new bot names.  
- CTA: **Open Curate**.  
- Fail loud with structural reason (unknown pack, invalid format, too large).

---

## 6. Own packages (optional thin list)

MVF may ship a simple **My packages** under Strategy Lab settings or Curate overflow:

| Columns | Actions |
|---------|---------|
| Title, version, status, bot count, updated | Download · Share · Archive |

No public gallery.

---

## 7. Empty & error states

| State | Copy |
|-------|------|
| No selection | “Select one or more Curate bots to package.” |
| Create failed | Structural error message; no silent empty file |
| Import unsupported | “This file isn’t a FatTail bot package.” |
| Not entitled | Same soft wall as Strategy Lab |
| Anon download | Sign-in |

---

## 8. Accessibility

- Modal focus trap; Escape cancels.  
- Checkboxes keyboard operable.  
- Attachment card buttons labeled with package title.  
- Prefer-reduced-motion: no decorative confetti (there is none).

---

## 9. Voice / AI

**Out of MVF.** Visualize AI does not package bots. No auto-summary of “edge.”

---

## 10. Success heuristics (Echo / Tango)

1. Package create ≤ **3** interactions after selection.  
2. Peer understands attachment is a **process file**, not a live bot.  
3. Import never feels like “install and earn.”  
4. Zero leaderboard affordances in the path.

---

## 11. Out of design scope (MVF)

- Marketplace hub page  
- Search, tags, categories  
- Star ratings / reviews  
- Premium badge UI (hooks only in data)  
- Social graph of “popular packages”

---

## 12. Related

- Spec v0.1 §6, §10, §11  
- Arch 23 topology  
- Community message bridge (DL-242) for F5 attachment parity  
- Strategy Lab existing import UI patterns  
