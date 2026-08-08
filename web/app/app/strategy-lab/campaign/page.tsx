import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/catalog";

/**
 * Strategy Lab campaigns (containers) vs Deploy (process step).
 *
 * LifeCycle.pdf: third stage is **Campaign Phase** (strategies, capital allocation,
 * start/end, log, prune, retrospective, end date). Strategy Lab suite labels that
 * **board process step** as **Deploy** so members hear a clear verb.
 *
 * Deploy action: place curated strategies **into** one or more campaigns.
 * This route is reserved for campaign *entities* (capital books / groups).
 * Until multi-campaign deploy UI ships, land on the Deploy board.
 *
 * Practice Campaign is separate: `/app/practice/campaign` (human mode).
 */

export const metadata: Metadata = {
  title: "Strategy Lab · Campaigns",
  description:
    "Campaigns are capital contexts strategies deploy into. Use Deploy to run curated bots into campaigns.",
  alternates: { canonical: siteUrl("/app/strategy-lab/campaign") },
};

export default function StrategyLabCampaignPage() {
  // Campaign entity manager TBD — Deploy board is the process step today.
  redirect("/app/strategy-lab?phase=deployment");
}
