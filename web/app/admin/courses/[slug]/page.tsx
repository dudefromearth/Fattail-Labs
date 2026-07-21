import type { Metadata } from "next";
import DraftCourseEditor from "@/components/edit/DraftCourseEditor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Course",
  robots: { index: false },
};

export default async function AdminCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <DraftCourseEditor slug={slug} />;
}
