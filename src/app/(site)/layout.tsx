"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const hideFooter = pathname.includes("/experiments/hackathon26");

  return (
    <>
      {children}
      {!hideFooter && <Footer />}
    </>
  );
}
