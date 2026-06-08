interface BadgeProps {
  children: React.ReactNode;
  /**
   * brand    → mint bg, ink text (e.g. version chip)
   * neutral  → gray bg, ink text (e.g. status chip)
   * highlight → beta yellow bg, ink text
   */
  variant?: "brand" | "neutral" | "highlight";
  className?: string;
}

const VARIANTS: Record<"brand" | "neutral" | "highlight", string> = {
  brand:     "bg-brand text-body-on-surface-brand",
  neutral:   "bg-muted text-body-on-surface-default",
  highlight: "bg-promotion text-body-on-surface-promotion",
};

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-badge text-xs font-semibold uppercase tracking-wide ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
