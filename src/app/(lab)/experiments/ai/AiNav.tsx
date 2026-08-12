'use client';

import Link from 'next/link';
import { Icon } from '@/design-system/components/Icon';
import type { AiTheme } from './theme';

interface AiNavProps {
  theme: AiTheme;
  toggle: () => void;
  backHref?: string;
  backLabel?: string;
}

export function AiNav({ theme, toggle, backHref = '/experiments', backLabel = 'The Lab' }: AiNavProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--ai-bg)',
        borderBottom: '1px solid var(--ai-border)',
      }}
    >
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = '1rem';
          e.currentTarget.style.top = '1rem';
          e.currentTarget.style.width = 'auto';
          e.currentTarget.style.height = 'auto';
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = '-9999px';
          e.currentTarget.style.width = '1px';
          e.currentTarget.style.height = '1px';
        }}
      >
        Skip to content
      </a>
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
          gap: '1rem',
        }}
      >
        <Link
          href={backHref}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            textDecoration: 'none',
            color: 'var(--ai-fg-2)',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <Icon name="basic-navigation/ChevronLeft" size={16} />
          {backLabel}
        </Link>

        <Link
          href="/experiments/ai"
          style={{
            textDecoration: 'none',
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: 'var(--ai-fg)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          AI Accelerator
        </Link>

        <button
          onClick={toggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          style={{
            background: 'none',
            border: '1px solid var(--ai-border)',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--ai-fg-2)',
            flexShrink: 0,
          }}
        >
          <Icon name={theme === 'dark' ? 'energy/Sun' : 'energy/Moon'} size={18} />
        </button>
      </div>
    </header>
  );
}
