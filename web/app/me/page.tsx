import type { Metadata } from "next";
import ProfileSettings from "@/components/ProfileSettings";
import TradeAccountsSettings from "@/components/trade-log/TradeAccountsSettings";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-[var(--color-label-secondary)]">
        Your name, photo, Journey visibility, trade accounts, and a private
        download of your Practice data. Learning progress lives in{" "}
        <a href="/app/journey" className="font-medium text-[var(--color-tint)]">
          Journey
        </a>
        .
      </p>
      <div className="mt-8 space-y-8">
        <ProfileSettings />
        <TradeAccountsSettings />
      </div>
    </main>
  );
}
