"use client";

import { motion } from "framer-motion";

export function GrowthSection() {
  return (
    <section id="growth" aria-label="Closing statement" className="px-6 py-36 lg:px-10 lg:py-56">
      <div className="max-w-[1152px] mx-auto">
        <motion.div
          className="rounded-[40px] bg-ink px-12 py-20 lg:px-20 lg:py-32 overflow-hidden"
          initial={{ opacity: 0, y: 64 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            className="font-helix-display uppercase text-screen leading-[0.87]"
            style={{ fontSize: "clamp(3rem, 9.5vw, 8.5rem)" }}
          >
            Lets design
            <br />
            Better
            <br />
            Products,
            <br />
            <span className="text-mint">Together.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
