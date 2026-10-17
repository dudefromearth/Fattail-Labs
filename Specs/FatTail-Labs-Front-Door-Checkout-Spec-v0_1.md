# FatTail Labs Front Door Checkout — Spec v0.1

**Status:** As-built record of the StudioTwo checkout. Coach has not stamped this file. It is not build authority for production, for traffic, or for a real charge.
**Date:** 2026-10-14
**Machine:** StudioTwo (`StudioTwo.local`). Browser `http://studiotwo:3000`. Next on port 3000. API on port 4000. No MiniTwo change, no deploy, no traffic move.
**Scope:** The checkout that is mounted in this repo: product choice, account, Navigator contact, simulated card and PayPal submit, membership grant, home page, and Discord connect.
**Does not supersede:** `Specs/Observer-Navigator-Funnel-Spec-v1.1.md` (DRAFT, not build authority) or `Specs/Observer-Navigator-Funnel-Spec-v1.0.1.md` (approved DL-826). Those files stay on disk, unchanged. Where the running checkout and the funnel draft use different words, this file records the running checkout.

## What this file is

This is the first version of the checkout record. It describes the door that is in the tree on the date above. A later change to that door is a new version of this file.

The preview checkout in a separate tree is outside this record.

## 0. Where it runs

| ID | Law |
|---|---|
| **CK-HOST** | The mounted door is this repo on StudioTwo. Pages: `/access`, `/access/choose`, `/access/order`, `/access/paypal`, `/access/discord/open`, `/access/discord/done`, and the Discord section on `/home`. |
| **CK-ADMIT** | Those access pages render with the door open. `offers.json` still stores `traffic_percent` 0 and `kill_switch` false. The access pages do not read that percent, so 0 does not close `/access`. |
| **CK-MOUNT** | `server/main.py` includes `server/routes/front_door_access.py` and does not mount a second front-door router. `FrontDoor.tsx` still contains start, watch, and confirm branches. No page under `web/app/access` mounts those branches. |

## 1. Catalog

Prices and copy come from `web/lib/frontDoor/offers.json`. The five checkout products are fixed in `CHECKOUT_PRODUCT_IDS` in `web/lib/frontDoor/offers.ts`. The chooser shows those five. It does not consult the `enabled` flag. Activator and Monthly intro stay in the file and stay off the chooser.

| ID | Law |
|---|---|
| **CK-CATALOG** | The checkout products, in order, are Observer, Navigator Monthly, Navigator Quarterly, Navigator Annual, and Navigator Lifetime. |
| **CK-PRICE** | The amounts below are the amounts in `offers.json` on this date. A price change is a new version of this file and a change to that file together. |
| **CK-DISCLOSE** | Observer is the only product that says "You can cancel anytime. No refunds." A disclosure that begins with "Optional." is not shown to the member. |

| Product id | Chooser name | Order-page name | Price | Regular price | Shown disclosure | Term written by the grant |
|---|---|---|---|---|---|---|
| `observer` | Trial, card title "Observer Trial" | Observer | $17/week × 6 ($102 total on the chooser) | none | You can cancel anytime. No refunds. | plan `observer-trial`, 42 days |
| `navigator-monthly` | Monthly | Navigator Monthly | $267/month | none | $267 per month. | plan `navigator`, 31 days |
| `quarterly` | Quarterly | Navigator Quarterly | $597 / quarter | $801 | none (the file text begins with "Optional.") | plan `navigator`, 92 days |
| `navigator-annual` | Annual | Navigator Annual | $1,997/year | $2,997 | $1,997 per year. A separate purchase from Observer. | plan `navigator`, 366 days |
| `navigator-lifetime` | Lifetime | Navigator Lifetime | $3,000 | $4,997 | One payment. No renewal. | plan `navigator`, no end date |

Chooser badges are fixed labels, not a live ratio: Quarterly "Save 25%", Annual "Save 33%", Lifetime "Save 40%".

Public link aliases, accepted on `/access/order`, are `trial`, `monthly`, `quarterly`, `annual`, and `lifetime`. `trial` is the Observer product. The canonical id is what the grant stores.

Observer describes itself as six weeks of practice that does not become Navigator on its own. Each Navigator product describes itself as a separate purchase from Observer. The plan row `observer-trial` has `grants_role` `navigator` (`migrations/076_create_observer_trial_plan.sql`). The page does not call a new account an Observer before that grant exists.

## 2. How a product is chosen

| ID | Law |
|---|---|
| **CK-CHOOSER** | `/access` is the demo launcher. Website origin opens `/access/choose`. Email and QR origins open `/access/order` for one product. |
| **CK-ORDER** | `/access/order` shows the product that the URL named. The order page has no control that changes the product and no anchor that leaves the account and payment. The place to pick a different product is `/access/choose`, before the order opens. |
| **CK-ORIGIN** | The order records origin `website`, `email`, or `qr`. A missing origin is `website`. The arrival line names the origin, the short product name, and the sale price. |

