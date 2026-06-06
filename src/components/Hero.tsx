"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import Link from "next/link";
import { useCountUp } from "@/lib/hooks";
import { METRICS } from "@/lib/placeholders";
import { FigmaCursors } from "@/components/FigmaCursors";

const HEADLINE = [
  { text: "BUDGET", color: "text-ink" },
  { text: "THUIS.", color: "text-ink" },
  { text: "Design", color: "text-mint" },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const prefersReduced = useReducedMotion();
  const cardY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReduced ? [0, 0] : [0, -80]
  );

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label="Hero"
      className="relative min-h-screen flex items-center px-6 py-44 lg:px-10 lg:py-56 overflow-hidden"
    >
      <motion.div style={{ y: cardY }} className="w-full max-w-[1152px] mx-auto">
        <motion.div
          className="relative w-full bg-white rounded-[40px] p-12 lg:p-20 xl:p-24 overflow-hidden"
          style={{ boxShadow: "var(--shadow-card)" }}
          initial={{ opacity: 0, y: 56 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
        >
          <FigmaCursors />
          <motion.p
            className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40 mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            Budget Thuis — Design Team
          </motion.p>

          <h1
            className="font-helix-display uppercase leading-[0.88] tracking-tight mb-14"
            style={{ fontSize: "clamp(3.5rem, 11vw, 9.5rem)" }}
            aria-label="Budget Thuis Design"
          >
            {HEADLINE.map(({ text, color }, i) => (
              <span key={text} className="block overflow-hidden">
                <motion.span
                  className={`block ${color}`}
                  initial={{ y: "108%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.9,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.18 + i * 0.11,
                  }}
                >
                  {text}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.68 }}
          >
            <Link
              href="/helix-slides"
              className="relative h-12 px-9 rounded-full bg-mint text-ink font-semibold text-sm flex items-center gap-2 hover:bg-teal hover:text-ink transition-colors"
            >
              <span className="absolute -top-2 -left-6 rotate-[-15deg] rounded-full bg-beta text-ink text-[12px] font-black px-2 py-1 leading-none shadow-md select-none z-10">NOW IN BETA!</span>
              Helix-Slides
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/case-studies"
              className="h-12 px-9 rounded-full border border-ink/12 text-ink/70 font-semibold text-sm flex items-center hover:border-ink/30 hover:text-ink transition-colors"
            >
              Case Studies
            </Link>
          </motion.div>

        </motion.div>
      </motion.div>
    </section>
  );
}

function Metric({
  value,
  label,
  suffix = "",
}: {
  value: number;
  label: string;
  suffix?: string;
}) {
  const { count, ref } = useCountUp(value);
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="font-helix-display text-3xl uppercase text-ink"
        aria-label={`${value}${suffix} ${label}`}
      >
        <span ref={ref}>{count}</span>
        {suffix}
      </span>
      <span className="text-xs text-ink/40 uppercase tracking-[0.1em] font-helix-body">
        {label}
      </span>
    </div>
  );
}
