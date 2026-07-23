"""Phase F — YouTube + Bunny Stream signed embed configuration."""

from __future__ import annotations

import hashlib
import time

import pytest

import video


def test_youtube_embed_unchanged():
    cfg = video.embed_config("youtube", "aqz-KE-bpKQ", {"start": "10"})
    assert cfg is not None
    assert cfg["provider"] == "youtube"
    assert "youtube-nocookie.com/embed/aqz-KE-bpKQ" in cfg["embed_url"]
    assert "start=10" in cfg["embed_url"]
    assert "enablejsapi=1" in cfg["embed_url"]


def test_unknown_provider_fails():
    with pytest.raises(video.VideoConfigError, match="Unknown video provider"):
        video.embed_config("mux", "abc", None)


def test_bunny_requires_config(monkeypatch):
    monkeypatch.delenv("LABS_BUNNY_LIBRARY_ID", raising=False)
    monkeypatch.delenv("LABS_BUNNY_TOKEN_KEY", raising=False)
    with pytest.raises(video.VideoConfigError, match="not configured"):
        video.embed_config(
            "bunny", "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", None
        )


def test_bunny_signed_embed_shape(monkeypatch):
    monkeypatch.setenv("LABS_BUNNY_LIBRARY_ID", "12345")
    monkeypatch.setenv("LABS_BUNNY_TOKEN_KEY", "test-security-key")
    monkeypatch.setenv("LABS_VIDEO_SIGNED_TTL_SECONDS", "3600")
    vid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    before = int(time.time())
    cfg = video.embed_config("bunny", vid, {"autoplay": "false"})
    after = int(time.time())
    assert cfg is not None
    assert cfg["provider"] == "bunny"
    assert cfg["video_id"] == vid
    assert "iframe.mediadelivery.net/embed/12345/" + vid in cfg["embed_url"]
    assert "token=" in cfg["embed_url"]
    assert "expires=" in cfg["embed_url"]
    exp = cfg["expires_at"]
    assert before + 3600 - 2 <= exp <= after + 3600 + 2
    # token matches Bunny formula
    expected = hashlib.sha256(
        f"test-security-key{vid}{exp}".encode()
    ).hexdigest()
    assert f"token={expected}" in cfg["embed_url"]


def test_normalize_bunny_guid():
    g = "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE"
    assert video.normalize_video_id("bunny", g) == g.lower()
    compact = "aaabbbcccdddeeefff00011122233344"
    # 32 hex
    compact = "a" * 32
    out = video.normalize_video_id("bunny", compact)
    assert out.count("-") == 4
    assert len(out) == 36


def test_normalize_bunny_rejects_youtube():
    with pytest.raises(video.VideoConfigError, match="not a YouTube"):
        video.normalize_video_id("bunny", "https://youtu.be/aqz-KE-bpKQ")


def test_admin_put_video_provider_bunny(client, admin_cookies, monkeypatch):
    monkeypatch.setenv("LABS_BUNNY_LIBRARY_ID", "99")
    monkeypatch.setenv("LABS_BUNNY_TOKEN_KEY", "k" * 16)
    # find a lesson id from seed course
    detail = client.get("/api/courses/first-stop-the-bleeding").json()
    lesson_id = None
    for m in detail["modules"]:
        for les in m["lessons"]:
            # admin get course for ids
            break
    admin = client.get(
        "/api/admin/courses/first-stop-the-bleeding", cookies=admin_cookies
    )
    assert admin.status_code == 200
    body = admin.json()
    # modules/lessons structure
    for m in body.get("modules") or []:
        for les in m.get("lessons") or []:
            if les.get("id"):
                lesson_id = les["id"]
                break
        if lesson_id:
            break
    assert lesson_id, "need a lesson id from admin course payload"

    guid = "11111111-2222-3333-4444-555555555555"
    r = client.put(
        f"/api/admin/lessons/{lesson_id}",
        cookies=admin_cookies,
        json={"video_provider": "bunny", "video_id": guid},
    )
    assert r.status_code == 200, r.text

    # Restore youtube so other tests keep working
    client.put(
        f"/api/admin/lessons/{lesson_id}",
        cookies=admin_cookies,
        json={
            "video_provider": "youtube",
            "video_id": "aqz-KE-bpKQ",
        },
    )
