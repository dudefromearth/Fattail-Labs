import { redirect } from "next/navigation";

// Entry point rule (spec §4.1): logged-out → /courses.
// Once auth lands, authenticated members route to /dashboard instead.
export default function Root() {
  redirect("/courses");
}
