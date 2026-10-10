"""Slug alphabet (LK-L2). Length 6. No 0, 1, i, l, or o."""

from __future__ import annotations

import secrets

ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"
LENGTH = 6

if len(ALPHABET) != 31 or len(set(ALPHABET)) != 31 or any(c in ALPHABET for c in "01ilo"):
    raise RuntimeError("LK-L2 alphabet is 31 symbols and excludes 0, 1, i, l, o")


def new_slug() -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(LENGTH))
