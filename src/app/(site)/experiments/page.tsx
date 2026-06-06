import Link from "next/link";
import { Nav } from "@/design-system/components/Nav";

export const metadata = { title: "Experiments — BudgetThuis.Design" };

const EXPERIMENTS = [
  {
    slug: "hackathon26",
    label: "One Stop Shop",
    subtitle: "Hackathon 2026",
    description:
      "An IVR priority queue dashboard that lets agents see who's waiting, in what order, and why — built in a single day. Powered by Twilio TaskRouter and enriched with customer value scores.",
    tags: ["Twilio", "Next.js", "Customer Intelligence"],
    status: "live" as const,
    date: "June 2026",
  },
];

export default function ExperimentsPage() {
  return (
    <div className="font-helix-body bg-screen min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="pt-40 pb-16 px-6 max-w-[1152px] mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40 mb-4">
          Experiments
        </p>
        <h1 className="font-helix-display text-6xl md:text-8xl uppercase text-ink leading-none mb-6">
          The Lab
        </h1>
        <p className="text-ink/55 max-w-lg text-lg leading-relaxed">
          Quick builds, proofs-of-concept, and ideas we want to make real. Each
          experiment is a self-contained exploration — some ship, some don't.
        </p>
      </section>

      {/* Grid */}
      <section className="px-6 pb-32 max-w-[1152px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EXPERIMENTS.map((exp) => (
            <Link
              key={exp.slug}
              href={`/experiments/${exp.slug}`}
              className="group relative flex flex-col bg-white border border-ink/[0.07] rounded-2xl p-8 hover:shadow-[0_8px_40px_rgba(36,36,36,0.1)] transition-all duration-300 hover:-translate-y-0.5"
            >
              {/* Status dot */}
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">
                  {exp.date}
                </span>
                {exp.status === "live" && (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                    Live
                  </span>
                )}
              </div>

              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/35 mb-1">
                  {exp.subtitle}
                </p>
                <h2 className="font-helix-display text-3xl uppercase text-ink mb-4 group-hover:text-teal transition-colors">
                  {exp.label}
                </h2>
                <p className="text-ink/55 leading-relaxed text-sm">
                  {exp.description}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {exp.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-ink/[0.05] text-ink/50 text-[11px] font-semibold uppercase tracking-wide"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-ink/30 group-hover:text-teal transition-colors text-xl leading-none">
                  →
                </span>
              </div>
            </Link>
          ))}

          {/* Coming soon placeholder */}
          <div className="flex flex-col bg-ink/[0.02] border border-dashed border-ink/[0.1] rounded-2xl p-8 items-center justify-center gap-3 min-h-[280px]">
            <span className="text-3xl opacity-20">+</span>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/30">
              More coming soon
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
