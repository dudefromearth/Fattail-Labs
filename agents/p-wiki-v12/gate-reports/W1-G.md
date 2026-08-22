# W1-G — Wiki Spec v1.2 (plan v1.1)

**Date:** 2026-08-22  
**Delta:** **PASS** (API + capture + board + WK15 file; launcher/inbox mounted)  
**Law:** DL-544 · DL-543 · DL-540 · OD-WK2 stubs · OD-WK9 publish hook

## Criteria

| Check | Result |
|-------|--------|
| Declared surface list | `iki.wiki.entry`, `iki.wiki.article`, `iki.runner`, `iki.factory` |
| AT-WA3 capture | query/entity/screenshot stripped; `journal.*` refused |
| AT-WK11 same identity | second admin-point = same open row |
| AT-WA4 compile now | HTTP `compiling` then board card `product_line=wiki` |
| Help/both | 400 HELP_TARGET_DISABLED |
| AT-WA7 widen | refused |
| AT-WK13 wiki-only | human publish writes `wiki/concepts/compiled-*.md` stub |
| Launcher | `wiki-compile-launcher` on IKI suite chrome; not Help corner |
| Navigator | compile APIs 404 |

```
cd server && .venv/bin/python -m pytest tests/test_wiki_compile_w1.py tests/test_wiki_compile_watcher.py tests/test_content_board.py -q
24 passed
```

W2 (help) and W3–W4 (watcher kinds) remain blocked on parents.
