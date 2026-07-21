import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

// Dual WordPress SSO entry (spec §7.2) — wiring lands with the SSO project.
export default function LoginPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Sign in to FatTail Labs</h1>
      <p className="mt-2 text-zinc-500">SSO — stub</p>
    </main>
  );
}
