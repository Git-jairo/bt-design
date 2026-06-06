"use client";

import Link         from "next/link";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { useCountUp } from "@/lib/hooks";

/**
 * StatCard — a large-number display card used in the asset stats section.
 *
 * Colour classes are passed explicitly because the stat cards each tell a
 * distinct brand story (mint for icons, teal for illustrations, ink for logos).
 * New cards should use only Helix primitive or semantic token classes.
 */
export interface StatCardConfig {
  value:       number;
  suffix:      string;
  label:       string;
  href:        string;
  bg:          string;  /* e.g. "bg-brand"  */
  numberColor: string;  /* e.g. "text-fg"   */
  labelColor:  string;  /* e.g. "text-fg/55" */
  fontSize:    string;  /* clamp() expression */
  flex:        string;  /* "flex-1" or a fixed height class */
  rotate:      number;  /* subtle tilt in degrees */
}

export function StatCard({
  card,
  prefersReduced,
}: {
  card:           StatCardConfig;
  prefersReduced: boolean;
}) {
  const { count, ref } = useCountUp(card.value);

  return (
    <motion.div
      className={card.flex}
      style={{ rotate: prefersReduced ? 0 : card.rotate }}
      whileHover={prefersReduced ? {} : { scale: 1.04, rotate: 0 }}
      whileTap={prefersReduced   ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
    >
      <Link
        href={card.href}
        className={`${card.bg} rounded-card p-12 py-12 px-8 lg:py-14 lg:px-10 flex flex-col justify-between overflow-hidden h-full w-full block`}
      >
        <p className={`text-[10px] uppercase tracking-[0.14em] font-helix-body ${card.labelColor}`}>
          {card.label}
        </p>
        <span
          className={`font-helix-display leading-none select-none ${card.numberColor}`}
          style={{ fontSize: card.fontSize }}
          aria-label={`${card.value}${card.suffix} ${card.label}`}
        >
          <span ref={ref}>{count}</span>
          {card.suffix}
        </span>
      </Link>
    </motion.div>
  );
}

/**
 * StatColumn — animates a vertical group of StatCards on scroll.
 */
export function StatColumn({
  cards,
  yRange,
  scrollYProgress,
  prefersReduced,
}: {
  cards:           StatCardConfig[];
  yRange:          [number, number];
  scrollYProgress: MotionValue<number>;
  prefersReduced:  boolean;
}) {
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReduced ? [0, 0] : yRange,
  );

  return (
    <motion.div className="flex flex-col gap-6 lg:gap-8 h-full" style={{ y }}>
      {cards.map((card) => (
        <StatCard key={card.label} card={card} prefersReduced={prefersReduced} />
      ))}
    </motion.div>
  );
}
