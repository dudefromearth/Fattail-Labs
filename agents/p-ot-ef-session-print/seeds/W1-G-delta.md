# W1-G — Delta labels gate

**Agent:** Delta  
**Depends on:** W1-1 · W1-2 · W1-3  
**Plan phase:** W1

## Evidence

| Check | Pass if |
|-------|---------|
| Label seed exists | `echo-labels.md` has all six states filled |
| Tango + Hotel | Notes on disk (in seed file or gate-report) |
| No chrome | `git grep` / diff: W1 did **not** ship badges or dialog strings in `web/` |
| Forbidden phrases | Seed lists what each state must not say |

Ternary. Never waive.

## Deliverable

`gate-reports/W1-G.md`

## Next if PASS

W3-2 may use the words. W5 chrome may use the words **after** W3-0 + W4. Still no code from this gate alone.
