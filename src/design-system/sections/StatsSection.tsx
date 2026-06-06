"use client";

import { useRef }         from "react";
import { useScroll, useReducedMotion } from "framer-motion";
import { StatColumn, type StatCardConfig } from "@/design-system/patterns/StatCard";
import { METRICS }        from "@/lib/placeholders";

/*
 * Column layout: Col A drifts down, Col B rockets up, Col C barely moves —
 * cards breathe apart dramatically on scroll.
 */
const COLUMNS: {
  id:     string;
  yRange: [number, number];
  cards:  StatCardConfig[];
}[] = [
  {
    id:     "col-a",
    yRange: [-200, 120],
    cards: [
      {
        value:       METRICS.iconCount,
        suffix:      "+",
        label:       "Icons",
        href:        "#icons",
        bg:          "bg-brand",
        numberColor: "text-fg",
        labelColor:  "text-fg/55",
        fontSize:    "clamp(5rem, 11vw, 14rem)",
        flex:        "flex-1",
        rotate:      -2.5,
      },
    ],
  },
  {
    id:     "col-b",
    yRange: [160, -160],
    cards: [
      {
        value:       METRICS.imageCount,
        suffix:      "+",
        label:       "Images",
        href:        "#images",
        bg:          "bg-raised",
        numberColor: "text-fg",
        labelColor:  "text-fg/50",
        fontSize:    "clamp(3.5rem, 10vw, 9rem)",
        flex:        "h-62",
        rotate:      2,
      },
      {
        value:       METRICS.illustrationCount,
        suffix:      "+",
        label:       "Illustrations",
        href:        "#illustrations",
        bg:          "bg-brand-dim",
        numberColor: "text-white",
        labelColor:  "text-white/55",
        fontSize:    "clamp(4rem, 12vw, 10rem)",
        flex:        "flex-1",
        rotate:      -1.5,
      },
    ],
  },
  {
    id:     "col-c",
    yRange: [-80, 80],
    cards: [
      {
        value:       METRICS.logoCount,
        suffix:      "",
        label:       "Logo's",
        href:        "#logos",
        bg:          "bg-dark",
        numberColor: "text-fg-accent",
        labelColor:  "text-fg-inverse/45",
        fontSize:    "clamp(6rem, 18vw, 16rem)",
        flex:        "flex-1",
        rotate:      3,
      },
    ],
  },
];

export function StatsSection() {
  const sectionRef     = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target:  sectionRef,
    offset: ["start end", "end start"],
  });

  return (
    <section
      ref={sectionRef}
      id="stats"
      aria-label="Asset library overview"
      style={{ minHeight: "120vh" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center py-20">
        <div className="px-6 lg:px-10 max-w-[1152px] mx-auto w-full mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg/30 font-helix-body">
            By the numbers
          </p>
        </div>

        <div className="px-5 lg:px-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 h-[66vh]">
            {COLUMNS.map((col) => (
              <StatColumn
                key={col.id}
                cards={col.cards}
                yRange={col.yRange}
                scrollYProgress={scrollYProgress}
                prefersReduced={!!prefersReduced}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
