import { isValidBsn, isValidIban, isValidLuhn } from "./checksum";
import type { Category, Match, Tier } from "./types";

/**
 * All detection is regex/keyword-based and runs on a single Segment's text
 * (a cell, a paragraph run, or a whole .txt/.md file — see parsers/*). This
 * is a heuristic v1: strong signals (BSN elfproef, IBAN mod-97, Luhn) are
 * validated with a checksum; softer ones (names, addresses, job titles) are
 * pattern/keyword matches and will have false positives/negatives. That's
 * why "advised" stays off by default and "can have" is never actionable —
 * a human reviews before anything ships.
 */

const TIER_RANK: Record<Tier, number> = { must: 0, advised: 1, canhave: 2 };

/**
 * Run `regex` (must include the `d` flag semantics — added automatically)
 * over `text`, pushing one Match per result. `groupIndex` selects which
 * capture group's span becomes the redacted range (0 = whole match), so a
 * label like "BSN:" can be matched for context without being redacted itself.
 */
function collect(
  out: Match[],
  text: string,
  regex: RegExp,
  category: Category,
  tier: Tier,
  opts: { groupIndex?: number; validate?: (value: string) => boolean } = {},
): void {
  const flags = regex.flags.includes("d") ? regex.flags : regex.flags + "d";
  const re = new RegExp(regex.source, flags);
  const groupIndex = opts.groupIndex ?? 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    // The `d` flag populates `.indices`, a parallel array of [start, end] per group.
    const indices = (m as unknown as { indices?: Array<[number, number] | undefined> }).indices?.[
      groupIndex
    ];
    if (indices) {
      const [start, end] = indices;
      const value = text.slice(start, end);
      if (!opts.validate || opts.validate(value)) {
        out.push({ category, tier, start, end, value });
      }
    }
  }
}

/** Split text into sentence-ish spans (kept simple: split on . ! ? and newlines). */
function sentenceSpans(text: string): Array<{ start: number; end: number }> {
  const spans: Array<{ start: number; end: number }> = [];
  const boundary = /[.!?\n]+/g;
  let start = 0;
  let m: RegExpExecArray | null;
  while ((m = boundary.exec(text))) {
    spans.push({ start, end: m.index + m[0].length });
    start = m.index + m[0].length;
  }
  if (start < text.length) spans.push({ start, end: text.length });
  return spans;
}

/**
 * Flag whole sentences that contain any of `keywords` — used for the tiers
 * that can't be pinned to a single token (medical/disciplinary/salary,
 * GDPR Art. 9 special categories, active security-incident content).
 */
function collectByKeywordSentence(
  out: Match[],
  text: string,
  keywords: RegExp,
  category: Category,
  tier: Tier,
): void {
  for (const span of sentenceSpans(text)) {
    const sentence = text.slice(span.start, span.end);
    keywords.lastIndex = 0;
    if (!keywords.test(sentence)) continue;
    // Trim surrounding whitespace so the redacted range hugs the sentence.
    const leading = sentence.match(/^\s*/)?.[0].length ?? 0;
    const trailing = sentence.match(/\s*$/)?.[0].length ?? 0;
    const start = span.start + leading;
    const end = span.end - trailing;
    if (end > start) {
      out.push({ category, tier, start, end, value: text.slice(start, end) });
    }
  }
}

const MONTHS =
  "januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|" +
  "January|February|March|April|May|June|July|August|September|October|November|December";

