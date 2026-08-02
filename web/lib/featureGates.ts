/** Feature gates — public + admin client helpers. */

export type FeatureGatePublic = {
  surface_key: string;
  active: boolean;
  enabled: boolean;
  opens_at: string | null;
  headline: string;
  body_md: string;
  /** YouTube URL/id or https embed URL for the landing intro video. */
  video_url?: string | null;
  cta_primary_label: string;
  cta_primary_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
  collect_email: boolean;
  email_prompt: string;
  reveal_path: string;
  footer_note: string | null;
};

export type FeatureGateAdmin = FeatureGatePublic & {
  label: string;
  email_count: number;
  updated_at: string | null;
};

export async function fetchPublicGate(
  surfaceKey: string,
): Promise<FeatureGatePublic | null> {
  try {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_LABS_API_URL}/api/feature-gates/${encodeURIComponent(surfaceKey)}`,
      { cache: "no-store" },
    );
    if (!r.ok) return null;
    return (await r.json()) as FeatureGatePublic;
  } catch {
    return null;
  }
}

/** Browser-side fetch (same-origin rewrite). */
export async function fetchPublicGateClient(
  surfaceKey: string,
): Promise<FeatureGatePublic | null> {
  try {
    const r = await fetch(
      `/api/feature-gates/${encodeURIComponent(surfaceKey)}`,
      { credentials: "same-origin", cache: "no-store" },
    );
    if (!r.ok) return null;
    return (await r.json()) as FeatureGatePublic;
  } catch {
    return null;
  }
}
