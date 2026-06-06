import Link from "next/link";

export function Footer() {
  return (
    <footer className="font-helix-body border-t border-ink/[0.07] px-6 py-5">
      <div className="max-w-[1152px] mx-auto flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-sm font-medium text-white/40 hover:text-white transition-colors"
        >
          Home
        </Link>
        <p className="text-xs text-white/30">
          Vibed with ♥ &mdash; &copy; Budget Thuis &rsquo;26
        </p>
      </div>
    </footer>
  );
}
