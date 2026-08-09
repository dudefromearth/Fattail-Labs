import type { Metadata } from "next";
import MarketUniverseAdmin from "@/components/admin/MarketUniverseAdmin";

export const metadata: Metadata = {
  title: "Market universe",
  robots: { index: false, follow: false },
};

export default function AdminMarketUniversePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <MarketUniverseAdmin />
    </div>
  );
}
