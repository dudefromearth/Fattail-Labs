import type { Metadata } from "next";
import ArchiveCorpusPanel from "@/components/admin/ArchiveCorpusPanel";

export const metadata: Metadata = {
  title: "Archive",
  robots: { index: false, follow: false },
};

export default function AdminArchivePage() {
  return <ArchiveCorpusPanel />;
}
