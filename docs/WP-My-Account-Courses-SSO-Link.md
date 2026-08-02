# WordPress My Account → Labs (SSO deep links)

**Audience:** ops / Coach — My Account buttons and any “go to Labs” member links  
**Related:** [WooCommerce-SSO-Integration-Guide.md](./WooCommerce-SSO-Integration-Guide.md)  
**Labs code:** `GET /api/auth/sso/{provider}?sso=<jwt>&next=<path>` (`server/routes/auth_routes.py`)

---

## The problem

A bare Labs URL does **not** log the member into Labs.

| Link type | What happens |
|-----------|----------------|
| **Wrong** — direct Labs page | No `ft_session`; free-account / signup CTAs |
| **Right** — fotw-sso + Labs callback | WP mints JWT → Labs sets session → redirect to `next` (or `/home`) |

WordPress login (fattail.ai) and Labs login (labs.fattail.ai) are **separate sessions**. Labs only gets a session when the browser goes through **fotw-sso**.

**Never use as a member entry link:**

```
https://labs.fattail.ai/course
https://labs.fattail.ai/courses
https://labs.fattail.ai/
https://labs.fattail.ai/home
```

(Those are fine **after** the member already has an Labs session.)

---

## How deep links work

1. Member hits **fattail.ai/fotw-sso?redirect=…**
2. WP (if logged in) mints a short-lived JWT and redirects to the Labs **SSO callback**.
3. Labs verifies JWT, sets `ft_session`, then **302** to the `next` path (site-relative only).
4. If `next` is missing or unsafe → land on **`/home`**.

### Callback shape

```
https://labs.fattail.ai/api/auth/sso/wordpress:fattail?next=/course
```

fotw-sso appends the token as `&sso=<JWT>` (callback already has `?next=`).

### Full member link (encode the whole callback as `redirect=`)

```
https://fattail.ai/fotw-sso?redirect=<URL-encoded Labs callback including next>
```

---

## Production — copy-paste URLs (fattail.ai)

### Catalog (Courses) — recommended My Account “Courses” tab

```
https://fattail.ai/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail%3Fnext%3D%2Fcourse
```

One-line (paste into WP):

https://fattail.ai/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail%3Fnext%3D%2Fcourse

### Member home (default if you omit `next`)

```
https://fattail.ai/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail
```

https://fattail.ai/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail

### Common destinations

| After login, go to | `next` path | Full fotw-sso URL (paste) |
|--------------------|-------------|---------------------------|
| Course catalog | `/course` | https://fattail.ai/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail%3Fnext%3D%2Fcourse |
| Member home | `/home` | https://fattail.ai/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail%3Fnext%3D%2Fhome |
| Journey | `/app/journey` | https://fattail.ai/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail%3Fnext%3D%2Fapp%2Fjourney |
| Journal | `/app/journal` | https://fattail.ai/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail%3Fnext%3D%2Fapp%2Fjournal |
| Trade log | `/app/trade-log` | https://fattail.ai/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail%3Fnext%3D%2Fapp%2Ftrade-log |
| Wiki | `/app/wiki` | https://fattail.ai/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail%3Fnext%3D%2Fapp%2Fwiki |
| Guide | `/guide` | https://fattail.ai/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail%3Fnext%3D%2Fguide |

### Any Labs path

1. Choose a **site-relative** path starting with `/` (examples: `/course/my-slug`, `/app/journey`).
2. Build the Labs callback:

   ```
   https://labs.fattail.ai/api/auth/sso/wordpress:fattail?next=/your/path/here
   ```

3. URL-encode that entire callback and put it after `redirect=`:

   ```
   https://fattail.ai/fotw-sso?redirect=<encoded-callback>
   ```

**Browser console helper** (run on any page):

```javascript
const next = "/course"; // change me
const callback =
  "https://labs.fattail.ai/api/auth/sso/wordpress:fattail?next=" +
  encodeURIComponent(next);
console.log(
  "https://fattail.ai/fotw-sso?redirect=" + encodeURIComponent(callback)
);
```

**Safety:** `next` must be a relative path on Labs (`/…`). Absolute URLs (`https://…`), protocol-relative (`//evil`), and other open-redirect forms are ignored → member lands on `/home` instead.

---

## 0-DTE members

Same pattern; issuer path is `wordpress:0-dte`:

**Catalog:**

https://0-dte.com/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3A0-dte%3Fnext%3D%2Fcourse

**Default home:**

https://0-dte.com/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3A0-dte

---

## Staging (labs-stage)

**Catalog:**

https://fattail.ai/fotw-sso?redirect=https%3A%2F%2Flabs-stage.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail%3Fnext%3D%2Fcourse

**Default home:**

https://fattail.ai/fotw-sso?redirect=https%3A%2F%2Flabs-stage.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail

---

## Countdown / public home

The pre-launch countdown lives on public **`/`**. SSO does **not** send members there by default; it sends them to **`/home`** or to your **`next`** path (e.g. `/course`). Use the catalog deep link so members skip the countdown marketing page.

---

## Where to set links in WordPress

- WooCommerce → Settings → Advanced → Account endpoints (if Courses is a custom URL)
- Appearance → Menus (My Account menu)
- Custom HTML / buttons on the My Account dashboard
- Membership “view content” / post-purchase redirect URLs

Each button can use a **different** fotw-sso URL with a different `next` (Courses, Journey, Journal, …).

---

## Quick verify

1. Log into fattail.ai as a test member.
2. Open the catalog deep-link URL from this doc.
3. You should land on **`/course`** with a session (not free-account wall, not countdown `/`).
4. Same browser: `https://labs.fattail.ai/api/auth/me` → email + role JSON.

If SSO works but Labs still shows **Free account**: the JWT arrived without a mapped
Woo plan slug. Check:

1. WooCommerce → Memberships → Plans → the plan’s **slug** (e.g. `observer-access`).
2. Labs DB `provider_plan_map`: `wordpress:fattail` + that slug → Labs plan
   `observer-trial` (Observer) or `navigator` / `activator`.
3. Re-SSO after adding the map (session role is snapshotted at login).
4. API logs: `entitlement keys not in provider_plan_map` lists the unmapped slug(s).

See also [WooCommerce-SSO-Integration-Guide.md](./WooCommerce-SSO-Integration-Guide.md) §5.

---

## Same pattern as Labs “Continue with FatTail.ai”

Login button env (no `next` → `/home`):

```bash
LABS_SSO_LOGIN_URL_FATTAIL=https://fattail.ai/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail
```

My Account can use richer `next=` values so members land exactly where the button says.
