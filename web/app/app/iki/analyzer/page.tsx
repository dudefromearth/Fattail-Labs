"use client";

import { Suspense, useEffect, useState } from "react";
import OpfRiskAnalyzer from "@/components/options-lab/OpfRiskAnalyzer";
import IkiSuiteChrome from "@/components/iki/IkiSuiteChrome";
import { ikiAccessFromMe } from "@/lib/ikiAccess";
import { OptionsLabProvider } from "@/lib/optionsLabContext";
import { fetchMe } from "@/lib/useIsAdmin";

/** IKI Analyzer — OPF Analyzer in IKI chrome (not /app/options-lab/analyzer). */
export default function IkiAnalyzerPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    fetchMe().then((me) => setAllowed(ikiAccessFromMe(me).hasIkiLab));
  }, []);

  return (
    <IkiSuiteChrome active="analyzer" workspace={!!allowed}>
      {allowed === null ? (
        <main className="px-6 py-10 text-sm text-[var(--color-label-tertiary)]">
          Loading…
        </main>
      ) : allowed ? (
        <OptionsLabProvider>
          <Suspense fallback={null}>
            <OpfRiskAnalyzer />
          </Suspense>
        </OptionsLabProvider>
      ) : (
        <main className="px-6 py-10" data-testid="iki-analyzer-forbidden" />
      )}
    </IkiSuiteChrome>
  );
}
