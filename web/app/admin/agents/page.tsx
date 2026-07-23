import type { Metadata } from "next";
import AgentsPanel from "@/components/admin/AgentsPanel";

export const metadata: Metadata = {
  title: "Agent keys — Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function AdminAgentsPage() {
  return <AgentsPanel />;
}
