import Link from "next/link";

/**
 * AssetCard — a full-bleed coloured card linking to a tool or section.
 *
 * theme variants map to semantic token surfaces:
 *  brand     → bg-brand (mint),     fg = action-fg (ink)
 *  brand-dim → bg-brand-dim (teal), fg = white
 *  inverse   → bg-dark (ink),       fg = fg-inverse (screen)
 */

type CardTheme = "brand" | "brand-dim" | "inverse";

interface ThemeConfig {
  bg:      string;
  text:    string;
  dimText: string;
  iconBg:  string;
}

const THEMES: Record<CardTheme, ThemeConfig> = {
  "brand":     { bg: "bg-brand",     text: "text-action-fg",  dimText: "text-action-fg/60",  iconBg: "bg-action-fg/10" },
  "brand-dim": { bg: "bg-brand-dim", text: "text-white",      dimText: "text-white/60",       iconBg: "bg-white/15"     },
  "inverse":   { bg: "bg-dark",      text: "text-fg-inverse", dimText: "text-fg-inverse/50",  iconBg: "bg-fg-inverse/10" },
};

interface AssetCardProps {
  title:       string;
  description: string;
  href:        string;
  theme:       CardTheme;
}

export function AssetCard({ title, description, href, theme }: AssetCardProps) {
  const { bg, text, dimText, iconBg } = THEMES[theme];

  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-card-md p-10 lg:p-12 h-full min-h-72 ${bg} ${text}`}
    >
      <div className={`w-10 h-10 rounded-xl mb-10 ${iconBg}`} />
      <h3 className="font-helix-display text-3xl uppercase leading-tight mb-4">
        {title}
      </h3>
      <p className={`text-sm leading-relaxed ${dimText} mb-10 flex-1`}>
        {description}
      </p>
      <span className="text-sm font-semibold group-hover:underline underline-offset-2 mt-auto">
        About {title} →
      </span>
    </Link>
  );
}
