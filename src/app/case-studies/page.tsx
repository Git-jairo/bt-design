import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/Nav";

export const metadata = { title: "Case Studies — BudgetThuis.Design" };

const CASE_STUDIES = [
  {
    slug: "/experiments/helix-slides",
    label: "Helix Slides",
    subtitle: "Automatic Slide Builder",
    description:
      "The setup of a skill that fully automatically builds slides based on the input provided.",
    tags: ["AI", "Automation", "Slides"],
    year: "2026",
    image: "/images/cover-helix-slides.webp",
    imageAlt: "Helix Slides screenshot",
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="font-helix-body bg-screen min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="pt-40 pb-16 px-6 max-w-[1152px] mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40 mb-4">
          Cases
        </p>
        <h1 className="font-helix-display text-6xl md:text-8xl uppercase text-ink leading-none mb-6">
          The Work
        </h1>
        <p className="text-ink/55 max-w-lg text-lg leading-relaxed">
          Real problems, real solutions. Each case study documents what we built,
          why we built it, and what we learned.
        </p>
      </section>

      {/* List */}
      <section className="px-6 pb-32 max-w-[1152px] mx-auto flex flex-col gap-6">
        {CASE_STUDIES.map((cs) => (
          <div key={cs.slug} className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Info card */}
            <Link
              href={cs.slug}
              className="group flex flex-col bg-white border border-ink/[0.07] rounded-2xl p-8 hover:shadow-[0_8px_40px_rgba(36,36,36,0.1)] transition-all duration-300 hover:-translate-y-0.5 min-h-[320px]"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">
                  {cs.year}
                </span>
              </div>

              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/35 mb-1">
                  {cs.subtitle}
                </p>
                <h2 className="font-helix-display text-3xl uppercase text-ink mb-4 group-hover:text-teal transition-colors">
                  {cs.label}
                </h2>
                <p className="text-ink/55 leading-relaxed text-sm">
                  {cs.description}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {cs.tags.map((tag) => (
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

            {/* Photo card */}
            <div className="relative rounded-2xl overflow-hidden bg-ink/[0.04] border border-ink/[0.07] min-h-[320px]">
              <Image
                src={cs.image}
                alt={cs.imageAlt}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

          </div>
        ))}

        {/* Coming soon placeholder */}
        <div className="flex flex-col bg-ink/[0.02] border border-dashed border-ink/[0.1] rounded-2xl p-8 items-center justify-center gap-3 min-h-[160px]">
          <span className="text-3xl opacity-20">+</span>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/30">
            More case studies being documented
          </p>
        </div>
      </section>
    </div>
  );
}
