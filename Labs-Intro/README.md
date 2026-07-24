# Labs-Intro — Hub intro clips (course-hub-intro-v0.5)

Downloaded from HeyGen 2026-07-24. **13 clips** → assemble **5 role videos**  
using the shared body once each.

**Skill:** `.grok/skills/ffmpeg-video/` (`/ffmpeg-video`)

```text
Labs-Intro/
├── anonymous/     open + close
├── campaign/      open + close
├── observer/      open + close
├── activator/     open + close
├── navigator/     open + close
├── shared/        body (courses/resources, live/guide, lab)
└── assembled/     ★ finished role masters (open+body+close)
    ├── anonymous.mp4
    ├── campaign.mp4
    ├── observer.mp4
    ├── activator.mp4
    └── navigator.mp4
```

Re-assemble:

```bash
python3 .grok/skills/ffmpeg-video/scripts/assemble_labs_intro.py
```

## Assembly (per finished hub video)

| Finished video | Open | Body (shared) | Close |
|---|---|---|---|
| **Anonymous** | `anonymous/01-open-…` | `shared/01` + `02` + `03` | `anonymous/02-close-…` |
| **Campaign** | `campaign/01-open-…` | same shared body | `campaign/02-close-…` |
| **Observer** | `observer/01-open-…` | same | `observer/02-close-…` |
| **Activator** | `activator/01-open-…` | same | `activator/02-close-…` |
| **Navigator** | `navigator/01-open-…` | same | `navigator/02-close-…` |

**Cut:** hard cut from open hand-off line into screen-capture over body; hard cut to close.  
**Lab clip:** `shared/03-body-b3_lab.mp4` — re-record alone when Lab tools change.

## Clip inventory

| Path | Role | ~duration |
|---|---|---|
| anonymous/01-open-a1_anonymous.mp4 | open | ~27s |
| anonymous/02-close-c1_anonymous.mp4 | close | ~11s |
| campaign/01-open-a2_campaign.mp4 | open | ~21s |
| campaign/02-close-c2_campaign.mp4 | close | ~20s |
| observer/01-open-a3_observer.mp4 | open | ~29s |
| observer/02-close-c3_observer.mp4 | close | ~14s |
| activator/01-open-a4_activator.mp4 | open | ~22s |
| activator/02-close-c4_activator.mp4 | close | ~10s |
| navigator/01-open-a5_navigator.mp4 | open | ~26s |
| navigator/02-close-c5_navigator.mp4 | close | ~15s |
| shared/01-body-b1_courses_resources.mp4 | body | ~18s |
| shared/02-body-b2_live_guide.mp4 | body | ~11s |
| shared/03-body-b3_lab.mp4 | body | ~21s |

Source jobs / sessions: `docs/studio/experiments/hub-intro/MANIFEST.md`

## Notes

- Large binary files — prefer local editor; do not commit unless intentional.  
- Before publish: FatTail/FAQ pronunciation, adherence-only report B-roll, Hotel/Tango/Coach gates.  
