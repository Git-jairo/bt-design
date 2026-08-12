'use client';

import { useEffect, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { Icon } from '@/design-system/components/Icon';
import type { IconName } from '@/design-system/components/Icon';
import { useAiTheme } from '../theme';
import { AiNav } from '../AiNav';

// ── Analytics (noop without GA) ───────────────────────────────────────────────
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
declare global { interface Window { gtag?: (...args: unknown[]) => void; } }
function track(event: string, params?: Record<string, string | number>) {
  if (!GA_ID || typeof window === 'undefined') return;
  window.gtag?.('event', event, { ...params, send_to: GA_ID });
}

// ── Shared style atoms ────────────────────────────────────────────────────────
const SHELL: CSSProperties = { maxWidth: '1120px', margin: '0 auto', padding: '0 1.5rem' };
const DISPLAY = 'var(--font-helix-display, "Budget Greet Narrow", Arial Black, sans-serif)';

function Eyebrow({ icon, children }: { icon?: IconName; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
      {icon && <Icon name={icon} size={16} />}
      <p style={{
        fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.14em', color: 'var(--ai-accent-dim)', margin: 0,
      }}>
        {children}
      </p>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 style={{
      fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, color: 'var(--ai-fg)',
      margin: 0, fontFamily: DISPLAY, textTransform: 'uppercase',
      letterSpacing: '-0.01em', lineHeight: 1.05,
    }}>
      {children}
    </h2>
  );
}

function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background: 'var(--ai-surface)', border: '1px solid var(--ai-border)',
      borderRadius: '18px', padding: '1.5rem', ...style,
    }}>
      {children}
    </div>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
      <span style={{
        marginTop: '0.5rem', width: '5px', height: '5px', borderRadius: '999px',
        background: 'var(--ai-accent)', flexShrink: 0,
      }} />
      <span style={{ fontSize: '0.9rem', color: 'var(--ai-fg-2)', lineHeight: 1.55 }}>{children}</span>
    </li>
  );
}

// ── Platform pillar ───────────────────────────────────────────────────────────
interface Platform {
  layer: string;
  role: string;
  name: string;
  icon: IconName;
  blurb: string;
  points: string[];
}
const PLATFORMS: Platform[] = [
  {
    layer: '01',
    role: 'Source of truth',
    name: 'Claude',
    icon: 'general/Brain',
    blurb: 'Where organisation skills are built, governed and versioned.',
    points: [
      'Skills authored & owned by the CoE',
      'Governed for quality and effectiveness',
      'Stored and versioned in the Claude org skillset',
    ],
  },
  {
    layer: '02',
    role: 'Discovery hub',
    name: 'BudgetThuis.AI',
    icon: 'general/Globe',
    blurb: "The CoE's window into everything AI — discover, learn, share.",
    points: [
      'Searchable skill index + a page per skill',
      'Case showcase & champions network',
      'CoE news, guidance and — later — a safe playground',
    ],
  },
  {
    layer: '03',
    role: 'Home',
    name: 'SharePoint',
    icon: 'buildling/Office',
    blurb: 'Hosting so the hub lives inside the BudgetNet intranet.',
    points: [
      'Reachable from within BudgetNet',
      'Integrated with how people already work',
      'Hosting feasibility — action for Jairo to validate',
    ],
  },
];

function PlatformPillar({ p }: { p: Platform }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: DISPLAY, fontSize: '1.75rem', fontWeight: 700,
          color: 'var(--ai-accent-border)', lineHeight: 1,
        }}>
          {p.layer}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'var(--ai-accent-bg)', border: '1px solid var(--ai-accent-border)',
          color: 'var(--ai-accent-dim)',
        }}>
          <Icon name={p.icon} size={22} />
        </span>
      </div>
      <div>
        <p style={{
          fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: 'var(--ai-fg-3)', margin: '0 0 0.35rem',
        }}>
          {p.role}
        </p>
        <h3 style={{
          fontSize: '1.5rem', fontWeight: 700, color: 'var(--ai-fg)', margin: 0,
          fontFamily: DISPLAY, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1,
        }}>
          {p.name}
        </h3>
      </div>
      <p style={{ fontSize: '0.9rem', color: 'var(--ai-fg-2)', lineHeight: 1.55, margin: 0 }}>
        {p.blurb}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 'auto 0 0', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {p.points.map((pt) => <Bullet key={pt}>{pt}</Bullet>)}
      </ul>
    </Card>
  );
}

