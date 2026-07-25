import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-6 py-16">
      <div className="surface-card border border-[var(--color-separator)] p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-[var(--color-label)]">
          Sign in to FatTail Labs
        </h1>
        <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
          Enter your email and password, or use your membership site login.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
