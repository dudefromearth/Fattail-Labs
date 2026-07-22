import type { Metadata } from "next";
import MyLearning from "@/components/MyLearning";

export const metadata: Metadata = {
  title: "My Learning",
  robots: { index: false, follow: false },
};

export default function MePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">My Learning</h1>
      <div className="mt-8">
        <MyLearning />
      </div>
    </main>
  );
}
