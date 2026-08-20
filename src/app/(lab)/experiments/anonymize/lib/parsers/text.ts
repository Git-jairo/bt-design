import type { ParsedFile } from "../types";

/** Plain text and Markdown: the whole file is one segment. */
export async function parseText(file: File): Promise<ParsedFile> {
  const text = await file.text();
  const mimeType = file.type || "text/plain";

  return {
    segments: [{ id: "body", text }],
    async serialize(replacements) {
      const finalText = replacements.get("body") ?? text;
      return new Blob([finalText], { type: mimeType });
    },
  };
}
