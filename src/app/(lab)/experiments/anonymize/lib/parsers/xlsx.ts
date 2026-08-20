import * as XLSX from "xlsx";
import { classifyHeader } from "../columns";
import type { Category, ParsedFile, Segment } from "../types";

/**
 * Every string-valued cell across every sheet becomes one segment, addressed
 * as `<sheet name>!<cell ref>` (Excel sheet names can't contain "!", so the
 * first "!" is an unambiguous split point). Redaction rewrites `cell.v` in
 * place — rows, columns, formulas on other cells, and sheet structure are
 * untouched. Cell styling survives only as far as SheetJS's community
 * edition can round-trip it.
 *
 * Row 0 of each sheet is assumed to be a header; columns whose header we
 * recognize get their data cells classified outright (see lib/columns.ts).
 */
export async function parseXlsx(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellStyles: true, cellDates: true });

  const segments: Segment[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    const columnCategory = new Map<number, Category>();
    for (const cellRef of Object.keys(sheet)) {
      if (cellRef.startsWith("!")) continue;
      const { r, c } = XLSX.utils.decode_cell(cellRef);
      if (r !== 0) continue;
      const header = sheet[cellRef];
      if (header?.t === "s" && typeof header.v === "string") {
        const category = classifyHeader(header.v);
        if (category) columnCategory.set(c, category);
      }
    }

    for (const cellRef of Object.keys(sheet)) {
      if (cellRef.startsWith("!")) continue; // sheet-level metadata (!ref, !merges, …)
      const cell = sheet[cellRef];
      if (cell && cell.t === "s" && typeof cell.v === "string" && cell.v.length > 0) {
        const { r, c } = XLSX.utils.decode_cell(cellRef);
        const forceCategory = r > 0 ? columnCategory.get(c) : undefined;
        segments.push({ id: `${sheetName}!${cellRef}`, text: cell.v, forceCategory });
      }
    }
  }

  return {
    segments,
    async serialize(replacements) {
      for (const [id, newText] of replacements) {
        const sep = id.indexOf("!");
        const sheetName = id.slice(0, sep);
        const cellRef = id.slice(sep + 1);
        const cell = workbook.Sheets[sheetName]?.[cellRef];
        if (cell) {
          cell.v = newText;
          delete cell.w; // stale cached formatted string
          delete cell.r; // stale cached rich-text run
        }
      }
      const out = XLSX.write(workbook, { type: "array", bookType: "xlsx", cellStyles: true });
      return new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    },
  };
}
