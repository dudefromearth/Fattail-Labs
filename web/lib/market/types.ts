/** Market Bus shared client types (MB Spec). */

export type MarketHello = {
  t: "hello";
  v: number;
  heartbeat_s?: number;
  server_time?: string;
};

export type MarketErr = {
  t: "err";
  code: string;
  message: string;
};

export type ChainSub = {
  symbol: string;
  expiration: string;
  side: "call" | "put";
  wings?: number;
};

export type ChainMessage = {
  t: "chain";
  mode: "full" | "diff" | "unchanged";
  key: string;
  content_hash?: string;
  ladder?: Record<string, unknown>;
};

export type MarketInbound =
  | MarketHello
  | MarketErr
  | ChainMessage
  | { t: string; [k: string]: unknown };
