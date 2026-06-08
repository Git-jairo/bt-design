"use client";

import Link            from "next/link";
import { motion }      from "framer-motion";
import { Eyebrow }     from "@/design-system/components/Eyebrow";
import { Badge }       from "@/design-system/components/Badge";
import { DOCS_VERSION, DOCS_STATUS } from "@/lib/placeholders";

const TILES = [
  { title: "Brand Tokens",  desc: "Color, type, spacing, and shadow primitives.",          href: "/docs/tokens"     },
  { title: "Typography",    desc: "Greet Narrow and Inter scale specs.",                   href: "/docs/typography" },
  { title: "Color System",  desc: "Mint, Teal, Ink, Screen, Gray — and when to use each.", href: "/docs/colors"     },
  { title: "Components",    desc: "Card, Button, Nav, Badge, and more.",                    href: "/docs/components" },
];

const PARTICLES = [
  { top: "8%",  left: "15%", size: 4, duration: 6.3, delay: 1.2 },
  { top: "24%", left: "82%", size: 3, duration: 7.6, delay: 0.3 },
  { top: "62%", left: "28%", size: 2, duration: 5.1, delay: 1.9 },
  { top: "45%", left: "68%", size: 4, duration: 4.8, delay: 0.7 },
  { top: "78%", left: "42%", size: 2, duration: 7.2, delay: 2.1 },
  { top: "15%", left: "75%", size: 3, duration: 5.5, delay: 0.5 },
  { top: "68%", left: "18%", size: 4, duration: 6.9, delay: 1.4 },
  { top: "35%", left: "92%", size: 3, duration: 4.7, delay: 0.8 },
  { top: "52%", left: "35%", size: 2, duration: 7.1, delay: 1.6 },
  { top: "12%", left: "88%", size: 4, duration: 5.4, delay: 0.2 },
  { top: "76%", left: "48%", size: 3, duration: 6.7, delay: 1.8 },
  { top: "28%", left: "62%", size: 2, duration: 4.9, delay: 0.6 },
  { top: "64%", left: "25%", size: 4, duration: 7.3, delay: 1.1 },
  { top: "18%", left: "78%", size: 3, duration: 5.8, delay: 0.4 },
  { top: "92%", left: "55%", size: 2, duration: 6.5, delay: 1.9 },
  { top: "38%", left: "12%", size: 4, duration: 4.6, delay: 0.9 },
  { top: "72%", left: "72%", size: 3, duration: 7.4, delay: 1.3 },
  { top: "22%", left: "38%", size: 2, duration: 5.9, delay: 2.0 },
  { top: "56%", left: "85%", size: 4, duration: 6.2, delay: 0.1 },
  { top: "44%", left: "15%", size: 3, duration: 4.5, delay: 1.7 },
  { top: "80%", left: "68%", size: 2, duration: 7.0, delay: 0.5 },
  { top: "14%", left: "32%", size: 4, duration: 5.6, delay: 1.2 },
  { top: "60%", left: "92%", size: 3, duration: 6.8, delay: 0.7 },
  { top: "86%", left: "50%", size: 2, duration: 4.4, delay: 2.2 },
];

export function DocsBlock() {
  return (
    <section
      id="docs"
      aria-label="HELIX Design System"
      className="relative px-6 py-40 lg:px-10 lg:py-64 overflow-hidden"
    >
      {/* Ambient glow */}
      <motion.div
        className="absolute top-1/2 left-[8%] -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: 640,
          height: 640,
          background: "radial-gradient(circle, rgba(0, 203, 122, 0.26) 0%, transparent 68%)",
          filter: "blur(72px)",
        }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating particles */}
      {PARTICLES.map(({ top, left, size, duration, delay }, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-brand/25 pointer-events-none"
          style={{ top, left, width: size, height: size }}
          animate={{ y: [0, -18, 0], opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
        />
      ))}

      <div className="relative max-w-[1152px] mx-auto">
        <Eyebrow label="Design System" variant="light" />

        <motion.h2
          className="font-helix-display text-4xl lg:text-6xl uppercase text-heading-on-surface-inverted mt-3 mb-20 leading-tight"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          The single source of truth
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main HELIX card */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: -48 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/docs"
              className="group relative flex flex-col justify-between h-full rounded-card-md bg-default p-12 lg:p-16 min-h-[480px] overflow-hidden"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              {/* Card inner glow */}
              <motion.div
                className="absolute -top-32 -left-16 rounded-full pointer-events-none"
                style={{
                  width: 400,
                  height: 400,
                  background: "radial-gradient(circle, rgba(0, 215, 129, 0.19) 0%, transparent 65%)",
                  filter: "blur(56px)",
                }}
                animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative">
                <div className="flex items-center gap-2 mb-12">
                  <Badge variant="brand">v{DOCS_VERSION}</Badge>
                  <Badge variant="neutral">{DOCS_STATUS}</Badge>
                </div>
                <p
                  className="font-helix-display uppercase text-heading-on-surface-default leading-none mb-8"
                  style={{ fontSize: "clamp(4.5rem, 9vw, 8rem)" }}
                >
                  HELIX
                  <br />
                  DS
                </p>
                <p className="text-gray-950/55 text-base leading-relaxed max-w-sm font-helix-body">
                  Brand truth, component specs, and authoring guidelines for all
                  Budget Thuis products.
                </p>
              </div>

              <span className="relative text-sm font-semibold text-gray-950 mt-12 group-hover:underline underline-offset-2">
                Open Documentation →
              </span>
            </Link>
          </motion.div>

          {/* Secondary tiles */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
            {TILES.map(({ title, desc, href }, i) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, x: 48 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
              >
                <Link
                  href={href}
                  className="group flex flex-col gap-2.5 rounded-card-sm bg-white/7 hover:bg-white/13 transition-colors p-7 h-full"
                >
                  <h3 className="font-semibold text-heading-on-surface-inverted text-sm">{title}</h3>
                  <p className="text-gray-0/45 text-sm leading-relaxed font-helix-body flex-1">{desc}</p>
                  <span className="text-xs text-heading-on-surface-inverted-accent mt-2 group-hover:underline underline-offset-2">
                    Explore →
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
