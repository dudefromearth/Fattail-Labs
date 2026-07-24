# Studio cast registry

HeyGen avatars used as **actors** for FatTail Labs courses and other P2 media.

## Convention

One file per cast member:

```text
AVATAR-<NAME>.md
```

Use the HeyGen skill format (`heygen-avatar`): Appearance, Voice, and HeyGen
section with stable **Group ID** + **Voice ID**. Resolve look IDs at render time
from the group; do not treat look IDs as permanent primary keys.

See `docs/P2-Cast-and-HeyGen-Production.md` for the full cast model and production
pipeline.

## Status

| Cast member | File | Role | Notes |
|---|---|---|---|
| Dude (primary) | `AVATAR-DUDE-PRIMARY.md` | primary | registered on disk |
| Dude (alt) | `AVATAR-DUDE-ALT.md` | alternate look | registered on disk |
| | | | Additional cast members planned |

## Adding a cast member

1. Create or confirm the avatar in HeyGen (`heygen-avatar` skill).
2. Write `AVATAR-<NAME>.md` in this directory (and symlink/copy to workspace root
   if the HeyGen skill session expects root).
3. Update the table above with role (primary coach, specialist, short-form host, …).
4. Coach approves before the avatar is used on member-facing course masters.

## Batch production experiments

Empirical concurrent limits (3 → 4 → 2):  
[`docs/studio/HeyGen-Batch-Experiment.md`](../HeyGen-Batch-Experiment.md)
