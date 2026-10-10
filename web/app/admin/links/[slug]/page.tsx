import type { Metadata } from "next";
import LinkDetailPanel from "@/components/admin/LinkDetailPanel";

export const metadata: Metadata = {
  title: "Link detail — Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLinkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <LinkDetailPanel slug={slug} />;
}
