import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anonymize — The Lab",
  description:
    "Detect and redact personal data in a single file, entirely in your browser, before you upload it anywhere else.",
};

export default function AnonymizeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
