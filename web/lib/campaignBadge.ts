/** Campaign badge identity color + near-max contrast ink (DL-359). */

const HEX6 = /^#[0-9A-Fa-f]{6}$/;
const HEX3 = /^#[0-9A-Fa-f]{3}$/;

export const CAMPAIGN_BADGE_INK_LIGHT = "#FFFFFF";
export const CAMPAIGN_BADGE_INK_DARK = "#111111";

export function normalizeCampaignHex(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s) return null;
  if (!s.startsWith("#")) s = `#${s}`;
  if (HEX3.test(s)) {
    s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  if (!HEX6.test(s)) return null;
  return s.toUpperCase();
}

function channel(n: number): number {
  const c = n / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const n = normalizeCampaignHex(hex);
  if (!n) return 0;
  const r = parseInt(n.slice(1, 3), 16);
  const g = parseInt(n.slice(3, 5), 16);
  const b = parseInt(n.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/** White on dark, near-black on light — whichever contrast is higher. */
export function campaignBadgeInk(background: string): string {
  const bg = normalizeCampaignHex(background);
  if (!bg) return CAMPAIGN_BADGE_INK_DARK;
  const white = contrastRatio(bg, CAMPAIGN_BADGE_INK_LIGHT);
  const dark = contrastRatio(bg, CAMPAIGN_BADGE_INK_DARK);
  return white >= dark ? CAMPAIGN_BADGE_INK_LIGHT : CAMPAIGN_BADGE_INK_DARK;
}

export function campaignBadgeStyle(
  background: string | null | undefined,
): { backgroundColor: string; color: string } | undefined {
  const bg = normalizeCampaignHex(background);
  if (!bg) return undefined;
  return { backgroundColor: bg, color: campaignBadgeInk(bg) };
}
