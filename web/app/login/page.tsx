import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-6 py-16">
      <h1 className="text-2xl font-semibold">Sign in to FatTail Labs</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Enter your email and password, or use your membership site login.
      </p>
      <LoginForm />
    </main>
  );
}
