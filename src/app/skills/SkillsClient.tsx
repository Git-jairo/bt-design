"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Nav } from "@/components/Nav";
import { SKILLS, ALL_ROLES, ALL_EXPERTISE, type Skill } from "@/data/skills";

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-colors whitespace-nowrap ${
        active
          ? "bg-ink text-white"
          : "bg-ink/[0.05] text-ink/50 hover:bg-ink/10 hover:text-ink/70"
      }`}
    >
      {label}
    </button>
  );
}

function SkillCard({
  skill,
  onClick,
  active,
}: {
  skill: Skill;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group text-left flex flex-col bg-white border rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 w-full ${
        active
          ? "border-ink/30 shadow-[0_8px_40px_rgba(36,36,36,0.12)]"
          : "border-ink/[0.07] hover:shadow-[0_8px_40px_rgba(36,36,36,0.08)]"
      }`}
    >
      <div className="flex-1">
        <h2 className="font-helix-display text-xl uppercase text-ink mb-2 group-hover:text-teal transition-colors">
          {skill.title}
        </h2>
        <p className="text-ink/55 text-sm leading-relaxed line-clamp-3">
          {skill.description}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {skill.roles.slice(0, 2).map((r) => (
          <span
            key={r}
            className="px-2 py-0.5 rounded-full bg-ink/[0.05] text-ink/50 text-[10px] font-semibold uppercase tracking-wide"
          >
            {r}
          </span>
        ))}
        {skill.expertise.slice(0, 2).map((e) => (
          <span
            key={e}
            className="px-2 py-0.5 rounded-full bg-teal/10 text-teal text-[10px] font-semibold uppercase tracking-wide"
          >
            {e}
          </span>
        ))}
      </div>
    </button>
  );
}

