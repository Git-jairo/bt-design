"use client";

import Link         from "next/link";
import { motion }   from "framer-motion";
import { Eyebrow }  from "@/design-system/components/Eyebrow";
import { useCountUp } from "@/lib/hooks";
import { METRICS }    from "@/lib/placeholders";

const COMING_SOON = [
  { title: "Self-Service Portal", tag: "In Progress" },
  { title: "Onboarding Flow",     tag: "Coming Soon" },
];

export function CaseStudies() {
  const { count: csCount, ref: csRef } = useCountUp(METRICS.caseStudyCount);

  return (
    <section
      id="case-studies"
      aria-label="Case Studies"
      className="px-6 py-36 lg:px-10 lg:py-52"
    >
      <div className="max-w-[1152px] mx-auto">
        <Eyebrow label="Case Studies" />

        <div className="flex items-end justify-between mt-3 mb-16 gap-4">
          <h2 className="font-helix-display text-4xl lg:text-6xl uppercase text-fg leading-tight">
            Our Work
          </h2>
          <div className="hidden md:flex items-center gap-8 pb-1 shrink-0">
            <Link href="/case-studies" className="text-sm font-semibold text-fg/40 hover:text-fg transition-colors">
              Browse catalogue →
            </Link>
            <p className="text-sm text-fg/40 font-helix-body">
              <span ref={csRef} className="font-semibold text-fg">{csCount}</span>{" "}published
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feature card */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/hackathon26"
              className="group flex flex-col justify-between h-full rounded-card-md bg-brand-dim p-12 lg:p-14 text-white min-h-[420px]"
            >
              <div>
                <span className="text-xs uppercase tracking-[0.1em] text-white/45 block mb-10">
                  Hackathon 2026
                </span>
                <h3 className="font-helix-display text-4xl lg:text-5xl uppercase text-white leading-tight mb-6">
                  Priority Queue
                  <br />
                  Dashboard
                </h3>
                <p className="text-white/65 leading-relaxed max-w-sm font-helix-body">
                  IVR-driven agent dashboard that prioritises callers by customer
                  value in real time — built in a single day.
                </p>
              </div>
              <span className="text-sm font-semibold mt-12 group-hover:underline underline-offset-2">
                View case study →
              </span>
            </Link>
          </motion.div>

          {/* Coming-soon tiles */}
          <div className="flex flex-col gap-6">
            {COMING_SOON.map(({ title, tag }, i) => (
              <motion.div
                key={title}
                className="flex-1"
                initial={{ opacity: 0, x: 32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
              >
                <div className="flex flex-col justify-between h-full rounded-card bg-raised p-10 min-h-[190px]">
                  <span className="text-xs uppercase tracking-[0.1em] text-fg/40 font-helix-body">
                    {tag}
                  </span>
                  <h3 className="font-helix-display text-2xl uppercase text-fg leading-tight">
                    {title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
