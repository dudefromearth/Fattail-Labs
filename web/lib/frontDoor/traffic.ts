/** Admission math. Node-only (sha256). Keep in lockstep with server/front_door/traffic.py. */

import { createHash } from "node:crypto";
import type { FrontDoorOffers } from "./offers";

export function bucketFor(visitorKey: string): number {
  const key = visitorKey.trim();
  if (!key) throw new Error("visitor_key is required");
  const digest = createHash("sha256").update(key).digest("hex");
  return Number.parseInt(digest.slice(0, 8), 16) % 100;
}

export function decideAdmission(offers: Pick<FrontDoorOffers, "feature_flag" | "kill_switch" | "traffic_percent">, visitorKey: string | null) {
  const key = (visitorKey || "").trim();
  const flag = offers.feature_flag;
  const kill = offers.kill_switch;
  const percent = offers.traffic_percent;
  let admitted = false;
  if (kill || !flag || percent <= 0) admitted = false;
  else if (percent >= 100) admitted = true;
  else if (!key) admitted = false;
  else admitted = bucketFor(key) < percent;
  const needsVisitor = flag && !kill && percent > 0 && percent < 100 && !key;
  return { admitted, needsVisitor, traffic_percent: percent };
}
