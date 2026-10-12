/**Shared front-door types and pure helpers. Safe to import from client code. */

export type PriceMode = "listed" | "confirmed_at_checkout";

export type FrontDoorProduct = {
  id: string;
  name: string;
  kind: "subscription" | "one_time";
  role: "core" | "optional";
  price_cents: number | null;
  price_mode: PriceMode;
  currency: string;
  interval: "week" | "month" | "year" | null;
  interval_count: number | null;
  display_order: number;
  disclosure: string;
};

export type FrontDoorOffers = {
  terms_version: string;
  privacy_notice_version: string;
  feature_flag: boolean;
  traffic_percent: number;
  kill_switch: boolean;
  vsl_url: string;
  card_update_url: string;
  products: FrontDoorProduct[];
};

export type SpeedBucket = "fast" | "medium" | "slow";

export function formatPrice(product: FrontDoorProduct): string {
  if (product.price_mode === "confirmed_at_checkout" || product.price_cents == null) {
    return "One-time · amount confirmed at checkout";
  }
  const amount = (product.price_cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  if (product.interval === "week" && product.interval_count === 6) {
    return `${amount}/week × 6`;
  }
  if (product.interval === "year") return `${amount}/year`;
  if (product.interval === "month" && product.interval_count === 3) {
    return `${amount} / quarter`;
  }
  if (product.interval === "month") return `${amount}/month`;
  return amount;
}

export function bucketFromSignals(input: {
  effectiveType?: string;
  rtt?: number;
  probeMs: number | null;
}): SpeedBucket {
  const kind = input.effectiveType;
  if (kind === "slow-2g" || kind === "2g") return "slow";
  if (kind === "3g") return "medium";
  if (input.probeMs == null) return "slow";
  if (input.probeMs >= 700) return "slow";
  if (input.probeMs >= 250) return "medium";
  if (kind === "4g" && (input.rtt ?? 0) > 400) return "medium";
  return "fast";
}

const SEARCH = ["google.", "bing.com", "duckduckgo.com", "search.yahoo.", "baidu.com"];
const SOCIAL = [
  "youtube.com",
  "youtu.be",
  "twitter.com",
  "x.com",
  "t.co",
  "facebook.com",
  "fb.com",
  "instagram.com",
  "tiktok.com",
  "linkedin.com",
  "reddit.com",
];
const EMAIL = [
  "mail.google.",
  "outlook.live.com",
  "outlook.office.com",
  "mail.yahoo.",
  "mail.proton.me",
  "proton.me",
];

export function entryForReferrer(referrer: string | null | undefined): "start" | "watch" | "order" {
  if (referrer == null) return "order";
  const text = referrer.trim();
  if (!text) return "order";
  let host = "";
  let medium = "";
  try {
    const url = new URL(text);
    host = url.hostname.toLowerCase();
    medium = (url.searchParams.get("utm_medium") || "").trim().toLowerCase();
  } catch {
    return "order";
  }
  if (medium === "email" || medium === "newsletter") return "order";
  if (medium === "social" || medium === "video") return "watch";
  if (["cpc", "ppc", "paid", "display", "search"].includes(medium)) return "start";
  if (host.startsWith("mail.") || EMAIL.some((token) => host.includes(token))) return "order";
  if (SOCIAL.some((token) => host.includes(token))) return "watch";
  if (SEARCH.some((token) => host.includes(token))) return "start";
  return "order";
}
