"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import RetrospectiveWorkspace from "@/components/retrospective/RetrospectiveWorkspace";

export default function RetrospectiveDetailPage() {
  const params = useParams();
  const raw = params?.id;
  const id = typeof raw === "string" ? Number(raw) : Number(raw?.[0]);

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

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6 pb-24 sm:px-6">
      <PracticeSuiteChrome
        active="retrospective"
        subtitle="Gather since last retrospective — dual report, integrity, progress."
      >
        <div className="mt-6">
          <RetrospectiveWorkspace retroId={id} />
        </div>
      </PracticeSuiteChrome>
    </main>
  );
}
