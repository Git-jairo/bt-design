import type { Category, CategoryMeta, Tier } from "./types";

/**
 * The category catalogue: one row per detector, mapped to a tier per Budget
 * Thuis's AI Usage Guidelines. Order here is display order within a tier.
 */
export const CATEGORIES: CategoryMeta[] = [
  // ── MUST REMOVE ──────────────────────────────────────────────────────
  {
    key: "bsn",
    tier: "must",
    label: "BSN / tax identifiers",
    description: "Citizen service numbers and tax IDs (BSN, BTW-nummer).",
    token: "BSN",
  },
  {
    key: "iban",
    tier: "must",
    label: "IBAN / card numbers",
    description: "Bank account numbers and credit card numbers.",
    token: "FINANCIAL",
  },
  {
    key: "credential",
    tier: "must",
    label: "Credentials & secrets",
    description: "Passwords, API keys, tokens, and connection strings.",
    token: "CREDENTIAL",
  },
  {
    key: "medical_disciplinary_salary",
    tier: "must",
    label: "Medical / disciplinary / salary",
    description: "Medical, disciplinary, or salary records.",
    token: "HR_RECORD",
  },
  {
    key: "special_category",
    tier: "must",
    label: "Special category data (GDPR Art. 9)",
    description: "Health, biometric, political, or union membership data.",
    token: "SPECIAL_CATEGORY",
  },
  {
    key: "security_incident",
    tier: "must",
    label: "Security incidents / pentest content",
    description: "Active security incident or penetration test content.",
    token: "SECURITY_INCIDENT",
  },
  // ── ADVISED REMOVE ───────────────────────────────────────────────────
  {
    key: "name",
    tier: "advised",
    label: "Names",
    description: "Personal names.",
    token: "NAME",
  },
  {
    key: "email",
    tier: "advised",
    label: "Email addresses",
    description: "Email addresses.",
    token: "EMAIL",
  },
  {
    key: "phone",
    tier: "advised",
    label: "Phone numbers",
    description: "Phone numbers.",
    token: "PHONE",
  },
  {
    key: "address",
    tier: "advised",
    label: "Home addresses",
    description: "Street addresses and Dutch postcodes.",
    token: "ADDRESS",
  },
  {
    key: "customer_id",
    tier: "advised",
    label: "Customer / employee IDs",
    description: "Customer numbers and employee/personnel numbers.",
    token: "ID",
  },
  // ── CAN HAVE ─────────────────────────────────────────────────────────
  {
    key: "job_title",
    tier: "canhave",
    label: "Job titles",
    description: "Job titles and functions.",
    token: "JOB_TITLE",
  },
  {
    key: "company",
    tier: "canhave",
    label: "Company names",
    description: "Company and organisation names.",
    token: "COMPANY",
  },
  {
    key: "date",
    tier: "canhave",
    label: "Dates",
    description: "Calendar dates.",
    token: "DATE",
  },
];

export const CATEGORY_META: Record<Category, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
) as Record<Category, CategoryMeta>;

export const TIER_LABEL: Record<Tier, string> = {
  must: "Must remove",
  advised: "Advised remove",
  canhave: "Can have",
};

export function tokenFor(category: Category): string {
  return `[REMOVED:${CATEGORY_META[category].token}]`;
}
