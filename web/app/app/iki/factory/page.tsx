"use client";

import IkiSuiteChrome from "@/components/iki/IkiSuiteChrome";

export default function IkiFactoryPage() {
  return (
    <IkiSuiteChrome active="factory">
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-label)]">
          IKI Factory
        </h1>
        <p className="mt-2 text-[var(--color-label-secondary)]">
          The factory is named. What it produces is not seated yet — this is a
          placeholder, not a second Wiki.
        </p>
        <p
          className="mt-8 text-sm text-[var(--color-label-tertiary)]"
          data-testid="iki-factory-soon"
        >
          Coming soon.
        </p>
      </main>
    </IkiSuiteChrome>
  );
}
