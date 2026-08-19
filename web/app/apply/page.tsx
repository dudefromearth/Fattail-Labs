import type { Metadata } from "next";
import ApplyForm from "@/components/ApplyForm";
import FatTailWordmark from "@/components/FatTailWordmark";

export const metadata: Metadata = {
  title: "Apply",
  description:
    "Apply for FatTail coaching. Seven questions so we can book a fit conversation.",
  robots: { index: false, follow: false },
};

export default function ApplyPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-6 py-16">
      <div className="text-[var(--color-label)]">
        <FatTailWordmark className="h-16 w-auto" />
      </div>
      <h1 className="mt-8 text-[length:var(--text-title-1)] font-semibold text-[var(--color-label)]">
        Apply
      </h1>
      <p className="mt-2 text-[length:var(--text-body)] text-[var(--color-label-secondary)]">
        Seven questions. Honest answers. We use them to book a conversation —
        not to sell a result.
      </p>
      <ApplyForm />
    </main>
  );
}
