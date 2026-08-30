/**
 *   npx --yes tsx lib/ikiSuite.test.ts
 */
import assert from "node:assert/strict";
import { ikiSuiteNavItems } from "./ikiSuite";
import { ikiAccessFromMe, ikiOnlyPathAllowed } from "./ikiAccess";

{
  const other = ikiSuiteNavItems(false, false).map((x) => x.id);
  assert.deepEqual(other, ["about", "catalog"]);
}

{
  const member = ikiSuiteNavItems(false, true).map((x) => x.id);
  assert.deepEqual(member, ["about", "catalog", "your-lab", "analyzer"]);
}

{
  const admin = ikiSuiteNavItems(true, true).map((x) => x.id);
  assert.deepEqual(admin, [
    "factory",
    "runner",
    "about",
    "catalog",
    "your-lab",
    "analyzer",
  ]);
}

{
  const a = ikiAccessFromMe({ role: "navigator", iki_lab: false });
  assert.equal(a.hasIkiLab, false);
  assert.equal(a.ikiLabOnly, false);
}

{
  const a = ikiAccessFromMe({
    role: "observer",
    iki_lab: true,
    iki_lab_only: true,
  });
  assert.equal(a.hasIkiLab, true);
  assert.equal(a.ikiLabOnly, true);
}

{
  const a = ikiAccessFromMe({ role: "administrator", iki_lab: true });
  assert.equal(a.hasIkiLab, true);
  assert.equal(a.ikiLabOnly, false);
}

assert.equal(ikiOnlyPathAllowed("/app/iki/your-lab"), true);
assert.equal(ikiOnlyPathAllowed("/app/trade-log"), false);

console.log("ikiSuite.test.ts ok");
