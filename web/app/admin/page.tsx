import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
};

// Course builder (spec §12) — role-gated to administrator. P1d scope.
export default function AdminPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-2 text-zinc-500">Course builder — stub</p>
    </main>
  );
}
