// ── Remote source swap ────────────────────────────────────────────────────────
// Change BASE_URL to point at a remote endpoint and both loaders follow suit.
// Empty string resolves to local /public/data/*.csv served by Next.js.
export const BASE_URL = '';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Skill {
  id: string;
  title: string;
  description: string;
  category: string;
  role: string;
  expertise: string;
  claudeEnterpriseLink: string;
  feedbackUrl: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  author: string;
  date: string;
  introduction: string;
  problem: string;
  hypothesis: string;
  approach: string;
  conclusion: string;
  datasection: string;
  imageUrl: string;
  problemImage: string;
  approachImage: string;
  outcomeImage: string;
  templateVariant: string;
}

export interface DataSection {
  hoursSaved?: number;
  processesAutomated?: number;
  impact?: string;
}

// ── CSV parser ────────────────────────────────────────────────────────────────
// Handles quoted fields (including embedded commas, newlines, and escaped "").

function parseCSV(raw: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let q = false;

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (q) {
      if (c === '"' && raw[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        q = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        q = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n' || (c === '\r' && raw[i + 1] !== '\n')) {
        row.push(field);
        field = '';
        if (row.some((f) => f.trim())) rows.push(row);
        row = [];
      } else if (c !== '\r') {
        field += c;
      }
    }
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);

  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((f) => f.trim()))
    .map((r) =>
      headers.reduce(
        (o, h, i) => ({ ...o, [h]: (r[i] ?? '').trim() }),
        {} as Record<string, string>,
      ),
    );
}

// ── Loaders ───────────────────────────────────────────────────────────────────

export async function loadSkills(): Promise<Skill[]> {
  const res = await fetch(`${BASE_URL}/data/skills.csv`);
  if (!res.ok) throw new Error(`Failed to load skills: ${res.status}`);
  const rows = parseCSV(await res.text());
  return rows.map((r) => ({
    id: r['id'] ?? '',
    title: r['title'] ?? '',
    description: r['description'] ?? '',
    category: r['category'] ?? '',
    role: r['role'] ?? '',
    expertise: r['expertise'] ?? '',
    claudeEnterpriseLink: r['claudeEnterpriseLink'] ?? '',
    feedbackUrl: r['feedbackUrl'] ?? '',
  }));
}

export async function loadCases(): Promise<CaseStudy[]> {
  const res = await fetch(`${BASE_URL}/data/cases.csv`);
  if (!res.ok) throw new Error(`Failed to load cases: ${res.status}`);
  const rows = parseCSV(await res.text());
  return rows.map((r) => ({
    id: r['id'] ?? '',
    title: r['title'] ?? '',
    author: r['author'] ?? '',
    date: r['date'] ?? '',
    introduction: r['introduction'] ?? '',
    problem: r['problem'] ?? '',
    hypothesis: r['hypothesis'] ?? '',
    approach: r['approach'] ?? '',
    conclusion: r['conclusion'] ?? '',
    datasection: r['datasection'] ?? '',
    imageUrl: r['imageUrl'] ?? '',
    problemImage: r['problemImage'] ?? '',
    approachImage: r['approachImage'] ?? '',
    outcomeImage: r['outcomeImage'] ?? '',
    templateVariant: r['templateVariant'] ?? '',
  }));
}

export function parseDataSection(raw: string): DataSection | null {
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw) as DataSection;
  } catch {
    return null;
  }
}
