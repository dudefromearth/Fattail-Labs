"""Video embed configuration — YouTube + Bunny Stream signed embeds (Phase F).

Client never assembles player URLs from raw DB values. Unknown providers/params fail loud.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import time
from urllib.parse import urlencode

# YouTube IFrame player parameters we allow per-lesson.
# https://developers.google.com/youtube/player_parameters
YOUTUBE_PARAMS = frozenset(
    {
        "autoplay",
        "cc_load_policy",
        "controls",
        "end",
        "fs",
        "hl",
        "loop",
        "mute",
        "playsinline",
        "rel",
        "start",
    }
)

YOUTUBE_BASE = {"rel": "0", "playsinline": "1", "enablejsapi": "1"}

# Cosmetic query params for Bunny Stream embed (not part of token hash).
BUNNY_PARAMS = frozenset({"autoplay", "preload", "responsive", "muted"})

VALID_PROVIDERS = frozenset({"youtube", "bunny"})

_GUID_RE = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)
_YT_ID_RE = re.compile(r"^[\w-]{11}$")


class VideoConfigError(ValueError):
    pass


def parse_params(raw) -> dict:
    """DB JSON (str/dict/None) -> validated flat dict of str->str."""
    if raw is None:
        return {}
    if isinstance(raw, (bytes, str)):
        raw = json.loads(raw)
    if not isinstance(raw, dict):
        raise VideoConfigError(
            f"video_params must be an object, got {type(raw).__name__}"
        )
    return {str(k): str(v) for k, v in raw.items()}


def signed_ttl_seconds() -> int:
    raw = os.environ.get("LABS_VIDEO_SIGNED_TTL_SECONDS", "3600").strip() or "3600"
    try:
        n = int(raw)
    except ValueError as exc:
        raise VideoConfigError(
            f"LABS_VIDEO_SIGNED_TTL_SECONDS must be an integer, got {raw!r}"
        ) from exc
    if n < 60 or n > 86400:
        raise VideoConfigError(
            "LABS_VIDEO_SIGNED_TTL_SECONDS must be between 60 and 86400"
        )
    return n


def bunny_config() -> dict:
    """Fail loud when bunny is requested without config."""
    library_id = os.environ.get("LABS_BUNNY_LIBRARY_ID", "").strip()
    token_key = os.environ.get("LABS_BUNNY_TOKEN_KEY", "").strip()
    embed_host = (
        os.environ.get("LABS_BUNNY_EMBED_HOST", "").strip()
        or "https://iframe.mediadelivery.net"
    ).rstrip("/")
    if not library_id or not token_key:
        raise VideoConfigError(
            "Bunny Stream is not configured: set LABS_BUNNY_LIBRARY_ID and "
            "LABS_BUNNY_TOKEN_KEY (required for video_provider=bunny)"
        )
    return {
        "library_id": library_id,
        "token_key": token_key,
        "embed_host": embed_host,
    }


def normalize_video_id(provider: str, raw: str | None) -> str | None:
    """Normalize authoring input for the given provider."""
    if raw is None:
        return None
    raw = str(raw).strip()
    if not raw:
        return None
    provider = (provider or "youtube").strip().lower()
    if provider == "youtube":
        return _normalize_youtube_id(raw)
    if provider == "bunny":
        return _normalize_bunny_id(raw)
    raise VideoConfigError(f"Unknown video provider: {provider!r}")


def _normalize_youtube_id(raw: str) -> str:
    m = re.search(
        r"(?:youtube(?:-nocookie)?\.com/(?:watch\?.*?v=|embed/|shorts/)|youtu\.be/)([\w-]{11})",
        raw,
    )
    if m:
        return m.group(1)
    if _YT_ID_RE.fullmatch(raw):
        return raw
    raise VideoConfigError(f"Not a YouTube URL or video id: {raw!r}")


def _normalize_bunny_id(raw: str) -> str:
    # Reject accidental YouTube URLs
    if "youtu" in raw.lower():
        raise VideoConfigError(
            "Bunny video_id must be a Stream video GUID, not a YouTube URL"
        )
    raw = raw.strip()
    if _GUID_RE.fullmatch(raw):
        return raw.lower()
    # Some dashboards show id without hyphens (32 hex)
    if re.fullmatch(r"[0-9a-fA-F]{32}", raw):
        h = raw.lower()
        return f"{h[0:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}"
    raise VideoConfigError(
        f"Not a Bunny Stream video GUID: {raw!r} "
        "(expect UUID form 8-4-4-4-12 hex)"
    )


def youtube_embed_url(video_id: str, params: dict) -> str:
    if not video_id:
        raise VideoConfigError("Missing video id")
    unknown = set(params) - YOUTUBE_PARAMS
    if unknown:
        raise VideoConfigError(f"Unknown YouTube params: {sorted(unknown)}")
    merged = {**YOUTUBE_BASE, **params}
    if merged.get("loop") == "1":
        merged["playlist"] = video_id
    return f"https://www.youtube-nocookie.com/embed/{video_id}?{urlencode(merged)}"


def bunny_token(video_id: str, expires: int, token_key: str) -> str:
    """Bunny Stream embed token = sha256_hex(securityKey + videoId + expiration)."""
    raw = f"{token_key}{video_id}{expires}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def bunny_embed_url(video_id: str, params: dict) -> tuple[str, int]:
    if not video_id:
        raise VideoConfigError("Missing video id")
    unknown = set(params) - BUNNY_PARAMS
    if unknown:
        raise VideoConfigError(f"Unknown Bunny params: {sorted(unknown)}")
    cfg = bunny_config()
    expires = int(time.time()) + signed_ttl_seconds()
    token = bunny_token(video_id, expires, cfg["token_key"])
    q = {"token": token, "expires": str(expires), **params}
    url = (
        f"{cfg['embed_host']}/embed/{cfg['library_id']}/{video_id}"
        f"?{urlencode(q)}"
    )
    return url, expires


def embed_config(provider: str, video_id: str | None, raw_params) -> dict | None:
    """Build the public embed payload for a lesson, or None when no video is set."""
    if not video_id:
        return None
    provider = (provider or "youtube").strip().lower()
    if provider not in VALID_PROVIDERS:
        raise VideoConfigError(f"Unknown video provider: {provider!r}")
    params = parse_params(raw_params)

    if provider == "youtube":
        return {
            "provider": "youtube",
            "embed_url": youtube_embed_url(video_id, params),
            "video_id": video_id,
        }

    # bunny
    embed_url, expires_at = bunny_embed_url(video_id, params)
    return {
        "provider": "bunny",
        "embed_url": embed_url,
        "expires_at": expires_at,
        "video_id": video_id,
    }
