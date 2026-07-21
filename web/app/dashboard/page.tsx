import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Member home (spec §5.4). Requires auth — out of P1 Foundation scope.
export default function DashboardPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-zinc-500">Member home — stub</p>
    </main>
  );
}
