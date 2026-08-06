"use client";

/**
 * Deploy phase — same run dashboard shell as Curate + Practice-style
 * equity / drawdown / stats reports.
 */

import Link from "next/link";
import PhaseRunDashboard from "@/components/strategy-lab/PhaseRunDashboard";
import DeployReportsPanel from "@/components/strategy-lab/DeployReportsPanel";

export default function DeployPhaseDashboard() {
  return (
    <div className="space-y-8">
      <PhaseRunDashboard
        phaseLabel="Deploy"
        phaseKey="deploy"
        accountModeLabel="paper / live"
        summary={{ runs: 0, active: 0, strategies: 0 }}
        rows={[]}
        emptyHint="Deploy bot cards (grid/table + mini equity) will list Tradier-connected bots when provisioned. Equity & stats reporting below is live now — same structure as Practice Reports."
        toolbarExtra={
          <Link
            href="/app/strategy-lab?phase=curation"
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Prove bots in Curate →
          </Link>
        }
        headerSlot={
          <p className="rounded-lg border border-dashed border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-3 py-2 text-xs text-[var(--color-label-secondary)]">
            Bot cards mirror Curate (bot = unit; strategy = pack attribute; position =
            bot instance). Equity curve, drawdown, stats, and distributions match
            Practice Reports.
          </p>
        }
      />

      <section
        className="rounded-2xl border-2 border-[var(--color-separator)] bg-[var(--color-surface)] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:p-6"
        data-testid="deploy-reports-section"
      >
        <DeployReportsPanel />
      </section>
    </div>
  );
}
