/** Trade Log v1.1 client types — Spec FatTail-Labs-Trade-Log-Spec-v1.1 */

export type Venue = {
  code: string;
  label: string;
  kind: "live" | "sim";
};

export type StrategyMeta = {
  code: string;
  label: string;
  group: string;
};

export type Account = {
  id: number;
  label: string;
  broker: string;
  broker_label?: string | null;
  currency: string;
  status: string;
  venue_kind: string;
  sort_order: number;
};

export type Leg = {
  id?: number;
  leg_index?: number;
  side: "BUY" | "SELL";
  quantity: number;
  pos_effect?: "TO_OPEN" | "TO_CLOSE" | null;
  asset_class?: string;
  underlier?: string | null;
  symbol?: string | null;
  expiry?: string | null;
  strike?: number | null;
  right?: "PUT" | "CALL" | null;
  fill_price: number;
  fees?: number | null;
};

export type Trade = {
  id: number;
  account_id: number;
  exec_at: string | null;
  asset_class: string;
  strategy: string;
  order_type: string;
  net_price: number | null;
  net_side: string | null;
  setup_md: string;
  plan_md: string;
  rules_md: string;
  adherence: string;
  deviation_md: string;
  lesson_md: string;
  pnl_amount: number | null;
  legs: Leg[];
};

export type Catalog = {
  venues: Venue[];
  strategies: StrategyMeta[];
};

/** Seed legs for common strategies (member fills strikes/prices). */
export function templateLegs(strategy: string, underlier = "SPX"): Leg[] {
  const exp = new Date().toISOString().slice(0, 10);
  const base = {
    asset_class: "equity_option" as const,
    underlier,
    expiry: exp,
    pos_effect: "TO_OPEN" as const,
    fill_price: 0,
  };
  switch (strategy) {
    case "BUTTERFLY":
      return [
        { ...base, side: "BUY", quantity: 1, strike: 100, right: "PUT" },
        { ...base, side: "SELL", quantity: 2, strike: 95, right: "PUT" },
        { ...base, side: "BUY", quantity: 1, strike: 90, right: "PUT" },
      ];
    case "VERTICAL":
      return [
        { ...base, side: "BUY", quantity: 1, strike: 100, right: "PUT" },
        { ...base, side: "SELL", quantity: 1, strike: 95, right: "PUT" },
      ];
    case "SINGLE":
      return [{ ...base, side: "BUY", quantity: 1, strike: 100, right: "CALL" }];
    case "STOCK":
      return [
        {
          side: "BUY",
          quantity: 100,
          pos_effect: "TO_OPEN",
          asset_class: "equity",
          symbol: "SPY",
          fill_price: 0,
        },
      ];
    case "FUTURE":
      return [
        {
          side: "BUY",
          quantity: 1,
          pos_effect: "TO_OPEN",
          asset_class: "future",
          symbol: "/ES",
          fill_price: 0,
        },
      ];
    case "CRYPTO":
      return [
        {
          side: "BUY",
          quantity: 1,
          pos_effect: null,
          asset_class: "crypto",
          symbol: "BTC-USD",
          fill_price: 0,
        },
      ];
    case "NOTE":
      return [];
    default:
      return [{ ...base, side: "BUY", quantity: 1, strike: 100, right: "CALL" }];
  }
}

export function formatQtyEffect(leg: Leg): string {
  const sign = leg.side === "BUY" ? "+" : "−";
  const pe = leg.pos_effect ? ` ${leg.pos_effect.replace("_", " ")}` : "";
  return `${sign}${leg.quantity}${pe}`;
}
