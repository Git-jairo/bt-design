'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Icon } from '@/design-system/components/Icon';
import { useAiTheme } from '../../theme';
import { AiNav } from '../../AiNav';
import { loadSkills } from '../../loader';
import type { Skill } from '../../loader';

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

const CATEGORY_ICONS: Record<string, Parameters<typeof Icon>[0]['name']> = {
  'Customer Contact': 'chat/Bubble',
  'Customer Intelligence': 'graph/Stable',
  'Legal & Procurement': 'file/FileLock',
  'Compliance': 'shield/Default',
  'Product & CX': 'general/Sparks',
  'Finance': 'general/Euro',
  'Productivity': 'general/Clock',
  'Operations': 'general/Tools',
  'Data & Grid': 'energy/SmartMeter',
  'HR & People': 'profile/ProfileCheck',
};

export default function SkillDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { theme, toggle } = useAiTheme();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [related, setRelated] = useState<Skill[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadSkills().then((skills) => {
      const found = skills.find((s) => s.id.toLowerCase() === slug);
      if (found) {
        setSkill(found);
        document.title = `${found.title} — AI Skills`;
        setRelated(skills.filter((s) => s.category === found.category && s.id !== found.id).slice(0, 3));
      } else {
        setNotFound(true);
      }
    }).catch(console.error);
  }, [slug]);

  return (
    <div
      className="ai-root"
      data-theme={theme}
      style={{ minHeight: '100vh', background: 'var(--ai-bg)', fontFamily: 'var(--font-helix-body, Inter, system-ui, sans-serif)', color: 'var(--ai-fg)' }}
    >
      <AiNav theme={theme} toggle={toggle} backHref="/experiments/ai/skills" backLabel="Skills" />

      <main id="main-content" style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(2rem, 5vw, 4rem) 1.5rem' }}>
        {!skill && !notFound && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'ai-shimmer 1.5s linear infinite' }}>
            <div style={{ height: '24px', width: '120px', borderRadius: '8px', background: 'linear-gradient(90deg, var(--ai-surface) 25%, var(--ai-surface-muted) 50%, var(--ai-surface) 75%)', backgroundSize: '200% auto' }} />
            <div style={{ height: '56px', width: '80%', borderRadius: '8px', background: 'linear-gradient(90deg, var(--ai-surface) 25%, var(--ai-surface-muted) 50%, var(--ai-surface) 75%)', backgroundSize: '200% auto' }} />
            <div style={{ height: '120px', borderRadius: '8px', background: 'linear-gradient(90deg, var(--ai-surface) 25%, var(--ai-surface-muted) 50%, var(--ai-surface) 75%)', backgroundSize: '200% auto' }} />
          </div>
        )}

        {notFound && (
          <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
            <Icon name="feedback/QuestionMark" size={40} />
            <p style={{ fontSize: '1.125rem', color: 'var(--ai-fg-2)', marginTop: '1rem' }}>Skill not found.</p>
            <Link href="/experiments/ai/skills" style={{ color: 'var(--ai-accent-dim)', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to skills</Link>
          </div>
        )}

        {skill && (
          <>
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '2rem', fontSize: '0.8125rem', color: 'var(--ai-fg-3)' }}>
              <Link href="/experiments/ai" style={{ color: 'var(--ai-fg-3)', textDecoration: 'none' }}>AI Accelerator</Link>
              <Icon name="basic-navigation/ChevronRight" size={12} />
              <Link href="/experiments/ai/skills" style={{ color: 'var(--ai-fg-3)', textDecoration: 'none' }}>Skills</Link>
              <Icon name="basic-navigation/ChevronRight" size={12} />
              <span style={{ color: 'var(--ai-fg-2)' }}>{skill.title}</span>
            </nav>

            {/* Header */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${categoryColor(skill.category)}18`,
                  border: `1px solid ${categoryColor(skill.category)}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon name={CATEGORY_ICONS[skill.category] ?? 'chat/Ai'} size={24} />
                </div>
                <div>
                  <span style={{
                    display: 'inline-block',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'white',
                    background: categoryColor(skill.category),
                    borderRadius: '999px',
                    padding: '0.2rem 0.65rem',
                    marginBottom: '0.25rem',
                  }}>
                    {skill.category}
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--ai-fg-3)', margin: 0 }}>{skill.id}</p>
                </div>
              </div>

              <h1 style={{
                fontSize: 'clamp(1.75rem, 5vw, 3rem)',
                fontWeight: 700,
                color: 'var(--ai-fg)',
                margin: '0 0 1.25rem',
                fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
                textTransform: 'uppercase',
                letterSpacing: '-0.01em',
                lineHeight: 1.05,
              }}>
                {skill.title}
              </h1>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ai-fg-2)', background: 'var(--ai-surface-muted)', borderRadius: '999px', padding: '0.3rem 0.75rem', border: '1px solid var(--ai-border)' }}>
                  {skill.expertise}
                </span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ai-fg-2)', background: 'var(--ai-surface-muted)', borderRadius: '999px', padding: '0.3rem 0.75rem', border: '1px solid var(--ai-border)' }}>
                  {skill.role}
                </span>
              </div>

              <p style={{ fontSize: '1.0625rem', color: 'var(--ai-fg-2)', lineHeight: 1.7, margin: 0, maxWidth: '620px' }}>
                {skill.description}
              </p>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
              <a
                href={skill.claudeEnterpriseLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  color: 'white',
                  background: categoryColor(skill.category),
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem 1.5rem',
                  textDecoration: 'none',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              >
                <Icon name="iconographic-navigation/ExternalLink" size={16} />
                Open in Claude Enterprise
              </a>
              <a
                href={skill.feedbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--ai-fg-2)',
                  background: 'var(--ai-surface)',
                  border: '1px solid var(--ai-border)',
                  borderRadius: '10px',
                  padding: '0.75rem 1.5rem',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border-medium)'; (e.currentTarget as HTMLElement).style.color = 'var(--ai-fg)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--ai-fg-2)'; }}
              >
                <Icon name="chat/BubbleThumbsUp" size={16} />
                Give feedback
              </a>
            </div>

            {/* Related skills */}
            {related.length > 0 && (
              <div style={{ borderTop: '1px solid var(--ai-border)', paddingTop: '2rem' }}>
                <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ai-fg-3)', margin: '0 0 1rem' }}>
                  More in {skill.category}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      href={`/experiments/ai/skills/${r.id.toLowerCase()}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.875rem 1rem',
                        background: 'var(--ai-surface)',
                        border: '1px solid var(--ai-border)',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border-medium)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border)')}
                    >
                      <div>
                        <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ai-fg)', margin: 0 }}>{r.title}</p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)', margin: 0 }}>{r.expertise} · {r.role}</p>
                      </div>
                      <Icon name="basic-navigation/ChevronRight" size={16} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
