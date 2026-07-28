import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LaunchLanding from "@/components/launch/LaunchLanding";
import { fetchPublicGate } from "@/lib/featureGates";
import { siteUrl } from "@/lib/catalog";

/**
 * Public home — may be behind an admin-controlled feature gate
 * (countdown + waitlist). Otherwise redirect to the course hub at /hub.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const gate = await fetchPublicGate("home");
  if (gate?.active) {
    const description =
      gate.body_md?.replace(/[#*_`\[\]]/g, "").slice(0, 280) ||
      "FatTail Labs is launching soon — membership education for convex options trading.";
    return {
      title: { absolute: `FatTail Labs — ${gate.headline || "Coming soon"}` },
      description,
      alternates: { canonical: siteUrl("/") },
      openGraph: {
        title: `FatTail Labs — ${gate.headline || "Coming soon"}`,
        description,
        url: siteUrl("/"),
        siteName: "FatTail Labs",
        type: "website",
      },
      robots: { index: true, follow: true },
    };
  }
  return {
    title: { absolute: "FatTail Labs — Course Hub" },
    alternates: { canonical: siteUrl("/") },
  };
}

export default async function HomePage() {
  const gate = await fetchPublicGate("home");
  if (gate?.active) {
    return <LaunchLanding gate={gate} />;
  }
  redirect(gate?.reveal_path || "/hub");
}
