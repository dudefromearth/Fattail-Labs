/**
 * StudioTwo checkout catalog. Prices come from offers.json.
 * Traffic percent stays at 0 for production. This door is open on StudioTwo.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CHECKOUT_PRODUCT_IDS, type FrontDoorOffers, type FrontDoorProduct } from "./offers";

export function loadStudioOffers(): FrontDoorOffers {
  const path = join(process.cwd(), "lib/frontDoor/offers.json");
  const data = JSON.parse(readFileSync(path, "utf8")) as {
    terms_version: string;
    privacy_notice_version: string;
    terms_url: string;
    privacy_url: string;
    feature_flag: boolean;
    traffic_percent: number;
    kill_switch: boolean;
    vsl_url?: string;
    products: Array<FrontDoorProduct & { enabled: boolean }>;
  };
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
    card_update_url: "",
    products,
  };
}
