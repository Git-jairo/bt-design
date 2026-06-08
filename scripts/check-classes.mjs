/**
 * check-classes.mjs
 *
 * Cross-references every Tailwind utility class used in className attributes
 * across the codebase against the tokens defined in primitives.css,
 * semantics.css, and components.css.
 *
 * A class is flagged as "dead" when it uses a custom token suffix (bg-*, text-*,
 * rounded-*, shadow-*, font-*, border-*) that maps to a CSS custom property
 * (--color-*, --radius-*, --shadow-*, --font-*) that no longer exists in any
 * token file.
 *
 * Usage:  node scripts/check-classes.mjs
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");

// ─── 1. Collect all CSS custom-property names from token files ───────────────

const TOKEN_FILES = [
  "src/design-system/tokens/primitives.css",
  "src/design-system/tokens/semantics.css",
  "src/design-system/tokens/components.css",
];

/** @type {Set<string>} e.g. "color-btn-cta-bg", "radius-card", "shadow-card" */
const definedTokens = new Set();

for (const rel of TOKEN_FILES) {
  const css = readFileSync(join(ROOT, rel), "utf8");
  for (const match of css.matchAll(/--([a-zA-Z0-9_-]+)\s*:/g)) {
    definedTokens.add(match[1]);
  }
}

// ─── 2. Map Tailwind prefix → CSS property namespace ────────────────────────
//
// Tailwind v4 turns --color-X into bg-X / text-X / border-X etc.
// --radius-X  → rounded-X
// --shadow-X  → shadow-X
// --font-X    → font-X
//
// We capture the suffix after the Tailwind prefix and reconstruct the expected
// CSS var name, e.g.  text-btn-cta-fg  →  color-btn-cta-fg

const PREFIXES = [
  { tw: "bg-",       css: "color-" },
  { tw: "text-",     css: "color-" },
  { tw: "border-",   css: "color-" },
  { tw: "ring-",     css: "color-" },
  { tw: "fill-",     css: "color-" },
  { tw: "stroke-",   css: "color-" },
  { tw: "rounded-",  css: "radius-" },
  { tw: "shadow-",   css: "shadow-" },
  { tw: "font-",     css: "font-"   },
];

// ─── 3. Walk source files and extract className strings ──────────────────────

