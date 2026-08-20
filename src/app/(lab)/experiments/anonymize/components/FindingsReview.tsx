"use client";

import { useState } from "react";
import { Icon } from "@/design-system/components/Icon";
import { CATEGORIES } from "../lib/tiers";
import type { CategoryMeta, Finding, Tier } from "../lib/types";

function groupByCategory(findings: Finding[], metas: CategoryMeta[]) {
  return metas.map((meta) => ({
    meta,
    findings: findings.filter((f) => f.category === meta.key),
  }));
}

/**
 * Must-remove tier: rendered as checked, disabled checkboxes. It's a
 * statement of policy ("this is always redacted"), not a per-file choice —
 * so every category shows even when this file has zero matches for it.
 */
function MustRemoveSection({ findings }: { findings: Finding[] }) {
  const groups = groupByCategory(findings, CATEGORIES.filter((c) => c.tier === "must"));
  const total = findings.length;

  return (
    <section className="bg-white border border-gray-950/[0.07] rounded-2xl p-6">
      <header className="flex items-center gap-2 mb-1">
        <Icon name="shield/Locked" size={18} />
        <h2 className="font-helix-display text-xl uppercase text-gray-950">Must remove</h2>
      </header>
      <p className="text-gray-950/55 text-sm mb-5">
        Always redacted. This tier can&apos;t be disabled — {total} match{total === 1 ? "" : "es"} found.
      </p>
      <ul className="flex flex-col gap-3">
        {groups.map(({ meta, findings: hits }) => (
          <li key={meta.key} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] bg-gray-950 text-white"
            >
              <Icon name="indicator/CheckMark" size={12} className="invert" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-950">
                {meta.label}
                <span className="ml-2 font-normal text-gray-950/40">
                  {hits.length > 0 ? `${hits.length} found` : "none found in this file"}
                </span>
              </p>
              <p className="text-xs text-gray-950/45">{meta.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Advised tier: one grouped toggle for the whole tier (never per-item
 * checkboxes). The list below is informational and reflects what's found,
 * dimmed when the toggle is off to show it won't be touched.
 */
function AdvisedSection({
  findings,
  enabled,
  onToggle,
}: {
  findings: Finding[];
  enabled: boolean;
  onToggle: (next: boolean) => void;
}) {
  const groups = groupByCategory(findings, CATEGORIES.filter((c) => c.tier === "advised"));
  const total = findings.length;

  return (
    <section className="bg-white border border-gray-950/[0.07] rounded-2xl p-6">
      <div className="flex items-center justify-between gap-4 mb-1">
        <h2 className="font-helix-display text-xl uppercase text-gray-950">Advised remove</h2>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
            enabled ? "bg-teal" : "bg-gray-950/15"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      <p className="text-gray-950/55 text-sm mb-5">
        Off by default. One switch for the whole tier — {total} match{total === 1 ? "" : "es"} found,{" "}
        {enabled ? "will be redacted" : "will be kept"}.
      </p>
      <ul className={`flex flex-col gap-3 transition-opacity ${enabled ? "opacity-100" : "opacity-40"}`}>
        {groups.map(({ meta, findings: hits }) => (
          <li key={meta.key} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${enabled ? "bg-teal" : "bg-gray-950/30"}`}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-950">
                {meta.label}
                <span className="ml-2 font-normal text-gray-950/40">
                  {hits.length > 0 ? `${hits.length} found` : "none found in this file"}
                </span>
              </p>
              <p className="text-xs text-gray-950/45">{meta.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Can-have tier: read-only accordion, zero interactive controls beyond the disclosure itself. */
function CanHaveAccordion({ findings }: { findings: Finding[] }) {
  const [open, setOpen] = useState(false);
  const groups = groupByCategory(findings, CATEGORIES.filter((c) => c.tier === "canhave")).filter(
    (g) => g.findings.length > 0,
  );

  return (
    <section className="bg-gray-950/[0.02] border border-gray-950/[0.07] rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <div>
          <h2 className="font-helix-display text-xl uppercase text-gray-950">Can have</h2>
          <p className="text-gray-950/55 text-sm mt-1">
            Informational only — lower-risk context, never removed.
          </p>
        </div>
        <Icon
          name="basic-navigation/ChevronDown"
          size={20}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-6 flex flex-col gap-4 border-t border-gray-950/[0.07] pt-5">
          {groups.length === 0 && (
            <p className="text-sm text-gray-950/45">Nothing in this tier was detected in this file.</p>
          )}
          {groups.map(({ meta, findings: hits }) => (
            <div key={meta.key}>
              <p className="text-sm font-semibold text-gray-950">
                {meta.label} <span className="font-normal text-gray-950/40">{hits.length} found</span>
              </p>
              <p className="text-xs text-gray-950/45 mb-2">{meta.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {hits.slice(0, 8).map((f) => (
                  <span
                    key={f.id}
                    className="px-2 py-0.5 rounded-full bg-white border border-gray-950/10 text-[11px] text-gray-950/60"
                  >
                    {f.value.length > 24 ? `${f.value.slice(0, 24)}…` : f.value}
                  </span>
                ))}
                {hits.length > 8 && (
                  <span className="px-2 py-0.5 text-[11px] text-gray-950/40">+{hits.length - 8} more</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

interface FindingsReviewProps {
  findings: Finding[];
  advisedEnabled: boolean;
  onToggleAdvised: (next: boolean) => void;
}

export function FindingsReview({ findings, advisedEnabled, onToggleAdvised }: FindingsReviewProps) {
  const byTier = (tier: Tier) => findings.filter((f) => f.tier === tier);

  return (
    <div className="flex flex-col gap-6">
      <MustRemoveSection findings={byTier("must")} />
      <AdvisedSection findings={byTier("advised")} enabled={advisedEnabled} onToggle={onToggleAdvised} />
      <CanHaveAccordion findings={byTier("canhave")} />
    </div>
  );
}
