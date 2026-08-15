"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import RetrospectiveWorkspace from "@/components/retrospective/RetrospectiveWorkspace";

export default function RetrospectiveDetailPage() {
  const params = useParams();
  const raw = params?.id;
  const id = typeof raw === "string" ? Number(raw) : Number(raw?.[0]);
  const [status, setStatus] = useState<string | null>(null);
  const onStatusChange = useCallback((s: string) => setStatus(s), []);

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <main className="mx-auto max-w-[1100px] px-4 py-10">
        <p className="text-sm text-red-600">Invalid retrospective.</p>
        <Link href="/app/retrospective" className="mt-2 text-[var(--color-tint)]">
          Back
        </Link>
      </main>
    );
  }

  const complete = status === "complete";

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6 pb-24 sm:px-6">
      <PracticeSuiteChrome
        active="retrospective"
        subtitle="Opening reckoning — compass, shape, drawdown, practice. Score lives here, not in the journal."
        contextInert={complete}
        contextInertMessage="This completed retrospective is fixed at gather — account and date do not change what is shown. Period was set when you gathered; the book uses the account scope stored then."
      >
        <div className="mt-6">
          <RetrospectiveWorkspace
            retroId={id}
            onStatusChange={onStatusChange}
          />
        </div>
      </PracticeSuiteChrome>
    </main>
  );
}
