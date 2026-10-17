/**
 * Server-only offer load. Mirrors server/front_door/offers.py overrides and
 * server/front_door/traffic.py admission. Prices are never taken from env.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cookies } from "next/headers";
import { CHECKOUT_PRODUCT_IDS, type FrontDoorOffers, type FrontDoorProduct } from "./offers";
import { decideAdmission } from "./traffic";

const BOOLS: Record<string, boolean> = {
  "1": true,
  true: true,
  yes: true,
  on: true,
  "0": false,
  false: false,
  no: false,
  off: false,
};

function parseBool(name: string, raw: string): boolean {
  const value = raw.trim().toLowerCase();
  if (!(value in BOOLS)) {
    throw new Error(`${name} must be 0|1|true|false|yes|no|on|off, got ${JSON.stringify(raw)}`);
  }
  return BOOLS[value];
}

function parsePercent(name: string, raw: string): number {
  if (!/^-?\d+$/.test(raw.trim())) {
    throw new Error(`${name} must be an integer 0–100, got ${JSON.stringify(raw)}`);
  }
  const n = Number(raw.trim());
  if (n < 0 || n > 100) {
    throw new Error(`${name} must be an integer 0–100, got ${n}`);
  }
  return n;
}

export function offersFilePath(): string {
  const path = join(process.cwd(), "..", "server", "front_door", "offers.json");
  if (!existsSync(path)) {
    throw new Error(`Front door offers missing: ${path}`);
  }
  return path;
}

export function readOffersFile(path = offersFilePath()): FrontDoorOffers {
  const data = JSON.parse(readFileSync(path, "utf8")) as {
    terms_version: string;
    privacy_notice_version: string;
    terms_url: string;
    privacy_url: string;
    feature_flag: boolean;
    traffic_percent: number;
    kill_switch: boolean;
    vsl_url?: string;
    woo_account_payment_methods: string;
    products: Array<FrontDoorProduct & { enabled: boolean }>;
  };
  if (!data.terms_version || !data.privacy_notice_version) {
    throw new Error("front door offers are missing terms or privacy versions");
  }
  if (!data.terms_url || !data.privacy_url) {
    throw new Error("front door offers are missing terms or privacy urls");
  }
  if (!Array.isArray(data.products) || data.products.length === 0) {
    throw new Error("front door offers have no products");
  }
  const checkoutIds = new Set<string>(CHECKOUT_PRODUCT_IDS);
  const products = data.products
    .filter((product) => product.enabled || checkoutIds.has(product.id))
    .map((product) => ({
      id: product.id,
      name: product.name,
      kind: product.kind,
      role: product.role,
      price_cents: product.price_cents,
      regular_price_cents: product.regular_price_cents ?? null,
      offer_code: (product.offer_code || "").trim(),
      price_mode: product.price_mode,
      currency: product.currency,
      interval: product.interval,
      interval_count: product.interval_count,
      display_order: product.display_order,
      disclosure: product.disclosure,
    }))
    .sort((a, b) => a.display_order - b.display_order || a.id.localeCompare(b.id));
  return {
    terms_version: data.terms_version,
    privacy_notice_version: data.privacy_notice_version,
    terms_url: data.terms_url,
    privacy_url: data.privacy_url,
    feature_flag: data.feature_flag,
    traffic_percent: data.traffic_percent,
    kill_switch: data.kill_switch,
    vsl_url: data.vsl_url || "",
    card_update_url: data.woo_account_payment_methods,
    products,
  };
}

export function applyDoorEnv(
  offers: FrontDoorOffers,
  env: NodeJS.ProcessEnv = process.env,
): FrontDoorOffers {
  const next = { ...offers, products: offers.products };
  const percent = env.FRONT_DOOR_TRAFFIC_PERCENT;
  const kill = env.FRONT_DOOR_KILL_SWITCH;
  const enabled = env.FRONT_DOOR_ENABLED;
  if (percent && percent.trim()) {
    next.traffic_percent = parsePercent("FRONT_DOOR_TRAFFIC_PERCENT", percent);
  }
  if (kill && kill.trim()) next.kill_switch = parseBool("FRONT_DOOR_KILL_SWITCH", kill);
  if (enabled && enabled.trim()) next.feature_flag = parseBool("FRONT_DOOR_ENABLED", enabled);
  return next;
}

export async function loadFrontDoor() {
  const offers = applyDoorEnv(readOffersFile());
  const jar = await cookies();
  const visitor = jar.get("fd_visitor")?.value ?? null;
  const decision = decideAdmission(offers, visitor);
  return { offers, ...decision, visitor };
}