`/access/choose` continues by assigning the browser to `/access/order?origin=website&product=<alias>`. The continue control is a button, not an anchor. The chooser page itself links back to `/access` with the words "Demo launcher".

## 3. Account

| ID | Law |
|---|---|
| **CK-DEMO** | Every account this door creates is `is_demo=1`. Join, login, password, grant, close, and Discord start refuse an identity that is not a test account. A signed-in non-demo session sees: "This browser is signed in to a Labs account that is not a test account. Use a private window." |
| **CK-ACCOUNT** | Belonging is an account without a purchase. Create account sends email, first name, and last name. The signed-in line says the person has a login, is on the mail list, and that the content that comes with an account is open. The purchase below is optional. |
| **CK-LOGIN** | The login field is labeled Username. The API reads that value as the email. The password is the test account's password. A mismatch says "That email and password do not match a test account." |
| **CK-PASSWORD** | After create, the page asks for a password of at least 10 characters, entered twice, and saves it with `POST /api/front-door/access/password`. Payment stays closed until that password is set. |

Create account requires a first name, a last name, and the same email in both email fields. An email that already exists says "An account already exists for this email." and offers Sign in. There is no email-only control on this door.

The session cookie is the Labs `ft_session` cookie from the access session response.

## 4. Navigator contact

| ID | Law |
|---|---|
| **CK-CONTACT** | Phone, street, city, state, ZIP code, and country are required before a Navigator payment opens. Observer does not ask for them. |
| **CK-CONTACT-HOLD** | The fields stay mounted while the member types. When the phone has at least 10 digits and the five address fields are filled, the fields are replaced by "Phone and address are on this order." |
| **CK-CONTACT-STORE** | The contact values live in the browser draft (`sessionStorage`). Join and grant do not receive them. |

A Navigator order with a signed-in account and an incomplete address keeps Payment closed and notes "Phone and address".

## 5. Payment

| ID | Law |
|---|---|
| **CK-PAY** | Credit Card and PayPal each have their own Submit payment button. There is no shared Continue button. |
| **CK-CARD** | The card number stays in the browser. The grant request body is `{ "product_id": "<id>" }`. |
| **CK-SIM** | This door does not charge a card and does not charge PayPal. Submit is a local stand-in that then calls the grant. |
| **CK-FAIL** | A failed submit clears the card name, number, expiration, and security code, clears the selected method, and shows the exception plus "Choose Credit Card or PayPal." |

Payment opens after the account is complete, the Navigator contact is complete when the product is a Navigator product, and both boxes are checked:

- "I agree that FatTail and Coach Ernie, employees, and service providers are not fiduciaries or financial advisors, and none of FatTail's content constitutes financial advice."
- "I have read and agree to the full Terms and Conditions."

Card submit accepts the payment only when the name has at least two characters, the number has at least 13 digits, the expiration is `MM/YY`, the security code has at least 3 characters, and the expiration month is the current month or later. Otherwise the exception is "Enter the name, a card number, the expiration, and the security code." An expiration before the current month says "The card is expired." The digits `4000000000000002` say "The card was declined." Any other complete, unexpired number calls the grant.

PayPal submit opens `/access/paypal` in a window named `fd-paypal`. That window shows the product name and the sale price and has its own Submit payment button. The button posts `{ source: "fd-paypal", ok: true }` to the order page and closes. The order page then calls the same grant. If the window does not open, the exception is "The PayPal window did not open." Closing the PayPal window without Submit payment leaves the order as it was.

A grant error uses the same failure reset. The exception text is the API detail.

The card fields are not written into the browser draft. The draft may remember that the selected method was card or PayPal.

## 6. Grant

`POST /api/front-door/access/grant` is demo-only.

| ID | Law |
|---|---|
| **CK-GRANT** | The body is the product id. Unknown ids return 422 "Unknown product." A missing plan row returns 503. |
| **CK-WRITE** | The membership source is `front-door`. One row is kept per identity, plan, and that source. A later grant of another Navigator product updates that same Navigator row: status active, `external_ref` set to the new product id, and the end date replaced. Observer uses the separate `observer-trial` plan, so it can sit beside a Navigator row. |
| **CK-PRIOR** | `prior_member` is decided before the write. It is true when the identity already has an active or grace membership on `observer-trial` or `navigator`. A role derived as observer, with no such membership, is not a prior member. |
| **CK-HOME** | After a successful grant, a person who is not a prior member and has no linked Discord id is sent to `/home?discord=setup`. A prior member, or a person who already has a linked Discord id, is sent to `/home`. |

