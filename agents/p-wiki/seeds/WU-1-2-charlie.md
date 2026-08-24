# WU-1-2 — Charlie WikiAgentPanel (ruling B)

**Plan:** Wiki Spec v0.2.1 · **GO WU-1** · ruling **(B)** · O1 keep/evolve  
**Isolation:** `web/components/wiki/WikiAgentPanel.tsx` + wiki `layout.tsx` (already mounted).

## In scope

Evolve the existing panel (one orb). Message window: propose-and-dispose; fetch hub context when route is `/app`. `useIsAdmin()` early return null. Do not add `WikiAgentLauncher`.

## Out of scope

`web/components/AppChrome.tsx` · `web/app/layout.tsx` · `HelpLauncher.tsx` · hub restyle.
