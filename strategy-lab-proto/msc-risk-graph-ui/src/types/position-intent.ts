/* PositionIntent — single canonical object for the working surface.
   Mirrors Python src/canonical/models/position_intent.py.
   Immutable domain object. Status and visibility live on RegistryEntry. */

export interface IntentLeg {
  strike: number;
  option_type: 'call' | 'put';
  expiration: string;             // YYYY-MM-DD
  quantity: number;               // signed: +1, -2
  entry_price: number;            // dollars per contract
  contract_id: string | null;     // real chain contract ref (null until resolved)
  implied_volatility?: number;    // per-leg IV from chain at time of creation (0–5 range)
}

export interface PositionIntent {
  intent_id: string;              // UUID, assigned at creation, never changes
  created_at: string;             // ISO 8601

  symbol: string;                 // "SPX", "NDX"
  legs: readonly IntentLeg[];
  quantity: number;               // number of spreads (multiplier)

  topology: string;               // "butterfly", "vertical", etc. — informational, derived at creation
  direction: 'long' | 'short';

  target_price: number | null;    // desired debit/credit (absolute, always >= 0)
  price_side: 'debit' | 'credit';

  dte: number;
  notation: string;               // "+1 5800C / -2 5830C / +1 5860C"

  frozen_spot: number;            // spot price at creation time
}

export type TradeStatus = 'ANALYSIS' | 'PENDING' | 'OPEN' | 'PARTIAL_OPEN' | 'CLOSED' | 'CANCELLED' | 'REJECTED';

export interface RegistryEntry {
  intent: PositionIntent;
  status: TradeStatus;
  visible: boolean;
  broker_type?: string;           // set when filled — "msc", "tradier", "ibkr", "schwab", etc.
  account_id?: string;            // proxy account UUID — bound at create (account-owned registry)
  /** Admin-set trade timestamps (ISO 8601). Used by Price-Time chart position overlay. */
  entry_time?: string;            // when the trade was opened/entered
  exit_time?: string;             // when the trade was closed (null = still open)
}
