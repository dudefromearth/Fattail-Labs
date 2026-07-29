import { redirect } from "next/navigation";

// Dashboard folded into Journey (Member Profile + Journey Visibility Spec v1.0).
export default function DashboardPage() {
  redirect("/app/journey");
}
