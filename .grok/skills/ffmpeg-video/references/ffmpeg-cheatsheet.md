# FFmpeg cheatsheet (skill reference)

## Concat demuxer

```
file 'a.mp4'
file 'b.mp4'
```

```bash
ffmpeg -f concat -safe 0 -i list.txt -c copy out.mp4
```

Requires matching codecs / resolution / timebase for clean copy.

## Concat filter (re-encode)

When streams differ:

```bash
ffmpeg -i a.mp4 -i b.mp4 -filter_complex \
  "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 18 -c:a aac out.mp4
```

## Common failures

| Symptom | Fix |
|---|---|
| `DTS out of order` / stutter | Re-encode concat |
| No audio on some clips | Ensure all have audio; use `anullsrc` or re-encode with silence |
| Different resolutions | `scale` + `pad` first |
| Permission / path spaces | Quote paths; concat list uses `file 'path'` |

## Quality presets

| Goal | Flags |
|---|---|
| Fast draft | `-c:v libx264 -preset veryfast -crf 23 -c:a aac` |
| Delivery | `-c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k` |
| Copy | `-c copy` |
