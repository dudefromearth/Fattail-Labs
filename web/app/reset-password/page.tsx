import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-6 py-16">
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Use the link from your email. Passwords must be at least 10 characters.
      </p>
      <Suspense fallback={<p className="mt-8 text-sm text-zinc-500">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
