"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "Icons", href: "/icons" },
  { label: "Illustrations", href: "/illustrations" },
  { label: "Images", href: "/images" },
  { label: "Docs", href: "/docs" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "HLX26", href: "/hackathon26" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      role="banner"
      className={`fixed top-0 inset-x-0 z-50 transition-[background-color,box-shadow] duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(36,36,36,0.07)]"
          : "bg-transparent"
      }`}
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-[1152px] mx-auto h-16 flex items-center justify-between gap-6">

        {/* Left: wordmark + nav links */}
        <div className="flex items-center gap-8">

          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium text-ink/55 hover:text-ink transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: external icon links + hamburger */}
        <div className="flex items-center gap-3">
          {/* Figma */}
          <a
            href="https://figma.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open in Figma"
            className="hidden md:flex group w-8 h-8 items-center justify-center"
          >
            <span className="relative w-8 h-8 block">
              <Image
                src="/logos/Figma.svg"
                alt="Figma"
                width={32}
                height={32}
                className="absolute inset-0 opacity-100 group-hover:opacity-0 transition-opacity duration-150"
              />
              <Image
                src="/logos/Figma _ Hover.svg"
                alt=""
                width={32}
                height={32}
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              />
            </span>
          </a>

          {/* Budget Thuis website */}
          <a
            href="https://www.budgetthuis.nl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Budget Thuis website"
            className="hidden md:flex group w-8 h-8 items-center justify-center"
          >
            <span className="relative w-8 h-8 block">
              <Image
                src="/logos/Budget Thuis.svg"
                alt="Budget Thuis"
                width={32}
                height={32}
                className="absolute inset-0 opacity-100 group-hover:opacity-0 transition-opacity duration-150"
              />
              <Image
                src="/logos/Budget Thuis _ Hover.svg"
                alt=""
                width={32}
                height={32}
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              />
            </span>
          </a>

          {/* Hamburger (mobile) */}
          <button
            className="md:hidden flex flex-col gap-[5px] p-1"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span
              className={`block w-5 h-px bg-ink transition-transform duration-200 origin-center ${
                menuOpen ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`block w-5 h-px bg-ink transition-opacity duration-200 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-px bg-ink transition-transform duration-200 origin-center ${
                menuOpen ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            aria-label="Mobile navigation"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden bg-white border-t border-ink/5"
          >
            <ul className="px-6 py-5 flex flex-col gap-4">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="block text-sm font-medium text-ink/70 hover:text-ink transition-colors py-1"
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li className="flex gap-4 pt-2 border-t border-ink/6">
                <a href="https://figma.com" target="_blank" rel="noopener noreferrer" className="text-sm text-ink/50 hover:text-ink transition-colors">Figma</a>
                <a href="https://www.budgetthuis.nl" target="_blank" rel="noopener noreferrer" className="text-sm text-ink/50 hover:text-ink transition-colors">Budget Thuis</a>
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
