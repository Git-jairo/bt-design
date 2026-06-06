"use client";

import { motion }     from "framer-motion";
import { Eyebrow }    from "@/design-system/components/Eyebrow";
import { AssetCard }  from "@/design-system/patterns/AssetCard";

const ASSETS = [
  {
    title:       "Helix-Slides",
    description: "The Claude Slide Deck Skill",
    href:        "/helix-slides",
    theme:       "brand",
  },
  {
    title:       "Prompt-Optimizer",
    description: "Optimize your prompts for better results in Claude.",
    href:        "/prompt-optimizer",
    theme:       "brand-dim",
  },
  {
    title:       "Images",
    description: "Curated photography aligned to Helix brand guidelines — warm, human, Dutch.",
    href:        "/images",
    theme:       "inverse",
  },
] as const;

export function AssetGrid() {
  return (
    <section id="assets" aria-label="Design assets" className="px-6 py-36 lg:px-10 lg:py-52">
      <div className="max-w-[1152px] mx-auto">
        <Eyebrow label="Claude Skills" />
        <h2 className="font-helix-display text-4xl lg:text-6xl uppercase text-fg mt-3 mb-16 leading-tight">
          The Skill Library
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ASSETS.map((asset, i) => (
            <motion.div
              key={asset.href}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={{
                hidden:  { opacity: 0, y: 36 },
                visible: (i: number) => ({
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                    delay: i * 0.1,
                  },
                }),
              }}
              whileHover={{ scale: 1.02, y: -6 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <AssetCard {...asset} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
