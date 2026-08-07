# Seed C0-3 — Mike auth / Discord platform

**Agent:** Mike  
**Depends on:** C0-0 PASS · Spec §8 · §8.5 · **DL-240**  

## Task

Security design for build (Coach lock: **WP plugin is the member connector**):

1. **Inventory** fattail.ai WordPress Discord connector plugin: name/version, guild
   **FatTail AI**, how Discord id + **display name** are stored on WP, connect URL for CTA.  
2. **Ingest path** into Labs: SSO JWT claims and/or webhook/sync — field names, fail loud
   if entitled member claims linked but snowflake missing. **No Labs-primary OAuth app.**  
3. **Message Content Intent** + **GUILD_MEMBERS** for Labs **bridge** bot (mirror/send/reconcile) —
   distinct from member-connect plugin.  
4. Per-mapped-channel **webhook id + token** storage (Labs→Discord).  
5. **Role executor** design: WP plugin vs Labs bot vs hybrid — no dual-writer fights;
   DL-238 reconcile still mandatory.  
6. Secrets fail loud; link collision: one Discord snowflake → one Labs identity.  

## Output

`gate-reports/C0-3-mike.md` — APPROVED / RETURNED + claim map + executor decision.