// ── Skills loop steps ─────────────────────────────────────────────────────────
interface Step { n: string; icon: IconName; title: string; body: string; }
const SKILL_STEPS: Step[] = [
  { n: '1', icon: 'shield/Check', title: 'CoE governs', body: 'The Center of Excellence authors and approves each skill for quality and effectiveness.' },
  { n: '2', icon: 'file/FileCheck', title: 'Versioned in Claude', body: 'The skill is stored and versioned in the Claude organisation skillset — the single source of truth.' },
  { n: '3', icon: 'general/Globe', title: 'Page on BudgetThuis.AI', body: 'Each skill gets a page — what it does, who it’s for — discoverable through a searchable index.' },
  { n: '4', icon: 'iconographic-navigation/ExternalLink', title: 'Linked to the source', body: 'The page links straight to the skill in the internal Claude org-skill database.' },
  { n: '5', icon: 'chat/BubbleThumbsUp', title: 'Feedback on every output', body: 'A Mopinion feedback button sits under every output from a governed skill.' },
  { n: '6', icon: 'general/Infinite', title: 'Back to the CoE', body: 'That feedback flows straight back to the CoE — a constant loop that keeps skills sharp.' },
];

function LoopStep({ s, last }: { s: Step; last: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '38px', height: '38px', borderRadius: '999px', flexShrink: 0,
          background: 'var(--ai-accent-bg)', border: '1px solid var(--ai-accent-border)',
          color: 'var(--ai-accent-dim)',
        }}>
          <Icon name={s.icon} size={18} />
        </span>
        {!last && <span style={{ flex: 1, width: '2px', background: 'var(--ai-border)', marginTop: '0.25rem' }} />}
      </div>
      <div style={{ paddingBottom: last ? 0 : '1.5rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ai-fg)', margin: '0.3rem 0 0.3rem' }}>
          <span style={{ color: 'var(--ai-fg-3)', marginRight: '0.5rem' }}>{s.n}</span>{s.title}
        </h4>
        <p style={{ fontSize: '0.875rem', color: 'var(--ai-fg-2)', lineHeight: 1.55, margin: 0 }}>{s.body}</p>
      </div>
    </div>
  );
}

// ── Case pipeline ─────────────────────────────────────────────────────────────
const PIPELINE: Step[] = [
  { n: '1', icon: 'file/FileGraph', title: "Anouk's spreadsheet", body: 'A simple CSV / spreadsheet is the CMS — anyone can add a story, championed by our network.' },
  { n: '2', icon: 'chat/Ai', title: 'Agent runs twice a week', body: 'An agent retrieves the file and converts every row into a polished, coded case page.' },
  { n: '3', icon: 'general/Article', title: 'Published with an index', body: 'Cases land in a modern, sleek showcase with a searchable index in front of it.' },
];

// ── Champions (illustrative organogram) ───────────────────────────────────────
interface Champion { initials: string; team: string; expertise: string; goal: string; }
const CHAMPIONS: Champion[] = [
  { initials: 'KCC', team: 'Customer Contact', expertise: 'Prompt design · email triage', goal: 'Cut repeat contacts with sharper intent detection.' },
  { initials: 'FIN', team: 'Finance', expertise: 'Spreadsheet automation', goal: 'Close the month two days faster.' },
  { initials: 'LEG', team: 'Legal & Procurement', expertise: 'Contract review', goal: 'First-pass review on every supplier contract.' },
  { initials: 'CX', team: 'Product & CX', expertise: 'Research synthesis', goal: 'Turn raw feedback into themes in minutes.' },
];

function ChampionCard({ c }: { c: Champion }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '46px', height: '46px', borderRadius: '999px', flexShrink: 0,
          background: 'var(--ai-surface-inverted)', color: 'var(--ai-fg-inverse)',
          fontFamily: DISPLAY, fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.02em',
        }}>
          {c.initials}
        </span>
        <div>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ai-fg)', margin: 0 }}>{c.team}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--ai-fg-3)', margin: 0 }}>Champion</p>
        </div>
      </div>
      <p style={{
        fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--ai-accent-dim)', margin: 0,
      }}>
        {c.expertise}
      </p>
      <p style={{ fontSize: '0.875rem', color: 'var(--ai-fg-2)', lineHeight: 1.55, margin: 0 }}>{c.goal}</p>
    </Card>
  );
}

// ── CoE content types ─────────────────────────────────────────────────────────
const CONTENT: { icon: IconName; title: string; body: string }[] = [
  { icon: 'feedback/LoudSpeaker', title: 'News', body: 'Org updates, rollouts and milestones from the CoE.' },
  { icon: 'shield/Check', title: 'Guidelines', body: 'How to use AI safely and well — the rules of the road.' },
  { icon: 'general/Article', title: 'Articles', body: 'Deeper write-ups, teardowns and lessons learned.' },
  { icon: 'general/Brain', title: 'Inspiration', body: 'Sparks, ideas and what good looks like elsewhere.' },
];

