import type { Metadata } from "next";
import { Suspense } from "react";
import SetPasswordForm from "./set-password-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set your password",
  robots: { index: false, follow: false },
  description: "Choose the password for your FatTail Labs account.",
};

export default function PasswordPage() {
  return (
    <main className="fd" data-testid="fd-password-page">
      <div className="fd-wrap">
        <Suspense fallback={<p className="fd-detail">Loading…</p>}>
          <SetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
