import type { Metadata } from "next";
import { Suspense } from "react";
import MemberSettingsApp from "@/components/settings/MemberSettingsApp";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-[var(--color-label-secondary)]">
        Application and site-wide preferences for this device. Your name and
        photo stay on Profile.
      </p>
      <div className="mt-8">
        <Suspense
          fallback={
            <p className="text-sm text-[var(--color-label-tertiary)]">
              Loading…
            </p>
          }
        >
          <MemberSettingsApp />
        </Suspense>
      </div>
    </main>
  );
}
