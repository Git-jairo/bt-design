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

function escapeRegex(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Health/mental-health condition terms — GDPR Art. 9 "data concerning
 * health". Kept as a plain array (rather than one hand-tuned inline
 * alternation) specifically so it's easy to extend: a narrow hardcoded list
 * here is a recurring source of missed conditions, not a one-off bug.
 */
const MEDICAL_CONDITION_TERMS = [
  // diagnosis / general
  String.raw`diagnos\w*`,
  "aandoening",
  "ziekte(?:beeld)?",
  String.raw`chronisch\w*`,
  "handicap",
  "beperking",
  // mental health
  "burn-?out",
  "depressie",
  "depression",
  "angststoornis",
  "anxiety disorder",
  "anxiety",
  "angst",
  String.raw`\bptss\b`,
  String.raw`\bptsd\b`,
  "bipolair",
  "bipolar",
  "schizofrenie",
  "autisme",
  "autism",
  String.raw`\badhd\b`,
  "eetstoornis",
  "eating disorder",
  "geestelijke gezondheid",
  "mental health",
  String.raw`psychiatrisch\w*`,
  "psychiatric",
  String.raw`psycholog\w*`,
  "psychiater",
  String.raw`\bggz\b`,
  "slapeloosheid",
  "insomnia",
  // physical conditions
  "kanker",
  "cancer",
  "tumor",
  "diabetes",
  "epilepsie",
  "epilepsy",
  "migraine",
  "allergie",
  "allergy",
  "hart- en vaatziekte",
  String.raw`\bhiv\b`,
  String.raw`\baids\b`,
  // treatment / procedures
  "chemotherapie",
  "chemotherapy",
  "huisarts",
  "operatie",
  "surgery",
  "revalidatie",
  "rehabilitation",
  "ziekenhuisopname",
  "hospitalization",
  "medicatie",
  String.raw`medicijn\w*`,
  "medication",
  "antidepressiva",
  "therapie",
  "therapy",
  // reproductive health
  "vruchtbaarheidsbehandeling",
  "fertility treatment",
  String.raw`\bivf\b`,
  "miskraam",
  "miscarriage",
  "zwangerschapscomplicatie",
  // addiction
  "verslaving",
  "addiction",
  "alcoholisme",
  "alcoholism",
].join("|");

const NL_CITIES = [
  "Amsterdam",
  "Rotterdam",
  "Den Haag",
  "'s-Gravenhage",
  "Utrecht",
  "Eindhoven",
  "Tilburg",
  "Groningen",
  "Almere",
  "Breda",
  "Nijmegen",
  "Enschede",
  "Haarlem",
  "Arnhem",
  "Zaanstad",
  "Amersfoort",
  "Apeldoorn",
  "Hoofddorp",
  "Maastricht",
  "Leiden",
  "Dordrecht",
  "Zoetermeer",
  "Zwolle",
  "Deventer",
  "Delft",
  "Alkmaar",
  "Leeuwarden",
  "Venlo",
  "Hilversum",
  "Gouda",
  "Amstelveen",
  "Ede",
  "Emmen",
  "Helmond",
  "Hengelo",
  "Purmerend",
  "Roosendaal",
  "Oss",
  "Schiedam",
  "Spijkenisse",
];

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
  // Bug fix: "4 groups of 4 digits, spaces" (e.g. "4111 1111 1111 1111") was
  // being rejected outright because it was gated on a Luhn checksum — real
  // formatting is a strong enough signal on its own, so this pattern (a
  // consistent separator, via the \2 backreference, between all four groups)
  // catches it regardless of whether the number is Luhn-valid.
  collect(out, text, /\b(\d{4}([ -])\d{4}\2\d{4}\2\d{4})\b/g, "credit_card", "must");
  // Other layouts (no separator, Amex 4-6-5, etc.) still need the Luhn check
  // so a random 13-19 digit run — an order number, a phone number — isn't
  // flagged as a card just because it's the right length.
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

  // Bug fix: a labeled salary/income figure ("Salary: 72000") had nothing to
  // match it when it wasn't part of a longer sentence — this pins just the
  // number, so unrelated text on the same line (name, department, …) isn't
  // dragged into the redaction.
  collect(
    out,
    text,
    /\b(?:salary|salaris\w*|income|inkomen|wage|loon|jaarinkomen|jaarsalaris|maandsalaris|compensation)\s*[:=]?\s*(?:€|\$|EUR)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\b/gi,
    "medical_disciplinary_salary",
    "must",
    { groupIndex: 1 },
  );

  // HR-administrative + salary/income terms. Health-condition terms used to
  // live here too (diagnos, burn-out, medicijn, ggz, …) but those are GDPR
  // Art. 9 health data, not HR-process records — moved to special_category
  // below so they're both caught AND labeled correctly.
  collectByKeywordSentence(
    out,
    text,
    /ziekteverzuim|arbeidsongeschikt|bedrijfsarts|arbodienst|zwangerschapsverlof|ouderschapsverlof|disciplinaire maatregel|officiële waarschuwing|schriftelijke waarschuwing|ontslag op staande voet|verbetertraject|performance improvement plan|\bsalaris\w*|salary|brutoloon|nettoloon|\bloon\b|jaarinkomen|jaarsalaris|maandsalaris|loonstrook|salarisstrook|\bincome\b|\binkomen\b|\bwage\b|compensation|gross salary|net salary|annual salary/gi,
    "medical_disciplinary_salary",
    "must",
  );
  // Bug fix: this list was narrow enough that "diabetes"/"burnout" only got
  // caught incidentally (via the word "diagnosed" elsewhere in the same
  // sentence) while "anxiety disorder", "fertility treatment", and
  // "depression" had nothing to match at all — MEDICAL_CONDITION_TERMS
  // above replaces that with a much broader, structured term list.
  collectByKeywordSentence(
    out,
    text,
    new RegExp(
      `vingerafdruk|gezichtsherkenning|irisscan|biometrisch|politieke voorkeur|politieke overtuiging|lid(?:maatschap)? van (?:de )?(?:vvd|d66|pvda|cda|\\bsp\\b|pvv|groenlinks)|geloofsovertuiging|religieuze overtuiging|kerkelijke gezindte|\\bvakbond|\\bfnv\\b|\\bcnv\\b|seksuele geaardheid|${MEDICAL_CONDITION_TERMS}`,
      "gi",
    ),
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

  // ── CAN HAVE (informational; only removed via the bulk can-have toggle) ──
  // Bug fix: customer/employee IDs were being redacted under the advised
  // tier. They're can-have — moved here, and listed only, never redacted
  // unless the user explicitly enables the whole can-have tier.
  collect(
    out,
    text,
    /\b(?:klantnummer|klant[- ]?id|customer(?: id| number)|personeelsnummer|employee[- ]?id|werknemersnummer|medewerker[- ]?nummer|contractnummer)\s*[:#-]?\s*([A-Za-z0-9][A-Za-z0-9-]{2,19})\b/gi,
    "customer_id",
    "canhave",
    { groupIndex: 1 },
  );
  // Bug fix: city names were being swept into the street-address detector
  // and redacted as [REMOVED:ADDRESS] even though a bare city name is much
  // lower-confidence PII than a street + house number. Kept as its own
  // can-have field via a curated city list, informational only.
  collect(
    out,
    text,
    new RegExp(`\\b(${NL_CITIES.map(escapeRegex).join("|")})\\b`, "g"),
    "city",
    "canhave",
  );
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
