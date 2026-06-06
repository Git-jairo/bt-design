"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { useCountUp } from "@/lib/hooks";
import { METRICS } from "@/lib/placeholders";

// Col A drifts down hard, Col B rockets up, Col C barely moves — cards breathe apart dramatically
const COLUMNS = [
  {
    id: "col-a",
    yRange: [-200, 120] as [number, number],
    cards: [
      {
        value: METRICS.iconCount,
        suffix: "+",
        label: "Icons",
        href: "#icons",
        bg: "bg-mint",
        numberColor: "text-ink",
        labelColor: "text-ink/55",
        fontSize: "clamp(5rem, 11vw, 14rem)",
        flex: "flex-1",
        rotate: -2.5,
      },
    ],
  },
  {
    id: "col-b",
    yRange: [160, -160] as [number, number],
    cards: [
      {
        value: METRICS.imageCount,
        suffix: "+",
        label: "Images",
        href: "#images",
        bg: "bg-helix-gray",
        numberColor: "text-ink",
        labelColor: "text-ink/50",
        fontSize: "clamp(3.5rem, 10vw, 9rem)",
        flex: "h-62",
        rotate: 2,
      },
      {
        value: METRICS.illustrationCount,
        suffix: "+",
        label: "Illustrations",
        href: "#illustrations",
        bg: "bg-teal",
        numberColor: "text-white",
        labelColor: "text-white/55",
        fontSize: "clamp(4rem, 12vw, 10rem)",
        flex: "flex-1",
        rotate: -1.5,
      },
    ],
  },
  {
    id: "col-c",
    yRange: [-80, 80] as [number, number],
    cards: [
      {
        value: METRICS.logoCount,
        suffix: "",
        label: "Logo's",
        href: "#logos",
        bg: "bg-ink",
        numberColor: "text-mint",
        labelColor: "text-screen/45",
        fontSize: "clamp(6rem, 18vw, 16rem)",
        flex: "flex-1",
        rotate: 3,
      },
    ],
  },
];

interface CardConfig {
  value: number;
  suffix: string;
  label: string;
  href: string;
  bg: string;
  numberColor: string;
  labelColor: string;
  fontSize: string;
  flex: string;
  rotate: number;
}

export function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  return (
    <section
      ref={sectionRef}
      id="stats"
      aria-label="Asset library overview"
      style={{ minHeight: "200vh" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center py-20">
        <div className="px-6 lg:px-10 max-w-[1152px] mx-auto w-full mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/30 font-helix-body">
            By the numbers
          </p>
        </div>

        <div className="px-5 lg:px-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 h-[66vh]">
            {COLUMNS.map((col) => (
              <Column
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

function Column({
  cards,
  yRange,
  scrollYProgress,
  prefersReduced,
}: {
  cards: CardConfig[];
  yRange: [number, number];
  scrollYProgress: MotionValue<number>;
  prefersReduced: boolean;
}) {
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReduced ? [0, 0] : yRange
  );

  return (
    <motion.div className="flex flex-col gap-6 lg:gap-8 h-full" style={{ y }}>
      {cards.map((card) => (
        <StatCard key={card.label} card={card} prefersReduced={prefersReduced} />
      ))}
    </motion.div>
  );
}

function StatCard({
  card,
  prefersReduced,
}: {
  card: CardConfig;
  prefersReduced: boolean;
}) {
  const { count, ref } = useCountUp(card.value);

  return (
    <motion.div
      className={card.flex}
      style={{ rotate: prefersReduced ? 0 : card.rotate }}
      whileHover={prefersReduced ? {} : { scale: 1.04, rotate: 0 }}
      whileTap={prefersReduced ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
    >
      <Link
        href={card.href}
        className={`${card.bg} rounded-[28px] py-12 px-8 lg:py-14 lg:px-10 flex flex-col justify-between overflow-hidden h-full w-full block`}
      >
        <p
          className={`text-[10px] uppercase tracking-[0.14em] font-helix-body ${card.labelColor}`}
        >
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