// ── Open questions / decisions ────────────────────────────────────────────────
interface Decision { icon: IconName; tag: string; title: string; body: string; owner: string; }
const DECISIONS: Decision[] = [
  {
    icon: 'general/Lock',
    tag: 'Security model',
    title: 'How do we keep it safe?',
    body: 'Three routes: commit to never adding sensitive data and own that responsibility, add password protection, or wire up SSO. The platform is designed to stay detached from customer & privacy data either way.',
    owner: 'CoE to decide',
  },
  {
    icon: 'buildling/Office',
    tag: 'Hosting',
    title: 'Can this live in SharePoint?',
    body: 'We still need to confirm whether this vibecoded platform can run and be discovered inside the BudgetNet / SharePoint environment.',
    owner: 'Action · Jairo',
  },
];

function DecisionCard({ d }: { d: Decision }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderColor: 'var(--ai-border-medium)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
          background: 'var(--ai-surface-muted)', color: 'var(--ai-fg-2)',
        }}>
          <Icon name={d.icon} size={18} />
        </span>
        <span style={{
          fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: 'var(--ai-fg-3)',
        }}>
          {d.tag}
        </span>
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ai-fg)', margin: 0, lineHeight: 1.25 }}>{d.title}</h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--ai-fg-2)', lineHeight: 1.6, margin: 0, flex: 1 }}>{d.body}</p>
      <span style={{
        alignSelf: 'flex-start', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ai-accent-dim)',
        background: 'var(--ai-accent-bg)', border: '1px solid var(--ai-accent-border)',
        borderRadius: '999px', padding: '0.25rem 0.7rem',
      }}>
        {d.owner}
      </span>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProposalPage() {
  const { theme, toggle } = useAiTheme();

  useEffect(() => {
    document.title = 'Blueprint — AI Accelerator · BudgetThuis.Design';
    track('page_view', { page: 'ai_proposal' });
  }, []);

  return (
    <div
      className="ai-root"
      data-theme={theme}
      style={{
        minHeight: '100vh', background: 'var(--ai-bg)', color: 'var(--ai-fg)',
        fontFamily: 'var(--font-helix-body, Inter, system-ui, sans-serif)',
      }}
    >
      <AiNav theme={theme} toggle={toggle} backHref="/experiments/ai" backLabel="AI Accelerator" />

      <main id="main-content">
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section style={{ position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden style={{
            position: 'absolute', top: '-10%', right: '-5%', width: '460px', height: '460px',
            borderRadius: '999px', background: 'var(--ai-blob-1)', filter: 'blur(90px)',
            animation: 'ai-blob-drift 14s ease-in-out infinite',
          }} />
          <div aria-hidden style={{
            position: 'absolute', top: '20%', left: '-8%', width: '380px', height: '380px',
            borderRadius: '999px', background: 'var(--ai-blob-2)', filter: 'blur(90px)',
            animation: 'ai-blob-drift-b 18s ease-in-out infinite',
          }} />
          <div style={{ ...SHELL, position: 'relative', padding: 'clamp(3rem, 8vw, 6rem) 1.5rem clamp(2.5rem, 5vw, 4rem)' }}>
            <div style={{ animation: 'ai-fade-up 0.4s ease both' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
                color: 'var(--ai-accent-dim)', background: 'var(--ai-accent-bg)',
                border: '1px solid var(--ai-accent-border)', borderRadius: '999px', padding: '0.3rem 0.8rem',
                marginBottom: '1.25rem',
              }}>
                AI CoE · Blueprint · Draft proposal
              </span>
            </div>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 700, margin: '0 0 1.25rem',
              lineHeight: 0.95, letterSpacing: '-0.02em', fontFamily: DISPLAY,
              textTransform: 'uppercase', color: 'var(--ai-fg)', maxWidth: '14ch',
              animation: 'ai-fade-up 0.4s 0.08s ease both', animationFillMode: 'backwards',
            }}>
              One system,<br />three platforms
            </h1>
            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--ai-fg-2)', maxWidth: '620px',
              lineHeight: 1.6, margin: 0,
              animation: 'ai-fade-up 0.4s 0.16s ease both', animationFillMode: 'backwards',
            }}>
              How knowledge sharing and AI skills flow at Budget Thuis — skills governed in
              Claude, discovered on BudgetThuis.AI, hosted inside SharePoint. One feedback loop
              keeps it all sharp.
            </p>
          </div>
        </section>

        {/* ── Three platforms ────────────────────────────────────────────── */}
        <section style={{ borderTop: '1px solid var(--ai-border)' }}>
          <div style={{ ...SHELL, padding: 'clamp(2.5rem, 5vw, 4rem) 1.5rem' }}>
            <Eyebrow icon="general/Map">The architecture</Eyebrow>
            <SectionTitle>Three platforms, one system</SectionTitle>
            <p style={{ fontSize: '1rem', color: 'var(--ai-fg-2)', lineHeight: 1.6, margin: '0.75rem 0 2rem', maxWidth: '640px' }}>
              Each platform owns one layer. Skills are born and governed in Claude, surface for
              discovery on BudgetThuis.AI, and the whole hub lives where people already work.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {PLATFORMS.map((p) => <PlatformPillar key={p.name} p={p} />)}
            </div>
          </div>
        </section>

        {/* ── Skills loop ────────────────────────────────────────────────── */}
        <section style={{ borderTop: '1px solid var(--ai-border)', background: 'var(--ai-bg-alt)' }}>
          <div style={{ ...SHELL, padding: 'clamp(2.5rem, 5vw, 4rem) 1.5rem' }}>
            <Eyebrow icon="general/Infinite">The skills loop</Eyebrow>
            <SectionTitle>Governed once, improved forever</SectionTitle>
            <p style={{ fontSize: '1rem', color: 'var(--ai-fg-2)', lineHeight: 1.6, margin: '0.75rem 0 2rem', maxWidth: '640px' }}>
              Every organisation skill follows the same path — from CoE governance to a page
              people can find, all the way back to the CoE through a feedback button on every output.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 2.5rem' }}>
              <div>
                {SKILL_STEPS.slice(0, 3).map((s) => <LoopStep key={s.n} s={s} last={false} />)}
              </div>
              <div>
                {SKILL_STEPS.slice(3).map((s, i) => <LoopStep key={s.n} s={s} last={i === SKILL_STEPS.slice(3).length - 1} />)}
              </div>
            </div>
            <Card style={{
              marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center',
              background: 'var(--ai-metric-bg)', borderColor: 'var(--ai-metric-border)',
            }}>
              <span style={{ color: 'var(--ai-accent-dim)', flexShrink: 0 }}><Icon name="chat/BubbleThumbsUp" size={24} /></span>
              <p style={{ fontSize: '0.9rem', color: 'var(--ai-fg-2)', lineHeight: 1.55, margin: 0 }}>
                <strong style={{ color: 'var(--ai-fg)' }}>The feedback button is always there.</strong>{' '}
                A Mopinion form sits at the bottom of every output a Budget Thuis–governed skill
                produces — so the CoE hears from real use, continuously.
              </p>
            </Card>
          </div>
        </section>

        {/* ── Case pipeline ──────────────────────────────────────────────── */}
        <section style={{ borderTop: '1px solid var(--ai-border)' }}>
          <div style={{ ...SHELL, padding: 'clamp(2.5rem, 5vw, 4rem) 1.5rem' }}>
            <Eyebrow icon="general/Presentation">The case pipeline</Eyebrow>
            <SectionTitle>Stories that write themselves</SectionTitle>
            <p style={{ fontSize: '1rem', color: 'var(--ai-fg-2)', lineHeight: 1.6, margin: '0.75rem 0 2rem', maxWidth: '640px' }}>
              A spreadsheet is the back-end. An agent does the heavy lifting twice a week, turning
              rows into an inspiring, modern showcase.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {PIPELINE.map((s) => (
                <Card key={s.n} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: 'var(--ai-accent-bg)', border: '1px solid var(--ai-accent-border)',
                      color: 'var(--ai-accent-dim)',
                    }}>
                      <Icon name={s.icon} size={20} />
                    </span>
                    <span style={{ fontFamily: DISPLAY, fontSize: '1.5rem', fontWeight: 700, color: 'var(--ai-accent-border)' }}>
                      0{s.n}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ai-fg)', margin: 0 }}>{s.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--ai-fg-2)', lineHeight: 1.55, margin: 0 }}>{s.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── Champions ──────────────────────────────────────────────────── */}
        <section style={{ borderTop: '1px solid var(--ai-border)', background: 'var(--ai-bg-alt)' }}>
          <div style={{ ...SHELL, padding: 'clamp(2.5rem, 5vw, 4rem) 1.5rem' }}>
            <Eyebrow icon="achievement/Medal">The champions network</Eyebrow>
            <SectionTitle>An organogram of expertise</SectionTitle>
            <p style={{ fontSize: '1rem', color: 'var(--ai-fg-2)', lineHeight: 1.6, margin: '0.75rem 0 2rem', maxWidth: '640px' }}>
              Cases are mostly led by our champions — though everyone can add. Each champion gets a
              page: their cases, their AI goals and their expertise, mapping who knows what across
              the organisation. <span style={{ color: 'var(--ai-fg-3)' }}>(Illustrative.)</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {CHAMPIONS.map((c) => <ChampionCard key={c.initials} c={c} />)}
            </div>
          </div>
        </section>

        {/* ── CoE content ────────────────────────────────────────────────── */}
        <section style={{ borderTop: '1px solid var(--ai-border)' }}>
          <div style={{ ...SHELL, padding: 'clamp(2.5rem, 5vw, 4rem) 1.5rem' }}>
            <Eyebrow icon="feedback/LoudSpeaker">From the CoE</Eyebrow>
            <SectionTitle>News, guidance & inspiration</SectionTitle>
            <p style={{ fontSize: '1rem', color: 'var(--ai-fg-2)', lineHeight: 1.6, margin: '0.75rem 0 2rem', maxWidth: '640px' }}>
              The hub is also where the CoE publishes — from the rules of the road to the sparks
              that get people going. Endless possibilities.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {CONTENT.map((c) => (
                <Card key={c.title} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <span style={{ color: 'var(--ai-accent-dim)' }}><Icon name={c.icon} size={22} /></span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ai-fg)', margin: 0 }}>{c.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ai-fg-2)', lineHeight: 1.55, margin: 0 }}>{c.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bigger picture ─────────────────────────────────────────────── */}
        <section style={{ borderTop: '1px solid var(--ai-border)', background: 'var(--ai-bg-alt)' }}>
          <div style={{ ...SHELL, padding: 'clamp(2.5rem, 5vw, 4rem) 1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
              <div>
                <Eyebrow icon="general/Atom">Where this goes</Eyebrow>
                <SectionTitle>A safe AI playground</SectionTitle>
                <p style={{ fontSize: '1rem', color: 'var(--ai-fg-2)', lineHeight: 1.65, margin: '0.75rem 0 0' }}>
                  This is the starting point. Over time, BudgetThuis.AI can also host internally
                  built and vibecoded tools — a safe space, fully detached from our systems, with
                  one rule: keep customer and privacy data out.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { icon: 'general/Atom' as IconName, t: 'Host vibecoded tools', b: 'Internal tools live alongside skills and cases.' },
                  { icon: 'shield/Locked' as IconName, t: 'Detached by design', b: 'No connection to production or customer systems.' },
                  { icon: 'social-sustainability/Care' as IconName, t: 'Privacy first', b: 'Customer & sensitive data never touch the platform.' },
                ].map((x) => (
                  <Card key={x.t} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', padding: '1.1rem 1.25rem' }}>
                    <span style={{ color: 'var(--ai-accent-dim)', flexShrink: 0, marginTop: '0.1rem' }}><Icon name={x.icon} size={20} /></span>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ai-fg)', margin: '0 0 0.2rem' }}>{x.t}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--ai-fg-2)', lineHeight: 1.5, margin: 0 }}>{x.b}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Open questions ─────────────────────────────────────────────── */}
        <section style={{ borderTop: '1px solid var(--ai-border)' }}>
          <div style={{ ...SHELL, padding: 'clamp(2.5rem, 5vw, 4rem) 1.5rem' }}>
            <Eyebrow icon="feedback/QuestionMark">Still to figure out</Eyebrow>
            <SectionTitle>Open questions & next actions</SectionTitle>
            <p style={{ fontSize: '1rem', color: 'var(--ai-fg-2)', lineHeight: 1.6, margin: '0.75rem 0 2rem', maxWidth: '640px' }}>
              Two things to decide before we commit. Honest unknowns, with owners.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {DECISIONS.map((d) => <DecisionCard key={d.tag} d={d} />)}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--ai-border)' }}>
        <div style={{
          ...SHELL, padding: '2rem 1.5rem', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
        }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)', margin: 0 }}>
            Blueprint · AI CoE · Budget Thuis
          </p>
          <nav aria-label="Footer navigation" style={{ display: 'flex', gap: '1.25rem' }}>
            <Link href="/experiments/ai" style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)', textDecoration: 'none' }}>Hub</Link>
            <Link href="/experiments/ai/skills" style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)', textDecoration: 'none' }}>Skills</Link>
            <Link href="/experiments/ai/cases" style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)', textDecoration: 'none' }}>Cases</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
