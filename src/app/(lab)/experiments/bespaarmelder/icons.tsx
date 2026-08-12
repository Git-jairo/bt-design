/** Minimal inline stroke icons (24×24) keyed by name. No external deps. */
import type { JSX } from "react";

const s = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const ICONS: Record<string, JSX.Element> = {
  qr: (
    <svg viewBox="0 0 24 24" {...s}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3M21 14v7M17 21h-3M21 21h-1" />
    </svg>
  ),
  ad: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M3 11v2a1 1 0 0 0 1 1h2l4 3V7L6 10H4a1 1 0 0 0-1 1Z" />
      <path d="M14 8a5 5 0 0 1 0 8M16.5 5.5a8 8 0 0 1 0 13" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" {...s}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </svg>
  ),
  "user-plus": (
    <svg viewBox="0 0 24 24" {...s}>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0M18 8v6M15 11h6" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" {...s}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  ),
  smartphone: (
    <svg viewBox="0 0 24 24" {...s}>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  ),
  repeat: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M17 3l3 3-3 3" />
      <path d="M20 6H8a4 4 0 0 0-4 4v1" />
      <path d="M7 21l-3-3 3-3" />
      <path d="M4 18h12a4 4 0 0 0 4-4v-1" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M3 12h4l2.5 7 5-14L17 12h4" />
    </svg>
  ),
  sparkles: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5 10.2 7.7 12 3Z" />
      <path d="M18.5 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
    </svg>
  ),
  database: (
    <svg viewBox="0 0 24 24" {...s}>
      <ellipse cx="12" cy="5.5" rx="8" ry="3" />
      <path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" {...s}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
      <path d="M8 10h8M8 13h5" />
    </svg>
  ),
  headset: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="3" y="13" width="4" height="6" rx="1.5" />
      <rect x="17" y="13" width="4" height="6" rx="1.5" />
      <path d="M20 19a4 4 0 0 1-4 4h-3" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" {...s}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M6 3h3l1.5 4.5L8 9a12 12 0 0 0 7 7l1.5-2.5L21 15v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M7 4.5v15l13-7.5-13-7.5Z" />
    </svg>
  ),
  pause: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M8 4v16M16 4v16" />
    </svg>
  ),
  next: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M6 5l9 7-9 7V5ZM18 5v14" />
    </svg>
  ),
  restart: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="m5 12 4.5 4.5L19 7" />
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M13 3 5 13h6l-2 8 8-10h-6l2-8Z" />
    </svg>
  ),
};

export function Icon({ name }: { name: string }) {
  return ICONS[name] ?? ICONS.database;
}
