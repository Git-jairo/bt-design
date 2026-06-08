import Link from "next/link";

export const metadata = { title: "Icons — BudgetThuis.Design" };

export default function IconsPage() {
  return (
    <main className="min-h-screen bg-screen flex flex-col items-center justify-center gap-6 px-6 font-helix-body">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-950/40">
        Coming soon
      </p>
      <h1 className="font-helix-display text-6xl md:text-8xl uppercase text-gray-950 text-center leading-none">
        Icons
      </h1>
      <p className="text-gray-950/60 max-w-sm text-center leading-relaxed">
        The Helix icon library is under construction. Check back soon.
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
