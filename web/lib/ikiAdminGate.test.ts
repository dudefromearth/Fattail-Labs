/**
 * IKI Runner admin gate — role law + /api/auth/me client + source gate.
 *   npx --yes tsx lib/ikiAdminGate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  IKI_PUBLIC_DOOR,
  fetchLabsSessionRole,
  isIkiAdministratorRole,
} from "./ikiAdminGate";

process.env.NEXT_PUBLIC_LABS_API_URL ||= "http://127.0.0.1:4000";

async function withFetch(
  impl: typeof fetch,
  fn: () => Promise<void>,
): Promise<void> {
  const orig = globalThis.fetch;
  globalThis.fetch = impl;
  try {
    await fn();
  } finally {
    globalThis.fetch = orig;
  }
}

async function main() {
  assert.equal(IKI_PUBLIC_DOOR, "/app/iki/about");
  assert.equal(isIkiAdministratorRole("administrator"), true);
  for (const role of [
    null,
    undefined,
    "",
    "observer",
    "activator",
    "navigator",
    "alumni",
  ]) {
    assert.equal(
      isIkiAdministratorRole(role as string | null | undefined),
      false,
      `deny ${String(role)}`,
    );
  }

  assert.equal(
    await fetchLabsSessionRole(""),
    null,
    "empty cookie skips /api/auth/me",
  );

  await withFetch(async () => {
    return new Response(JSON.stringify({ role: "administrator" }), {
      status: 200,
    });
  }, async () => {
    assert.equal(await fetchLabsSessionRole("ft_session=x"), "administrator");
  });

  await withFetch(async () => {
    return new Response(JSON.stringify({ role: "activator" }), { status: 200 });
  }, async () => {
    assert.equal(await fetchLabsSessionRole("ft_session=x"), "activator");
    assert.equal(isIkiAdministratorRole("activator"), false);
  });

  await withFetch(async () => new Response("no", { status: 401 }), async () => {
    assert.equal(await fetchLabsSessionRole("ft_session=x"), null);
  });

  await withFetch(async () => {
    throw new Error("upstream down");
  }, async () => {
    assert.equal(await fetchLabsSessionRole("ft_session=x"), null);
  });

  const here = import.meta.dirname;
  const proxy = readFileSync(join(here, "../proxy.ts"), "utf8");
  assert.match(proxy, /\/app\/iki\/runner/);
  assert.match(proxy, /IKI_PUBLIC_DOOR|\/app\/iki\/about/);
  assert.match(proxy, /export async function proxy/);
  assert.doesNotMatch(proxy, /useEffect\s*\(/);

  const layout = readFileSync(
    join(here, "../app/app/iki/runner/layout.tsx"),
    "utf8",
  );
  assert.doesNotMatch(layout, /^["']use client["']/m);
  assert.match(layout, /force-dynamic/);
  assert.match(layout, /redirect/);
  assert.match(layout, /IKI_PUBLIC_DOOR|\/app\/iki\/about/);
  assert.doesNotMatch(layout, /iki-runner-host/);

  const page = readFileSync(join(here, "../app/app/iki/runner/page.tsx"), "utf8");
  assert.match(page, /iki-runner-host/);
  assert.match(page, /HeatmapRenderHost/);
  assert.doesNotMatch(page, /useEffect\(\(\) => \{[\s\S]*redirect/);
  assert.doesNotMatch(page, /iki-factory-forbidden/);

  console.log("ok  ikiAdminGate + runner source gate");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
