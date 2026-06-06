interface EyebrowProps {
  label: string;
  /** "default" = ink on light bg · "light" = screen on dark bg */
  variant?: "default" | "light";
}

export function Eyebrow({ label, variant = "default" }: EyebrowProps) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-[0.14em] ${
        variant === "light" ? "text-fg-inverse/35" : "text-fg/40"
      }`}
    >
      {label}
    </p>
  );
}
