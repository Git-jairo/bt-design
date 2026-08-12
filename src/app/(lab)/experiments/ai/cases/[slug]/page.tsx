'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Icon } from '@/design-system/components/Icon';
import { useAiTheme } from '../../theme';
import { AiNav } from '../../AiNav';
import { loadCases, parseDataSection } from '../../loader';
import type { CaseStudy, DataSection } from '../../loader';
import type { Product } from '../../story3d/shared';

// Three.js story loads on demand so the 3D bundle never touches regular cases.
const Story3D = dynamic(() => import('../../story3d/Story3D'), {
  ssr: false,
  loading: () => <div style={{ height: '100vh' }} />,
});

const PRODUCTS: Product[] = ['energy', 'sim', 'fiber'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const TEAM_COLORS: Record<string, string> = {
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
function teamColor(author: string) { return TEAM_COLORS[author] ?? '#029B77'; }

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

// ── Scroll reveal ─────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(20px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Animated metric number ────────────────────────────────────────────────────
function MetricNumber({ value, label, accent }: { value: string; label: string; accent?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'scale(0.88) translateY(6px)', transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
      <div style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700, color: accent ?? 'var(--ai-fg)', lineHeight: 1, fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)', letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ai-fg-3)', marginTop: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
    </div>
  );
}

// ── Metrics block ─────────────────────────────────────────────────────────────
function MetricsBlock({ data, accent }: { data: DataSection; accent?: string }) {
  const items = [
    data.hoursSaved != null && { value: `${data.hoursSaved.toLocaleString()}h`, label: 'Hours saved' },
    data.processesAutomated != null && { value: `${data.processesAutomated}×`, label: 'Processes' },
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <div>
      {items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: data.impact ? '1.5rem' : 0 }}>
          {items.map((m) => (
            <MetricNumber key={m.label} value={m.value} label={m.label} accent={accent} />
          ))}
        </div>
      )}
      {data.impact && (
        <p style={{
          fontSize: '1.0625rem',
          fontWeight: 500,
          color: 'var(--ai-fg)',
          lineHeight: 1.6,
          margin: 0,
          padding: '1.25rem 1.5rem',
          background: 'var(--ai-accent-bg)',
          border: '1px solid var(--ai-accent-border)',
          borderRadius: '12px',
          borderLeft: `3px solid ${accent ?? 'var(--ai-accent-dim)'}`,
        }}>
          {data.impact}
        </p>
      )}
    </div>
  );
}

// ── Optional image slot (disappears when no URL) ──────────────────────────────
function ImageSlot({ url, alt, aspectRatio = '16/9', gradient }: { url?: string; alt: string; aspectRatio?: string; gradient?: string }) {
  if (!url) return null;
  return (
    <figure
      style={{ margin: 0, borderRadius: '12px', overflow: 'hidden', aspectRatio, background: url ? undefined : gradient }}
      aria-label={alt}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </figure>
  );
}

// ── Story section ─────────────────────────────────────────────────────────────
// ── Template heroes ───────────────────────────────────────────────────────────

function HeroA({ c, gradient, color }: { c: CaseStudy; gradient: string; color: string }) {
  const teamPrefix = c.id.split('-')[0];
  return (
    <section aria-label={`${c.title} hero`} style={{ borderBottom: '1px solid var(--ai-border)', background: 'var(--ai-surface)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(2.5rem, 6vw, 5rem) 1.5rem', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', animation: 'ai-fade-up 0.5s ease both' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'white', background: color, borderRadius: '999px', padding: '0.2rem 0.65rem' }}>
              {teamPrefix}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)' }}>{c.author} · {c.date}</span>
          </div>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            fontWeight: 700,
            color: 'var(--ai-fg)',
            margin: '0 0 1.25rem',
            fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1.0,
            animation: 'ai-fade-up 0.5s 0.08s ease both',
            animationFillMode: 'backwards',
          }}>
            {c.title}
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--ai-fg-2)', lineHeight: 1.65, margin: 0, animation: 'ai-fade-up 0.5s 0.16s ease both', animationFillMode: 'backwards' }}>
            {c.introduction}
          </p>
        </div>
        <div
          aria-hidden
          style={{ aspectRatio: '4/3', borderRadius: '16px', background: c.imageUrl ? undefined : gradient, overflow: 'hidden', flexShrink: 0 }}
        >
          {c.imageUrl && <img src={c.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
      </div>
    </section>
  );
}

