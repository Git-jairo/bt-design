import Link from "next/link";

interface ButtonProps {
  /** Render as a Next.js Link when provided, otherwise a <button>. */
  href?: string;
  variant?: "primary" | "ghost";
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const VARIANTS: Record<"primary" | "ghost", string> = {
  primary: "bg-action-bg text-action-fg hover:bg-action-bg-hover",
  ghost:   "border border-border-subtle text-fg/70 hover:border-border-medium hover:text-fg",
};

const BASE = "inline-flex items-center gap-2 h-12 px-9 rounded-button font-semibold text-sm transition-colors";

export function Button({
  href,
  variant = "primary",
  children,
  className = "",
  onClick,
  type = "button",
}: ButtonProps) {
  const cls = `${BASE} ${VARIANTS[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
