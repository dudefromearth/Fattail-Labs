# FD-W1 — Foundation and direct order form

**Project:** Front door. **Gate:** FD-G1.
**Callsigns:** Alpha (config, member state, API), Mike (handoff), Charlie (order form), Echo, Tango, Kilo.

**In scope:** `server/front_door/` (offers, member state, handoff, API), `migrations/155_front_door.sql`, `web/app/front-door/order`, `web/components/front-door/FrontDoor.tsx`.

**Out of scope:** `server/routes/billing.py`, `server/progress/`, `web/app/membership/page.tsx`, Stripe charges, 301s, MiniTwo.

**Invariants:** prices from `offers.json` only. Five states. Woo read failure → sign in to check, no buy button. Handoff URL has `add-to-cart` and no price. No "trial", no profit claim.

**Done when:** pytest `front_door/tests` shows the five states, a config flip, and a handoff without a price. The order form is one screen: email, first name, last name, product, terms. No address.
