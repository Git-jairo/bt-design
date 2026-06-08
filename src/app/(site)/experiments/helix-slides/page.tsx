import { Nav } from "@/design-system/components/Nav";

export const metadata = { title: "Presentations — BudgetThuis.Design" };

const ENTRIES = [
  {
    version: "v0.1",
    date: "April 2026",
    title: "First slide",
    description:
      "The very first deck output from the Helix slides tool. Basic title + content layout, Budget Thuis brand colours, and the wordmark in the corner. Proof that the generation pipeline worked end-to-end.",
    highlights: ["Brand token integration", "Title + content template", "Auto-generated from a prompt"],
    preview: "bg-teal",
  },
  {
    version: "v0.3",
    date: "May 2026",
    title: "Layouts & structure",
    description:
      "Expanded to multi-slide decks with section dividers, two-column layouts, and a proper agenda slide. First time the tool could produce a coherent narrative arc across multiple slides.",
    highlights: ["Multi-slide support", "Two-column layout", "Agenda & divider slides"],
    preview: "bg-gray-950",
  },
  {
    version: "v0.5",
    date: "May 2026",
    title: "Data & charts",
    description:
      "Added a stat-card component and inline bar/line chart support built entirely in HTML + Tailwind. No chart library dependencies — everything renders in a single self-contained HTML file.",
    highlights: ["Stat cards", "Inline bar charts", "Zero dependencies"],
    preview: "bg-mint-500",
  },
  {
    version: "v0.8",
    date: "June 2026",
    title: "Animation & polish",
    description:
      "Slide-in animations, a consistent type scale derived from the Helix Design System, and the first iteration of the cover slide with the large uppercase display treatment.",
    highlights: ["CSS slide-in animations", "Helix type scale", "Cover slide redesign"],
    preview: "bg-[#f5f0e8]",
  },
];

export default function PresentationsPage() {
  return (
    <div className="font-helix-body bg-screen min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="pt-40 pb-16 px-6 max-w-[1152px] mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-950/40 mb-4">
          Presentations
        </p>
        <h1 className="font-helix-display text-6xl md:text-8xl uppercase text-gray-950 leading-none mb-6">
          The Slide<br />Chronicle
        </h1>
        <p className="text-gray-950/55 max-w-lg text-lg leading-relaxed">
          A running log of what the Helix slides tool can produce — from the very first generated deck to the latest. Each entry is a snapshot of the tool at a point in time.
        </p>
      </section>

      {/* Timeline */}
      <section className="px-6 pb-32 max-w-[1152px] mx-auto">
        <div className="relative">
          {/* Vertical rule */}
          <div className="absolute left-[84px] top-0 bottom-0 w-px bg-gray-950/[0.08]" />

          <div className="flex flex-col gap-16">
            {ENTRIES.map((entry, i) => (
              <article key={i} className="flex gap-8">
                {/* Date column */}
                <div className="w-[84px] shrink-0 flex flex-col items-end pt-1 pr-8 relative">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-950/35 whitespace-nowrap">
                    {entry.date}
                  </span>
                  {/* Dot on the rule */}
                  <div className="absolute right-0 top-[6px] translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-gray-950/20" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Slide preview thumbnail */}
                  <div
                    className={`w-full aspect-[16/9] rounded-xl mb-5 flex items-end p-6 overflow-hidden relative ${entry.preview}`}
                  >
                    {/* Decorative slide chrome */}
                    <div className="absolute inset-x-6 top-5 h-px bg-white/20" />
                    <div className="absolute top-5 left-6 flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white/20" />
                      <span className="w-2 h-2 rounded-full bg-white/20" />
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-helix-display text-4xl md:text-5xl uppercase text-white/10 whitespace-nowrap select-none">
                      {entry.title}
                    </div>
                    <span className="relative z-10 text-[11px] font-bold uppercase tracking-widest text-white/50">
                      {entry.version}
                    </span>
                  </div>

                  {/* Meta */}
                  <h2 className="font-helix-display text-2xl uppercase text-gray-950 mb-2">
                    {entry.title}
                  </h2>
                  <p className="text-gray-950/55 leading-relaxed text-sm mb-4">
                    {entry.description}
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {entry.highlights.map((h) => (
                      <li
                        key={h}
                        className="px-2.5 py-1 rounded-full bg-gray-950/[0.05] text-gray-950/50 text-[11px] font-semibold uppercase tracking-wide"
                      >
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}

            {/* Open end */}
            <div className="flex gap-8">
              <div className="w-[84px] shrink-0 flex justify-end pr-8 relative">
                <div className="absolute right-0 top-1 translate-x-1/2 w-2.5 h-2.5 rounded-full bg-teal border-2 border-teal animate-pulse" />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">
                  In progress
                </p>
                <p className="text-gray-950/40 text-sm mt-1">
                  The tool keeps evolving. New capabilities ship regularly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
