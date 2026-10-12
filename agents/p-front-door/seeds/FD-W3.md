# FD-W3 — Device profiles

**Project:** Front door. **Gate:** FD-G3.
**Callsigns:** Kilo, Hotel, Tango. Coach's phone is open, not a code gate in this GO.

**In scope:** `web/playwright.front-door.config.ts`, `web/e2e-front-door/front-door.spec.ts`. iPhone 14, Pixel 7, Pixel 7 at 500 kbps and 400 ms latency. Woo is `https://fattail.test` fulfilled by the spec.

**Out of scope:** a real card charge, MiniTwo, the live fattail.ai checkout.

**Done when:** each profile completes order form → mocked Woo pay → `/front-door/confirm` with order id FD-1001. No horizontal overflow, no address fields, 16px inputs, 44px targets. Screenshots in the run artifacts.
