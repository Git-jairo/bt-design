"use client";

import { useEffect, useState } from "react";
import { Nav }           from "@/design-system/components/Nav";
import { Hero }          from "@/design-system/sections/Hero";
import { AssetGrid }     from "@/design-system/sections/AssetGrid";
import { StatsSection }  from "@/design-system/sections/StatsSection";
import { DocsBlock }     from "@/design-system/sections/DocsBlock";
import { CaseStudies }   from "@/design-system/sections/CaseStudies";
import { GrowthSection } from "@/design-system/sections/GrowthSection";

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
  hero:           "var(--sem-color-canvas-default)",
  assets:         "var(--sem-color-canvas-default)",
  stats:          "var(--sem-color-canvas-default)",
  docs:           "var(--sem-color-canvas-inverted)",
  "case-studies": "var(--sem-color-canvas-default)",
  growth:         "var(--sem-color-canvas-brand)",
};

export default function HomePage() {
  const [canvasBg, setCanvasBg] = useState("var(--sem-color-canvas-default)");

  useEffect(() => {
    const ids      = Object.keys(SECTION_CANVAS);
    const observers = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setCanvasBg(SECTION_CANVAS[id]);
        },
        { rootMargin: "-35% 0px -35% 0px" },
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
