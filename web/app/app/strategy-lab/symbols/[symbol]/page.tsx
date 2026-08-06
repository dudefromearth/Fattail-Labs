import type { Metadata } from "next";
import StrategyLabSymbolDetailApp from "@/components/strategy-lab/StrategyLabSymbolDetailApp";
import { siteUrl } from "@/lib/catalog";

type Props = { params: Promise<{ symbol: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const sym = decodeURIComponent(symbol).toUpperCase();
  return {
    title: `${sym} · Symbols · Strategy Lab`,
    description: `Shared stream info for ${sym} — Curate and strategy decisions.`,
    alternates: {
      canonical: siteUrl(`/app/strategy-lab/symbols/${encodeURIComponent(sym)}`),
    },
  };
}

export default async function StrategyLabSymbolDetailPage({ params }: Props) {
  const { symbol } = await params;
  return (
    <StrategyLabSymbolDetailApp
      symbol={decodeURIComponent(symbol).toUpperCase()}
    />
  );
}
