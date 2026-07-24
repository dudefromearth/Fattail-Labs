#!/usr/bin/env python3
"""Probe media with ffprobe — JSON summary for humans and agents."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


def ffprobe_path() -> str:
    p = shutil.which("ffprobe")
    if not p:
        raise SystemExit("ffprobe not found on PATH")
    return p


def probe(path: Path) -> dict:
    cmd = [
        ffprobe_path(),
        "-v",
        "error",
        "-show_format",
        "-show_streams",
        "-print_format",
        "json",
        str(path),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(r.stderr or f"ffprobe failed: {path}")
    raw = json.loads(r.stdout)
    vstreams = [s for s in raw.get("streams", []) if s.get("codec_type") == "video"]
    astreams = [s for s in raw.get("streams", []) if s.get("codec_type") == "audio"]
    fmt = raw.get("format") or {}
    vs = vstreams[0] if vstreams else {}
    as_ = astreams[0] if astreams else {}
    # fps
    fps = None
    afr = vs.get("avg_frame_rate") or vs.get("r_frame_rate")
    if afr and afr != "0/0":
        num, _, den = afr.partition("/")
        try:
            fps = round(float(num) / float(den), 3) if float(den) else None
        except ValueError:
            fps = afr
    summary = {
        "path": str(path.resolve()),
        "exists": path.is_file(),
        "size_bytes": path.stat().st_size if path.is_file() else None,
        "duration_s": float(fmt["duration"]) if fmt.get("duration") else None,
        "format": fmt.get("format_name"),
        "video": {
            "codec": vs.get("codec_name"),
            "width": vs.get("width"),
            "height": vs.get("height"),
            "fps": fps,
            "pix_fmt": vs.get("pix_fmt"),
        }
        if vs
        else None,
        "audio": {
            "codec": as_.get("codec_name"),
            "sample_rate": as_.get("sample_rate"),
            "channels": as_.get("channels"),
        }
        if as_
        else None,
    }
    return summary


def main() -> None:
    ap = argparse.ArgumentParser(description="Probe video/audio with ffprobe")
    ap.add_argument("paths", nargs="+", type=Path)
    ap.add_argument("--raw", action="store_true", help="full ffprobe JSON")
    args = ap.parse_args()
    out = []
    for p in args.paths:
        if args.raw:
            cmd = [
                ffprobe_path(),
                "-v",
                "error",
                "-show_format",
                "-show_streams",
                "-print_format",
                "json",
                str(p),
            ]
            r = subprocess.run(cmd, capture_output=True, text=True)
            out.append(json.loads(r.stdout))
        else:
            out.append(probe(p))
    json.dump(out if len(out) > 1 else out[0], sys.stdout, indent=2)
    print()


if __name__ == "__main__":
    main()
