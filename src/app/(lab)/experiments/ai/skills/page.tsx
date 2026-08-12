'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Icon } from '@/design-system/components/Icon';
import { useAiTheme } from '../theme';
import { AiNav } from '../AiNav';
import { loadSkills } from '../loader';
import type { Skill } from '../loader';

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

const EXPERTISE_ORDER = ['Beginner', 'Intermediate', 'Advanced'];

function FilterPill({
  label,
  active,
  onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        fontSize: '0.8125rem',
        fontWeight: active ? 700 : 500,
        color: active ? 'var(--ai-fg)' : 'var(--ai-fg-2)',
        background: active ? 'var(--ai-surface)' : 'none',
        border: `1px solid ${active ? 'var(--ai-border-medium)' : 'var(--ai-border)'}`,
        borderRadius: '999px',
        padding: '0.375rem 0.875rem',
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

function SkillCard({ skill }: { skill: Skill }) {
  const color = categoryColor(skill.category);
  return (
    <Link
      href={`/experiments/ai/skills/${skill.id.toLowerCase()}`}
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
          padding: '0.2rem 0.6rem',
        }}>
          {skill.category}
        </span>
        <span style={{ fontSize: '0.6875rem', color: 'var(--ai-fg-3)', fontWeight: 500 }}>#{skill.id}</span>
      </div>
      <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ai-fg)', margin: 0, lineHeight: 1.25 }}>
        {skill.title}
      </p>
      <p style={{ fontSize: '0.875rem', color: 'var(--ai-fg-2)', lineHeight: 1.6, margin: 0, flex: 1 }}>
        {skill.description}
      </p>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--ai-border)',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'var(--ai-fg-3)',
            background: 'var(--ai-surface-muted)',
            borderRadius: '999px',
            padding: '0.15rem 0.5rem',
          }}>
            {skill.expertise}
          </span>
          <span style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'var(--ai-fg-3)',
            background: 'var(--ai-surface-muted)',
            borderRadius: '999px',
            padding: '0.15rem 0.5rem',
          }}>
            {skill.role}
          </span>
        </div>
        <Icon name="basic-navigation/ChevronRight" size={14} />
      </div>
    </Link>
  );
}

export default function SkillsPage() {
  const { theme, toggle } = useAiTheme();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterExpertise, setFilterExpertise] = useState('');

  useEffect(() => {
    document.title = 'AI Skills — BudgetThuis.Design';
    loadSkills()
      .then(setSkills)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const departments = useMemo(() => Array.from(new Set(skills.map((s) => s.category))).sort(), [skills]);
  const roles = useMemo(() => Array.from(new Set(skills.map((s) => s.role))).sort(), [skills]);

  const filtered = useMemo(() => {
    return skills.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
      const matchesDept = !filterDept || s.category === filterDept;
      const matchesRole = !filterRole || s.role === filterRole;
      const matchesExpertise = !filterExpertise || s.expertise === filterExpertise;
      return matchesSearch && matchesDept && matchesRole && matchesExpertise;
    });
  }, [skills, search, filterDept, filterRole, filterExpertise]);

  const hasActiveFilter = filterDept || filterRole || filterExpertise || search;

  return (
    <div
      className="ai-root"
      data-theme={theme}
      style={{ minHeight: '100vh', background: 'var(--ai-bg)', fontFamily: 'var(--font-helix-body, Inter, system-ui, sans-serif)', color: 'var(--ai-fg)' }}
    >
      <AiNav theme={theme} toggle={toggle} backHref="/experiments/ai" backLabel="AI Accelerator" />

      <main id="main-content">
        {/* Header */}
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
              AI Skills
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--ai-fg-2)', margin: 0, maxWidth: '480px', lineHeight: 1.6 }}>
              Ready-to-use AI skills for every team. Click through to open directly in Claude Enterprise.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ borderBottom: '1px solid var(--ai-border)', background: 'var(--ai-bg)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem' }}>
            {/* Search */}
            <div role="search" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Icon name="iconographic-navigation/Search" size={16} />
              <input
                type="search"
                placeholder="Search skills…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search skills"
                style={{
                  flex: 1,
                  maxWidth: '360px',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--ai-border)',
                  background: 'var(--ai-surface)',
                  color: 'var(--ai-fg)',
                  fontSize: '0.9375rem',
                  outline: 'none',
                }}
              />
              {hasActiveFilter && (
                <button
                  onClick={() => { setSearch(''); setFilterDept(''); setFilterRole(''); setFilterExpertise(''); }}
                  style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Icon name="basic-navigation/Close" size={14} />
                  Clear
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
              {/* Department */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ai-fg-3)' }}>Dept</span>
                <FilterPill label="All" active={!filterDept} onClick={() => setFilterDept('')} />
                {departments.map((d) => (
                  <FilterPill key={d} label={d} active={filterDept === d} onClick={() => setFilterDept(filterDept === d ? '' : d)} />
                ))}
              </div>

              {/* Role */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ai-fg-3)' }}>Role</span>
                <FilterPill label="All" active={!filterRole} onClick={() => setFilterRole('')} />
                {roles.map((r) => (
                  <FilterPill key={r} label={r} active={filterRole === r} onClick={() => setFilterRole(filterRole === r ? '' : r)} />
                ))}
              </div>

              {/* Expertise */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ai-fg-3)' }}>Level</span>
                <FilterPill label="All" active={!filterExpertise} onClick={() => setFilterExpertise('')} />
                {EXPERTISE_ORDER.map((e) => (
                  <FilterPill key={e} label={e} active={filterExpertise === e} onClick={() => setFilterExpertise(filterExpertise === e ? '' : e)} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <p role="status" style={{ fontSize: '0.8125rem', color: 'var(--ai-fg-3)', margin: '0 0 1.25rem' }}>
            {loading ? 'Loading…' : `${filtered.length} skill${filtered.length !== 1 ? 's' : ''}`}
            {hasActiveFilter && !loading ? ' matching filters' : ''}
          </p>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: '220px', borderRadius: '16px', background: 'linear-gradient(90deg, var(--ai-surface) 25%, var(--ai-surface-muted) 50%, var(--ai-surface) 75%)', backgroundSize: '200% auto', animation: 'ai-shimmer 1.5s linear infinite' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '4rem 0', textAlign: 'center' }}>
              <Icon name="iconographic-navigation/Search" size={32} />
              <p style={{ fontSize: '1rem', color: 'var(--ai-fg-2)', marginTop: '1rem' }}>No skills match your filters.</p>
              <button onClick={() => { setSearch(''); setFilterDept(''); setFilterRole(''); setFilterExpertise(''); }} style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--ai-accent-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {filtered.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
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
