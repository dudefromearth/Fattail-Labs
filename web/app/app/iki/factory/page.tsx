"use client";

import { useEffect, useState } from "react";

import IkiFactoryBoard from "@/components/admin/IkiFactoryBoard";
import IkiSuiteChrome from "@/components/iki/IkiSuiteChrome";
import { fetchMe } from "@/lib/useIsAdmin";

export default function IkiFactoryPage() {
  const [role, setRole] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    fetchMe().then((me) => setRole(me?.role ?? null));
  }, []);

  const isAdmin = role === "administrator";

  return (
    <IkiSuiteChrome active="factory" workspace={isAdmin}>
      {role === undefined ? (
        <main className="px-6 py-10 text-sm text-[var(--color-label-tertiary)]">
          Loading…
        </main>
      ) : isAdmin ? (
        <div className="flex min-h-0 flex-1 flex-col bg-[color-mix(in_srgb,var(--color-canvas)_86%,var(--color-label)_14%)]">
          <IkiFactoryBoard />
        </div>
      ) : (
        <main className="px-6 py-10" data-testid="iki-factory-forbidden" />
      )}
    </IkiSuiteChrome>
  );
}
