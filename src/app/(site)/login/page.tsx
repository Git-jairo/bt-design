"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      setError(true);
      setPassword("");
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="flex flex-col items-center gap-10">
        <Image
          src="/logos/BudgetThuis.svg"
          alt="Budget Thuis"
          width={220}
          height={220}
          priority
          style={{ width: "auto", height: "auto" }}
        />

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className={`h-12 w-72 px-4 rounded-xl border text-sm text-fg outline-none transition-colors
              ${error
                ? "border-red-400 bg-red-50 placeholder-red-300"
                : "border-border-subtle bg-card placeholder-fg/30 focus:border-border-medium"
              }`}
          />
          <button
            type="submit"
            disabled={loading || password.length === 0}
            className="h-12 w-12 rounded-xl bg-fg text-fg-inverse flex items-center justify-center disabled:opacity-30 hover:bg-fg/80 transition-colors"
            aria-label="Submit"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
