import { detectAll } from "./detectors";
import { parseCsv } from "./parsers/csv";
import { parseDocx } from "./parsers/docx";
import { parseText } from "./parsers/text";
import { parseXlsx } from "./parsers/xlsx";
import { CATEGORIES, CATEGORY_META, tokenFor } from "./tiers";
import type { Category, Finding, ParsedFile } from "./types";

export type SupportedFormat = "csv" | "xlsx" | "docx" | "txt" | "md";

/** Everything happens here, in the browser. No file content or metadata is sent anywhere. */
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB — keeps regex scans snappy on the main thread.

const EXTENSION_TO_FORMAT: Record<string, SupportedFormat> = {
  csv: "csv",
  xlsx: "xlsx",
  docx: "docx",
  txt: "txt",
  md: "md",
  markdown: "md",
};

export function detectFormat(file: File): SupportedFormat | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TO_FORMAT[ext] ?? null;
}

export async function parseFile(file: File, format: SupportedFormat): Promise<ParsedFile> {
  switch (format) {
    case "csv":
      return parseCsv(file);
    case "xlsx":
      return parseXlsx(file);
    case "docx":
      return parseDocx(file);
    case "txt":
    case "md":
      return parseText(file);
  }
}

function buildSnippet(text: string, start: number, end: number, radius = 28): string {
  const before = text.slice(Math.max(0, start - radius), start);
  const after = text.slice(end, Math.min(text.length, end + radius));
  const value = text.slice(start, end).replace(/\s+/g, " ").trim();
  const prefix = start > radius ? "…" : "";
  const suffix = end + radius < text.length ? "…" : "";
  return `${prefix}${before.replace(/\s+/g, " ")}${value}${after.replace(/\s+/g, " ")}${suffix}`;
}

/** Scan every segment of a parsed file and return every finding, in reading order. */
export function analyze(parsed: ParsedFile): Finding[] {
  const findings: Finding[] = [];
  for (const segment of parsed.segments) {
    // A column header (e.g. "BSN") already tells us what this whole cell is —
    // stronger than any in-value pattern, so it replaces regex detection
    // for this segment rather than running alongside it.
    if (segment.forceCategory) {
      const category = segment.forceCategory;
      findings.push({
        id: `${segment.id}::column`,
        segmentId: segment.id,
        category,
        tier: CATEGORY_META[category].tier,
        value: segment.text,
        start: 0,
        end: segment.text.length,
        snippet: segment.text.length > 60 ? `${segment.text.slice(0, 60)}…` : segment.text,
      });
      continue;
    }
    for (const match of detectAll(segment.text)) {
      findings.push({
        id: `${segment.id}::${match.start}-${match.end}`,
        segmentId: segment.id,
        category: match.category,
        tier: match.tier,
        value: match.value,
        start: match.start,
        end: match.end,
        snippet: buildSnippet(segment.text, match.start, match.end),
      });
    }
  }
  return findings;
}

/** Must-remove categories are always on; advised categories follow the shared toggle; can-have is never redacted. */
export function activeCategories(advisedEnabled: boolean): Set<Category> {
  return new Set(
    CATEGORIES.filter((c) => c.tier === "must" || (c.tier === "advised" && advisedEnabled)).map((c) => c.key),
  );
}

/**
 * Compute the redacted text for every segment that has at least one active
 * finding. Replacements are applied back-to-front within a segment so
 * earlier offsets stay valid as later ones are substituted.
 */
export function buildRedactions(
  parsed: ParsedFile,
  findings: Finding[],
  active: Set<Category>,
): Map<string, string> {
  const bySegment = new Map<string, Finding[]>();
  for (const finding of findings) {
    if (!active.has(finding.category)) continue;
    const list = bySegment.get(finding.segmentId);
    if (list) list.push(finding);
    else bySegment.set(finding.segmentId, [finding]);
  }

  const replacements = new Map<string, string>();
  for (const segment of parsed.segments) {
    const segmentFindings = bySegment.get(segment.id);
    if (!segmentFindings || segmentFindings.length === 0) continue;
    let text = segment.text;
    const sorted = [...segmentFindings].sort((a, b) => b.start - a.start);
    for (const finding of sorted) {
      text = text.slice(0, finding.start) + tokenFor(finding.category) + text.slice(finding.end);
    }
    replacements.set(segment.id, text);
  }
  return replacements;
}

export function outputFileName(originalName: string): string {
  const dot = originalName.lastIndexOf(".");
  if (dot === -1) return `${originalName}.anonymized`;
  return `${originalName.slice(0, dot)}.anonymized${originalName.slice(dot)}`;
}
