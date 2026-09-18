/**
 *   npx --yes tsx lib/saDelivery.test.ts
 */
import assert from "node:assert/strict";
import {
  _resetCacheForTests,
  fetchGen,
  generationOf,
  peek,
  put,
} from "./saDelivery";

async function main() {
  _resetCacheForTests();
  const url = "/api/dev/sa/v1/ohlc/ES?tf=5m";
  put(url, { profile_generation_id: "g1", bars: [{ t: 1, c: 7700 }] }, '"g1"');
  const hit = peek(url);
  assert.equal(hit?.generation, "g1");
  assert.equal(generationOf(hit!.body), "g1");

  const origFetch = globalThis.fetch;
  let sawInm = false;
  globalThis.fetch = (async (_u: string | URL | Request, init?: RequestInit) => {
    const raw = init?.headers as Record<string, string> | undefined;
    sawInm = raw?.["If-None-Match"] === '"g1"';
    return new Response(null, { status: 304, headers: { ETag: '"g1"' } });
  }) as typeof fetch;
  const r = await fetchGen(url);
  assert.equal(r.fromCache, true);
  assert.equal(r.stale, false);
  assert.equal((r.body as { bars: { c: number }[] }).bars[0].c, 7700);
  await new Promise((res) => setTimeout(res, 20));
  assert.equal(sawInm, true);

  _resetCacheForTests();
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ profile_generation_id: "g2", bars: [{ t: 2, c: 7710 }] }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ETag: '"g2"' },
      },
    )) as typeof fetch;
  const r2 = await fetchGen("/api/dev/sa/v1/structure/XSP?kind=session");
  assert.equal(r2.fromCache, false);
  assert.equal(peek("/api/dev/sa/v1/structure/XSP?kind=session")?.generation, "g2");

  globalThis.fetch = (async () => {
    throw new Error("offline");
  }) as typeof fetch;
  put(url, { profile_generation_id: "g2", bars: [{ t: 2, c: 7710 }] }, '"g2"');
  const r3 = await fetchGen(url);
  assert.equal(r3.fromCache, true);
  assert.equal((r3.body as { bars: { c: number }[] }).bars[0].c, 7710);

  globalThis.fetch = origFetch;
  _resetCacheForTests();
  console.log("saDelivery.test.ts ok");
}
void main();
