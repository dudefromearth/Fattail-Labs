import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteUrl } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: slug,
    robots: { index: false },
    alternates: { canonical: siteUrl(`/campaign/${slug}`) },
  };
}

/**
 * Campaign detail. Reserved SEO path — 404 until campaign content is wired.
 */
export default async function CampaignDetailPage({ params }: Props) {
  await params;
  notFound();
}
