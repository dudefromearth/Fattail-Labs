#!/usr/bin/env python3
"""Scale (and optionally pad) video to a target resolution."""

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
    ap.add_argument("--width", type=int, default=1920)
    ap.add_argument("--height", type=int, default=1080)
    ap.add_argument(
        "--pad",
        action="store_true",
        help="letterbox/pillarbox to exact WxH instead of stretch",
    )
    args = ap.parse_args()
    if not args.input.is_file():
        raise SystemExit(f"missing {args.input}")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    w, h = args.width, args.height
    if args.pad:
        vf = (
            f"scale={w}:{h}:force_original_aspect_ratio=decrease,"
            f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2"
        )
    else:
        vf = f"scale={w}:{h}"
    cmd = [
        ffmpeg(),
        "-y",
        "-i",
        str(args.input),
        "-vf",
        vf,
        "-c:v",
        "libx264",
        "-crf",
        "18",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        str(args.output),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(r.stderr[-2000:] if r.stderr else "scale failed")
    print(f"wrote {args.output}")


if __name__ == "__main__":
    main()
