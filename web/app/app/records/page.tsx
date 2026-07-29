import { redirect } from "next/navigation";

/** Legacy interim name — product name is Reports. */
export default function RecordsRedirect() {
  redirect("/app/reports");
}
