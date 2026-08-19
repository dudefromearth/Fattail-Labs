import type { Metadata } from "next";
import Image from "next/image";
import ApplyForm from "@/components/ApplyForm";

export const metadata: Metadata = {
  title: "Apply",
  description: "Apply so the desk can book. Seven answers. One submit.",
};

export default function ApplyPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-6 py-16">
      <div className="mb-8 flex flex-col items-start gap-4">
        <Image
          src="/brand/fattail-labs-logo.jpg"
          alt="fattail"
          width={44}
          height={44}
          priority
          className="h-11 w-11"
        />
        <div>
          <p className="text-[length:var(--text-footnote)] font-medium uppercase tracking-[0.08em] text-[var(--color-label-tertiary)]">
            fattail
          </p>
          <h1 className="mt-1 text-[length:var(--text-title-2)] font-semibold text-[var(--color-label)]">
            Apply
          </h1>
          <p className="mt-2 text-[length:var(--text-body)] text-[var(--color-label-secondary)]">
            Seven answers so the desk can book. One submit. Not a membership
            checkout and not an account.
          </p>
        </div>
      </div>
      <ApplyForm />
    </main>
  );
}
