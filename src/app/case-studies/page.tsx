import Link from "next/link";

export const metadata = { title: "Case Studies — BudgetThuis.Design" };

export default function CaseStudiesPage() {
  return (
    <main className="min-h-screen bg-screen flex flex-col items-center justify-center gap-6 px-6 font-helix-body">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">
        Case Studies
      </p>
      <h1 className="font-helix-display text-6xl md:text-8xl uppercase text-ink text-center leading-none">
        The Work
      </h1>
      <p className="text-ink/60 max-w-sm text-center leading-relaxed">
        More case studies are being documented. In the meantime, explore the
        first one below.
      </p>
      <Link
        href="/hackathon26"
        className="h-12 px-8 rounded-full bg-teal text-white font-semibold text-sm flex items-center gap-2 hover:bg-mint hover:text-ink transition-colors"
      >
        Priority Queue Dashboard →
      </Link>
      <Link
        href="/"
        className="text-sm font-semibold text-ink/40 hover:text-ink transition-colors underline-offset-2"
      >
        ← Back to hub
      </Link>
    </main>
  );
}
