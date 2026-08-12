'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/design-system/components/Icon';
import { useAiTheme } from './theme';
import { AiNav } from './AiNav';
import { loadSkills, loadCases, parseDataSection } from './loader';
import type { Skill, CaseStudy } from './loader';

// ── Analytics ─────────────────────────────────────────────────────────────────
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
declare global { interface Window { gtag?: (...args: unknown[]) => void; } }
function track(event: string, params?: Record<string, string | number>) {
  if (!GA_ID || typeof window === 'undefined') return;
  window.gtag?.('event', event, { ...params, send_to: GA_ID });
}

// ── Shared helpers ────────────────────────────────────────────────────────────
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
};
function categoryColor(cat: string) { return CATEGORY_COLORS[cat] ?? '#029B77'; }

const GRADIENTS = [
  'linear-gradient(135deg, #EBF2E8 0%, #C8DFC2 100%)',
  'linear-gradient(135deg, #E8F5F0 0%, #B8DDD4 100%)',
  'linear-gradient(135deg, #E8EBF5 0%, #C2C8DC 100%)',
  'linear-gradient(135deg, #F5EBE8 0%, #DCC8C2 100%)',
  'linear-gradient(135deg, #F0F5E8 0%, #D4DCC2 100%)',
];
function gradientForId(id: string) {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

// ── CoE news items ────────────────────────────────────────────────────────────
const NEWS = [
  {
    id: 'N1',
    date: 'June 2026',
    title: '50 Claude Enterprise licences confirmed for Budget Thuis',
    body: 'The AI CoE has secured a 50-seat Claude Enterprise rollout for Q3 2026. Priority allocation goes to KCC, Legal, and Finance teams. Onboarding kicks off 1 July.',
  },
  {
    id: 'N2',
    date: 'May 2026',
    title: 'AI Accelerator cohort 1 results: 8 live pilots, 3 in production',
    body: 'The first structured accelerator cohort wrapped up with 8 pilots across 5 teams, three of which are now in production with measurable ROI. Cohort 2 applications open next week.',
  },
];

// ── Featured skill card ───────────────────────────────────────────────────────
function FeaturedSkillCard({ skill }: { skill: Skill }) {
  const color = categoryColor(skill.category);
  return (
    <Link
      href={`/experiments/ai/skills/${skill.id.toLowerCase()}`}
      onClick={() => track('skill_click', { skill_id: skill.id, action: 'hub_card' })}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        background: 'var(--ai-surface)',
        border: '1px solid var(--ai-border)',
        borderRadius: '16px',
        padding: '1.25rem',
        textDecoration: 'none',
        transition: 'border-color 0.15s',
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
          padding: '0.2rem 0.6rem',
        }}>
          {skill.category}
        </span>
        <Icon name="basic-navigation/ChevronRight" size={16} />
      </div>
      <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ai-fg)', margin: 0, lineHeight: 1.25 }}>
        {skill.title}
      </p>
      <p style={{ fontSize: '0.875rem', color: 'var(--ai-fg-2)', lineHeight: 1.6, margin: 0, flex: 1 }}>
        {skill.description}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', paddingTop: '0.5rem', borderTop: '1px solid var(--ai-border)' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ai-fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {skill.expertise}
        </span>
        <span style={{ color: 'var(--ai-border-medium)', fontSize: '0.75rem' }}>·</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--ai-fg-3)' }}>{skill.role}</span>
      </div>
    </Link>
  );
}

