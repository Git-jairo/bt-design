"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ASSETS = [
  {
    title: "Helix-Slides",
    description:
      "The Claude Slide Deck Skill",
    href: "/helix-slides",
    bg: "bg-mint",
    text: "text-ink",
    dimText: "text-ink/60",
    iconBg: "bg-ink/10"
  },
  {
    title: "Prompt-Optimizer",
    description:
      "Optimize your prompts for better results in claude.",
    href: "/prompt-optimizer",
    bg: "bg-teal",
    text: "text-white",
    dimText: "text-white/60",
    iconBg: "bg-white/15"
  },
  {
    title: "Images",
    description:
      "Curated photography aligned to Helix brand guidelines — warm, human, Dutch.",
    href: "/images",
    bg: "bg-ink",
    text: "text-screen",
    dimText: "text-screen/50",
    iconBg: "bg-screen/10"
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      delay: i * 0.1,
    },
  }),
};

export function AssetGrid() {
  return (
    <section id="assets" aria-label="Design assets" className="px-6 py-36 lg:px-10 lg:py-52">
      <div className="max-w-[1152px] mx-auto">
        <Eyebrow label="Claude Skills" />
        <h2 className="font-helix-display text-4xl lg:text-6xl uppercase text-ink mt-3 mb-16 leading-tight">
          The Skill Library
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ASSETS.map(
            ({ title, description, href, bg, text, dimText, iconBg }, i) => (
              <motion.div
                key={href}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={cardVariants}
                whileHover={{ scale: 1.02, y: -6 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <Link
                  href={href}
                  className={`group flex flex-col rounded-[36px] p-10 lg:p-12 h-full min-h-72 ${bg} ${text}`}
                >
                  <div className={`w-10 h-10 rounded-xl mb-10 ${iconBg}`} />
                  <h3 className="font-helix-display text-3xl uppercase leading-tight mb-4">
                    {title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${dimText} mb-10 flex-1`}>
                    {description}
                  </p>
                  <span className="text-sm font-semibold group-hover:underline underline-offset-2 mt-auto">
                    About {title} →
                  </span>
                </Link>
              </motion.div>
            )
          )}
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ label, light = false }: { label: string; light?: boolean }) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-[0.14em] ${
        light ? "text-screen/40" : "text-ink/40"
      }`}
    >
      {label}
    </p>
  );
}
