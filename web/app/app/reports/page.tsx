"use client";

// Reports — Practice suite home: equity, drawdown, stats, distribution.

import { Suspense } from "react";
import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import ReportsDashboard from "@/components/reports/ReportsDashboard";

export default function ReportsPage() {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6 pb-24 sm:px-6">
      <PracticeSuiteChrome active="reports">
        <Suspense
          fallback={
            <p className="mt-8 text-sm text-[var(--color-label-tertiary)]">
              Loading reports…
            </p>
          }
        >
          <ReportsDashboard />
        </Suspense>
      </PracticeSuiteChrome>
    </main>
  );
}
