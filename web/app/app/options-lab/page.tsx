import { redirect } from "next/navigation";

/**
 * Options Lab suite home → Runner (live chain) by default.
 */
export default function OptionsLabHomePage() {
  redirect("/app/options-lab/heatmap");
}