function HeroB({ c, gradient, color }: { c: CaseStudy; gradient: string; color: string }) {
  const teamPrefix = c.id.split('-')[0];
  return (
    <section aria-label={`${c.title} hero`} style={{ borderBottom: '1px solid var(--ai-border)' }}>
      <div
        aria-hidden
        style={{ height: 'clamp(200px, 30vh, 320px)', background: c.imageUrl ? undefined : gradient, overflow: 'hidden' }}
      >
        {c.imageUrl && <img src={c.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(2rem, 4vw, 3.5rem) 1.5rem', background: 'var(--ai-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', animation: 'ai-fade-up 0.4s ease both' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'white', background: color, borderRadius: '999px', padding: '0.2rem 0.65rem' }}>
            {teamPrefix}
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)' }}>{c.author} · {c.date}</span>
        </div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 4rem)',
          fontWeight: 700,
          color: 'var(--ai-fg)',
          margin: '0 0 1rem',
          maxWidth: '720px',
          fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
          lineHeight: 1.0,
          animation: 'ai-fade-up 0.4s 0.08s ease both',
          animationFillMode: 'backwards',
        }}>
          {c.title}
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--ai-fg-2)', lineHeight: 1.65, margin: 0, maxWidth: '640px', animation: 'ai-fade-up 0.4s 0.16s ease both', animationFillMode: 'backwards' }}>
          {c.introduction}
        </p>
      </div>
    </section>
  );
}

function HeroC({ c, gradient, color, data }: { c: CaseStudy; gradient: string; color: string; data: DataSection | null }) {
  const teamPrefix = c.id.split('-')[0];
  return (
    <section aria-label={`${c.title} hero`} style={{ background: 'var(--ai-surface)', borderBottom: '1px solid var(--ai-border)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(2.5rem, 6vw, 5rem) 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem', animation: 'ai-fade-up 0.4s ease both' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'white', background: color, borderRadius: '999px', padding: '0.2rem 0.65rem' }}>
            {teamPrefix}
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)' }}>{c.author} · {c.date}</span>
        </div>
        <h1 style={{
          fontSize: 'clamp(2.25rem, 6vw, 4.5rem)',
          fontWeight: 700,
          color: 'var(--ai-fg)',
          margin: '0 0 2rem',
          fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          lineHeight: 1.0,
          animation: 'ai-fade-up 0.4s 0.08s ease both',
          animationFillMode: 'backwards',
        }}>
          {c.title}
        </h1>
        {data && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '3rem', padding: '2rem', background: 'var(--ai-bg)', border: '1px solid var(--ai-border)', borderRadius: '16px', animation: 'ai-fade-up 0.4s 0.16s ease both', animationFillMode: 'backwards' }}>
            {data.hoursSaved != null && <MetricNumber value={`${data.hoursSaved.toLocaleString()}h`} label="Hours saved" accent={color} />}
            {data.processesAutomated != null && <MetricNumber value={`${data.processesAutomated}×`} label="Processes" accent={color} />}
            {data.impact && (
              <div style={{ flex: '1 1 200px', textAlign: 'left', borderLeft: '2px solid var(--ai-border)', paddingLeft: '2rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--ai-fg-2)', lineHeight: 1.6, margin: 0 }}>{data.impact}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function HeroD({ c, color }: { c: CaseStudy; color: string }) {
  const teamPrefix = c.id.split('-')[0];
  return (
    <section aria-label={`${c.title} hero`} style={{ background: 'var(--ai-surface-inverted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(3rem, 7vw, 6rem) 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', animation: 'ai-fade-up 0.5s ease both' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color, border: `1px solid ${color}40`, borderRadius: '999px', padding: '0.2rem 0.65rem' }}>
            {teamPrefix}
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'rgba(238,245,240,0.4)' }}>{c.author} · {c.date}</span>
        </div>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
          fontWeight: 700,
          color: '#EEF5F0',
          margin: '0 0 1.5rem',
          maxWidth: '800px',
          fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          lineHeight: 0.95,
          animation: 'ai-fade-up 0.5s 0.1s ease both',
          animationFillMode: 'backwards',
        }}>
          {c.title}
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'rgba(238,245,240,0.65)', lineHeight: 1.65, margin: 0, maxWidth: '560px', animation: 'ai-fade-up 0.5s 0.2s ease both', animationFillMode: 'backwards' }}>
          {c.introduction}
        </p>
      </div>
    </section>
  );
}

