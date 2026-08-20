import { classifyHeader } from "../columns";
import type { Category, ParsedFile, Segment } from "../types";

/**
 * A small RFC 4180 parser/writer. Detection runs per cell (never across a
 * delimiter), so a match can't straddle two columns, and redaction rewrites
 * only the matched substring inside a cell — rows and columns are untouched.
 */

function sniffDelimiter(text: string): "," | ";" {
  const firstLine = text.slice(0, text.indexOf("\n") === -1 ? text.length : text.indexOf("\n"));
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

function parseRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === delimiter) {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r" && text[i + 1] === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 2;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  // Trailing field/row (files not ending in a newline).
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function needsQuoting(field: string, delimiter: string): boolean {
  return field.includes(delimiter) || field.includes('"') || field.includes("\n") || field.includes("\r");
}

function writeRows(rows: string[][], delimiter: string, lineEnding: string): string {
  return rows
    .map((row) =>
      row
        .map((field) => (needsQuoting(field, delimiter) ? `"${field.replace(/"/g, '""')}"` : field))
        .join(delimiter),
    )
    .join(lineEnding);
}

export async function parseCsv(file: File): Promise<ParsedFile> {
  const text = await file.text();
  const delimiter = sniffDelimiter(text);
  const lineEnding = text.includes("\r\n") ? "\r\n" : "\n";
  const rows = parseRows(text, delimiter);

  // Row 0 is assumed to be a header. Columns whose header we recognize
  // (e.g. "BSN", "e-mail") get their data cells classified outright; columns
  // we don't recognize fall back to plain per-cell detection, unchanged.
  const columnCategory = new Map<number, Category>();
  rows[0]?.forEach((header, c) => {
    const category = classifyHeader(header);
    if (category) columnCategory.set(c, category);
  });

  const segments: Segment[] = [];
  rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (!cell) return;
      const forceCategory = r > 0 ? (columnCategory.get(c) ?? undefined) : undefined;
      segments.push({ id: `${r}:${c}`, text: cell, forceCategory });
    });
  });

  return {
    segments,
    async serialize(replacements) {
      const out = rows.map((row) => [...row]);
      for (const [id, newText] of replacements) {
        const [r, c] = id.split(":").map(Number);
        if (out[r] && out[r][c] !== undefined) out[r][c] = newText;
      }
      return new Blob([writeRows(out, delimiter, lineEnding)], { type: "text/csv" });
    },
  };
}