The grant response includes `prior_member`, `discord_user_id`, `woocommerce: false`, and the session snapshot. When a Discord id is already stored, the grant also syncs the membership role. A role-sync failure does not undo the membership.

`POST /api/front-door/access/close` cancels memberships whose source is `front-door`. The checkout pages do not call it.

The order page also posts to `/api/front-door/member-state`, `/api/front-door/analytics`, and `/api/front-door/evidence`. Those routes are not mounted. The page ignores the failure. A checked terms box does not, on this host, persist a terms record.

## 7. Home and Discord connect

`DiscordHome` is the first section under the welcome header on `/home`.

| ID | Law |
|---|---|
| **CK-DISCORD** | Connect Discord opens a window named `fd-discord` at `/access/discord/open`. The home page stays on `/home`. The window asks Discord for `identify` and `guilds.join`, then returns to the same home page. |
| **CK-PROFILE** | The section reads `GET /api/front-door/access/discord`. Unlinked copy is "Not connected". Linked copy is "Connected", the screen name, and the avatar. |
| **CK-OVERLAY** | The overlay is up when the URL has `discord=setup`, or `sessionStorage` `fd_discord_setup` is `1`, and the profile is not linked. It has no close control. The only action is Connect Discord. When the profile is linked, the flag and the query are removed and the overlay is gone. |

While the window is open the button reads "Waiting for Discord…". If the window cannot open, the notice is "The Discord window did not open. Allow windows for this site, then try Connect Discord again."

The open page loads `GET /api/front-door/access/discord/start` and replaces the window location only when the URL begins with `https://discord.com/`. The authorize URL uses the signed state, `prompt=consent`, and redirect URI `{browser origin}/api/front-door/access/discord/callback`. State expires in 600 seconds. The origin must be an allowed CSRF origin.

The callback redirects to `/access/discord/done?result=<result>&from=window`. Results are `ok`, `denied`, `failed`, and `taken`. The done page tells the home page on `BroadcastChannel("fd-discord")` and, when `window.opener` exists, by `postMessage`, then closes after 150 ms. A message with `ok: true` refetches the profile. It does not mark the account linked by itself. If the refetch is still unlinked, the overlay stays.

A denied return says "Discord was not connected. Connect it to continue." A taken Discord account says "That Discord account is already on another Labs account." A failed confirm says "Discord did not confirm the account. Connect it to continue."

If the window is closed before a finish signal, and the profile is still unlinked, the same "Discord was not connected" notice is shown. The home page does not treat the window as failed merely because it is sitting on Discord.

A direct visit to the done page, with no popup, goes to `/home` on `ok` and to `/home?discord=setup&discord_error=<result>` otherwise.

Screen name is Discord `global_name`, or `username` when the global name is empty. Avatar is the Discord CDN avatar, or the default embed avatar when Discord has no custom avatar. `identity_discord_profiles` stores the Discord user id, username, avatar hash, and source `front-door`. It has no token columns (`migrations/091_identity_discord_profiles.sql`). The access token is used once to join the guild and is not stored.

On StudioTwo the community Discord application is unset, so this door uses the 0-DTE application. A finished Discord consent, with a real approval and a role visible on a person, has not been walked. The authorize window does open.

`POST /api/front-door/access/discord` remains a demo-only grant or revoke by numeric Discord user id. The member button does not call it. An id that is not all digits, or is shorter than 17 digits, returns 422 "Enter the numeric Discord user id." before any Discord call.

## 8. Discord roles

The bot and guild are the configured 0-DTE bot and guild. On StudioTwo that guild is the server named Trader of Options. The FatTail AI community guild is a different server and is not the guild this door writes.

| ID | Law |
|---|---|
| **CK-ROLE** | An active or grace `observer-trial` membership turns on the Discord role named Observer. An active or grace `navigator` membership turns on the Discord role named Navigator and turns Observer off. Both present: Navigator. |
| **CK-ROLE-OFF** | No active or grace membership of either plan turns both of those roles off. Missing roles are not created merely to remove them. |
| **CK-ROLE-JOIN** | A finished connect joins the guild with the one-time access token, adds the membership role, and removes the other one. A later grant, when Discord is already linked, runs the same sync without a join token. |
| **CK-ROLE-CREATE** | If the wanted role name is missing, the sync creates it hoisted and not mentionable, then assigns it. |
| **CK-ROLE-SHOW** | Unlinked, with a role name: "Connecting turns on your {role} role." Overlay, with a role name: "A Discord window opens on top of this page and turns on your {role} role. When it finishes, you are still here." Linked, with the role present on the member: the role name. Linked, with the role absent: "The {role} role is not on this Discord account yet." |

