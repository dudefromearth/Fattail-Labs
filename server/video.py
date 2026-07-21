"""Video embed configuration — provider allowlists, server-built embed URLs.

The client never assembles player URLs from raw DB values; this module validates
per-lesson params against the provider allowlist and returns a finished embed URL.
Unknown providers or params fail loudly.
"""

import json
from urllib.parse import urlencode

# YouTube IFrame player parameters we allow per-lesson.
# https://developers.google.com/youtube/player_parameters
YOUTUBE_PARAMS = frozenset(
    {
        "autoplay",       # 0|1
        "cc_load_policy", # 1 forces captions
        "controls",       # 0|1
        "end",            # seconds
        "fs",             # 0 disables fullscreen button
        "hl",             # interface language
        "loop",           # 1 (requires playlist=<id>)
        "mute",           # 0|1
        "playsinline",    # 1 inline on iOS
        "rel",            # 0 limits related videos to same channel
        "start",          # seconds
    }
)

# Params we set on every embed regardless of lesson config.
# enablejsapi powers the progress-tracking bridge (Progress Tracking spec §4).
YOUTUBE_BASE = {"rel": "0", "playsinline": "1", "enablejsapi": "1"}

VALID_PROVIDERS = frozenset({"youtube"})


class VideoConfigError(ValueError):
    pass


def parse_params(raw) -> dict:
    """DB JSON (str/dict/None) -> validated flat dict of str->str."""
    if raw is None:
        return {}
    if isinstance(raw, (bytes, str)):
        raw = json.loads(raw)
    if not isinstance(raw, dict):
        raise VideoConfigError(f"video_params must be an object, got {type(raw).__name__}")
    return {str(k): str(v) for k, v in raw.items()}


def youtube_embed_url(video_id: str, params: dict) -> str:
    if not video_id:
        raise VideoConfigError("Missing video id")
    unknown = set(params) - YOUTUBE_PARAMS
    if unknown:
        raise VideoConfigError(f"Unknown YouTube params: {sorted(unknown)}")
    merged = {**YOUTUBE_BASE, **params}
    if merged.get("loop") == "1":
        # YouTube's loop only works with an explicit single-video playlist.
        merged["playlist"] = video_id
    return f"https://www.youtube-nocookie.com/embed/{video_id}?{urlencode(merged)}"


def embed_config(provider: str, video_id: str | None, raw_params) -> dict | None:
    """Build the public embed payload for a lesson, or None when no video is set."""
    if not video_id:
        return None
    if provider not in VALID_PROVIDERS:
        raise VideoConfigError(f"Unknown video provider: {provider!r}")
    params = parse_params(raw_params)
    return {
        "provider": provider,
        "embed_url": youtube_embed_url(video_id, params),
    }
