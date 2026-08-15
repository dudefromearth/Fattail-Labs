import { redirect } from "next/navigation";

/** Find and Badge lives on the Campaigns main page. */
export default function TradeLogFindRedirect() {
  redirect("/app/practice/campaign#find-badge");
}
