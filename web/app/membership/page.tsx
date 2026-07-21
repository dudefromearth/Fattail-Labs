import type { Metadata } from "next";
import { Suspense } from "react";
import MembershipPlans from "@/components/MembershipPlans";

export const metadata: Metadata = {
  title: "Membership",
};

export default function MembershipPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Membership</h1>
      <p className="mt-2 max-w-xl text-zinc-600 dark:text-zinc-400">
        Unlock every course, quiz, resource, and live session. First lesson of the
        doctrine either way: stop the bleeding.
      </p>
      <div className="mt-8">
        <Suspense>
          <MembershipPlans />
        </Suspense>
      </div>
    </main>
  );
}
