/** Cole's seven apply keys. Live AC ids 3–9 stay. Echo owns labels. */

export const APPLY_HUE = "#00B478";

export const APPLY_KEYS = [
  "HELL",
  "HEAVEN",
  "MONEY_TIMING",
  "COACHING_SKU",
  "ELEVEN_AM_ET",
  "TRIED",
  "PARTNER_SUPPORT",
] as const;

export type ApplyKey = (typeof APPLY_KEYS)[number];

/** Coach titles from the spec. Echo may replace wording; do not rename keys. */
export const APPLY_FIELDS: {
  key: ApplyKey;
  label: string;
  fieldId: "3" | "4" | "5" | "6" | "7" | "8" | "9";
}[] = [
  { key: "HELL", label: "Hell Island", fieldId: "3" },
  { key: "HEAVEN", label: "Heaven Island", fieldId: "4" },
  { key: "MONEY_TIMING", label: "Money/timing", fieldId: "5" },
  { key: "COACHING_SKU", label: "Coaching SKU", fieldId: "6" },
  { key: "ELEVEN_AM_ET", label: "Can make 11am ET", fieldId: "7" },
  { key: "TRIED", label: "What they tried", fieldId: "8" },
  { key: "PARTNER_SUPPORT", label: "Partner/support", fieldId: "9" },
];
