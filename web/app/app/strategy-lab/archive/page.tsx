import type { Metadata } from "next";
import StrategyLabArchiveApp from "@/components/strategy-lab/StrategyLabArchiveApp";
import { siteUrl } from "@/lib/catalog";

/**
 * Strategy Lab Archive — retired/trashed strategies, reports, and logs.
 * Off the phase board; accessed via suite nav (Practice-style chrome).
 */

export const metadata: Metadata = {
  title: "Archive · Strategy Lab",
  description:
    "Retired strategies, reports, and lifecycle logs for Strategy Lab on your account.",
  alternates: { canonical: siteUrl("/app/strategy-lab/archive") },
};

export default function StrategyLabArchivePage() {
  return <StrategyLabArchiveApp />;
}
