import type { Metadata } from "next";
import ProfileSettings from "@/components/ProfileSettings";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-[var(--color-label-secondary)]">
        Your name, photo, and Journey visibility. Learning progress lives in{" "}
        <a href="/app/journey" className="font-medium text-[var(--color-tint)]">
          Journey
        </a>
        .
      </p>
      <div className="mt-8">
        <ProfileSettings />
      </div>
    </main>
  );
}
