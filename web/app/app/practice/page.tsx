import { redirect } from "next/navigation";

/**
 * Practice suite home is Reports (equity + process charts).
 * Suite nav on Reports reaches Trade Log, Journal, Playbook.
 */
export default function PracticeHubPage() {
  redirect("/app/reports");
}
