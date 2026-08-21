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
    label: "BSN",
    description: "Dutch citizen service numbers.",
    token: "BSN",
  },
  {
    key: "tax_id",
    tier: "must",
    label: "Tax identifiers",
    description: "BTW-nummer and other tax IDs.",
    token: "TAX_ID",
  },
  {
    key: "iban",
    tier: "must",
    label: "IBAN",
    description: "Bank account numbers.",
    token: "IBAN",
  },
  {
    key: "credit_card",
    tier: "must",
    label: "Credit card numbers",
    description: "Credit and debit card numbers.",
    token: "CREDIT_CARD",
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
    description: "Street addresses and Dutch postcodes (city is a separate, can-have field).",
    token: "ADDRESS",
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
  {
    key: "customer_id",
    tier: "canhave",
    label: "Customer / employee IDs",
    description: "Customer numbers and employee/personnel numbers.",
    token: "ID",
  },
  {
    key: "city",
    tier: "canhave",
    label: "Cities",
    description: "City or place names — a low-confidence signal, kept separate from street addresses.",
    token: "CITY",
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
