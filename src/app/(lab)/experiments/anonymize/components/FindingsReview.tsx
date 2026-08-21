"use client";

import { useState } from "react";
import { Icon } from "@/design-system/components/Icon";
import { CATEGORIES } from "../lib/tiers";
import type { Category, CategoryMeta, Finding, Tier } from "../lib/types";

function groupByCategory(findings: Finding[], metas: CategoryMeta[]) {
  return metas.map((meta) => ({
    meta,
    findings: findings.filter((f) => f.category === meta.key),
  }));
}

/** A single on/off switch, reused at category level (advised) and tier level (can-have's bulk control). */
function Switch({ enabled, onClick, label }: { enabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        enabled ? "bg-teal" : "bg-gray-950/15"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
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
 * Advised tier: one independent switch per category (never a single
 * tier-wide toggle). Every category defaults to off; only the ones a user
 * explicitly flips on get redacted.
 */
function AdvisedSection({
  findings,
  selected,
  onToggleCategory,
}: {
  findings: Finding[];
  selected: Set<Category>;
  onToggleCategory: (category: Category, next: boolean) => void;
}) {
  const groups = groupByCategory(findings, CATEGORIES.filter((c) => c.tier === "advised"));
  const total = findings.length;
  const appliedCount = findings.filter((f) => selected.has(f.category)).length;

  return (
    <section className="bg-white border border-gray-950/[0.07] rounded-2xl p-6">
      <h2 className="font-helix-display text-xl uppercase text-gray-950 mb-1">Advised remove</h2>
      <p className="text-gray-950/55 text-sm mb-5">
        Off by default — switch on each category you want redacted. {total} match{total === 1 ? "" : "es"}{" "}
        found, {appliedCount} selected for redaction.
      </p>
      <ul className="flex flex-col gap-4">
        {groups.map(({ meta, findings: hits }) => {
          const enabled = selected.has(meta.key);
          return (
            <li key={meta.key} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-950">
                  {meta.label}
                  <span className="ml-2 font-normal text-gray-950/40">
                    {hits.length > 0 ? `${hits.length} found` : "none found in this file"}
                  </span>
                </p>
                <p className="text-xs text-gray-950/45">{meta.description}</p>
              </div>
              <Switch
                enabled={enabled}
                onClick={() => onToggleCategory(meta.key, !enabled)}
                label={`Remove ${meta.label.toLowerCase()}`}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Can-have tier: read-only per-category list by default — no per-item
 * controls. The one exception is a single secondary button that removes the
 * whole tier as one group; it's a sibling of the disclosure toggle, not
 * nested inside it, so the two controls don't fight over the same click.
 */
function CanHaveAccordion({
  findings,
  bulkEnabled,
  onToggleBulk,
}: {
  findings: Finding[];
  bulkEnabled: boolean;
  onToggleBulk: (next: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const groups = groupByCategory(findings, CATEGORIES.filter((c) => c.tier === "canhave")).filter(
    (g) => g.findings.length > 0,
  );
  const total = findings.length;

  return (
    <section className="bg-gray-950/[0.02] border border-gray-950/[0.07] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 items-center gap-3 text-left"
          aria-expanded={open}
        >
          <Icon
            name="basic-navigation/ChevronDown"
            size={18}
            className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
          <span className="min-w-0">
            <h2 className="font-helix-display text-xl uppercase text-gray-950">Can have</h2>
            <p className="text-gray-950/55 text-sm mt-1">
              Informational by default — {total} match{total === 1 ? "" : "es"} found,{" "}
              {bulkEnabled ? "all selected for redaction" : "kept as-is"}.
            </p>
          </span>
        </button>
        <button
          type="button"
          aria-pressed={bulkEnabled}
          onClick={() => onToggleBulk(!bulkEnabled)}
          className={`shrink-0 h-10 px-4 rounded-btn text-sm font-medium transition-colors ${
            bulkEnabled
              ? "bg-teal text-white"
              : "bg-transparent border border-gray-950/20 text-gray-950/70 hover:border-gray-950/35"
          }`}
        >
          {bulkEnabled ? "Removing all can-have" : "Remove all can-have"}
        </button>
      </div>
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
  advisedSelected: Set<Category>;
  onToggleAdvisedCategory: (category: Category, next: boolean) => void;
  canHaveBulkEnabled: boolean;
  onToggleCanHaveBulk: (next: boolean) => void;
}

export function FindingsReview({
  findings,
  advisedSelected,
  onToggleAdvisedCategory,
  canHaveBulkEnabled,
  onToggleCanHaveBulk,
}: FindingsReviewProps) {
  const byTier = (tier: Tier) => findings.filter((f) => f.tier === tier);

  return (
    <div className="flex flex-col gap-6">
      <MustRemoveSection findings={byTier("must")} />
      <AdvisedSection
        findings={byTier("advised")}
        selected={advisedSelected}
        onToggleCategory={onToggleAdvisedCategory}
      />
      <CanHaveAccordion
        findings={byTier("canhave")}
        bulkEnabled={canHaveBulkEnabled}
        onToggleBulk={onToggleCanHaveBulk}
      />
    </div>
  );
}
