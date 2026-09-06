import type { Metadata } from "next";
import MonteCarloLab from "@/components/strategy-lab/MonteCarloLab";
import { siteUrl } from "@/lib/catalog";

/**
 * Strategy Lab — Monte Carlo over fills, from the compressed [C][T] store.
 * ATRV v0.8 §3.7–3.10 · QLAB v0.3 §4.4. Process outcomes only.
 */
export const metadata: Metadata = {
  title: "Strategy Lab — Monte Carlo",
  description: "A strategy is its distribution. Monte Carlo over fills on the archived path — every fill taxed, nothing interpolated, no headline number.",
  alternates: { canonical: siteUrl("/app/strategy-lab/montecarlo") },
};

export default function MonteCarloPage() {
  return <MonteCarloLab />;
}
