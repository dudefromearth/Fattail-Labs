import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "IKI Factory — Admin",
  robots: { index: false, follow: false },
};

export default function AdminIkiFactoryPage() {
  redirect("/app/iki/factory");
}
