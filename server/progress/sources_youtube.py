"""YouTube source — uploads, livestreams and monthly channel views.

Uses an OAuth refresh token held in config (the channel owner authorises once).
Data API for the video inventory, Analytics API for month-by-month views.

Note for whoever reads a stale panel: YouTube Analytics lags roughly two days,
so the current month is always incomplete. It is labelled partial, never scaled.
"""

from __future__ import annotations

import datetime as dt
import logging
import os

import httpx

log = logging.getLogger("labs.progress.youtube")

TOKEN_URL = "https://oauth2.googleapis.com/token"
DATA_API = "https://www.googleapis.com/youtube/v3"
ANALYTICS_API = "https://youtubeanalytics.googleapis.com/v2/reports"
SHORT_MAX_SECONDS = 180


class YouTubeError(RuntimeError):
    """YouTube is unreachable, unauthorised, or misconfigured."""


def _cfg() -> dict:
    cfg = {
        "client_id": os.environ.get("LABS_YT_CLIENT_ID", "").strip(),
        "client_secret": os.environ.get("LABS_YT_CLIENT_SECRET", "").strip(),
        "refresh_token": os.environ.get("LABS_YT_REFRESH_TOKEN", "").strip(),
    }
    missing = [k for k, v in cfg.items() if not v]
    if missing:
        raise YouTubeError(
            "YouTube source needs " + ", ".join(f"LABS_YT_{k.upper()}" for k in missing)
        )
    return cfg


def _access_token(client: httpx.Client, cfg: dict) -> str:
    resp = client.post(TOKEN_URL, data={
        "client_id": cfg["client_id"],
        "client_secret": cfg["client_secret"],
        "refresh_token": cfg["refresh_token"],
        "grant_type": "refresh_token",
    })
    if resp.status_code >= 400:
        raise YouTubeError(
            "refresh token rejected — re-authorise the channel owner "
            f"(HTTP {resp.status_code})"
        )
    token = resp.json().get("access_token")
    if not token:
        raise YouTubeError("token endpoint returned no access_token")
    return token


def _iso_seconds(duration: str | None) -> int:
    """PT#H#M#S -> seconds. Used only to separate Shorts from long-form."""
    import re
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", duration or "")
    if not m:
        return 0
    h, mi, s = (int(x) if x else 0 for x in m.groups())
    return h * 3600 + mi * 60 + s



def _month_start(now: dt.datetime, months: int) -> dt.date:
    """First day of the month `months - 1` back — a whole-month boundary."""
    y, m = now.year, now.month
    for _ in range(max(months - 1, 0)):
        y, m = (y - 1, 12) if m == 1 else (y, m - 1)
    return dt.date(y, m, 1)


def _month_end(now: dt.datetime) -> dt.date:
    """First day of the CURRENT month.

    Counter-intuitive but verified against the live API on 2026-08-21: with the
    `month` dimension YouTube accepts a first-of-month end date and includes
    that whole month in the result. A last-of-month end date is rejected as
    "does not align to chosen date dimension".
    """
    return dt.date(now.year, now.month, 1)


def fetch(months: int = 8, now: dt.datetime | None = None) -> dict:
    cfg = _cfg()
    now = now or dt.datetime.utcnow()
    # The `month` dimension rejects any range that does not sit on month
    # boundaries — BOTH ends must align, so the window is whole months only.
    start = _month_start(now, months)
    end = _month_end(now)

    with httpx.Client(timeout=60) as client:
        token = _access_token(client, cfg)
        auth = {"Authorization": f"Bearer {token}"}

        ch = client.get(f"{DATA_API}/channels",
                        params={"part": "snippet,contentDetails,statistics", "mine": "true"},
                        headers=auth)
        if ch.status_code >= 400:
            raise YouTubeError(f"channels returned HTTP {ch.status_code}")
        items = ch.json().get("items") or []
        if not items:
            raise YouTubeError("token is not attached to a YouTube channel")
        channel = items[0]
        uploads = channel["contentDetails"]["relatedPlaylists"]["uploads"]

        video_ids: list[str] = []
        page = None
        for _ in range(20):
            params = {"part": "contentDetails", "playlistId": uploads, "maxResults": 50}
            if page:
                params["pageToken"] = page
            r = client.get(f"{DATA_API}/playlistItems", params=params, headers=auth)
            if r.status_code >= 400:
                raise YouTubeError(f"playlistItems returned HTTP {r.status_code}")
            body = r.json()
            for it in body.get("items", []):
                cd = it.get("contentDetails", {})
                if (cd.get("videoPublishedAt", "")[:10] or "9999") >= start.isoformat():
                    video_ids.append(cd["videoId"])
            page = body.get("nextPageToken")
            if not page:
                break

        videos: list[dict] = []
        for i in range(0, len(video_ids), 50):
            r = client.get(f"{DATA_API}/videos", headers=auth, params={
                "part": "snippet,statistics,contentDetails,liveStreamingDetails",
                "id": ",".join(video_ids[i:i + 50])})
            if r.status_code >= 400:
                raise YouTubeError(f"videos returned HTTP {r.status_code}")
            for v in r.json().get("items", []):
                secs = _iso_seconds(v.get("contentDetails", {}).get("duration"))
                live = bool(v.get("liveStreamingDetails"))
                videos.append({
                    "id": v["id"],
                    "title": v["snippet"]["title"],
                    "published_at": v["snippet"]["publishedAt"][:19].replace("T", " "),
                    "views": int(v.get("statistics", {}).get("views", 0)
                                 or v.get("statistics", {}).get("viewCount", 0) or 0),
                    "seconds": secs,
                    "kind": "livestream" if live else ("short" if secs <= SHORT_MAX_SECONDS
                                                       else "long"),
                })

        r = client.get(ANALYTICS_API, headers=auth, params={
            "ids": "channel==MINE", "startDate": start.isoformat(),
            "endDate": end.isoformat(), "metrics": "views,estimatedMinutesWatched",
            "dimensions": "month", "sort": "month"})
        if r.status_code >= 400:
            raise YouTubeError(f"analytics returned HTTP {r.status_code}")
        body = r.json()
        this_month = now.strftime("%Y-%m")
        monthly = [{"month": row[0], "views": int(row[1]),
                    "minutes_watched": int(row[2]), "partial": row[0] == this_month}
                   for row in body.get("rows", [])]

    log.info("youtube fetch: %d videos, %d months", len(videos), len(monthly))
    return {
        "channel": {"title": channel.get("snippet", {}).get("title"),
                    "subscribers": int(channel.get("statistics", {})
                                       .get("subscriberCount", 0) or 0)},
        "videos": videos,
        "monthly": monthly,
        "counts": {"videos": len(videos)},
    }
