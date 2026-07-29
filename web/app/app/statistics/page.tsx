import { redirect } from "next/navigation";

/** Legacy slug — product name is Reports. */
export default function StatisticsRedirect() {
  redirect("/app/reports");
}
