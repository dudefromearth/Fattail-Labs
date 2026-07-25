import type { Metadata } from "next";
import SignupForm from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "Join",
};

export default function SignupPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-6 py-16">
      <div className="surface-card border border-[var(--color-separator)] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-tint)] text-sm font-bold text-[var(--color-on-tint)]">
            1
          </span>
          <span className="text-sm font-medium text-[var(--color-tint)]">
            Step 1 of 2
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--color-label)]">
          Create Your Account
        </h1>
        <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
          Courses, live trading sessions, quizzes, and the Trade Lab resource
          library — built on one doctrine: stop the bleeding first.
        </p>
        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface-secondary)] p-4 text-sm">
          <p className="font-medium text-[var(--color-label)]">What happens next:</p>
          <ul className="mt-2 space-y-1 text-[var(--color-label-secondary)]">
            <li>✓ Your free account — preview lessons unlock instantly</li>
            <li>✓ Choose a membership (or continue free)</li>
            <li>✓ Two-minute assessment builds your pathway</li>
          </ul>
        </div>
        <SignupForm />
        <p className="mt-8 text-center text-xs text-[var(--color-label-tertiary)]">
          Already a FatTail.ai or 0-DTE.com member? Your login there will work
          here once connected.
        </p>
      </div>
    </main>
  );
}
