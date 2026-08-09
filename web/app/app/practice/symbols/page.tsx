"use client";

import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import PracticeMarkedUnderliers from "@/components/practice/PracticeMarkedUnderliers";

/**
 * Practice common view of shared mark universe (not a suite pill).
 * Links: Positions degradation · Trade Log · Accounts & Capital.
 */
export default function PracticeSymbolsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <PracticeSuiteChrome
        active="symbols"
        hideTitle
        showBlurb={false}
      >
        <div className="mt-6">
          <PracticeMarkedUnderliers />
        </div>
      </PracticeSuiteChrome>
    </main>
  );
}
