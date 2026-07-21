import type { Metadata } from "next";
import SignupForm from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "Join",
};

export default function SignupPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-6 py-16">
      <h1 className="text-2xl font-semibold">Join FatTail Labs</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Create a free account to watch preview lessons across every course.
        Full membership unlocks the complete library.
      </p>
      <SignupForm />
      <p className="mt-8 text-center text-xs text-zinc-400">
        Full membership is available through your FatTail.ai or 0-DTE.com
        membership — your login there works here.
      </p>
    </main>
  );
}
