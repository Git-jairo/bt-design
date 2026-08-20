/**
 * Shared types for the Anonymize experiment.
 *
 * Everything here describes data that never leaves the browser: a dropped
 * File is parsed into `Segment`s (atomic units of text — a text cell, a
 * paragraph run, the whole document), scanned for `Finding`s, and rewritten
 * in place before download. See `engine.ts` for the pipeline and
 * `parsers/*` for the per-format read/write boundary.
 */

/** The three tiers from Budget Thuis's AI Usage Guidelines. */
export type Tier = "must" | "advised" | "canhave";

export type Category =
  // MUST REMOVE — locked, always applied
  | "bsn"
  | "tax_id"
  | "iban"
  | "credit_card"
  | "credential"
  | "medical_disciplinary_salary"
  | "special_category"
  | "security_incident"
  // ADVISED REMOVE — off by default, one shared toggle
  | "name"
  | "email"
  | "phone"
  | "address"
  | "customer_id"
  // CAN HAVE — informational only, never removed
  | "job_title"
  | "company"
  | "date";

export interface CategoryMeta {
  key: Category;
  tier: Tier;
  label: string;
  /** Short explanation shown in the UI. */
  description: string;
  /** Placeholder token substituted in place of the detected value. */
  token: string;
}

/** A single match produced by a detector, in the coordinate space of one Segment's text. */
export interface Match {
  category: Category;
  tier: Tier;
  start: number;
  end: number;
  value: string;
}

/** An atomic, independently-addressable piece of text inside a parsed file. */
export interface Segment {
  id: string;
  text: string;
  /**
   * Set by tabular parsers (CSV/XLSX) when a column header identifies what
   * the whole cell is (e.g. a "BSN" column) — stronger than any in-value
   * pattern match, so it overrides regex detection for this segment entirely.
   */
  forceCategory?: Category;
}

/** A Finding is a Match anchored to the Segment it was found in, plus UI-friendly bits. */
export interface Finding {
  id: string;
  segmentId: string;
  category: Category;
  tier: Tier;
  value: string;
  /** Offsets into the owning Segment's original text — used to redact in place. */
  start: number;
  end: number;
  /** A short excerpt of surrounding text, for the review list. */
  snippet: string;
}

/**
 * The per-format read/write boundary. A parser turns a File into segments for
 * detection, and later rewrites only the segments the engine tells it to —
 * everything else (rows, columns, paragraphs, styling where preserved) is
 * left untouched.
 */
export interface ParsedFile {
  segments: Segment[];
  /**
   * Rebuild the file, replacing the text of each segment named in
   * `replacements` with its new value, and return the result in the
   * original file format.
   */
  serialize(replacements: Map<string, string>): Promise<Blob>;
}

export interface AnalyzeResult {
  parsed: ParsedFile;
  findings: Finding[];
}
