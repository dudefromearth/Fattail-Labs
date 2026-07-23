import type { Metadata } from "next";
import BoardKanban from "@/components/admin/BoardKanban";

export const metadata: Metadata = {
  title: "Production board — Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function AdminBoardPage() {
  return <BoardKanban />;
}