The configured 0-DTE role is not the Observer role and is not the Navigator role. This checkout does not assign it.

Role sync errors shown to the operator path are fixed sentences: "That Discord account is not in the server." and "Discord did not turn on the role." A missing bot or guild returns "Discord role change is not configured on this host." and makes no call. Discord error bodies are not returned to the client.

Observer and Navigator exist on Trader of Options. This record does not claim that a member has received either role.

## 9. Terms

| ID | Law |
|---|---|
| **CK-TERMS** | On the order page, Terms and Conditions is a button. It opens a panel above the form. Close returns to the order and is focused when the panel opens. |
| **CK-TERMS-BODY** | The public terms URL in `offers.json` is `https://fattail.ai/terms/`. That page has no agreement text. The panel says: "The terms page does not have the agreement text yet. Close returns you to the order." This record does not invent the agreement. |
| **CK-TERMS-LINKS** | The order page does not show the terms URL, the privacy URL, or the footer legal links. Other front-door entries that still mount `LegalFooter` may show them. The order page does not open a privacy panel. |

`offers.json` records `terms_version` and `privacy_notice_version` as `2026-10-12`, and `privacy_url` as `https://fattail.ai/privacy-policy/`.

## 10. Reset demo

| ID | Law |
|---|---|
| **CK-RESET** | Reset demo clears the order draft and `fd_discord_setup`. If the session is a demo account, it signs that account out and returns to `/access`. A non-demo Labs session is left signed in. If sign-out fails, the page stays and says "Sign out did not complete. Try Reset demo again." |

## 11. Access API

Prefix `/api/front-door/access`.

| Method | Path | Who | What it does |
|---|---|---|---|
| GET | `/catalog` | public | The five grant products, `sso: false`, `woocommerce: false`. |
| GET | `/state` | session or empty | Snapshot, or `{ "signed_in": false }`. |
| POST | `/join` | new demo email | Creates `is_demo=1`, starts the session. |
| POST | `/login` | demo account | Checks the email and password, starts the session. |
| POST | `/password` | demo session | Sets the password. |
| POST | `/grant` | demo session | Writes the membership for `product_id`. |
| POST | `/close` | demo session | Cancels `front-door` memberships. Not called by the pages. |
| POST | `/discord` | demo session | Links a numeric id of at least 17 digits and syncs roles. Not called by the Connect button. |
| GET | `/discord` | any session | Linked, screen name, avatar, role name, enabled roles. No snowflake in the response. |
| GET | `/discord/start` | demo session | Returns the Discord authorize URL. |
| GET | `/discord/callback` | the Discord return | Links, syncs, redirects to the done page. |

## 12. What this door does not do

| ID | Limit |
|---|---|
| **CK-LIMIT** | No real card charge. No real PayPal charge. No card number in a request. No OAuth token stored. No production traffic move. No WooCommerce checkout. No migration of existing members. No live Discord consent completed in the walk that produced this record. No agreement text invented for the terms panel. |

`woocommerce` on the grant response is false. Woo product ids remain in `offers.json` as catalog facts. This door does not send the browser to `fattail.ai/checkout/`.

## 13. Source of the record

| Piece | Path |
|---|---|
| Prices and disclosures | `web/lib/frontDoor/offers.json` |
| Product ids, aliases, price lines | `web/lib/frontDoor/offers.ts` |
| Week lines | `web/lib/frontDoor/copy.ts` |
| Contact rule | `web/lib/frontDoor/contact.ts` |
| Demo launcher | `web/app/access/page.tsx`, `web/components/front-door/EntryLinks.tsx` |
| Chooser | `web/app/access/choose/page.tsx`, `web/components/front-door/PriceCards.tsx`, `web/components/front-door/ProductPicker.tsx` |
| Order | `web/app/access/order/page.tsx`, `web/components/front-door/FrontDoor.tsx` |
| PayPal window | `web/app/access/paypal/page.tsx`, `web/app/access/paypal/return-button.tsx` |
| Discord window | `web/app/access/discord/open/open-client.tsx`, `web/app/access/discord/done/done-client.tsx` |
| Home section | `web/components/member-home/DiscordHome.tsx`, `web/components/member-home/MemberHome.tsx` |
| Access API | `server/routes/front_door_access.py` |
| Discord REST | `server/labs_discord/rest.py` |
| Observer plan | `migrations/076_create_observer_trial_plan.sql` |
| Discord profile table | `migrations/091_identity_discord_profiles.sql` |

## 14. Open with Coach

This file records the door that is running. It does not replace the funnel draft, and it does not authorize a charge, a traffic change, or a production Discord write.

The terms page still has no agreement text. A real card or PayPal charge is not in this door. A finished Discord approval has not been walked.
