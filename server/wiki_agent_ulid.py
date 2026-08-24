"""ULID (Crockford) for wiki-agent contract_id. No extra dependency."""

from __future__ import annotations

import os
import time

_ALPH = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"


def new_ulid() -> str:
    ms = int(time.time() * 1000)
    if ms < 0 or ms >= 2**48:
        raise RuntimeError("ULID timestamp out of range")
    rand = int.from_bytes(os.urandom(10), "big")
    val = (ms << 80) | rand
    chars = ["0"] * 26
    for i in range(25, -1, -1):
        chars[i] = _ALPH[val & 31]
        val >>= 5
    return "".join(chars)
