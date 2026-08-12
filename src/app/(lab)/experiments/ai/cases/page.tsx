'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/design-system/components/Icon';
import { useAiTheme } from '../theme';
import { AiNav } from '../AiNav';
import { loadCases, parseDataSection } from '../loader';
import type { CaseStudy } from '../loader';

const CATEGORY_COLORS: Record<string, string> = {
  'Customer Contact': '#029B77',
  'Customer Intelligence': '#006B50',
  'Legal & Procurement': '#5E5F8C',
  'Compliance': '#7277DD',
  'Product & CX': '#00A85A',
  'Finance': '#0098D9',
  'Productivity': '#C28A00',
  'Operations': '#C45430',
  'Data & Grid': '#1A9E80',
  'HR & People': '#C4734A',
  'KCC Team': '#029B77',
  'KCC Quality Team': '#1A9E80',
  'KCC Platform Team': '#006B50',
  'KCC Learning Team': '#5E5F8C',
  'Data & Grid Team': '#1A9E80',
  'Customer Intelligence Team': '#006B50',
  'Legal & Procurement Team': '#5E5F8C',
  'Operations & CX Team': '#C45430',
  'Product & Data Team': '#00A85A',
  'Regulatory & Compliance Team': '#7277DD',
  'Finance Team': '#0098D9',
  'HR & People Team': '#C4734A',
  'Grid & Energy Trading Team': '#029B77',
  'Product & Operations Team': '#C28A00',
  'Energy Product Team': '#029B77',
  'Mobile Product Team': '#7277DD',
  'Internet Product Team': '#0098D9',
};
function teamColor(author: string) { return CATEGORY_COLORS[author] ?? '#029B77'; }

const TEMPLATE_LABELS: Record<string, string> = { A: 'Split', B: 'Feature', C: 'Data', D: 'Editorial' };

const STORY_PRODUCT_LABELS: Record<string, string> = {
  energy: 'Energy',
  sim: 'Sim Only',
  fiber: 'Internet',
};

// Featured card for the immersive 3D product stories.
function StoryCard({ c }: { c: CaseStudy }) {
  const product = c.templateVariant.split(':')[1] ?? '';
  return (
    <Link
      href={`/experiments/ai/cases/${c.id.toLowerCase()}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        minHeight: '230px',
        padding: '1.75rem',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, var(--ai-accent-bg) 0%, var(--ai-surface) 65%)',
        border: '1px solid var(--ai-accent-border)',
        textDecoration: 'none',
        transition: 'transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-3px)';
        el.style.boxShadow = 'var(--ai-card-hover)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'none';
        el.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ai-fg-inverse)',
          background: 'var(--ai-accent-dim)',
          borderRadius: '999px',
          padding: '0.2rem 0.65rem',
        }}>
          {STORY_PRODUCT_LABELS[product] ?? product}
        </span>
        <span style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ai-accent-dim)',
          border: '1px solid var(--ai-accent-border)',
          borderRadius: '999px',
          padding: '0.2rem 0.65rem',
        }}>
          3D scroll story
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
          fontWeight: 700,
          color: 'var(--ai-fg)',
          margin: '0 0 0.5rem',
          lineHeight: 1.0,
          fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
        }}>
          {c.title}
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--ai-fg-2)', lineHeight: 1.6, margin: 0 }}>
          {c.introduction.length > 140 ? c.introduction.slice(0, 140) + '…' : c.introduction}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--ai-accent-dim)', fontSize: '0.875rem', fontWeight: 600 }}>
        Follow the journey
        <Icon name="basic-navigation/ChevronRight" size={14} />
      </div>
    </Link>
  );
}

function CaseCard({ c }: { c: CaseStudy }) {
  const data = parseDataSection(c.datasection);
  const color = teamColor(c.author);
  const teamPrefix = c.id.split('-')[0];

  return (
    <Link
      href={`/experiments/ai/cases/${c.id.toLowerCase()}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        background: 'var(--ai-surface)',
        border: '1px solid var(--ai-border)',
        borderRadius: '16px',
        padding: '1.5rem',
        textDecoration: 'none',
        transition: 'border-color 0.15s',
        height: '100%',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border-medium)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          display: 'inline-block',
          fontSize: '0.6875rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'white',
          background: color,
          borderRadius: '999px',
          padding: '0.2rem 0.65rem',
        }}>
          {teamPrefix}
        </span>
        <span style={{
          fontSize: '0.6875rem',
          fontWeight: 500,
          color: 'var(--ai-fg-3)',
          border: '1px solid var(--ai-border)',
          borderRadius: '999px',
          padding: '0.15rem 0.5rem',
        }}>
          {c.templateVariant.startsWith('3D') ? '3D Story' : (TEMPLATE_LABELS[c.templateVariant] ?? 'A')}
        </span>
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)', margin: '0 0 0.25rem' }}>
          {c.author} · {c.date}
        </p>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--ai-fg)',
          margin: '0 0 0.5rem',
          lineHeight: 1.2,
          fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
          textTransform: 'uppercase',
          letterSpacing: '0.01em',
        }}>
          {c.title}
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--ai-fg-2)', lineHeight: 1.6, margin: 0 }}>
          {c.introduction.length > 120 ? c.introduction.slice(0, 120) + '…' : c.introduction}
        </p>
      </div>

      {data?.impact && (
        <p style={{
          fontSize: '0.8125rem',
          color: 'var(--ai-accent-dim)',
          margin: 0,
          padding: '0.5rem 0.75rem',
          background: 'var(--ai-accent-bg)',
          borderRadius: '8px',
          border: '1px solid var(--ai-accent-border)',
          lineHeight: 1.45,
          fontWeight: 500,
        }}>
          {data.impact}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.375rem', color: 'var(--ai-fg-3)', fontSize: '0.8125rem', fontWeight: 600 }}>
        Read case
        <Icon name="basic-navigation/ChevronRight" size={14} />
      </div>
    </Link>
  );
}

