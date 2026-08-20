"use client";

import { useCallback, useRef, useState } from "react";
import { Icon } from "@/design-system/components/Icon";

const ACCEPT = ".csv,.xlsx,.docx,.txt,.md,.markdown";

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

/** Single-file drop target. No batch mode — dropping a new file replaces whatever came before. */
export function DropZone({ onFile, disabled = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-8 py-20 text-center transition-colors cursor-pointer
        ${isDragging ? "border-teal bg-teal/5" : "border-gray-950/15 bg-gray-950/[0.02] hover:border-gray-950/25"}
        ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <Icon name="file/FileLock" size={40} className="opacity-70" />
      <div>
        <p className="font-helix-display text-2xl uppercase text-gray-950 mb-1">
          Drop a file to anonymize
        </p>
        <p className="text-gray-950/55 text-sm">or click to browse — one file at a time</p>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-950/35">
        CSV · XLSX · DOCX · TXT · MD
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = ""; // allow re-selecting the same file after "Start over"
        }}
      />
    </div>
  );
}
