# WA-4-1 — Charlie wiki-layout affordance

**Plan:** Wiki Agent v0.1.3 · **GO WA-4** · Rider 1  
**Isolation:** wiki-owned files only.

## In scope

`web/components/wiki/WikiAgentPanel.tsx` + mount from
`web/app/app/wiki/layout.tsx`. `useIsAdmin()`. In-place-admin pattern
(DesignHouseAdminChrome grammar). Default context from pathname; admin may
set `{surface, route, entity}` because “anywhere” is a content directive.

## Out of scope

`web/components/AppChrome.tsx` — **STOP** if this file would be touched.
Public read. Course/help/IKI trees. Member rail.

## Completion

Layout imports WikiAgentPanel. Panel returns null unless administrator.
No AppChrome import.
