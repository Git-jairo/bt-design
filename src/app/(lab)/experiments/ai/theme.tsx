'use client';

import { useState, useCallback } from 'react';

export type AiTheme = 'light' | 'dark';

export function useAiTheme() {
  const [theme, setTheme] = useState<AiTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('ai-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      localStorage.setItem('ai-theme', next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
