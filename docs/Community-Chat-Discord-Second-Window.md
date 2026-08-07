# Community chat — short description

How Labs Community works: member authorization via FatTail SSO, and message sync with the FatTail AI Discord server through admin-mapped channels.

**Surfaces:** `labs.fattail.ai/app/community` · app embeds (e.g. Strategy Lab)  
**Spec:** `Specs/FatTail-Labs-Community-App-Spec-v1.0.md`  
**Decisions:** DL-237–242 (Community, Discord connect, SSO claims, message bridge)

---

## What it is

**Labs Community** is a **second window on the same FatTail AI Discord server** — not a separate social network.

- Same people, same conversations, on **channels you map** between Discord and Labs.
- Beside chat: FatTail bots / process shelves (Labs owns those; Discord owns the guild text).

---

## How members get in (authorization)

There is **no separate “log into Community”** step.

1. Member is a **FatTail customer** (plan/membership on the Labs identity).
2. They already use **fattail.ai** (WordPress) — including Discord connect via the **fattail.ai plugin** when enrolled.
3. They open **labs.fattail.ai** and land with a Labs session via **SSO** (fotw-sso JWT from WordPress), same as the rest of Labs.
4. That session carries who they are; Labs resolves **entitlement** (observer / activator / navigator / admin, etc.).
5. **Discord identity** (user id + display name) is carried into Labs from **SSO claims** when the WP plugin has linked Discord — **not** by shipping Discord OAuth tokens to the browser. Labs stores that as a Discord link on their identity.
6. If they have an entitled plan **and** the channel is mapped **and** the bridge is on, they can **read/post** in Community.
7. If Discord isn’t linked on fattail.ai, they may see chat but **cannot post as themselves** into synced channels until they connect on fattail.ai.

**In short:** Logged into FatTail → SSO into Labs → entitled member → Community uses that session. Discord name comes from the fattail.ai connection, not a second Labs OAuth product.

---

## How chat sync works (Labs ↔ Discord)

| Direction | What happens |
|-----------|----------------|
| **Discord → Labs** | Messages from a **mapped** Discord channel are **mirrored** into Labs (`community_messages`). Opening a channel can **backfill** recent history from Discord. |
| **Labs → Discord** | When a member posts in Labs, a **Labs bridge bot** posts into the mapped Discord channel. Attribution is honest, e.g. **“Name (via Labs)”** — Labs does **not** send using the member’s Discord OAuth token. |

| Concern | System of record |
|---------|------------------|
| Conversation text in mapped channels | **Discord** |
| Who may use Labs / paid access | **Labs membership** |
| Connect Discord + Discord display name | **fattail.ai** (WordPress Discord connector plugin) |

---

## Channel matching (Discord ↔ Community)

You designate the pairing in **Labs admin** (`/admin/community`):

1. Labs has **Community channels** (seed set: General, Practice, Strategy Lab, Toughness; you can add more).
2. Each Labs channel can store a **Discord channel snowflake** (+ guild id) for the **FatTail AI** server.
3. **Only mapped channels** sync. Unmapped Labs channels are not a live Discord second window.
4. App embeds (e.g. Strategy Lab’s community panel) open the **same** Labs channel as Community — one conversation, not a fork.

```text
Discord #strategy-lab  ←→  Labs Community “Strategy Lab”
Discord #practice      ←→  Labs Community “Practice”
… (whatever you map in Admin)
```

Bridge also needs ops config (e.g. `LABS_DISCORD_BRIDGE=1`, bot token, guild id). Without bridge + map, Community is Labs-only UI without live Discord parity.

---

## Future: dual subdomain + segmented channels (DL-248 / DL-249)

**Intent only** — not a current build. Target when that program ships:

- **practice.fattail.ai** and **labs.fattail.ai** both use Community.
- Each channel has a **product scope**: `practice` | `labs` | `shared`.
- Members only read/post channels allowed for their product (Navigators → Practice channels; Labs bot product → Labs channels).
- Discord mapping remains 1:1 with Community channels; scope is an **extra gate**.

See `docs/Dual-Subdomain-Practice-vs-Labs.md` and `Architecture/25-dual-subdomain-practice-labs.md`.

---

## One-line summary

**Members arrive via FatTail SSO into Labs; Community is a second window on Discord for the channels you map; messages mirror both ways through a Labs bot and a channel map you control in admin. Future: same Community, channels segmented by Practice vs Labs product.**