function runDetectors(text: string): Match[] {
  const out: Match[] = [];

  // ── MUST REMOVE ────────────────────────────────────────────────────────
  collect(out, text, /\b(?:BSN|burgerservicenummer)\s*[:#]?\s*(\d{3}[.\s]?\d{3}[.\s]?\d{3})\b/gi, "bsn", "must", {
    groupIndex: 1,
    validate: (v) => /^\d{9}$/.test(v.replace(/[.\s]/g, "")),
  });
  collect(out, text, /\b(\d{9})\b/g, "bsn", "must", { groupIndex: 1, validate: isValidBsn });

  collect(out, text, /\b(NL\d{9}B\d{2})\b/gi, "tax_id", "must", { groupIndex: 1 });
  collect(
    out,
    text,
    /\b(?:BTW[-\s]?nummer|VAT\s?number)\s*[:#]?\s*([A-Z]{0,2}\d{8,12}[A-Z0-9]{0,3})\b/gi,
    "tax_id",
    "must",
    { groupIndex: 1 },
  );

  collect(
    out,
    text,
    /\b([A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}[ ]?[A-Z0-9]{0,3})\b/g,
    "iban",
    "must",
    { groupIndex: 1, validate: (v) => isValidIban(v.replace(/\s/g, "").toUpperCase()) },
  );
  collect(out, text, /\b(\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{1,7})\b/g, "credit_card", "must", {
    groupIndex: 1,
    validate: (v) => isValidLuhn(v.replace(/[ -]/g, "")),
  });

  collect(
    out,
    text,
    /\b(?:password|wachtwoord|pwd|passwd|secret|api[_-]?key|apikey|access[_-]?token|auth[_-]?token|client[_-]?secret|private[_-]?key|connection[_-]?string)\s*[:=]\s*(\S{4,100})/gi,
    "credential",
    "must",
    { groupIndex: 1 },
  );
  collect(
    out,
    text,
    /\b(sk-[A-Za-z0-9]{10,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{12,})\b/g,
    "credential",
    "must",
  );
  collect(out, text, /\bey[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g, "credential", "must");
  collect(
    out,
    text,
    /\b((?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^\s'"]+)/gi,
    "credential",
    "must",
    { groupIndex: 1 },
  );

  collectByKeywordSentence(
    out,
    text,
    /diagnos|ziekteverzuim|arbeidsongeschikt|burn-?out|medicijn|medicatie|bedrijfsarts|huisarts|\bggz\b|psycholoog|psychiater|zwangerschapsverlof|arbodienst|disciplinaire maatregel|officiële waarschuwing|schriftelijke waarschuwing|ontslag op staande voet|verbetertraject|performance improvement plan|\bsalaris|brutoloon|nettoloon|jaarinkomen|maandsalaris|loonstrook|salarisstrook/gi,
    "medical_disciplinary_salary",
    "must",
  );
  collectByKeywordSentence(
    out,
    text,
    /vingerafdruk|gezichtsherkenning|irisscan|biometrisch|politieke voorkeur|politieke overtuiging|lid(?:maatschap)? van (?:de )?(?:vvd|d66|pvda|cda|\bsp\b|pvv|groenlinks)|geloofsovertuiging|religieuze overtuiging|kerkelijke gezindte|\bvakbond|\bfnv\b|\bcnv\b|seksuele geaardheid/gi,
    "special_category",
    "must",
  );
  collectByKeywordSentence(
    out,
    text,
    /pentest|penetratietest|penetration test|kwetsbaarheid|vulnerability report|data ?breach|datalek|beveiligingsincident|security incident|\bexploit\b|cve-\d{4}-\d+|unauthorized access|ongeautoriseerde toegang|incident response/gi,
    "security_incident",
    "must",
  );

  // ── ADVISED REMOVE ───────────────────────────────────────────────────────
  collect(
    out,
    text,
    /\b(?:Dhr\.|Mevr\.|Mw\.|Dr\.|Ing\.|Ir\.|Drs\.)\s+([A-ZÀ-Þ][\wÀ-ÿ'’.-]*(?:\s+(?:van der|van den|van de|van|de|der|den|ten|ter)?\s*[A-ZÀ-Þ][\wÀ-ÿ'’.-]*)*)/g,
    "name",
    "advised",
    { groupIndex: 1 },
  );
  collect(
    out,
    text,
    /\b(?:Naam|Klant(?:naam)?|Contactpersoon|Voornaam|Achternaam|T\.a\.v\.|Attn)\s*[:\-]\s*([A-ZÀ-Þ][^\n,;]{1,40})/gi,
    "name",
    "advised",
    { groupIndex: 1 },
  );

  collect(out, text, /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "email", "advised");

  collect(out, text, /\b(\+31[\s-]?6[\s-]?\d{4}[\s-]?\d{4}|06[\s-]?\d{8}|0\d{1,2}[\s-]?\d{6,7})\b/g, "phone", "advised", {
    groupIndex: 1,
  });
  collect(out, text, /(?<![\w.])(\+\d{1,3}(?:[\s-]?\d{2,4}){2,5})\b/g, "phone", "advised", { groupIndex: 1 });

  collect(out, text, /\b(\d{4}\s?[A-Z]{2})\b/g, "address", "advised", { groupIndex: 1 });
  collect(
    out,
    text,
    /\b([A-ZÀ-Þ][a-zà-ÿ'’.-]+(?:\s[A-ZÀ-Þ][a-zà-ÿ'’.-]+)*\s\d{1,4}[a-zA-Z]?)(?=[,\s]|$)/g,
    "address",
    "advised",
    { groupIndex: 1 },
  );

  collect(
    out,
    text,
    /\b(?:klantnummer|klant[- ]?id|customer(?: id| number)|personeelsnummer|employee[- ]?id|werknemersnummer|medewerker[- ]?nummer|contractnummer)\s*[:#-]?\s*([A-Za-z0-9][A-Za-z0-9-]{2,19})\b/gi,
    "customer_id",
    "advised",
    { groupIndex: 1 },
  );

  // ── CAN HAVE (informational, never redacted) ─────────────────────────────
  collect(
    out,
    text,
    /\b(CEO|CFO|CTO|COO|manager|directeur|teamleider|teamlead|consultant|developer|engineer|projectleider|product owner|scrum master|HR[- ]adviseur|accountmanager|recruiter|analist|architect|stagiaire?)\b/gi,
    "job_title",
    "canhave",
  );
  collect(
    out,
    text,
    /\b([A-Z][\w&.-]*(?:\s+[A-Z][\w&.-]*){0,4}\s+(?:B\.?V\.?|N\.?V\.?|GmbH|Ltd\.?|Inc\.?|LLC|Stichting))\b/g,
    "company",
    "canhave",
  );
  collect(
    out,
    text,
    new RegExp(
      `\\b(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4}|\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\s+(?:${MONTHS})\\s+\\d{4})\\b`,
      "gi",
    ),
    "date",
    "canhave",
  );

  return out;
}

/**
 * Keep the highest-priority (must > advised > canhave), longest match for
 * any overlapping span, so a single character never ends up redacted twice
 * or shown as two separate findings.
 */
function resolveOverlaps(matches: Match[]): Match[] {
  const byPriority = [...matches].sort((a, b) => {
    if (TIER_RANK[a.tier] !== TIER_RANK[b.tier]) return TIER_RANK[a.tier] - TIER_RANK[b.tier];
    const lenDiff = b.end - b.start - (a.end - a.start);
    if (lenDiff !== 0) return lenDiff;
    return a.start - b.start;
  });
  const accepted: Match[] = [];
  for (const candidate of byPriority) {
    const overlaps = accepted.some((a) => candidate.start < a.end && a.start < candidate.end);
    if (!overlaps) accepted.push(candidate);
  }
  return accepted.sort((a, b) => a.start - b.start);
}

/** Detect every category in a single piece of text, deduped and non-overlapping. */
export function detectAll(text: string): Match[] {
  if (!text) return [];
  return resolveOverlaps(runDetectors(text));
}
