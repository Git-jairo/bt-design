"use client";

import Link from "next/link";

/**
 * Mijn Omgeving — Contract Renewal
 *
 * This experiment is a self-contained, exported HTML/JS prototype (a
 * "bundled page" with its assets inlined) rather than a native React build.
 * It's served as a static file from `public/experiments/contract-renewal/`
 * and embedded here via iframe so its own script/manifest tags don't
 * collide with Next's hydration. If this concept graduates, it should be
 * rebuilt as real components against the Helix Design System.
 */
export default function ContractRenewalPage() {
  return (
    <div className="fixed inset-0 bg-white">
      <Link
        href="/experiments"
        className="fixed top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm transition-colors hover:bg-black/80"
      >
        ← Lab
      </Link>
      <iframe
        src="/experiments/contract-renewal/index.html"
        title="Mijn Omgeving — Contract Renewal"
        className="h-full w-full border-0"
      />
    </div>
  );
}
