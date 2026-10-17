# FatTail Labs billing — what we need from you, Ernie

Two short jobs. **About 10 minutes.** Nothing here affects the live site or current billing —
it only creates credentials alongside what already exists.

**Please don't send any of these values by email, Slack or text.** See *How to send them* at
the bottom.

---

## Job 1 — PayPal: create your own app (5 min) ⬅ the one we actually need

PayPal is about **a third of all FatTail subscriptions**, and a new checkout without PayPal
loses sales on day one. So this is the priority.

Right now PayPal works through credentials the **WooCommerce plugin** created during its setup,
not credentials you own. They work today, but they belong to that plugin's connection — so if
it's ever disconnected or removed they could stop working and billing would break. We're
retiring that plugin, so we need your own.

### Live credentials

1. Go to **developer.paypal.com** and log in with the PayPal account for
   `ernie@dudefromearth.com` (the business account behind merchant `M22DBMQN686X8`).
2. **Top right — switch the toggle from `Sandbox` to `Live`.** Everything below must be done in
   Live. This is the step that's easiest to miss.
3. Go to **Apps & Credentials**.
4. Find the **REST API apps** section. There's probably already a "Default Application" there —
   ignore it and click **Create App**.
5. Name it `FatTail Labs Billing` and create it.
   *If it asks for an app type, choose **Merchant**. If it doesn't ask, that's normal — the
   selector isn't always shown in Live.*
6. Click into the app you just made and find the **Features** section (it's a list of
   toggles further down the app's page).
7. Under **Features → Payment capabilities**, turn on **"Save payment methods"**.
   ⬅ **This is the one.** It's what lets us charge a customer's saved PayPal account on
   renewal. It is *not* labelled "Vault" in the dashboard, which is probably why you couldn't
   find it.
8. Under **Features → Payment methods**, turn on the toggle for **PayPal** — and **Venmo** too
   if it's listed (one customer pays by Venmo).
9. Copy the **Client ID**, then click **Show**/**Generate** next to Secret and copy the
   **Secret**.

**You do NOT need the card-saving capability.** That one requires separate approval for
"Expanded Checkout", and we don't need it — all 133 saved payment methods on the account are
PayPal wallet or Venmo, not cards.

### Sandbox credentials

Repeat steps 2–9 with the toggle set to **Sandbox**, naming the app
`FatTail Labs Billing TEST`, so we can test without touching real money.

### If a toggle won't turn on

Screenshot it and send it over. Some capabilities depend on the business account's status, and
if one is blocked we need to know before we build against it rather than after.

So that's **4 values**: live Client ID + Secret, sandbox Client ID + Secret.

## Job 2 — Stripe: three settings to check (3 min)

You've already got the API key sorted, so this is just three things to look at. In **Live
mode** at dashboard.stripe.com:

1. **Settings → Payments → "Automatic card updater"** — is it **ON**? It silently updates
   expired and replaced cards, and it's one of the biggest causes of lost renewals when it's
   off. Just tell us on or off.
2. **Settings → Payments → Statement descriptor** — what customers see on their bank statement.
   Tell us what it says. If it doesn't obviously read as FatTail, worth changing: "I don't
   recognise this charge" is a leading cause of disputes.
3. **Radar → Rules** — any custom rules? Our renewals happen without the customer present,
   which can look suspicious to aggressive fraud rules. A yes/no is fine, screenshot if there
   are any.

---

## ⏸ Webhooks — please DON'T create these yet

A webhook is how Stripe and PayPal tell us "that payment went through". We do need both, but
creating them early causes a real problem.

Stripe sends every event to **every** webhook you have set up. So a Labs webhook created today
would immediately start receiving all of the **current Woo** payments — 5 to 22 a day — and our
side isn't finished, so every one would fail. Stripe would email you about the failures and
eventually switch the endpoint off. The PayPal address doesn't exist yet at all.

We'll do these together when the code is deployed — it's 2 minutes. Written down here so
nothing gets forgotten:

**Stripe** (Developers → Webhooks → Add endpoint)
- URL: `https://labs.fattail.ai/api/billing/webhook`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`,
  `payment_intent.requires_action`, `payment_intent.canceled`, `charge.refunded`,
  `charge.dispute.created`, `charge.dispute.closed`, `setup_intent.succeeded`,
  `setup_intent.setup_failed`, `payment_method.automatically_updated`
- Copy the **signing secret** (starts `whsec_`)

**PayPal** (developer.paypal.com → your new app → Add Webhook)
- URL: `https://labs.fattail.ai/api/billing/webhook/paypal`
- Events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.PENDING`,
  `PAYMENT.CAPTURE.REFUNDED`, `CUSTOMER.DISPUTE.CREATED`, `VAULT.PAYMENT-TOKEN.DELETED`
- Copy the **Webhook ID**

The one you'd never guess matters: `VAULT.PAYMENT-TOKEN.DELETED`. A customer can remove FatTail
from their PayPal account at any time without telling us. Without that event, the first we'd
know is a failed renewal.

---

## How to send them

These credentials can charge your customers, so please not by email, Slack or text. Any of:

1. **Best** — put them straight into the server config yourself, with Conor on a call.
2. **1Password / Bitwarden** — a shared item or one-time share link.
3. **Phone call** — read them out.

### Why we're being fussy

While reviewing the plugins we found your **ActiveCampaign API key is currently readable by
anyone on the internet**. It's sitting in plugin backup files that the web server hands out as
plain text — nine files, going back to March. That key can read your whole contact database and
send campaigns, and it covers 0-DTE too.

That's separate from this project and needs fixing regardless — details in
`SECURITY-ac-key-exposure.md`. It's also exactly why we don't want to add payment credentials
to the pile of things sitting in a file somewhere.

---

## Checklist

- [ ] PayPal **live** Client ID + Secret, with **Vault** enabled
- [ ] PayPal **sandbox** Client ID + Secret
- [ ] Stripe: automatic card updater — on or off?
- [ ] Stripe: statement descriptor — what does it say?
- [ ] Stripe: any Radar rules — yes or no?
- [ ] Webhooks: not yet, we'll do them together
- [ ] The AC key exposure: worth 10 minutes of someone's time this week
