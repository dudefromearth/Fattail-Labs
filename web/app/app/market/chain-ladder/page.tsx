import { redirect } from "next/navigation";

/** Legacy path → Options Lab home. */
export default function MarketChainLadderRedirect() {
  redirect("/app/options-lab");
}