export function SkillsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeSlug = searchParams.get("skill");
  const activeSkill = SKILLS.find((s) => s.slug === activeSlug) ?? null;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [expertiseFilter, setExpertiseFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const panelRef = useRef<HTMLDivElement>(null);

  const openSkill = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("skill", slug);
    router.push(`/skills?${params.toString()}`, { scroll: false });
  };

  const closeSkill = () => {
    router.push("/skills", { scroll: false });
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSkill();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return SKILLS.filter((s) => {
      const matchSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.roles.some((r) => r.toLowerCase().includes(q)) ||
        s.expertise.some((e) => e.toLowerCase().includes(q));
      const matchRole = !roleFilter || s.roles.includes(roleFilter);
      const matchExpertise = !expertiseFilter || s.expertise.includes(expertiseFilter);
      return matchSearch && matchRole && matchExpertise;
    });
  }, [search, roleFilter, expertiseFilter]);

  return (
    <div className="font-helix-body bg-screen min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="pt-40 pb-12 px-6 max-w-[1152px] mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40 mb-4">
          Skills
        </p>
        <h1 className="font-helix-display text-6xl md:text-8xl uppercase text-ink leading-none mb-6">
          The Library
        </h1>
        <p className="text-ink/55 max-w-lg text-lg leading-relaxed">
          Tools, templates and guides built for everyone at Budget Thuis. Find what's relevant to your role and get started.
        </p>
      </section>

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-30 bg-screen/90 backdrop-blur-md border-b border-ink/[0.06] px-6 py-5">
        <div className="max-w-[1152px] mx-auto flex flex-col gap-4">
          {/* Search + toggle */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2.5 bg-white border border-ink/[0.09] rounded-xl px-4 py-2.5 max-w-sm flex-1">
              <svg className="w-4 h-4 text-ink/35 shrink-0" viewBox="0 0 16 16" fill="none">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search skills…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-sm text-ink placeholder:text-ink/35 bg-transparent outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-ink/30 hover:text-ink/60 transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters((v) => !v)}
              aria-label={showFilters ? "Hide filters" : "Show filters"}
              className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors shrink-0 ${
                showFilters
                  ? "bg-ink text-white border-ink"
                  : "bg-white border-ink/[0.09] text-ink/40 hover:text-ink/70 hover:border-ink/20"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Filter rows */}
          {showFilters && (
            <div className="flex flex-col gap-3">
              {/* Role row */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-ink/30">Role</span>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((r) => (
                    <FilterChip
                      key={r}
                      label={r}
                      active={roleFilter === r}
                      onClick={() => setRoleFilter(roleFilter === r ? null : r)}
                    />
                  ))}
                </div>
              </div>

              {/* Expertise row */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-ink/30">Expertise</span>
                <div className="flex flex-wrap gap-2">
                  {ALL_EXPERTISE.map((e) => (
                    <FilterChip
                      key={e}
                      label={e}
                      active={expertiseFilter === e}
                      onClick={() => setExpertiseFilter(expertiseFilter === e ? null : e)}
                    />
                  ))}
                  {(roleFilter || expertiseFilter || search) && (
                    <>
                      <span className="w-px h-6 bg-ink/10 mx-0.5 self-center" />
                      <button
                        onClick={() => { setRoleFilter(null); setExpertiseFilter(null); setSearch(""); }}
                        className="text-[11px] font-semibold text-ink/40 hover:text-ink/70 transition-colors uppercase tracking-wide self-center"
                      >
                        Clear all
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <section className="px-6 py-10 pb-32 max-w-[1152px] mx-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-ink/30 text-sm font-semibold uppercase tracking-wider">No skills found</p>
            <button
              onClick={() => { setRoleFilter(null); setExpertiseFilter(null); setSearch(""); }}
              className="text-sm text-teal hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink/30 mb-6">
              {filtered.length} skill{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((skill) => (
                <SkillCard
                  key={skill.slug}
                  skill={skill}
                  active={skill.slug === activeSlug}
                  onClick={() => openSkill(skill.slug)}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Side panel */}
      <AnimatePresence>
        {activeSkill && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-ink/25 z-40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeSkill}
              aria-hidden
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal
              aria-label={activeSkill.title}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[512px] bg-white z-50 flex flex-col shadow-[−8px_0_40px_rgba(36,36,36,0.12)]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300, mass: 0.8 }}
            >
              {/* Sticky header with close */}
              <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-8 py-4
               border-b border-ink/[0.07]">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/35">
                  Skill
                </p>
                <button
                  onClick={closeSkill}
                  aria-label="Close panel"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-ink/[0.05] hover:bg-ink/10 transition-colors text-ink/50 hover:text-ink"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">
                {/* Feature graphic */}
                {activeSkill.featureGraphic && (
                  <div className="relative w-full aspect-[16/9] bg-ink/[0.04]">
                    <Image
                      src={activeSkill.featureGraphic}
                      alt={activeSkill.title}
                      fill
                      className="object-cover"
                      sizes="512px"
                      priority
                    />
                  </div>
                )}

                <div className="px-8 pt-7 pb-10">
                  {/* Role + expertise tags */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {activeSkill.roles.map((r) => (
                      <span key={r} className="px-2.5 py-1 rounded-full bg-ink/[0.05] text-ink/50 text-[10px] font-semibold uppercase tracking-wide">
                        {r}
                      </span>
                    ))}
                    {activeSkill.expertise.map((e) => (
                      <span key={e} className="px-2.5 py-1 rounded-full bg-teal/10 text-teal text-[10px] font-semibold uppercase tracking-wide">
                        {e}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h2 className="font-helix-display text-4xl uppercase text-ink leading-none mb-4">
                    {activeSkill.title}
                  </h2>

                  {/* Description */}
                  <div className="text-ink/60 text-sm leading-relaxed space-y-4">
                    {activeSkill.longDescription.split("\n\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sticky footer — download */}
              <div className="sticky bottom-0 bg-white border-t border-ink/[0.07] px-8 py-5">
                {activeSkill.downloadUrl ? (
                  <a
                    href={activeSkill.downloadUrl}
                    download
                    className="flex items-center justify-center gap-2.5 w-full h-12 rounded-xl bg-ink text-white text-sm font-semibold hover:bg-ink/80 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Download
                  </a>
                ) : (
                  <button
                    disabled
                    className="flex items-center justify-center gap-2.5 w-full h-12 rounded-xl bg-ink/10 text-ink/30 text-sm font-semibold cursor-not-allowed"
                  >
                    No download available
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
