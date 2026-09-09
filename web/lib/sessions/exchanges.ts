/**
 * Exchange session table. Spec §5. Row order is law. TSE close 15:30.
 * Local times; ET is computed, never stored.
 */

export type SessionSeg = { startMin: number; endMin: number };

export type ExchangeRow = {
  id: string;
  group: "Americas" | "Futures" | "Europe" | "Asia-Pacific";
  name: string;
  subLabel: string | null;
  tz: string;
  segments: SessionSeg[];
  /** US cash rows that hatch `closed` on a full NYSE holiday. */
  usCash: boolean;
  /** SPX regular / ES take 13:15 on early close. */
  earlyCloseEndMinEt: number | null;
};

function hm(h: number, m: number): number {
  return h * 60 + m;
}

export const EXCHANGES: readonly ExchangeRow[] = [
  {
    id: "us-pre",
    group: "Americas",
    name: "US pre-market",
    subLabel: null,
    tz: "America/New_York",
    segments: [{ startMin: hm(4, 0), endMin: hm(9, 30) }],
    usCash: true,
    earlyCloseEndMinEt: null,
  },
  {
    id: "nyse",
    group: "Americas",
    name: "New York",
    subLabel: "NYSE · Nasdaq",
    tz: "America/New_York",
    segments: [{ startMin: hm(9, 30), endMin: hm(16, 0) }],
    usCash: true,
    earlyCloseEndMinEt: hm(13, 0),
  },
  {
    id: "tsx",
    group: "Americas",
    name: "Toronto",
    subLabel: "TSX",
    tz: "America/New_York",
    segments: [{ startMin: hm(9, 30), endMin: hm(16, 0) }],
    usCash: false,
    earlyCloseEndMinEt: null,
  },
  {
    id: "us-ah",
    group: "Americas",
    name: "US after-hours",
    subLabel: null,
    tz: "America/New_York",
    segments: [{ startMin: hm(16, 0), endMin: hm(20, 0) }],
    usCash: true,
    earlyCloseEndMinEt: null,
  },
  {
    id: "es",
    group: "Futures",
    name: "ES futures",
    subLabel: "CME Globex",
    tz: "America/New_York",
    segments: [{ startMin: hm(18, 0), endMin: hm(17, 0) }],
    usCash: false,
    earlyCloseEndMinEt: hm(13, 15),
  },
  {
    id: "spx-gth",
    group: "Futures",
    name: "SPX options",
    subLabel: "Cboe GTH",
    tz: "America/New_York",
    segments: [{ startMin: hm(20, 15), endMin: hm(9, 15) }],
    usCash: true,
    earlyCloseEndMinEt: null,
  },
  {
    id: "spx-reg",
    group: "Futures",
    name: "SPX options",
    subLabel: "regular",
    tz: "America/New_York",
    segments: [{ startMin: hm(9, 30), endMin: hm(16, 15) }],
    usCash: true,
    earlyCloseEndMinEt: hm(13, 15),
  },
  {
    id: "lse",
    group: "Europe",
    name: "London",
    subLabel: "LSE",
    tz: "Europe/London",
    segments: [{ startMin: hm(8, 0), endMin: hm(16, 30) }],
    usCash: false,
    earlyCloseEndMinEt: null,
  },
  {
    id: "xetra",
    group: "Europe",
    name: "Frankfurt",
    subLabel: "Xetra",
    tz: "Europe/Berlin",
    segments: [{ startMin: hm(9, 0), endMin: hm(17, 30) }],
    usCash: false,
    earlyCloseEndMinEt: null,
  },
  {
    id: "euronext",
    group: "Europe",
    name: "Paris · Amsterdam",
    subLabel: "Euronext",
    tz: "Europe/Paris",
    segments: [{ startMin: hm(9, 0), endMin: hm(17, 30) }],
    usCash: false,
    earlyCloseEndMinEt: null,
  },
  {
    id: "nse",
    group: "Asia-Pacific",
    name: "Mumbai",
    subLabel: "NSE",
    tz: "Asia/Kolkata",
    segments: [{ startMin: hm(9, 15), endMin: hm(15, 30) }],
    usCash: false,
    earlyCloseEndMinEt: null,
  },
  {
    id: "hkex",
    group: "Asia-Pacific",
    name: "Hong Kong",
    subLabel: "HKEX",
    tz: "Asia/Hong_Kong",
    segments: [
      { startMin: hm(9, 30), endMin: hm(12, 0) },
      { startMin: hm(13, 0), endMin: hm(16, 0) },
    ],
    usCash: false,
    earlyCloseEndMinEt: null,
  },
  {
    id: "sse",
    group: "Asia-Pacific",
    name: "Shanghai",
    subLabel: "SSE",
    tz: "Asia/Shanghai",
    segments: [
      { startMin: hm(9, 30), endMin: hm(11, 30) },
      { startMin: hm(13, 0), endMin: hm(15, 0) },
    ],
    usCash: false,
    earlyCloseEndMinEt: null,
  },
  {
    id: "sgx",
    group: "Asia-Pacific",
    name: "Singapore",
    subLabel: "SGX",
    tz: "Asia/Singapore",
    segments: [{ startMin: hm(9, 0), endMin: hm(17, 0) }],
    usCash: false,
    earlyCloseEndMinEt: null,
  },
  {
    id: "krx",
    group: "Asia-Pacific",
    name: "Seoul",
    subLabel: "KRX",
    tz: "Asia/Seoul",
    segments: [{ startMin: hm(9, 0), endMin: hm(15, 30) }],
    usCash: false,
    earlyCloseEndMinEt: null,
  },
  {
    id: "tse",
    group: "Asia-Pacific",
    name: "Tokyo",
    subLabel: "TSE",
    tz: "Asia/Tokyo",
    segments: [
      { startMin: hm(9, 0), endMin: hm(11, 30) },
      { startMin: hm(12, 30), endMin: hm(15, 30) },
    ],
    usCash: false,
    earlyCloseEndMinEt: null,
  },
  {
    id: "asx",
    group: "Asia-Pacific",
    name: "Sydney",
    subLabel: "ASX",
    tz: "Australia/Sydney",
    segments: [{ startMin: hm(10, 0), endMin: hm(16, 0) }],
    usCash: false,
    earlyCloseEndMinEt: null,
  },
];
