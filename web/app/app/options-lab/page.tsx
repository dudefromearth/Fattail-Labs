import { redirect } from "next/navigation";

/**
 * Options Lab suite home → Heatmap (live chain) by default.
 */
export default function OptionsLabHomePage() {
  redirect("/app/options-lab/heatmap");
}
