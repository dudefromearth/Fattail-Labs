/**Shared front-door types and pure helpers. Safe to import from client code. */

export type PriceMode = "listed" | "confirmed_at_checkout";

export type FrontDoorProduct = {
  id: string;
  name: string;
  kind: "subscription" | "one_time";
  role: "core" | "optional";
  price_cents: number | null;
  /** Crossed-out price. Empty until a real regular price is set. */
  regular_price_cents?: number | null;
  /** Shown with the sale price when a code is set. Empty means no code. */
  offer_code?: string;
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
  terms_url: string;
  privacy_url: string;
  feature_flag: boolean;
  traffic_percent: number;
  kill_switch: boolean;
  vsl_url: string;
  card_update_url: string;
  products: FrontDoorProduct[];
};

export type SpeedBucket = "fast" | "medium" | "slow";

/** Order of the checkout starting choice. Ids match offers.json. */
export const CHECKOUT_PRODUCT_IDS = [
  "observer",
  "navigator-monthly",
  "quarterly",
  "navigator-annual",
  "navigator-lifetime",
] as const;

export const CHECKOUT_LABELS: Record<(typeof CHECKOUT_PRODUCT_IDS)[number], string> = {
  observer: "Observer",
  "navigator-monthly": "Navigator Monthly",
  quarterly: "Navigator Quarterly",
  "navigator-annual": "Navigator Annual",
  "navigator-lifetime": "Navigator Lifetime",
};

export function checkoutProducts(products: FrontDoorProduct[]): FrontDoorProduct[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  return CHECKOUT_PRODUCT_IDS.map((id) => byId.get(id)).filter((product): product is FrontDoorProduct => Boolean(product));
}

/** Links, QR codes, and emails may use the short name. The id is what checkout stores. */
const PRODUCT_ALIASES: Record<string, (typeof CHECKOUT_PRODUCT_IDS)[number]> = {
  trial: "observer",
  observer: "observer",
  monthly: "navigator-monthly",
  "navigator-monthly": "navigator-monthly",
  quarterly: "quarterly",
  annual: "navigator-annual",
  "navigator-annual": "navigator-annual",
  lifetime: "navigator-lifetime",
  "navigator-lifetime": "navigator-lifetime",
};

export function canonicalCheckoutProduct(raw: string | undefined): string {
  const key = (raw || "").trim().toLowerCase();
  return PRODUCT_ALIASES[key] || "";
}

/** Where the product choice came from. A missing value is the website chooser. */
export const CHECKOUT_ORIGINS = ["website", "email", "qr"] as const;
export type CheckoutOrigin = (typeof CHECKOUT_ORIGINS)[number];

const ORIGIN_ALIASES: Record<string, CheckoutOrigin> = {
  website: "website",
  site: "website",
  web: "website",
  email: "email",
  mail: "email",
  qr: "qr",
  qrcode: "qr",
  "qr-code": "qr",
};

export function canonicalCheckoutOrigin(raw: string | undefined): CheckoutOrigin {
  const key = (raw || "").trim().toLowerCase();
  return ORIGIN_ALIASES[key] || "website";
}

const PRODUCT_PUBLIC_ALIAS: Record<string, string> = {
  observer: "trial",
  "navigator-monthly": "monthly",
  quarterly: "quarterly",
  "navigator-annual": "annual",
  "navigator-lifetime": "lifetime",
};

/** Short name used in email links and QR codes. */
export function checkoutProductAlias(id: string): string {
  const canonical = canonicalCheckoutProduct(id) || "observer";
  return PRODUCT_PUBLIC_ALIAS[canonical] || canonical;
}

/** The request a website, email, or QR code opens. Price stays in the catalog. */
export function orderRequestPath(origin: string, productId: string): string {
  const params = new URLSearchParams({
    origin: canonicalCheckoutOrigin(origin),
    product: checkoutProductAlias(productId),
  });
  return `/access/order?${params.toString()}`;
}

export function originLabel(origin: CheckoutOrigin): string {
  if (origin === "email") return "Email link";
  if (origin === "qr") return "QR code";
  return "Website";
}

const SHORT_NAMES: Record<(typeof CHECKOUT_PRODUCT_IDS)[number], string> = {
  observer: "Observer",
  "navigator-monthly": "Monthly",
  quarterly: "Quarterly",
  "navigator-annual": "Annual",
  "navigator-lifetime": "Lifetime",
};

/** Quiet arrival line. The public link still uses the short alias. */
export function checkoutShortName(id: string): string {
  const canonical = canonicalCheckoutProduct(id);
  if (canonical === "observer") return SHORT_NAMES.observer;
  if (canonical === "navigator-monthly") return SHORT_NAMES["navigator-monthly"];
  if (canonical === "quarterly") return SHORT_NAMES.quarterly;
  if (canonical === "navigator-annual") return SHORT_NAMES["navigator-annual"];
  if (canonical === "navigator-lifetime") return SHORT_NAMES["navigator-lifetime"];
  return SHORT_NAMES.observer;
}

export function checkoutLabel(product: FrontDoorProduct): string {
  return CHECKOUT_LABELS[product.id as (typeof CHECKOUT_PRODUCT_IDS)[number]] || product.name;
}

/** One factual line for the product panel. No price in this sentence. */
export function describeProduct(product: FrontDoorProduct): string {
  switch (product.id) {
    case "observer":
      return "Six weeks of practice. It does not become Navigator on its own.";
    case "navigator-monthly":
      return "Navigator membership, billed each month. A separate purchase from Observer.";
    case "quarterly":
      return "Navigator membership, billed each quarter. A separate purchase from Observer.";
    case "navigator-annual":
      return "Navigator membership for one year. A separate purchase from Observer.";
    case "navigator-lifetime":
      return "Navigator membership, paid once. A separate purchase from Observer.";
    default:
      return "";
  }
}

/** Crossed-out regular price. Hidden when it is missing or the same as the sale price. */
export function regularPrice(product: FrontDoorProduct): string | null {
  const cents = product.regular_price_cents;
  if (cents == null) return null;
  if (product.price_cents != null && cents === product.price_cents) return null;
  return formatPrice({ ...product, price_cents: cents, price_mode: "listed" });
}

/** Sale price, or that price with an offer code. This is the amount on the card. */
export function salePriceLine(product: FrontDoorProduct): string {
  const price = panelPrice(product);
  const code = (product.offer_code || "").trim();
  if (!code) return price;
  return `${price} with code ${code}`;
}

/** Member-facing price. An unlisted subscription is not called one-time. */
export function panelPrice(product: FrontDoorProduct): string {
  if (product.price_cents == null || product.price_mode === "confirmed_at_checkout") {
    if (product.kind === "one_time") return formatPrice(product);
    return "The amount is confirmed on the secure checkout before you pay.";
  }
  return formatPrice(product);
}

/** Operator notes in offers.json stay off the member panel. */
export function memberDisclosure(product: FrontDoorProduct): string {
  const text = product.disclosure.trim();
  if (text.startsWith("Optional.")) return "";
  return text;
}

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
