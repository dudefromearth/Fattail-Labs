#!/usr/bin/env python3
"""Trim a media file by start/end or duration."""

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
    ap.add_argument("--start", type=float, default=0.0, help="start seconds")
    ap.add_argument("--end", type=float, default=None, help="end seconds")
    ap.add_argument("--duration", type=float, default=None, help="duration seconds")
    ap.add_argument(
        "--reencode",
        action="store_true",
        help="frame-accurate re-encode (default stream copy)",
    )
    args = ap.parse_args()
    if not args.input.is_file():
        raise SystemExit(f"missing {args.input}")
    args.output.parent.mkdir(parents=True, exist_ok=True)

    cmd = [ffmpeg(), "-y", "-ss", str(args.start), "-i", str(args.input)]
    if args.duration is not None:
        cmd += ["-t", str(args.duration)]
    elif args.end is not None:
        cmd += ["-to", str(args.end)]
    if args.reencode:
        cmd += ["-c:v", "libx264", "-crf", "18", "-c:a", "aac"]
    else:
        cmd += ["-c", "copy"]
    cmd.append(str(args.output))
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(r.stderr[-2000:] if r.stderr else "trim failed")
    print(f"wrote {args.output}")


if __name__ == "__main__":
    main()
