/**
 * IKI-P2 — same host module as Options Lab flag-1 shell.
 *   npx --yes tsx lib/runner/__tests__/iki-p2-host.test.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const page = readFileSync(
  join(import.meta.dirname, "../../../app/app/iki/runner/page.tsx"),
  "utf8",
);
if (!page.includes("HeatmapRenderHost")) {
  throw new Error("IKI runner page must mount HeatmapRenderHost unchanged");
}
if (!page.includes("@/lib/runner/sinks/render")) {
  throw new Error("IKI runner must import TR-P3 host from runner/sinks/render");
}
console.log("ok  IKI-P2 mounts HeatmapRenderHost");
