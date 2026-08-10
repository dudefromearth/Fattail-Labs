import { redirect } from "next/navigation";

/** Legacy path → Options Lab Heatmap (chain). */
export default function MarketChainLadderRedirect() {
  redirect("/app/options-lab/heatmap");
}