// ── Case navigation ───────────────────────────────────────────────────────────
function CaseNav({ allCases, currentId }: { allCases: CaseStudy[]; currentId: string }) {
  const idx = allCases.findIndex((c) => c.id === currentId);
  const prev = idx > 0 ? allCases[idx - 1] : null;
  const next = idx < allCases.length - 1 ? allCases[idx + 1] : null;
  if (!prev && !next) return null;
  return (
    <nav aria-label="Case navigation" style={{ borderTop: '1px solid var(--ai-border)', background: 'var(--ai-surface)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        {prev ? (
          <Link href={`/experiments/ai/cases/${prev.id.toLowerCase()}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', textDecoration: 'none', padding: '0.875rem 1rem', border: '1px solid var(--ai-border)', borderRadius: '12px', flex: '0 1 300px', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border-medium)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border)')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--ai-fg-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <Icon name="basic-navigation/ChevronLeft" size={12} />
              Previous
            </span>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ai-fg)', lineHeight: 1.2 }}>{prev.title}</span>
          </Link>
        ) : <div />}
        {next && (
          <Link href={`/experiments/ai/cases/${next.id.toLowerCase()}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', textDecoration: 'none', padding: '0.875rem 1rem', border: '1px solid var(--ai-border)', borderRadius: '12px', flex: '0 1 300px', textAlign: 'right', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border-medium)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ai-border)')}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--ai-fg-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Next
              <Icon name="basic-navigation/ChevronRight" size={12} />
            </span>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ai-fg)', lineHeight: 1.2 }}>{next.title}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CaseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { theme, toggle } = useAiTheme();
  const [c, setC] = useState<CaseStudy | null>(null);
  const [allCases, setAllCases] = useState<CaseStudy[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    loadCases().then((cases) => {
      setAllCases(cases);
      const found = cases.find((cs) => cs.id.toLowerCase() === slug);
      if (found) {
        setC(found);
        document.title = `${found.title} — AI Cases`;
      } else {
        setNotFound(true);
      }
    }).catch(console.error);
  }, [slug]);

  if (notFound) {
    return (
      <div className="ai-root" data-theme={theme} style={{ minHeight: '100vh', background: 'var(--ai-bg)', fontFamily: 'var(--font-helix-body, Inter, system-ui, sans-serif)', color: 'var(--ai-fg)' }}>
        <AiNav theme={theme} toggle={toggle} backHref="/experiments/ai/cases" backLabel="Cases" />
        <div style={{ maxWidth: '600px', margin: '6rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <Icon name="feedback/QuestionMark" size={40} />
          <p style={{ fontSize: '1.125rem', color: 'var(--ai-fg-2)', marginTop: '1rem' }}>Case not found.</p>
          <Link href="/experiments/ai/cases" style={{ color: 'var(--ai-accent-dim)', textDecoration: 'none' }}>← Back to cases</Link>
        </div>
      </div>
    );
  }

  if (!c) {
    return (
      <div className="ai-root" data-theme={theme} style={{ minHeight: '100vh', background: 'var(--ai-bg)', fontFamily: 'var(--font-helix-body, Inter, system-ui, sans-serif)', color: 'var(--ai-fg)' }}>
        <AiNav theme={theme} toggle={toggle} backHref="/experiments/ai/cases" backLabel="Cases" />
        <div style={{ maxWidth: '1200px', margin: '4rem auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: i === 0 ? '260px' : '120px', borderRadius: '16px', background: 'linear-gradient(90deg, var(--ai-surface) 25%, var(--ai-surface-muted) 50%, var(--ai-surface) 75%)', backgroundSize: '200% auto', animation: 'ai-shimmer 1.5s linear infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  const rawVariant = c.templateVariant || 'A';
  const storyProduct = rawVariant.startsWith('3D')
    ? (PRODUCTS.find((p) => p === rawVariant.split(':')[1]) ?? null)
    : null;

  // Immersive Three.js scroll story for the flagship product cases.
  // Falls back to the standard layout when the user prefers reduced motion.
  if (storyProduct && !reducedMotion) {
    return (
      <div
        className="ai-root"
        data-theme={theme}
        style={{ minHeight: '100vh', background: 'var(--ai-bg)', fontFamily: 'var(--font-helix-body, Inter, system-ui, sans-serif)', color: 'var(--ai-fg)' }}
      >
        <AiNav theme={theme} toggle={toggle} backHref="/experiments/ai/cases" backLabel="Cases" />
        <main id="main-content">
          <Story3D c={c} product={storyProduct} theme={theme} />
          <CaseNav allCases={allCases} currentId={c.id} />
        </main>
      </div>
    );
  }

  const variant = storyProduct ? 'A' : rawVariant;
  const data = parseDataSection(c.datasection);
  const gradient = gradientForId(c.id);
  const color = teamColor(c.author);
  const isDark = variant === 'D';

  const storyBg = isDark ? 'var(--ai-surface-inverted)' : 'var(--ai-bg)';
  const storyFg = isDark ? '#EEF5F0' : 'var(--ai-fg)';
  const storyFg2 = isDark ? 'rgba(238,245,240,0.65)' : 'var(--ai-fg-2)';
  const storyBorder = isDark ? 'rgba(255,255,255,0.08)' : 'var(--ai-border)';
  const labelColor = isDark ? color : 'var(--ai-fg-3)';

  return (
    <div
      className="ai-root"
      data-theme={theme}
      style={{ minHeight: '100vh', background: 'var(--ai-bg)', fontFamily: 'var(--font-helix-body, Inter, system-ui, sans-serif)', color: 'var(--ai-fg)' }}
    >
      <AiNav theme={theme} toggle={toggle} backHref="/experiments/ai/cases" backLabel="Cases" />

      <main id="main-content">
        {/* Breadcrumb */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem' }}>
          <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--ai-fg-3)' }}>
            <Link href="/experiments/ai" style={{ color: 'var(--ai-fg-3)', textDecoration: 'none' }}>AI Accelerator</Link>
            <Icon name="basic-navigation/ChevronRight" size={12} />
            <Link href="/experiments/ai/cases" style={{ color: 'var(--ai-fg-3)', textDecoration: 'none' }}>Cases</Link>
            <Icon name="basic-navigation/ChevronRight" size={12} />
            <span style={{ color: 'var(--ai-fg-2)' }}>{c.title}</span>
          </nav>
        </div>

        {/* Template-specific hero */}
        {variant === 'A' && <HeroA c={c} gradient={gradient} color={color} />}
        {variant === 'B' && <HeroB c={c} gradient={gradient} color={color} />}
        {variant === 'C' && <HeroC c={c} gradient={gradient} color={color} data={data} />}
        {variant === 'D' && <HeroD c={c} color={color} />}

        {/* Story body */}
        <article
          aria-label="Case study details"
          style={{ background: storyBg }}
        >
          <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'clamp(3rem, 6vw, 5rem) 1.5rem' }}>

            {/* Introduction — skip for template C which shows it in the hero, or for others show a large pull */}
            {(variant === 'A' || variant === 'D') && (
              <Reveal style={{ marginBottom: '4rem' }}>
                <p style={{
                  fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)',
                  color: storyFg2,
                  lineHeight: 1.7,
                  borderLeft: `3px solid ${color}`,
                  paddingLeft: '1.5rem',
                  margin: 0,
                }}>
                  {c.introduction}
                </p>
              </Reveal>
            )}

            {/* Problem */}
            {c.problem && (
              <Reveal delay={50}>
                <section aria-label="Problem" style={{ marginBottom: '4rem' }}>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: labelColor, margin: '0 0 0.875rem' }}>
                    Problem
                  </p>
                  <p style={{ fontSize: '1.0625rem', color: storyFg2, lineHeight: 1.75, margin: 0 }}>
                    {c.problem}
                  </p>
                  {c.problemImage && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <ImageSlot url={c.problemImage} alt={`Problem illustration for ${c.title}`} gradient={gradient} />
                    </div>
                  )}
                </section>
              </Reveal>
            )}

            {/* Hypothesis */}
            {c.hypothesis && c.hypothesis.trim() && (
              <Reveal delay={80}>
                <section aria-label="Hypothesis" style={{ marginBottom: '4rem' }}>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: labelColor, margin: '0 0 0.875rem' }}>
                    Hypothesis
                  </p>
                  <blockquote style={{
                    margin: 0,
                    padding: '1.25rem 1.5rem',
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'var(--ai-surface)',
                    border: `1px solid ${storyBorder}`,
                    borderLeft: `3px solid ${color}`,
                    borderRadius: '0 12px 12px 0',
                  }}>
                    <p style={{ fontSize: '1.0625rem', color: storyFg2, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                      {c.hypothesis}
                    </p>
                  </blockquote>
                </section>
              </Reveal>
            )}

            {/* Approach */}
            {c.approach && (
              <Reveal delay={100}>
                <section aria-label="Approach" style={{ marginBottom: '4rem' }}>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: labelColor, margin: '0 0 0.875rem' }}>
                    Approach
                  </p>
                  <p style={{ fontSize: '1.0625rem', color: storyFg2, lineHeight: 1.75, margin: 0 }}>
                    {c.approach}
                  </p>
                  {c.approachImage && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <ImageSlot url={c.approachImage} alt={`Approach illustration for ${c.title}`} gradient={gradient} />
                    </div>
                  )}
                </section>
              </Reveal>
            )}

            {/* Divider */}
            <div style={{ height: '1px', background: storyBorder, marginBottom: '4rem' }} />

            {/* Outcome */}
            <Reveal delay={120}>
              <section aria-label="Outcome">
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: labelColor, margin: '0 0 0.875rem' }}>
                  Outcome
                </p>
                <p style={{ fontSize: '1.125rem', color: storyFg, lineHeight: 1.7, margin: '0 0 2rem', fontWeight: 500 }}>
                  {c.conclusion}
                </p>

                {c.outcomeImage && (
                  <div style={{ marginBottom: '2rem' }}>
                    <ImageSlot url={c.outcomeImage} alt={`Outcome illustration for ${c.title}`} gradient={gradient} />
                  </div>
                )}

                {/* Metrics — show them here for A/B/D; C already shows in hero */}
                {data && variant !== 'C' && (
                  <div style={{ marginTop: '2rem' }}>
                    <MetricsBlock data={data} accent={color} />
                  </div>
                )}
              </section>
            </Reveal>
          </div>
        </article>

        {/* Next / prev */}
        <CaseNav allCases={allCases} currentId={c.id} />

        {/* Back to cases */}
        <div style={{ borderTop: '1px solid var(--ai-border)', textAlign: 'center', padding: '1.5rem' }}>
          <Link
            href="/experiments/ai/cases"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--ai-fg-3)', textDecoration: 'none' }}
          >
            <Icon name="basic-navigation/ChevronLeft" size={14} />
            All case studies
          </Link>
        </div>
      </main>
    </div>
  );
}
