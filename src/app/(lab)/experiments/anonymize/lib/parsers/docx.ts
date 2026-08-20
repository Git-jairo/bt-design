import JSZip from "jszip";
import type { ParsedFile, Segment } from "../types";

/**
 * A .docx is a zip of XML parts. We parse the body plus any headers/footers,
 * and treat each `<w:t>` text run as one segment. Redaction sets that node's
 * `textContent` and re-serializes only the parts that were touched — every
 * other part of the zip (styles, media, structure) is copied through as-is.
 *
 * Limitation (v1): a value split across two runs by Word's own formatting
 * (e.g. bold mid-word) won't be detected as one match, since detection runs
 * per `<w:t>` node. Comments/footnotes/endnotes parts aren't scanned.
 */
const DOCX_XML_PART = /^word\/(document|header\d*|footer\d*)\.xml$/;

export async function parseDocx(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const parser = new DOMParser();
  const serializer = new XMLSerializer();

  const parts: Array<{ path: string; doc: Document }> = [];
  const nodesById = new Map<string, Element>();
  const segments: Segment[] = [];

  const paths = Object.keys(zip.files).filter((p) => DOCX_XML_PART.test(p));
  for (const path of paths) {
    const xmlString = await zip.file(path)!.async("string");
    const doc = parser.parseFromString(xmlString, "application/xml");
    if (doc.getElementsByTagName("parsererror").length > 0) continue;
    parts.push({ path, doc });

    const textNodes = Array.from(doc.getElementsByTagNameNS("*", "t"));
    textNodes.forEach((node, i) => {
      const text = node.textContent ?? "";
      if (!text) return;
      const id = `${path}#${i}`;
      nodesById.set(id, node);
      segments.push({ id, text });
    });
  }

  return {
    segments,
    async serialize(replacements) {
      for (const [id, newText] of replacements) {
        const node = nodesById.get(id);
        // Text nodes must belong to the XML document they're inserted into —
        // create via the node's own ownerDocument, not the page's `document`.
        node?.replaceChildren(node.ownerDocument.createTextNode(newText));
      }
      for (const { path, doc } of parts) {
        zip.file(path, serializer.serializeToString(doc));
      }
      return zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
    },
  };
}
