import type { Metadata } from "next";
import AgentWorkbench from "@/components/admin/AgentWorkbench";

export const metadata: Metadata = {
  title: "Agent workbench — FatTail Labs",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function AdminAiPage() {
  return <AgentWorkbench />;
}
