-- 105 — Accounts are FatTail books, not connected brokers.
-- CSV/import source is stored per trade (external_adapter). Historical rows that
-- were branded thinkorswim/etc. solely by first-import mapping are reclaimed as
-- fattail so multi-source import into one book is honest.
-- Sim/paper book types are left alone.

UPDATE member_trade_log_accounts
SET broker = 'fattail',
    broker_label = NULL
WHERE broker IN (
  'thinkorswim',
  'schwab',
  'tastytrade',
  'ibkr',
  'tradestation',
  'tradier',
  'robinhood',
  'etrade',
  'fidelity',
  'td',
  'coinbase',
  'binance',
  'kraken',
  'other_crypto',
  'prop_firm',
  'other',
  'unset'
)
;
