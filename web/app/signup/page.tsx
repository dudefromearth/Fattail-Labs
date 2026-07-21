import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join",
};

// Two-step enrollment funnel (spec §5.5) — WooCommerce checkout integration later.
export default function SignupPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Join FatTail Labs</h1>
      <p className="mt-2 text-zinc-500">Signup funnel — stub</p>
    </main>
  );
}