// ── Featured case card ────────────────────────────────────────────────────────
function FeaturedCaseCard({ c }: { c: CaseStudy }) {
  const data = parseDataSection(c.datasection);
  const teamPrefix = c.id.split('-')[0];
  const color = categoryColor(c.author);

  return (
    <Link
      href={`/experiments/ai/cases/${c.id.toLowerCase()}`}
      onClick={() => track('case_view', { case_id: c.id, source: 'hub_featured' })}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '2rem',
        background: 'var(--ai-surface)',
        border: '1px solid var(--ai-border)',
        borderRadius: '20px',
        padding: '2rem',
        textDecoration: 'none',
        transition: 'border-color 0.15s',
        alignItems: 'start',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border-medium)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border)')}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{
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
          <span style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)' }}>{c.author} · {c.date}</span>
        </div>
        <h3 style={{
          fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
          fontWeight: 700,
          color: 'var(--ai-fg)',
          margin: '0 0 0.75rem',
          fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
          textTransform: 'uppercase',
          letterSpacing: '0.01em',
          lineHeight: 1.1,
        }}>
          {c.title}
        </h3>
        <p style={{ fontSize: '0.9375rem', color: 'var(--ai-fg-2)', lineHeight: 1.65, margin: '0 0 1.25rem' }}>
          {c.introduction}
        </p>
        {data?.impact && (
          <p style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--ai-accent-dim)',
            margin: 0,
            padding: '0.75rem 1rem',
            background: 'var(--ai-accent-bg)',
            borderRadius: '10px',
            border: '1px solid var(--ai-accent-border)',
          }}>
            {data.impact}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--ai-fg-3)', fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
        Read case
        <Icon name="basic-navigation/ChevronRight" size={16} />
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AIHubPage() {
  const { theme, toggle } = useAiTheme();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [cases, setCases] = useState<CaseStudy[]>([]);

  useEffect(() => {
    document.title = 'AI Accelerator — BudgetThuis.Design';
    Promise.all([loadSkills(), loadCases()])
      .then(([s, c]) => { setSkills(s); setCases(c); })
      .catch(console.error);
  }, []);

  useEffect(() => { track('page_view', { page: 'ai_hub' }); }, []);

  const featuredSkills = skills.slice(0, 3);
  const featuredCase = cases[0] ?? null;

  return (
    <div
      className="ai-root"
      data-theme={theme}
      style={{
        minHeight: '100vh',
        background: 'var(--ai-bg)',
        fontFamily: 'var(--font-helix-body, Inter, system-ui, sans-serif)',
        color: 'var(--ai-fg)',
      }}
    >
      <AiNav theme={theme} toggle={toggle} />

      <main id="main-content">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section
          aria-label="AI Accelerator overview"
          style={{
            padding: 'clamp(3rem, 8vw, 6rem) 1.5rem clamp(2rem, 5vw, 4rem)',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <p style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'var(--ai-accent-dim)',
            margin: '0 0 1rem',
            animation: 'ai-fade-up 0.4s ease both',
          }}>
            AI CoE · Budget Thuis
          </p>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 5.5rem)',
            fontWeight: 700,
            margin: '0 0 1.25rem',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
            textTransform: 'uppercase',
            color: 'var(--ai-fg)',
            animation: 'ai-fade-up 0.4s 0.08s ease both',
            animationFillMode: 'backwards',
          }}>
            AI<br />Accelerator
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.125rem)',
            color: 'var(--ai-fg-2)',
            maxWidth: '480px',
            lineHeight: 1.65,
            margin: '0 0 2.5rem',
            animation: 'ai-fade-up 0.4s 0.16s ease both',
            animationFillMode: 'backwards',
          }}>
            The internal hub for AI skills, case studies, and governance at Budget Thuis.
          </p>

          {/* Stats */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
            animation: 'ai-fade-up 0.4s 0.24s ease both',
            animationFillMode: 'backwards',
          }}>
            {[
              { value: skills.length || 12, label: 'Skills', icon: 'chat/Ai' as const, href: '/experiments/ai/skills' },
              { value: cases.length || 14, label: 'Case studies', icon: 'general/Presentation' as const, href: '/experiments/ai/cases' },
              { value: 5, label: 'Teams active', icon: 'general/Group' as const, href: undefined },
            ].map((stat) => (
              stat.href ? (
                <Link key={stat.label} href={stat.href} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1.25rem',
                  background: 'var(--ai-surface)',
                  border: '1px solid var(--ai-border)',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border-medium)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border)')}
                >
                  <Icon name={stat.icon} size={20} />
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ai-fg)', lineHeight: 1, fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)' }}>{stat.value}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-2)' }}>{stat.label}</span>
                </Link>
              ) : (
                <div key={stat.label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1.25rem',
                  background: 'var(--ai-surface)',
                  border: '1px solid var(--ai-border)',
                  borderRadius: '12px',
                }}>
                  <Icon name={stat.icon} size={20} />
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ai-fg)', lineHeight: 1, fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)' }}>{stat.value}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-2)' }}>{stat.label}</span>
                </div>
              )
            ))}
          </div>
        </section>

        {/* ── News ──────────────────────────────────────────────────────── */}
        <section
          aria-label="CoE News"
          style={{
            borderTop: '1px solid var(--ai-border)',
            background: 'var(--ai-bg-alt)',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(2rem, 5vw, 4rem) 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon name="feedback/LoudSpeaker" size={18} />
                <h2 style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--ai-fg-3)',
                  margin: 0,
                }}>
                  From the CoE
                </h2>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {NEWS.map((item, i) => (
                <article
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr',
                    gap: '1.25rem',
                    padding: '1.25rem 0',
                    borderBottom: i < NEWS.length - 1 ? '1px solid var(--ai-border)' : 'none',
                    alignItems: 'start',
                  }}
                >
                  <time style={{ fontSize: '0.75rem', color: 'var(--ai-fg-3)', paddingTop: '0.125rem' }}>
                    {item.date}
                  </time>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ai-fg)', margin: '0 0 0.375rem', lineHeight: 1.3 }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--ai-fg-2)', lineHeight: 1.6, margin: 0 }}>
                      {item.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Skills teaser ─────────────────────────────────────────────── */}
        <section
          aria-label="AI Skills"
          style={{ borderTop: '1px solid var(--ai-border)' }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(2rem, 5vw, 4rem) 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Icon name="chat/Ai" size={18} />
                  <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ai-fg-3)', margin: 0 }}>
                    AI Skills
                  </p>
                </div>
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                  fontWeight: 700,
                  color: 'var(--ai-fg)',
                  margin: 0,
                  fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.05,
                }}>
                  What we can do
                </h2>
              </div>
              <Link
                href="/experiments/ai/skills"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--ai-fg-2)',
                  textDecoration: 'none',
                  padding: '0.5rem 0.875rem',
                  border: '1px solid var(--ai-border)',
                  borderRadius: '8px',
                  transition: 'border-color 0.15s, color 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border-medium)'; (e.currentTarget as HTMLElement).style.color = 'var(--ai-fg)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--ai-fg-2)'; }}
              >
                All {skills.length || 12} skills
                <Icon name="basic-navigation/ChevronRight" size={14} />
              </Link>
            </div>

            {featuredSkills.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {featuredSkills.map((skill) => (
                  <FeaturedSkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{ height: '200px', borderRadius: '16px', background: 'linear-gradient(90deg, var(--ai-surface) 25%, var(--ai-surface-muted) 50%, var(--ai-surface) 75%)', backgroundSize: '200% auto', animation: 'ai-shimmer 1.5s linear infinite' }} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Featured case ─────────────────────────────────────────────── */}
        <section
          aria-label="Featured case study"
          style={{ borderTop: '1px solid var(--ai-border)', background: 'var(--ai-bg-alt)' }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(2rem, 5vw, 4rem) 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Icon name="general/Presentation" size={18} />
                  <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ai-fg-3)', margin: 0 }}>
                    Case Studies
                  </p>
                </div>
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                  fontWeight: 700,
                  color: 'var(--ai-fg)',
                  margin: 0,
                  fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.05,
                }}>
                  Results in the wild
                </h2>
              </div>
              <Link
                href="/experiments/ai/cases"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--ai-fg-2)',
                  textDecoration: 'none',
                  padding: '0.5rem 0.875rem',
                  border: '1px solid var(--ai-border)',
                  borderRadius: '8px',
                  transition: 'border-color 0.15s, color 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border-medium)'; (e.currentTarget as HTMLElement).style.color = 'var(--ai-fg)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--ai-fg-2)'; }}
              >
                All {cases.length || 14} cases
                <Icon name="basic-navigation/ChevronRight" size={14} />
              </Link>
            </div>

            {featuredCase ? (
              <FeaturedCaseCard c={featuredCase} />
            ) : (
              <div style={{ height: '180px', borderRadius: '20px', background: 'linear-gradient(90deg, var(--ai-surface) 25%, var(--ai-surface-muted) 50%, var(--ai-surface) 75%)', backgroundSize: '200% auto', animation: 'ai-shimmer 1.5s linear infinite' }} />
            )}
          </div>
        </section>
        {/* ── Blueprint CTA ─────────────────────────────────────────────── */}
        <section aria-label="Blueprint proposal" style={{ borderTop: '1px solid var(--ai-border)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(2rem, 5vw, 4rem) 1.5rem' }}>
            <Link
              href="/experiments/ai/proposal"
              onClick={() => track('case_view', { case_id: 'proposal', source: 'hub_cta' })}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '1.5rem',
                alignItems: 'center',
                background: 'var(--ai-surface-inverted)',
                color: 'var(--ai-fg-inverse)',
                borderRadius: '20px',
                padding: 'clamp(1.5rem, 4vw, 2.5rem)',
                textDecoration: 'none',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div aria-hidden style={{
                position: 'absolute', top: '-40%', right: '-5%', width: '320px', height: '320px',
                borderRadius: '999px', background: 'var(--ai-blob-1)', filter: 'blur(80px)',
              }} />
              <div style={{ position: 'relative' }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ai-accent)', margin: '0 0 0.75rem' }}>
                  Blueprint · Draft proposal
                </p>
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 700, margin: '0 0 0.6rem',
                  fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
                  textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.05,
                }}>
                  How it all fits together
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--ai-fg-inverse)', opacity: 0.7, lineHeight: 1.6, margin: 0, maxWidth: '520px' }}>
                  The operating model behind this hub — skills in Claude, discovery on BudgetThuis.AI,
                  hosted in SharePoint. Read the one-pager.
                </p>
              </div>
              <span style={{
                position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.875rem', fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--ai-accent)',
              }}>
                View blueprint
                <Icon name="basic-navigation/ChevronRight" size={16} />
              </span>
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid var(--ai-border)',
          padding: '2rem 1.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <p style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)', margin: 0 }}>
          AI Accelerator · Budget Thuis
        </p>
        <nav aria-label="Footer navigation" style={{ display: 'flex', gap: '1.25rem' }}>
          <Link href="/experiments/ai/skills" style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)', textDecoration: 'none' }}>Skills</Link>
          <Link href="/experiments/ai/cases" style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)', textDecoration: 'none' }}>Cases</Link>
          <Link href="/experiments/ai/proposal" style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)', textDecoration: 'none' }}>Blueprint</Link>
          <Link href="/experiments" style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)', textDecoration: 'none' }}>The Lab</Link>
        </nav>
      </footer>
    </div>
  );
}
