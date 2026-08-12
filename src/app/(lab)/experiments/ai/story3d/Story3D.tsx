'use client';

// Immersive 3D scroll story for the flagship product cases.
// A sticky WebGL canvas renders the product journey (energy / sim / fiber)
// while narrative chapters scroll past as glass panels. Scroll progress
// drives the camera rail and scene state; the mouse adds camera parallax.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Lenis from 'lenis';
import type { CaseStudy } from '../loader';
import { parseDataSection } from '../loader';
import { createStoryEngine, type EngineHandle, type Product } from './engine';

const PRODUCT_LABELS: Record<Product, string> = {
  energy: 'Energy',
  sim: 'Sim Only',
  fiber: 'Internet',
};

const PRODUCT_TAGLINES: Record<Product, string> = {
  energy: 'From source to socket',
  sim: 'A signal through the air',
  fiber: 'Light through glass',
};

interface Chapter {
  key: string;
  label: string;
  eyebrow: string;
  text: string;
}

// Rail anchor fractions for hero + four chapters (tuned to section heights).
const RAIL_STOPS = [0, 0.24, 0.46, 0.68, 0.9];

// Max-width container for all narrative content
function Container({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 1.5rem', ...style }}>
      {children}
    </div>
  );
}

// ── Scroll reveal for panels ─────────────────────────────────────────────────
function Reveal({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(28px)',
        transition: 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.22,1,0.36,1)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Animated counter ─────────────────────────────────────────────────────────
function CountUp({ target, format }: { target: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        const t0 = performance.now();
        const dur = 1600;
        const tick = (now: number) => {
          const k = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - k, 3);
          setVal(Math.round(target * eased));
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target]);
  return <span ref={ref}>{format(val)}</span>;
}

// ── Glass panel ──────────────────────────────────────────────────────────────
function Panel({
  eyebrow,
  index,
  children,
  wide,
}: {
  eyebrow: string;
  index: number;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      style={{
        maxWidth: wide ? '580px' : '480px',
        width: '100%',
        padding: '2rem 2.25rem',
        borderRadius: '20px',
        background: 'color-mix(in srgb, var(--ai-surface) 80%, transparent)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--ai-border)',
        boxShadow: 'var(--ai-card-shadow)',
        pointerEvents: 'auto',
      }}
    >
      <p
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          fontSize: '0.6875rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'var(--ai-accent-dim)',
          margin: '0 0 1rem',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '22px',
            height: '22px',
            borderRadius: '999px',
            border: '1px solid var(--ai-accent-border)',
            fontSize: '0.625rem',
          }}
        >
          {index}
        </span>
        {eyebrow}
      </p>
      {children}
    </div>
  );
}

