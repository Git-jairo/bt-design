import { describe, expect, it } from "vitest";
import { isValidLuhn } from "../checksum";
import { classifyHeader } from "../columns";
import { detectAll } from "../detectors";
import { activeCategories, analyze, buildRedactions } from "../engine";
import { parseCsv } from "../parsers/csv";
import { parseXlsx } from "../parsers/xlsx";
import { CATEGORIES, CATEGORY_META, tokenFor } from "../tiers";
import type { Category } from "../types";

/**
 * Regression check for the bug-fix pass described in the anonymize bug
 * report (credit cards, salary, customer_id/city tier, broadened medical
 * keywords) plus the three-tier contract that shipped alongside it:
 *   - must-remove is always applied and can't be turned off by the caller.
 *   - advised-remove is opt-in per category (no single tier-wide switch).
 *   - can-have is never altered unless the one explicit bulk toggle is on.
 *
 * Run with `npm test`.
 */

const ALL_ADVISED = new Set(CATEGORIES.filter((c) => c.tier === "advised").map((c) => c.key));
const NONE = new Set<Category>();

function csvFile(text: string): File {
  return new File([text], "sample.csv", { type: "text/csv" });
}

describe("bug fixes", () => {
  it("bug 1 — detects a spaced, non-Luhn-valid credit card by format alone", () => {
    const value = "1234 5678 9012 3456";
    expect(isValidLuhn(value.replace(/\s/g, ""))).toBe(false); // proves this isn't sneaking through the old Luhn gate
    const matches = detectAll(`Card on file: ${value}.`);
    expect(matches.some((m) => m.category === "credit_card" && m.tier === "must")).toBe(true);
  });

  it("bug 1 — still catches a Luhn-valid card without the spaced format", () => {
    const matches = detectAll("Card: 4539578763621486"); // Luhn-valid, no separators
    expect(matches.some((m) => m.category === "credit_card")).toBe(true);
  });

  it("bug 2 — detects a labeled salary figure in free text", () => {
    const matches = detectAll("Salary: 72000 per year.");
    expect(matches.some((m) => m.category === "medical_disciplinary_salary" && m.tier === "must")).toBe(true);
  });

  it("bug 2 — classifies a salary/income column header (NL + EN)", () => {
    for (const header of ["salary", "salaris", "income", "inkomen", "jaarsalaris", "brutoloon"]) {
      expect(classifyHeader(header)).toBe("medical_disciplinary_salary");
    }
  });

  it("bug 3 — customer_id is can-have, not advised", () => {
    expect(CATEGORY_META.customer_id.tier).toBe("canhave");
    const matches = detectAll("Klantnummer: KL-908213");
    expect(matches.find((m) => m.category === "customer_id")?.tier).toBe("canhave");
  });

  it("bug 4 — city is its own can-have category, separate from street address", () => {
    expect(CATEGORY_META.city.tier).toBe("canhave");
    expect(CATEGORY_META.address.tier).toBe("advised");
    for (const header of ["city", "stad", "plaats", "woonplaats"]) {
      expect(classifyHeader(header)).toBe("city");
    }
    // A bare city name in free text is informational, not a street address.
    const matches = detectAll("Kantoor in Rotterdam.");
    const city = matches.find((m) => m.value === "Rotterdam");
    expect(city?.category).toBe("city");
    expect(city?.tier).toBe("canhave");
  });

  it("bug 5 — broadened health/medical keyword set catches every condition, not just the ones with 'diagnos'/'burnout'", () => {
    const sentences = [
      "The employee has diabetes and needs regular checkups.",
      "She has been dealing with burnout since spring.",
      "He was diagnosed with an anxiety disorder last month.",
      "They are currently undergoing fertility treatment.",
      "The notes mention a history of depression.",
    ];
    for (const sentence of sentences) {
      const matches = detectAll(sentence);
      const hit = matches.find((m) => m.category === "special_category");
      expect(hit, `expected a special_category match for: "${sentence}"`).toBeTruthy();
      expect(hit?.tier).toBe("must");
    }
  });
});

