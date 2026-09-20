# 36 — StudioOne data plane · member & operator design

**Status:** DRAFT (pairs with Arch 36 + SODP spec v0.1). Echo/Tango review object.  
**Audience:** the trader on a remote UI, and Coach operating three UI machines.

This is **interaction and honesty design**, not a wireframe pack. The chart, picker, and banner already exist. This file says what must stay true when the server moves.

---

## 1. What the member is allowed to believe

- The chart is **price** for the contract they picked (Labs identity: ESZ2026), not a silent mix of prints and a different vendor key.
- If history is shorter than the requested window, the UI **says so** (SHORT HISTORY). Never a quiet Sep-6 wall.
- Volume profile on the same page is the same StudioOne home. One desk, one data building.

They never see computing-class, LAN IPs, or `ESZ6` vs `ESZ2026`. Vendor translation is backstage.

---

## 2. Remote UI (three hosts, one desk)

| Host | Feel | Constraint |
|------|------|------------|
| StudioTwo | Daily desk. `http://studiotwo:3000` | SSO callback **studiotwo**, not localhost |
| MacBook | Same desk, elsewhere | Named site URL + SSO callback for that host; same hop pin |
| MiniTwo | Production. `https://labs.fattail.ai` | Built Next only. Tailscale to StudioOne |

Same chrome. Same picker. Same banner grammar. If one host shows June and another shows Sep 6, that is a **hop failure**, not a “dev vs prod chart.”

---

## 3. Controls that do not move

- Symbol tile + TV search (REQ-003 / F1) — still Next. Data from symbology hop.
- Right-click settings (REQ-002) — still Next / A22 store. Not this plane.
- SHORT HISTORY — **payload-driven**. If `short_history` is true, the amber banner is mandatory (`data-testid="sa-short-history"`). A zinc “Price Nd” chip must not replace it when the flag is set.

---

## 4. Failure design (elegant, not silent)

| Named state | Member sees |
|-------------|-------------|
| SHORT HISTORY | Amber banner with served span and requested window |
| MASSIVE EMPTY / UNAVAILABLE | Named, calm, not yesterday’s short prints |
| NO STORE | Named (tail overlay missing is not a BASE failure) |
| hop 503 | Named “StudioOne registry/history unreachable” — not a blank chart pretending to be Sep 6 |

Do not re-apply a localStorage OHLC cache when `short_history` is true or span < requested window.

---

## 5. Operator (Coach) design

- StudioOne launchd is the data building. UI machines do not grow extra vp-api / chain-feed icons.
- Rollback of a StudioOne agent is one `launchctl bootout` line (CP-1).
- AP-1 is **his** pan to June on ES and MES. Screenshots are PP-1 only.

---

## 6. Tango / Echo binds

- Capacity: one honest range, not a second “try another machine.”
- No profit claim in banners.
- White/black settings dialog is REQ-002, not this spec.
- Computing-class never in the browser (Mike).
