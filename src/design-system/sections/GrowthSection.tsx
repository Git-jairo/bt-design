"use client";

import { useRef }  from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import confetti    from "canvas-confetti";

export function GrowthSection() {
  const cardRef = useRef<HTMLDivElement>(null);
  const rawX    = useMotionValue(0);
  const rawY    = useMotionValue(0);

  const springConfig = { stiffness: 140, damping: 22 };
  const x = useSpring(rawX, springConfig);
  const y = useSpring(rawY, springConfig);

  const rotateY = useTransform(x, [-0.5, 0.5], [-2, 2]);
  const rotateX = useTransform(y, [-0.5, 0.5], [2, -2]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width  - 0.5);
    rawY.set((e.clientY - rect.top)  / rect.height - 0.5);
  }

  function handleMouseLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    confetti({
      particleCount: 220,
      spread: 50,
      origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
      colors: ["#00D780", "#FFD700", "#C0C0C0", "#2F4F4F", "#008080"],
      startVelocity: 60,
      gravity: 1.5,
      scalar: 1.3,
      ticks: 500,
    });
  }

  return (
    <section id="growth" aria-label="Closing statement" className="px-6 py-36 lg:px-10 lg:py-56">
      <div className="max-w-[1152px] mx-auto" style={{ perspective: "1000px" }}>
        <motion.div
          ref={cardRef}
          className="rounded-card-lg bg-inverted px-12 py-20 lg:px-20 lg:py-32 overflow-hidden cursor-pointer select-none"
          initial={{ opacity: 0, y: 64 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          whileTap={{ scale: 0.93, transition: { type: "spring", stiffness: 500, damping: 14 } }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          <p
            className="font-helix-display uppercase text-heading-on-surface-inverted leading-[0.87]"
            style={{ fontSize: "clamp(3rem, 9.5vw, 8.5rem)" }}
          >
            Lets design
            <br />
            Better
            <br />
            Products,
            <br />
            <span className="text-heading-on-surface-inverted-accent">Together.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
