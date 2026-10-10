import type { Metadata } from "next";
import LinkBreakdownPanel from "@/components/admin/LinkBreakdownPanel";

export const metadata: Metadata = {
  title: "Link breakdown — Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLinkBreakdownPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; dimension: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { slug, dimension } = await params;
  const { days: daysParam } = await searchParams;
  const days = daysParam && ["7", "30", "90", "0"].includes(daysParam) ? Number(daysParam) : 30;
  return <LinkBreakdownPanel slug={slug} dimension={dimension} days={days} />;
}
