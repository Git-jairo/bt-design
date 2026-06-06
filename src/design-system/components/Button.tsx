import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "cta" | "primary" | "secondary";
type ButtonAlign   = "center" | "left";

interface ButtonProps {
  href?:         string;
  variant?:      ButtonVariant;
  align?:        ButtonAlign;
  /** Context icon rendered before the label. */
  leadingIcon?:  ReactNode;
  /** Interaction icon rendered after the label. */
  trailingIcon?: ReactNode;
  children:      ReactNode;
  className?:    string;
  onClick?:      () => void;
  type?:         "button" | "submit" | "reset";
  disabled?:     boolean;
}

const BASE =
  "inline-flex items-center gap-1 h-12 px-6 rounded-btn text-sm transition-colors";

type VariantClasses = { enabled: string; disabled: string };

const VARIANTS: Record<ButtonVariant, VariantClasses> = {
  cta: {
    enabled:
      "bg-btn-cta-bg hover:bg-btn-cta-bg-hover active:bg-btn-cta-bg-active text-btn-cta-fg font-bold",
    disabled:
      "bg-btn-cta-bg-disabled text-btn-cta-fg font-bold opacity-40 pointer-events-none cursor-not-allowed",
  },
  primary: {
    enabled:
      "bg-btn-primary-bg hover:bg-btn-primary-bg-hover active:bg-btn-primary-bg-active text-btn-primary-fg font-medium",
    disabled:
      "bg-btn-primary-bg-disabled text-btn-primary-fg-disabled font-medium opacity-40 pointer-events-none cursor-not-allowed",
  },
  secondary: {
    enabled:
      "bg-btn-secondary-bg active:bg-btn-secondary-bg-active border border-btn-secondary-stroke hover:border-btn-secondary-stroke-hover active:border-btn-secondary-stroke-active text-btn-secondary-fg hover:text-btn-secondary-fg-hover active:text-btn-secondary-fg-active font-medium",
    disabled:
      "bg-btn-secondary-bg border border-btn-secondary-stroke-disabled text-btn-secondary-fg-disabled font-medium opacity-40 pointer-events-none cursor-not-allowed",
  },
};

const ALIGN: Record<ButtonAlign, string> = {
  center: "justify-center",
  left:   "justify-start",
};

export function Button({
  href,
  variant  = "primary",
  align    = "center",
  leadingIcon,
  trailingIcon,
  children,
  className = "",
  onClick,
  type     = "button",
  disabled = false,
}: ButtonProps) {
  const variantCls = VARIANTS[variant][disabled ? "disabled" : "enabled"];
  const cls = `${BASE} ${variantCls} ${ALIGN[align]} ${className}`.trim();

  const content = (
    <>
      {leadingIcon  && <span aria-hidden="true" className="shrink-0 flex items-center">{leadingIcon}</span>}
      <span>{children}</span>
      {trailingIcon && <span aria-hidden="true" className="shrink-0 flex items-center">{trailingIcon}</span>}
    </>
  );

  if (href) {
    return (
      <Link
        href={disabled ? "#" : href}
        className={cls}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={cls}
      disabled={disabled}
      aria-disabled={disabled || undefined}
    >
      {content}
    </button>
  );
}
