import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LaunchLanding from "@/components/launch/LaunchLanding";
import { isPreLaunch, launchAtIso } from "@/lib/launch";
import { siteUrl } from "@/lib/catalog";

/**
 * Public home:
 * - Pre-launch → countdown landing (month-end Navigator campaign)
 * - Post-launch → course hub at /hub (single source of truth for the library UI)
 *
 * Launch instant: NEXT_PUBLIC_LABS_LAUNCH_AT (ISO-8601 with timezone).
 */

export const dynamic = "force-dynamic";

const LAUNCH_LABEL =
  process.env.NEXT_PUBLIC_LABS_LAUNCH_LABEL?.trim() || "this weekend";

export async function generateMetadata(): Promise<Metadata> {
  if (!isPreLaunch()) {
    return {
      title: { absolute: "FatTail Labs — Course Hub" },
      alternates: { canonical: siteUrl("/") },
    };
  }
  const description =
    "FatTail Labs launches this weekend — membership education for convex options trading. Capital preservation first. Courses, live sessions, resources, and practice apps.";
  return {
    title: { absolute: "FatTail Labs — Launching soon" },
    description,
    alternates: { canonical: siteUrl("/") },
    openGraph: {
      title: "FatTail Labs — Launching soon",
      description,
      url: siteUrl("/"),
      siteName: "FatTail Labs",
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default function HomePage() {
  const iso = launchAtIso();
  if (!iso || !isPreLaunch()) {
    // Live: home is the course hub.
    redirect("/hub");
  }

  return (
    <LaunchLanding launchAtIso={iso} launchLabel={LAUNCH_LABEL} />
  );
}
