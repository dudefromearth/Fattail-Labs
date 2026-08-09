import type { Metadata } from "next";
import Link from "next/link";
import ProfileSettings from "@/components/ProfileSettings";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-[var(--color-label-secondary)]">
        Your name, photo, Journey visibility, and a private download of your
        Practice data. Trade books and capital live in{" "}
        <Link
          href="/accounts-capital"
          className="font-medium text-[var(--color-tint)]"
        >
          Accounts &amp; Capital
        </Link>
        . Learning progress lives in{" "}
        <a href="/app/journey" className="font-medium text-[var(--color-tint)]">
          Journey
        </a>
        .
      </p>
      <div className="mt-8 space-y-8">
        <ProfileSettings />
        <section className="surface-card border border-[var(--color-separator)] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-label)]">
            Accounts &amp; Capital
          </h2>
          <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
            Create and retire trade books, record deposits and withdrawals, set
            starting balance and master drawdown tolerance.
          </p>
          <p className="mt-3">
            <Link
              href="/accounts-capital"
              className="text-sm font-medium text-[var(--color-tint)] hover:underline"
              data-testid="profile-link-accounts-capital"
            >
              Open Accounts &amp; Capital →
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
