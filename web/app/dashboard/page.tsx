import type { Metadata } from "next";
import ContinueLearning from "@/components/ContinueLearning";
import DashboardExtras from "@/components/DashboardExtras";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Continue Learning</h2>
        <div className="mt-4">
          <ContinueLearning />
        </div>
      </section>
      <DashboardExtras />
    </main>
  );
}
