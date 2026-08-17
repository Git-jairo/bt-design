import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";

/**
 * Open Sans is the Mijn Omgeving body face (Figma variable
 * `typography/body/md/family`). It isn't part of the Helix design system, so
 * it's loaded here — scoped to this experiment — rather than site-wide. The
 * display face (Budget Greet Narrow) and Inter are already self-hosted by
 * design-system/tokens/primitives.css.
 */
const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dashboard — Mijn Omgeving",
};

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className={openSans.variable}>{children}</div>;
}
