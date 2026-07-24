#!/usr/bin/env python3
"""Extract audio track from a video."""

from __future__ import annotations

import argparse
import shutil
import subprocess
from pathlib import Path


def ffmpeg() -> str:
    p = shutil.which("ffmpeg")
    if not p:
        raise SystemExit("ffmpeg not found")
    return p


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--input", type=Path, required=True)
    ap.add_argument("-o", "--output", type=Path, required=True)
    ap.add_argument("--wav", action="store_true", help="PCM wav instead of aac/m4a")
    args = ap.parse_args()
    if not args.input.is_file():
        raise SystemExit(f"missing {args.input}")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    cmd = [ffmpeg(), "-y", "-i", str(args.input), "-vn"]
    if args.wav:
        cmd += ["-c:a", "pcm_s16le"]
    else:
        cmd += ["-c:a", "aac", "-b:a", "192k"]
    cmd.append(str(args.output))
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(r.stderr[-2000:] if r.stderr else "extract failed")
    print(f"wrote {args.output}")


if __name__ == "__main__":
    main()
