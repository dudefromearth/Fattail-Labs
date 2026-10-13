import assert from "node:assert/strict";
import { cleanTapePath, tapeProxyKind } from "./catalog";
import { rewriteTapeDocument, rewriteTapeUrls } from "./rewrite";

const sample = `<nav><a href="/">Health</a><a href="/board">Live board</a><a href="/symbol?sym=SPY">Symbol view</a><a href="/gaps">Gaps</a></nav>
<script src="/gaps.js"></script>
<link rel="stylesheet" href="/backtest_picker.css">
<script>
async function j(p) { const r = await fetch(p); return r.json(); }
fetch('/api/health');
j('/api/days?sym=' + encodeURIComponent(gapSym));
const url = '/api/chain/' + encodeURIComponent(gapSym) + '/path?day=1';
j(\`/api/chain/\${S.sym}/frames?\${q}\`);
a.href = \`/view?src=rest&day=\${S.day}\`;
return '/backtest?' + p.toString();
const parts = 'a/b'.split('/');
</script>`;

const out = rewriteTapeDocument(sample);
assert.equal(out.includes("<nav><a href=\"/tapelabs\">Tape Labs</a></nav>"), true);
assert.equal(out.includes("/board"), false);
assert.equal(out.includes('src="/tapelabs/t/gaps.js"'), true);
assert.equal(out.includes('href="/tapelabs/t/backtest_picker.css"'), true);
assert.equal(out.includes("fetch('/tapelabs/t/api/health')"), true);
assert.equal(out.includes("'/tapelabs/t/api/days?sym='"), true);
assert.equal(out.includes("'/tapelabs/t/api/chain/'"), true);
assert.equal(out.includes("`/tapelabs/t/api/chain/${" + "S.sym}/frames?"), true);
assert.equal(out.includes("`/tapelabs/t/view?src=rest"), true);
assert.equal(out.includes("'/tapelabs/t/backtest?'"), true);
assert.equal(out.includes(".split('/')"), true);
assert.equal(out.includes("/tapelabs/t/tapelabs"), false);

const twice = rewriteTapeUrls(out);
assert.equal(twice.includes("/tapelabs/t/tapelabs"), false);

assert.equal(tapeProxyKind(""), "page");
assert.equal(tapeProxyKind("gaps"), "page");
assert.equal(tapeProxyKind("symbol"), "page");
assert.equal(tapeProxyKind("backtest"), "page");
assert.equal(tapeProxyKind("view"), "page");
assert.equal(tapeProxyKind("studies"), "no");
assert.equal(tapeProxyKind("board"), "no");
assert.equal(tapeProxyKind("tester"), "no");
assert.equal(tapeProxyKind("api/chain/SPX/path"), "asset");
assert.equal(tapeProxyKind("v1/health"), "asset");
assert.equal(tapeProxyKind("gaps.js"), "asset");
assert.equal(tapeProxyKind("backtest_picker.css"), "asset");
assert.equal(tapeProxyKind("../secrets"), "no");
assert.equal(cleanTapePath(["..", "secrets"]), null);
assert.equal(cleanTapePath(undefined), "");
assert.equal(cleanTapePath([""]), "");

console.log("tapelab rewrite: ok");
