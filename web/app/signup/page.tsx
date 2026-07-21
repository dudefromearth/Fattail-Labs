import type { Metadata } from "next";
import SignupForm from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "Join",
};

export default function SignupPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-6 py-16">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
          1
        </span>
        <span className="text-sm font-medium text-emerald-600">Step 1 of 2</span>
      </div>
      <h1 className="mt-3 text-2xl font-semibold">Create Your Account</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Courses, live trading sessions, quizzes, and the Trade Lab resource
        library — built on one doctrine: stop the bleeding first.
      </p>
      <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
        <p className="font-medium">What happens next:</p>
        <ul className="mt-2 space-y-1 text-zinc-600 dark:text-zinc-400">
          <li>✓ Your free account — preview lessons unlock instantly</li>
          <li>✓ Choose a membership (or continue free)</li>
          <li>✓ Two-minute assessment builds your pathway</li>
        </ul>
      </div>
      <SignupForm />
      <p className="mt-8 text-center text-xs text-zinc-400">
        Already a FatTail.ai or 0-DTE.com member? Your login there will work
        here once connected.
      </p>
    </main>
  );
}