/** @type {string[]} */
function walkTsx(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (["node_modules", ".next", ".git", "dist"].includes(entry)) continue;
      files.push(...walkTsx(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Extract every individual class token from a source file.
 * Handles: className="...", className={`...`}, className={'...'}, cn("..."), clsx("...")
 * Returns an array of { cls, line, col } objects.
 */
function extractClasses(src) {
  const results = [];
  const lines = src.split("\n");

  // Collect all string literals that could be className values.
  // We capture quoted strings and template literals inside className/cn/clsx.
  const CLASS_RE =
    /(?:className\s*=\s*|(?:cn|clsx|cva)\s*\()(?:"([^"]*?)"|'([^']*?)'|`([^`]*?)`)/g;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    let m;
    CLASS_RE.lastIndex = 0;
    while ((m = CLASS_RE.exec(line)) !== null) {
      const raw = m[1] ?? m[2] ?? m[3] ?? "";
      // Split on whitespace; skip template-literal expressions ${...}
      for (const cls of raw.split(/\s+/)) {
        const clean = cls
          .replace(/^\$\{.*?\}/, "")   // drop leading ${expr}
          .replace(/\$\{.*?\}$/, "")   // drop trailing ${expr}
          .replace(/[{}`$]/g, "")
          .trim();
        if (clean) {
          results.push({ cls: clean, line: lineIdx + 1 });
        }
      }
    }
  }

  return results;
}

// ─── 4. Determine whether a class is "custom-token" and if so validate it ───

/**
 * Returns the expected CSS var name for a custom-token class, or null if
 * this is a plain Tailwind utility (px-4, flex, etc.) that we skip.
 *
 * Strategy: after stripping the Tailwind prefix and any Tailwind modifier
 * (hover:, focus:, lg:, dark: …), we check if the remainder contains only
 * digits or is a known Tailwind keyword — if so it's a core utility, skip.
 * Otherwise it must be a custom token reference.
 */

// border-{side} and rounded-{side} Tailwind directional utilities — never color/radius tokens.
// e.g. border-r, border-t-4, border-x, rounded-r-lg, rounded-tl-md
const BORDER_SIDE_RE = /^[trblxy](-\d+)?$/;
const ROUNDED_SIDE_RE = /^[trbl]{1,2}(-(?:none|sm|md|lg|xl|2xl|3xl|full|\d+))?$/;

// Tokens that are Tailwind core suffixes for various prefixes — we don't flag
// these even if they look like names. This list covers the most common ones;
// anything numeric (w-4, p-6) is also skipped automatically.
const TAILWIND_CORE_SUFFIXES = new Set([
  // colors
  "current", "transparent", "inherit", "white", "black",
  "slate", "gray", "zinc", "neutral", "stone",
  "red", "orange", "amber", "yellow", "lime", "green",
  "emerald", "teal", "cyan", "sky", "blue", "indigo",
  "violet", "purple", "fuchsia", "pink", "rose",
  // text sizes / leading (text-)
  "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl",
  "left", "center", "right", "justify", "start", "end",
  "wrap", "nowrap", "balance", "pretty",
  "clip", "ellipsis",
  // font
  "thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black",
  "sans", "serif", "mono",
  "italic", "not-italic",
  // shadow
  "none", "inner",
  // rounded
  "full", "none",
  // border
  "solid", "dashed", "dotted", "double", "hidden",
  // misc
  "auto", "full", "screen", "min", "max", "fit",
]);

function analyzeClass(rawCls) {
  // Strip responsive / state modifiers (hover:, lg:, dark:, focus:, group-*:, etc.)
  // A modifier is everything up to and including the last colon before the utility name.
  const cls = rawCls.replace(/^([a-zA-Z0-9-]+:)+/, "");

  // Strip negation prefix
  const withoutNeg = cls.startsWith("-") ? cls.slice(1) : cls;

  // Strip opacity modifier  /40  /80  /[0.5]
  const withoutOpacity = withoutNeg.replace(/\/\[?[^\]]+\]?$/, "");

  for (const { tw, css } of PREFIXES) {
    if (!withoutOpacity.startsWith(tw)) continue;

    const suffix = withoutOpacity.slice(tw.length);

    // Skip empty suffix (e.g. bare "text-" which shouldn't appear)
    if (!suffix) continue;

    // Skip if suffix is purely numeric or a fraction (Tailwind spacing scale)
    if (/^[\d./-]+$/.test(suffix)) continue;

    // Skip if suffix is an arbitrary value [...]
    if (suffix.startsWith("[")) continue;

    // Skip border-{side} / rounded-{side} Tailwind directional utilities
    if (tw === "border-" && BORDER_SIDE_RE.test(suffix)) continue;
    if (tw === "rounded-" && ROUNDED_SIDE_RE.test(suffix)) continue;

    // Split by "-" and check if first segment is a known Tailwind keyword
    const firstSegment = suffix.split("-")[0];
    if (TAILWIND_CORE_SUFFIXES.has(firstSegment)) continue;

    // Looks like a custom token → expected CSS var is --{css}{suffix}
    const expectedVar = `${css}${suffix}`;
    return { expectedVar, prefix: tw, suffix };
  }

  return null; // plain utility, skip
}

// ─── 5. Run the scan ─────────────────────────────────────────────────────────

const SRC_DIR = join(ROOT, "src");
const files = walkTsx(SRC_DIR);

/** @type {Map<string, { file: string; line: number; cls: string; expectedVar: string }[]>} */
const deadByVar = new Map();
/** @type {{ file: string; line: number; cls: string; expectedVar: string }[]} */
const allDead = [];

let totalFiles = 0;
let totalClasses = 0;

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const found = extractClasses(src);
  if (!found.length) continue;
  totalFiles++;

  for (const { cls, line } of found) {
    totalClasses++;
    const analysis = analyzeClass(cls);
    if (!analysis) continue;

    const { expectedVar } = analysis;
    if (!definedTokens.has(expectedVar)) {
      const entry = { file: relative(ROOT, file), line, cls };
      allDead.push({ ...entry, expectedVar });
      if (!deadByVar.has(expectedVar)) deadByVar.set(expectedVar, []);
      deadByVar.get(expectedVar).push(entry);
    }
  }
}

// ─── 6. Report ───────────────────────────────────────────────────────────────

const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN  = "\x1b[32m";
const DIM    = "\x1b[2m";
const CYAN   = "\x1b[36m";

console.log(`\n${BOLD}╔══════════════════════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}║        Helix — Dead Token Class Checker                  ║${RESET}`);
console.log(`${BOLD}╚══════════════════════════════════════════════════════════╝${RESET}\n`);

if (allDead.length === 0) {
  console.log(`${GREEN}${BOLD}✓ No dead token classes found.${RESET}`);
  console.log(`${DIM}Scanned ${totalFiles} files, ${totalClasses} class tokens.${RESET}\n`);
  process.exit(0);
}

console.log(`${RED}${BOLD}✗ ${allDead.length} dead class reference(s) found${RESET} across ${[...deadByVar.keys()].length} missing token(s).\n`);
console.log(`${DIM}Scanned ${totalFiles} files, ${totalClasses} class tokens.${RESET}\n`);

// Group output by missing CSS variable
const sortedVars = [...deadByVar.entries()].sort((a, b) => b[1].length - a[1].length);

for (const [varName, usages] of sortedVars) {
  console.log(`${YELLOW}${BOLD}--${varName}${RESET}  ${DIM}(${usages.length} usage${usages.length > 1 ? "s" : ""})${RESET}`);
  for (const { file, line, cls } of usages) {
    console.log(`  ${CYAN}${file}:${line}${RESET}  ${DIM}→${RESET}  ${cls}`);
  }
  console.log();
}

// Summary table
console.log(`${BOLD}─── Summary ─────────────────────────────────────────────────${RESET}`);
console.log(`Missing token vars : ${RED}${[...deadByVar.keys()].length}${RESET}`);
console.log(`Dead class usages  : ${RED}${allDead.length}${RESET}`);
console.log(`Files affected     : ${[...new Set(allDead.map((d) => d.file))].length}`);
console.log();
