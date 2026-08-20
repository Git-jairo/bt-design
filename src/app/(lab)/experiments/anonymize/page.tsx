"use client";

/**
 * ANONYMIZE — detect and redact personal data in a single dropped file,
 * entirely client-side, before it's manually shared anywhere else (e.g.
 * pasted into an AI tool).
 *
 * Zero-upload by construction: parsing, detection, and rewriting all happen
 * via the File API in this tab. There is no API route behind this page and
 * no network call is ever made with the file's content — see lib/engine.ts
 * for the pipeline and lib/parsers/* for the per-format read/write boundary.
 *
 * One file per run, no reversibility, no key file — this is one-way redaction.
 */

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/design-system/components/Button";
import { Icon } from "@/design-system/components/Icon";
import { DropZone } from "./components/DropZone";
import { FindingsReview } from "./components/FindingsReview";
import {
  activeCategories,
  analyze,
  buildRedactions,
  detectFormat,
  MAX_FILE_SIZE,
  outputFileName,
  parseFile,
  type SupportedFormat,
} from "./lib/engine";
import type { Finding, ParsedFile } from "./lib/types";

type Stage = "idle" | "analyzing" | "review" | "done";

const FORMAT_LABEL: Record<SupportedFormat, string> = {
  csv: "CSV",
  xlsx: "XLSX",
  docx: "DOCX",
  txt: "TXT",
  md: "Markdown",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AnonymizePage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<SupportedFormat | null>(null);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [advisedEnabled, setAdvisedEnabled] = useState(false);
  const [downloadedName, setDownloadedName] = useState<string | null>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const reset = useCallback(() => {
    setStage("idle");
    setError(null);
    setFile(null);
    setFormat(null);
    setParsed(null);
    setFindings([]);
    setAdvisedEnabled(false);
    setDownloadedName(null);
  }, []);

  const handleFile = useCallback(async (incoming: File) => {
    setError(null);
    const detected = detectFormat(incoming);
    if (!detected) {
      const ext = incoming.name.split(".").pop()?.toUpperCase() ?? "that type";
      setError(`"${ext}" isn't supported yet. Drop a CSV, XLSX, DOCX, TXT, or MD file.`);
      return;
    }
    if (incoming.size > MAX_FILE_SIZE) {
      setError(
        `That file is ${formatBytes(incoming.size)} — the limit for this in-browser tool is ${formatBytes(MAX_FILE_SIZE)}.`,
      );
      return;
    }

    setFile(incoming);
    setFormat(detected);
    setStage("analyzing");
    // Yield one tick so "Scanning…" actually paints before the synchronous parse + regex scan.
    await new Promise((resolve) => setTimeout(resolve, 30));
    try {
      const parsedFile = await parseFile(incoming, detected);
      setParsed(parsedFile);
      setFindings(analyze(parsedFile));
      setStage("review");
    } catch {
      setError(
        `Couldn't read that file — it may be corrupted, password-protected, or not a real ${FORMAT_LABEL[detected]} file.`,
      );
      setStage("idle");
      setFile(null);
      setFormat(null);
    }
  }, []);

  const handleAnonymize = useCallback(async () => {
    if (!parsed || !file) return;
    const replacements = buildRedactions(parsed, findings, activeCategories(advisedEnabled));
    const blob = await parsed.serialize(replacements);
    const name = outputFileName(file.name);

    const url = URL.createObjectURL(blob);
    const link = downloadLinkRef.current;
    if (link) {
      link.href = url;
      link.download = name;
      link.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 4000);

    setDownloadedName(name);
    setStage("done");
  }, [parsed, file, findings, advisedEnabled]);

  const mustCount = findings.filter((f) => f.tier === "must").length;
  const advisedCount = findings.filter((f) => f.tier === "advised").length;
  const appliedCount = mustCount + (advisedEnabled ? advisedCount : 0);

  return (
    <div className="font-helix-body bg-screen min-h-screen pb-32">
      <header className="pt-10 px-6 max-w-220 mx-auto flex items-center justify-between gap-4">
        <Link href="/experiments" className="text-sm text-gray-950/50 hover:text-gray-950 transition-colors">
          ← Back to The Lab
        </Link>
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal shrink-0">
          <Icon name="shield/Locked" size={14} />
          Runs entirely in your browser
        </span>
      </header>

      <section className="pt-10 pb-10 px-6 max-w-220 mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-950/40 mb-4">Experiment</p>
        <h1 className="font-helix-display text-5xl md:text-7xl uppercase text-gray-950 leading-none mb-6">
          Anonymize
        </h1>
        <p className="text-gray-950/55 max-w-lg text-lg leading-relaxed">
          Drop a file, review what it contains, and download a redacted copy — before you paste or upload
          it anywhere else. No server, no upload, no logging: parsing and rewriting happen right here in
          this tab.
        </p>
      </section>

      <section className="px-6 max-w-220 mx-auto flex flex-col gap-6">
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-50 px-5 py-4 text-sm text-red-700">
            <Icon name="feedback/Warning" size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {stage === "idle" && <DropZone onFile={handleFile} />}

        {stage === "analyzing" && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-950/[0.07] bg-white px-8 py-20 text-center">
            <div className="h-8 w-8 rounded-full border-2 border-gray-950/15 border-t-teal animate-spin" />
            <p className="text-gray-950/60 text-sm">Scanning {file?.name}…</p>
          </div>
        )}

        {(stage === "review" || stage === "done") && file && format && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-950/[0.07] bg-white px-6 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <Icon name="file/FileShield" size={28} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-950 truncate">{file.name}</p>
                <p className="text-xs text-gray-950/45">
                  {FORMAT_LABEL[format]} · {formatBytes(file.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-xs font-semibold uppercase tracking-wide text-gray-950/40 hover:text-gray-950 transition-colors shrink-0"
            >
              Start over
            </button>
          </div>
        )}

        {stage === "review" && (
          <>
            <FindingsReview
              findings={findings}
              advisedEnabled={advisedEnabled}
              onToggleAdvised={setAdvisedEnabled}
            />

            <div className="sticky bottom-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gray-950/[0.07] bg-white/95 backdrop-blur px-6 py-5 shadow-[0_8px_40px_rgba(36,36,36,0.12)]">
              <p className="text-sm text-gray-950/55">
                {appliedCount === 0
                  ? "No sensitive data will be redacted."
                  : `${appliedCount} value${appliedCount === 1 ? "" : "s"} will be replaced with [REMOVED:…] placeholders.`}
              </p>
              <Button variant="cta" onClick={handleAnonymize} className="shrink-0">
                Anonymize &amp; download
              </Button>
            </div>
          </>
        )}

        {stage === "done" && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-950/[0.07] bg-white px-8 py-16 text-center">
            <Icon name="feedback/CheckCircle" size={40} />
            <div>
              <p className="font-helix-display text-2xl uppercase text-gray-950 mb-2">Downloaded</p>
              <p className="text-gray-950/55 text-sm max-w-sm">
                {downloadedName} saved with {appliedCount} value{appliedCount === 1 ? "" : "s"} redacted.
                This is one-way — there&apos;s no key file and no undo, so keep the original if you need it.
              </p>
            </div>
            <Button variant="secondary" onClick={reset}>
              Anonymize another file
            </Button>
          </div>
        )}
      </section>

      {/* Hidden anchor used to trigger the download without navigating away from the page. */}
      <a ref={downloadLinkRef} className="hidden" aria-hidden="true" />
    </div>
  );
}
