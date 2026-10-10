"""Attribution marker alphabet (AF-L2). Length 10, same alphabet as
slugs for consistency, longer because it is never hand-typed and sits
closer to a dollar figure than a slug does."""

from __future__ import annotations

import secrets

from links.slug import ALPHABET

LENGTH = 10


def new_marker() -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(LENGTH))
