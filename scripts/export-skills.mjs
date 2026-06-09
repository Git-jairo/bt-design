/**
 * export-skills — package skills from bt-mainframe into public/skills/.
 *
 * Walks every skill in ../bt-mainframe/.claude/skills/ and, one by one, asks
 * whether to zip it into public/skills/ (the exported = publishable set):
 *
 *   • not yet exported → "Export <slug>? [y/N/a]"
 *   • already exported → "Update <slug>? [y/N/a]"
 *       y = yes (zip / re-zip this one)
 *       N = no  (skip) — default
 *       a = yes to this AND all remaining skills (export new + update existing)
 *
 * New exports also get a public/skills/<slug>.json metadata stub (title +
 * description pulled from SKILL.md) for you to flesh out. Updating an existing
 * skill re-zips its content but never overwrites its .json, so curated website
 * copy is preserved.
 *
 * Afterwards run `npm run sync-skills` to rebuild src/data/skills.ts.
 *
 * Mainframe location: ../bt-mainframe (override with BT_MAINFRAME_DIR).
 * Pass --list to print status without prompting.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicSkillsDir = path.join(root, "public", "skills");
const mainframeSkillsDir = path.resolve(
  root,
  process.env.BT_MAINFRAME_DIR ?? "../bt-mainframe",
  ".claude/skills",
);

const LIST_ONLY = process.argv.includes("--list");

function listMainframeSkills() {
  if (!fs.existsSync(mainframeSkillsDir)) return null;
  return fs
    .readdirSync(mainframeSkillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((slug) => fs.existsSync(path.join(mainframeSkillsDir, slug, "SKILL.md")))
    .sort();
}

function readFrontmatter(slug) {
  const file = path.join(mainframeSkillsDir, slug, "SKILL.md");
  const text = fs.readFileSync(file, "utf8");
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = m ? m[1] : "";
  const grab = (key) => {
    const r = fm.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
    return r ? r[1].trim().replace(/^["']|["']$/g, "") : "";
  };
  return { name: grab("name") || slug, description: grab("description") };
}

const titleCase = (slug) =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const zipPath = (slug) => path.join(publicSkillsDir, `${slug}.zip`);
const jsonPath = (slug) => path.join(publicSkillsDir, `${slug}.json`);
const isExported = (slug) => fs.existsSync(zipPath(slug));

function zipSkill(slug) {
  const out = zipPath(slug);
  fs.rmSync(out, { force: true });
  // Archive contains <slug>/SKILL.md at its root; skip macOS cruft.
  execFileSync("zip", ["-r", "-q", "-X", out, slug, "-x", "*/.DS_Store", "-x", ".DS_Store"], {
    cwd: mainframeSkillsDir,
  });
}

function ensureMetadataStub(slug) {
  if (fs.existsSync(jsonPath(slug))) return; // never clobber curated copy
  const fm = readFrontmatter(slug);
  const stub = {
    title: titleCase(slug),
    description: fm.description ? fm.description.split(". ")[0].trim() : "",
    longDescription: "",
    roles: [],
    expertise: [],
  };
  fs.writeFileSync(jsonPath(slug), JSON.stringify(stub, null, 2) + "\n");
}

// ── main ─────────────────────────────────────────────────────────────────────

const skills = listMainframeSkills();
if (skills === null) {
  console.error(`Cannot find bt-mainframe skills at ${mainframeSkillsDir}.`);
  console.error("Set BT_MAINFRAME_DIR to its location and retry.");
  process.exit(1);
}
fs.mkdirSync(publicSkillsDir, { recursive: true });

if (LIST_ONLY) {
  const exported = skills.filter(isExported);
  console.log(`bt-mainframe: ${skills.length} skill(s) · exported: ${exported.length}\n`);
  for (const slug of skills) console.log(`  ${isExported(slug) ? "✓ exported" : "· new     "}  ${slug}`);
  process.exit(0);
}

if (!stdin.isTTY) {
  console.error("export-skills is interactive — run it directly in a terminal (or use --list).");
  process.exit(1);
}

const rl = readline.createInterface({ input: stdin, output: stdout });
console.log(`\nbt-mainframe → public/skills  (${skills.length} skill(s))`);
console.log("Answer: y = yes · N = no (default) · a = yes to this and all remaining\n");

let auto = false;
let exported = 0;
let updated = 0;
let skipped = 0;

for (const slug of skills) {
  const exists = isExported(slug);
  let go = auto;
  if (!auto) {
    const verb = exists ? "Update" : "Export";
    const ans = (await rl.question(`${verb} ${slug}? [y/N/a] `)).trim().toLowerCase();
    if (ans === "a") {
      auto = true;
      go = true;
    } else {
      go = ans === "y" || ans === "yes";
    }
  }
  if (!go) {
    skipped++;
    continue;
  }
  zipSkill(slug);
  ensureMetadataStub(slug);
  if (exists) {
    updated++;
    console.log(`  ↻ updated  ${slug}`);
  } else {
    exported++;
    console.log(`  + exported ${slug}  (edit public/skills/${slug}.json for website copy)`);
  }
}

rl.close();
console.log(`\nDone — ${exported} new, ${updated} updated, ${skipped} skipped.`);
console.log("Next: npm run sync-skills  (rebuilds src/data/skills.ts)");
