"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { AssetGrid } from "@/components/AssetGrid";
import { StatsSection } from "@/components/StatsSection";
import { DocsBlock } from "@/components/DocsBlock";
import { CaseStudies } from "@/components/CaseStudies";
import { GrowthSection } from "@/components/GrowthSection";

// ─── Background colour timing ──────────────────────────────────────────────
// Two levers to control the colour-change feel:
//
//  1. WHEN it fires  →  rootMargin below (line ~35)
//     "-45% 0px -45% 0px" means the section must occupy the middle 10% of
//     the viewport before the colour switches. Increase both percentages
//     (e.g. "-48% 0px -48% 0px") to fire later; decrease for earlier.
//
//  2. HOW LONG it takes  →  duration-700 on the wrapper div (line ~47)
//     Replace with duration-300 (faster) or duration-1000 (slower).
// ───────────────────────────────────────────────────────────────────────────
const SECTION_CANVAS: Record<string, string> = {
  hero: "#fafafa",
  assets: "#fafafa",
  stats: "#fafafa",
  docs: "#242424",
  "case-studies": "#fafafa",
  growth: "#00d780",
};

export default function HomePage() {
  const [canvasBg, setCanvasBg] = useState("#fafafa");

  useEffect(() => {
    const ids = Object.keys(SECTION_CANVAS);
    const observers = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setCanvasBg(SECTION_CANVAS[id]);
        },
        // Trigger when section reaches the middle of the viewport
        { rootMargin: "-35% 0px -35% 0px" }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  return (
    <div
      className="font-helix-body transition-colors duration-700 overflow-x-hidden"
      style={{ backgroundColor: canvasBg }}
    >
      <Nav />
      <Hero />
      <AssetGrid />
      <StatsSection />
      <DocsBlock />
      <CaseStudies />
      <GrowthSection />
    </div>
  );
}
