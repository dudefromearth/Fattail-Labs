import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-6 py-16">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Enter the email for your Labs account. If we have a password on file, we&apos;ll
        send a reset link.
      </p>
      <ForgotPasswordForm />
    </main>
  );
}