export default function CasesPage() {
  const { theme, toggle } = useAiTheme();
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Case Studies — AI Accelerator';
    loadCases()
      .then(setCases)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stories = cases.filter((c) => c.templateVariant.startsWith('3D'));
  const regular = cases.filter((c) => !c.templateVariant.startsWith('3D'));

  return (
    <div
      className="ai-root"
      data-theme={theme}
      style={{ minHeight: '100vh', background: 'var(--ai-bg)', fontFamily: 'var(--font-helix-body, Inter, system-ui, sans-serif)', color: 'var(--ai-fg)' }}
    >
      <AiNav theme={theme} toggle={toggle} backHref="/experiments/ai" backLabel="AI Accelerator" />

      <main id="main-content">
        <div style={{ borderBottom: '1px solid var(--ai-border)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(2rem, 5vw, 4rem) 1.5rem 1.5rem' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ai-fg-3)', margin: '0 0 0.5rem' }}>
              AI Accelerator
            </p>
            <h1 style={{
              fontSize: 'clamp(2rem, 6vw, 4rem)',
              fontWeight: 700,
              margin: '0 0 0.75rem',
              lineHeight: 1,
              fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
              textTransform: 'uppercase',
              color: 'var(--ai-fg)',
              letterSpacing: '-0.01em',
            }}>
              Case Studies
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--ai-fg-2)', margin: 0, maxWidth: '480px', lineHeight: 1.6 }}>
              Real AI projects at Budget Thuis — what we built, what we learned, and what it cost or saved.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: '260px', borderRadius: '16px', background: 'linear-gradient(90deg, var(--ai-surface) 25%, var(--ai-surface-muted) 50%, var(--ai-surface) 75%)', backgroundSize: '200% auto', animation: 'ai-shimmer 1.5s linear infinite' }} />
              ))}
            </div>
          ) : (
            <>
              {stories.length > 0 && (
                <section aria-label="Product stories" style={{ marginBottom: '2.5rem' }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    margin: '0 0 0.25rem',
                    fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
                    textTransform: 'uppercase',
                    color: 'var(--ai-fg)',
                  }}>
                    Product Stories
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: 'var(--ai-fg-2)', margin: '0 0 1.25rem' }}>
                    Scroll-driven 3D journeys through our three products — energy, mobile, and internet.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {stories.map((c) => (
                      <StoryCard key={c.id} c={c} />
                    ))}
                  </div>
                </section>
              )}

              <p style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)', margin: '0 0 1.25rem' }}>
                {`${regular.length} case stud${regular.length !== 1 ? 'ies' : 'y'}`}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {regular.map((c) => (
                  <CaseCard key={c.id} c={c} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--ai-border)', padding: '1.5rem', textAlign: 'center' }}>
        <Link href="/experiments/ai" style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)', textDecoration: 'none' }}>
          ← AI Accelerator
        </Link>
      </footer>
    </div>
  );
}