describe("three-tier contract", () => {
  const MUST_SAMPLES: Record<string, string> = {
    bsn: "BSN: 111222333",
    tax_id: "BTW-nummer: NL123456789B01",
    iban: "IBAN: NL91ABNA0417164300",
    credit_card: "Card: 1234 5678 9012 3456",
    credential: "password: hunter2fake",
    medical_disciplinary_salary: "Salary: 95000",
    special_category: "He was diagnosed with depression this year.",
    security_incident: "We are responding to an active data breach.",
  };

  it("every must-remove category hits 100% on its known sample", () => {
    const mustCategories = CATEGORIES.filter((c) => c.tier === "must").map((c) => c.key);
    for (const category of mustCategories) {
      const sample = MUST_SAMPLES[category];
      expect(sample, `no regression sample defined for must-remove category "${category}"`).toBeTruthy();
      const matches = detectAll(sample);
      const hit = matches.find((m) => m.category === category);
      expect(hit, `expected "${category}" to be detected in: "${sample}"`).toBeTruthy();
      expect(hit?.tier).toBe("must");
    }
  });

  it("must-remove redacts even when nothing is opted in", () => {
    const text = Object.values(MUST_SAMPLES).join(". ");
    const findings = analyze({ segments: [{ id: "body", text }], serialize: async () => new Blob([text]) });
    const mustFindings = findings.filter((f) => f.tier === "must");
    expect(mustFindings.length).toBeGreaterThanOrEqual(Object.keys(MUST_SAMPLES).length);

    const replacements = buildRedactions(
      { segments: [{ id: "body", text }], serialize: async () => new Blob([text]) },
      findings,
      activeCategories(NONE, false), // nothing opted in, no bulk can-have
    );
    const redacted = replacements.get("body") ?? text;
    for (const category of mustFindings.map((f) => f.category)) {
      expect(redacted).toContain(tokenFor(category));
    }
  });

  it("can-have is never altered by default, even with every advised category on", async () => {
    const csv = [
      "naam,klantnummer,stad,functie,bsn",
      "Jan van der Berg,KL-11223,Rotterdam,Product Owner,111222333",
    ].join("\n");
    const parsed = await parseCsv(csvFile(csv));
    const findings = analyze(parsed);

    const active = activeCategories(ALL_ADVISED, false); // every advised category on, can-have bulk OFF
    const replacements = buildRedactions(parsed, findings, active);
    const output = [...replacements.values()].join(" | ") + " | " + parsed.segments.map((s) => s.text).join(" ");

    // Can-have values must survive untouched: the raw customer id, city, and
    // job title should still be findable, and their tokens must not appear.
    const canHaveFindings = findings.filter((f) => f.tier === "canhave");
    expect(canHaveFindings.length).toBeGreaterThan(0);
    for (const f of canHaveFindings) {
      expect(replacements.get(f.segmentId)).toBeUndefined(); // segment was never rewritten at all
      expect(output).not.toContain(tokenFor(f.category));
    }
    // Must-remove (bsn) still goes out regardless.
    expect(output).toContain(tokenFor("bsn"));
  });

  it("can-have IS redacted, and only then, once the single bulk toggle is on", async () => {
    const csv = ["naam,klantnummer,stad,bsn", "Jan van der Berg,KL-11223,Rotterdam,111222333"].join("\n");
    const parsed = await parseCsv(csvFile(csv));
    const findings = analyze(parsed);

    const active = activeCategories(NONE, true); // no advised categories, can-have bulk ON
    const replacements = buildRedactions(parsed, findings, active);
    const output = [...replacements.values()].join(" | ");

    const canHaveFindings = findings.filter((f) => f.tier === "canhave");
    expect(canHaveFindings.length).toBeGreaterThan(0);
    for (const f of canHaveFindings) {
      expect(output).toContain(tokenFor(f.category));
    }
    // Advised (name) was never opted in, so it must still be untouched.
    expect(output).not.toContain(tokenFor("name"));
    // Must-remove still applies.
    expect(output).toContain(tokenFor("bsn"));
  });

  it("advised categories are independent — enabling one never redacts another", async () => {
    const csv = ["naam,email,stad", "Jan van der Berg,jan@example.com,Rotterdam"].join("\n");
    const parsed = await parseCsv(csvFile(csv));
    const findings = analyze(parsed);

    const active = activeCategories(new Set<Category>(["name"]), false); // only "name" switched on
    const replacements = buildRedactions(parsed, findings, active);
    const output = [...replacements.values()].join(" | ");

    expect(output).toContain(tokenFor("name"));
    expect(output).not.toContain(tokenFor("email")); // a different advised category, left off
    expect(output).not.toContain(tokenFor("city")); // can-have, untouched
  });

  it("XLSX: salary and city columns classify into the right tiers", async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["naam", "salary", "stad", "bsn"],
      ["Jan van der Berg", "95000", "Rotterdam", "111222333"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const file = new File([new Uint8Array(buffer)], "sample.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const parsed = await parseXlsx(file);
    const findings = analyze(parsed);

    const salary = findings.find((f) => f.value === "95000");
    expect(salary?.category).toBe("medical_disciplinary_salary");
    expect(salary?.tier).toBe("must");

    const city = findings.find((f) => f.value === "Rotterdam");
    expect(city?.category).toBe("city");
    expect(city?.tier).toBe("canhave");

    // Default (nothing opted in): salary redacts, city doesn't.
    const replacements = buildRedactions(parsed, findings, activeCategories(NONE, false));
    const output = [...replacements.values()].join(" | ");
    expect(output).toContain(tokenFor("medical_disciplinary_salary"));
    expect(output).not.toContain(tokenFor("city"));
  });
});
