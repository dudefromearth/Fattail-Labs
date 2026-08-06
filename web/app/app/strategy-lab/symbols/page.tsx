import type { Metadata } from "next";
import StrategyLabSymbolsApp from "@/components/strategy-lab/StrategyLabSymbolsApp";
import { siteUrl } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Symbols · Strategy Lab",
  description:
    "Shared Curate symbol universe — indexes, ETFs, and stocks for all members.",
  alternates: { canonical: siteUrl("/app/strategy-lab/symbols") },
};

export default function StrategyLabSymbolsPage() {
  return <StrategyLabSymbolsApp />;
}
