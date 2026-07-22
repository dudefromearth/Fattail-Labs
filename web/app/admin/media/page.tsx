import type { Metadata } from "next";
import MediaLibrary from "@/components/edit/MediaLibrary";

export const metadata: Metadata = {
  title: "Media Library — FatTail Labs",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function AdminMediaPage() {
  return <MediaLibrary />;
}