// ── Rail chevron button ───────────────────────────────────────────────────────
function Chevron({
  dir,
  onClick,
  disabled,
}: {
  dir: 'up' | 'down';
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'up' ? 'Previous section' : 'Next section'}
      style={{
        width: '22px',
        height: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? 'var(--ai-border-medium)' : 'var(--ai-fg-3)',
        transition: 'color 0.2s, opacity 0.2s',
        opacity: disabled ? 0.3 : 0.7,
        pointerEvents: 'auto',
      }}
    >
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
        {dir === 'up' ? (
          <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Story3D({
  c,
  product,
  theme,
}: {
  c: CaseStudy;
  product: Product;
  theme: 'light' | 'dark';
}) {
  const wrapRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<EngineHandle | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [active, setActive] = useState(0);
  const [heroFade, setHeroFade] = useState(1);

  const data = parseDataSection(c.datasection);

  const chapters: Chapter[] = [
    c.problem && { key: 'problem', label: 'Problem', eyebrow: 'The problem', text: c.problem },
    c.hypothesis && { key: 'hypothesis', label: 'Idea', eyebrow: 'The idea', text: c.hypothesis },
    c.approach && { key: 'approach', label: 'Build', eyebrow: 'The build', text: c.approach },
  ].filter(Boolean) as Chapter[];

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const engine = createStoryEngine(
      canvas,
      product,
      wrap,
      wrap.closest('.ai-root')?.getAttribute('data-theme') === 'dark',
      c.id,
    );
    engineRef.current = engine;

    const onScroll = () => {
      const rect = wrap.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      engine?.setProgress(p);
      // Hero overlay fades out during the first 10% of scroll
      setHeroFade(Math.max(0, 1 - p / 0.10));
      let idx = 0;
      for (let i = 0; i < RAIL_STOPS.length; i++) {
        if (p >= RAIL_STOPS[i] - 0.05) idx = i;
      }
      setActive((prev) => (prev === idx ? prev : idx));
    };
    const onPointer = (e: PointerEvent) => {
      engine?.setMouse(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1,
      );
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    onScroll();

    // Smooth scrolling for the whole story page.
    const lenis = new Lenis({ duration: 1.15 });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
      engine?.dispose();
      engineRef.current = null;
    };
  }, [product, c.id]);

  // Re-resolve the palette from CSS vars whenever the theme flips.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (wrap && engineRef.current) {
      engineRef.current.setPalette(wrap, theme === 'dark');
    }
  }, [theme]);

  const scrollToStop = (i: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const total = wrap.offsetHeight - window.innerHeight;
    const top = wrap.offsetTop + RAIL_STOPS[i] * total;
    // 1000ms eased glide between stops (chevrons + rail dots)
    if (lenisRef.current) lenisRef.current.scrollTo(top, { duration: 1.0 });
    else window.scrollTo({ top, behavior: 'smooth' });
  };

  const railLabels = ['Start', ...chapters.map((ch) => ch.label), 'Outcome'];

  const panelText: React.CSSProperties = {
    fontSize: '1.0625rem',
    color: 'var(--ai-fg-2)',
    lineHeight: 1.75,
    margin: 0,
  };

  return (
    <section
      ref={wrapRef}
      aria-label={`${c.title} — interactive 3D story`}
      style={{ position: 'relative', background: 'var(--ai-bg)' }}
    >
      <style>{`
        @keyframes ai3d-cue {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%      { transform: translateY(9px); opacity: 1; }
        }
      `}</style>

      {/* Sticky 3D backdrop */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

          {/* White-screen overlay: starts opaque, fades out on first scroll */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--ai-surface)',
              opacity: heroFade,
              pointerEvents: 'none',
              zIndex: 2,
              transition: 'opacity 0.05s linear',
            }}
          />

          {/* Vignette so the nav and following content blend into the canvas */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 3,
              pointerEvents: 'none',
              background:
                'linear-gradient(to bottom, var(--ai-bg), transparent 16%, transparent 84%, var(--ai-bg))',
              opacity: 0.85,
            }}
          />

          {/* Progress rail */}
          <nav
            aria-label="Story progress"
            style={{
              position: 'absolute',
              right: 'clamp(0.75rem, 2.5vw, 1.75rem)',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem',
              alignItems: 'center',
            }}
          >
            <Chevron
              dir="up"
              disabled={active === 0}
              onClick={() => scrollToStop(Math.max(0, active - 1))}
            />
            {railLabels.map((label, i) => (
              <button
                key={label}
                onClick={() => scrollToStop(i)}
                aria-label={`Go to ${label}`}
                title={label}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '999px',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  background: i === active ? 'var(--ai-accent)' : 'var(--ai-border-medium)',
                  boxShadow: i === active ? '0 0 10px var(--ai-accent)' : 'none',
                  transform: i === active ? 'scale(1.35)' : 'scale(1)',
                  transition: 'background 0.25s, transform 0.25s, box-shadow 0.25s',
                  pointerEvents: 'auto',
                }}
              />
            ))}
            <Chevron
              dir="down"
              disabled={active === railLabels.length - 1}
              onClick={() => scrollToStop(Math.min(railLabels.length - 1, active + 1))}
            />
          </nav>
        </div>
      </div>

      {/* Scrolling narrative */}
      <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
        {/* Hero */}
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5rem 0 3rem',
          }}
        >
          <Container style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                animation: 'ai-fade-up 0.6s ease both',
              }}
            >
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--ai-accent-dim)',
                  border: '1px solid var(--ai-accent-border)',
                  background: 'var(--ai-accent-bg)',
                  borderRadius: '999px',
                  padding: '0.25rem 0.75rem',
                }}
              >
                {PRODUCT_LABELS[product]} · 3D story
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)' }}>
                {c.author} · {c.date}
              </span>
            </div>
            <h1
              style={{
                fontSize: 'clamp(2.75rem, 9vw, 7rem)',
                fontWeight: 700,
                color: 'var(--ai-fg)',
                margin: '0 0 1.25rem',
                maxWidth: '900px',
                fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                lineHeight: 0.95,
                animation: 'ai-fade-up 0.6s 0.1s ease both',
              }}
            >
              {c.title}
            </h1>
            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.1875rem)',
                color: 'var(--ai-fg-2)',
                lineHeight: 1.65,
                margin: '0 0 3rem',
                maxWidth: '560px',
                animation: 'ai-fade-up 0.6s 0.2s ease both',
              }}
            >
              {c.introduction}
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                animation: 'ai-fade-up 0.6s 0.35s ease both',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--ai-fg-3)',
                }}
              >
                Scroll to follow the journey
              </span>
              <span
                aria-hidden
                style={{
                  fontSize: '1.25rem',
                  color: 'var(--ai-accent-dim)',
                  animation: 'ai3d-cue 1.8s ease-in-out infinite',
                }}
              >
                ↓
              </span>
            </div>
          </Container>
        </div>

        {/* Chapters */}
        {chapters.map((ch, i) => (
          <div
            key={ch.key}
            style={{
              minHeight: '130vh',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Container>
              <div style={{ display: 'flex', justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end' }}>
                <Reveal>
                  <Panel eyebrow={ch.eyebrow} index={i + 1}>
                    <p style={panelText}>{ch.text}</p>
                  </Panel>
                </Reveal>
              </div>
            </Container>
          </div>
        ))}

        {/* Outcome + metrics */}
        <div
          style={{
            minHeight: '130vh',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Container>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Reveal>
                <Panel eyebrow="The outcome" index={chapters.length + 1} wide>
                  <p style={{ ...panelText, fontSize: '1.125rem', color: 'var(--ai-fg)', fontWeight: 500 }}>
                    {c.conclusion}
                  </p>
                  {data && (data.hoursSaved != null || data.processesAutomated != null) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', marginTop: '2rem' }}>
                      {data.hoursSaved != null && (
                        <div>
                          <div
                            style={{
                              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                              fontWeight: 700,
                              color: 'var(--ai-accent-dim)',
                              lineHeight: 1,
                              fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
                              letterSpacing: '-0.02em',
                            }}
                          >
                            <CountUp target={data.hoursSaved} format={(n) => `${n.toLocaleString()}h`} />
                          </div>
                          <div
                            style={{
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              color: 'var(--ai-fg-3)',
                              marginTop: '0.375rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                            }}
                          >
                            Hours saved
                          </div>
                        </div>
                      )}
                      {data.processesAutomated != null && (
                        <div>
                          <div
                            style={{
                              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                              fontWeight: 700,
                              color: 'var(--ai-accent-dim)',
                              lineHeight: 1,
                              fontFamily: 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)',
                              letterSpacing: '-0.02em',
                            }}
                          >
                            <CountUp target={data.processesAutomated} format={(n) => `${n}×`} />
                          </div>
                          <div
                            style={{
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              color: 'var(--ai-fg-3)',
                              marginTop: '0.375rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                            }}
                          >
                            Processes
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {data?.impact && (
                    <p
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 500,
                        color: 'var(--ai-fg)',
                        lineHeight: 1.6,
                        margin: '1.75rem 0 0',
                        padding: '1rem 1.25rem',
                        background: 'var(--ai-accent-bg)',
                        border: '1px solid var(--ai-accent-border)',
                        borderLeft: '3px solid var(--ai-accent-dim)',
                        borderRadius: '12px',
                      }}
                    >
                      {data.impact}
                    </p>
                  )}
                </Panel>
              </Reveal>
            </div>
          </Container>
        </div>

        {/* Journey complete */}
        <div
          style={{
            minHeight: '45vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            textAlign: 'center',
            padding: '0 0 4rem',
          }}
        >
          <Container>
            <Reveal style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <p
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: 'var(--ai-fg-3)',
                  margin: 0,
                }}
              >
                {PRODUCT_TAGLINES[product]} — journey complete
              </p>
              <Link
                href="/experiments/ai/cases"
                style={{
                  pointerEvents: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--ai-fg)',
                  textDecoration: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '999px',
                  border: '1px solid var(--ai-border-medium)',
                  background: 'color-mix(in srgb, var(--ai-surface) 80%, transparent)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                Explore all case studies →
              </Link>
            </Reveal>
          </Container>
        </div>
      </div>
    </section>
  );
}
