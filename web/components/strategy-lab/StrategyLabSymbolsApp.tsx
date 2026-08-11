"use client";

/**
 * Shared symbol universe — uses site-wide LiveUnderliersTable pattern.
 */

import Link from "next/link";
import StrategyLabChrome from "@/components/strategy-lab/StrategyLabChrome";
import CorrelationCalculator from "@/components/strategy-lab/CorrelationCalculator";
import LiveUnderliersTable from "@/components/market/LiveUnderliersTable";

export default function StrategyLabSymbolsApp() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <StrategyLabChrome
        active="development"
        designSub="symbols"
        subtitle="Shared universe — assign a symbol to each bot in Design; re-select in Curate for sim."
      >
        <div className="mt-4 space-y-6">
          <CorrelationCalculator />

          <LiveUnderliersTable
            variant="lab"
            enabledOnly
            title="Shared underliers"
            description={
              <>
                Same live mark plane as Practice Positions and Admin. One row ↔{" "}
                <code className="text-[11px]">mb:sym:{"{SYMBOL}"}</code> +
                ensure_fresh. Click a symbol for detail.
              </>
            }
          />

          <p className="text-[11px] text-[var(--color-label-secondary)]">
            Proxy column = labeled ETF when native index print unavailable.{" "}
            <Link
              href="/app/strategy-lab?phase=development"
              className="text-blue-600 hover:underline"
            >
              ← Design board
            </Link>
            {" · "}
            <Link
              href="/app/strategy-lab?phase=curation"
              className="text-blue-600 hover:underline"
            >
              Curate
            </Link>
          </p>
        </div>
      </StrategyLabChrome>
    </main>
  );
}
