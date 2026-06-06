import type { Metadata } from "next";
import "./globals.css";
import { SmoothScroll } from "@/design-system/components/SmoothScroll";

export const metadata: Metadata = {
  title: "Budget Thuis Design",
  description: "Lets design better products, together.",
  icons: {
    icon: "/logos/Budget-Thuis.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
