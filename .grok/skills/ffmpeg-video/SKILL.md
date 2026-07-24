---
name: ffmpeg-video
description: >
  Stitch, trim, probe, re-encode, overlay B-roll, extract audio, and assemble
  multi-clip videos with FFmpeg/ffprobe. Use for Labs-Intro hub assembly, concat
  opens/body/closes, hard cuts, overlay screen-capture on body clips, or any
  "merge videos", "stitch clips", "ffmpeg concat", "assemble hub intro" request.
  Slash: /ffmpeg-video.
---

# ffmpeg-video

You are a video assembly operator using **FFmpeg** and **ffprobe** only (no
proprietary NLE). Prefer stream-copy when safe; re-encode when codecs or
timelines differ.

**Binaries:** `ffmpeg`, `ffprobe` on PATH (Homebrew: `/opt/homebrew/bin/ffmpeg`).

**Scripts** (repo skill dir):

| Script | Feature |
|---|---|
| `scripts/probe.py` | Media info (codec, res, fps, duration, audio) |
| `scripts/concat.py` | Concat demuxer stitch (`-c copy` or re-encode) |
| `scripts/trim.py` | Cut by start/end or duration |
| `scripts/overlay.py` | Picture-in-picture / full-frame B-roll overlay |
| `scripts/extract_audio.py` | Extract AAC/WAV from a video |
| `scripts/scale.py` | Scale / pad to target resolution |
| `scripts/assemble_labs_intro.py` | FatTail hub: 5 role assemblies from `Labs-Intro/` |

Run scripts from the **repo root** (Fattail-Labs) unless noted.

---

## 1. Probe (always first)

```bash
python3 .grok/skills/ffmpeg-video/scripts/probe.py path/to/clip.mp4
# or
ffprobe -v error -show_format -show_streams -print_format json path/to/clip.mp4
```

**Use probe results to decide:** copy-concat vs re-encode (mismatched codec, size, fps, or sample rate → re-encode).

---

## 2. Concat / stitch (hard cuts)

**Same codec/params (fast, no quality loss):**

```bash
python3 .grok/skills/ffmpeg-video/scripts/concat.py \
  -o out.mp4 --copy \
  clip1.mp4 clip2.mp4 clip3.mp4
```

**Mismatched or glitchy seams:**

```bash
python3 .grok/skills/ffmpeg-video/scripts/concat.py \
  -o out.mp4 --reencode \
  clip1.mp4 clip2.mp4 clip3.mp4
```

Manual equivalent:

```bash
# list.txt: file 'a.mp4' / file 'b.mp4'
ffmpeg -y -f concat -safe 0 -i list.txt -c copy out.mp4
ffmpeg -y -f concat -safe 0 -i list.txt -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k out.mp4
```

**Hard cut only** — no crossfade unless user asks (`xfade` is advanced; not default for hub).

---

## 3. Trim

```bash
python3 .grok/skills/ffmpeg-video/scripts/trim.py \
  -i in.mp4 -o out.mp4 --start 0 --end 12.5
# or --duration 10
```

Prefer `-c copy` when cutting on keyframes; re-encode for frame-accurate cuts.

---

## 4. Overlay (B-roll / screen capture)

Full-frame replace during a window (body under screen capture):

```bash
python3 .grok/skills/ffmpeg-video/scripts/overlay.py \
  --base body.mp4 --overlay screen.mp4 -o out.mp4 \
  --mode fullframe
```

Picture-in-picture bottom-right:

```bash
python3 .grok/skills/ffmpeg-video/scripts/overlay.py \
  --base base.mp4 --overlay pip.mp4 -o out.mp4 \
  --mode pip --pip-scale 0.35
```

---

## 5. Scale / pad

```bash
python3 .grok/skills/ffmpeg-video/scripts/scale.py \
  -i in.mp4 -o out.mp4 --width 1920 --height 1080 --pad
```

---

## 6. Extract audio

```bash
python3 .grok/skills/ffmpeg-video/scripts/extract_audio.py \
  -i in.mp4 -o out.m4a
# --wav for PCM
```

---

## 7. Labs-Intro hub assembly (FatTail)

Source layout:

```text
Labs-Intro/{anonymous,campaign,observer,activator,navigator}/
  01-open-*.mp4
  02-close-*.mp4
Labs-Intro/shared/
  01-body-b1_courses_resources.mp4
  02-body-b2_live_guide.mp4
  03-body-b3_lab.mp4
```

Assemble all five role masters (open + shared body ×3 + close):

```bash
python3 .grok/skills/ffmpeg-video/scripts/assemble_labs_intro.py
# options:
#   --role anonymous
#   --reencode
#   --out-dir Labs-Intro/assembled
```

Output: `Labs-Intro/assembled/{role}.mp4`

**Screen-capture B-roll over body** is a separate edit step (`overlay.py` per body segment) — default assembly is avatar-only hard cuts as delivered from HeyGen.

---

## 8. Operating rules

1. **Probe before concat** when anything might differ.  
2. **Prefer `-c copy`** for same-engine HeyGen clips.  
3. On concat failure or A/V desync → **re-encode once**.  
4. Never invent dollar figures in overlays; for Labs reports B-roll, adherence only.  
5. Write outputs next to sources under `Labs-Intro/assembled/` unless asked otherwise.  
6. Report paths + durations after assembly (probe outputs).  
7. Do not commit large `*.mp4` unless user asks (see `.gitignore`).

---

## 9. Feature checklist (use all when building/verifying)

When the user asks to “use the skill” or assemble hub intros, exercise:

- [ ] **probe** each input class (open, shared, close)  
- [ ] **concat** (copy first) for each role  
- [ ] **re-encode** fallback if copy fails  
- [ ] **trim** only if user wants lead-in/out cleanup  
- [ ] **extract_audio** sample one assembled file (QA)  
- [ ] **scale** only if target res differs  
- [ ] **overlay** only when B-roll files are provided  
- [ ] **assemble_labs_intro** for the five hub variants  

---

## 10. References

- `references/ffmpeg-cheatsheet.md` — flags and failure modes  
- FFmpeg concat wiki: https://trac.ffmpeg.org/wiki/Concatenate  
