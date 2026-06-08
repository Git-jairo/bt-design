interface EyebrowProps {
  label: string;
  /** "default" = ink on light bg · "light" = screen on dark bg */
  variant?: "default" | "light";
}

export function Eyebrow({ label, variant = "default" }: EyebrowProps) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-[0.14em] ${
        variant === "light" ? "text-caption-on-surface-inverted" : "text-caption-on-surface-default"
      }`}
    >
      {label}
    </p>
  );
}
