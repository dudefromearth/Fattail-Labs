#!/usr/bin/env python3
"""Concatenate video clips with FFmpeg concat demuxer."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path


def ffmpeg() -> str:
    p = shutil.which("ffmpeg")
    if not p:
        raise SystemExit("ffmpeg not found on PATH")
    return p


def concat(inputs: list[Path], output: Path, *, reencode: bool) -> None:
    for p in inputs:
        if not p.is_file():
            raise SystemExit(f"missing input: {p}")
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w", suffix=".txt", delete=False, encoding="utf-8"
    ) as tf:
        for p in inputs:
            # concat demuxer needs escaped single quotes in path
            ap = p.resolve().as_posix().replace("'", r"'\''")
            tf.write(f"file '{ap}'\n")
        list_path = tf.name

    cmd = [
        ffmpeg(),
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        list_path,
    ]
    if reencode:
        cmd += [
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "18",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-movflags",
            "+faststart",
        ]
    else:
        cmd += ["-c", "copy"]
    cmd.append(str(output))
    print(" ".join(cmd[:8]), "...", output)
    r = subprocess.run(cmd, capture_output=True, text=True)
    Path(list_path).unlink(missing_ok=True)
    if r.returncode != 0:
        raise SystemExit(r.stderr[-2000:] if r.stderr else "ffmpeg concat failed")
    print(f"wrote {output} ({output.stat().st_size} bytes)")


def main() -> None:
    ap = argparse.ArgumentParser(description="Stitch clips with ffmpeg concat")
    ap.add_argument("-o", "--output", type=Path, required=True)
    ap.add_argument("inputs", nargs="+", type=Path)
    g = ap.add_mutually_exclusive_group()
    g.add_argument(
        "--copy",
        action="store_true",
        default=True,
        help="stream copy (default)",
    )
    g.add_argument(
        "--reencode",
        action="store_true",
        help="re-encode h264/aac (mismatched inputs)",
    )
    args = ap.parse_args()
    reencode = bool(args.reencode)
    concat(args.inputs, args.output, reencode=reencode)


if __name__ == "__main__":
    main()
