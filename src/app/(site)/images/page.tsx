import Link from "next/link";

export const metadata = { title: "Images — BudgetThuis.Design" };

export default function ImagesPage() {
  return (
    <main className="min-h-screen bg-screen flex flex-col items-center justify-center gap-6 px-6 font-helix-body">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">
        Coming soon
      </p>
      <h1 className="font-helix-display text-6xl md:text-8xl uppercase text-ink text-center leading-none">
        Images
      </h1>
      <p className="text-ink/60 max-w-sm text-center leading-relaxed">
        Curated photography aligned to Helix brand guidelines — coming soon.
      </p>
      <Link
        href="/"
        className="text-sm font-semibold text-teal hover:underline underline-offset-2 transition-colors"
      >
        ← Back to hub
      </Link>
    </main>
  );
}
