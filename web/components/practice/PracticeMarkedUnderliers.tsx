"use client";

import LiveUnderliersTable from "@/components/market/LiveUnderliersTable";

export default function PracticeMarkedUnderliers() {
  return (
    <LiveUnderliersTable
      variant="practice"
      enabledOnly
      title="Marked underliers"
      description={
        <>
          Shared mark universe for{" "}
          <strong className="font-medium text-[var(--color-label)]">
            Practice Positions
          </strong>{" "}
          and Strategy Lab. One row ↔{" "}
          <code className="text-[11px]">mb:sym:{"{SYMBOL}"}</code> (plus HTTP
          ensure_fresh). Index mids are native prints — never a silent SPY price
          labeled SPX.
        </>
      }
    />
  );
}
